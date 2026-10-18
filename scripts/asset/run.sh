#!/bin/bash
# the asset seats' node deps (sharp, @google/genai, tsx) and the rembg venv live in
# the plugin's data dir, not beside this script. claude code auto-installs a root
# package.json + lockfile into every cached plugin version — 65 MB a version for
# two seats that rarely run — while ${CLAUDE_PLUGIN_DATA} survives updates. so the
# manifest sits down here, out of the root, and installs once, on first use.
#
# the generator is copied into the data dir too: an ESM import resolves next to the
# importing file, never through NODE_PATH, and the rembg venv it bootstraps lands
# beside it.
#
#   run.sh gen-asset <flags…>   designer-library generator
#   run.sh node <args…>         node with the deps on NODE_PATH — CommonJS
#                               require('sharp') only, for brand-marks rasters
#   run.sh dir                  print the deps dir
set -euo pipefail
src=$(cd "$(dirname "$0")" && pwd)
data="${CLAUDE_PLUGIN_DATA:-$HOME/.claude/plugins/data/kru-kru}/asset"
mkdir -p "$data"

# lockfile drift is the install trigger; gen-asset.ts is copied on any change
if ! cmp -s "$src/package-lock.json" "$data/package-lock.json" || [ ! -d "$data/node_modules" ]; then
  command -v npm >/dev/null 2>&1 || { echo "kru asset: npm not on PATH — install Node.js" >&2; exit 69; }
  cp "$src/package.json" "$src/package-lock.json" "$data/"
  echo "kru asset: installing deps into $data (first run or plugin update)…" >&2
  npm ci --prefix "$data" --no-audit --no-fund >&2
fi
cmp -s "$src/gen-asset.ts" "$data/gen-asset.ts" || cp "$src/gen-asset.ts" "$data/"

cmd=${1:-}
[ $# -gt 0 ] && shift
case "$cmd" in
  gen-asset) exec "$data/node_modules/.bin/tsx" "$data/gen-asset.ts" "$@" ;;
  node) NODE_PATH="$data/node_modules${NODE_PATH:+:$NODE_PATH}" exec node "$@" ;;
  dir) printf '%s\n' "$data" ;;
  *) echo "usage: run.sh gen-asset <flags…> | node <args…> | dir" >&2; exit 64 ;;
esac
