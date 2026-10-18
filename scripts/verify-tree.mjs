#!/usr/bin/env node
// the static checks over the tree itself, for scripts/verify.sh: every agent,
// skill and command parses the way opencode's loader will read it, the version
// and seat count agree everywhere they're stated, the read-only seats can't
// edit, and no claude-code vocabulary survived the port outside the files that
// talk about claude code on purpose. each check prints one line; any failure
// exits 1.

import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join, dirname, relative, basename, resolve, normalize } from "node:path"
import { fileURLToPath } from "node:url"
import { execFileSync } from "node:child_process"
import { parse as parseYaml, parseAllDocuments } from "yaml"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const SEAT_COUNT = 37
// upstream's tools: allowlist carries no Edit/Write for these; the port turns
// that into `"*": deny` with no edit key (scripts/port.mjs → portAgents)
const READ_ONLY = [
  "accessibility-reviewer",
  "architecture-reviewer",
  "code-reviewer",
  "conversion-copywriter",
  "dispatch-auditor",
  "planner",
  "ux-auditor",
  "visual-reviewer",
]
const WRITE_PERMS = ["edit", "write", "patch", "multiedit", "apply_patch", "*"]
const PERMISSION_KEYS = new Set([
  "*", "read", "edit", "glob", "grep", "list", "bash", "task", "skill", "lsp", "todoread", "todowrite",
  "webfetch", "websearch", "codesearch", "question", "external_directory", "doom_loop",
])
const MCP_KEY = /^(context7|chrome-devtools)_[a-z0-9_-]+$/

const results = []
const notes = []
const fail = (check, msg) => results.push([check, msg])
const rel = (p) => relative(ROOT, p)

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(e.name) || e.name.startsWith(".venv")) continue
    const p = join(dir, e.name)
    e.isDirectory() ? walk(p, out) : out.push(p)
  }
  return out
}
const files = walk(ROOT)
const read = (p) => readFileSync(p, "utf8")

// --- frontmatter -----------------------------------------------------------
function frontmatter(path) {
  const m = read(path).match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) return fail("frontmatter", `${rel(path)}: no frontmatter block`)
  try {
    const fm = parseYaml(m[1])
    if (!fm || typeof fm !== "object") return fail("frontmatter", `${rel(path)}: frontmatter is not a mapping`)
    return fm
  } catch (err) {
    fail("frontmatter", `${rel(path)}: invalid YAML — ${String(err.message).split("\n")[0]}`)
  }
}
const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0

const seats = readdirSync(join(ROOT, "agent", "kru")).filter((f) => f.endsWith(".md")).map((f) => basename(f, ".md"))
const agents = new Map()
for (const seat of seats) {
  const path = join(ROOT, "agent", "kru", `${seat}.md`)
  const fm = frontmatter(path)
  if (!fm) continue
  agents.set(seat, fm)
  if (!nonEmpty(fm.description)) fail("frontmatter", `${rel(path)}: no description`)
  if (fm.mode !== "subagent") fail("frontmatter", `${rel(path)}: mode is ${fm.mode}, want subagent`)
  if (!/^opencode\/[a-z0-9.-]+$/.test(String(fm.model))) fail("frontmatter", `${rel(path)}: model ${fm.model} is not a pinned opencode/<id>`)
  if (fm.temperature !== undefined && typeof fm.temperature !== "number") fail("frontmatter", `${rel(path)}: temperature is not a number`)
  if (fm.permission !== undefined) {
    if (typeof fm.permission !== "object") fail("frontmatter", `${rel(path)}: permission is not a mapping`)
    else
      for (const [k, v] of Object.entries(fm.permission)) {
        if (!PERMISSION_KEYS.has(k) && !MCP_KEY.test(k)) fail("frontmatter", `${rel(path)}: unknown permission key ${k}`)
        // a key may carry a pattern → action mapping (external_directory does)
        const actions = v && typeof v === "object" ? Object.values(v) : [v]
        if (!actions.every((a) => ["allow", "deny", "ask"].includes(a))) fail("frontmatter", `${rel(path)}: permission ${k}: ${JSON.stringify(v)}`)
      }
  }
  for (const k of ["tools", "memory", "effort", "experimental"])
    if (k in fm) fail("frontmatter", `${rel(path)}: claude-only key \`${k}\` survived the port`)
}
{
  const fm = frontmatter(join(ROOT, "agent", "kru.md"))
  if (fm && (fm.mode !== "primary" || !nonEmpty(fm.description) || !nonEmpty(fm.model)))
    fail("frontmatter", "agent/kru.md: the lead needs mode: primary, a description and a model")
}

const skills = readdirSync(join(ROOT, "skill")).filter((d) => d.startsWith("kru-"))
for (const dir of skills) {
  const path = join(ROOT, "skill", dir, "SKILL.md")
  if (!existsSync(path)) {
    fail("frontmatter", `skill/${dir}: no SKILL.md`)
    continue
  }
  const fm = frontmatter(path)
  if (!fm) continue
  // opencode's loader: name matches its directory, lower-case and hyphens
  if (fm.name !== dir) fail("frontmatter", `${rel(path)}: name ${fm.name} ≠ directory ${dir}`)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(fm.name)) || String(fm.name).length > 64)
    fail("frontmatter", `${rel(path)}: name is not 1–64 lower-case words joined by hyphens`)
  if (!nonEmpty(fm.description)) fail("frontmatter", `${rel(path)}: no description`)
  else if (fm.description.length > 1024) fail("frontmatter", `${rel(path)}: description is ${fm.description.length} chars (max 1024)`)
}

const commands = readdirSync(join(ROOT, "command", "kru")).filter((f) => f.endsWith(".md"))
for (const f of commands) {
  const path = join(ROOT, "command", "kru", f)
  const fm = frontmatter(path)
  if (!fm) continue
  if (!nonEmpty(fm.description)) fail("frontmatter", `${rel(path)}: no description`)
  if (fm.agent !== "kru") fail("frontmatter", `${rel(path)}: agent is ${fm.agent}, want kru`)
  const skill = read(path).match(/Load the `(kru-[a-z0-9-]+)` skill/)?.[1]
  if (!skill || !skills.includes(skill)) fail("frontmatter", `${rel(path)}: loads no skill on the tree (${skill})`)
}

// --- json + yaml ------------------------------------------------------------
for (const p of files) {
  if (p.endsWith(".json")) {
    try {
      JSON.parse(read(p))
    } catch (err) {
      fail("json/yaml", `${rel(p)}: ${err.message}`)
    }
  } else if (/\.ya?ml$/.test(p)) {
    for (const doc of parseAllDocuments(read(p)))
      if (doc.errors.length) fail("json/yaml", `${rel(p)}: ${doc.errors[0].message.split("\n")[0]}`)
  }
}

// --- version ----------------------------------------------------------------
{
  const version = read(join(ROOT, "VERSION")).trim()
  const pkg = JSON.parse(read(join(ROOT, "package.json")))
  if (!/^\d+\.\d+\.\d+\+kru\d+\.\d+\.\d+$/.test(version)) fail("version", `VERSION ${version} is not <fork>+kru<upstream>`)
  if (pkg.version !== version) fail("version", `package.json version ${pkg.version} ≠ VERSION ${version}`)
  const lockPath = join(ROOT, "package-lock.json")
  if (existsSync(lockPath)) {
    const lock = JSON.parse(read(lockPath))
    if (lock.version !== version || lock.packages?.[""]?.version !== version)
      fail("version", `package-lock.json version ${lock.version} ≠ VERSION ${version} (run npm install)`)
  }
  const roster = read(join(ROOT, "ROSTER.md")).match(/^# Roster — v(\S+)/m)?.[1]
  if (roster !== version) fail("version", `ROSTER.md header v${roster} ≠ VERSION ${version}`)
  for (const p of files.filter((f) => /\.md$/.test(f))) {
    for (const m of read(p).matchAll(/\bv?(\d+\.\d+\.\d+)\+kru(\d+\.\d+\.\d+)\b/g))
      if (m[0].replace(/^v/, "") !== version) fail("version", `${rel(p)}: names ${m[0]}, VERSION is ${version}`)
  }
  // the upstream half of the pin is what the last merge brought in. a clone
  // with the upstream remote fetched can check it; CI's checkout can't, and
  // says so rather than passing quietly
  const pin = version.split("+kru")[1]
  const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
  let merged = null
  try {
    merged = git("show", `${git("merge-base", "HEAD", "upstream/main")}:VERSION`)
  } catch {}
  if (merged === null) notes.push("upstream pin not checked (no upstream/main here)")
  else if (merged !== pin) fail("version", `VERSION pins kru ${pin}, the upstream commit merged in is ${merged}`)
}

// --- seats ------------------------------------------------------------------
{
  if (seats.length !== SEAT_COUNT) fail("seats", `agent/kru/ holds ${seats.length} seats, want ${SEAT_COUNT}`)
  const pkg = JSON.parse(read(join(ROOT, "package.json")))
  const claimed = [
    ["package.json description", pkg.description],
    ["README.md", read(join(ROOT, "README.md"))],
  ]
  for (const [where, text] of claimed) {
    const n = Number(text.match(/(\d+) specialist subagents/)?.[1])
    if (n !== seats.length) fail("seats", `${where} says ${n} specialist subagents, the tree has ${seats.length}`)
  }
  // every seat has a roster row, and every roster row names a seat
  const roster = read(join(ROOT, "ROSTER.md"))
  const section = roster.split(/^## Current specialists.*$/m)[1]?.split(/^## /m)[0] ?? ""
  const rows = [...section.matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map((m) => m[1])
  for (const s of seats) if (!rows.includes(s)) fail("seats", `${s}: no ROSTER.md → Current specialists row`)
  for (const r of rows) if (!seats.includes(r)) fail("seats", `ROSTER.md row \`${r}\` names no agent/kru/${r}.md`)
  // the read-only set, both ways: each listed seat denies by default and allows
  // no write tool, and no other seat looks read-only by accident
  const readOnly = (fm) =>
    fm.permission?.["*"] === "deny" && !WRITE_PERMS.some((k) => k !== "*" && fm.permission?.[k] === "allow")
  for (const s of READ_ONLY) {
    const fm = agents.get(s)
    if (!fm) fail("seats", `read-only seat ${s} is missing`)
    else if (!readOnly(fm)) fail("seats", `${s} is a read-only seat but its permission block allows writing`)
  }
  for (const [s, fm] of agents)
    if (readOnly(fm) && !READ_ONLY.includes(s)) fail("seats", `${s} can't edit but isn't on the read-only list — update READ_ONLY or its permission`)
  // an allowlist's `"*": deny` denies external_directory too, which would cut
  // the seat off from the install dir, the store and the review-report dir —
  // the paths its prompt sends it to (scripts/port.mjs → EXTERNAL)
  const EXTERNAL = ["{KRU_HOME}/**", "{KRU_STORE}/**", "{KRU_TMP}/kru-review/**", "/tmp/kru-review/**"]
  for (const [s, fm] of agents) {
    if (fm.permission?.["*"] !== "deny") continue
    const ext = fm.permission.external_directory
    const missing = EXTERNAL.filter((p) => ext?.[p] !== "allow")
    if (missing.length) fail("seats", `${s}: denies by default but its external_directory allows no ${missing.join(", ")}`)
    const extra = Object.keys(ext ?? {}).filter((p) => !EXTERNAL.includes(p))
    if (extra.length) fail("seats", `${s}: external_directory reaches past the team's paths: ${extra.join(", ")}`)
  }
  // the handoff gate's own read-only test is a grep over the same block, put
  // there by a port rule (scripts/port.mjs → SH_REWRITES). an upstream reword
  // the rule misses leaves the gate on upstream's tools: grep, which no ported
  // seat carries — so the hook has to hold the ported line, and that line has
  // to agree with the parse above
  const gate = read(join(ROOT, "hooks", "check-handoff.sh"))
  const GATE_LINE = `grep -q '^  "\\*": deny' "$plugin_root/agent/kru/$seat.md" && ! grep -q '^  edit: allow' "$plugin_root/agent/kru/$seat.md" && readonly_seat=true`
  if (!gate.includes(GATE_LINE)) fail("seats", "hooks/check-handoff.sh no longer carries the ported read-only grep (scripts/port.mjs → SH_REWRITES)")
  if (/\^tools:/.test(gate)) fail("seats", "hooks/check-handoff.sh still reads a tools: line, which no ported seat has")
  for (const [s] of agents) {
    const raw = read(join(ROOT, "agent", "kru", `${s}.md`))
    const grepSays = /^ {2}"\*": deny$/m.test(raw) && !/^ {2}edit: allow$/m.test(raw)
    if (grepSays !== READ_ONLY.includes(s)) fail("seats", `${s}: check-handoff.sh's read-only grep disagrees with the permission block`)
  }
}

// --- layout: no upstream skills/ tree; skill/kru-* links resolve -----------
{
  const skillsTop = join(ROOT, "skills")
  if (existsSync(skillsTop)) {
    const entries = readdirSync(skillsTop).filter((e) => !e.startsWith("."))
    if (entries.length)
      fail("layout", `skills/ must be empty after port (still has ${entries.join(", ")}) — run node scripts/port.mjs`)
  }
  const skillDirs = new Set(skills)
  for (const p of files.filter((f) => f.endsWith(".md"))) {
    const text = read(p)
    for (const m of text.matchAll(/skill\/kru-([a-z0-9-]+)(?:\/|(?![a-z0-9-]))/g)) {
      const dir = `kru-${m[1]}`
      if (!skillDirs.has(dir)) fail("layout", `${rel(p)}: links skill/${dir} but skill/${dir}/ is missing`)
    }
    for (const m of text.matchAll(/\]\(\.\.\/([a-z0-9-]+)\/SKILL\.md\)/g)) {
      const bare = m[1]
      const prefixed = bare.startsWith("kru-") ? bare : `kru-${bare}`
      const candidates = [
        normalize(resolve(dirname(p), "..", bare, "SKILL.md")),
        join(ROOT, "skill", prefixed, "SKILL.md"),
        join(ROOT, "skill", bare, "SKILL.md"),
      ]
      if (!candidates.some((t) => existsSync(t)))
        fail(
          "layout",
          `${rel(p)}: relative link ../${bare}/SKILL.md does not resolve (tried ${candidates.map((t) => relative(ROOT, t)).join(", ")})`,
        )
    }
  }
}

// --- leftover claude-code vocabulary ---------------------------------------
// files that name claude code on purpose: the fork's own docs, the rewriter,
// these checks, the official-source map and eval-review (PATHS_ONLY in
// port.mjs), and the update sweep, whose claude ground is a PORTING.md known gap
const ABOUT_CLAUDE = /^(README\.md|PORTING\.md|MODELS\.md|SOURCES\.md|scripts\/port\.mjs|scripts\/verify(-tree\.mjs|\.sh)|skill\/kru-update\/|skill\/kru-eval-review\/SKILL\.md)/
// the old store path is legal only where the move happens and where it's explained
const STORE_MOVE = /^(README\.md|PORTING\.md|plugin\/kru\.ts|scripts\/kru-store-migrate(\.test)?\.mjs|scripts\/smoke\.sh|scripts\/verify(-tree\.mjs|\.sh))$/
const SCANS = [
  {
    name: "${CLAUDE_PLUGIN_ROOT}",
    re: /CLAUDE_PLUGIN_ROOT/,
    allow: /^(scripts\/port\.mjs|scripts\/verify(-tree\.mjs|\.sh)|scripts\/port-upstream-hand-owned\.test\.mjs)$/,
  },
  { name: "~/.claude/kru", re: /(~|\$HOME|homedir\(\)[^\n]*)\/?\.claude\/kru\b|"\.claude", "kru"/, allow: STORE_MOVE },
  // "Claude Code channels" is a product extension-builder builds, not the harness
  { name: "Claude Code", re: /\bClaude Code\b(?! channels?\b)/, allow: ABOUT_CLAUDE },
  { name: "claude tool name", re: /\b[Tt]he `?(Read|Write|Edit|MultiEdit|NotebookEdit|Grep|Glob|Bash|Task|Agent|Skill|WebFetch|WebSearch|TodoWrite)`? tool\b|`(Read|Write|Edit|MultiEdit|Grep|Glob|Bash|Task|Agent|Skill)` tool\b/, allow: /^(PORTING\.md|scripts\/port\.mjs|scripts\/verify-tree\.mjs)$/ },
  // skill/kru-update/reviewed.md is the ledger of claude releases the sweep read
  { name: "claude-only tool", re: /\b(TaskCreate|TaskUpdate|TaskList|TaskOutput|TaskStop|TodoWrite|SendMessage|ExitPlanMode|ToolSearch|ScheduleWakeup)\b/, allow: /^(PORTING\.md|scripts\/port\.mjs|scripts\/verify-tree\.mjs|skill\/kru-update\/reviewed\.md)$/ },
  { name: "mcp__ tool id", re: /\bmcp__/, allow: /^(PORTING\.md|scripts\/port\.mjs|scripts\/verify-tree\.mjs)$/ },
  { name: "/kru: command", re: /\/kru:[a-z]/, allow: /^(PORTING\.md|scripts\/port\.mjs|scripts\/verify-tree\.mjs)$/ },
]
const TEXT = /\.(md|sh|mjs|js|ts|json|ya?ml|txt|html|py)$/
// wayfinder, vendored verbatim from mattpocock/skills, names two sibling skills
// kru never vendored; the name dangles on both forks, so it's no port miss
const UNVENDORED = new Set(["research", "prototype"])
for (const p of files) {
  const r = rel(p)
  if (!TEXT.test(r) || r === "package-lock.json") continue
  const lines = read(p).split("\n")
  // a sibling skill named bare from a skill-tool line resolves to nothing here
  lines.forEach((line, i) => {
    if (!/\b[Tt]he `skill` tool\b/.test(line)) return
    for (const [, n] of line.matchAll(/"([a-z0-9-]+)"/g))
      if (!skills.includes(n) && !UNVENDORED.has(n)) fail("claude leftovers", `${r}:${i + 1}: skill tool names "${n}", no skill/${n}/`)
  })
  for (const scan of SCANS) {
    if (scan.allow.test(r)) continue
    lines.forEach((line, i) => {
      if (scan.re.test(line) && !(scan.skip && scan.skip.test(line)))
        fail("claude leftovers", `${r}:${i + 1}: ${scan.name} — ${line.trim().slice(0, 120)}`)
    })
  }
}

// --- report -----------------------------------------------------------------
const CHECKS = ["frontmatter", "json/yaml", "version", "seats", "layout", "claude leftovers"]
const detail = {
  frontmatter: `${seats.length + 1} agents · ${skills.length} skills · ${commands.length} commands`,
  "json/yaml": `${files.filter((f) => /\.(json|ya?ml)$/.test(f)).length} files`,
  version: read(join(ROOT, "VERSION")).trim(),
  seats: `${seats.length} seats · ${READ_ONLY.length} read-only`,
  layout: "no skills/ dir · skill/kru-* links",
  "claude leftovers": `${SCANS.length} patterns`,
}
for (const n of notes) console.log(`note ${n}`)
for (const c of CHECKS) {
  const hits = results.filter(([k]) => k === c)
  console.log(`${hits.length ? "FAIL" : "ok  "} ${c.padEnd(17)} ${hits.length ? `${hits.length} problem(s)` : detail[c]}`)
  for (const [, msg] of hits.slice(0, 25)) console.log(`       ${msg}`)
  if (hits.length > 25) console.log(`       … ${hits.length - 25} more`)
}
process.exit(results.length ? 1 : 0)
