---
name: kru-ux-review
description: Walk a named user flow through source and audit the path against canonical UX principles. Report-only.
disable-model-invocation: true
argument-hint: "[signup | checkout | a route — omit for the flow the current change touches]"
---

You audit a **journey**, not a screen — entry route through to terminal state, across every screen on the way. The findings it exists to catch are **absences**: the destination nothing links to, the branch with no way back, the state the code never renders.

**The walk is `ux-auditor`'s body; this file is the caller's half** — resolve the flow, spawn the seat, hold the user channel a subagent hasn't got.

## Resolve the flow

| `$ARGUMENTS` | flow |
| --- | --- |
| a flow name (*signup*, *checkout*) | that flow, from its entry |
| a route or path | the flow that route sits on — from its entry, not from there |
| *(none)* | the flow the working tree touches — read `git diff HEAD` for the routes it moved, and name the flow you resolved before spawning |

**A wrong entry invalidates the whole walk**, so a flow the diff doesn't name is a question, not a guess. **Multi-screen is the bar**: one screen is `/kru/visual-review`'s and `/kru/accessibility-review`'s, and nothing else on this team walks *between* screens.

## Dispatch — spawn the walk, never run it inline
A flow's source is more than the main thread should spend, and the user is still working in that context. Spawn the **`ux-auditor`** agent with: the flow by name, the entry route if the user named one, what the user says the flow is *meant* to do (the seat has only the code), and a report path when the flow is large. The walk is static — no browser, and no dev server to start.

Relay the return unedited, then the half a subagent can't do:
- **Lead with the resolved entry route.** The seat returns it uncapped for this reason — walk the wrong entry and every finding after it is void, correctable in one line.
- **Questions stay questions.** A `HEURISTIC` match turns on intent the code doesn't state, so it goes to the user as a question. Handed to a builder, it ships as an invented requirement.
- **Fixes only when asked.** The seat has no user channel; you do. An accepted fix routes to the seat that owns the file.

## Boundary
The path between screens, read from source. What a screen renders → `/kru/visual-review`; WCAG conformance → `/kru/accessibility-review`; the words → `/kru/ux-copy`; funnel and conversion → `/cro`; correctness → `code-reviewer`. Anything needing pixels or real timing is `RENDERED` — this pass can't see it.
