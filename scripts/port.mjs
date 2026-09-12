#!/usr/bin/env node
// normalizes this fork's tree for opencode. every transform is idempotent, so
// the loop after a merge from upstream (github.com/ap-justin/kru) is:
//   git fetch upstream && git merge upstream/main && node scripts/port.mjs
// a merge that reintroduces claude-code vocabulary on a line is re-normalized
// rather than hand-patched, and `--check` fails loudly on what no rule covers.
//
// what it owns: agent frontmatter (model/mode/permission), the primary lead
// agent, skill names, the /kru command set, and the harness-vocabulary rewrites.
// what it never touches: prose judgment. a rule that would need judgment is
// listed in PORTING.md under "hand-owned" instead.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from "node:fs"
import { join, dirname, basename, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const CHECK = process.argv.includes("--check")
const QUIET = process.argv.includes("--quiet")

// ---------------------------------------------------------------------------
// the seat → model map. the rationale per tier lives in MODELS.md; this is the
// only place a seat's model is decided, so a retier is one edit here + a port.
// ---------------------------------------------------------------------------
const ZEN = {
  judgment: "opencode/claude-opus-5", //   orchestration, adversarial review, planning
  ui: "opencode/kimi-k3", //               component + design craft
  coding: "opencode/glm-5.3", //           builders, data, auth, payments, platform
  vision: "opencode/gemini-3.8-flash", //  seats that read screenshots
  mechanical: "opencode/glm-5.3-flash", // ledger-shaped work, no design calls
}

const SEATS = {
  // judgment
  planner: { model: ZEN.judgment },
  "code-reviewer": { model: ZEN.judgment, temperature: 0.1 },
  "architecture-reviewer": { model: ZEN.judgment, temperature: 0.1 },
  "ux-auditor": { model: ZEN.judgment, temperature: 0.1 },
  "ux-designer": { model: ZEN.judgment },
  // ui + design craft
  "react-ui-builder": { model: ZEN.ui },
  "svelte-ui-builder": { model: ZEN.ui },
  "web-components-builder": { model: ZEN.ui },
  "ui-designer": { model: ZEN.ui },
  "graphic-designer": { model: ZEN.ui },
  // vision
  "visual-reviewer": { model: ZEN.vision, temperature: 0.1 },
  "accessibility-reviewer": { model: ZEN.vision, temperature: 0.1 },
  // mechanical
  "dispatch-auditor": { model: ZEN.mechanical, temperature: 0 },
}
const DEFAULT_SEAT = { model: ZEN.coding }

// the lead runs as a primary agent: it is the seat the user talks to, and
// opencode switches primaries with tab rather than loading a skill.
const LEAD = {
  model: ZEN.judgment,
  description: "The engineering lead — scopes the work, routes it to the kru seats, and runs the board.",
}

// ---------------------------------------------------------------------------
// claude tool names → opencode tool ids (permission keys). an entry of null is
// a tool opencode has no equivalent for; the seat loses it and PORTING.md says
// what that costs.
// ---------------------------------------------------------------------------
const TOOLS = {
  Read: "read",
  Write: "edit",
  Edit: "edit",
  NotebookEdit: "edit",
  Grep: "grep",
  Glob: "glob",
  Bash: "bash",
  WebFetch: "webfetch",
  WebSearch: "websearch",
  Skill: "skill",
  Task: "task",
  Agent: "task",
  TodoWrite: "todowrite",
  Artifact: null, // claude.ai publishing; the canvas becomes a local .dc.html
  SendUserFile: null,
}

const mcpTool = (name) => name.replace(/^mcp__/, "").replace(/__/g, "_")

// ---------------------------------------------------------------------------
// harness vocabulary. order matters: the narrow path rules run before the
// generic ones, and every replacement is a string the rule can never re-match.
// ---------------------------------------------------------------------------
const PLUGIN_ROOT = /\$\{CLAUDE_PLUGIN_ROOT\}/g

const REWRITES = [
  // plugin-root paths → the installed config dir ({KRU_HOME}, materialized by
  // bin/kru-oc at install time)
  [/\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/([a-z0-9-]+)\//g, "{KRU_HOME}/skill/kru-$1/"],
  [/\$\{CLAUDE_PLUGIN_ROOT\}\/agents\//g, "{KRU_HOME}/agent/kru/"],
  [PLUGIN_ROOT, "{KRU_HOME}/kru"],
  // in-tree path references that survived as bare relative paths
  [/(^|[\s`('"])skills\/([a-z0-9-]+)\/SKILL\.md/g, "$1skill/kru-$2/SKILL.md"],
  [/(^|[\s`('"])skills\/([a-z0-9-]+)\//g, "$1skill/kru-$2/"],
  [/(^|[\s`('"])agents\/([a-z0-9-]+)\.md/g, "$1agent/kru/$2.md"],
  [/(^|[\s`('"])agents\/(\*|<[a-z0-9-]+>)\.md/g, "$1agent/kru/$2.md"],
  [/`agents\/`/g, "`agent/kru/`"],
  [/`skills\/\*`/g, "`skill/kru-*`"],
  [/(^|[\s`('"])skills\/\*\//g, "$1skill/kru-*/"],
  // slash commands: /kru:brief → /kru/brief
  [/\/kru:([a-z0-9-]+)/g, "/kru/$1"],
  // tools: claude capitalizes its tool names, opencode lower-cases them. only
  // the backticked and list forms are safe to touch — bare "Read the file" is
  // the verb, and a rule that renamed it would rewrite half the prose.
  [/`(Read|Write|Edit|Grep|Glob|Bash|Skill|Task)`/g, (_m, t) => "`" + t.toLowerCase() + "`"],
  [/\b(Read|Grep|Glob|Write|Edit)\b(?=\s*[/,]\s*(Read|Grep|Glob|Write|Edit|Bash)\b)/g, (_m, t) => t.toLowerCase()],
  [/(?<=[/,]\s*)(Read|Grep|Glob|Write|Edit|Bash)\b/g, (_m, t) => t.toLowerCase()],
  [/\bTodoWrite\b/g, "todowrite"],
  [/\bthe `?Agent`? tool\b/g, "the `task` tool"],
  [/\bAgent call\b/g, "`task` call"],
  [/`Agent` call/g, "`task` call"],
  [/\bsubagent_type\b/g, "subagent_type"], // same key in opencode's task tool
  [/\bWebFetch\b/g, "webfetch"],
  [/\bWebSearch\b/g, "websearch"],
  // claude's bundled skills the team delegates to. the two kru vendors itself
  // resolve to their ported names; /code-review has no opencode equivalent, so
  // it resolves to the seat that does the same work.
  [/(^|[\s`(])\/tdd\b/g, "$1kru-tdd"],
  [/(^|[\s`(])\/diagnosing-bugs\b/g, "$1kru-diagnosing-bugs"],
  [/(^|[\s`(])\/testing\b/g, "$1kru-testing"],
  [/(^|[\s`(])\/research\b(?!-)/g, "$1`explore`"],
  [/`\/code-review`/g, "`kru/code-reviewer`"],
  [/(^|[\s(])\/code-review\b/g, "$1`kru/code-reviewer`"],
  // claude's built-in delegates → opencode's
  [/`Explore`/g, "`explore`"],
  [/\bExplore's\b/g, "`explore`'s"],
  [/(^|[\s(])Explore\b(?!\.)/g, "$1`explore`"],
  [/`Plan`/g, "`plan`"],
  // same-task reuse: claude resumes an agent by name, opencode by task_id
  [/`SendMessage`\/resume/g, "`task` with a prior `task_id`"],
  [/`SendMessage`/g, "a `task` call carrying the prior `task_id`"],
  // instruction file: opencode reads AGENTS.md first, CLAUDE.md only when a
  // repo has no AGENTS.md — but the user's ~/.claude/CLAUDE.md still loads, so
  // that path is protected below by running after this rule on a marked token.
  [/(~|\$HOME)\/\.claude\/CLAUDE\.md/g, "{USER_RULES}$1"],
  // the repo's own sheet: claude code reads .claude/CLAUDE.md, opencode reads
  // AGENTS.md at the repo root (then CLAUDE.md, first match winning)
  [/(^|[\s`('"(\/])\.claude\/CLAUDE\.md/g, "$1AGENTS.md"],
  [/\bCLAUDE\.md\b/g, "AGENTS.md"],
  [/\{USER_RULES\}(~|\$HOME)/g, "$1/.claude/CLAUDE.md"],
  // both spellings named one file upstream, so the pair collapses to one branch
  [/AGENTS\.md\s*(?:\/|or)\s*AGENTS\.md/g, "AGENTS.md"],
  // the design chain: opencode reaches no canvas editor and no claude.ai design
  // project, so the surface is the `ui-designer` seat's own artboards. the one
  // phrase kept is "Claude Design canvas", which ui-practice.md spends once to
  // say what upstream does and this fork doesn't.
  [/Claude Design \(`\/design`\)/g, "the design turn (`kru/ui-designer`)"],
  [/\*\*Claude Design\*\*(?! canvas)/g, "**the design draft**"],
  [/Claude Design's(?! canvas)/g, "the design draft's"],
  [/\bClaude Design\b(?! canvas)/g, "the design turn"],
  [/`\/design`/g, "`kru/ui-designer`"],
  [/(^|[\s(])\/design\b(?!-)/g, "$1`kru/ui-designer`"],
  // install shape: a copy into an opencode config dir. nothing resolves
  // differently per load, and the installed tree is a build `kru-oc sync`
  // overwrites, which is the reason the inbox stays in the home dir.
  [/This team is a versioned plugin; (`\{KRU_HOME\}\/kru`) is its install dir/g, "This team is versioned; $1 is its install dir"],
  [/\s*\((?:resolves|resolved) in both local and web plugin loads\)/g, ""],
  [/,? resolved in both local and web plugin loads/g, ""],
  [/\bthe plugin'?s? install dir\b/g, "the install dir"],
  [/\(that resolves to a read-only, version-pinned cache when installed from the marketplace — unwritable from other projects and blown away on update\)/g, "(the installed copy is a build the next `kru-oc sync` overwrites)"],
  [/durable across plugin updates/g, "durable across syncs"],
  [/bundled in this plugin/g, "bundled with the team"],
  [/bundled plugin skills/g, "bundled team skills"],
  [/plugins can't ship auto-loaded context, so /g, ""],
  // hooks: one TS plugin, and none of them can block the end of a turn — the
  // audit ask is a standing system line while the ledger is non-empty
  [/the plugin'?s?( own)? `hooks\/hooks\.json`/g, "the plugin (`plugin/kru.ts`)"],
  [/`hooks\/hooks\.json`/g, "`plugin/kru.ts`"],
  [/`hooks\/nudge-audit\.sh` blocks a stop once while a ledger stands and hands back the dispatch instruction/g, "`plugin/kru.ts` appends the standing audit line while a ledger stands"],
  [/a Stop-hook nudge fires/g, "a standing audit nudge asks the lead to dispatch"],
  [/\bStop-hook nudge\b/g, "standing audit nudge"],
  [/\bthe Stop (?:hook|nudge)\b/g, "the audit nudge"],
  // the wiring map: no plugin manifest here. the seat count lives in
  // package.json's description and README's opening; the version in
  // package.json; every seat's model in this script's own SEATS.
  [/\*\*both\*\* `plugin\.json` and `marketplace\.json` descriptions/g, "**both** `package.json`'s description and `README.md`"],
  [/`plugin\.json` \+ `marketplace\.json`/g, "`package.json` + `README.md`"],
  [/`plugin\.json`\/`marketplace\.json`/g, "`package.json`/`README.md`"],
  [/`\.claude-plugin\/plugin\.json`/g, "`package.json`"],
  [/`\.claude-plugin\/marketplace\.json`/g, "`README.md`"],
  [/`plugin\.json`/g, "`package.json`"],
  [/`marketplace\.json`/g, "`README.md`"],
  [/the plugin manifest is the one that gets forgotten/g, "`package.json` is the one that gets forgotten"],
  [/\| 3 \| `ROSTER\.md` → \*Model tiers\* \| a \*\*pinned\*\* row \(explicit full ID\) \+ one-line why — `inherit` is retired \|/g, "| 3 | `scripts/port.mjs` → `SEATS` | the seat's tier, or nothing where the `coding` default is right (`MODELS.md`) |"],
  [/\(b\) a \*Model tiers\* entry/g, "(b) a `scripts/port.mjs` → `SEATS` tier or the `coding` default"],
  [/\(`claude-opus-5` \/ `claude-sonnet-5` — never omitted, never a floating `opus`\/`sonnet` alias\) and it matches its `ROSTER\.md` \*Model tiers\* row/g, "(`opencode/<model>`, never a floating alias) and it comes from `scripts/port.mjs` → `SEATS` rather than a hand edit"],
  // the harness itself
  [/\bClaude Code\b/g, "opencode"],
  // opencode names an MCP tool `<server>_<tool>`, sanitizing the server; claude
  // spelled it `mcp__<server>__<tool>`. a bare `mcp__` is prose about the
  // convention itself, so it becomes the word rather than an empty backtick.
  [/\bmcp__[A-Za-z0-9_-]*/g, (m) => m.slice(5).replace(/__/g, "_") || "MCP"],
]

// files whose claude-code references are about claude-the-product rather than
// the harness this fork runs on; they stay hand-owned (PORTING.md).
// the fork's own documents: they talk *about* both harnesses, so the vocabulary
// rules would rewrite the sentences that explain the difference
const HAND_OWNED = new Set(["skill/kru-update/SKILL.md", "SOURCES.md", "PORTING.md", "MODELS.md", "README.md"])

// references to surfaces opencode has no equivalent for. the port cannot
// rewrite them — each is a judgment call recorded in PORTING.md — so it counts
// them and warns, which is how a merge that reintroduces one gets seen.
const WATCH = [
  /(^|[\s`(])\/design\b/,
  /(^|[\s`(])\/code-review\b/,
  /(^|[\s`(])\/research\b/,
  /\bArtifact\b/,
  /\bClaude Design\b/,
  /\bclaude\.ai\b/,
]

// tokens that must not survive a port anywhere. a hit means a new upstream
// phrasing no rule covers — the port fails rather than shipping it.
const FORBIDDEN = [/\$\{CLAUDE_PLUGIN_ROOT\}/, /mcp__/, /\/kru:/]

function rewrite(text, seats) {
  let out = text
  for (const [re, to] of REWRITES) out = out.replace(re, to)
  // upstream spells its own commands both `/kru:x` and bare `/x`; this fork
  // namespaces every one of them, so a bare reference is re-pointed from the
  // command set on disk rather than from a list that drifts
  for (const name of commandNames())
    out = out.replace(new RegExp(`(^|[\\s\`('"])\\/${name}(?![\\w/-])`, "g"), `$1/kru/${name}`)
  // a bare `kru:<name>` is a seat (an agent address) or a skill (a skill-tool
  // name); the tree says which, so the rule doesn't have to guess.
  return out.replace(/\bkru:([a-z0-9-]+)/g, (_m, n) => (seats.has(n) ? `kru/${n}` : `kru-${n}`))
}

const log = (...a) => !QUIET && console.log(...a)
const changed = []
const problems = []

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules" || e.name.startsWith(".venv")) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

// every read and write goes through one cache, so --check audits the text the
// port *would* produce rather than what is still on disk.
const contents = new Map()
function readF(path) {
  if (!contents.has(path)) contents.set(path, readFileSync(path, "utf8"))
  return contents.get(path)
}

function write(path, next) {
  const prev = contents.has(path) ? contents.get(path) : existsSync(path) ? readFileSync(path, "utf8") : null
  contents.set(path, next)
  if (prev === next) return false
  changed.push(relative(ROOT, path))
  if (!CHECK) writeFileSync(path, next)
  return true
}

// --- frontmatter ------------------------------------------------------------
// naive on purpose: kru frontmatter is flat `key: value` plus one nested block,
// and a yaml dependency in a port script is a dependency in every merge.
function splitFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!m) return null
  return { raw: m[1], body: src.slice(m[0].length) }
}

function field(raw, key) {
  const lines = raw.split("\n")
  const i = lines.findIndex((l) => l.startsWith(`${key}:`))
  if (i === -1) return null
  let value = lines[i].slice(key.length + 1).trim()
  for (let j = i + 1; j < lines.length && /^\s+\S/.test(lines[j]); j++) value += " " + lines[j].trim()
  return value
}

const commandNames = () => {
  const dir = join(ROOT, "command", "kru")
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => basename(f, ".md")) : []
}

const seatNames = () => readdirSync(join(ROOT, "agent", "kru")).filter((f) => f.endsWith(".md")).map((f) => basename(f, ".md"))
const skillNames = () => readdirSync(join(ROOT, "skill")).filter((d) => d.startsWith("kru-"))

// --- step 1: agent frontmatter ---------------------------------------------
function portAgents() {
  for (const name of seatNames()) {
    const path = join(ROOT, "agent", "kru", `${name}.md`)
    const fm = splitFrontmatter(readF(path))
    if (!fm) {
      problems.push(`${name}: no frontmatter`)
      continue
    }
    const seat = SEATS[name] ?? DEFAULT_SEAT
    const description = field(fm.raw, "description")
    // upstream spells the allowlist `tools:`; a tree already ported spells it
    // `permission:`. upstream wins when a merge brings both back.
    const tools = field(fm.raw, "tools")
    const ported = tools
      ? null
      : fm.raw
          .split("\n")
          .filter((l) => /^\s+\S+: allow$/.test(l))
          .map((l) => l.trim().replace(/: allow$/, "").replace(/^"|"$/g, ""))

    const out = [`description: ${description}`, `mode: subagent`, `model: ${seat.model}`]
    if (seat.temperature !== undefined) out.push(`temperature: ${seat.temperature}`)

    if (tools || ported?.length) {
      // an allowlist: everything denied, then the seat's own tools re-allowed.
      // claude expressed this as a `tools:` list; opencode's equivalent is
      // `permission`, and key order is its precedence.
      const allow = new Set(ported ?? [])
      const dropped = []
      for (const t of (tools ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
        if (t.startsWith("mcp__")) {
          allow.add(mcpTool(t))
          continue
        }
        if (!(t in TOOLS)) {
          problems.push(`${name}: unmapped tool ${t}`)
          continue
        }
        const mapped = TOOLS[t]
        if (mapped === null) dropped.push(t)
        else allow.add(mapped)
      }
      out.push("permission:")
      out.push(`  "*": deny`)
      for (const k of allow) out.push(`  ${/[^a-z_]/.test(k) ? `"${k}"` : k}: allow`)
      if (dropped.length) log(`  ${name}: dropped ${dropped.join(", ")} (no opencode equivalent)`)
    }

    write(path, `---\n${out.join("\n")}\n---\n${fm.body.replace(/^\n*/, "\n")}`)
  }
}

// --- step 2: the lead as a primary agent -----------------------------------
// generated from the lead skill so the contract has exactly one source. the
// skill stays too: a session on another primary loads it through the skill tool.
function portLead() {
  const src = readF(join(ROOT, "skill", "kru-lead", "SKILL.md"))
  const fm = splitFrontmatter(src)
  // a primary agent is picked by the human in the TUI, so its description is a
  // name for the seat rather than the skill's model-facing trigger list
  const header = [
    `# GENERATED by scripts/port.mjs from skill/kru-lead/SKILL.md — do not edit.`,
    ``,
    `Seat names address the \`task\` tool as \`kru/<seat>\` (\`kru/react-ui-builder\`), and team`,
    `skills as \`kru-<name>\` (\`kru-testing\`). Commands are \`/kru/<name>\`.`,
    ``,
  ].join("\n")
  const out = `---\ndescription: ${LEAD.description}\nmode: primary\nmodel: ${LEAD.model}\n---\n\n${header}\n${fm.body.trim()}\n`
  write(join(ROOT, "agent", "kru.md"), rewrite(out, new Set(seatNames())))
}

// --- step 3: skill names ---------------------------------------------------
// opencode's skill namespace is flat and global, so every skill carries the
// kru- prefix its directory already has; the loader requires the two to match.
function portSkills() {
  for (const dir of skillNames()) {
    const path = join(ROOT, "skill", dir, "SKILL.md")
    if (!existsSync(path)) {
      problems.push(`${dir}: no SKILL.md`)
      continue
    }
    const src = readF(path)
    const fm = splitFrontmatter(src)
    if (!fm) {
      problems.push(`${dir}: no frontmatter`)
      continue
    }
    const lines = fm.raw.split("\n")
    const i = lines.findIndex((l) => l.startsWith("name:"))
    if (i === -1) lines.unshift(`name: ${dir}`)
    else lines[i] = `name: ${dir}`
    write(path, `---\n${lines.join("\n")}\n---\n${fm.body.replace(/^\n*/, "\n")}`)
  }
}

// --- step 4: harness vocabulary across every text file ---------------------
function portText() {
  const seats = new Set(seatNames())
  for (const path of walk(ROOT)) {
    if (!/\.(md|sh|mjs|ts)$/.test(path)) continue
    const rel = relative(ROOT, path)
    // generated trees are their generator's to normalize, or the two passes
    // fight over a line forever
    if (/^(scripts\/port\.mjs|bin\/|plugin\/|command\/|agent\/kru\.md)/.test(rel)) continue
    const before = readF(path)
    const src = HAND_OWNED.has(rel) ? before : rewrite(before, seats)
    if (src !== before) write(path, src)
  }
}

// --- step 5: the command set ----------------------------------------------
// a skill carrying argument-hint is one the user invokes by name; in opencode
// that is a command file, which the skill tool then loads.
function portCommands() {
  const dir = join(ROOT, "command", "kru")
  if (!CHECK) mkdirSync(dir, { recursive: true })
  const wanted = new Set()
  // a skill earns a command two ways: it carries argument-hint upstream (the
  // mark of a user-invoked skill), or the ported prose points the user at
  // /kru/<name> — a front door named in text and missing from the menu is a
  // dead reference.
  const named = new Set()
  for (const path of walk(ROOT)) {
    if (!/\.md$/.test(path) || /^command\//.test(relative(ROOT, path))) continue
    for (const m of readF(path).matchAll(/(?:^|[\s`('"])\/kru\/([a-z0-9-]+)/g)) named.add(m[1])
  }
  for (const skill of skillNames()) {
    const src = readF(join(ROOT, "skill", skill, "SKILL.md"))
    const fm = splitFrontmatter(src)
    const hint = field(fm.raw, "argument-hint")
    if (!hint && !named.has(skill.replace(/^kru-/, ""))) continue
    const name = skill.replace(/^kru-/, "")
    wanted.add(`${name}.md`)
    const description = (field(fm.raw, "description") ?? "").split(/(?<=\.)\s/)[0]
    const body = [
      `---`,
      `description: ${description}`,
      `agent: kru`,
      `---`,
      ``,
      `# GENERATED by scripts/port.mjs from skill/${skill}/SKILL.md — do not edit.`,
      ``,
      `Load the \`${skill}\` skill with the skill tool and follow it for this turn.`,
      hint ? `Arguments (${hint.replace(/^["']|["']$/g, "")}): $ARGUMENTS` : `Arguments: $ARGUMENTS`,
      ``,
    ].join("\n")
    write(join(dir, `${name}.md`), rewrite(body, new Set(seatNames())))
  }
  // a command whose skill lost its argument-hint upstream is stale
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (wanted.has(f)) continue
      problems.push(`command/kru/${f}: no skill claims it (stale)`)
      if (!CHECK) rmSync(join(dir, f))
    }
  }
}

// --- step 6: the audit ----------------------------------------------------
function audit() {
  const watched = new Map()
  for (const path of walk(ROOT)) {
    if (!/\.(md|sh)$/.test(path)) continue
    const rel = relative(ROOT, path)
    if (rel === "PORTING.md") continue
    const src = readF(path)
    if (!HAND_OWNED.has(rel))
      for (const re of FORBIDDEN) {
        const hit = src.match(re)
        if (hit) problems.push(`${rel}: unported \`${hit[0]}\``)
      }
    for (const m of src.matchAll(/(?:^|[\s`('"])\/kru\/([a-z0-9-]+)/g)) {
      if (!existsSync(join(ROOT, "command", "kru", `${m[1]}.md`)))
        problems.push(`${rel}: /kru/${m[1]} has no command file`)
    }
    for (const re of WATCH) {
      const hits = src.match(new RegExp(re.source, "g"))
      if (hits) watched.set(rel, (watched.get(rel) ?? 0) + hits.length)
    }
  }
  if (watched.size) {
    log(`\nunportable references (PORTING.md → Hand-owned): ${[...watched.values()].reduce((a, b) => a + b, 0)} in ${watched.size} file(s)`)
    for (const [rel, n] of [...watched].sort((a, b) => b[1] - a[1]).slice(0, 12)) log(`  ? ${rel} (${n})`)
  }
}

portAgents()
portLead()
portSkills()
portText()
portCommands()
audit()

log(`ported: ${changed.length} file(s) ${CHECK ? "would change" : "changed"}`)
if (changed.length && !QUIET) for (const c of changed.slice(0, 40)) log(`  ~ ${c}`)
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`)
  for (const p of problems) console.error(`  ! ${p}`)
  process.exit(1)
}
if (CHECK && changed.length) {
  console.error(`\n--check: tree is not normalized; run: node scripts/port.mjs`)
  process.exit(1)
}
