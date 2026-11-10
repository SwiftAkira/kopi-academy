#!/usr/bin/env python3
"""Turn a finished lesson video into the files the site ships.

    python3 scripts/video_finish.py py-01 [--poster-at 12.5]

Reads private/video-work/<id>/ (final.mp4, script.json, words/sN.json, scenes/cNN.mp4, scenes.py)
and writes into content/<track>/<id>/:
    video.mp4      720p web copy (must stay under 25 MB)
    poster.jpg     a still from the video
    transcript.md  the script as plain text, without voice-direction tags
    captions.vtt   WebVTT captions built from the word timings
Only these four files are committed. The work directory stays private.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAX_MB = 25


def run(*cmd: str) -> str:
    return subprocess.check_output(cmd, text=True)


def duration(path: str) -> float:
    return float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path))


def clean(text: str) -> str:
    """Drop [direction tags] and tidy the spacing."""
    text = re.sub(r"\[[^\]]*\]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return re.sub(r"\s+([,.!?])", r"\1", text)


def stamp(t: float) -> str:
    h, rem = divmod(max(t, 0.0), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}"


def spoken_words(path: str) -> list[dict]:
    """Words of one chapter, without the bracketed direction tags the transcriber may echo."""
    out, in_tag = [], False
    for w in json.load(open(path))["words"]:
        if w.get("type", "word") != "word":
            continue
        tx = w["text"]
        if tx.startswith("[") or in_tag:
            in_tag = not tx.rstrip().endswith("]")
            continue
        out.append(w)
    return out


def caption_chunks(words: list[dict]) -> list[list[dict]]:
    """Same grouping as the burned-in captions: short lines that break at sentence ends and pauses."""
    chunks, cur = [], []
    for w in words:
        if cur:
            gap = w["start"] - cur[-1]["end"]
            end_p = cur[-1]["text"][-1] in ".?!"
            if len(cur) >= 11 or (end_p and len(cur) >= 4) or gap > 0.7 or (end_p and gap > 0.25):
                chunks.append(cur)
                cur = []
        cur.append(w)
    if cur:
        chunks.append(cur)
    return chunks


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("lesson")
    ap.add_argument("--poster-at", type=float, default=None, help="second of the final video to use as the poster")
    args = ap.parse_args()

    curriculum = json.load(open(os.path.join(ROOT, "content", "curriculum.json")))
    meta = next((l for l in curriculum["lessons"] if l["id"] == args.lesson), None)
    if not meta:
        print(f"Unknown lesson {args.lesson}")
        return 1
    work = os.path.join(ROOT, "private", "video-work", args.lesson)
    dest = os.path.join(ROOT, "content", meta["track"], args.lesson)
    final = os.path.join(work, "final.mp4")
    if not os.path.exists(final):
        print(f"No final.mp4 in {work}")
        return 1
    os.makedirs(dest, exist_ok=True)

    chapters = json.load(open(os.path.join(work, "script.json")))
    sys.path.insert(0, work)
    from scenes import CH  # noqa: E402  (chapter list: scene, title, subtitle, audio lead)

    # 1. web copy
    video = os.path.join(dest, "video.mp4")
    subprocess.check_call([
        "ffmpeg", "-v", "error", "-y", "-i", final, "-vf", "scale=-2:720", "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "28", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", video,
    ])
    size_mb = os.path.getsize(video) / 1024 / 1024

    # 2. poster
    total = duration(final)
    at = args.poster_at if args.poster_at is not None else min(total * 0.12, 20.0)
    subprocess.check_call([
        "ffmpeg", "-v", "error", "-y", "-ss", f"{at:.2f}", "-i", final, "-frames:v", "1", "-vf", "scale=-2:720",
        "-q:v", "4", os.path.join(dest, "poster.jpg"),
    ])

    # 3. transcript
    titles = [c[1] for c in CH]
    parts = []
    for i, text in enumerate(chapters):
        title = titles[i] if i < len(titles) and titles[i] else ("Introduction" if i == 0 else f"Part {i + 1}")
        parts.append(f"**{title}**\n\n{clean(text)}")
    with open(os.path.join(dest, "transcript.md"), "w", encoding="utf-8") as f:
        f.write("\n\n".join(parts) + "\n")

    # 4. captions from the word timings; each chapter starts where the previous chapter's clip ends
    cues: list[tuple[float, float, str]] = []
    offset = 0.0
    for i in range(len(chapters)):
        clip = os.path.join(work, "scenes", f"c{i + 1:02d}.mp4")
        lead = CH[i][3]
        for chunk in caption_chunks(spoken_words(os.path.join(work, "words", f"s{i + 1}.json"))):
            start = offset + lead + chunk[0]["start"]
            end = offset + lead + chunk[-1]["end"] + 0.25
            cues.append((start, end, " ".join(w["text"] for w in chunk)))
        offset += duration(clip)
    lines = ["WEBVTT", ""]
    n = len(cues)
    for k, (start, end, text) in enumerate(cues):
        if k + 1 < n:
            end = min(end, cues[k + 1][0] - 0.02)  # a cue never overlaps the next one
        lines += [str(k + 1), f"{stamp(start)} --> {stamp(max(end, start + 0.3))}", text, ""]
    with open(os.path.join(dest, "captions.vtt"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"{args.lesson}: {total:.0f} s, video.mp4 {size_mb:.1f} MB, poster at {at:.1f} s, {n} caption cues")
    if size_mb > MAX_MB:
        print(f"FAIL  video.mp4 is over {MAX_MB} MB")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
