// upstream skills/ merges must not overwrite HAND_OWNED skill files; PATHS_ONLY merges apply path rules.
// run: node --test scripts/port-upstream-hand-owned.test.mjs
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  readdirSync,
  copyFileSync,
} from "node:fs"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { execFileSync } from "node:child_process"

const REPO = join(fileURLToPath(new URL(".", import.meta.url)), "..")

function copyTrackedTree(root) {
  const dir = mkdtempSync(join(tmpdir(), "kru-port-upstream-"))
  for (const f of execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean)) {
    const dest = join(dir, f)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(join(root, f), dest)
  }
  return dir
}

const UPDATE_POISON = `---
name: update
description: upstream merge noise
---

Run \`claude plugin eval\` and read \${CLAUDE_PLUGIN_ROOT}/agents/foo.md.
`

const EVAL_UPSTREAM = `---
name: eval-review
description: upstream eval merge
---

UPSTREAM-FIX-MARKER

Read \${CLAUDE_PLUGIN_ROOT}/agents/planner.md. Reproduced on Claude Code 2.1.284.
`

test("HAND_OWNED update stays byte-identical; PATHS_ONLY eval-review merges with path rewrite", (t) => {
  const root = copyTrackedTree(REPO)
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const update = join(root, "skill/kru-update/SKILL.md")
  const evalSkill = join(root, "skill/kru-eval-review/SKILL.md")
  const beforeUpdate = readFileSync(update)
  mkdirSync(join(root, "skills/update"), { recursive: true })
  mkdirSync(join(root, "skills/eval-review"), { recursive: true })
  writeFileSync(join(root, "skills/update/SKILL.md"), UPDATE_POISON)
  writeFileSync(join(root, "skills/eval-review/SKILL.md"), EVAL_UPSTREAM)
  execFileSync("node", ["scripts/port.mjs"], { cwd: root, stdio: "pipe" })
  assert.equal(readFileSync(update).compare(beforeUpdate), 0)
  const evalText = readFileSync(evalSkill, "utf8")
  assert.match(evalText, /UPSTREAM-FIX-MARKER/)
  assert.match(evalText, /Claude Code 2\.1\.284/)
  assert.doesNotMatch(evalText, /\$\{CLAUDE_PLUGIN_ROOT\}/)
  assert.match(evalText, /\{KRU_HOME\}\/agent\/kru\/planner\.md/)
  assert.equal(existsSync(join(root, "skills")), false)
})

test("--check reports leftover skills/claude-code-delegation/", (t) => {
  const root = copyTrackedTree(REPO)
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const skills = join(root, "skills")
  const drop = join(skills, "claude-code-delegation")
  mkdirSync(drop, { recursive: true })
  writeFileSync(join(drop, "SKILL.md"), UPDATE_POISON)
  let err
  try {
    execFileSync("node", ["scripts/port.mjs", "--check"], { cwd: root, stdio: "pipe" })
  } catch (e) {
    err = e
  }
  assert.ok(err, "expected --check to fail")
  const out = `${err.stdout ?? ""}${err.stderr ?? ""}`
  assert.match(out, /skills\/claude-code-delegation\//)
  assert.equal(readdirSync(skills).includes("claude-code-delegation"), true)
})
