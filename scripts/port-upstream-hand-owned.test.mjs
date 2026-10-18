// upstream skills/ merges must not overwrite fork-owned skill files.
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

const POISON = `---
name: update
description: upstream merge noise
---

Run \`claude plugin eval\` and read \${CLAUDE_PLUGIN_ROOT}/agents/foo.md.
`

test("skills/update and skills/eval-review do not replace HAND_OWNED / PATHS_ONLY files", () => {
  const beforeUpdate = readFileSync(UPDATE)
  const beforeEval = readFileSync(EVAL)
  mkdirSync(join(SKILLS, "update"), { recursive: true })
  mkdirSync(join(SKILLS, "eval-review"), { recursive: true })
  writeFileSync(join(SKILLS, "update/SKILL.md"), POISON)
  writeFileSync(join(SKILLS, "eval-review/SKILL.md"), POISON.replace("name: update", "name: eval-review"))
  try {
    execFileSync("node", ["scripts/port.mjs"], { cwd: ROOT, stdio: "pipe" })
    assert.equal(readFileSync(UPDATE).compare(beforeUpdate), 0)
    assert.equal(readFileSync(EVAL).compare(beforeEval), 0)
    assert.equal(existsSync(SKILLS), false)
  } finally {
    if (existsSync(SKILLS)) rmSync(SKILLS, { recursive: true, force: true })
  }
})

test("--check reports leftover skills/claude-code-delegation/", () => {
  const drop = join(SKILLS, "claude-code-delegation")
  mkdirSync(drop, { recursive: true })
  writeFileSync(join(drop, "SKILL.md"), POISON)
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
