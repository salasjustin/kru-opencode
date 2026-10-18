---
name: kru-brief
description: Grill a change to the studs, then persist the account of it — what lands, blast radius, ship cadence, decisions, non-goals, done-when — as `plan/<effort>/brief.md` in the plan store. Re-run on an effort to reconcile its brief against what actually shipped.
disable-model-invocation: true
---

Grill to exhaustion, then **write it down**, so the shared understanding survives the session, the
reset, and the hand-off to every seat downstream.

There is **no roadmap, no prioritization framework, and no PM pass** — the user is the PM and brings
the subject. Your output is not "what should we build," it's **a holistic account of the change that's
going to land**.

**Inside a repo, map it before you grill** (`lead` Step 1): a question answerable from the codebase is
answered from the codebase, never asked.

## 1. Read the intake first

The store's existing `plan/<effort>/brief.md` (if you're re-grilling an effort), `TODOS.md` (the captured, untriaged one-liners), and the store's `notes/` (freeform brainstorming — **input, never authority**: cite it as *"there's a note that says…"*, never as a decision, and never let it override the brief, the repo's docs, or the user).

Bring them back to the user during the grill: an old brief's open threads get re-decided, and a `TODOS.md` line is either pulled into this change's scope or left where it is. Order them **`value × urgency ÷ effort`** the way `skill/kru-todos/SKILL.md` ranks them — what matters, soon, for little work first, a `~n` ranked as filed, legacy lines with no digits after — and note the ones filed 90+ days ago or against a `plan/<slug>/` that's since been archived ("may be out of date"), since those are the lines most likely to be asking for a codebase that no longer exists. To the user, each surfaces as the want in plain words — what someone using the product would get — in that order, with no digits, tildes, ages or scoring notation. That ordering is arithmetic over filed numbers, not a triage: you don't triage `TODOS.md` on your own — you surface it and the user calls it.

**Walk `issues/` too — this is the dir's only reader.** Every file in it claims an open defect, and nothing else in the team ever checks that claim: read each one against the current code, **delete the ones the codebase has since fixed**, and **split the survivors live from latent** — live is reachable today by an input or a user you can name; latent's trigger doesn't exist in this codebase yet. That split is a fact off the code you just read, not a priority call, and it's the one thing the filed `severity` can't carry, having been written before anyone checked reachability. Surface only the **live** ones to the user as scope candidates, each as the symptom someone using the product would hit; the latent ones stay on file and get one counted clause at most. The user still picks. Completion criterion: **every file in `issues/` accounted for — reproduced, deleted, or explicitly left open** — because a dir nobody walks is how a bug fixed months ago stays on the books as a known defect.

**Re-grilling is reconciling, not re-reading.** Before you trust or tick anything in an old brief, check it against git — `git rev-list --count origin/main..main` plus the actual shas, and `gh pr list` for any PR the `Landing plan` claims landed. A brief claiming one unpushed commit when five are, or ticking a PR nobody opened, is the normal failure, not the odd one.

A brief pointer into `decisions.md` for a record that isn't there is a **finding, not a broken link** — handle it per `{KRU_HOME}/kru/references/lossless-doc-compaction.md` → §4 (reconstruct only what the pointer itself asserts, log the rest as a dated gap), and take anything load-bearing back into the grill as a re-decided `Q → A`. Never backfill a missing decision from memory: an invented rationale reads identical to a recorded one.

## 2. The round

`skill/kru-grilling/SKILL.md` is the engine. What the team adds on top is the **round**, and it is the same procedure whether the record persists or dies with the session (`lead` Step 2.5 runs it in-session):

Work the design tree in **rounds** — ask the whole **frontier** (every decision whose prerequisites are already settled) in one round, numbered, each with your recommended answer, then return the round to the caller before recomputing the frontier on the next invocation. Relentless until the frontier is empty and every load-bearing decision is settled; the user can cut it short anytime. A question that depends on another still open in this round belongs to a later round.

**Facts are yours, two-way doors are yours, and what's left is the round.** Anything you could look up, look up — dispatch a subagent if it's slow — instead of asking. Anything you could decide and defend, decide, and enter it in the record as a decision you made rather than a question you asked. What reaches the round is the **product calls** and the **one-way doors** (`{KRU_HOME}/skill/kru-lead/SKILL.md` → *Talk to a PM, not to an engineer*, which also governs the words you ask in).

Persisting the brief widens what's **written down**, never what's **asked**: a two-way door you settled goes into `Decisions resolved` as your call, with its reasoning — not into the round as a question.

Completion: the frontier is empty, and every question you asked was a product call or a one-way door.

## 3. Write `plan/<effort>/brief.md`

Per `{KRU_HOME}/kru/TRACKER.md` — `Change` (one line, what's different for users) · `Why now` · `Blast radius` (files/subsystems touched + risk) · **`Landing plan`** (the cadence — see below) · `Decisions resolved` (the grill record, Q → A) · `Non-goals` · `Done when` (checkboxes) · `Open questions` — only when the user cut the round short with the frontier not empty: each still-open question, numbered, with your recommended answer.

**Rewrite in place, don't append**: a re-grill reads the old brief as input and replaces it, so the file is always the *current* account of the change, never an archaeology of every discussion. Strip the brief's self-archaeology in the same pass — `(Correction, …)`, `(Amendment, …)`, `(Rewritten <date> — this read…)` — and grepping for those markers is the done-check. The brief states the current shape; the story of how it got there is exactly what `decisions.md` is for.

Once `Decisions resolved` stops being re-readable, split its long-form records (grill transcripts, as-built notes, review outcomes) into `plan/<effort>/decisions.md` per `TRACKER.md` and leave the one-line `Q → A` summaries in the brief — a stale premise survives sweep after sweep when the section holding it is too long to check. **The split is a verification, not a formatting move**: run it per `{KRU_HOME}/kru/references/lossless-doc-compaction.md` → §3, which is the rule that every bullet you delete must first resolve to a record in `decisions.md`.

## 4. Report

One line in the shape "Plan saved: <what's different for users>. Next I build it." — or, when it won't fit one session, "…Next I break it into steps, then build it." When `Open questions` was written, the line names the count ("3 questions still open"). No path, no seat or step references. Which it is follows `lead` Step 2.6 (**`skill/kru-lead/SKILL.md`** builds it, or **`planner`** slices it first).

## Cadence is yours, and it persists in the brief

You grill *and* you read the code — you're the only seat holding both the intent and the seams, so *how this ships* is your call to make and write down. Two levels:

- **Commits are the steps.** Inside a PR, one commit per coherent step of the change. If the feature fits in one PR, the `Landing plan` is *just that commit list* — don't manufacture PRs to express sequencing.
- **A PR is an environment boundary or a partial ship.** Open a second PR only when (a) **something must land in a deployed environment before the rest can proceed** — a migration whose CI runs against a real branch database, a preview deploy or provisioned resource the next slice needs live — or (b) **part of the feature is shippable before it's perfect**, with the remainder following in its own PR. Diff size, file count, and review load are **not** split reasons on their own: a big single-environment change is one PR with many commits.

Grill for the cadence like any other load-bearing decision — the environment boundary is usually the question worth asking ("does anything here need to be deployed before the next step is even testable?"). It goes in `Landing plan` as nested checkboxes; `lead` Step 4.5 ticks each commit and PR as it lands. Don't leave it implicit in the ticket graph — a big effort's `planner` tickets *expand* the landing plan, they don't replace it.

The brief is the durable input for everything downstream: `planner` reads it instead of a spec-less prompt, builders get their scope from `Blast radius` + `Non-goals`, and `Landing plan` + `Done when` are what `lead` Step 4.5 reconciles against and what each PR description is written from.
