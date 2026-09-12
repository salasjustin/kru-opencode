---
name: kru-setup
description: Set the team up in a repo — derive its standing answers, run the bars over its always-loaded AGENTS.md, and write the team into it in that file's own voice. A blank repo is grilled first (what, stack, finalize) and the team deployed from the decision. `prose` runs the pass alone. Re-run to re-derive.
disable-model-invocation: true
argument-hint: "[prose | <repo path> — omit for cwd]"
---

The plugin is the **fractional CTO**: one practice, carried across every engagement. What it cannot
carry is the engagement itself — this stack, this token file, this gate, this machine. Those are
**answers**, and a session that re-derives them every time pays twice: once reading the repo, and
again in the routing deliberation it spends reaching a conclusion this repo settled long ago.

This skill runs that derivation once and writes the answers into the repo's `AGENTS.md`,
which loads on every session there with nothing typed. **They arrive as prose in that file's own
voice** — the file belongs to the repo, and a section that reads as a foreign object is one a human
skips and a later hand-edit works around.

Two jobs: **derive this repo's answers**, and **leave its always-loaded file better than you found
it**. That file is what every session in the repo pays for on every turn, team or no team, and a repo
already carrying its own sediment does not get better because a good section was appended to it.

**The second job runs alone.** A file accretes between setups, and re-deriving a whole sheet to prune
it is a bigger hammer than the pruning needs.

| argument | run |
|---|---|
| *(none)* | this repo, both jobs — every step below |
| a repo path | both jobs, there |
| `prose` | the pass alone — every step below not marked *full run*. Read the surface, run the bars over every line already in it, propose the cuts. |
| *(a blank repo)* | no manifest, lockfile or source to derive from — step 1b, then steps 4–6 |

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
| `screens` | whether this repo renders UI, and what starts its dev server | the screen passes and the design gate |
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
convention its docs are silent on — append it to `~/.claude/kru/inbox.md` in
`{KRU_HOME}/kru/PREFERENCES.md`'s line format: lane `[code]`, source `setup`, citing the repo
file it came from. The sheet still cites the fact for this repo (*The line between the plugin and the
repo*, below).

Completion: every field carries a value with its derivation, or is absent — because this repo has no
answer for it, or because the repo's own docs already are the answer (step 2); every repo-held recipe a
plugin skill lacks has an inbox line.

### 1b. Blank repo — grill, then deploy — *full run*
Nothing on disk answers step 1, so the user does, and the sheet is written from the **decision**. Load
**`grilling`**; its rounds are these three:

1. **What we are building** — the subject, who it is for, and the one job it has to do. Completion: one
   paragraph the user has confirmed, in their words.
2. **Suggest the stack** — one recommendation per lane, chosen from the lanes this team seats
   (`{KRU_HOME}/kru/references/routing.md`) and the from-scratch defaults
   (`{KRU_HOME}/kru/references/ui-practice.md`: `pnpm`, React where a design system will be
   built), with the reason each fits *this* subject. A lane the subject needs and no seat covers is
   named as exactly that — the gate line's case, put to the user now.
3. **Finalize the stack** — the user accepts, swaps or strikes per lane. Completion: every lane the
   subject needs has a named library, or is struck.

Then **deploy the team**: steps 4–6 as on a full run, each line citing the decision it came from
(shape in `sheet.md`). The scaffold that follows is `lead`'s (its Step 2); the first re-run after it
lands swaps each decision citation for the manifest that now carries it.

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

Three that fail with no error:

- **The name is the namespace.** opencode names an MCP tool `<server>_<tool>`, sanitizing the
  server key from `opencode.json`. Several seats name `context7_resolve-library-id` /
  `context7_query-docs` in their own permission lists, so the server has to be keyed exactly
  `context7` (`"mcp": { "context7": { "type": "remote", "url": "https://mcp.context7.com/mcp" } }`).
  Key it anything else —
  `context7-remote`, `c7` — and those seats hold entries that resolve to nothing.
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

### 2. Read what the repo already says
Open the repo's `AGENTS.md`, `AGENTS.md`, `.claude/rules/*`, `AGENTS.md`, and any nested
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
<!-- kru vX.Y.Z · derived YYYY-MM-DD · /kru/setup to re-derive -->
```

It renders as nothing and does two jobs no prose does: it tells a later session the team was set up
here, and it carries the plugin version the answers came from — which is what makes them a cache
rather than a fork.

Completion: the section reads as though the file's own author wrote it, and the stamp carries the
installed `VERSION`.

### 5. Confirm, then write
`AGENTS.md` is checked in and read by everyone who clones the repo — teammates without this
plugin included, and the hand that wrote whatever you are proposing to cut. Show one reviewable diff:
the pass's edits grouped by what each one is (step 3's table), and on a full run the section going
in. Write on the user's OK, per item — they accept, keep, or reword each.

Completion: the user has seen every line going in and every line coming out, and the file holds what
they approved.

### 6. Report
What the pass reclaimed — and on a full run, the seats this repo runs, anything the derivation
turned up that the repo had never written down, and each inbox line filed upstream. One paragraph, in
the user's vocabulary.

Completion: every line that went in is accounted for in what you said, and every line that came out
is named with the file that answers it.

## Re-run — the only update path
The file is a function of *(plugin version × repo state)*, so re-deriving from scratch settles both
directions it goes stale from:

- **The repo moved** — a dependency swap, a new gate, a design system where there was none. The
  citations are the signal: a derived line that no longer matches disk is a line to re-derive.
- **The plugin moved** — `/kru/roster learn` promoted a preference, a seat was hired or renamed. The
  stamp is the signal: a stamp below the installed `VERSION` is behind.

**The citations are what make a re-run an edit rather than a second copy.** Each derived line carries
what it came from, so a re-run reads the file, re-derives, and edits the lines it can account for.
Everything else in the file is the repo's, whoever wrote it: an answer already stated in someone
else's words is theirs — cite it and move on.

## The line between the plugin and the repo
The repo's file holds the **engagement**; the plugin holds the **practice**. A rule that would still
be true in the next repo belongs upstream — `/kru/remember` files it and `/kru/roster learn`
gates it (`{KRU_HOME}/kru/PREFERENCES.md`). A rule true only here stays in the repo.

The plan store stays outside the working repo, its pointer included
(`{KRU_HOME}/kru/TRACKER.md`): the file describes the repo, never where the repo's plans live.
