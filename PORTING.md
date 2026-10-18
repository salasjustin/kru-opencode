# Porting: how this fork tracks kru, and where opencode stops

This repo is a **git fork** of [ap-justin/kru](https://github.com/ap-justin/kru) with upstream as a
remote. Nothing is vendored twice: the same files, restructured into an opencode config dir and
normalized by one script.

```
git fetch upstream && git merge upstream/main
node scripts/port.mjs            # re-normalize what the merge brought in
node bin/kru-oc.mjs doctor       # confirm, then: kru-oc sync
bash scripts/verify.sh           # every static check (CI runs it on each pull request)
bash scripts/smoke.sh            # local, spends tokens: a real opencode dispatches a real seat
```

`scripts/port.mjs` is **idempotent**, which is the whole design: a merge that reintroduces Claude Code
vocabulary on a line gets rewritten again instead of hand-patched, and `--check` exits non-zero when
the tree is not normalized (the installer refuses to build an un-normalized tree).

## The layout

| upstream | here | why |
|---|---|---|
| `agents/<seat>.md` | `agent/kru/<seat>.md` | opencode globs `{agent,agents}/**/*.md` and the path becomes the name, so a nested dir namespaces every seat as `kru/<seat>` |
| - | `agent/kru.md` | the lead, as a **primary** agent (tab to it). Generated from the lead skill, so the contract has one source |
| `skills/<name>/` | `skill/kru-<name>/` | opencode's skill namespace is flat and global, and the loader requires the frontmatter `name` to match its directory |
| - | `command/kru/<name>.md` | opencode keeps commands separate from skills; one is generated per user-invoked skill (`argument-hint` upstream, or named as `/kru/<name>` in ported prose) |
| `hooks/hooks.json` + 10 `.sh` | `plugin/kru.ts` + 6 `.sh` | opencode hooks are a TS plugin. `check-handoff`, `log-dispatch`, `log-return`, `setup-nudge`, `store-sync` and the shared `readonly-bash` test run behind an adapter; `require-lead` and `brainstorm-guard` read a transcript opencode doesn't expose, so the plugin tracks their state itself; `nudge-audit` became a system line and `check-task-tools` has nothing to check (opencode's `todowrite` is always on) |
| `hooks/*.test.sh`, `TESTING.md`, `evals/`, `.claude/` | - | upstream's hook tests take the plugin root as laid out upstream, its evals run under `claude plugin eval`, and `.claude/` is its own release tooling; none runs here. `scripts/kru-store.test.sh` stays, and `scripts/hooks.test.sh` runs the ported hooks against an installed tree |
| `.claude-plugin/` | `bin/kru-oc.mjs` | no plugin manifest; installation is a copy into a config dir. The roster's wiring map follows: the version lives in `package.json`, the seat count in its `description` and `README.md` (upstream dropped its count; `skill/kru-roster/audit.md` keeps assertion 1 for it here) |
| `scripts/asset/package.json` | same | the asset seats' deps install on first run into a data dir (`scripts/asset/run.sh`), so the root `package.json` carries only the fork's own scripts |
| `ROSTER.md`, `SOURCES.md`, `TRACKER.md`, `PREFERENCES.md`, `references/`, `scripts/`, `hooks/` | same, installed under `<config>/kru/` | the support tree the prompts read through `{KRU_HOME}` |

`{KRU_HOME}` is the one placeholder in the committed tree; `kru-oc install` materializes it to the
config dir it is installing into. A file that still carries it after an install is a `doctor` failure.

Nothing is installed at `<config>/AGENTS.md`, and nothing should be: opencode takes the first global
rules file that exists (`<config>/AGENTS.md`, else `~/.claude/CLAUDE.md`), so a file there would take
the user's own global rules out of every session
(`packages/opencode/src/session/instruction.ts`). The team's own standing context rides in the agent
definitions instead.

## What the port rewrites

Mechanical, all of it in `scripts/port.mjs`:

- **Agent frontmatter**: `mode: subagent`, the seat's zen model (`MODELS.md`), a temperature where
  the seat wants one, and upstream's `tools:` allowlist translated into opencode's `permission` block
  (`"*": deny` then the seat's own tools re-allowed). `"*": deny` also denies `external_directory`,
  opencode's gate on any path outside the working repo, so the block re-allows exactly the install
  dir, the store and the review-report dir (`EXTERNAL`); install fills in `{KRU_STORE}` and
  `{KRU_TMP}`, since opencode's patterns expand only `~` and `$HOME`. Upstream `experimental:`/`effort:` keys are
  dropped; opencode has no equivalent.
- **Seat memory**: upstream's `memory: local` has the harness supply a per-repo memory file. opencode
  has none, so the key is dropped and each seat carrying Block Q gets one line naming the file
  (`.claude/agent-memory-local/<seat>/MEMORY.md`) to read at the start of a run and keep with `edit`.
  The path stays claude's, so `store-sync` and `/kru/setup`'s ignore line cover both forks.
- **The shell hooks' root**: upstream's hooks take the plugin dir as `$1`; here it is the config dir,
  with the support tree under `kru/`, so `$plugin_root/agents` → `$plugin_root/agent/kru`,
  `$plugin_root/scripts/` → `$plugin_root/kru/scripts/` and so on.
- **Tool names**: `Read`/`Grep`/`Bash`/… → `read`/`grep`/`bash`; `TodoWrite` → `todowrite`; the
  `Agent` tool → the `task` tool; `SendMessage`/resume → a `task` call carrying the prior `task_id`.
- **MCP tool names**: `mcp__<server>__<tool>` → `<server>_<tool>`, which is how opencode registers
  them. The server key in `opencode.json` *is* the prefix, so `context7` and `chrome-devtools` have to
  be keyed exactly that (`skill/kru-setup/SKILL.md` says why).
- **Claude's built-in delegates**: `Explore` → `explore`, `Plan` → `plan`, `/tdd` →  `kru-tdd`,
  `/diagnosing-bugs` → `kru-diagnosing-bugs`, `/code-review` → the `kru/code-reviewer` seat.
- **Instruction files**: the repo sheet `/kru/setup` writes moves from `.claude/CLAUDE.md` to
  `AGENTS.md`, which is what opencode reads at a repo root (then `CLAUDE.md`, first match winning).
  The user's own `~/.claude/CLAUDE.md` is **kept as-is**: opencode loads it too.
- **Names**: `/kru:<x>` → `/kru/<x>`, and a bare `kru:<name>` resolves against the tree: a seat
  becomes `kru/<seat>`, a skill becomes `kru-<name>`.
- **In-tree paths**: `agents/<seat>.md` → `agent/kru/<seat>.md`, `skills/<name>/` → `skill/kru-<name>/`,
  including the glob and brace forms the roster's `audit` greps with.
- **Upstream `skills/` merges**: anything left in a top-level `skills/<name>/` after a merge is copied into
  `skill/kru-<name>/` (every file type, with the same rewrites on text), then `skills/` is removed.
  `claude-code-delegation` is dropped (no opencode equivalent; see below).
- **Task tools**: upstream's board is `TaskCreate`/`TaskUpdate` with `TodoWrite` as the fallback;
  here it is `todowrite`.
- **Install vocabulary**: upstream is a versioned plugin resolved out of a cache; here it is a copy in
  a config dir that `kru-oc sync` overwrites, which is what the rules about the install dir, the
  preference inbox's home and the vendored skills say instead.
- **The hooks**: `hooks/hooks.json` → `plugin/kru.ts`, and every "Stop hook" becomes the standing
  audit nudge, because opencode has no hook that can block the end of a turn (below).

The script also **warns** (never rewrites) on references to surfaces opencode cannot reach, so a merge
that reintroduces one is seen. The residue today is intentional: `SOURCES.md` and
`references/ui-practice.md` each spend a few lines saying what upstream uses and what this fork does
instead.

## What opencode has no equivalent for

**The bundled `/design` skill and Claude Design canvas.** Upstream v0.156.0 routes flows, IA, mockups,
brand and assets to a **separate designer** (human or bot) using `references/designer-handoff.md`; the
engineering lead builds from the PM's approved mockup + build spec (`references/design-spec.md`) and
`visual-reviewer` checks the build against it at **1440px and 375px**. opencode has no Claude Design
editor, no `/design` skill, and no design seats on the roster; those references stay in prose as
upstream vocabulary the port warns on, not seats to re-add.

**A blocking stop hook.** Upstream refuses the end of a turn that dispatched seats until the dispatch
auditor runs. opencode has no hook that can block a turn's end, so the nudge is a standing line
appended to the system prompt while the session's ledger is non-empty, continuous rather than
terminal, and it cannot actually stop the turn.

**Seat memory as a harness feature**: see *What the port rewrites*: the seat reads and writes the
file itself, so nothing indexes it and nothing loads it before the seat's first read.

**Plugin options and the artifact store.** Upstream's kill switches and `KRU_STORE_REPO` can also be
set in `/plugin` → Configure, and `KRU_STORE_URL` points the preference half at a published
artifact's database. Here the switches are env vars only, and the store is always files (plus the
git sync `KRU_STORE_REPO` drives).

**A seat kept running for its return pass.** Upstream's `log-return.sh` holds a seat at
`SubagentStop` until it states its `Return pass:` line. opencode's `task` returns synchronously and
nothing can hold it open, so the plugin appends the ask to the return for the lead to make (same
`task_id`), and a second miss from that seat is what reaches the ledger.

**`/verify`, `/run`, `/simplify`, `/research`**: Claude Code bundled skills. Their references resolve
to what this fork has: the suite (`kru-testing`), the browser (`kru-local-browser`), the
`kru/code-reviewer` seat, and the `explore` subagent.

**`claude-code-delegation` / the `claude` CLI.** Upstream hands a build to Claude Code's cloud or
local headless runner and pairs it with review. This fork runs on opencode: scope and dispatch stay
in the lead contract (`task`, seats, the PR loop). The skill is excluded in `scripts/port.mjs` and
is not vendored under `skill/kru-*`.

**Nested dispatch.** Both harnesses stop a subagent from spawning another, but opencode's limit is a
config value (`subagent_depth`, default 1), not a law. The contract still assumes depth 1.

## Hand-owned: what a merge will not normalize

These are the places upstream's text cannot be rewritten by rule, so an upstream edit to them needs a
human read. `scripts/port.mjs` → `HAND_OWNED` holds the list the rules skip entirely.

| file | why |
|---|---|
| `README.md`, `PORTING.md`, `MODELS.md` | the fork's own documents; they name both harnesses on purpose |
| `SOURCES.md` → prose | the official-source map names claude's surfaces on purpose. It is `PATHS_ONLY` in `scripts/port.mjs`: the layout and name rules run on it, the vocabulary rules don't, and the design, orchestration and vendoring rows are rewritten by hand |
| `skill/kru-update/SKILL.md` | its "Claude Code" ground is about the *other* harness's releases; this fork's equivalent ground is opencode's, and the sweep needs rewriting by hand |
| `plugin/kru.ts` → the lead gate and the brainstorm lock | upstream's `require-lead.sh` and `brainstorm-guard.sh` read the session transcript, which opencode does not expose, so their state is tracked in TS (a `kru-lead` load, a `/kru/brainstorm` run, the user's go). Both call upstream's `hooks/readonly-bash.sh` for the read-only test, so an edit to its verb lists needs no mirror |
| `hooks/check-handoff.sh` → the user rules files | opencode loads `~/.config/opencode/AGENTS.md` or `~/.claude/CLAUDE.md`, so the machine-budget and shingle scans read both |
| `skill/kru-roster/audit.md` → assertion 1 | upstream dropped the seat-count check with its tagline; this fork still states a count |
| `references/ui-practice.md`, `references/designer-handoff.md`, `references/design-sync.md` | upstream design workflow vs opencode; hand-merge after each upstream design change. `design-sync.md` stays for the external designer; engineering does not run the sync lane here |
| `ROSTER.md` → *Model tiers* | upstream argues Claude tiers, `effort:` and prompt-cache TTL; here the section is three lines pointing at `MODELS.md`, and `effort:`/`cacheTtl` have no opencode equivalent |
| `skill/kru-roster/audit.md` → assertion 8 | upstream measures context load with `claude plugin details`; opencode reports none, so the assertion counts description bytes instead |
| `SOURCES.md` → *Orchestration / harness mechanics* | the lead's own official source: opencode's docs and Context7, not `claude-code-guide` |

## Known gaps

- The plugin's hooks are written against opencode's documented plugin API (typechecked against
  `@opencode-ai/plugin` 1.19) and have not been exercised against a long live session yet; every gate
  fails open by design, so a wrong assumption costs the gate, not the session.
- A dispatched seat runs in a child session; the plugin asks the server for the session's parent to
  exempt it from the lead's gates, and treats a failed lookup as a child.
- The store moved with upstream from `~/.claude/kru/` to `~/.kru/` (`KRU_HOME`). `scripts/kru-store-migrate.mjs`
  moves it once (`plugin/kru.ts` at load, `kru-oc install` before it creates the new root), and never
  over a `~/.kru/` that already holds files, or when `KRU_HOME` names another root.
- `/kru/eval-review` and `/kru/propagate` came over as upstream wrote them: the first audits a
  `claude plugin eval` suite, the second carries a release of *this* repo to set-up repos and has
  not been checked against the fork's install shape.
- `skill/kru-update`'s "Claude Code" sweep still reads as upstream wrote it (see the table).
- Nothing re-checks that a zen model id in `scripts/port.mjs` still exists; `opencode models` is the
  check, and a dead id surfaces as a failed run.
