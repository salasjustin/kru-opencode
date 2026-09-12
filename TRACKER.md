# Plan Store — user-level files (`~/.claude/kru/management/<project-slug>/`)

`/kru/brief` and the `planner` seat persist plans as **markdown files under `~/.claude/kru/management/<project-slug>/`** — at the **user level**, keyed per project, beside the preference store (`PREFERENCES.md`) — **not** committed to the working repo, and **not** on GitHub Issues. This file **is** the "tracker doc" the vendored planning skills ask for — **do NOT run `/setup-matt-pocock-skills`**. When a vendored skill says "the issue tracker should have been provided to you," or offers a GitHub/Linear path, use the file layout here — it is the skills' own **local-markdown path**, made canonical for this team.

**`<project-slug>` = the working repo's dir name** — the same slug convention `/kru/remember` stamps on inbox lines, so one name identifies a project across both user-level stores. No repo → the cwd's dir name. Create the dir on first write.

Why user-level files, not in-repo and not Issues: the working repo stays clean — **no management files in it, ever**: no `management/` dir, no `issues/`, no plan docs, briefs, or todo lists, and **no pointer in its `AGENTS.md`**. The store is the user's own CTO-side workspace and the repo must not know it exists — while the plan still survives context resets, branch churn, and even a re-clone. The home dir is the one place writable from every project (the same argument that placed the preference inbox there — `PREFERENCES.md`), and no network / `gh` / tokens are needed. Trade-off, recorded: the plan no longer rides into the PR beside the code — commit-time reconciliation (below) is what keeps plan and code honest instead. If you want an audit trail back, `git init` **each project's own dir** (`management/<project-slug>/`) — never one repo at the `management/` root, and never one at the `kru` root: a shared repo makes a routine `git add -A` stage another project's in-flight plan. History returns without touching any product repo.

## Layout

```
~/.claude/kru/management/<project-slug>/
  TODOS.md                 # durable, cross-cutting — captured one-liners, untriaged
  notes/                   # brainstorming — freeform thinking, no format, never authority
    <whatever>.md
  issues/                  # known defects — one file per bug, deleted when fixed
    <kebab-slug>.md        # severity frontmatter + the write-up
  plan/                    # the current effort
    <effort-slug>/
      brief.md             # the change-shaped brief — `/kru/brief`'s output
      decisions.md         # long-form decision records, split off once `Decisions resolved` outgrows the brief
      spec.md              # to-spec PRD (if the effort has one)
      map.md               # wayfinder map (wayfinder efforts only)
      tickets/             # to-tickets: one file per ticket
        <nnn>-<slug>.md    # a single ticket — YAML frontmatter (id/status/blocked_by) + prose body
```

**The repo never points at its store.** The store is found by convention, not by a breadcrumb: `<project-slug>` is the working repo's dir name (above), so any session derives the path without the repo carrying a line about it. That's exactly why every write-up here cites **`file:line`** — the prose no longer sits beside the code it describes.

**There is no roadmap layer.** No `ROADMAP.md`, no Now/Next/Later, no per-item briefs, no priority scores — the **user is the PM** and brings the subject; the team's job is to formalize and execute it. What the store holds is (a) the current change, written down, and (b) raw wants nobody has decided on yet.

**One file per ticket.** Each ticket is its own file under `plan/<effort>/tickets/`, named `<nnn>-<slug>.md` where `<nnn>` is a zero-padded dependency-order sequence (`010`, `020`, … — gaps left to insert later) and `<slug>` is kebab-case from the title. One-per-file keeps diffs clean, ids stable across renames, and keeps edits from trampling each other when tickets are edited in sequence. Upstream `to-tickets` converged on one-per-file too as of mattpocock v1.2.0 (`.scratch/<slug>/issues/<NN>-<slug>.md`); what stays this team's override is the **location** (the user-level store, not `.scratch/` in the working repo), the wider `<nnn>` sequence, and the `id`/`status`/`blocked_by` **frontmatter** that makes the frontier a query instead of a prose scrape.

**Four lifetimes:**
- **`plan/`** holds the efforts — one `<effort-slug>/` dir each, self-contained. A repo hosting more than one product carries one dir per product, and they are never folded together or ranked against each other. *Execution* stays sequential (one shared store per project), and the store never marks an effort "active": the user names the effort when they start work. Archive a dir once its effort ships (see *Naming*).
- **`TODOS.md`** is *durable* and cross-cutting — it must outlive any one effort, brief, or branch. A mid-implementation "not now, but remember it" appends here so the want survives both the current effort shipping and the next `brief.md` rewrite. The store sits outside every worktree, so there is exactly one copy — no branch-vs-branch merge to resolve, and the sequential-execution rule is what keeps concurrent writers from racing it.
- **`notes/`** is *durable and unmanaged* — brainstorming, sketches, comparisons, pasted research, arguments that haven't resolved. No lifecycle, no triage, no sweep: files accumulate and the user deletes them when they stop being interesting. It exists so the store can hold thinking that isn't yet a proposal, without that thinking leaking into `TODOS.md` (which is a parking lot for *proposals*) or into a brief (which is the current account of a change that's actually landing).
- **`issues/`** is durable per bug and *mortal per fix* — a defect file outlives briefs and efforts, and is deleted by the change that fixes it. The dir is the **live** defect list, never an archive; `git log` in the working repo is where fixed bugs live on.

## Status & the frontier (frontmatter, not a prose scrape)

There are no issue labels and no tracker UI — status and edges are **typed YAML frontmatter** on each ticket file, so the frontier is a deterministic query, not a scan of prose. (This amends the vendored `<tickets-file-template>`, which is single-file and prose-only: keep its body verbatim, wrap it per-ticket with the frontmatter below. The template stays re-syncable; the frontmatter is this team's local override, same as the store itself.)

A **ticket file** is:

```markdown
---
id: t3                 # stable identity — edges point at this, never at the title
status: todo           # todo | doing | done
blocked_by: [t1, t2]   # ids of the tickets that gate this one; [] if none
---
# <Ticket title>

**What to build:** the end-to-end behaviour this ticket makes work — not a layer-by-layer list.

- [ ] acceptance criterion 1
- [ ] acceptance criterion 2
```

- **`id`** is the join key: short and stable (`t1`, `t2`, …). Renaming a ticket's title or slug never breaks an edge, because edges reference the id, not the title.
- **`status`** is the machine roll-up the frontier reads — `todo` → `doing` (claimed / in progress, since execution is sequential) → `done`. The `- [ ]` acceptance boxes stay as the builder's in-ticket checklist and the evidence for done-ness; the builder flips `status: done` once they're all checked and the slice is verified. Status is read from the field, never by scraping boxes.
- The **frontier** = every ticket with `status != done` whose `blocked_by` ids are **all** `status: done`. One query over the frontmatter (`grep`/parse), no prose reading. A frontier ticket is agent-grabbable by construction (replaces GitHub's native `blocked_by` + the `ready-for-agent` label).

Other artifacts:
- A **brief** (`plan/<effort>/brief.md`) is prose, not typed — no frontmatter, no id, no status. Its presence in an effort dir **is** the handoff signal to `planner`, which reads it as the already-scoped brief for to-spec. See *The brief* below.
- A **wayfinder ticket** is a ticket file under `plan/<effort>/tickets/` with the frontmatter above plus `type: research|prototype|grilling|task`. `status: doing` **is** the claim (replaces per-issue assignee) — an open ticket at `todo` is unclaimed. It is **closed** by setting `status: done` and gisting its one line into the map's *Decisions so far*. The `map.md` file itself is the `wayfinder:map` artifact.

**Ids join; titles narrate.** Frontmatter edges use ids; everything a human reads — your return, map bodies, *Decisions so far* — refers to a ticket by its **title** wrapping its file link, never a bare id. The id is a machine handle, not a human one.

## Reconcile & capture (the lead, at commit)

The store only stays truthful if the plan moves **with** the code. There is no git hook and no tracker daemon — reconciliation is a **lead** action (`lead` skill, Step 4.5), run at the **same moment** as the commit that lands each slice. The store lives outside the repo, so the write doesn't ride in the commit — reconciling as each slice lands is precisely what keeps `git log` and the plan telling the same story instead of drifting. It's automatic (write, then report); **`lead` Step 4.5 states the gate once** — the two captures have no precondition, the two reconciliations need a `plan/<effort>/` to reconcile against:

- **Ticket status** → set `status: done` on every ticket whose acceptance boxes are all satisfied; recompute the frontier and report the new takeable set. Never `done` on unchecked acceptance — that's what makes the frontier lie.
- **Brief** → tick the `Done when` boxes the slice satisfied and check off the landed **commit** in `Landing plan` (and its parent PR when that PR merges); correct `Blast radius` if the change reached further than the grill predicted. In place, in `plan/<effort>/brief.md`.
- **Todo capture** → a pitched or discovered want, out of scope for the current slice, appends **one line** to `TODOS.md`. Zero-friction and pre-triage: no brief, no evidence, no ranking — just the line, plus the `value`/`effort` pair you can answer from what's already loaded and a `?` where you can't — and never derail the task to build it.
- **Defect capture** → a bug that isn't being fixed in this slice gets **its own file** under `issues/` (below), not a line in `TODOS.md`. Fixed it in the slice instead? **Delete** its file in the same change.
- **Todo closeout** → a slice that satisfies a parked want **deletes its line** from `TODOS.md`, same as a fix deletes its `issues/` file. The parking lot is what's still open.
- **`notes/` is not swept** → nothing here writes to it. It's the one artifact with no capture rule: the user writes it, and the lead only when asked to keep something they thought out loud.

**`TODOS.md` — captured, untriaged.** A single flat file at the **store root**, deliberately outside `plan/` so it survives both a `brief.md` rewrite and the effort dir being archived. It is a lossless parking lot: raw wants don't pollute the current change's brief, and nothing is lost mid-task. Entry format:

```markdown
- <one-line want> — _pitched|discovered · value: <1-5|~1-5> · effort: <1-5|~1-5> · plan: <slug> · 2026-07-12_
```

`pitched` = user, `discovered` = team — filed only for a want that surfaced inside an effort in flight, carrying that `plan: <slug>`; a freestanding want is the user's to file (`/kru/todo`), named in the lead's report; `plan` is the effort slug it surfaced in (`—` when none applies); the date is when captured. Capture has no precondition: no store yet → create the dir and the file. The lead **does not triage it** — the next `brief` verb run reads the file back to the user during the grill, and the user (the PM) decides what gets pulled into the change's scope and what stays parked. Until then a line here is a reminder, explicitly **not** a commitment.

**Two numbers, so the list can be read.** `value` and `effort` are `1`–`5`, filed by whoever captured the line and overwritten by the user on sight. They carry no commitment — they exist so `/kru/todos` can rank the file **`value ÷ effort`**, high value and low effort first, which is the only thing a parking lot that only grows needs to stay usable. Anchors: `value` `1` marginal · `3` clearly worth doing · `5` unblocks other work or fixes something hit repeatedly; `effort` `1` one file under an hour · `3` one focused session · `5` multi-session, wants a brief first.

**A `~` marks whose number it is.** The same cost rule that governs expansion governs scoring: the user's own words win and are filed bare; a number the capturing session supplied — from loaded context or from the line's own wording — is filed `~n`, a proposal. It ranks like any digit and prints with its tilde, so the user always sees which ranks they set; it drops when they confirm or correct it (`todo`'s confirmation line, `todos`' gate). Opening a file to sharpen a proposal is the task the user just declined. (`effort` held the plan slug before this split; a line carrying a slug there, or a `?` from before proposals, is legacy, unranked, and rescored only by re-filing.)

**Expansion, when the writer already knows more.** A capture made mid-session — by the lead's sweep, or by `/kru/todo` while a build is loaded — may carry at most **two indented sub-bullets** holding what the writer already had in context: the `file:line`, the constraint, why it's deferred, what it depends on.

```markdown
- <one-line want> — _pitched · value: 4 · effort: 1 · plan: <slug> · 2026-07-12_
  - _from session:_ `src/x/y.ts:42` already special-cases this; deferred until the adapter lands
```

The headline stays one line regardless. The rule is **cost, not usefulness**: context already loaded is free to write down and evaporates if you don't, but nothing here justifies a *fetch* — no `explore`, no grep, no opening a file to enrich a line. A cold capture is one line and that's correct, not lazy. Cite `file:line` for anything named, same as everywhere else in the store.

**The line leaves when the work lands.** `TODOS.md` is the **open** parking lot, not an archive — the same rule that makes an empty `issues/` a true claim. A slice that satisfies a parked want **deletes its line** in the same Step 4.5 reconciliation that commits the work, because the commit is where the want is written down now. A **curation sweep** that lifts many lines at once — landed, stale (subject gone), or decided (a record, not a want) — moves them **verbatim** to `archive/todos-<verdict>-<date>.md` so the entry count balances (`{KRU_HOME}/kru/references/lossless-doc-compaction.md`); a single line retired by its own commit is simply deleted. The verb that lands wants is **`/kru/todos`** (`skill/kru-todos/`): it reconciles every line against the code, scores what's unsized, proposes a batch off the ranked file, **waits for the user's pick**, and retires each line it lands. It's also the only place a filed `value`/`effort` meets the code and is corrected — a want that turns out bigger than its number is **rescored in place and left parked**, never half-built to justify the batch. Nothing is written before the user answers; everything the batch never reached stays as filed plus whatever digit the user confirmed.

**Two writers, one format.** Mid-task capture is the Step 4.5 sweep above (`pitched` when the user tossed it out, `discovered` when the team turned it up inside the effort in flight). The **`/kru/todo` skill** (`skill/kru-todo/`) is the user's direct front door for when there's no task running to sweep from: always `pitched`, expanded only from context already loaded, then straight back to whatever was in flight. Same file, same line format, same no-precondition rule; the skill adds an entry point, not a second lifecycle. It is **user-invoked** (`disable-model-invocation`), so the lead can't fire it — and doesn't need to, since the lead's own capture is the sweep above. Its working half is **`/kru/todos`** (`skill/kru-todos/`), above: reconcile → score → propose → gate, numbered by capture position so a number stays a stable handle as the file grows, and stale marked (90+ days, or `plan: <slug>` whose dir is gone). The user decides at the gate; `brief` still reads the file back during its grill.

**`notes/` — brainstorming, deliberately unmanaged.** Freeform markdown at the store root, any filename, no frontmatter, no template, no status. This is where half-formed thinking goes: a comparison of three approaches nobody has picked between, a pasted spec excerpt, a sketch of a data model, an argument the user is still having with themselves. The whole point is that it has no shape — the moment a note needs frontmatter or a lifecycle it has become a brief, a ticket, or an issue.

**A note is input, never authority.** This is the one rule the dir carries, and it is what keeps it safe to write in freely. Decisions live in `brief.md` (the current change) and in the working repo's own docs (the product); a note is a draft of thinking that may have been abandoned five minutes later. So: read `notes/` during a grill for material, cite it to the user as *"there's a note that says…"* rather than as settled, and never let a note override the brief, the repo's docs, or the user. An agent that treats stale brainstorming as a decision is the exact drift this store exists to prevent.

Who writes it: the **user**, mostly, and the lead when the user thinks out loud and asks for it to be kept. Unlike `TODOS.md` and `issues/`, **there is no capture rule and no Step 4.5 sweep** — nothing writes here automatically. Store root, not `plan/`, so notes survive a brief rewrite and the effort dir being archived.

It also answers a recurring question: *where do I put private project notes?* Not the working repo — a gitignored `notes/` there is one `git add -f` or one forked `.gitignore` from being published, and it splits private thinking across two homes. The store is already outside every repo and every worktree.

**`issues/` — known defects, one file per bug.** A defect is something *wrong*: an incorrect result, false information shown to a user, or a failure of a condition the code claims to handle. Something merely *wanted* — a feature, a refactor, a cleanup, duplication, misfiled config — is a `TODOS.md` line, not an issue. The three-way split is the whole rule: **wrong → `issues/`, wanted → `TODOS.md`, unformed → `notes/`.**

```markdown
---
severity: high      # low | medium | high | critical
effort: ~2          # 1-5, sized by /kru/issues; ~n until the user confirms
---
# <what's wrong, one line>

**Call sites:** `src/x/y.ts:42`, `src/x/z.ts:118`
**Observed:** what actually happens
**Root cause:** why
**Repro:** the shortest path to see it
**Blast radius:** what else this reaches
**Fix options:** 1) … 2) …
```

**Membership is the status.** A file in `issues/` is a live defect and a fix deletes it, so the dir already answers the only question a status would; live files carry `severity` and `effort` and nothing else. In-flight-ness is session state (the lead's worklist), not frontmatter: a `fixing` value has no writer that survives a context reset, so it can only ever go stale. Two exits besides the fix, both the user's call at the `/kru/issues` gate:
- **tombstone** — the premise was wrong and the question is closed (*will not fix*). The file **stays**, with `status: resolved` in its frontmatter and the reasoning at the top, so the next sweep finds the answer instead of re-filing the finding. `resolved` is the only value `status` ever takes.
- **declined** — a real risk the user chose to carry. The file **moves** to `archive/declined-<date>/`, whose `README.md` names each one and why (the archive-README rule under *Naming*); it leaves `issues/` because that dir is the live list, and it is kept because an accepted risk is re-decidable when the situation changes.

Every reference cites **`file:line`** — the write-up lives outside the repo, so a bare filename or an unanchored code quote is unfollowable. Same no-precondition rule as todo capture: create the dir on first write. **Delete the file in the same change that fixes the bug** — an empty `issues/` means no known defects, which is only true if fixed bugs leave.

**Two writers, one shape.** Mid-task capture is the Step 4.5 sweep (a reviewer, a test run, or the user surfaces a bug this slice isn't fixing) — the lead writes it up **in full**, because it already has the code in context. The **`/kru/issue` skill** (`skill/kru-issue/`) is the user's direct front door for when no task is running: same path, same frontmatter, but **un-investigated**, with `Call sites`/`Root cause`/`Repro`/`Blast radius`/`Fix options` written as `_not investigated_` until someone asks. **User-invoked**, same as its `todo` sibling — the lead can't fire it, and its own channel is the sweep. That marker is the rule, not a formality: a defect file that *looks* complete and isn't is worse than an obvious stub, because the next reader trusts it. Filling one in is a normal `lead` task; the lifecycle above is unchanged either way. Its working half is **`/kru/issues`** (`skill/kru-issues/`): reconcile every file against the code (fixed · moved · open), size each fix as `effort`, propose a severity-first batch of `effort: 1`–`2` fixes, and **wait for the user's pick** before writing anything — a confirmed-fixed file is deleted, a stub keeps every `_not investigated_` the read pass didn't reach, and a fix deletes its file in the same change. It infers no status — membership already is the status, so an empty dir reads as *no known defects*.

## The brief (`/kru/brief`)

`plan/<effort>/brief.md` — the lead's grill, formalized. One per effort, **rewritten in place** on every re-grill (the old brief is read back as input, never appended to), so the file is always the *current* account of the change rather than an archaeology of every discussion. Prose, not typed: no frontmatter, no id, no status — its existence in the effort dir is the signal.

It is **change-shaped, not product-shaped**: it accounts for the change that's going to land, not for what the product should become. No priority score, no framework, no horizon, no success metrics — the user is the PM and already decided *whether*; the brief settles *what, how far, in what order, and when it's done*.

```markdown
# <effort>

**Change:** one line — what lands.

## Why now
The user's own framing from the grill, in their words. Not a business case.

## Blast radius
- touches: `src/x`, `src/y` — from `explore`'s map, not guessed
- risk: what breaks if this is wrong; what's irreversible

## Landing plan
Default is **one PR, commits are the steps**. Split only on an environment boundary or a partial ship:
- [ ] **PR 1 — <title>** · <why it's its own PR: needs to land in staging first / ships without the rest>
  - [ ] `<commit 1>` — <step>
  - [ ] `<commit 2>` — <step>
- [ ] **PR 2 — <title>** · follows PR 1 once <what PR 1 proved in the environment>

## Decisions resolved
- Q: <the question asked> → A: <what the user decided>

## Non-goals
- explicitly out of scope, so a builder doesn't drift into it

## Done when
- [ ] the end-to-end behaviour that must work
```

**Split `decisions.md` off when `Decisions resolved` stops being readable.** The brief is the *current* account of the change; a decision log is *history*, and history grows without bound. Move the long-form records — grill transcripts, as-built notes, review outcomes, corrections-to-corrections — to `plan/<effort>/decisions.md`, leaving one-line `Q → A` summaries in the brief so it still reads end to end. The trigger is **legibility, not size**: the failure this prevents is a stale premise surviving sweep after sweep because nobody re-reads the section to check one (observed at 39 KB of a 55 KB brief). The brief is still rewritten in place on every re-grill; `decisions.md` is append-only **chronologically, not at EOF** — a new record goes into its dated section, so build records don't stack up behind a founding grill that predates them — and the brief keeps `Change`/`Why now`/`Blast radius`/`Landing plan`/`Non-goals`/`Done when` whole.

**Splitting one file, or compacting the whole store, is a verification — not a formatting move.** The procedure is `{KRU_HOME}/kru/references/lossless-doc-compaction.md` (the lead dispatches it, `lead` Step 4.5): curate by the **recurring read** — what a run opens every time — never by total size; checkpoint the store's git first; and never delete prose from a summary until its content is found in the long-form record, appending it there first where it isn't. A dead pointer into `decisions.md` is a **finding, not a broken link** (reconstruct only what the pointer itself asserts, log the rest as a dated gap). Nothing is deleted, only relocated, so the store's total grows while the recurring read falls — both numbers get reported.

**`Landing plan` is the cadence, and it lives here on purpose.** The lead grills *and* reads the codebase (Step 2 `explore`), so it's the only seat that knows both the intent and the seams. It is the durable answer to *how this ships*, and Step 4.5 ticks it as each commit and PR lands.

**Two cadences, and the split rule between them:**

- **Commits are the steps.** Inside one PR, each commit is one coherent step of the change — the reviewable unit, and the bisect/revert granularity. A feature that fits in one PR has a landing plan that is *only* a commit list.
- **A PR is an environment boundary or a partial ship.** Cut a second PR when — and generally only when — one of these is true:
  1. **Something must land in a deployed environment before the rest can proceed** — a migration whose CI has to run against a real branch database, a preview deploy the next slice builds on, an env var or provisioned resource the following work needs live.
  2. **Part of the feature is shippable before it's complete** — the imperfect-but-useful core goes out now, the polish/edge cases follow in their own PR.

Everything else — file count, diff size, "this feels like a lot" — is **not** a reason to split. A big single-environment change is one PR with many commits, not five PRs.

The relationship to tickets: **the brief holds the cadence, `tickets/` holds the detail.** A small effort has a `Landing plan` and no tickets at all — the brief is the whole plan. A large one goes through `planner`, which expands each landing-plan step into tracer-bullet tickets with `blocked_by` edges. The landing plan stays the index either way.

## Planning operations (`planner`)

`planner` reads the effort's `brief.md` as its already-scoped input — it doesn't re-derive scope or re-open settled decisions, and it inherits the brief's `Landing plan` as the cadence rather than inventing its own — each landing-plan step becomes one or more tickets.

- **to-spec** → `plan/<effort>/spec.md`, using the skill's spec template. The seam sketch still goes to the lead to confirm; the file is the published spec.
- **to-tickets** → one file per ticket under `plan/<effort>/tickets/`, keeping the skill's `<tickets-file-template>` body verbatim and wrapping each ticket with the `id`/`status`/`blocked_by` frontmatter above. Files named in dependency order (`<nnn>-<slug>.md`, blockers first); edges by **id**. Tickets expand the brief's `Landing plan` — each PR in the plan becomes one or more tickets, and the plan stays the index. This is the skill's *Local-files* path, made canonical here (per-file + frontmatter).
- **wayfinder** → `plan/<effort>/map.md` (Destination / Notes / Decisions-so-far / Not-yet-specified) plus its tickets as files under `tickets/` (frontmatter + `type:`); resolve one per session, setting `status: done` and gisting each closed ticket into *Decisions so far*.

## Naming

`<effort-slug>` and `<slug>` are short kebab-case, from the effort / ticket title; a ticket file is `<nnn>-<slug>.md` (dependency-order sequence + title slug). One effort dir per plan. Once an effort's work has merged and every ticket is `status: done`, delete or archive its `plan/<effort>/` dir — `TODOS.md` at the store root outlives it.

**An archive dir's name asserts a lifecycle, so name it honestly.** `archive/<effort>-<date>/` says the effort **closed**. Archiving mid-effort purely for size is `archive/<effort>-records-<date>/`, and its `README.md` leads with *this is a size cut, not a completion* — otherwise the next reader takes in-flight work for finished work. Every archive dir gets that README: why archived · what would be lost without it · a what-lives-where table · an explicit "these decisions are reversed/superseded — do not read as current" section · where the work went next.
