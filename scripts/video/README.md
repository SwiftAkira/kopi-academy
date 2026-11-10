# Video helpers

Small tools used while making the lesson videos with the explainer-video skill
(`.claude/skills/explainer-video/SKILL.md`, with the overrides in `CLAUDE.md`).
The engine itself (`engine.py`, `render.py`, `mix_sfx.py`, `sheet.py`) is printed in that skill.
Each video is built in its own private work directory, `private/video-work/<id>/`, which is not in git.

| File | What it does |
|---|---|
| `kit.py` | Shared drawing helpers for `scenes.py`: the tutor pointer, mono text with logic symbols, formula chips, verdict pills, numbered dots. Copy it next to `scenes.py` and use `from kit import *`. |
| `words.py` | Prints a chapter transcript with timestamps and without the voice tags, to choose cue phrases. |
| `render_all.sh` | Renders all chapters with two workers, then assembles `final.mp4`. |
| `assemble.sh` | Step 12 of the skill: pads each chapter's voice, joins clips and audio, mixes the sound effects, muxes. |
| `frames.sh` | Grabs frames of `final.mp4` into one contact sheet for a last look. |
| `../video_finish.py` | Writes the four files a lesson ships: `video.mp4` (720p), `poster.jpg`, `transcript.md`, `captions.vtt`. |

The engine draws with Lora, Inter and DejaVu Sans Mono. Lora and Inter only hold Latin letters,
so logic symbols and arrows are drawn with the mono font (`mt()` in `kit.py`).
Set `FONTCONFIG_FILE` to a fontconfig file that includes those fonts before rendering.
