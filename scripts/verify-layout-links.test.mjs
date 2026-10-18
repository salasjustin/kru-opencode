// relative skill links must resolve exactly from the linking file (no kru- alias fallback).
// run: node --test scripts/verify-layout-links.test.mjs
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  copyFileSync,
  symlinkSync,
} from "node:fs"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { execFileSync } from "node:child_process"

const REPO = join(fileURLToPath(new URL(".", import.meta.url)), "..")

function copyTrackedTree(root) {
  const dir = mkdtempSync(join(tmpdir(), "kru-layout-links-"))
  for (const f of execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean)) {
    const dest = join(dir, f)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(join(root, f), dest)
  }
  symlinkSync(join(root, "node_modules"), join(dir, "node_modules"))
  return dir
}

function runVerifyTree(root) {
  return execFileSync("node", ["scripts/verify-tree.mjs"], { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] })
}

test("verify-tree passes on a clean copy of the tree", (t) => {
  const root = copyTrackedTree(REPO)
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const out = runVerifyTree(root)
  assert.match(out, /ok\s+layout/)
  assert.doesNotMatch(out, /FAIL\s+layout/)
})

test("broken ../reliable-work/SKILL.md link fails the layout gate", (t) => {
  const root = copyTrackedTree(REPO)
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const request = join(root, "skill/kru-roster/request.md")
  writeFileSync(request, `${readFileSync(request, "utf8")}\n[bad](../reliable-work/SKILL.md)\n`)
  let err
  try {
    runVerifyTree(root)
  } catch (e) {
    err = e
  }
  assert.ok(err, "expected verify-tree to fail")
  const out = `${err.stdout ?? ""}${err.stderr ?? ""}`
  assert.match(out, /relative link \.\.\/reliable-work\/SKILL\.md does not resolve/)
  assert.match(out, /FAIL\s+layout/)
})
