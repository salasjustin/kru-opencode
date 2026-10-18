---
name: kru-issues-loop
description: Unattended backlog burn on defects — loop `issues` without a per-entry gate until the file cap, when the task names backlog burn or fixing bugs without stopping.
disable-model-invocation: true
---

`skill/kru-issues/SKILL.md` with the gate lifted. The loop is `{KRU_HOME}/kru/references/backlog-loop.md` — read it first and run it end to end; this file fills in the defect half. `{KRU_HOME}/skill/kru-issues/SKILL.md` is the procedure it reuses by section; its bucket, rank and outcome definitions hold here unchanged.

- **Branch**: `fix/issues-loop-<date>`.
- **Queue**: `issues` §1 and §2 over the whole dir, its §4 bookkeeping, ranked by its §3 order.
- **Eligible**: open, `effort` `1`–`3`. As in `issues` §3's weigh, a rare edge case on the money path is held, not fixed.
- **Outcomes**: `issues` §5's — *fixed* (its repro test in the same commit) · *already fixed* · *bigger than its effort* (rescored in place, left open).
- **Report**: each fixed bug as the symptom that's gone for users, then `lead` Step 5's acceptance package. The loop does not accept work for the PM.
