---
name: kru-todos
description: Work the project's parked wants — reconcile TODOS.md against the code, score what's unsized, propose a batch, and build what the user picks.
disable-model-invocation: true
---

Take the parking lot to the user as a decision, not a listing. The artifact is `TODOS.md` at the plan store root; `{KRU_HOME}/kru/TRACKER.md` → *`TODOS.md`* holds its lifecycle. This is the one verb where a filed want meets the codebase: `TODOS.md` only ever grows otherwise — `issues/` is emptied by the fix that closes a file, and a want has no other exit.

**The gate is the verb.** Steps 1–3 compute a proposal; the only writes before §4 are bookkeeping, and bookkeeping is the team's — a line §1 verified done is deleted, and `effort` is sized and revised on the team's own read. The order is arithmetic, the batch is a proposal, *what gets built* and *what a want is worth* are the user's call. Building off the ranking alone is the autonomous triage the parking lot exists to prevent, which is why this skill is user-invoked.

**Not a smaller `brief`.** `brief` takes one subject and grills it to exhaustion. `todos` takes several unrelated lines, none of which earns a brief, and lands them. A line that needs the grill leaves here for there (§5).

## 1. Reconcile — every line against the code

Read the file `bash "{KRU_HOME}/kru/scripts/kru-store.sh" path todos` names. Missing or empty → say so, name `skill/kru-todo/SKILL.md` (scope in the invoking task: <the thing>), stop.

Then check each **candidate** against the codebase — a targeted grep or file-open per line, `explore` for the vague ones, budgeted at a read pass, not an investigation. Every candidate lands in one bucket:

- **done** — the code has since grown it, or another change made it moot. Cite the `file:line` or commit that shows it.
- **archived** — `plan: <slug>` whose `plan/<slug>/` is gone (`TRACKER.md` deletes it at merge). Still open; note it.
- **open** — still wanted, as far as the code says.

Mark age on every line captured 90+ days ago (`· 119d`). Age is a fact off the line; *done* is only what §1 verified.

**Candidates** are the lines the read pass covers — the whole file up to ~15 entries; past that, the top 15 by §3's rank (scored lines by `value × urgency ÷ effort`, unscored ones by **newest first**, since recency is the only order a digit-less line has) plus every line named in the task. A 99-line legacy file is not a read pass; a session that touched 15 and counted 84 is honest, one that skimmed 99 is not. Lines outside the window stay untouched and are counted at the gate.

**Done when every candidate has a bucket** — done + archived + open + counted-out equals the number of entries in the file.

## 2. Score — every open candidate carries three digits

`value` / `urgency` / `effort`, `1`–`5` (`TRACKER.md` anchors). Three cases:

- **both bare digits** — the user's. Leave them.
- **`~n`** — a past session's proposal. Re-read it against what §1 just looked at; keep or revise, still `~`.
- **legacy** (`effort:` holding a slug, a `?`, no numbers, or no `urgency`) — score what's missing now from the §1 read, filed `~n`.

`effort` is the team's estimate: sized and revised here, written `~n`, and never put to the user — a bare one is a number they volunteered, and stays. A `~` **value** or **urgency** in the batch is put to the user at §4 and drops its tilde when they confirm or correct it; it never becomes bare on your own read.

## 3. Rank and propose the batch

**Rank** `value × urgency ÷ effort` descending (`5×5/1` leads `4×5/1` leads `5×3/3`); ties to higher `value`, then **newest first** — a fresh line still has its context in the user's head and the code hasn't drifted from it; an old one already wears its age. A `~n` ranks as `n`.

**Batch** = the top **`value × urgency`** open lines whose `effort` is `1`–`2`, on **different seams** so one review pass covers them, capped at what one session lands without a brief. Value × urgency picks and effort only qualifies — a `value ≤ 2` line stays parked however cheap. Asked why a line is in, answer in product terms — what the user gets — and offer to strike it. An integer or substring in the task narrows: integer takes that capture-numbered line (the nth entry in the file — stable across appends), else case-insensitive headline filter. A filtered run still reconciles and scores the whole file; only the batch narrows.

## 4. Gate — return the batch

First the bookkeeping, without asking: delete every line §1 verified done, and write every `effort` §2 sized or revised. Then return one message as this step's result:

```
Ready to build — pick by number, strike any, or correct how much or how soon:
  5. <the want, in plain words: what someone using it gets> — matters: 4 of 5? needed: soon?
  2. <the want, in plain words> — matters: 5 of 5, needed: now
Plus 3 already done and cleared, 6 more parked, 84 not looked at yet.
```

Only the batch gets a line — **numbered by capture position**, each written as what someone using the product would get, with its `value` and `urgency` in words — needed now · soon · within weeks · later · someday for `5`…`1` — each `~` is a question for the next task to confirm. Everything else — cleared done lines, the rest of the ranking, archived-plan and aged lines, the unread count — is one counted clause. No `file:line`, no effort, no scoring notation. **Nothing past the bookkeeping is written before the next task carries the pick.** Apply §5 when the invoking task names which numbers to build.

## 5. Land what they picked

On the user's answer, in this order:

1. **Apply what they answered**: write a confirmed or corrected `value` or `urgency` bare; an unconfirmed one stays `~`.
2. **Each accepted batch line** → one of three outcomes, named individually:
   - **built** — `lead` Step 3 routing, Step 4 gates (`gates.md`), **one commit per line** so a bad one reverts alone; the line is **deleted** at Step 4.5, in the same reconciliation as the commit.
   - **already done** — turned out moot on contact. Delete the line, build nothing.
   - **bigger than its `effort`** — leaves the batch. Rescore in place, then leave it parked or hand it to `skill/kru-brief/SKILL.md`. Say which, in plain words ("bigger than it looked — parked" / "needs a plan first"); never half-build it to justify the pull.
3. **Report**: what's now different for someone using the product, one line per built want, in plain words — then one counted clause for the rest ("plus 1 already done, 1 parked as bigger than it looked"). Commits, rescores and entry counts stay in the file and the log, and surface when asked. Lines the batch never reached are exactly as filed, plus the bookkeeping and whatever value or urgency the user confirmed.

**Completion criterion: every accepted line has a named outcome, and every edit the user answered is in the file.** A line that quietly stays without an outcome is a want the user now believes was handled.

## Guardrails

- **No write before §4 but the bookkeeping.** Verified-done deletes and `effort` sizes are the team's; everything the user decides waits for their answer, so an interrupted run leaves only verified edits behind.
- **Delete only what §1 verified done or what a landed commit satisfies.** Stale is old, not done; a duplicate is two lines until the user says which one goes.
- **A `discovered` line enters the batch only when the user names it** (in the task) — a want is the user's to pull; the team's own captures wait at the gate for that.
- **Defects live in `issues/`** — `skill/kru-issues/SKILL.md` works those the same way.
