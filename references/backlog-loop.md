# Backlog loop — the shared mechanics

`skill/kru-issues-loop/SKILL.md` and `skill/kru-todos-loop/SKILL.md` run one loop over two artifacts. Each skill owns its artifact's half — what reconciles, what is **eligible**, what an outcome is called, what the branch is named. This file owns the loop: the branch, the **cap**, one entry per pass, the report.

The invoking task is the pre-approval to burn the backlog without a per-entry gate. A **product call** or a **one-way door** — both defined in `lead` → *Talk to a PM, not to an engineer* — is still the PM's, so it is **held** for the end of the run and the run never stops to ask. The cap is the number named in the task, else `80`: the count of files changed against the default branch's merge-base never passes it at a commit, so the branch the run leaves stays reviewable.

## 1. Set up — branch and baseline

On the default branch → cut the branch the skill names. Tracked changes that aren't the loop's own → stop and say so in one line: the count needs a clean baseline, and untracked files don't enter it.

The count is `git diff --name-only $(git merge-base HEAD origin/<default>) | wc -l` — the working tree against the merge-base, so an uncommitted change counts before it lands. Read it once now; at or over the cap → report the count and stop.

## 2. Queue — once

Run the skill's reconcile and score sections over the whole artifact, then its bookkeeping writes, committed as one bookkeeping change if they touched the repo. Rank by its rank. The skill's batch and gate message are replaced by this loop.

Read each eligible entry's change against the held bar before it enters the queue: one that has to choose what the product does, says or charges is **held**, recorded with the question in outcome words; one needing a migration, a deletion of user data or anything outward-facing is **held** the same way. Load `incentives` for the weigh.

## 3. Loop — one entry per pass, serialized

Take the top queued entry and:

1. **Fit.** Estimate the files the change touches, its tests included. Count + estimate over the cap → skip to the next entry; none fits → exit.
2. **Build.** `lead` Step 3 routing and Step 4 in-build gates (builder verification — tests, lint, typecheck, evidence pairing, lead Block I on inline work), one builder at a time. The outcome is one of the skill's, or a product call surfacing mid-build → **held**, the builder's work discarded with `git checkout -- <its paths>`.
3. **Measure, then land.** Re-read the count with the change still uncommitted. Within the cap → commit it with its tests and its entry's deletion (`lead` Step 4.5), paths staged by name. Over the cap → leave it uncommitted, record it as *uncommitted*, and exit.
4. **Say it.** One status line: what's different for users, and the count against the cap.

**Exit when** the count reaches the cap, no queued entry fits, or the queue is empty. A pass that lands nothing still removes its entry from the queue, so the loop always terminates.

## 4. Report

One message closing with **`lead` Step 5 — Hand to PM for acceptance**: the branch and count against the cap, what's different for users, then the acceptance package (criteria with evidence or **unproven**, PR/preview/CI when they exist, known gaps). Held entries stay in the numbered list with a recommendation each; everything else is one counted clause under the skill's own outcome names. An *uncommitted* change is named in one line with the count it would have reached. **Do not declare the backlog burn accepted or done for the PM** — evidence and outcomes are not acceptance. Nothing is pushed unless the task approved it — the branch is theirs to review and open.

**Completion criterion: every queued entry has a named outcome — one of the skill's, held, uncommitted, or not reached — and the count at the last commit is at or under the cap.**
