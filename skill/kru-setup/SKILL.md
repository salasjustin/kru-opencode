---
name: kru-setup
description: Derive this repo's kru sheet when `AGENTS.md` has no `<!-- kru v` stamp, or when the task says to derive, re-derive, or run the `prose` pass alone.
---

The plugin is the **fractional CTO**: one practice, carried across every engagement. What it cannot
carry is the engagement itself — this stack, this token file, this gate, this machine. Those are
**answers**, and a session that re-derives them every time pays twice: once reading the repo, and
again in the routing deliberation it spends reaching a conclusion this repo settled long ago.

This skill runs that derivation once and writes the answers into the repo's `AGENTS.md`,
which loads on every session there with no setup stamp. **They arrive as prose in that file's own
voice** — the file belongs to the repo, and a section that reads as a foreign object is one a human
skips and a later hand-edit works around.

Two jobs: **derive this repo's answers**, and **leave its always-loaded file better than you found
it**. That file is what every session in the repo pays for on every turn, team or no team, and a repo
already carrying its own sediment does not get better because a good section was appended to it.

**The second job runs alone.** A file accretes between setups, and re-deriving a whole sheet to prune
it is a bigger hammer than the pruning needs.

| task scope | run |
|---|---|
| *(none named)* | this repo, both jobs — every step below |
| a repo path | both jobs, there |
| `prose` in the task | the pass alone — every step below not marked *full run*. Read the surface, run the bars over every line already in it, propose the cuts. |
| blank repo / greenfield | no manifest, lockfile or source to derive from — step 1b, then 1c–1e and steps 4–6 |

## Do

### 0. Load the standard
**Load `writing-for-agents`.** Every line you write and every line you touch is always-loaded context
in every session in this repo — the strictest tier that standard governs. Its `SKILL-MECHANICS.md` is
skill-only and stays shut.

Completion: the standard is loaded.

### 1. Derive the sheet — *full run*
Read the repo. Every line **cites what it came from**: a line with no derivation is a guess, and a
re-run has no way to check it.

| Field | Derive from | What it retires |
|---|---|---|
| seat pointers | the repo's dependency manifests and lockfile, run through **`{KRU_HOME}/kru/references/routing.md`** | that table, on every later session |
| project seats | `.claude/skills/*`, `.claude/agents/*` | seats this plugin has no way to know exist |
| `skills` | the same manifests, run through **`{KRU_HOME}/kru/references/routing.md`** → *Conditional skills* | a seat reading `package.json` for its libraries on every dispatch — and the silence when a seat that never carried the skill writes against the library anyway |
| `tokens` | the design system's file, and the gate that closes it (hook config, test script) | a builder's hunt for the `## Design system` pointer — and the from-scratch design chain, since a system already exists |
| `screens` | whether this repo renders UI, and what starts its dev server | the screen passes and the PM's design-spec gate |
| `test` | the runner, its command, and **what a run costs** | rediscovering the repo's testing conventions |
| `verify` | typecheck and lint commands | the behavior gate's generic form |
| `mcp` | `claude mcp list` and `claude plugin list`, against the seats the rows above named and their **`{KRU_HOME}/kru/SOURCES.md`** rows | a seat reaching mid-run for a server this repo never enabled, and a dispatch spent finding that out |

**Cost is a field.** A runner that spawns a browser per test file, a suite that takes ten minutes, a
machine that swaps under a fan-out — none of it is knowable from the plugin, and it decides whether a
coverage sweep is a scoped run or a stalled one. Where a cost binds, write the bound. Under vitest
the per-file figure is already on disk: `node_modules/.vite/vitest/<hash>/results.json` holds
`{ results: [["<project>:<path>", { duration, failed }]] }` from the last run — test time only, no
startup, and files deleted since are still listed, so read it as a lower bound per file and an upper
bound on the file count.

Prefer a **project seat** over a plugin seat wherever the two overlap: a repo that wrote its own skill
for its own subsystem knows something the plugin does not.

**What the repo knows that a skill lacks goes upstream.** The derivation reads the repo's own testing
docs, configs and `.claude/skills/*`; where one carries a recipe a plugin skill would need in the next
repo too — a `vitest` gotcha `skill/kru-vitest/` has no row for, a runner cost the skill doesn't state, a
convention its docs are silent on — append it to the file `bash "{KRU_HOME}/kru/scripts/kru-store.sh" path inbox` names, in
`{KRU_HOME}/kru/PREFERENCES.md`'s line format: lane `[code]`, source `setup`, citing the repo
file it came from. The sheet still cites the fact for this repo (*The line between the plugin and the
repo*, below).

**A repo a major behind a skill gets a todo.** Each skill the `skills` field names carries its pin on
the *Reproduced on* line beneath its frontmatter — the packages before its `with` are the claims, the
ones after are context. Where the lockfile resolves one of those packages a major below the pin, the
skill is coaching code the repo can't run, so the upgrade is a want: append it to the file
`bash "{KRU_HOME}/kru/scripts/kru-store.sh" path todos` names, `discovered`, `plan: —`, value
`~3`, urgency `~2`, effort `~3` per major behind (cap `~5`), one sub-bullet citing the skill's pin line, the
lockfile entry, and the skill's `reference/migration.md` when it has one. A line already there naming
the package is the want, filed — leave it.

**Every other outdated dependency gets a todo too** — `pnpm outdated` (or the stack's equivalent)
names them. Patch and minor bumps file as one catch-up line; each remaining major files as its own,
same fields as above minus the skill pin. The lockfile is the evidence either way.

Completion: every field carries a value with its derivation, or is absent — because this repo has no
answer for it, or because the repo's own docs already are the answer (step 2); every repo-held recipe a
plugin skill lacks has an inbox line; every package a major behind its skill's pin has a todo line, and
every other outdated one is on the catch-up line or its own major's.

### 1b. Blank repo — grill, then deploy — *full run*
Nothing on disk answers step 1, so the PM's task carries the subject and stack, or setup grills one
round and **returns the frontier** for the next invocation. Load **`grilling`**; each round is one
numbered frontier with recommended answers — do not wait mid-run for replies that are not in the task.

When the task already settled all three — **what we are building**, **stack lanes**, **finalize** —
skip grilling and cite those decisions. Otherwise run **one round** per invocation, then return until
the task carries the answers.

When grilling is complete, **deploy the team**: 1c–1e and steps 4–6 as on a full run, each line citing
the decision it came from (shape in `sheet.md`).

Completion: the sheet holds the decided stack with its seats.

### 1c. Wire what the seats reach for — *full run*
A seat's source chain names an MCP server or a plugin, and both are enabled **per project** — so a repo
that never enabled one leaves that seat holding the tool names and none of the tools. Run
`claude mcp list` and `claude plugin list`, diff against what the step-1 seats reach for
(**`{KRU_HOME}/kru/SOURCES.md`**), and wire the gap.

**Scope is the server's blast radius, not habit.** A server encoding a fact about *this* project —
Sentry, Stripe, an auth provider, a queue — is project-scoped: `claude mcp add --scope local`, and
`claude plugin enable --scope project` (`--scope local` in a shared repo, so it stays out of the
commit). The cache is one shared copy, so a per-project entry costs a line of JSON rather than disk.
User scope is for a server genuinely reached from every engagement, and that set stays small — today
`kru`, `context7`, `typescript-lsp`, `chrome-devtools`. **Count the footprint before promoting one**:
a config byte-identical across twenty repos is the duplication the project rule prevents, not an
instance of it, and a server sitting in one repo's list out of twenty is a project fact wearing a
user-scope coat.

**The lead's board is user-scoped too.** The task tools it tracks work in ship off on newer models,
and their one switch is `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` in `~/.claude/settings.json` → `env`. Check
`env`; unset, hand the user the line `{KRU_HOME}/kru/hooks/check-task-tools.sh` prints — it
lands on their next restart.

Three that fail with no error:

- **The name is the namespace.** Several seats name `context7_resolve-library-id` /
  `query-docs` in their own tool lists, so Context7 has to be registered under the bare name
  `context7` (user scope, http `https://mcp.context7.com/mcp`). The official plugin namespaces it to
  `plugin_context7_context7_*` and the claude.ai connector to `claude_ai_Context7_*` —
  either leaves those seats holding entries that resolve to nothing. The Svelte seats name
  `svelte_*` the same way, and the `svelte@svelte` plugin namespaces its server to
  `plugin_svelte_svelte_*` — a Svelte repo registers a bare `svelte` entry in its `.mcp.json`
  (http `https://mcp.svelte.dev/mcp`).
- **A permission allowlist entry is coupled to that same prefix.** Moving a server between plugin,
  connector and local scope dead-letters every rule naming it: the rule stops matching, nothing
  errors, and the user is re-prompted forever. Re-point the allowlist in the same change that moves
  the server, never after.
- **A language server is not its compiler.** `typescript-lsp@claude-plugins-official` declares
  `lspServers` and ships no binary, so it stays inert until `typescript-language-server` is on PATH.
  Verify with an `initialize` handshake — `--version` answers from the compiler and tells you
  nothing about the server. Where a global TypeScript feeds it, pin `typescript@6`: bare `latest`
  resolves to 7.x, the native port, whose `lib/` carries no `tsserver.js`, leaving the stale
  `tsserver` shim on PATH and the LSP nothing to drive. Project-local TypeScript, which the language
  server prefers, is unaffected.

Where an http remote and a stdio `npx -y <pkg>@latest` serve the same server, take the remote — the
stdio form spawns a process per session and re-resolves `@latest` on every start.

Completion: every seat the derivation named can reach the source its row names, or the user has been
told which one it can't and what enabling it would cost.

### 1d. Grant what the team does on every run — *full run*
Two sets of actions repeat in every project, and each prompts until something grants it — with no
error and no log line, so the gap survives by being answered rather than noticed.

**The store, once, at user scope.** The cross-project root is reached from every engagement — the
case the scope rule above reserves, not an instance of the habit it warns about. Run
`bash "{KRU_HOME}/kru/scripts/kru-store.sh" home` and write the grants against **what it prints**. In `~/.claude/settings.json`:

The rows spell the default root; substitute what `home` printed when it differs.

| grant | covers |
|---|---|
| `"additionalDirectories": ["~/.kru"]` | reads outside the working dir; under `acceptEdits` it also auto-approves `mkdir`/`touch`/`rm`/`mv`/`cp` there |
| `Read(~/.kru/**)` · `Edit(~/.kru/**)` (covers Write too) | a todo appended, a defect file written, a brief rewritten |
| `Bash(rm <home>/.kru/audit/*)` · `Bash(rm <home>/.kru/management/*/issues/*)` | the two deletions the contract *mandates* — the audit closeout (`agent/kru/dispatch-auditor.md`) and the defect file a landed fix closes (`skill/kru-lead/references/reconcile.md`) |

Two things decide whether those last rules ever fire:

- **A Bash rule matches the command text, not the file it resolves to.** `planner` and
  `dispatch-auditor` carry no `write` tool, so every store write of theirs is a shell command — and
  the rule has to be written in the form the seat actually types. Expand `<home>`: `~` in a Bash rule
  matches a literal tilde, and a seat writing an absolute path walks straight past it.
- **Write the rules against the root the resolver prints** — a grant against a path the files left
  silently covers nothing. `TRACKER.md` carries why that path and no other, and
  `{KRU_HOME}/kru/references/store.md` carries the surfaces that move it.
- **A cloud session reads none of this.** User settings stay on the machine, so on that surface the
  same grants go in the repo's own `.claude/settings.json` — and the project half needs none of
  them, because the resolver puts it inside the clone, where the working-dir grant already reaches.
  With a store repo set (below), the project half lives under the home on the vm too, so the grants
  cover it there.

**The store repo, when the user works on the web.** A cloud vm's home dies with the session, so
preferences, plans and the seats' repo memory only survive it through `KRU_STORE_REPO` — a private
repo the user owns, which `hooks/store-sync.sh` keeps the home synced to. Check
`~/.claude/settings.json` → `env`. Unset and the user runs cloud sessions: offer it. On a yes, add
`"KRU_STORE_REPO": "<owner>/<store-repo>"` to that `env`. The session reaches a private store only
when the user attaches it to the session: the setup script runs with no git credentials, so its
clone of a private store fails, and store-sync clones it at session start instead.

**The cloud environment is a record in the repo.** The environment dialog is the only runtime for
what the user pastes there, so the repo carries the record and the user's part is copying. Write `.claude/cloud-setup.md` as three copy blocks and nothing
else, each under its dialog field's name:

1. **Environment variables** — `KRU_STORE_REPO=<owner>/<store-repo>`.
2. **Network access** — Custom, *include defaults* on, plus one host per line. Check every host the
   setup script downloads from against the default list (`code.claude.com/docs/en/cloud-environments`),
   since a blocked one surfaces only as a `SETUP FAIL` line in the setup log: `get.pnpm.io`, the Playwright CDNs
   (`cdn.playwright.dev`, `playwright.download.prss.microsoft.com`) and the image's own PPA
   (`ppa.launchpadcontent.net` — without it `apt-get update` 403s and every chained install is
   skipped) sit outside it. Then the hosts step 1 read off the repo's `.env*` files and SDK calls,
   sandbox hosts only, so a live key pasted by mistake reaches nothing. Context7 reaches the vm
   under its bare name too (step 1c) — the repo's `.mcp.json`, with `mcp.context7.com` listed here.
3. **Setup script**, from this base:

```bash
#!/bin/bash
# kru v<VERSION>
set -uo pipefail
exec > >(tee -a /tmp/setup.log) 2>&1

try() {
  for _ in 1 2 3; do "$@" && return 0; sleep 2; done
  echo "SETUP FAIL: $*"
}

# kru store
try git clone -q https://github.com/<owner>/<store-repo> ~/.kru
[ -f ~/.kru/setup.sh ] && try bash ~/.kru/setup.sh

# plugins
try claude plugin marketplace add anthropics/claude-plugins-official
try claude plugin marketplace add <owner>/kru
try claude plugin install kru@kru --scope user
try claude plugin enable cc-plugin-you-should-know@builtin --scope user

# <repo>: vm provisioning, each line under `try`

node --version; pnpm --version; claude plugin list
exit 0
```

Plugins install here because a cloud session ignores the repo's `enabledPlugins`; add each plugin
the user runs locally. The environment cache keeps them at the version the script installed until
the script changes, its network hosts change, or about seven days pass
(`code.claude.com/docs/en/cloud-environments` → *Environment caching*) — so the `# kru` line carries
the installed `VERSION`, and `skill/kru-propagate/SKILL.md` moving it is what rebuilds the cache on a new release. The
built-in *You should know* mod is enabled the same way: the laptop's `claude plugin enable` command never reaches
the VM, and where telemetry is off the line is a no-op. The vm has no official marketplace,
so the base adds it ahead of any `@claude-plugins-official` install. Below them goes what the vm lacks before
this repo's first run, read off step 1's findings and the repo's own setup doc (`CONTRIBUTING*`,
`README*`, `DEPLOY*`), each pinned to the version the repo pins: node's `engines` major fetched
from `nodejs.org` when it isn't one the image ships (*Installed tools* on the same docs page);
pnpm through its native installer with `SHELL=/bin/bash` in its env — the script has no login
shell, and without one the installer fails — its `PATH` edit lands in a profile the session may
never source, so the install hook below puts it on `PATH`; `apt-get install` for a system package; browsers
for a browser-mode suite, pinned to the repo's `playwright` version, whose browser build is tied
to it. `try` retries each step and names the one that still failed as a `SETUP FAIL` line, so a
blocked download reads in `/tmp/setup.log` and the first session's setup log, beside the closing
version line and plugin list that show what actually landed. The script runs as root, must exit
zero — the closing `exit 0`, since one failed step shouldn't fail the environment — and finish in about
five minutes, and only what it writes to disk survives the snapshot.

Dependencies install from a committed SessionStart hook, because a hook tracks each branch's
lockfile and the snapshot doesn't: `.claude/cloud-install.sh`, copied from
`{KRU_HOME}/skill/kru-setup/cloud-install.sh` and filled in, then checked with `bash -n`. The
template carries each line's reason. The one to keep in view when adapting it: the image puts its own
node and pnpm on `PATH`, and a hook that lets them win looks fine in a shell and fails in turbo with
`Exec format error` — so the pinned pnpm goes first on `PATH` and that `PATH` reaches later shells
through `$CLAUDE_ENV_FILE`. Where the installer lays down a binary under `.tools/pnpm-exe/<ver>/`, it's
linked into a directory holding nothing else; pnpm 12 lays down none, and its `$PNPM_HOME/bin/pnpm`
wrapper resolves relative to its own path, so that directory goes on `PATH` whole. A session
with several repos attached — the store counts — runs no repo hooks. `CLAUDE_CODE_ENABLE_TODO_TOOLS` goes in
`.claude/settings.json`'s `env`, beside the hook's registration. The credentials
posture is the user's to hold: the env-var field is readable by anyone who shares the environment,
so a private environment with sandbox values, never a staging or production file.

`KRU_NO_STORE_SYNC=1` turns the sync off for one session. The mechanics and the merge rules:
`{KRU_HOME}/kru/references/store.md` → *The store repo*.

**The repo's gates, per repo, at project-local scope.** Step 1 derived `test` and `verify`, and each
of those commands prompts on first use in each repo. They go in `.claude/settings.local.json` — the
gates run on this machine, not a teammate's. **Narrow to the commands the sheet names**:
`Bash(pnpm test:*)` grants the suite, `Bash(pnpm:*)` grants the install and the publish with it. The
settings file is the record, so no sheet field states it — an `AGENTS.md` line would be the cache bar
3 rejects.

**The gate before every commit, as the repo's `verify` skill.** opencode runs a project skill
named `verify` right before a commit (2.1.286; docs-only and tests-only commits skip it), so the
sheet's `verify` line becomes `.claude/skills/verify/SKILL.md` — the gate then runs in every session,
lead or not. Write it when the sheet has a `verify` line and no `.claude/skills/verify/` exists; one
the repo already has is a project seat, left as it is. The body is the line's commands and nothing
else — the `test` line stays out, since a suite per commit is the cost the sheet's `test` bound exists
to price:

```markdown
---
name: verify
description: Typecheck and lint this repo before a commit. Written by `skill/kru-setup/SKILL.md` from the sheet's `verify` line.
---

Run from the repo root: `<the sheet's verify commands>`. Red → fix it before the commit; the commit waits.
```

A re-run rewrites the body when the sheet's `verify` line changed and the file still carries that
description; an edited description means the repo owns it now.

**The seats' repo memory, ignored.** The seats carrying `memory: local` write what they learn
about this repo to `.claude/agent-memory-local/<seat>/` — the scope the harness defines as
per-machine and kept out of version control, and the repo's `.gitignore` is what keeps it out. Add
`.claude/agent-memory-local/` to it when no line already covers the path (`git check-ignore -q
.claude/agent-memory-local/x` answers that), so the first `git add -A` after a build leaves it behind.

Completion: every grant traces to evidence the derivation already produced, the `verify` skill
matches the sheet's line or is the repo's own, the memory path is ignored, `.claude/cloud-setup.md`
and `.claude/cloud-install.sh` (passing `bash -n`) exist with the hook registered — on every full
run, whether or not the user names cloud sessions — and the report names what the team may now do unasked (step 6).

### 1e. Encode what the seats would otherwise be told — *full run*
**`{KRU_HOME}/kru/references/lint-rules.md`** is the catalog of seat rules a check can hold. Take the rows whose stack
step 1 found, diff each against the repo's own config (`biome.json` rules and `plugins`, the
`tsconfig`, `pyproject.toml`'s `[tool.ruff]`/`[tool.mypy]`, `.golangci.yml`, `vite.config.ts`'s `sveltekit({...})`),
and file each unwired row as a slice for its owner — a lint rule is the team's call, not the
user's, and setup's part ends at the filing. The report counts them in one clause.

Completion: every catalog row for this stack is wired or filed as a slice for its owner.

### 2. Read what the repo already says
Open the repo's `AGENTS.md`, `.claude/rules/*`, `AGENTS.md`, and any nested
member `AGENTS.md`. That is the whole always-loaded surface, and reading it in one pass is the vantage
step 3 works from.

Completion: every always-loaded file in the repo is read.

### 3. The bars, and the pass
Seven bars. They govern **the line you add and the line already there alike** — which is what makes
this a pass over the file rather than an append to it.

1. **Only this repo could produce it.** A line that would read the same in any repo is a no-op paying
   rent: it changes no behavior against the default, and the model already had it from the plugin.
   The team's own identity is the standing example — `kru-lead` carries it, so a sentence
   introducing the team is a sentence the pointer already spent. **Keep the operative test and drop
   the frame around it**: a file describing itself or the surface it sits on — "everything here is
   loaded into every session", "this file holds X" — tells the reader what reading it already told
   them, and the operative test it wraps is the whole line.
2. **A meaning lives in one place.** Everything on this surface is loaded together, so a line
   repeated across two of these files is paid for twice and drifts from whichever copy is edited
   first. It binds *inside* a section as well as across files. A closing paragraph summarising the
   section's own bullets is the second copy — a charter section attracts three passes of it (the
   principle, the instruction, the rule of thumb), each reading load-bearing alone while only the
   bullets carry a distinct test. And prose beside a derived table stops where the table starts: a
   seats/stack table names the stack with versions and the manifest each came from, so the intro
   above it keeps only the product premise nothing else states.
3. **The environment is a source of truth; a line restating it is a cache.** A cache earns its load
   only when the lookup is expensive. `pnpm test` sitting in `package.json` is a one-file lookup and
   stays there — unless the line is adding what the file can't say (what the run *costs*). A **seat
   pointer** earns its line for the opposite reason: reaching it means running a routing table over
   the manifest, which is exactly the expensive lookup a cache is for.
4. **A pointer's wording is what fires it.** Front-load the leading word, name one trigger per
   branch, and cut identity the target already carries.
5. **Every line cites its derivation** — what makes it checkable on a re-run, and what makes a line
   that has gone stale findable at all. It binds every line *you* write; for a line already there,
   the test is whether it still matches disk.
6. **Reference only some branches reach sits behind a pointer**, so the lines every session needs
   stay legible.
7. **A gate is the statement; prose carries what nothing checks.** Where a type error, a lint rule, a
   resolve-time refusal or a tree-sweeping spec already enforces a boundary, that enforcement *is*
   the rule, and the line here is a second copy of it. Bar 3's twin one rung over: that one asks
   whether a **value** is cheap to look up, this one whether a **rule** is already enforced. Read it
   the other way too: a rule that is prose names what enforces it — the gate, the spec, the compile
   error — or says plainly that nothing does.

An always-loaded file is added to far more often than it is cut from, so its default state is
**sediment** — layers that settled because adding felt safe and removing felt risky. Run the bars
over every line already in it:

| Fails | Edit |
|---|---|
| reads the same in any repo (1) | delete the sentence whole |
| describes itself or the surface it sits on (1) | keep the operative test, cut the frame |
| states what another always-loaded file states (2) | keep the copy nearest the work, cut the rest |
| closes a section by summarising its own bullets (2) | cut the closer; the bullets carry the tests |
| narrates what a derived table beside it states (2) | cut back to the premise the table can't state |
| caches a one-file, one-command lookup (3) | cut it, unless it adds what the file can't say |
| names a doc without the branch that reaches it (4) | front-load the leading word, one trigger per branch |
| no longer matches disk (5) | re-derive it, or cut it |
| in-file reference burying the steps around it (6) | disclose it behind a pointer |
| restates what a gate, lint rule or compile error binds (7) | cut it; the enforcement is the statement |
| states a rule, names nothing that enforces it (7) | name the gate, or say plainly nothing checks it |

**What you keep is the whole point of the file**: the unwritten convention, the reason behind a
choice, the gotcha no config confesses, the one-way door, the ban whose cost is invisible at the call
site. Those are load-bearing however long they run — a paragraph earning its length is not sprawl,
and the repo's voice is not noise. This pass exists to make room for them.

**Every proposed cut names the file that already answers it.** A cut with no such file is not a
duplication finding — it is a rule you are asking the user to drop, and it reaches them as that
question, in their words, with what it would cost. **Open that file and verify it carries the
answer** before cutting toward it: a pointer can lead back here — a header citing this file — and the
reasoning behind one of those is the only copy, so it stays. Verify the same way afterwards. Extract
the rule phrases from before and after and diff those; a rule that lost its sentence leaves its
gate's header citing a doc that no longer states it, and re-reading the file whole is how that
survives the pass.

Completion: every line, added or already there, clears all seven bars; every line proposed for
cutting is named with the file that answers it, and that file was opened and found to carry it.

### 4. Blend — *full run*
The answers land as a **team section in the host file's own idiom** — the shape derived from that
file the way the content is derived from the repo. Read what the file already does and match it:
`{KRU_HOME}/skill/kru-setup/sheet.md` carries the fields, the two lines whose wording is
fixed, and one sheet rendered in two idioms.

**Placement is the file's own order.** The pointer orients a session before work starts, so it sits
with the file's other orienting material rather than appended below its last section. A derived fact
with a natural home in an existing section goes *there* instead — a test's cost beside the repo's
commands, a token file beside its gate — which leaves the team section holding the seats.

**The stamp** is one HTML comment directly above that section:

```
<!-- kru vX.Y.Z · derived YYYY-MM-DD · `skill/kru-setup/SKILL.md` to re-derive -->
```

It renders as nothing and does two jobs no prose does: it tells a later session the team was set up
here, and it carries the plugin version the answers came from — which is what makes them a cache
rather than a fork.

Completion: the section reads as though the file's own author wrote it, and the stamp carries the
installed `VERSION`.

### 5. Write, returning product cuts to the PM
`AGENTS.md` is checked in and read by everyone who clones the repo — teammates without this
plugin included, and the hand that wrote whatever you are proposing to cut. The sheet's lines and the
pass's edits that cut a copy another file answers are the team's: write them. Before cutting a rule
a human authored whose only copy is here, **return one question** — in their words, with what dropping
it would cost — and apply only when the invoking task approves that cut. Everything else is written
without waiting.

Completion: the file holds the pass and the sheet, and no human-authored rule left without explicit
approval in the task.

### 6. Report
A short paragraph, in the user's vocabulary: what the team now knows about this project and what it
will do differently for it — the seats this repo runs, anything the derivation turned up that the
repo had never written down, what the team may now do without asking (step 1d) in one line. The pass's edits, filed lint slices and inbox lines ride as one counted
clause ("plus 6 cleanups to the project notes"); the diff is there if asked.

Completion: before you send it, check yourself — every line that went in traces to a derivation, and
every line that came out to the file that answers it. That accounting is your check, not the report's
content.

## Re-run — the full update path
The file is a function of *(plugin version × repo state)*, so re-deriving from scratch settles both
directions it goes stale from. One release's patch to what setup wrote, carried across every repo at
once, is `skill/kru-propagate/SKILL.md`'s; a change that needs the file re-derived comes here.

- **The repo moved** — a dependency swap, a new gate, a design system where there was none. The
  citations are the signal: a derived line that no longer matches disk is a line to re-derive.
- **The plugin moved** — `skill/kru-roster/learn.md` (PM or lead loads) promoted a preference, a seat was hired or renamed. The
  stamp is the signal: a stamp below the installed `VERSION` is behind — report that to the caller; re-derive only when the task says to.

**The citations are what make a re-run an edit rather than a second copy.** Each derived line carries
what it came from, so a re-run reads the file, re-derives, and edits the lines it can account for.
Everything else in the file is the repo's, whoever wrote it: an answer already stated in someone
else's words is theirs — cite it and move on.

## The line between the plugin and the repo
The repo's file holds the **engagement**; the plugin holds the **practice**. A rule that would still
be true in the next repo belongs upstream — `skill/kru-remember/SKILL.md` files it and `skill/kru-roster/learn.md` (PM or lead loads)
gates it (`{KRU_HOME}/kru/PREFERENCES.md`). A rule true only here stays in the repo.

The plan store stays outside the working repo, its pointer included
(`{KRU_HOME}/kru/TRACKER.md`): the file describes the repo, never where the repo's plans live.
