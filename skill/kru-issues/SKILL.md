---
name: kru-issues
description: Work the project's known defects — reconcile issues/ against the code, size each fix, propose a batch, and fix what the user picks.
disable-model-invocation: true
---

Take the defect list to the user as a decision, not a listing. The artifact is `issues/` at the plan store root, one file per bug; `{KRU_HOME}/kru/TRACKER.md` → *`issues/`* holds its lifecycle. Membership is the status: a file exists until the change that fixes its bug deletes it, so an empty dir is a true *no known defects*.

**The gate is the verb.** Steps 1–3 compute a proposal; the only writes before §4 are bookkeeping, and bookkeeping is the team's — a verified-fixed file is deleted, a moved anchor re-anchored, a stub's found call sites written in, `effort` sized, all without asking. *Which* bugs get fixed is the user's call; they're the PM. This skill is user-invoked so the defect list can't be pulled into a task nobody pointed at it.

## 1. Reconcile — every file against the code

List the dir `bash "{KRU_HOME}/kru/scripts/kru-store.sh" path issues` names. Missing or empty → *no known defects*, name `skill/kru-issue/SKILL.md` (scope in the invoking task: <what's wrong>), stop.

Then check each file against the codebase — resolve every cited `file:line`, read the code around it, budgeted at a read pass per file, not a repro. Every file lands in one bucket:

- **fixed** — the wrong behaviour is verifiably gone: the path was removed or the condition is now handled. Cite the `file:line` or commit that shows it.
- **moved** — still wrong, but a cited `file:line` no longer resolves. Note the new anchor.
- **open** — still wrong where it says.
- **tombstone** — `status: resolved` in the frontmatter: a question the user closed as *will not fix*. Counted, never scored, never batched, never proposed for deletion — it exists so this pass does not re-raise it (`TRACKER.md` → *issues/*).

A file still carrying `_not investigated_` is a **stub**; a read pass fills a stub's `Call sites` from what it actually found, written in at §4's bookkeeping — never `Root cause`, `Repro` or `Blast radius`, which need the investigation a fix is.

**Candidates** are the files the read pass covers — the whole dir up to ~15; past that, the top 15 by §3's rank plus every file named in the task. Files outside the window stay untouched and are counted at the gate.

**Done when every candidate has a bucket** — fixed + moved + open + tombstone + counted-out equals the number of files in the dir.

## 2. Score — every open file carries an urgency and an effort

`severity` is filed (`low`–`critical`) and is the value axis; leave it as filed. `urgency` is `1`–`5` (`TRACKER.md` anchors); a file with none gets `~n` from the §1 read, a `~n` is re-read and kept or revised, a bare digit is the user's. `effort` is `1`–`5` (`TRACKER.md` anchors), sized from the §1 read, and the team's estimate — never put to the user. A file with none gets `~n` now; a `~n` is re-read and kept or revised, still `~`; a bare digit is one the user volunteered, and stays.

## 3. Rank and propose the batch

**Rank**: `critical` → `high` → `medium` → `low`, then `urgency` descending, then `effort` ascending, then **newest first** (file mtime) — a fresh defect is still reproducible in the code as filed. A `~n` ranks as `n`.

**Weigh before you batch.** Load `incentives` and read each candidate's value as how often the defect bites × what it costs whoever it bites, against the fix's effort *and* its risk. A rare edge case whose fix needs a migration or touches the money path stays out of the batch whatever its severity — it is counted with the rest at the gate, and its reason surfaces when asked.

**Batch** = the top-ranked open files whose `effort` is `1`–`2`, on **different seams** so one review pass covers them, capped at what one session fixes without a brief. A slug or substring named in the task narrows: exact slug takes that file, else case-insensitive filter on slug and heading. A filtered run still reconciles and scores the whole dir; only the batch narrows.

## 4. Gate — return the batch

First the bookkeeping, without asking: delete every file §1 verified fixed, re-anchor every *moved* file, write found call sites into stubs, write every `effort` §2 sized or revised. Then return one message as this step's result:

```
Worth fixing now — pick by number, or strike any:
  1. <the symptom a user sees, in plain words> — serious, biting now
  2. <the symptom> — minor, but hits everyone who <does the thing>; needed within weeks?
Plus 2 already fixed and cleared, 4 more known, 12 not looked at yet.
```

Only the batch gets a line — numbered, each written as the symptom someone using the product would notice, with its severity and urgency in words (`todos` §4's words; a `~` urgency as a question for the next task to answer). Everything else — cleared files, re-anchors, stub fills, the rest of the ranking, the unread count — is one counted clause. No slugs, `file:line`, effort or scoring notation. A tombstone or a decline is the PM's to raise, not a line here. **Nothing past the bookkeeping is written before the next task carries the pick.** Apply §5 when the invoking task names which numbers to fix.

## 5. Fix what they picked

On the user's answer, in this order:

1. **Each accepted batch file** → one of five outcomes, named individually:
   - **fixed** — `lead` Step 3 routing, Step 4 gates (`gates.md`), **one commit per file** with the repro test that replaces the write-up; the file is **deleted** at Step 4.5, in the same change.
   - **already fixed** — turned out gone on contact. Delete the file, change nothing.
   - **bigger than its `effort`** — leaves the batch. Rescore in place, then leave it or hand it to `skill/kru-brief/SKILL.md`. Say which, in plain words ("bigger than it looked — still known" / "needs a plan first"); never half-fix it to justify the batch.
   - **declined** — the user chose to carry the risk. Move the file to `archive/declined-<date>/` and add it to that dir's `README.md` with the one-line reason they gave; create both on first use.
   - **tombstone** — the user closed the premise as wrong. Write `status: resolved` into the frontmatter and their reasoning at the top; the file stays.
2. **Report**: each bug that's now fixed, named as the symptom that's gone for users — then one counted clause for the rest ("plus 2 cleared as already fixed, 1 bigger than it looked"). Commits, rescores and file counts stay in the store and the log, and surface when asked.

**Completion criterion: every accepted file has a named outcome, and every edit the user answered is on disk.**

## Guardrails

- **No write before §4 but the bookkeeping.** Verified-fixed deletes, re-anchors, found call sites and `effort` sizes are the team's; everything the user decides waits for their answer, so an interrupted run leaves only verified edits behind.
- **Delete only what §1 verified fixed or what a landed fix closes.** A file that looks stale is *moved* or *open* until §1 shows the behaviour gone.
- **A stub stays legible as one.** Fields the read pass didn't reach keep their `_not investigated_` marker — an unanchored claim that looks investigated is what `issues/` exists to prevent.
- **Wants live in `TODOS.md`** — `skill/kru-todos/SKILL.md` works those the same way.
