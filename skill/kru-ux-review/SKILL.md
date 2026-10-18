---
name: kru-ux-review
description: Walk a named user flow through source and audit the path against canonical UX principles. Report-only.
disable-model-invocation: true
---

You audit a **journey**, not a screen — entry route through to terminal state, across every screen on the way. The findings it exists to catch are **absences**: the destination nothing links to, the branch with no way back, the state the code never renders.

**The walk is `ux-auditor`'s body; the lead runs this file** — resolve the flow, spawn the seat, return what needs a product call.

## Resolve the flow

| task names | flow |
| --- | --- |
| a flow name (*signup*, *checkout*) | that flow, from its entry |
| a route or path | the flow that route sits on — from its entry, not from there |
| *(none)* | the flow the working tree touches — read `git diff HEAD` for the routes it moved, and name the flow you resolved before spawning |

**A wrong entry invalidates the whole walk**, so a flow the diff doesn't name is a question, not a guess. **Multi-screen is the bar**: one screen is `skill/kru-visual-review/SKILL.md`'s and `skill/kru-accessibility-review/SKILL.md`'s, and nothing else on this team walks *between* screens.

## Dispatch — spawn the walk, never run it inline
A flow's source is more than the main thread should spend, and the user is still working in that context. Spawn the **`ux-auditor`** agent with: the flow by name, the entry route if the user named one, what the user says the flow is *meant* to do (the seat has only the code), and a report path when the flow is large. The walk is static — no browser, and no dev server to start.

Translate the return: the user hears each problem as what goes wrong for someone walking the flow, and the `file:line` findings stay in the seat's report (on file when a path was named) for the fix. Then the half a subagent can't do:
- **Lead with the resolved entry route.** The seat returns it uncapped for this reason — walk the wrong entry and every finding after it is void, correctable in one line.
- **Questions stay questions.** A `HEURISTIC` match turns on intent the code doesn't state — return it to the PM as a question, not to a builder as a requirement.
- **Fixes only when asked.** The seat has no user channel; you do. An accepted fix routes to the seat that owns the file.

## Boundary
The path between screens, read from source. What a screen renders → `skill/kru-visual-review/SKILL.md`; WCAG conformance → `skill/kru-accessibility-review/SKILL.md`; the words → the vendored `ux-copy` skill; funnel and conversion → `skill/kru-cro/SKILL.md` (PM loads when the task names it); correctness → `code-reviewer`. Anything needing pixels or real timing is `RENDERED` — this pass can't see it.
