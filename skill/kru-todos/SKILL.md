---
name: kru-todos
description: Work the project's parked wants — reconcile TODOS.md against the code, score what's unsized, propose a batch, and build what the user picks.
disable-model-invocation: true
argument-hint: "[n | substring]"
---

Take the parking lot to the user as a decision, not a listing. The artifact is `TODOS.md` at the plan store root; `{KRU_HOME}/kru/TRACKER.md` → *`TODOS.md`* holds its lifecycle. This is the one verb where a filed want meets the codebase: `TODOS.md` only ever grows otherwise — `issues/` is emptied by the fix that closes a file, and a want has no other exit.

**The gate is the verb.** Steps 1–3 compute a proposal — nothing touches the file until the user has answered §4. The order is arithmetic, the batch is a proposal, *what gets built* is the user's call. Building off the ranking alone is the autonomous triage the parking lot exists to prevent, which is why this skill is user-invoked.

**Not a smaller `brief`.** `brief` takes one subject and grills it to exhaustion. `todos` takes several unrelated lines, none of which earns a brief, and lands them. A line that needs the grill leaves here for there (§5).

## 1. Reconcile — every line against the code

Read `TODOS.md` at `~/.claude/kru/management/<project-slug>/` (`<project-slug>` = the working repo's dir name; no repo → the cwd's). Missing or empty → say so, name `/kru/todo <the thing>`, stop.

Then check each **candidate** against the codebase — a targeted grep or file-open per line, `explore` for the vague ones, budgeted at a read pass, not an investigation. Every candidate lands in one bucket:

- **done** — the code has since grown it, or another change made it moot. Cite the `file:line` or commit that shows it.
- **archived** — `plan: <slug>` whose `plan/<slug>/` is gone (`TRACKER.md` deletes it at merge). Still open; note it.
- **open** — still wanted, as far as the code says.

Mark age on every line captured 90+ days ago (`· 119d`). Age is a fact off the line; *done* is only what §1 verified.

**Candidates** are the lines the read pass covers — the whole file up to ~15 entries; past that, the top 15 by §3's rank (scored lines by `value ÷ effort`, unscored ones by **newest first**, since recency is the only order a digit-less line has) plus every line `$ARGUMENTS` names. A 99-line legacy file is not a read pass; a session that touched 15 and counted 84 is honest, one that skimmed 99 is not. Lines outside the window stay untouched and are counted at the gate.

**Done when every candidate has a bucket** — done + archived + open + counted-out equals the number of entries in the file.

## 2. Score — every open candidate carries two digits

`value` / `effort`, `1`–`5` (`TRACKER.md` anchors). Three cases:

- **both bare digits** — the user's. Leave them.
- **`~n`** — a past session's proposal. Re-read it against what §1 just looked at; keep or revise, still `~`.
- **legacy** (`effort:` holding a slug, a `?`, or no numbers) — size it now from the §1 read, filed `~n`.

Every `~` is confirmed or corrected by the user at §4 and drops its tilde then. The digits are the user's the moment they answer; they never become bare on your own read.

## 3. Rank and propose the batch

**Rank** `value ÷ effort` descending (`5/1` leads `4/1` leads `5/3`); ties to higher `value`, then **newest first** — a fresh line still has its context in the user's head and the code hasn't drifted from it; an old one already wears its age. A `~n` ranks as `n`.

**Batch** = the top-**`value`** open lines whose `effort` is `1`–`2`, on **different seams** so one review pass covers them, capped at what one session lands without a brief. Value picks and effort only qualifies — a `value ≤ 2` line stays parked however cheap. Asked why a line is in, answer in product terms — what the user gets — and offer to strike it. `$ARGUMENTS` narrows: an integer takes that capture-numbered line (the nth entry in the file — stable across appends), anything else filters headlines by case-insensitive substring. A filtered run still reconciles and scores the whole file; only the batch narrows.

## 4. Gate — show it, then wait

One message, then stop:

```
reconcile
  done      3. <headline> — src/x.ts:42 already does this           → delete?
  archived  7. <headline> — plan: checkout gone                      (stays)
scores
  5. <headline> — value: ~4 · effort: ~1   (was legacy)
  9. <headline> — value: ~3 → ~2 · effort: ~2                          (rescored)
batch
  5. <headline> — value: ~4 · effort: ~1 — <one sentence: what you'd do>
  2. <headline> — value: 5 · effort: 2  — <one sentence>
rest: 6 open, ranked: 1 (5/3) · 8 (4/3 · 119d) · …
not read: 84 legacy lines, oldest first — next run works the next 15, or name one
```

Every done line, every `~` score, and the batch go back **numbered by capture position**. The user strikes, adds, confirms and corrects digits. **Nothing is written before they answer.** No answer → the file is exactly as you found it; say so and return to whatever was in flight.

## 5. Land what they picked

On the user's answer, in this order:

1. **Apply the file edits they confirmed**: delete confirmed-done lines; write confirmed digits bare, corrected digits bare, still-unconfirmed ones `~`.
2. **Each accepted batch line** → one of three outcomes, named individually:
   - **built** — `lead` Step 3 routing, Step 4 review, **one commit per line** so a bad one reverts alone; the line is **deleted** at Step 4.5, in the same reconciliation as the commit.
   - **already done** — turned out moot on contact. Delete the line, build nothing.
   - **bigger than its `effort`** — leaves the batch. Rescore in place, then leave it parked or hand it to `/kru/brief`. Say which; never half-build it to justify the pull.
3. **Report**: what landed against which commits, what was deleted as done, what was rescored and to what, and the file's entry count before and after. Lines the batch never reached are exactly as filed, plus whatever digit the user confirmed.

**Completion criterion: every accepted line has a named outcome, and every file edit the user confirmed is in the file.** A line that quietly stays without an outcome is a want the user now believes was handled.

## Guardrails

- **No write before §4.** Reconcile and score are proposals until the user answers; the file survives an interrupted run untouched.
- **Delete only what the user confirmed or what a landed commit satisfies.** Stale is old, not done; a duplicate is two lines until the user says which one goes.
- **A `discovered` line enters the batch only when the user names it** (`$ARGUMENTS`) — a want is the user's to pull; the team's own captures wait at the gate for that.
- **Defects live in `issues/`** — `/kru/issues` works those the same way.
