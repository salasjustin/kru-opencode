# Porting — how this fork tracks kru, and where opencode stops

This repo is a **git fork** of [ap-justin/kru](https://github.com/ap-justin/kru) with upstream as a
remote. Nothing is vendored twice: the same files, restructured into an opencode config dir and
normalized by one script.

```
git fetch upstream && git merge upstream/main
node scripts/port.mjs            # re-normalize what the merge brought in
node bin/kru-oc.mjs doctor       # confirm, then: kru-oc sync
```

`scripts/port.mjs` is **idempotent**, which is the whole design: a merge that reintroduces Claude Code
vocabulary on a line gets rewritten again instead of hand-patched, and `--check` exits non-zero when
the tree is not normalized (the installer refuses to build an un-normalized tree).

## The layout

| upstream | here | why |
|---|---|---|
| `agents/<seat>.md` | `agent/kru/<seat>.md` | opencode globs `{agent,agents}/**/*.md` and the path becomes the name, so a nested dir namespaces every seat as `kru/<seat>` |
| — | `agent/kru.md` | the lead, as a **primary** agent (tab to it). Generated from the lead skill, so the contract has one source |
| `skills/<name>/` | `skill/kru-<name>/` | opencode's skill namespace is flat and global, and the loader requires the frontmatter `name` to match its directory |
| — | `command/kru/<name>.md` | opencode keeps commands separate from skills; one is generated per user-invoked skill (`argument-hint` upstream, or named as `/kru/<name>` in ported prose) |
| `hooks/hooks.json` + 4 `.sh` | `plugin/kru.ts` + 2 `.sh` | opencode hooks are a TS plugin; two of the shell gates survive behind an adapter |
| `.claude-plugin/` | `bin/kru-oc.mjs` | no plugin manifest; installation is a copy into a config dir. The roster's wiring map follows: the version lives in `package.json`, the seat count in its `description` and `README.md` |
| `ROSTER.md`, `SOURCES.md`, `TRACKER.md`, `PREFERENCES.md`, `references/`, `scripts/`, `hooks/` | same, installed under `<config>/kru/` | the support tree the prompts read through `{KRU_HOME}` |

`{KRU_HOME}` is the one placeholder in the committed tree; `kru-oc install` materializes it to the
config dir it is installing into. A file that still carries it after an install is a `doctor` failure.

Nothing is installed at `<config>/AGENTS.md`, and nothing should be: opencode takes the first global
rules file that exists — `<config>/AGENTS.md`, else `~/.claude/CLAUDE.md` — so a file there would take
the user's own global rules out of every session
(`packages/opencode/src/session/instruction.ts`). The team's own standing context rides in the agent
definitions instead.

## What the port rewrites

Mechanical, all of it in `scripts/port.mjs`:

- **Agent frontmatter** — `mode: subagent`, the seat's zen model (`MODELS.md`), a temperature where
  the seat wants one, and upstream's `tools:` allowlist translated into opencode's `permission` block
  (`"*": deny` then the seat's own tools re-allowed). Upstream `experimental:`/`effort:` keys are
  dropped; opencode has no equivalent.
- **Tool names** — `Read`/`Grep`/`Bash`/… → `read`/`grep`/`bash`; `TodoWrite` → `todowrite`; the
  `Agent` tool → the `task` tool; `SendMessage`/resume → a `task` call carrying the prior `task_id`.
- **MCP tool names** — `mcp__<server>__<tool>` → `<server>_<tool>`, which is how opencode registers
  them. The server key in `opencode.json` *is* the prefix, so `context7` and `chrome-devtools` have to
  be keyed exactly that (`skill/kru-setup/SKILL.md` says why).
- **Claude's built-in delegates** — `Explore` → `explore`, `Plan` → `plan`, `/tdd` →  `kru-tdd`,
  `/diagnosing-bugs` → `kru-diagnosing-bugs`, `/code-review` → the `kru/code-reviewer` seat.
- **Instruction files** — the repo sheet `/kru/setup` writes moves from `.claude/CLAUDE.md` to
  `AGENTS.md`, which is what opencode reads at a repo root (then `CLAUDE.md`, first match winning).
  The user's own `~/.claude/CLAUDE.md` is **kept as-is** — opencode loads it too.
- **Names** — `/kru:<x>` → `/kru/<x>`, and a bare `kru:<name>` resolves against the tree: a seat
  becomes `kru/<seat>`, a skill becomes `kru-<name>`.
- **In-tree paths** — `agents/<seat>.md` → `agent/kru/<seat>.md`, `skills/<name>/` → `skill/kru-<name>/`,
  including the glob forms the roster's `audit` greps with.
- **Install vocabulary** — upstream is a versioned plugin resolved out of a cache; here it is a copy in
  a config dir that `kru-oc sync` overwrites, which is what the rules about the install dir, the
  preference inbox's home and the vendored skills say instead.
- **The hooks** — `hooks/hooks.json` → `plugin/kru.ts`, and every "Stop hook" becomes the standing
  audit nudge, because opencode has no hook that can block the end of a turn (below).
- **The design chain** — see below.

The script also **warns** (never rewrites) on references to surfaces opencode cannot reach, so a merge
that reintroduces one is seen. The residue today is intentional: `SOURCES.md` and
`references/ui-practice.md` each spend a few lines saying what upstream uses and what this fork does
instead.

## What opencode has no equivalent for

**The design canvas.** Upstream's design turn publishes Claude Design's canvas editor as an artifact:
the user reshapes artboards directly and saves, and the whole practice hangs off that surface.
opencode reaches neither that editor nor a claude.ai/design project. The fork replaces the *surface*
and keeps the *practice*:

- a first-party **`kru-artboards`** skill holds the artboard mechanics — self-contained `.dc.html`
  files written into the repo's design-work path
- `kru/ui-designer` **drafts the look itself** (upstream keeps it to the frame around someone else's
  look), the lead opens the files in the user's browser, and the verdict is still the user's
- the reshape loop is a **re-brief**, not a drag: two rounds is normal, a third means the brief is wrong
- the **sync lane** (`design-sync.md`, a bundle of real components pushed to a claude.ai/design
  project) is gone with nothing in its place; a non-coder reads the gallery on the dev server

**The `Artifact` tool** — dropped from `ui-designer`'s permissions; the `algorithmic-art` skill writes
a local HTML file instead of publishing one.

**A blocking stop hook.** Upstream refuses the end of a turn that dispatched seats until the dispatch
auditor runs. opencode has no hook that can block a turn's end, so the nudge is a standing line
appended to the system prompt while the session's ledger is non-empty — continuous rather than
terminal, and it cannot actually stop the turn.

**`/verify`, `/run`, `/simplify`, `/research`** — Claude Code bundled skills. Their references resolve
to what this fork has: the suite (`kru-testing`), the browser (`kru-local-browser`), the
`kru/code-reviewer` seat, and the `explore` subagent.

**Nested dispatch.** Both harnesses stop a subagent from spawning another — but opencode's limit is a
config value (`subagent_depth`, default 1), not a law. The contract still assumes depth 1.

## Hand-owned — what a merge will not normalize

These are the places upstream's text cannot be rewritten by rule, so an upstream edit to them needs a
human read. `scripts/port.mjs` → `HAND_OWNED` holds the list the rules skip entirely.

| file | why |
|---|---|
| `README.md`, `PORTING.md`, `MODELS.md` | the fork's own documents; they name both harnesses on purpose |
| `SOURCES.md` | the official-source map: its design rows describe a Claude surface deliberately |
| `skill/kru-update/SKILL.md` | its "Claude Code" ground is about the *other* harness's releases — this fork's equivalent ground is opencode's, and the sweep needs rewriting by hand |
| `plugin/kru.ts` → the lead gate | upstream's `require-lead.sh` reads the session transcript, which opencode does not expose; the read-only bash classifier is mirrored in TS and drifts if upstream edits its verb lists |
| `agent/kru/ui-designer.md`, `references/ui-practice.md`, `skill/kru-artboards/` | the design chain above |
| `ROSTER.md` → *Model tiers* | upstream argues Claude tiers, `effort:` and prompt-cache TTL; here the section is three lines pointing at `MODELS.md`, and `effort:`/`cacheTtl` have no opencode equivalent |
| `skill/kru-roster/audit.md` → assertion 8 | upstream measures context load with `claude plugin details`; opencode reports none, so the assertion counts description bytes instead |
| `SOURCES.md` → *Orchestration / harness mechanics* | the lead's own official source: opencode's docs and Context7, not `claude-code-guide` |

## Known gaps

- The plugin's hooks are written against opencode's documented plugin API and have not been exercised
  against a long live session yet; every gate fails open by design, so a wrong assumption costs the
  gate, not the session.
- `skill/kru-update`'s "Claude Code" sweep still reads as upstream wrote it (see the table).
- Nothing re-checks that a zen model id in `scripts/port.mjs` still exists; `opencode models` is the
  check, and a dead id surfaces as a failed run.
