#!/bin/bash
# every static check this fork has, in one run — what CI runs on a pull request
# and what to run before a commit. no network and no model: scripts/smoke.sh is
# the live half. exits non-zero when any check fails, after running them all.
# run: bash scripts/verify.sh
set -u
repo=$(cd "$(dirname "$0")/.." && pwd)
cd "$repo" || exit 1

names=() states=()
record() { names+=("$1"); states+=("$2"); }

# step <name> <command...> — runs it, keeps the output only when it fails
step() {
  local name=$1; shift
  local out
  printf '\n== %s\n' "$name"
  if out=$("$@" 2>&1); then
    printf '%s\n' "$out" | tail -n 8
    record "$name" ok
  else
    printf '%s\n' "$out" | tail -n 60
    record "$name" FAIL
  fi
}

# --- prerequisites --------------------------------------------------------
missing=""
command -v node >/dev/null 2>&1 || missing="$missing node"
command -v jq >/dev/null 2>&1 || missing="$missing jq"
command -v git >/dev/null 2>&1 || missing="$missing git"
[ -n "$missing" ] && { echo "verify: missing on PATH:$missing" >&2; exit 1; }
node_major=$(node -p 'process.versions.node.split(".")[0]')
[ "$node_major" -ge 22 ] || { echo "verify: node 22+ required, found $(node --version)" >&2; exit 1; }
# yaml for the frontmatter parse, typescript + the plugin types for the typecheck
if [ ! -d node_modules/yaml ] || [ ! -d node_modules/typescript ] || [ ! -d node_modules/@opencode-ai/plugin ]; then
  echo "verify: installing dev dependencies (npm ci)"
  npm ci --no-audit --no-fund --loglevel=error || { echo "verify: npm ci failed" >&2; exit 1; }
fi

syntax() {
  local f rc=0
  while IFS= read -r f; do bash -n "$f" || { echo "bash -n: $f"; rc=1; }; done < <(git ls-files -co --exclude-standard '*.sh')
  while IFS= read -r f; do node --check "$f" || { echo "node --check: $f"; rc=1; }; done < <(git ls-files -co --exclude-standard '*.mjs')
  echo "$(git ls-files -co --exclude-standard '*.sh' | wc -l | tr -d ' ') shell + $(git ls-files -co --exclude-standard '*.mjs' | wc -l | tr -d ' ') node scripts parse"
  return $rc
}

step "port normalized (port.mjs --check)" node scripts/port.mjs --check
step "script syntax (bash -n, node --check)" syntax
step "plugin typecheck (tsc plugin/kru.ts)" npx --no-install tsc -p tsconfig.json
step "store resolver (kru-store.test.sh)" bash scripts/kru-store.test.sh
step "store move (kru-store-migrate.test.mjs)" node --test scripts/kru-store-migrate.test.mjs
step "port upstream hand-owned (port-upstream-hand-owned.test.mjs)" node --test scripts/port-upstream-hand-owned.test.mjs
step "layout relative links (verify-layout-links.test.mjs)" node --test scripts/verify-layout-links.test.mjs
step "hooks on an installed tree (hooks.test.sh)" bash scripts/hooks.test.sh
step "tree: frontmatter, json/yaml, version, seats, leftovers" node scripts/verify-tree.mjs

# --- summary ----------------------------------------------------------------
failed=0
printf '\n== summary\n'
for i in "${!names[@]}"; do
  printf '  %-4s %s\n' "${states[$i]}" "${names[$i]}"
  [ "${states[$i]}" = ok ] || failed=$((failed + 1))
done
if [ "$failed" -gt 0 ]; then
  printf '\nverify: %d of %d checks failed\n' "$failed" "${#names[@]}"
  exit 1
fi
printf '\nverify: all %d checks passed\n' "${#names[@]}"
