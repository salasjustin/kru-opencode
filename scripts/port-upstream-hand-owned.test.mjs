// upstream skills/ merges must not overwrite HAND_OWNED skill files; PATHS_ONLY merges apply path rules.
// run: node --test scripts/port-upstream-hand-owned.test.mjs
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  readdirSync,
} from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { execFileSync } from "node:child_process"

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..")
const UPDATE = join(ROOT, "skill/kru-update/SKILL.md")
const EVAL = join(ROOT, "skill/kru-eval-review/SKILL.md")
const SKILLS = join(ROOT, "skills")

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

test("HAND_OWNED update stays byte-identical; PATHS_ONLY eval-review merges with path rewrite", () => {
  const beforeUpdate = readFileSync(UPDATE)
  const beforeEval = readFileSync(EVAL)
  mkdirSync(join(SKILLS, "update"), { recursive: true })
  mkdirSync(join(SKILLS, "eval-review"), { recursive: true })
  writeFileSync(join(SKILLS, "update/SKILL.md"), UPDATE_POISON)
  writeFileSync(join(SKILLS, "eval-review/SKILL.md"), EVAL_UPSTREAM)
  try {
    execFileSync("node", ["scripts/port.mjs"], { cwd: ROOT, stdio: "pipe" })
    assert.equal(readFileSync(UPDATE).compare(beforeUpdate), 0)
    const evalText = readFileSync(EVAL, "utf8")
    assert.match(evalText, /UPSTREAM-FIX-MARKER/)
    assert.match(evalText, /Claude Code 2\.1\.284/)
    assert.doesNotMatch(evalText, /\$\{CLAUDE_PLUGIN_ROOT\}/)
    assert.match(evalText, /\{KRU_HOME\}\/agent\/kru\/planner\.md/)
    assert.equal(existsSync(SKILLS), false)
  } finally {
    writeFileSync(EVAL, beforeEval)
    if (existsSync(SKILLS)) rmSync(SKILLS, { recursive: true, force: true })
    execFileSync("node", ["scripts/port.mjs"], { cwd: ROOT, stdio: "pipe" })
  }
})

test("--check reports leftover skills/claude-code-delegation/", () => {
  const drop = join(SKILLS, "claude-code-delegation")
  mkdirSync(drop, { recursive: true })
  writeFileSync(join(drop, "SKILL.md"), UPDATE_POISON)
  try {
    let err
    try {
      execFileSync("node", ["scripts/port.mjs", "--check"], { cwd: ROOT, stdio: "pipe" })
    } catch (e) {
      err = e
    }
    assert.ok(err, "expected --check to fail")
    const out = `${err.stdout ?? ""}${err.stderr ?? ""}`
    assert.match(out, /skills\/claude-code-delegation\//)
    assert.equal(readdirSync(SKILLS).includes("claude-code-delegation"), true)
  } finally {
    rmSync(SKILLS, { recursive: true, force: true })
  }
})
