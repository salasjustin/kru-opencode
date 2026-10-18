// relative skill links must resolve exactly from the linking file (no kru- alias fallback).
// run: node --test scripts/verify-layout-links.test.mjs
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { join, dirname, resolve, normalize } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..")

test("from skill/kru-roster, ../reliable-work/SKILL.md does not exist on disk", () => {
  const from = join(ROOT, "skill/kru-roster/request.md")
  const bad = normalize(resolve(dirname(from), "..", "reliable-work", "SKILL.md"))
  assert.equal(existsSync(bad), false)
  const good = normalize(resolve(dirname(from), "..", "kru-reliable-work", "SKILL.md"))
  assert.equal(existsSync(good), true)
})
