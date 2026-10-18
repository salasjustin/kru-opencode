---
name: kru-todos-loop
description: Unattended backlog burn on wants — loop `todos` without a per-entry gate until the file cap, when the task names backlog burn or fixing wants without stopping.
disable-model-invocation: true
---

`skill/kru-todos/SKILL.md` with the gate lifted. The loop is `{KRU_HOME}/kru/references/backlog-loop.md` — read it first and run it end to end; this file fills in the want half. `{KRU_HOME}/skill/kru-todos/SKILL.md` is the procedure it reuses by section; its bucket, score, rank and outcome definitions hold here unchanged.

- **Branch**: `feat/todos-loop-<date>`.
- **Queue**: `todos` §1 and §2 over the whole file, its §4 bookkeeping, ranked by its §3 order.
- **Eligible**: open, `value` `3`–`5`, `effort` `1`–`3`, and `pitched`. A `discovered` line is the team's own capture and waits for the user to pull it, per `todos` → *Guardrails*; count it with the unreached. A `~` value is the team's guess at what the user wants, so it qualifies only at `4`–`5`.
- **Held, on top of the shared bar**: a want whose line leaves open what it does for the person using it — the build would have to pick the feature, which is `skill/kru-brief/SKILL.md`'s grill, not a guess.
- **Outcomes**: `todos` §5's — *built* · *already done* · *bigger than its effort* (rescored in place, left parked).
- **Report**: each built want as what someone using the product now gets, then `lead` Step 5's acceptance package. Every `~` value or urgency the run built on is listed under *Need your call* for the user to confirm, so the guess becomes their number. The loop does not accept work for the PM.
