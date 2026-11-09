# Kopi Academy: guided exam prep for VU AI courses

## What this is
A guided course site in the style of Duolingo or Brilliant, for two first-year VU Amsterdam BSc AI courses:
- **Introduction to Python Programming for AI** (XB_0145, Canvas course 91119)
- **Intelligent Systems** (XB_0031, Canvas course 90372)

There are two tracks with one small lesson per course every weekday. Each lesson takes about 25–30 minutes and runs in this order:

warm-up → short video → quick quiz → practice notebook with hidden hints → one exam-style question → done.

Keep it light and doable, never massive. The site is static and hosted on GitHub Pages.

**Audience:** any student taking these courses. That's me, my classmates and next year's students. The content is made for the class, not for me personally (see the "Timeless" rule below).

**The most important thing:** it has to feel great to use. People will study with it every day, so it must be fast, calm and satisfying, with zero friction.

## Phases
- **Phase 1 (now):** everything up to the first midterms.
  - Intelligent Systems partial exam A: Mon 23 Nov 2026, 12:15
  - Python midterm: Thu 26 Nov 2026, 15:30
- **Phase 2 (later, separate prompt):** everything up to the finals.
  - Python final: Mon 14 Dec 2026, 08:30
  - Intelligent Systems partial exam B: Fri 18 Dec 2026, 15:30

These dates belong only in the schedule file (see the "Timeless" rule below), never in lesson content.

## Hard rules
1. **The site is public.** GitHub Pages sites are public, so:
   - Only original content goes on the site. Don't copy VU slides, readers, practical sheets, past exams or their solutions onto it, not even partly. Read them privately for scope and question style, then write your own explanations, examples and questions.
   - Every Canvas download goes in `private/`, which is gitignored. Never commit it.
   - No personal data on the site: no names, student numbers, VUnetIDs, emails, Canvas group names or TA names.
   - Put `<meta name="robots" content="noindex">` on every page.
   - The footer says it's an unofficial study site made by a student and not affiliated with VU.
2. **No graded work.** The VU Python course bans AI on graded work. Never solve, outline or closely mirror a graded task. Graded tasks include:
   - Python Codegrade "From Scratch" tasks (practicals 3.1–7.2)
   - Python Assignments 1 and 2
   - IS practical assignments 2–5 (the Schnaptience search notebook, the Schnapsen engine bots, and so on)

   Before you write exercises for a topic, read the matching practical sheet or assignment in `private/` and make sure your exercises are clearly different: different problem, data and function names. When in doubt, pick another example. `private/graded-work.md` lists all of them.
3. **Timeless and not personal.** Lesson text, quizzes, notebooks and videos must never mention:
   - dates, weekdays, "this week" or "tomorrow"
   - deadlines, homework or which assignment is due
   - Canvas groups or TAs
   - my name, or anyone's name

   Refer to course weeks and topics instead, for example "week 3: functions and lists". Talk to "you", a student in this course. Dates live only in `content/schedule/2026-p2.json` (see the Site spec), so next year only that file has to change.
4. **No emojis anywhere.** That covers the UI, lesson text, quizzes, notebooks, video graphics and alt text. Use proper icons (see "Icons") or plain words instead.
5. **Secrets.** The Canvas token lives only in the `CANVAS_TOKEN` environment variable. Never print it, write it to a file or commit it. Treat ElevenLabs and GitHub credentials the same way.
6. **Canvas is read-only.** Use only the GET commands of the vu-canvas skill.
7. **ElevenLabs credits.** I have about 220k credits for both phases.
   - Phase 1 budget: **90k**.
   - Use **1 take per chapter**, not the skill's default of 2.
   - Keep each video script under **3,800 characters** in total, which is about 4k credits.
   - Log the credits for every video in `private/credits.md`. Stop and ask me before going over budget.

## Tools and sources
- **Canvas:** the skill at `.claude/skills/vu-canvas`. The token comes from `$CANVAS_TOKEN`. Run the script with `python3 .claude/skills/vu-canvas/scripts/canvas.py <command>`.
- **Videos:** the skill at `.claude/skills/explainer-video`, with the overrides under *Video spec* below. It calls the ElevenLabs MCP tools (`creative_*`).
- **My personal study plan** is in `docs/phase1-study-plan.md`. Use it only for scheduling context, so the 2026 schedule fits around it. It's private context and never appears on the site.

## Exam scope for Phase 1
### Intelligent Systems: partial exam A
Covers course weeks 1–4, lectures 1–7.
- **Week 1:** sets, graphs, trees and state spaces. Uninformed search: BFS, DFS, DFID (iterative deepening), uniform cost. Compare them on completeness, optimality, and time and space complexity.
- **Week 2:** informed search (heuristics, admissible vs consistent, greedy best-first, A* with f = g + h). Adversarial search (minimax and alpha-beta pruning, worked by hand).
- **Week 3:** logic. Syntax vs semantics vs calculus, interpretations, models, satisfiable/valid/unsatisfiable, entailment, truth tables. CNF conversion. DPLL by hand; the DPLL pseudocode gets asked as a fill-in question.
- **Week 4:** rule-based reasoning (modus ponens, and-elimination, De Morgan, forward reasoning) and knowledge graphs (RDF triples). Lecture 8 is not part of partial A.

The exam is digital and lasts 2h15. Working group sheets 1–4 and earlier first partials are on Canvas. Read them privately for question style only.

### Python: midterm
Covers course weeks 1–4:
- variables, expressions and types
- conditionals
- while and for loops
- functions
- lists and strings
- dictionaries
- tuples and sets
- comprehensions

The course uses **type hints** in all its examples, so follow that. According to the syllabus, the exam is "more like the practicals" and has from-scratch questions. The textbook is Think Python. Lecture notebooks are in the Canvas modules.

## Phase 1 lessons
Lessons are keyed by topic and course week. The 2026 date column only goes into `content/schedule/2026-p2.json`. The path map shows lessons in course order, and the Today card uses the schedule.

### Python track
| id | course week | topic | 2026 date |
|---|---|---|---|
| py-00 | 3 | Functions: def, parameters vs arguments, return vs print, None, local scope | Mon 9 Nov |
| py-01 | 3 | Lists basics: indexing, negative indexes, slicing, len, in, append/insert/pop/remove | Wed 11 Nov |
| py-02 | 3 | Looping over lists: for x in lst, range(len()), enumerate. Accumulator patterns: sum, count, max, filter into a new list | Thu 12 Nov |
| py-03 | 3 | Mutability: aliasing vs copying, functions that change a list vs return a new one, nested lists | Fri 13 Nov |
| py-04 | 4 | Dictionaries basics: keys/values, get, in, items(), adding and updating | Mon 16 Nov |
| py-05 | 4 | Dictionary patterns: counting, grouping (dict of lists), inverting, dicts plus functions | Tue 17 Nov |
| py-06 | 4 | Tuples and sets: immutability, unpacking, set operations, when to use which | Wed 18 Nov |
| py-07 | 3–4 | Strings: slicing again, split/join/strip/replace/lower, looping over characters, f-strings | Thu 19 Nov |
| py-08 | 4 | Comprehensions: list and dict comprehensions, with if | Fri 20 Nov |
| py-09 | review 1–2 | Light review of conditionals and loops (while vs for, break, nested loops), about 15 min | Mon 23 Nov |
| py-10 | midterm prep | From-scratch drill: functions + lists + dicts mixed, in exam style | Tue 24 Nov |
| py-11 | midterm prep | Mini mock (45 min, practical-style) plus a review of your mistakes | Wed 25 Nov |

`seed/py-00/` has a notebook and a 10-minute video that I made for myself. That video mentions dates and deadlines, so don't use it on the site. Make a new 3–5 min video for py-00 like all the others, and strip the notebook of anything time-bound.

### Intelligent Systems track
| id | course week | topic | 2026 date |
|---|---|---|---|
| is-01 | 1 | Search 1: state spaces and uninformed search (BFS/DFS/DFID/UCS) with a properties table | Mon 16 Nov |
| is-02 | 2 | Search 2: heuristics, admissible/consistent, greedy vs A*, traced by hand | Tue 17 Nov |
| is-03 | 2 | Adversarial search: minimax and alpha-beta by hand. Generic game trees only, never the Schnapsen bot. | Thu 19 Nov |
| is-04 | 3 | Logic 1: syntax vs semantics, interpretations, models, satisfiable/valid, entailment, truth tables | Wed 11 Nov |
| is-05 | 3 | Logic 2: CNF conversion step by step | Thu 12 Nov |
| is-06 | 3 | Logic 3: DPLL by hand, and the pseudocode learned by heart | Fri 13 Nov |
| is-07 | 4 | Rule-based reasoning and knowledge graphs | Wed 18 Nov |
| is-08 | midterm prep | Mixed exam drill: a mini mock across all topics, plus exam strategy | Fri 20 Nov |
| is-09 | midterm prep | Exam-morning warm-up: a 10-question quiz only. No video, no notebook. | Mon 23 Nov |

That's 20 videos in total (py-00 to py-11 and is-01 to is-08), about 80k credits.

## Lesson format
Each lesson lives in its own folder: `content/<track>/<id>/`.
- **Front matter:** id, track, course week, title, minutes, 2–3 objectives written as "you can…" (each tied to an exam topic), and the graded tasks to avoid (internal field, never shown on the site). No dates.
- **Warm-up:** 3 spaced-repetition questions, picked automatically from earlier lessons' quiz banks. Questions the user got wrong come first.
- **Video:** `video.mp4` (720p web copy), `poster.jpg` and `transcript.md`.
- **Quiz:** `quiz.json` with 3–4 questions (multiple choice, predict the output, or fill in the blank) and an explanation for every answer.
- **Notebook:** `practice.ipynb` (see the spec below).
- **Exam corner:** 1 question in the real exam's style, with a reveal-answer button.
- **Takeaways card:** 3 bullets plus a "trap of the day".
- **Size:** about 25–30 min in total. The video runs 3–5 min. The notebook has 4–6 exercises and takes 15–20 min.

## Notebook spec
- **First cell:** the course, the course week, the topic, a time estimate, and how to use the notebook. No dates, no deadlines, no emojis.
- **Helper cell:** a `check(fn, *args, expected=...)` helper like the one in `seed/py-00`. It prints `PASS` / `FAIL` and never crashes.
- **Exercise types:** predict the output, fix the bug, write from scratch, and (for IS) trace by hand.
- **Each exercise:** a markdown task, then a code cell with a stub (`pass`), then a test cell.
- **Hints stay hidden until clicked.** Use HTML `<details>` in markdown cells, in progressive steps. Leave a blank line after `</summary>` so code fences render.
  ~~~~
  <details><summary>Hint 1</summary>

  small nudge
  </details>

  <details><summary>Hint 2</summary>

  bigger nudge
  </details>

  <details><summary>Show solution</summary>

  ```python
  ...
  ```
  </details>
  ~~~~
- **Last cell:** a "Mistakes list" markdown cell.
- **Standard library only**, so every notebook runs in JupyterLite.
- **IS notebooks:** mostly pen-and-paper exercises with reveal answers (search traces, alpha-beta, truth tables, CNF, DPLL). Add small code where it helps, for example running BFS or A* on a toy graph to check a hand trace, or a truth-table generator.
- **Verify every notebook before committing.** Run it headless with nbclient.
  - The stubs must give `FAIL` and not crash. Cells that crash on purpose must say so.
  - Then inject the solutions and confirm every test shows `PASS`.
  - Never ship a notebook whose solutions fail.

## Video spec
Use the explainer-video skill with these overrides:
- **Audience:** any student in the course. Never use a name. Where the skill says "remind Orion", remind the viewer to do graded work themselves, since the course doesn't allow AI on graded work.
- **Not time-bound:** no dates, no deadlines, no "this week". Where the skill says the last chapter is "recap + deadlines", make it the takeaway plus what's in the practice notebook.
- **Length:** 3–5 chapters and 3–5 minutes in total, not 8–14 chapters. Chapter 1 is a hook question plus what you'll learn.
- **Graphics:** no emojis in on-screen graphics.
- **Voice:** `i9SZdx1xJqqryIiaFdmN` (Kopi Gao), model `eleven_v4`. Skip the voice A/B. Use 1 take per chapter.
- **Output:** where the skill says "Send it with SendUserFile", save the file instead. Make a web copy, write `poster.jpg`, and keep each video under 25 MB. Also write `transcript.md` from the script.
  `ffmpeg -i final.mp4 -vf scale=-2:720 -c:v libx264 -preset veryfast -crf 28 -c:a aac -b:a 128k -movflags +faststart video.mp4`
- **Work directories:** keep them in `private/video-work/<id>/`. Commit only `video.mp4`, `poster.jpg` and `transcript.md`.
- **Parallel runs:** at most 2 videos at once, because of the ElevenLabs concurrency limit.
- **Content:** never put graded-work solutions in a video. Check frames before shipping, as the skill says.

## Site spec
### Stack
- Astro with static output and MDX content collections, plus small React islands for the quiz, progress and notebook launcher.
- Tailwind is fine, but no default component-kit look.
- **GSAP** for all motion. It's free, including every plugin; install it with `npm install gsap`.
- Deploy with GitHub Actions to GitHub Pages. JupyterLite is built into the same site under `/lab/`.

### Feel (the top priority)
- **Fast.** Every tap or click gets visible feedback within 100 ms. No layout shift.
- **Resumes where you left off,** down to the exact step of a lesson.
- **Keyboard shortcuts on lesson pages:** Enter or the right arrow goes to the next step, 1–4 picks an answer, and ? shows the shortcut list.
- **Phone-friendly:** big targets and one-handed use on a phone.
- **Quiet:** no nagging, no modals that interrupt, no dark patterns. Streaks motivate but never guilt-trip.
- **Satisfying moments:** a correct answer and finishing a lesson should feel good. Use small GSAP moments, never cheesy ones.
- **Test the flows as a real user** (see "Quality bar") and fix any friction you find.

### Look: it must not look AI-made
- **Avoid:** the default shadcn/Tailwind look, purple or blue gradients, glassmorphism, generic blob illustrations, emojis, and stock "AI" sparkle icons.
- **Type:** pick a characterful pairing. A distinctive display face for headings, a very legible sans for body text, and a good monospace for code. Use a deliberate grid and spacing scale.
- **Palette:** kopi. Espresso brown, condensed-milk cream, and a terracotta accent that matches the video tutor. Light and dark mode.
- **Visual motif: dithering.** Use ordered dithering (a Bayer matrix) in the palette for the hero art, section dividers, empty states, the lesson-complete moment (a dithered burst instead of confetti) and the loaders.
- **Skeleton loaders:** every loading state gets a skeleton with an animated dither shimmer, done as a small canvas or WebGL shader or an SVG pattern. The notebook and JupyterLite loading state is "code loading": monospace lines filling in with dithered blocks and a blinking cursor. With reduced motion, the dither is static.

### Icons
- Use **Phosphor Icons** (`@phosphor-icons/react`) in one weight across the whole site, for example bold or duotone, or custom SVG icons drawn for the site.
- **Never Lucide or Feather.**
- Every icon-only button gets an accessible name.

### Motion (GSAP)
- **Where:** step transitions, the path map (nodes and the path drawing in with ScrollTrigger), quiz feedback (correct gets a short pop, wrong gets a gentle shake plus an explanation), the XP counter, the streak and the lesson-complete moment.
- **Timing:** UI motion takes 150–400 ms, can be interrupted, and never blocks input.
- **Reduced motion:** use `gsap.matchMedia()` with `(prefers-reduced-motion: reduce)` to swap animations for simple fades or no motion.

### Pages and features
- **Home:** exam countdowns, a "Today" card with both tracks' lessons, a streak and XP.
- **Path map per track:** a vertical path of lesson nodes grouped by course week, like Duolingo. Each node shows done, today or upcoming. Past days you didn't finish show as "catch up". Nothing gets hard-locked.
- **Lesson page:** a stepper (Warm-up → Video → Quiz → Notebook → Exam corner → Done) with one step on screen at a time and a progress bar on top.
- **Notebook step:** three buttons:
  - **Solve in browser:** opens JupyterLite.
  - **Open in Colab:** links to `colab.research.google.com/github/<user>/<repo>/blob/main/<path>`.
  - **Download .ipynb.**

  Below them, an "I finished it" check and a rating of Easy, OK or Hard (icons plus words, no emojis) that feeds the spaced repetition.
- **Schedule:**
  - `content/schedule/2026-p2.json` maps each lesson id to a suggested date, plus the exam dates.
  - In Settings, users can change their exam dates and start date. These are stored locally.
  - With no schedule, the site still works as a self-paced path.
- **Progress:** stored in localStorage (no accounts, no backend). Add an export/import progress button for moving between devices.
- **Spaced repetition:** wrong quiz answers and lessons rated Hard come back in warm-ups 1, 3 and 7 days later.
- **Size budget:** a published Pages site has a 1 GB limit. Make CI fail if the videos together go over 800 MB.

### Accessibility: WCAG 2.2 level AA (AAA not needed)
- **Contrast:**
  - 4.5:1 for text, and 3:1 for large text.
  - 3:1 for UI components, focus indicators and meaningful graphics.
  - Dither patterns never sit behind text.
- **Keyboard:**
  - Everything works with a keyboard, with visible focus and a logical focus order.
  - No keyboard traps, and there's a skip link.
  - Focus is never hidden behind sticky bars (2.4.11).
- **Targets:** at least 24×24 CSS px (2.5.8). Anything draggable also works with a single click (2.5.7).
- **Semantics:** landmarks, one h1 per page, a correct heading order, labelled form controls, and real buttons and links.
- **Status and feedback:**
  - Quiz feedback and other status messages are announced with `aria-live` (4.1.3).
  - Never use color alone (1.4.1). Always add an icon and text.
- **Reflow and zoom:** reflow at 320 px wide with no horizontal scroll (1.4.10). The site works at 200% zoom and with increased text spacing (1.4.12).
- **Video:**
  - The captions are burned in.
  - Add a WebVTT track built from the word timings if that's easy.
  - Always show a text transcript under the video.
  - The player controls are keyboard accessible.
- **Motion:**
  - Nothing moves on its own for longer than 5 seconds without a pause control (2.2.2).
  - Respect reduced motion.
  - Loaders use `aria-busy` and a visually hidden "Loading" status.
- **Help:** help and shortcuts sit in the same place on every page (3.2.6).

### Quality bar (before calling anything done)
- **Accessibility tests:** run axe-core with Playwright on every page in CI, and fail the build on any WCAG 2.2 A/AA violation.
- **Manual passes:**
  - one keyboard-only pass
  - one screen-reader spot check
  - one reduced-motion pass
  - one dark-mode pass
- **User walkthrough:** go through a full lesson as a user with Playwright, on a phone viewport (390 px) and a laptop viewport. Take screenshots, look at them, and fix anything that feels slow, cramped, confusing or AI-generic.
- **Lighthouse:** aim for 95+ on performance and accessibility on the lesson page.

## Repo layout
```
CLAUDE.md                     this file
PROMPTS.md                    the prompts I paste, in order
docs/phase1-study-plan.md     my personal study plan (context only)
.claude/skills/vu-canvas/     Canvas (read-only, token from $CANVAS_TOKEN)
.claude/skills/explainer-video/
private/                      gitignored: Canvas downloads, notes, credit log, video work
seed/py-00/                   starting notebook for py-00 (+ my personal video, not committed)
content/curriculum.json
content/schedule/2026-p2.json
content/python/py-XX/
content/is/is-XX/
src/ …                        site
```
