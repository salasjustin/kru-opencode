---
name: kru-issues
description: Work the project's known defects — reconcile issues/ against the code, size each fix, propose a batch, and fix what the user picks.
disable-model-invocation: true
argument-hint: "[slug | substring]"
---

Take the defect list to the user as a decision, not a listing. The artifact is `issues/` at the plan store root, one file per bug; `{KRU_HOME}/kru/TRACKER.md` → *`issues/`* holds its lifecycle. Membership is the status: a file exists until the change that fixes its bug deletes it, so an empty dir is a true *no known defects*.

**The gate is the verb.** Steps 1–3 compute a proposal — no file is edited or deleted until the user has answered §4. Fix *order* is the user's call; they're the PM. This skill is user-invoked so the defect list can't be pulled into a task nobody pointed at it.

## 1. Reconcile — every file against the code

List `issues/` at `~/.claude/kru/management/<project-slug>/` (`<project-slug>` = the working repo's dir name; no repo → the cwd's). Missing or empty → *no known defects*, name `/kru/issue <what's wrong>`, stop.

Then check each file against the codebase — resolve every cited `file:line`, read the code around it, budgeted at a read pass per file, not a repro. Every file lands in one bucket:

- **fixed** — the wrong behaviour is verifiably gone: the path was removed or the condition is now handled. Cite the `file:line` or commit that shows it.
- **moved** — still wrong, but a cited `file:line` no longer resolves. Note the new anchor.
- **open** — still wrong where it says.
- **tombstone** — `status: resolved` in the frontmatter: a question the user closed as *will not fix*. Counted, never scored, never batched, never proposed for deletion — it exists so this pass does not re-raise it (`TRACKER.md` → *issues/*).

A file still carrying `_not investigated_` is a **stub**; a read pass may fill a stub's `Call sites` from what it actually found, filed as a proposal for §4 — never `Root cause`, `Repro` or `Blast radius`, which need the investigation a fix is.

**Candidates** are the files the read pass covers — the whole dir up to ~15; past that, the top 15 by §3's rank plus every file `$ARGUMENTS` names. Files outside the window stay untouched and are counted at the gate.

**Done when every candidate has a bucket** — fixed + moved + open + tombstone + counted-out equals the number of files in the dir.

## 2. Score — every open file carries an effort

`severity` is filed (`low`–`critical`) and is the value axis; leave it as filed. `effort` is `1`–`5` (`TRACKER.md` anchors), sized from the §1 read: a bare digit is the user's, `~n` is a proposal. A file with none gets `~n` now; a `~n` is re-read and kept or revised, still `~`. The user confirms or corrects at §4 and the tilde drops then — never on your own read.

## 3. Rank and propose the batch

**Rank**: `critical` → `high` → `medium` → `low`, then `effort` ascending, then **newest first** (file mtime) — a fresh defect is still reproducible in the code as filed. A `~n` ranks as `n`.

**Batch** = the top-ranked open files whose `effort` is `1`–`2`, on **different seams** so one review pass covers them, capped at what one session fixes without a brief. `$ARGUMENTS` narrows: an exact slug takes that file, anything else filters slug and heading by case-insensitive substring. A filtered run still reconciles and scores the whole dir; only the batch narrows.

## 4. Gate — show it, then wait

One message, then stop:

```
reconcile
  fixed   <slug> — src/x.ts:42 now handles the nil case          → delete?
  moved   <slug> — src/x.ts:42 → src/y.ts:18                     → re-anchor?
scores
  high     <slug> — effort: ~1   (new)                 [stub · call sites found: src/x.ts:42]
  medium   <slug> — effort: ~3 → ~2                    (rescored)
batch
  critical <slug> — effort: ~1 — <one sentence: the fix you'd make>
  high     <slug> — effort: 2  — <one sentence>
rest: 4 open, ranked: <slug> (medium · 3) · <slug> (low · ~2 · stub) · …
not read: 12 files — next run works the next 15, or name one
```

The user strikes, adds, confirms and corrects digits, accepts or declines each file edit. **Nothing is written before they answer.** No answer → the dir is exactly as you found it; say so and return to whatever was in flight.

## 5. Fix what they picked

On the user's answer, in this order:

1. **Apply the file edits they confirmed**: delete confirmed-fixed files; re-anchor confirmed moves; write found call sites into stubs; write confirmed digits bare, still-unconfirmed ones `~`.
2. **Each accepted batch file** → one of three outcomes, named individually:
   - **fixed** — `lead` Step 3 routing, Step 4 review, **one commit per file** with the repro test that replaces the write-up; the file is **deleted** at Step 4.5, in the same change.
   - **already fixed** — turned out gone on contact. Delete the file, change nothing.
   - **bigger than its `effort`** — leaves the batch. Rescore in place, then leave it or hand it to `/kru/brief`. Say which; never half-fix it to justify the batch.
   - **declined** — the user chose to carry the risk. Move the file to `archive/declined-<date>/` and add it to that dir's `README.md` with the one-line reason they gave; create both on first use.
   - **tombstone** — the user closed the premise as wrong. Write `status: resolved` into the frontmatter and their reasoning at the top; the file stays.
3. **Report**: what was fixed against which commits, what was deleted as fixed, what was rescored and to what, and the dir's file count before and after.

**Completion criterion: every accepted file has a named outcome, and every file edit the user confirmed is on disk.**

## Guardrails

- **No write before §4.** Reconcile, found call sites and scores are proposals until the user answers; the dir survives an interrupted run untouched.
- **Delete only what the user confirmed or what a landed fix closes.** A file that looks stale is *moved* or *open* until §1 shows the behaviour gone.
- **A stub stays legible as one.** Fields the read pass didn't reach keep their `_not investigated_` marker — an unanchored claim that looks investigated is what `issues/` exists to prevent.
- **Wants live in `TODOS.md`** — `/kru/todos` works those the same way.
