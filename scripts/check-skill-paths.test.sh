#!/bin/bash
# Path backticks: glued prose and missing paths must fail with named tokens reported.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
check="$here/check-skill-paths.sh"
sandbox=$(mktemp -d)
trap 'rm -rf "$sandbox"' EXIT

fixture="$sandbox/garbled-fixture.md"
cat > "$fixture" << 'EOF'
# fixture — must fail path check
- `skill/kru-lead/SKILL.md the bundled phrase`
- `{KRU_HOME}/kru/references/design-spec.md extra words`
- `references/not-a-real-file.md`
- `skillsthe-vendored-tdd-skill/foo`
EOF

if CHECK_SKILL_PATHS_EXTRA="$fixture" bash "$check" >/dev/null 2>&1; then
  echo "FAIL: garbled fixture should fail check"
  exit 1
fi
out=$(CHECK_SKILL_PATHS_EXTRA="$fixture" bash "$check" 2>&1 || true)
for needle in \
  'skill/kru-lead/SKILL.md the bundled phrase' \
  '{KRU_HOME}/kru/references/design-spec.md extra words' \
  'references/not-a-real-file.md' \
  'skillsthe-vendored-tdd-skill/foo'
do
  echo "$out" | grep -qF "garbled path token \`$needle\`" || echo "$out" | grep -qF "missing path \`$needle\`" || {
    echo "FAIL: expected output to name: $needle"
    echo "$out"
    exit 1
  }
done
echo "check-skill-paths.test: PASS"
