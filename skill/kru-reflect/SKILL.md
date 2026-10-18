---
name: kru-reflect
description: Every stack seat on the repo's sheet re-reads its own lane over a target — working tree, commit, branch, PR, or the code as it stands — against official sources, then the lead scopes, slices and partitions fixes and lands them. No separate code-review seats.
disable-model-invocation: true
---

**Look-back is not in-build review.** Work that already landed gets re-read by the seats that own each stack — against the official sources their definitions name — and then fixed. The seat that wrote a lane knows what it got wrong there: the migration's lock, the session cookie's `sameSite`, the webhook's idempotency key, the loader that fetches on every navigation. Training data is not that source; the sheet's citation is.

Two phases, and the second is why the first is worth running. **Look back** fans the roster out read-only and comes back with findings. **Then fix it** turns that pile into scoped, sliced, partitioned work and lands it. A findings list nobody sliced is a document; the slices are the deliverable.

What keeps the first phase affordable: **every seat runs in its own context**, so the main thread never carries a subsystem it isn't routing, and **every seat writes its record to disk** and returns a ranked shortlist plus a pointer. Run any other way, a look-back spends its whole budget on record the lead reads once and forwards nowhere.

## Look back

**Read-only, all of it.** Every seat in this phase, builders included, returns findings and moves nothing. That's this phase's completion criterion: when it ends, `git status` is what it was when you started, and every file in the target is assigned to a seat.

1. **Resolve the target** from the invoking task:

   | task names | scope |
   | --- | --- |
   | *(none)* | the working tree — `git diff HEAD`, plus untracked files |
   | a sha | that commit — `git show <sha>` |
   | a range `<a>..<b>` | those commits — `git diff <a>..<b>` |
   | a branch name | `git diff <base>...<branch>` — three dots, the branch's own work |
   | a number | a PR — `gh pr diff <n>`, and `gh pr view <n>` for what it claimed to do |
   | `everything` | **the code as it stands**, not a diff. Every lane the sheet seats, over its own files, sliced by subsystem |

   The first five look back **on a change**: what it got wrong that is still standing. A diff target is what that change wrote, and the files it merely grazed are `everything`'s scope. `everything` has no diff to anchor it, and is the only scope that needs slicing up front (step 4).

2. **Read the roster off the repo's sheet** — `AGENTS.md`'s seat lines (`routes`, `ui`, `data`, `skills`, `project`, and whatever else that repo answered). Those are the seats that built this code, and each line's own citation tells you the stack version the seat should be reading against. A brief hands a line down by its name (`routes`), per `lead` Step 3 → *Ambient blocks*.

   **No sheet** → the roster is a guess, and a look-back off a guess reads the wrong lanes. Return that gap to the caller with **`skill/kru-setup/SKILL.md`** named in one line; if the task still asks to proceed without a sheet, derive the lanes from `{KRU_HOME}/kru/references/routing.md` and say in the report that the roster was derived, not read. A **stale** sheet — its stamp below the installed `VERSION`, or a cited line that no longer matches disk — gets the same line, and the run continues off it meanwhile.

3. **Assign every file in the target to a stack seat on the sheet**, by the grouping rule at `{KRU_HOME}/skill/kru-lead/SKILL.md` → Step 3, *Group the change's files by seat* — a file's seat owns its stack, not the feature it was named after. **Do not dispatch `code-reviewer`, `architecture-reviewer`, `accessibility-reviewer`, or `visual-reviewer` here** — in-build Step 4 in `gates.md` is builder verification and evidence, not review seats; look-back is owning seats re-reading their lanes, not a second review pass.

   When the target carries test files, also assign them to **`test-writer`** for a read-only pass — behavior nothing covers, assertions that can't go red, tests that pass by order or clock; it runs nothing.

   UI stack seats (`react-ui-builder`, `svelte-ui-builder`, `web-components-builder`) include **spec conformance** in their lane read when the PR or brief names mockups: compare shipped UI to `{KRU_HOME}/kru/references/design-spec.md` from source and whatever the seat's official chain names — that is the owning builder checking the approved spec, not a separate `visual-reviewer` dispatch.

   Every file assigned is checkable: list the target's files, list the assignments, and the two match.

4. **Dispatch in waves, parallel inside a wave.** Every seat in a wave goes out in a single message; the next wave waits. Cheap read-only lanes go first; `test-writer` rides that wave when step 3 assigned it. There is no browser-only wave — no `visual-reviewer` or `accessibility-reviewer` in look-back. The session's own always-loaded instructions set what a wave may cost on this machine — read them and size the wave to it.

   On `everything`, a lane is a wave's worth of work by itself: one lane per seat per wave, sliced by subsystem (`apps/api`, `packages/ui`). A seat handed a whole repo returns a survey; a seat handed a subsystem returns findings.

5. **Brief each seat.** The handoff contract's seven items are `lead` Step 3's and the report path is `gates.md`'s. Three things are this phase's own, and a seat that doesn't get them reads the wrong thing:

   - **The lane, and only the lane** — the files assigned in step 3, against the official source the seat's own definition names. A finding outside its lane is one line in its report and is not pursued, because the seat that owns those files is already in the batch.
   - **Read-only, stated.** A builder seat has write tools and a bias toward using them, so the brief names findings as the deliverable and the working tree as not to move.
   - **What the work was for.** A seat still re-derives intent from code that may have gotten it wrong, which catches *built wrong* and never *built the wrong thing*. Hand down the behaviors: the PR body on a PR target, `brief.md`'s `Done when` where the store has one, the commit messages otherwise. On `everything` with none of those, the intent is the seat's sheet line, and it rides by name like the rest of the sheet.

   What comes back is three things:

   - **The findings** — ranked by severity, ten at most, each with `file:line`.
   - **The trace** — `Look-back: <what it read> · <the sources it loaded> · <what it found, or `clean`>`, on the contract and for the reasons at `{KRU_HOME}/skill/kru-roster/shared-blocks.md` → Block O. The **sources** field is this phase's addition: a seat auditing its lane from training data rather than the source its definition pins it to returns confident findings about a framework version this repo doesn't run.
   - **The pointer to its report**, which is uncapped and holds the passing rules, the tables and the coverage matrices. Leave the reports closed — their existence is the record, and reading one into the main thread is the balloon waves and shortlists exist to avoid. Open one only when a returned finding is too thin to act on.

## Then fix it

6. **Merge and rank.** **A return carrying no `Look-back:` line is unverified** — ask that seat for it before its findings enter the list, as `gates.md` does for a build return missing its `Return pass:`.

   Then one list, deduplicated, past the trigger bar (`{KRU_HOME}/skill/kru-lead/references/gates.md` → *A finding enters the fix list only when its trigger happens in normal use*) — two seats finding the same thing in the same file is one finding, credited to both — ranked by severity **across** seats rather than within them. Then split by `{KRU_HOME}/kru/TRACKER.md` → **wrong → `issues/`, wanted → `TODOS.md`, unformed → `notes/`**. Behavior nothing tests is a wrong. A look-back produces all three, and the split is what keeps this phase honest: **only the wrongs are candidates to fix now.** A want dressed as a fix is how a reflection becomes a refactor nobody scoped.

7. **Scope, slice, partition** — the three cuts, in that order, over the wrongs:

   - **Scope** — what this remediation includes. Severity ranks the list; scope draws the line across it, and everything below the line is filed, not dropped. A finding whose fix is a redesign, or whose blast radius exceeds the defect, is filed with that reason.
   - **Slice** — coherent units, each one a tracer bullet that lands on its own: a slice is something you could commit and ship by itself, not "all the auth findings." Order them by dependency, because one finding's fix is often another's precondition.
   - **Partition** — each slice to **one seat**, by the same grouping rule as step 3. A slice spanning two seats is two slices; the seat a finding was *reported* by is not always the seat that fixes it, because the file decides. A coverage slice — tests for behavior that already works — goes to `test-writer`.

   **When the sliced work won't fit one context** — many slices, many sessions, or a dependency graph worth surviving a reset — that is `planner`'s job, not yours to improvise: `lead` Step 2.6. Point it at the filed `issues/` and let it write the plan of record; then dispatch the frontier. Below that bar, the slices live on your worklist and this step is the whole plan.

8. **Gate — only on what's theirs.** A fix lands as an edit nothing has pushed yet — a two-way door — so the slices above the line dispatch now; only a slice that turns on a product call or crosses a one-way door waits for its answer (`lead` → *A question never parks work it doesn't touch*). What they see is `lead` → *Talk to a PM*, not the ranked list: the wrongs someone using the product would notice, each in one plain line of effect; everything else above the line as one counted clause ("plus 6 internal fixes: tests, duplication, comments"); and the product calls the fixes contain, each with your recommendation. The ranked list, the line you drew, what fell below it and the slice order stay on your worklist and in the seats' reports — show them when asked. The message says what's already running; they can pull any line out or promote a filed one, and that answer amends the run rather than starting it. File what fell below the line, each reference anchored `file:line`.

   **Text pass:** when the invoking task already asked for a text pass (or names `text-fix`), plan to run it after slices land — step 9. Otherwise return whether a text pass is recommended and let the next task approve it. The builders in step 9 write comments and strings alongside the code; full cleanup is `{KRU_HOME}/skill/kru-text-fix/SKILL.md`.

9. **Land the slices.** Dispatch each to its partitioned seat as an ordinary build — `lead` Step 3 and 4 handoff contract, test posture, and 2-round fix cap — **without** the review-only seats or fix→re-review loop in `{KRU_HOME}/skill/kru-lead/references/gates.md` (no `code-reviewer`, `architecture-reviewer`, `accessibility-reviewer`, or `visual-reviewer` on remediation slices). Two things this origin adds: each slice's brief names **the finding it closes** and the seat's report path so the builder can read the full write-up, and a fix that lands **deletes its `issues/` file** in the same change (`lead` Step 4.5). Builders report tests and CI evidence; **no seat declares remediation accepted for the PM.**

   **Then the text pass when step 8 committed to it or the task already asked** — once every slice has landed, not between them. Read `{KRU_HOME}/skill/kru-text-fix/SKILL.md` and run it. Hand it **what the slices landed on** — the branch where Step 4.5 committed them, or the working tree where they are still uncommitted.

10. **Hand to PM for acceptance.** After slices land, return the **`lead` Step 5** package to the caller: each closed finding's behavior criterion with **builder evidence** (what a user could not verify from the product alone) or **unproven**; PR and preview links and CI status; **PM acceptance checks** (screens vs the design spec, a11y a user hits, multi-screen flows, running the app on the preview) — the team does not boot the app or dispatch screen/journey reviewers unless the task named them. Do not declare remediation accepted or done. Seats, waves, per-seat counts and slice order stay in the record unless asked.

## Don't

- Don't fix during the look-back. A seat that edits while auditing gives you a diff and a findings list that no longer describe the same code, and phase one's `git status` check is what catches it.
