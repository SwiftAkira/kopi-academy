---
name: "explainer-video"
description: "Make a narrated, animated explainer/lesson MP4 (ElevenLabs Singlish tutor voice, word-synced motion graphics, little tutor character). Use when Orion asks for a study, lesson or explainer video."
---

# Explainer video (Singlish tutor edition)

Produces a 1080p30 MP4: chaptered lesson, ElevenLabs voiceover, karaoke captions, and Cairo-drawn motion graphics synced to the exact spoken word. An original tutor character (terracotta blob with a graduation cap) slides along a rail, looks at and points a stick at whatever he is explaining, lip-syncs to the audio and squints happily on laughs.

Never draw Anthropic's Claude / Claude Code mascot or any other brand character. If asked, say in one line it's a brand character and use the tutor.

## Workflow (follow in order)

1. **Material.** Gather the real content first (Canvas skill for VU courses, attached files, notebooks). Read the actual assignment so the lesson covers what it needs.
2. **Plan chapters.** 8 to 14 chapters, 40 to 90 s each. Ch1 = intro/agenda, last = recap + deadlines. Every chapter: build the idea step by step, then say WHY it is that way. Use examples that are different from graded tasks. Never put solutions to graded work in the video, and remind Orion that the VU Python course bans AI on graded work.
3. **Script** (rules below). Save to `script.json` as a list of strings, one per chapter.
4. **Voice A/B (cheap).** Before the full run, generate ONE line (about 15 words) with both voices and let Orion pick if he is around:
   - `i9SZdx1xJqqryIiaFdmN` Kopi Gao, full-local Singlish rhythm (default)
   - `KtPOAeg5naEFxxTbEklm` Kopi, Bold Singaporean Character (stronger accent)
   Always `model_id: eleven_v4`.
5. **Voiceover.** `creative_create_flow` once, then one `creative_generate_speech` per chapter on that flow (default 2 takes; use take 1). Calls hit a concurrency limit and auto-retry. Just poll.
6. **Word timings + downloads: delegate to a background general-purpose subagent** (the transcripts are huge and will flood your context). Give it the flow id and each chapter's session_id/generation_id. For each chapter it should:
   - `creative_add_flow_asset_node` (modality audio, generation_id)
   - `creative_transcribe_audio` (eleven_scribe_v1, connect_from that node), only once per chapter
   - poll, then `curl` the `words_download_url` to `words/sN.json`
   - curl each take's content_url to `audio/sN.mp3`, then `ffmpeg -i audio/sN.mp3 -ac 1 -ar 48000 audio/sN.wav`
   - report only file lists.
   Write the engine while it runs.
7. **SFX.** Make `sfx/whoosh.wav`, `sfx/pop.wav`, `sfx/chime.wav`. If an ElevenLabs sound-effects node (`eleven_text_to_sound_v2`) is available, generate them once each. Otherwise synthesize:
   - `ffmpeg -f lavfi -i "anoisesrc=d=0.6:c=pink" -af "afade=in:d=0.25,afade=out:st=0.3:d=0.3,lowpass=f=1200" -ar 48000 -ac 2 sfx/whoosh.wav`
   - `ffmpeg -f lavfi -i "sine=f=880:d=0.12" -af "afade=out:st=0.02:d=0.1" -ar 48000 -ac 2 sfx/pop.wav`
   - `ffmpeg -f lavfi -i "sine=f=1320:d=0.35" -af "afade=out:st=0.05:d=0.3" -ar 48000 -ac 2 sfx/chime.wav`
8. **Code.** In a fresh work dir, write `engine.py`, `render.py` and `mix_sfx.py` exactly as given at the bottom. Install pycairo first: `pip install --break-system-packages pycairo`. Then write `scenes.py` for this video (API below).
9. **Check cues.** Run `python3 render.py check`. Every chapter must print `ok`. A MISSING phrase means the cue text doesn't match the transcript: fix the phrase and use the punctuation-free form (`"As"` for "A's", `"3ary"` for "3-ary", `"2359"` for "23:59").
10. **Look before rendering.** Run `python3 sheet.py N 0.2 0.45 0.7 0.92` for every chapter and Read each contact sheet. Fix overlaps, empty gaps, crowded areas and things colliding with the tutor rail. Re-preview anything you changed.
11. **Render.** Run two parallel workers balanced by duration (`python3 render.py all 9 7 5 3 1 ...` and `... all 8 10 4 ...`), each in the foreground with a long timeout. About 14 min of video renders in about 6 to 8 min.
12. **Assemble.** Pad each chapter's wav with `adelay=<lead ms>:all=1,apad` and `-t <chapter mp4 duration>`, then concat the videos (`-c copy`) and the wavs. Run `python3 mix_sfx.py audio_all.wav audio_mix.wav`, then mux with `-map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart`. Grab 4 frames from the final file and look at them. Send it with SendUserFile.

## Singlish script rules (the voice sounds British if the TEXT is standard English)

- Stack the accent with every emotion tag, every time: `[strong Singaporean accent] [excited] ...`. A tag holds until the next one, so a bare `[curious]` later drops the accent.
- Use real Singlish grammar, not just particles at sentence ends:
  - drop copulas: "This one very simple"
  - "got" for there is/have: "Got edge from A to B or not?"
  - "already" for completed actions: "Done already lah"
  - "can or not", "also can", "how come", "where got" (denial), "anyhow", "dun play play", "one" as a sentence end: "Very powerful one"
- Particles, varied, about one per sentence: lah (reassure), leh (soft push), lor (resigned), meh (doubt), sia (wow), hor (seeking agreement), ah (topic marker: "This part ah, very important").
- Interjections: walao eh, alamak, wah lau, aiyo, shiok, steady, sibei (very), paiseh, kancheong (nervous), chope, bojio, jia you, kena (got hit by).
- Use some local imagery: kopi, hawker queue, MRT, chope with tissue packet.
- Swear sparingly, like a friend (damn, shit, sibei jialat). Never at the learner.
- Audio tags: `[laughs]`, `[chuckles]`, `[sighs]`, `[mischievously]`, `[warmly]`, `[short pause]`, `[pause]`. Capitalise one key word per idea for emphasis ("BOTH", "WHY"). Write numbers as digits.
- Teach in this rhythm: question, then step 1, step 2, step 3 out loud, then "why ah? because...", then the trap to avoid, then a one-line takeaway.
- Example line: `[strong Singaporean accent] [curious] Okay, this one ah, why the edge appear TWICE? [short pause] [mischievously] Not mistake lah! Each list only answer one question: from HERE, where can I go? So both side must write. Simple as that lor.`

## Motion design rules (lessons learned)

- Layout: 1920x1080. Header at y 86 to 188. Stage at y 250 to 760. Tutor rail at y 842 (body reaches about y 740). Captions band at y 960 to 1040. Keep content above about 740 wherever the tutor stands. The left column (x 120 to 900) holds diagrams; the right column (x 1000 to 1800) holds code/cards. The tutor parks around x 930 between them.
- Phases inside a chapter: compute `A_ = ap(t, start) * (1 - ap(t, next_start - 0.3))`. The outgoing phase must finish fading BEFORE the next one appears, so there is no double exposure, but with no empty gap longer than about 0.5 s.
- Drive every reveal from `T.cue("spoken words")`. Use `pop()` for things appearing and `ap()` for fades. Stagger groups by 0.1 to 0.2 s.
- Step-by-step means one focus at a time. Use `focus_ring` with keyframes per step, the tutor `point` moving to the same target, and the code `pointer` line for traces. A `var_panel` updates on the spoken value.
- The camera (`cam`) only pushes in gently (zoom 1.03 to 1.07) on moments with everything relevant inside the frame. Check the side panels stay on screen in a preview. Return to 1.0 for the next phase.
- Use `burst()` + `T.sfx('chime', t)` for "found it" / success moments. Use `T.sfx('pop', t, 0.5)` for big reveals, at most every 2 to 3 s, so it never turns into machine-gun pops. The chapter wipe gets a whoosh automatically.
- Never put two captions on screen at once (already handled in the engine). Never put text under the tutor.
- Code: use `typing=[(t0, t1), ...]` per line, synced to when the line is said. Use `hl=[(line, col_start, col_len, colour, alpha)]` to highlight a token, `strike` for removals, and `dim` for skipped branches.
- The tutor stick is drawn behind content with a ring on the target. Aim targets at the thing itself (node centre, code token, table cell).

## scenes.py API

```python
from engine import *
RAIL = 842

def tut(t, xs, pts):
    """xs: [(time, x)] tutor x keyframes; pts: [(time, (px,py) or None)] pointer targets."""
    x = kf(t, [(tt, (v,)) for tt, v in xs], dur=0.8)[0]
    fr = []; last = (x, RAIL - 300)
    for tt, p in pts:
        if p is None: fr.append((tt, (last[0], last[1], 0.0)))
        else: fr.append((tt, (p[0], p[1], 1.0))); last = p
    if not fr or t < fr[0][0]: return x, None, 0.0
    px, py, pa = kf(t, fr, dur=0.5)
    return x, (px, py), pa

def ch2(d, t, T):
    C = T.cue
    nodes = C('Nodes which are the dots'); edges = C('and edges which are'); why = C('Why ah')
    for i, (u, v) in enumerate(GE):
        edge(d, G[u], G[v], prog=ap(t, edges + 0.25*i, 0.6))
    for i, k in enumerate('ABCD'):
        node(d, *G[k], k, a=pop(t, T.sfx('pop', nodes + 0.15*i, 0.4)))
    code = Code(1000, 270, 790, ['graph = {', '    "A": ["B", "C"],', '}'])
    code.draw(d, t, a=ap(t, why), typing=[(why, why + 0.4), (why + 0.4, why + 1.8), (why + 1.8, why + 2.0)])
    focus_ring(d, t, [(why + 0.4, code.box(d, 1, 4, 15)), (why + 3, None)])
    x, pt, pa = tut(t, [(0, 930)], [(nodes, G['A']), (why + 0.4, (1100, 377)), (why + 3, None)])
    return dict(x=x, point=pt, point_a=pa, look=pt or (700, 450),
                cam=cam(t, [(0, (W/2, H/2, 1.0)), (nodes, (520, 500, 1.05)), (why, (W/2, H/2, 1.0))]))

# (scene_fn, chapter title or None, subtitle, audio lead seconds). Ch1 lead 0.6 and no chapter card; others 1.25.
CH = [(ch1, None, None, 0.6), (ch2, 'What is a graph?', 'nodes · edges · neighbours', 1.25)]
HEADER = 'STUDY SESSION'
```

The scene function may also return `wave=1.0` (tutor waves), `s=` (tutor scale) and `y=`.

The engine also provides: `pill`, `card`, `node`, `edge` (with `arrow=` for directed), `edge_pts`, `Code` (`.box(d, line, col, len)`, `.line_y(i)`), `var_panel`, `focus_ring`, `burst`, `trail_dot`, `d.arrow`, `d.curve_arrow`, `d.check`, `d.cross`, `d.text` (`anchor` l/c/r), `d.rrect` (`shadow=True`), `kf`, `ap`, `pop`, `win`, `mix`, `lerp`.

The palette is cream/terracotta: `BG CARD INK MUTED FAINT LINE CLAY CLAY_D CLAY_SOFT SAGE SAGE_SOFT SKY SKY_SOFT RED RED_SOFT GOLD CODEBG`. Fonts are Lora (serif headings), Inter (UI) and DejaVu Sans Mono (code).

## sheet.py (preview contact sheet)

```python
import sys
from PIL import Image
from render import setup, render
idx = int(sys.argv[1]); fr = [float(x) for x in sys.argv[2:]] or [0.2, 0.45, 0.7, 0.92]
fn, title, sub, lead, T = setup(idx)
ts = [round(lead + f*T.dur, 1) for f in fr]
render(idx, ts)
ims = [Image.open(f'preview/c{idx}_{t:05.1f}.png').resize((960, 540)) for t in ts]
S = Image.new('RGB', (1920, 540*((len(ims)+1)//2)), 'white')
for i, im in enumerate(ims): S.paste(im, ((i % 2)*960, (i//2)*540))
S.save(f'preview/sheet{idx}.jpg', quality=85); print(ts)
```

## render.py

```python
import sys, os, subprocess, json
from engine import *
from scenes import CH, RAIL
try:
    from scenes import HEADER
except ImportError:
    HEADER = 'STUDY SESSION'
TAIL = 1.0

class MemoT(Timing):
    def __init__(self, idx, lead):
        super().__init__(idx, lead); self.memo = {}
    def cue(self, phrase, k=0, after=None, end=False):
        key = (phrase, k, after, end)
        if key not in self.memo: self.memo[key] = Timing.cue(self, phrase, k, after, end)
        return self.memo[key]

def setup(idx):
    fn, title, sub, lead = CH[idx-1]
    return fn, title, sub, lead, MemoT(idx, lead)

def frame(d, idx, t, fn, title, sub, T, caps, total):
    d.background(t)
    chrome(d, t if idx != 1 else 99, idx, title if idx != len(CH) else None, len(CH), HEADER)
    d.c.push_group(); st = fn(d, t, T); content = d.c.pop_group()
    cm = st.get('cam') or (W/2, H/2, 1.0)
    pt = cam_map(st.get('point'), cm); lk = cam_map(st.get('look'), cm)
    tutor_stick(d, t, st.get('x', 930), st.get('y', RAIL), st.get('s', 0.78), pt, st.get('point_a', 0.0))
    d.c.save(); d.c.translate(W/2, H/2); d.c.scale(cm[2], cm[2]); d.c.translate(-cm[0], -cm[1])
    d.c.set_source(content); d.c.paint(); d.c.restore()
    tutor(d, t, st.get('x', 930), st.get('y', RAIL), T.mouth_at(t), s=st.get('s', 0.78), look=lk,
          point=pt, point_a=st.get('point_a', 0.0), wave=st.get('wave', 0.0), happy=T.happy(t))
    captions(d, caps, t)
    d.vignette()
    if idx != 1 and title: chapter_card(d, t, idx, title, sub); T.sfx('whoosh', 0.0, 0.7)
    fi = 1 - ap(t, 0, 0.3) if idx == 1 else 0
    fo = ap(t, total - 0.45, 0.45)
    if max(fi, fo) > 0.002: d.src(BG, max(fi, fo)); d.c.paint()

def render(idx, times=None):
    fn, title, sub, lead, T = setup(idx)
    caps = T.captions(); total = lead + T.dur + TAIL; d = D()
    if times is not None:
        os.makedirs(f'{BASE}/preview', exist_ok=True)
        for tt in times:
            frame(d, idx, tt, fn, title, sub, T, caps, total); d.s.write_to_png(f'{BASE}/preview/c{idx}_{tt:05.1f}.png')
        if T.missing: print('MISSING', idx, sorted(set(T.missing)))
        return
    fn(d, 0.0, T)
    if T.missing: print('MISSING', idx, sorted(set(T.missing)))
    os.makedirs(f'{BASE}/scenes', exist_ok=True)
    tmp = f'{BASE}/scenes/c{idx:02d}.tmp.mp4'
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-crf', '19', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', tmp], stdin=subprocess.PIPE)
    for k in range(int(round(total * FPS))):
        frame(d, idx, k / FPS, fn, title, sub, T, caps, total); p.stdin.write(d.bytes())
    p.stdin.close(); rc = p.wait()
    if rc == 0: os.replace(tmp, f'{BASE}/scenes/c{idx:02d}.mp4')
    json.dump([[k[0], k[1], v] for k, v in T.events.items()], open(f'{BASE}/scenes/c{idx:02d}.sfx.json', 'w'))
    print('chapter', idx, 'rc', rc, 'dur', round(total, 2), flush=True)

if __name__ == '__main__':
    if sys.argv[1] == 'preview':
        render(int(sys.argv[2]), [float(x) for x in sys.argv[3:]])
    elif sys.argv[1] == 'check':
        for i in range(1, len(CH) + 1):
            fn, title, sub, lead, T = setup(i); d = D()
            for tt in (0.5, 10, 30): fn(d, tt, T)
            print(i, 'dur', round(T.dur, 1), 'MISSING' if T.missing else 'ok', sorted(set(T.missing)))
    else:
        for i in sys.argv[2:]: render(int(i))
```

## mix_sfx.py

```python
"""usage: python3 mix_sfx.py voice.wav out.wav  (reads scenes/cNN.mp4 + scenes/cNN.sfx.json, sfx/<name>.wav)"""
import json, subprocess, sys, glob, os
voice, out = sys.argv[1], sys.argv[2]
off = 0.0; ev = []
for v in sorted(glob.glob('scenes/c[0-9][0-9].mp4')):
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v]))
    js = v.replace('.mp4', '.sfx.json')
    if os.path.exists(js):
        for name, t, g in json.load(open(js)):
            if os.path.exists(f'sfx/{name}.wav'): ev.append((name, off + t, g))
    off += dur
if not ev:
    subprocess.check_call(['cp', voice, out]); sys.exit()
names = sorted({e[0] for e in ev})
args = ['ffmpeg', '-v', 'error', '-y', '-i', voice] + sum([['-i', f'sfx/{n}.wav'] for n in names], [])
fl = []; labels = []
for ni, n in enumerate(names):
    mine = [e for e in ev if e[0] == n]
    fl.append(f'[{ni+1}:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit={len(mine)}' + ''.join(f'[{n}{k}]' for k in range(len(mine))))
    for k, (_, t, g) in enumerate(mine):
        fl.append(f'[{n}{k}]adelay={int(t*1000)}:all=1,volume={0.35*g:.2f}[{n}d{k}]'); labels.append(f'[{n}d{k}]')
fl.append('[0:a]' + ''.join(labels) + f'amix=inputs={len(labels)+1}:normalize=0:duration=first[out]')
subprocess.check_call(args + ['-filter_complex', ';'.join(fl), '-map', '[out]', out])
print('mixed', len(ev), 'events of', names)
```

## engine.py

```python
import cairo, json, math, re, wave, os
import numpy as np

W, H, FPS = 1920, 1080, 30
BASE = os.path.dirname(os.path.abspath(__file__))

def hx(h, a=1.0):
    h = h.lstrip('#'); return (int(h[0:2], 16)/255, int(h[2:4], 16)/255, int(h[4:6], 16)/255, a)
BG = hx('F3EEE4'); BG2 = hx('EDE6DA'); INK = hx('1F1E1D'); MUTED = hx('8A8478'); FAINT = hx('B9B1A4')
CARD = hx('FCFAF6'); LINE = hx('DED6C8'); CLAY = hx('D97757'); CLAY_D = hx('B85C3E'); CLAY_SOFT = hx('F4D8CA')
SAGE = hx('5F8A6B'); SAGE_SOFT = hx('D6E5DA'); SKY = hx('5E82AD'); SKY_SOFT = hx('D7E2EF'); RED = hx('C4503F'); RED_SOFT = hx('F3D1CB')
GOLD = hx('E0A93B'); CODEBG = hx('262422'); CODE_FG = hx('EDE6DA'); CODE_KW = hx('EC9A78'); CODE_STR = hx('A8CC9F')
CODE_NUM = hx('9DBBE0'); CODE_CM = hx('8C8478'); WHITE = hx('FFFFFF')
SERIF, SANS, SANSB, MONO = 'Lora', 'Inter', 'Inter SemiBold', 'DejaVu Sans Mono'

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def e_out(x): x = clamp(x); return 1 - (1 - x) ** 3
def e_io(x): x = clamp(x); return 4*x*x*x if x < 0.5 else 1 - (-2*x + 2) ** 3 / 2
def e_back(x, s=1.9):
    x = clamp(x); x -= 1; return x*x*((s+1)*x + s) + 1
def ap(t, t0, d=0.45): return e_out((t - t0) / d)
def pop(t, t0, d=0.5): return e_back((t - t0) / d) if t > t0 else 0.0
def win(t, t0, t1, d=0.35): return ap(t, t0, d) * (1 - ap(t, t1, d))
def lerp(a, b, k): return a + (b - a) * k
def mix(c1, c2, k): return tuple(lerp(c1[i], c2[i], k) for i in range(4))

def kf(t, frames, dur=0.55):
    if not frames: return None
    cur = frames[0][1]
    for i, (tt, v) in enumerate(frames):
        if t < tt: break
        prev = frames[i-1][1] if i > 0 else v
        k = e_io((t - tt) / dur)
        cur = tuple(lerp(prev[j], v[j], k) for j in range(len(v)))
    return cur

def norm(w): return re.sub(r'[^a-z0-9]', '', w.lower())

def load_wav(p):
    with wave.open(p) as w:
        sr = w.getframerate(); n = w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
    return x, sr

class Timing:
    def __init__(self, idx, lead):
        self.lead = lead
        wj = json.load(open(f'{BASE}/words/s{idx}.json'))['words']
        self.tags = []; self.words = []; intag = False; tagtxt = ''
        for w in [w for w in wj if w.get('type', 'word') == 'word']:
            tx = w['text']
            if tx.startswith('[') or intag:
                intag = not tx.rstrip().endswith(']'); tagtxt += ' ' + tx
                if not intag: self.tags.append((tagtxt.strip(), w['start'] + lead)); tagtxt = ''
                continue
            self.words.append({'t': tx, 'n': norm(tx), 's': w['start'] + lead, 'e': w['end'] + lead})
        x, sr = load_wav(f'{BASE}/audio/s{idx}.wav')
        self.dur = len(x) / sr
        fr = sr // FPS; nf = len(x) // fr + 1
        r = np.sqrt(np.mean(np.pad(x, (0, nf*fr - len(x))).reshape(nf, fr) ** 2, axis=1))
        m = np.clip(r / (np.percentile(r, 95) + 1e-6), 0, 1.2); sm = m.copy()
        for i in range(1, len(sm)): sm[i] = 0.55*m[i] + 0.45*sm[i-1]
        self.mouth = sm; self.missing = []; self.events = {}
    def cue(self, phrase, k=0, after=None, end=False):
        toks = [norm(p) for p in phrase.split() if norm(p)]; n = len(toks); found = 0
        for i in range(len(self.words) - n + 1):
            if all(self.words[i+j]['n'] == toks[j] for j in range(n)):
                if after is not None and self.words[i]['s'] < after: continue
                if found == k: return self.words[i+n-1]['e'] if end else self.words[i]['s']
                found += 1
        self.missing.append(phrase); return 9999.0
    def mouth_at(self, t):
        k = int(round((t - self.lead) * FPS))
        return float(self.mouth[k]) if 0 <= k < len(self.mouth) else 0.0
    def sfx(self, name, time, gain=1.0):
        if time < 9000: self.events[(name, round(time, 2))] = gain
        return time
    def happy(self, t):
        return any(('laugh' in tg or 'chuckle' in tg) and ts - 0.2 <= t <= ts + 1.8 for tg, ts in self.tags)
    def captions(self):
        chunks, cur = [], []
        for w in self.words:
            if cur:
                gap = w['s'] - cur[-1]['e']; end_p = cur[-1]['t'][-1] in '.?!'
                if len(cur) >= 11 or (end_p and len(cur) >= 4) or gap > 0.7 or (end_p and gap > 0.25):
                    chunks.append(cur); cur = []
            cur.append(w)
        if cur: chunks.append(cur)
        return chunks

class D:
    def __init__(self):
        self.s = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H); self.c = cairo.Context(self.s)
        self.bgs = make_bg(); self.vig = make_vignette()
    def src(self, col, a=1.0): self.c.set_source_rgba(col[0], col[1], col[2], col[3] * a)
    def background(self, t):
        c = self.c
        c.set_source_surface(self.bgs, -((t * 7) % 44), -((t * 4) % 44)); c.paint()
        for i, (col, r, ox, oy, sp) in enumerate([(CLAY_SOFT, 520, 0.15, 0.25, 0.11), (SAGE_SOFT, 600, 0.85, 0.7, 0.08), (SKY_SOFT, 460, 0.7, 0.15, 0.13)]):
            x = W*ox + math.sin(t*sp + i*2.1)*140; y = H*oy + math.cos(t*sp*0.8 + i)*90
            g = cairo.RadialGradient(x, y, 0, x, y, r)
            g.add_color_stop_rgba(0, col[0], col[1], col[2], 0.55); g.add_color_stop_rgba(1, col[0], col[1], col[2], 0)
            c.set_source(g); c.paint()
    def vignette(self): self.c.set_source_surface(self.vig, 0, 0); self.c.paint()
    def path_rrect(self, x, y, w, h, r):
        c = self.c; r = max(0, min(r, w/2, h/2)); c.new_sub_path()
        c.arc(x+w-r, y+r, r, -math.pi/2, 0); c.arc(x+w-r, y+h-r, r, 0, math.pi/2)
        c.arc(x+r, y+h-r, r, math.pi/2, math.pi); c.arc(x+r, y+r, r, math.pi, 1.5*math.pi); c.close_path()
    def rrect(self, x, y, w, h, r, fill=None, a=1.0, stroke=None, lw=2, shadow=False):
        if a <= 0.002: return
        c = self.c
        if shadow:
            for dy, sp, al in [(10, 10, 0.035), (6, 5, 0.05), (3, 2, 0.06)]:
                self.path_rrect(x - sp/2, y + dy - sp/2 + 2, w + sp, h + sp, r + sp/2); self.src(INK, a*al); c.fill()
        self.path_rrect(x, y, w, h, r)
        if fill:
            self.src(fill, a)
            if stroke: c.fill_preserve()
            else: c.fill()
        if stroke: self.src(stroke, a); c.set_line_width(lw); c.stroke()
    def circle(self, x, y, r, fill=None, a=1.0, stroke=None, lw=3):
        if a <= 0.002 or r <= 0: return
        c = self.c; c.new_sub_path(); c.arc(x, y, r, 0, 2*math.pi)
        if fill:
            self.src(fill, a)
            if stroke: c.fill_preserve()
            else: c.fill()
        if stroke: self.src(stroke, a); c.set_line_width(lw); c.stroke()
    def line(self, x1, y1, x2, y2, col, a=1.0, lw=4, prog=1.0, dash=None, cap=cairo.LINE_CAP_ROUND):
        if prog <= 0 or a <= 0.002: return
        c = self.c; x2 = x1 + (x2-x1)*prog; y2 = y1 + (y2-y1)*prog
        c.move_to(x1, y1); c.line_to(x2, y2); self.src(col, a); c.set_line_width(lw); c.set_line_cap(cap)
        if dash: c.set_dash(dash)
        c.stroke(); c.set_dash([])
    def arrowhead(self, x1, y1, x2, y2, col, a=1.0, size=20):
        if a <= 0.002: return
        ang = math.atan2(y2-y1, x2-x1); c = self.c; c.move_to(x2, y2)
        c.line_to(x2 - size*math.cos(ang-0.45), y2 - size*math.sin(ang-0.45))
        c.line_to(x2 - size*0.7*math.cos(ang), y2 - size*0.7*math.sin(ang))
        c.line_to(x2 - size*math.cos(ang+0.45), y2 - size*math.sin(ang+0.45)); c.close_path(); self.src(col, a); c.fill()
    def arrow(self, x1, y1, x2, y2, col, a=1.0, lw=4, prog=1.0, size=20, dash=None):
        if prog <= 0: return
        ex, ey = x1 + (x2-x1)*prog, y1 + (y2-y1)*prog
        self.line(x1, y1, ex, ey, col, a=a, lw=lw, dash=dash); self.arrowhead(x1, y1, ex, ey, col, a=a, size=size)
    def curve_arrow(self, x1, y1, x2, y2, bend, col, a=1.0, lw=4, prog=1.0, size=18):
        if prog <= 0 or a <= 0.002: return
        dx, dy = x2-x1, y2-y1; L = math.hypot(dx, dy) or 1
        cx, cy = (x1+x2)/2 - dy/L*bend, (y1+y2)/2 + dx/L*bend
        pts = [((1-u)**2*x1 + 2*(1-u)*u*cx + u*u*x2, (1-u)**2*y1 + 2*(1-u)*u*cy + u*u*y2) for u in [i/40 for i in range(int(40*prog)+1)]]
        c = self.c; c.move_to(*pts[0])
        for p in pts[1:]: c.line_to(*p)
        self.src(col, a); c.set_line_width(lw); c.set_line_cap(cairo.LINE_CAP_ROUND); c.stroke()
        if len(pts) > 2: self.arrowhead(pts[-3][0], pts[-3][1], pts[-1][0], pts[-1][1], col, a=a, size=size)
    def font(self, fam, size, bold=False, italic=False):
        self.c.select_font_face(fam, cairo.FONT_SLANT_ITALIC if italic else cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL)
        self.c.set_font_size(size)
    def tw(self, s, fam=None, size=None, italic=False):
        if fam: self.font(fam, size, italic=italic)
        return self.c.text_extents(s).x_advance
    def text(self, x, y, s, fam, size, col, a=1.0, anchor='l', italic=False):
        if a <= 0.002 or not s: return 0
        self.font(fam, size, italic=italic); w = self.tw(s)
        if anchor == 'c': x -= w/2
        elif anchor == 'r': x -= w
        self.c.move_to(x, y); self.src(col, a); self.c.show_text(s); return w
    def check(self, x, y, s, col, a=1.0, lw=5, prog=1.0):
        if a <= 0.002 or prog <= 0: return
        c = self.c; p = [(x - s*0.45, y), (x - s*0.1, y + s*0.35), (x + s*0.5, y - s*0.4)]; c.move_to(*p[0])
        if prog < 0.4: q = prog/0.4; c.line_to(lerp(p[0][0], p[1][0], q), lerp(p[0][1], p[1][1], q))
        else: c.line_to(*p[1]); q = (prog-0.4)/0.6; c.line_to(lerp(p[1][0], p[2][0], q), lerp(p[1][1], p[2][1], q))
        self.src(col, a); c.set_line_width(lw); c.set_line_cap(cairo.LINE_CAP_ROUND); c.set_line_join(cairo.LINE_JOIN_ROUND); c.stroke()
    def cross(self, x, y, s, col, a=1.0, lw=5, prog=1.0):
        self.line(x - s, y - s, x + s, y + s, col, a=a, lw=lw, prog=clamp(prog*2))
        self.line(x + s, y - s, x - s, y + s, col, a=a, lw=lw, prog=clamp(prog*2 - 1))
    def bytes(self): self.s.flush(); return bytes(self.s.get_data())

def make_bg():
    s = cairo.ImageSurface(cairo.FORMAT_RGB24, W + 88, H + 88); c = cairo.Context(s)
    c.set_source_rgba(*BG); c.paint(); c.set_source_rgba(*hx('D9D0C0', 0.55))
    for y in range(0, H + 88, 44):
        for x in range(0, W + 88, 44): c.new_sub_path(); c.arc(x, y, 1.6, 0, 2*math.pi); c.fill()
    return s

def make_vignette():
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); c = cairo.Context(s)
    g = cairo.RadialGradient(W/2, H/2, H*0.35, W/2, H/2, H*1.05)
    g.add_color_stop_rgba(0, 0.9, 0.86, 0.78, 0.0); g.add_color_stop_rgba(1, 0.55, 0.47, 0.38, 0.22); c.set_source(g); c.paint()
    return s

KW = {'if', 'elif', 'else', 'for', 'in', 'while', 'and', 'or', 'not', 'break', 'True', 'False', 'None', 'def', 'return', 'print', 'range', 'len', 'class', 'self', 'try', 'except', 'import', 'with', 'as'}
def code_tokens(line):
    out = []
    for tk in re.findall(r'#.*|"[^"]*"|\d+|\w+|\s+|.', line):
        col = CODE_CM if tk.startswith('#') else CODE_STR if tk.startswith('"') else CODE_NUM if tk.isdigit() else CODE_KW if tk in KW else CODE_FG
        out.append((tk, col))
    return out

class Code:
    def __init__(self, x, y, w, lines, size=32, lh=52, title=None, h=None):
        self.x, self.y, self.w, self.lines, self.size, self.lh, self.title = x, y, w, lines, size, lh, title
        self.h = h or (len(lines) * lh + 96); self.y0 = y + 92
    def cell(self, d): d.font(MONO, self.size); return d.tw('M')
    def line_y(self, i): return self.y0 + i * self.lh
    def box(self, d, li, cs, cl):
        cw = self.cell(d); return (self.x + 40 + cs*cw - 8, self.y0 + li*self.lh - self.size*0.95, cl*cw + 16, self.size*1.38)
    def draw(self, d, t, a=1.0, typing=None, hl=None, pointer=None, dim=None, strike=None, caret=True):
        if a <= 0.002: return
        d.rrect(self.x, self.y, self.w, self.h, 24, fill=CODEBG, a=a, shadow=True)
        for i, cc in enumerate([hx('E06C5A'), hx('E3B341'), hx('6DBF73')]): d.circle(self.x + 34 + i*24, self.y + 32, 7, fill=cc, a=a*0.9)
        if self.title: d.text(self.x + self.w - 30, self.y + 40, self.title, SANSB, 21, CODE_CM, a=a, anchor='r')
        cw = self.cell(d)
        for (li, cs, cl, col, ha) in (hl or []):
            if ha <= 0.002: continue
            bx, by, bw, bh = self.box(d, li, cs, cl); d.rrect(bx, by, bw, bh, 9, fill=col, a=a*ha*0.28, stroke=col, lw=2.5)
        if pointer is not None and pointer[0] > 0.002:
            pa, py = pointer; yy = self.y0 + py*self.lh - self.size*0.35
            d.rrect(self.x + 14, yy - self.size*0.75, self.w - 28, self.size*1.45, 10, fill=WHITE, a=a*pa*0.06)
            c = d.c; c.move_to(self.x + 14, yy - 11); c.line_to(self.x + 30, yy); c.line_to(self.x + 14, yy + 11); c.close_path(); d.src(CLAY, a*pa); c.fill()
        last_x, last_y, typing_now = None, None, False
        for i, ln in enumerate(self.lines):
            n = len(ln)
            if typing and typing[i] is not None:
                t0, t1 = typing[i]; k = clamp((t - t0) / max(0.05, t1 - t0)); n = int(round(len(ln) * k))
                if 0 < k < 1: typing_now = True
                if k <= 0: continue
            la = a * (dim[i] if dim else 1.0); cx = self.x + 40; shown = 0
            for tk, col in code_tokens(ln):
                if shown >= n: break
                part = tk[:n - shown]; d.text(cx, self.line_y(i), part, MONO, self.size, col, a=la); cx += cw * len(part); shown += len(part)
            last_x, last_y = cx, self.line_y(i)
            if strike and strike[i] > 0:
                d.line(self.x + 40, self.line_y(i) - self.size*0.32, self.x + 40 + cw*len(ln)*strike[i], self.line_y(i) - self.size*0.32, RED, a=a, lw=3)
        if caret and typing and last_x is not None and (typing_now or (int(t*2.2) % 2 == 0 and t < max(v[1] for v in typing if v) + 1.2)):
            d.rrect(last_x + 2, last_y - self.size*0.85, 3, self.size*1.05, 1, fill=CLAY, a=a)

def pill(d, x, y, s, fg, bg, a=1.0, size=26, anchor='l', fam=SANSB):
    if a <= 0.002: return 0
    w = d.tw(s, fam, size) + 44; h = size * 1.8
    if anchor == 'c': x -= w/2
    elif anchor == 'r': x -= w
    k = lerp(0.85, 1, clamp(a)); d.c.save(); d.c.translate(x + w/2, y); d.c.scale(k, k); d.c.translate(-(x + w/2), -y)
    d.rrect(x, y - h/2, w, h, h/2, fill=bg, a=a); d.text(x + 22, y + size*0.36, s, fam, size, fg, a=a); d.c.restore()
    return w

def card(d, x, y, w, h, a=1.0, fill=CARD, accent=None):
    if a <= 0.002: return
    d.rrect(x, y + (1-a)*18, w, h, 22, fill=fill, a=a, stroke=LINE, lw=2, shadow=True)
    if accent: d.rrect(x, y + (1-a)*18, 9, h, 4, fill=accent, a=a)

def node(d, x, y, label, a=1.0, r=46, fill=CARD, stroke=INK, fg=INK, size=36, ring=0.0, ringcol=CLAY, scale=1.0, lw=3):
    if a <= 0.002: return
    rr = r * scale
    if ring > 0.002:
        d.circle(x, y, rr + 10 + 8*ring, fill=ringcol, a=a*0.22*ring); d.circle(x, y, rr + 6, stroke=ringcol, a=a*ring, lw=3)
    d.circle(x, y + 4, rr, fill=INK, a=a*0.08); d.circle(x, y, rr, fill=fill, a=a, stroke=stroke, lw=lw)
    if label: d.text(x, y + size*0.36*scale, label, SERIF, size*scale, fg, a=a, anchor='c')

def edge_pts(p, q, r1=46, r2=46):
    (x1, y1), (x2, y2) = p, q; L = math.hypot(x2-x1, y2-y1) or 1; ux, uy = (x2-x1)/L, (y2-y1)/L
    return x1 + ux*r1, y1 + uy*r1, x2 - ux*(r2+3), y2 - uy*(r2+3)

def edge(d, p, q, a=1.0, prog=1.0, col=INK, lw=4, r=46, arrow=0.0, dash=None):
    sx, sy, ex, ey = edge_pts(p, q, r, r); d.line(sx, sy, ex, ey, col, a=a, lw=lw, prog=prog, dash=dash)
    if arrow > 0.002 and prog >= 0.999: d.arrowhead(sx, sy, ex, ey, col, a=a*arrow, size=24)

def focus_ring(d, t, frames, col=CLAY):
    """frames: [(time, (x,y,w,h)) or (time, None)]"""
    fr2 = []; last = None
    for tt, r in frames:
        if r is None: fr2.append((tt, tuple(list(last or (0, 0, 0, 0)) + [0.0])))
        else: fr2.append((tt, tuple(list(r) + [1.0]))); last = r
    cur = kf(t, fr2, dur=0.45)
    if cur is None or t < fr2[0][0]: return
    x, y, w, h, v = cur
    if v <= 0.01: return
    pulse = 1 + 0.03*math.sin(t*5); cx, cy = x + w/2, y + h/2; w2, h2 = w*pulse + 16, h*pulse + 16
    d.rrect(cx - w2/2 - 6, cy - h2/2 - 6, w2 + 12, h2 + 12, 22, fill=col, a=0.10*v); d.rrect(cx - w2/2, cy - h2/2, w2, h2, 18, stroke=col, a=0.95*v, lw=4)

def var_panel(d, t, x, y, items, a=1.0, w=380, title='variables'):
    """items: [(name, [(time, value_str), ...])]"""
    if a <= 0.002: return
    card(d, x, y, w, 76 + 70*len(items), a=a); d.text(x + 26, y + 44, title.upper(), SANSB, 18, MUTED, a=a)
    for i, (name, vals) in enumerate(items):
        yy = y + 98 + i*70; d.text(x + 26, yy, name, MONO, 30, INK, a=a)
        cur, prev, tc = None, None, -99
        for tt, v in vals:
            if t >= tt: prev, cur, tc = cur, v, tt
        if cur is None: continue
        k = ap(t, tc, 0.35); bx = x + w - 150
        d.rrect(bx - 10, yy - 38, 134, 54, 12, fill=mix(CLAY_SOFT, BG2, k), a=a)
        if prev is not None and k < 1: d.text(bx + 57, yy - 26*k, prev, MONO, 30, MUTED, a=a*(1-k), anchor='c')
        d.text(bx + 57, yy + 22*(1-k), cur, MONO, 30, CLAY_D, a=a*k, anchor='c')

def stick_geom(x, yb, s, point, point_a):
    tx, ty = point; sx, sy = x + 40*s, yb - 6*s
    ang = math.atan2(ty - sy, tx - sx); dist = math.hypot(tx - sx, ty - sy); arm = 62*s
    hx_, hy_ = sx + math.cos(ang)*arm*point_a, sy + math.sin(ang)*arm*point_a
    stick = clamp(dist - arm - 44, 0, 340) * point_a
    return sx, sy, hx_, hy_, hx_ + math.cos(ang)*stick, hy_ + math.sin(ang)*stick

def tutor_stick(d, t, x, y, s, point, point_a):
    if point is None or point_a <= 0.01: return
    yb = y + math.sin(t * 2.3) * 4 * s
    sx, sy, hx_, hy_, ex, ey = stick_geom(x, yb, s, point, point_a)
    d.line(sx, sy, hx_, hy_, CLAY_D, lw=20*s); d.line(hx_, hy_, ex, ey, hx('7A4E33'), lw=7*s, a=point_a)

def tutor(d, t, x, y, mouth, s=1.0, look=None, point=None, point_a=0.0, wave=0.0, happy=False):
    c = d.c; bob = math.sin(t * 2.3) * 4 * s; sq = 1 + mouth * 0.05; yb = y + bob
    c.save(); c.translate(x, y + 74*s); c.scale(1, 0.2); d.circle(0, 0, 66*s, fill=INK, a=0.11); c.restore()
    if point is not None and point_a > 0.01:
        g = stick_geom(x, yb, s, point, point_a); tx, ty = point
        d.circle(tx, ty, 17, stroke=CLAY, a=point_a*0.95, lw=3.5); d.circle(tx, ty, 26 + 4*math.sin(t*6), stroke=CLAY, a=point_a*0.3, lw=2)
        d.circle(g[2], g[3], 13*s, fill=CLAY_D)
    elif wave > 0.01:
        ang = -1.2 + math.sin(t*10)*0.45*wave; sx, sy = x + 52*s, yb - 4*s
        hx_, hy_ = sx + math.cos(ang)*58*s, sy + math.sin(ang)*58*s
        d.line(sx, sy, hx_, hy_, CLAY_D, lw=20*s); d.circle(hx_, hy_, 13*s, fill=CLAY_D)
    c.save(); c.translate(x, yb); c.scale(1/sq**0.5, sq)
    g = cairo.RadialGradient(-24*s, -30*s, 8*s, 0, 0, 82*s); g.add_color_stop_rgb(0, 0.93, 0.56, 0.42); g.add_color_stop_rgb(1, 0.80, 0.42, 0.29)
    c.new_sub_path(); c.arc(0, 0, 76*s, 0, 2*math.pi); c.set_source(g); c.fill(); c.restore()
    d.circle(x - 70*s, yb + 18*s, 15*s, fill=CLAY_D)
    c.save(); c.translate(x + 4*s, yb - 70*s); c.rotate(-0.1)
    d.rrect(-32*s, -6*s, 64*s, 22*s, 6*s, fill=INK)
    c.move_to(-62*s, -6*s); c.line_to(0, -30*s); c.line_to(62*s, -6*s); c.line_to(0, 14*s); c.close_path(); d.src(INK); c.fill()
    sw = math.sin(t*3.0) * 5 * s; d.line(38*s, -8*s, 44*s + sw*0.3, 26*s, GOLD, lw=3*s); d.circle(44*s + sw*0.3, 30*s, 6*s, fill=GOLD); c.restore()
    lx, ly = 0, 0
    if look is not None:
        ang = math.atan2(look[1] - (yb - 14*s), look[0] - x); lx, ly = math.cos(ang)*5*s, math.sin(ang)*4*s
    bp = t % 3.9; eh = 1.0 if bp > 0.15 else max(0.08, abs(bp - 0.075) / 0.075)
    for ex in (-25, 25):
        exx, eyy = x + ex*s, yb - 14*s
        if happy:
            c.new_sub_path(); c.arc(exx, eyy + 4*s, 10*s, math.pi*1.1, math.pi*1.9); d.src(INK); c.set_line_width(4.5*s); c.set_line_cap(cairo.LINE_CAP_ROUND); c.stroke()
        else:
            c.save(); c.translate(exx, eyy); c.scale(1, eh); d.circle(0, 0, 13*s, fill=WHITE)
            d.circle(lx, ly, 7*s, fill=INK); d.circle(lx + 2.5*s, ly - 2.5*s, 2.4*s, fill=WHITE); c.restore()
    for ex in (-45, 45): d.circle(x + ex*s, yb + 10*s, 10*s, fill=hx('F7A48A'), a=0.55)
    my = yb + 22*s
    if mouth > 0.08:
        c.save(); c.translate(x, my); c.scale(1, 0.25 + mouth*0.9); d.circle(0, 0, 14*s, fill=hx('5A1F14')); c.restore()
        c.save(); c.translate(x, my + 4*s*mouth); c.scale(1, 0.4); d.circle(0, 0, 7*s*mouth, fill=hx('E8857A')); c.restore()
    else:
        c.new_sub_path(); c.arc(x, my - 8*s, 13*s, 0.22*math.pi, 0.78*math.pi); d.src(hx('5A1F14')); c.set_line_width(4*s); c.set_line_cap(cairo.LINE_CAP_ROUND); c.stroke()

def chapter_card(d, t, n, title, sub):
    """Clay panel wipes in from the left, holds the title, wipes out to the right (0..1.5 s)."""
    if t > 1.6: return
    x0 = lerp(-W, 0, e_io(t / 0.38)) + lerp(0, W, e_io((t - 1.05) / 0.45))
    c = d.c; c.save(); c.translate(x0, 0)
    d.rrect(-60, -60, W + 120, H + 120, 0, fill=CLAY); d.rrect(W - 30, -60, 90, H + 120, 0, fill=CLAY_SOFT, a=0.9)
    k = e_out((t - 0.2) / 0.6)
    d.text(W/2, 460 + (1-k)*40, f'{n:02d}', SERIF, 140, CLAY_SOFT, a=k, anchor='c', italic=True)
    d.line(W/2 - 170*k, 512, W/2 + 170*k, 512, CARD, a=k, lw=3)
    d.text(W/2, 610 + (1-k)*24, title, SERIF, 76, CARD, a=k, anchor='c')
    if sub: d.text(W/2, 672, sub, SANS, 30, CLAY_SOFT, a=ap(t, 0.45), anchor='c')
    c.restore()

def chrome(d, t, n, title, total_n, header='STUDY SESSION'):
    a = ap(t, 1.25, 0.5)
    d.text(120, 86, header.upper(), SANSB, 19, MUTED, a=a)
    for i in range(total_n):
        d.circle(W - 120 - (total_n - 1 - i) * 22, 80, 5.5 if i + 1 == n else 4, fill=CLAY if i + 1 <= n else FAINT, a=a)
    d.line(120, 112, W - 120, 112, LINE, lw=2, a=a)
    if title: d.text(120, 188 + (1-a)*12, title, SERIF, 56, INK, a=a)

def captions(d, chunks, t):
    for ci, ch in enumerate(chunks):
        t0 = ch[0]['s'] - 0.12
        t1 = chunks[ci+1][0]['s'] - 0.12 if ci + 1 < len(chunks) else ch[-1]['e'] + 0.8
        if not (t0 <= t < t1): continue
        a = ap(t, t0, 0.15) * (1 - ap(t, t1 - 0.12, 0.12))
        if a <= 0.01: continue
        size = 31; d.font(SANS, size); sp = d.tw(' ')
        widths = [d.tw(w['t']) for w in ch]; total = sum(widths) + sp*(len(ch)-1)
        x = W/2 - total/2; y = 1006
        d.rrect(x - 34, y - 46, total + 68, 66, 33, fill=CARD, a=a*0.94, stroke=LINE, lw=2, shadow=True)
        for w, wd in zip(ch, widths):
            col = INK if t >= w['e'] else CLAY_D if t >= w['s'] else FAINT
            d.text(x, y, w['t'], SANS, size, col, a=a); x += wd + sp

def cam(t, frames, dur=1.1):
    """frames: [(time, (cx, cy, zoom))]; keep zoom 1.0-1.07."""
    return kf(t, frames, dur=dur) if frames else (W/2, H/2, 1.0)

def cam_map(p, cm):
    if p is None: return None
    cx, cy, z = cm; return ((p[0] - cx)*z + W/2, (p[1] - cy)*z + H/2)

def burst(d, t, t0, x, y, col=CLAY, n=18, spread=170, dur=1.1, seed=3):
    k = (t - t0) / dur
    if not (0 < k < 1): return
    rng = np.random.RandomState(seed)
    for i in range(n):
        ang = rng.uniform(0, 2*math.pi); sp = rng.uniform(0.5, 1.0)*spread
        px = x + math.cos(ang)*sp*e_out(k); py = y + math.sin(ang)*sp*e_out(k) + 120*k*k
        d.c.save(); d.c.translate(px, py); d.c.rotate(ang + k*6); d.rrect(-6, -3, 12, 6, 2, fill=[col, GOLD, SAGE, SKY][i % 4], a=1 - k); d.c.restore()

def trail_dot(d, x_fn, t, col=CLAY, n=6, gap=0.035, r=15):
    """x_fn(t) -> (x, y) or None; fading motion trail for a moving token."""
    for i in range(n, -1, -1):
        p = x_fn(t - i*gap)
        if p is None: continue
        a = 1 - i/(n+1); d.circle(p[0], p[1], r*(0.55 + 0.45*a), fill=col, a=a*(0.9 if i == 0 else 0.35))
```