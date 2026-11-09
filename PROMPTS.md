# Kopi Academy: prompts for Claude Code

Run the prompts in order. CLAUDE.md holds all the rules and specs, so the prompts stay short.
Order: 1 → 2 → 3 for the first block → 4 for the first block → 5 (polish) → then 3 and 4 for each next block.
Do this for **Wed 11 – Fri 13 Nov** first, so Wednesday's lessons are ready in time.

---

## 0. Setup (you do this once)
1. Unzip this folder to e.g. `~/code/kopi-academy`. Run `git init`, then create a **public** GitHub repo called `kopi-academy` and push. Pages on a free account needs a public repo.
2. In the repo on GitHub, go to Settings → Pages → Source and pick **GitHub Actions**.
3. Export your Canvas token in the shell you start Claude Code from: `export CANVAS_TOKEN=...`. Never put it in a file in this repo.
4. Add ElevenLabs to Claude Code: `claude mcp add --transport http elevenlabs https://api.elevenlabs.io/v1/mcp`. Then open `/mcp` inside Claude Code and log in. Check that the `creative_*` tools show up. If login doesn't work, check ElevenLabs' MCP docs for how to pass your API key.
5. Optional: GreenSock publishes official GSAP skills for AI coding tools at github.com/greensock/gsap-skills. Copy them into `.claude/skills/` if you want Claude Code to use GSAP the way GreenSock intends.
6. Start Claude Code in the folder: `claude`.

---

## 1. Course pack (no credits)
```
Read CLAUDE.md fully, then build the Phase 1 course pack.

1. Use the vu-canvas skill (token from $CANVAS_TOKEN). Download into private/canvas/ everything Phase 1 needs:
   - Python (course 91119): weeks 1–4 lecture notebooks and pdfs, practical sheets and their solutions, the exam cheat sheet, and the past exams.
   - Intelligent Systems (course 90372): the syllabus, lecture slides 1–7, working group sheets 1–4 with solutions, earlier first partials with solutions, and the practical assignment info pages.
2. For each topic in the Phase 1 lessons, write private/notes/<track>-<topic>.md. Cover what the exam expects, typical question types, common traps, and the notation the course uses. Name the source file for each point.
3. Write private/graded-work.md. List every graded task (Codegrade From Scratch 3.1–5.2, Python Assignment 1, IS assignments 2–3) with a one-line summary of each, so the lessons can avoid them.
4. Write content/curriculum.json (lesson ids, track, course week, titles, objectives, exam topic, graded tasks to avoid; no dates) and content/schedule/2026-p2.json (lesson id to suggested date, plus the exam dates).

When you're done, show me the curriculum and the graded-work list. Don't build the site yet.
```

---

## 2. Site shell + first lesson (no credits)
```
Build the site from the Site spec in CLAUDE.md. "Feel" and "Look" come first: it has to feel great to use and must not look AI-made.

Requirements:
- Astro + MDX + React islands
- GSAP for motion, with reduced-motion fallbacks
- Phosphor icons (never Lucide or Feather), and no emojis anywhere
- dithering as the visual motif, including dithered skeleton loaders and the "code loading" state for notebooks
- kopi palette, light and dark mode
- WCAG 2.2 AA

Make py-00 the first real lesson, using seed/py-00/python_functions_practice.ipynb:
- Make it timeless: remove the dates, the deadline line, the "Saturday review" lines and every emoji. Make check() print PASS/FAIL.
- Upgrade it to the Notebook spec, with hidden progressive <details> hints. Keep all the tests.
- Write the quiz, the exam-corner question and the takeaways.
- Don't use the seed video. py-00 gets a new video in step 4.

For every other Phase 1 lesson, create placeholder pages from content/curriculum.json so the path map is complete.

Set up GitHub Actions:
- site build
- JupyterLite build under /lab/
- axe-core + Playwright accessibility tests (fail the build on any A/AA violation)
- video size budget check
- deploy to Pages

Then push. Do the Quality bar checks from CLAUDE.md, including the phone and laptop walkthrough screenshots, and fix what you find.

Give me the live URL and the screenshots.
```

---

## 3. Lessons for one block of days (no credits)
Replace `<BLOCK>` with one block at a time. These are the 2026 schedule blocks:
- `py-01–py-03 and is-04–is-06` (Wed 11 – Fri 13 Nov)
- `py-04–py-08 and is-01, is-02, is-03, is-07, is-08` (Mon 16 – Fri 20 Nov)
- `py-09–py-11 and is-09` (Mon 23 – Wed 25 Nov)
```
Write the lessons for <BLOCK>, following the Lesson format and Notebook spec in CLAUDE.md:
- lesson text
- warm-up questions
- quiz
- practice notebook with progressive hidden hints
- exam-corner question
- takeaways and the trap of the day

Base each lesson on private/notes. Check private/graded-work.md first so nothing mirrors graded work.

Keep everything timeless and not personal: no dates, deadlines or names, and no emojis.

Verify every notebook: the stubs FAIL cleanly, and the solutions PASS all tests.

Also write each lesson's video script to private/video-work/<id>/script.json:
- 3–5 chapters
- under 3,800 characters in total
- follow the Singlish script rules in the explainer-video skill
- follow the Video spec overrides in CLAUDE.md (no names, no dates, no deadlines)

Don't generate any audio yet.

Push, then list what you made, with the script length in characters for each lesson.
```

---

## 4. Videos for that block (uses credits)
On the first run, add py-00 to the block.
```
Make the videos for <BLOCK> from their script.json files. Use the explainer-video skill with the overrides in CLAUDE.md:
- 3–5 chapters, 1 take per chapter
- Kopi Gao voice, eleven_v4
- no emojis, no names, no dates
- 720p web copy, poster and transcript
- at most 2 videos in parallel

Log the credits for each video in private/credits.md. Stop and ask me if Phase 1 would go over 90k.

Check frames of every final video, then add the videos to their lessons and push.
```

---

## 5. Polish pass (after the first block is live)
```
Do a polish pass on the live site as if you were a picky student using it every day. Go through two full lessons (one from each track) on a 390 px phone viewport and on a laptop, with screenshots.

1. Fix anything that feels slow, cramped, confusing, inconsistent or generic.
2. Tune the GSAP timings and the dither loaders.
3. Recheck WCAG 2.2 AA (axe plus a keyboard-only pass, reduced motion and dark mode).
4. Check that no emojis or Lucide/Feather icons slipped in, and that no lesson mentions dates, deadlines or names.

Show me before and after screenshots of the biggest improvements.
```

---

## 6. Later: Phase 2 (after the midterms)
```
Start Phase 2. Add a Phase 2 lesson plan to CLAUDE.md (one lesson per track per weekday) and extend content/schedule/2026-p2.json:
- Python: course weeks 5–7 (OOP, inheritance, reading files, exceptions), plus final-exam prep and mock days. 2026 final: Mon 14 Dec 08:30. Graded work to avoid: Codegrade 5.1–7.2 and Assignment 2.
- Intelligent Systems: lectures 8–13 (knowledge representation, uncertainty and probabilities, Bayesian networks, machine learning 1–4), plus partial-B prep. 2026 exam: Fri 18 Dec 15:30. Graded work to avoid: IS assignments 4–5.

Then run the course-pack, lessons and videos steps for Phase 2. The credit budget is whatever is left in private/credits.md.

If credits are left over at the end, add the missing early lessons (Python weeks 1–2, IS week 1 basics) so the course is complete for next year's students.
```
