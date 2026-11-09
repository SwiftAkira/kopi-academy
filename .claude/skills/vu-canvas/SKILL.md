---
name: "vu-canvas"
description: "Read Orion's VU Amsterdam Canvas (canvas.vu.nl) through the Canvas API. Use whenever he asks about his VU courses, Canvas groups, assignments, deadlines, to-dos, announcements, grades, course pages, modules or files, or when a VU timetable question needs his Canvas group (e.g. which practical or seminar slot is his). Read-only."
---

# VU Canvas (read-only)

This skill gives you API access to Orion's Canvas account at https://canvas.vu.nl, like a connector.

## Hard rule: read only

Only read. Never create, edit, submit, post, message, delete or mark anything in Canvas, even if asked. The bundled script only sends GET requests. Do not write your own POST/PUT/DELETE calls with the token. If he wants something changed in Canvas, tell him to do it in the Canvas app himself.

## Token

The token comes from the `CANVAS_TOKEN` environment variable (the script reads it first). Never write it to token.txt or any other file in this repo, since the repo is public. If `CANVAS_TOKEN` is not set, ask Orion to export it before starting Claude Code.

The token is a secret. Never print it, paste it into a reply, commit it, or send it anywhere except `canvas.vu.nl`.

## How to run

The script lives next to this file: `<skill-dir>/scripts/canvas.py`, where `<skill-dir>` is the folder this SKILL.md was loaded from. If you are unsure of the path, run:

```bash
find / -path '*vu-canvas/scripts/canvas.py' 2>/dev/null | head -1
```

Python 3 standard library only, no installs. Output is JSON. Example:

```bash
python3 <skill-dir>/scripts/canvas.py courses
```

Wherever a command takes a `course`, you can pass the numeric course id or part of the name or code ("python", "intelligent systems", "XB_0031"). If several match, the newest term wins and the others are listed on stderr.

## Commands

| Command | What it returns |
|---|---|
| `me` | His Canvas profile (sanity check) |
| `courses [--all]` | Active courses; `--all` adds past ones |
| `groups [--members]` | His Canvas groups with course. Group names often hold his slot, e.g. "15:30 - NU-2B05 - Noor" |
| `todo` | Canvas to-do list (assignments needing submission) |
| `upcoming` | Upcoming events and assignments |
| `assignments COURSE [--bucket upcoming\|overdue\|unsubmitted\|past…] [--desc]` | Assignments with due dates and his submission state |
| `assignment COURSE ID` | One assignment in full, including description |
| `announcements [COURSE…] [--days 14] [--chars 1200]` | Recent announcements, all active courses if none given |
| `calendar [COURSE…] [--start YYYY-MM-DD] [--end YYYY-MM-DD]` | Canvas calendar events and assignment due dates (default next 14 days) |
| `modules COURSE` | Modules and their items |
| `pages COURSE` / `page COURSE PAGE_URL` | Course wiki pages; `page` returns the body as text |
| `files COURSE [--search TERM]` | Course files, newest first |
| `download FILE_ID [--out DIR]` | Downloads a file, prints the saved path. Use the scratchpad or working dir, then read or send it |
| `submissions COURSE` | His scores and grades per assignment |
| `get PATH [key=value …] [--one]` | Raw GET of any `/api/v1` path for anything not covered above |

## Tips

- Start with `courses` or `groups` if you don't know the course ids yet.
- Timestamps are UTC. Convert to Europe/Amsterdam before telling him times.
- Some course content lives in pages or modules rather than announcements. Check `modules` when he asks "what do we need to do this week".
- For his class schedule, the VU timetable feed in Google Calendar is the source for times and rooms. Canvas groups tell you which of the parallel slots is his.
- Errors: HTTP 401 means the token expired or was revoked, so ask him for a new one (Canvas → Account → Settings → New access token). Once the new one works, propose an update to the Token section of this SKILL.md with propose_skills so the new token is used in future sessions too. A network error means this session can't reach canvas.vu.nl; say so and don't retry with other tools.