#!/usr/bin/env python3
"""Read-only client for VU Amsterdam Canvas (canvas.vu.nl).

Only ever sends GET requests. There is no code path that writes to Canvas.

Token lookup order:
  1. CANVAS_TOKEN environment variable
  2. token.txt in the skill folder (one level above this script)

Usage: python3 canvas.py <command> [args]   (run with no args for help)
"""
import argparse
import html
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

BASE = os.environ.get("CANVAS_BASE", "https://canvas.vu.nl").rstrip("/")
SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_token():
    tok = os.environ.get("CANVAS_TOKEN", "").strip()
    if tok:
        return tok
    path = os.path.join(SKILL_DIR, "token.txt")
    if os.path.exists(path):
        with open(path) as f:
            tok = f.read().strip()
        if tok and not tok.startswith("PASTE"):
            return tok
    sys.exit("No Canvas token found. Put it in token.txt in the skill folder or set CANVAS_TOKEN.")


TOKEN = None


def _req(url):
    r = urllib.request.Request(url, method="GET")
    r.add_header("Authorization", f"Bearer {TOKEN}")
    r.add_header("Accept", "application/json")
    return r


def get(path, params=None, paginate=True, limit=500):
    """GET a Canvas API path. Follows Link-header pagination."""
    if path.startswith("http"):
        url = path
    else:
        if not path.startswith("/api/"):
            path = "/api/v1/" + path.lstrip("/")
        url = BASE + path
    q = []
    for k, v in (params or {}).items():
        if isinstance(v, (list, tuple)):
            q += [(k, str(x)) for x in v]
        elif v is not None:
            q.append((k, str(v)))
    if paginate and not any(k == "per_page" for k, _ in q):
        q.append(("per_page", "100"))
    if q:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(q)

    out = []
    while url:
        try:
            with urllib.request.urlopen(_req(url), timeout=30) as resp:
                body = resp.read().decode("utf-8")
                link = resp.headers.get("Link", "")
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")[:300]
            sys.exit(f"Canvas returned HTTP {e.code} for {url.split('?')[0]}: {msg}")
        except urllib.error.URLError as e:
            sys.exit(f"Could not reach Canvas ({e.reason}). The network may block canvas.vu.nl here.")
        data = json.loads(body) if body.strip() else None
        if not isinstance(data, list):
            return data
        out += data
        if not paginate or len(out) >= limit:
            break
        m = re.search(r'<([^>]+)>;\s*rel="next"', link)
        url = m.group(1) if m else None
    return out


def strip_html(s, maxlen=None):
    if not s:
        return ""
    s = re.sub(r"(?is)<(script|style).*?</\1>", "", s)
    s = re.sub(r"(?i)<br\s*/?>|</p>|</li>|</h\d>|</div>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n\n", s).strip()
    if maxlen and len(s) > maxlen:
        s = s[:maxlen] + " …"
    return s


def pick(d, keys):
    return {k: d.get(k) for k in keys if d.get(k) not in (None, "", [])}


def emit(obj):
    print(json.dumps(obj, ensure_ascii=False, indent=1))


# ---------- course resolution ----------

_courses_cache = None


def all_courses(include_past=False):
    global _courses_cache
    if _courses_cache is None:
        _courses_cache = get("courses", {
            "include[]": ["term"],
            "state[]": ["available", "completed"],
        })
    cs = _courses_cache
    if not include_past:
        cs = [c for c in cs if c.get("workflow_state") == "available"]
    return cs


def resolve_course(ref):
    """Accept a numeric id, or a name / course code fragment."""
    if str(ref).isdigit():
        return int(ref)
    ref_l = ref.lower()
    hits = [c for c in all_courses(include_past=True)
            if ref_l in (c.get("name") or "").lower()
            or ref_l in (c.get("course_code") or "").lower()]
    if not hits:
        sys.exit(f"No course matches '{ref}'. Run `courses --all` to see names and ids.")
    if len(hits) > 1:
        # prefer most recent term
        hits.sort(key=lambda c: (c.get("term") or {}).get("start_at") or "", reverse=True)
        names = [f"{c['id']}: {c.get('name')}" for c in hits[:6]]
        print(f"# '{ref}' matched {len(hits)} courses, using the newest. Others: {names[1:]}", file=sys.stderr)
    return hits[0]["id"]


# ---------- commands ----------

def cmd_me(a):
    emit(pick(get("users/self", paginate=False), ["id", "name", "short_name", "login_id", "primary_email"]))


def cmd_courses(a):
    rows = []
    for c in all_courses(include_past=a.all):
        rows.append({
            "id": c["id"], "name": c.get("name"), "code": c.get("course_code"),
            "term": (c.get("term") or {}).get("name"), "state": c.get("workflow_state"),
        })
    emit(rows)


def cmd_groups(a):
    rows = []
    for g in get("users/self/groups", {"include[]": ["users"]} if a.members else None):
        r = {"id": g["id"], "name": g.get("name"), "course_id": g.get("course_id"),
             "category": (g.get("group_category_id"))}
        if a.members:
            r["members"] = [u.get("name") for u in g.get("users", [])]
        rows.append(r)
    names = {c["id"]: c.get("name") for c in all_courses(include_past=True)}
    for r in rows:
        r["course"] = names.get(r.get("course_id"))
    emit(rows)


def cmd_todo(a):
    rows = []
    for t in get("users/self/todo"):
        asg = t.get("assignment") or t.get("quiz") or {}
        rows.append({
            "type": t.get("type"), "course_id": t.get("course_id"),
            "title": asg.get("name") or asg.get("title"),
            "due_at": asg.get("due_at"), "url": t.get("html_url"),
        })
    emit(rows)


def cmd_upcoming(a):
    rows = []
    for e in get("users/self/upcoming_events"):
        rows.append(pick(e, ["title", "start_at", "end_at", "location_name", "context_name", "type", "html_url"]))
    emit(rows)


def cmd_assignments(a):
    cid = resolve_course(a.course)
    params = {"order_by": "due_at", "include[]": ["submission"]}
    if a.bucket:
        params["bucket"] = a.bucket
    rows = []
    for x in get(f"courses/{cid}/assignments", params):
        sub = x.get("submission") or {}
        r = pick(x, ["id", "name", "due_at", "lock_at", "points_possible", "html_url"])
        r["submitted"] = sub.get("workflow_state")
        if sub.get("score") is not None:
            r["score"] = sub.get("score")
        if a.desc:
            r["description"] = strip_html(x.get("description"), 1500)
        rows.append(r)
    emit(rows)


def cmd_assignment(a):
    cid = resolve_course(a.course)
    x = get(f"courses/{cid}/assignments/{a.id}", {"include[]": ["submission"]}, paginate=False)
    r = pick(x, ["id", "name", "due_at", "lock_at", "unlock_at", "points_possible",
                 "submission_types", "html_url"])
    r["description"] = strip_html(x.get("description"))
    sub = x.get("submission") or {}
    r["submission"] = pick(sub, ["workflow_state", "submitted_at", "score", "grade", "late"])
    emit(r)


def cmd_announcements(a):
    if a.course:
        ids = [resolve_course(c) for c in a.course]
    else:
        ids = [c["id"] for c in all_courses()]
    start = (datetime.now(timezone.utc) - timedelta(days=a.days)).date().isoformat()
    rows = []
    for x in get("announcements", {"context_codes[]": [f"course_{i}" for i in ids], "start_date": start}):
        rows.append({
            "course": x.get("context_code"), "title": x.get("title"),
            "posted_at": x.get("posted_at"), "author": (x.get("author") or {}).get("display_name"),
            "message": strip_html(x.get("message"), a.chars),
        })
    emit(rows)


def cmd_calendar(a):
    ids = [resolve_course(c) for c in a.course] if a.course else [c["id"] for c in all_courses()]
    ctx = ["user_self"] + [f"course_{i}" for i in ids]
    rows = []
    for typ in ("event", "assignment"):
        # Canvas allows max 10 context codes per request
        for i in range(0, len(ctx), 10):
            for e in get("calendar_events", {
                "type": typ, "context_codes[]": ctx[i:i + 10],
                "start_date": a.start, "end_date": a.end,
            }):
                rows.append(pick(e, ["title", "start_at", "end_at", "location_name",
                                     "context_name", "type", "html_url"]))
    rows.sort(key=lambda r: r.get("start_at") or "")
    emit(rows)


def cmd_modules(a):
    cid = resolve_course(a.course)
    rows = []
    for m in get(f"courses/{cid}/modules", {"include[]": ["items"]}):
        rows.append({
            "id": m["id"], "name": m.get("name"),
            "items": [pick(i, ["title", "type", "content_id", "page_url", "html_url"])
                      for i in m.get("items", [])],
        })
    emit(rows)


def cmd_pages(a):
    cid = resolve_course(a.course)
    emit([pick(p, ["url", "title", "updated_at"]) for p in get(f"courses/{cid}/pages", {"sort": "title"})])


def cmd_page(a):
    cid = resolve_course(a.course)
    p = get(f"courses/{cid}/pages/{urllib.parse.quote(a.page_url)}", paginate=False)
    emit({"title": p.get("title"), "updated_at": p.get("updated_at"), "body": strip_html(p.get("body"))})


def cmd_files(a):
    cid = resolve_course(a.course)
    params = {"sort": "updated_at", "order": "desc"}
    if a.search:
        params["search_term"] = a.search
    emit([pick(f, ["id", "display_name", "size", "updated_at", "content-type"])
          for f in get(f"courses/{cid}/files", params)])


def cmd_download(a):
    meta = get(f"files/{a.file_id}", paginate=False)
    name = meta.get("display_name") or f"file_{a.file_id}"
    os.makedirs(a.out, exist_ok=True)
    dest = os.path.join(a.out, os.path.basename(name))
    url = meta.get("url")
    if not url:
        sys.exit("This file has no download URL (it may be locked).")
    try:
        with urllib.request.urlopen(_req(url), timeout=120) as resp, open(dest, "wb") as f:
            while True:
                chunk = resp.read(1 << 16)
                if not chunk:
                    break
                f.write(chunk)
    except urllib.error.URLError as e:
        sys.exit(f"Download failed ({getattr(e, 'reason', e)}). The file host may be blocked here.")
    print(dest)


def cmd_submissions(a):
    cid = resolve_course(a.course)
    rows = []
    for s in get(f"courses/{cid}/students/submissions",
                 {"student_ids[]": ["self"], "include[]": ["assignment"]}):
        asg = s.get("assignment") or {}
        rows.append({"assignment": asg.get("name"), "due_at": asg.get("due_at"),
                     "state": s.get("workflow_state"), "score": s.get("score"),
                     "grade": s.get("grade"), "points_possible": asg.get("points_possible"),
                     "late": s.get("late")})
    emit(rows)


def cmd_get(a):
    params = {}
    for kv in a.params:
        k, _, v = kv.partition("=")
        params.setdefault(k, [])
        params[k].append(v)
    params = {k: (v if len(v) > 1 or k.endswith("[]") else v[0]) for k, v in params.items()}
    emit(get(a.path, params, paginate=not a.one))


def main():
    global TOKEN
    p = argparse.ArgumentParser(description="Read-only VU Canvas client")
    sp = p.add_subparsers(dest="cmd", required=True)

    sp.add_parser("me")
    s = sp.add_parser("courses"); s.add_argument("--all", action="store_true", help="include past courses")
    s = sp.add_parser("groups"); s.add_argument("--members", action="store_true")
    sp.add_parser("todo")
    sp.add_parser("upcoming")
    s = sp.add_parser("assignments"); s.add_argument("course")
    s.add_argument("--bucket", choices=["past", "overdue", "undated", "ungraded", "unsubmitted", "upcoming", "future"])
    s.add_argument("--desc", action="store_true", help="include descriptions")
    s = sp.add_parser("assignment"); s.add_argument("course"); s.add_argument("id")
    s = sp.add_parser("announcements"); s.add_argument("course", nargs="*")
    s.add_argument("--days", type=int, default=14); s.add_argument("--chars", type=int, default=1200)
    s = sp.add_parser("calendar"); s.add_argument("course", nargs="*")
    s.add_argument("--start", default=datetime.now().date().isoformat())
    s.add_argument("--end", default=(datetime.now() + timedelta(days=14)).date().isoformat())
    s = sp.add_parser("modules"); s.add_argument("course")
    s = sp.add_parser("pages"); s.add_argument("course")
    s = sp.add_parser("page"); s.add_argument("course"); s.add_argument("page_url")
    s = sp.add_parser("files"); s.add_argument("course"); s.add_argument("--search")
    s = sp.add_parser("download"); s.add_argument("file_id"); s.add_argument("--out", default=".")
    s = sp.add_parser("submissions"); s.add_argument("course")
    s = sp.add_parser("get", help="raw GET of any /api/v1 path")
    s.add_argument("path"); s.add_argument("params", nargs="*", help="key=value")
    s.add_argument("--one", action="store_true", help="no pagination")

    a = p.parse_args()
    TOKEN = load_token()
    globals()["cmd_" + a.cmd](a)


if __name__ == "__main__":
    main()
