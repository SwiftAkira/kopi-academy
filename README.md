# Kopi Academy

Unofficial guided exam prep for two first-year AI courses: one small lesson per course, every weekday.
Each lesson runs warm-up, short video, quick quiz, practice notebook, one exam-style question.

This is a study site made by a student. It is not affiliated with Vrije Universiteit Amsterdam, and every
explanation, exercise and question in it is original. `CLAUDE.md` holds the full rules and specifications.

## Run it

```bash
npm install
npm run dev            # http://localhost:4321
```

Build the whole site, including the in-browser notebooks:

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
npm run build:all      # site into dist/, then JupyterLite into dist/lab/
npm run preview
```

## Check it

```bash
node scripts/check-content.mjs --dist              # no emojis, nothing time-bound, Phosphor icons only, noindex on every page
.venv/bin/python scripts/verify_notebooks.py       # stubs FAIL cleanly, solutions PASS
node scripts/check-video-budget.mjs                # videos fit a GitHub Pages site
npx playwright test                                # axe on every page (WCAG 2.2 A and AA) and a full-lesson walkthrough
```

The walkthrough saves screenshots of every step, on a phone and a laptop viewport, in `test-results/walkthrough/`.
The same checks run in GitHub Actions before each deploy (`.github/workflows/deploy.yml`).

## Where things live

| Path | What it is |
|---|---|
| `content/curriculum.json` | Every lesson: id, track, course week, title, objectives. No dates. |
| `content/schedule/2026-p2.json` | Suggested date for each lesson, and the exam dates. The only file with dates. |
| `content/<track>/<id>/` | One lesson: `lesson.mdx`, `quiz.json`, `exam.mdx`, `practice.py` and the built `practice.ipynb`, plus `video.mp4`, `poster.jpg`, `transcript.md`, `captions.vtt` once the video exists. |
| `scripts/nbkit.py` | Builds a notebook to the notebook spec from a lesson's `practice.py`. |
| `scripts/verify_notebooks.py` | Runs every notebook headless, as shipped and with the solutions put in. |
| `scripts/video_finish.py` | Makes the web copy, poster, transcript and captions from a finished video. |
| `src/` | The Astro site: pages, React islands, styles, build-time dither art. |
| `lab/` | JupyterLite configuration. |
| `private/` | Not in git: course downloads, notes, video work, credit log. |

## Add or change a lesson

1. Edit the files in `content/<track>/<id>/`. The front matter of `lesson.mdx` must agree with `content/curriculum.json`.
2. Rebuild and verify the notebook: `.venv/bin/python scripts/verify_notebooks.py --build <id>`.
3. Run the checks above.

A lesson without a `lesson.mdx` and `quiz.json` shows up on the path as "Being written".

## A new year

Lesson content never mentions dates. For a new cohort, add a schedule file next to
`content/schedule/2026-p2.json` and change the one import in `src/lib/active-schedule.ts`. Students can also set their own
start date and exam dates in Settings, or use the path self-paced.
