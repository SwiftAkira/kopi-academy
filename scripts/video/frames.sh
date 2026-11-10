#!/usr/bin/env bash
# Grab four frames of final.mp4 into check/sheet.jpg. Usage: bash ../_engine/frames.sh 10 70 150 215
set -euo pipefail
mkdir -p check
for t in "$@"; do ffmpeg -v error -y -ss "$t" -i final.mp4 -frames:v 1 -vf scale=960:-2 "check/f$t.jpg"; done
python3 - "$@" <<'PY'
import sys
from PIL import Image
ims = [Image.open(f'check/f{t}.jpg') for t in sys.argv[1:]]
S = Image.new('RGB', (1920, 540 * ((len(ims) + 1) // 2)), 'white')
for i, im in enumerate(ims): S.paste(im, ((i % 2) * 960, (i // 2) * 540))
S.save('check/sheet.jpg', quality=85)
PY
