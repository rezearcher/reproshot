#!/usr/bin/env bash
# Package the extension into an upload-ready zip for the Chrome Web Store.
# Usage: bash scripts/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."

VER=$(python3 -I -c "import json;print(json.load(open('extension/manifest.json'))['version'])")
OUT="dist/reproshot-v${VER}.zip"
mkdir -p dist
rm -f "$OUT"

# Refresh icons so the zip never ships stale art.
python3 -I scripts/gen_icons.py >/dev/null

# Validate manifest + JS before packaging.
python3 -I -c "import json;json.load(open('extension/manifest.json'))"
for f in extension/background.js extension/popup.js extension/editor.js; do
  node --check "$f"
done

cd extension
zip -r -q "../${OUT}" . -x '*.DS_Store'
cd ..

echo "Built ${OUT}"
unzip -l "$OUT" | tail -n +2
