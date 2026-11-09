#!/usr/bin/env python3
"""Verify every practice notebook before it is committed.

    .venv/bin/python scripts/verify_notebooks.py            # all lessons
    .venv/bin/python scripts/verify_notebooks.py py-01 is-04  # some lessons
    .venv/bin/python scripts/verify_notebooks.py --build      # rebuild from practice.py first

For each content/<track>/<id>/practice.ipynb it checks:
  1. Structure: standard first cell and helper, folded hints with a blank line after
     </summary>, a mistakes list at the end, standard library only, no emojis, nothing time-bound.
  2. As shipped: the notebook runs headless without crashing. Test cells print FAIL (never PASS
     for a whole cell, never a traceback). Predict cells print exactly what their answer says,
     and cells that crash on purpose raise the error they announce.
  3. With solutions: the code from each "Show solution" block is put into its stub cell and the
     notebook runs again. Now every test must print PASS.
Exit code 1 if anything is off. A notebook whose solutions fail must never ship.
"""
from __future__ import annotations

import copy
import glob
import os
import re
import subprocess
import sys

import nbformat
from nbclient import NotebookClient

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

STDLIB_OK = set(sys.stdlib_module_names)
EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-➿⭐⭕️‍]")
TIME_BOUND = re.compile(
    r"(?i)\b(deadline|due date|homework|tomorrow|yesterday|this week|next week|last week|"
    r"monday|tuesday|wednesday|thursday|friday|saturday|sunday|"
    r"january|february|march|april|june|july|august|september|october|november|december|"
    r"20[2-9]\d|canvas|codegrade|\bTA\b)\b"
)
SOLUTION = re.compile(r"<details><summary>Show solution</summary>\s*```python\n(.*?)\n```\s*</details>", re.S)


def kopi(cell) -> dict:
    return cell.get("metadata", {}).get("kopi", {})


def text_of(cell) -> str:
    return cell.source if isinstance(cell.source, str) else "".join(cell.source)


def stdout_of(cell) -> str:
    return "".join(o.get("text", "") for o in cell.get("outputs", []) if o.get("output_type") == "stream" and o.get("name") == "stdout")


def error_of(cell) -> str | None:
    for o in cell.get("outputs", []):
        if o.get("output_type") == "error":
            return o.get("ename")
    return None


def structure(nb, problems: list[str]) -> None:
    cells = nb.cells
    if not cells or kopi(cells[0]).get("role") != "intro":
        problems.append("first cell is not the standard intro")
    else:
        first = text_of(cells[0])
        for needed in ("**Time:**", "How to use this notebook"):
            if needed not in first:
                problems.append(f"intro cell misses {needed!r}")
    if len(cells) < 2 or kopi(cells[1]).get("role") != "helper" or "def check(" not in text_of(cells[1]):
        problems.append("second cell is not the check() helper")
    if kopi(cells[-1]).get("role") != "mistakes" or "Mistakes list" not in text_of(cells[-1]):
        problems.append("last cell is not the mistakes list")

    for i, cell in enumerate(cells):
        src = text_of(cell)
        if EMOJI.search(src):
            problems.append(f"cell {i}: emoji or pictograph found")
        hit = TIME_BOUND.search(src)
        if hit:
            problems.append(f"cell {i}: time-bound or personal wording {hit.group(0)!r}")
        if cell.cell_type == "markdown":
            for m in re.finditer(r"</summary>(.?.?)", src, re.S):
                if m.group(1) != "\n\n":
                    problems.append(f"cell {i}: no blank line after </summary>")
            if src.count("<details>") != src.count("</details>"):
                problems.append(f"cell {i}: unbalanced <details>")
        else:
            for m in re.finditer(r"^\s*(?:import|from)\s+([A-Za-z_][\w]*)", src, re.M):
                if m.group(1) not in STDLIB_OK:
                    problems.append(f"cell {i}: imports {m.group(1)!r}, which is not in the standard library")

    exercises = {kopi(c).get("exercise") for c in cells if kopi(c).get("exercise")}
    core = {kopi(c).get("exercise") for c in cells if kopi(c).get("role") in ("stub", "predict", "paper") and kopi(c).get("core", True)}
    if not 4 <= len(core) <= 6:
        problems.append(f"{len(core)} core exercises (the spec asks for 4 to 6)")
    for ex in exercises:
        if not any(kopi(c).get("role") == "hints" and kopi(c).get("exercise") == ex for c in cells):
            problems.append(f"exercise {ex}: no folded hints or answer")


def run(nb):
    nb = copy.deepcopy(nb)
    NotebookClient(nb, timeout=60, kernel_name="python3", allow_errors=True).execute()
    return nb


def check_run(nb, solved: bool, problems: list[str]) -> None:
    tag = "with solutions" if solved else "as shipped"
    for i, cell in enumerate(nb.cells):
        if cell.cell_type != "code":
            continue
        meta = kopi(cell)
        role, ex = meta.get("role"), meta.get("exercise")
        err, out = error_of(cell), stdout_of(cell)
        if role == "predict":
            want_err = meta.get("expect_error")
            if want_err:
                if err != want_err:
                    problems.append(f"[{tag}] exercise {ex}: expected {want_err}, got {err or 'no error'}")
            else:
                if err:
                    problems.append(f"[{tag}] exercise {ex}: predict cell crashed with {err}")
                elif out != meta.get("expect_output"):
                    problems.append(f"[{tag}] exercise {ex}: prints {out!r}, but the answer says {meta.get('expect_output')!r}")
            continue
        if role == "test":
            lines = [ln for ln in out.splitlines() if ln.strip()]
            if err:
                problems.append(f"[{tag}] exercise {ex}: test cell crashed with {err} (tests must never crash)")
            elif not any(ln.startswith(("PASS", "FAIL")) for ln in lines):
                problems.append(f"[{tag}] exercise {ex}: test cell printed no PASS/FAIL line: {out[:120]!r}")
            elif solved and any(not ln.startswith(("PASS", "FAIL")) for ln in lines):
                problems.append(f"[{tag}] exercise {ex}: solved test cell printed stray output: {out[:120]!r}")
            elif solved and any(ln.startswith("FAIL") for ln in lines):
                bad = next(ln for ln in lines if ln.startswith("FAIL"))
                problems.append(f"[{tag}] exercise {ex}: solution does not pass: {bad}")
            elif not solved and not any(ln.startswith("FAIL") for ln in lines):
                problems.append(f"[{tag}] exercise {ex}: every test passes before the student has done anything")
            continue
        if err and not (role == "stub" and not solved and meta.get("stub_may_crash")):
            problems.append(f"[{tag}] cell {i} ({role}, exercise {ex}): crashed with {err}")


def inject(nb, problems: list[str]):
    nb = copy.deepcopy(nb)
    solutions: dict[str, str] = {}
    for cell in nb.cells:
        if kopi(cell).get("role") == "hints":
            m = SOLUTION.search(text_of(cell))
            if m:
                solutions[kopi(cell)["exercise"]] = m.group(1)
    for cell in nb.cells:
        if kopi(cell).get("role") == "stub":
            ex = kopi(cell).get("exercise")
            if ex not in solutions:
                problems.append(f"exercise {ex}: no 'Show solution' block to inject")
            else:
                cell.source = solutions[ex]
    return nb


def verify(path: str) -> list[str]:
    problems: list[str] = []
    nb = nbformat.read(path, as_version=4)
    structure(nb, problems)
    check_run(run(nb), False, problems)
    check_run(run(inject(nb, problems)), True, problems)
    return problems


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    build = "--build" in sys.argv
    paths = sorted(glob.glob(os.path.join(ROOT, "content", "*", "*", "practice.ipynb")))
    if build:
        for src in sorted(glob.glob(os.path.join(ROOT, "content", "*", "*", "practice.py"))):
            if args and os.path.basename(os.path.dirname(src)) not in args:
                continue
            env = dict(os.environ, PYTHONPATH=os.path.join(ROOT, "scripts"))
            subprocess.run([sys.executable, src], check=True, env=env, cwd=os.path.dirname(src))
        paths = sorted(glob.glob(os.path.join(ROOT, "content", "*", "*", "practice.ipynb")))
    if args:
        paths = [p for p in paths if os.path.basename(os.path.dirname(p)) in args]
    if not paths:
        print("No notebooks found.")
        return 1
    failed = 0
    for path in paths:
        lesson = os.path.basename(os.path.dirname(path))
        problems = verify(path)
        if problems:
            failed += 1
            print(f"FAIL  {lesson}")
            for p in problems:
                print(f"      - {p}")
        else:
            print(f"PASS  {lesson}: stubs fail cleanly, solutions pass")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
