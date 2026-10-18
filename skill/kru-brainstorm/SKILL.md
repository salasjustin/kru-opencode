---
name: kru-brainstorm
description: Grill an idea like brief does, grounded in the current codebase, and write nothing until the task approves persist.
disable-model-invocation: true
---

`brief` without the pen. Same grill, same codebase grounding, **nothing written** until the task approves persist — so an idea can be tried on and dropped at no cost.

The invoking task carries the idea. If it names none, return one line asking what to grill.

## Grill

Read `{KRU_HOME}/skill/kru-brief/SKILL.md` and run its preamble, §1 and §2 on the idea, read-only: §1's deletions and rewrites wait for persist approval.

**Write nothing** — no repo file, no store entry, no builder dispatched. Every settled answer lives in the session and is the hand-off.

When the frontier is empty, or the PM stops answering, one line: *nothing's saved — the task can approve persist to write a brief, or load `skill/kru-todo/SKILL.md` to park it.*

## Persist

When the task approves persist ("go", "brief it", "write the brief", or equivalent), run the brief's §1 writes, then §3 and §4, with the grill's settled answers as `Decisions resolved` — none re-asked. A frontier still open at persist runs as brief rounds first.
