#!/usr/bin/env bash
# Render every chapter with two workers, then assemble final.mp4.
# Usage (inside a work directory): bash ../_engine/render_all.sh "3 1" "4 2"
set -euo pipefail
# Lora and Inter for the engine: point FONTCONFIG_FILE at a fontconfig file that includes them.
export FONTCONFIG_FILE="${FONTCONFIG_FILE:-$(cd "$(dirname "$0")" && pwd)/fonts.conf}"
python3 render.py all $1 > render_a.log 2>&1 &
python3 render.py all $2 > render_b.log 2>&1 &
wait
cat render_a.log render_b.log
bash "$(dirname "$0")/assemble.sh"
