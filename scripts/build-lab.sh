#!/bin/sh
# Builds JupyterLite into dist/lab with every practice notebook as content.
# "Solve in browser" on a lesson opens /nb/<id>/, which frames /lab/notebooks/index.html?path=<id>.ipynb
# Run after `astro build` (that step empties dist/).
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
if [ -x "$ROOT/.venv/bin/jupyter" ]; then PATH="$ROOT/.venv/bin:$PATH"; fi

CONTENTS="$ROOT/.cache/lab-contents"
rm -rf "$CONTENTS" "$ROOT/dist/lab"
mkdir -p "$CONTENTS"
count=0
for nb in "$ROOT"/content/*/*/practice.ipynb; do
  [ -f "$nb" ] || continue
  id=$(basename "$(dirname "$nb")")
  cp "$nb" "$CONTENTS/$id.ipynb"
  count=$((count + 1))
done
echo "JupyterLite: $count notebooks"

cd "$ROOT/lab"
jupyter lite build --contents "$CONTENTS" --output-dir "$ROOT/dist/lab"
rm -f "$ROOT/lab/.jupyterlite.doit.db"
du -sh "$ROOT/dist/lab" | awk '{print "JupyterLite size: " $1}'
