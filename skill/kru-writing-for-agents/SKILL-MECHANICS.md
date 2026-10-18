# Skill mechanics

The skill-specific branch of [`writing-for-agents`](SKILL.md): what changes when the document is a skill (frontmatter, the invocation choice, and router skills). Everything else about writing it is the universal reference in `SKILL.md`.

## Invocation

Two callers reach a skill today: a **PM bot or cloud agent** loads it (`read` the file, or a harness `skill` call), and a human on opencode may still use the legacy `/kru/<name>` command. The contract is the file on disk — not a slash menu the lead narrates for someone else to type.

Two choices, trading the two loads:

- A **model-invoked** skill keeps a `description`, so the agent can fire it autonomously when the description's branch matches the task, and other skills can point at it. The description is the skill's top-level context pointer, forced to stay loaded at all times: permanent context load in exchange for discoverability. A model-invoked skill whose content is all reference is also one home for shared reference: another skill can invoke it, so reference needed by several skills lives in one place. Mechanics: omit `disable-model-invocation`, and write a model-facing description carrying the trigger branches (the pointer-writing rules in `SKILL.md` apply in full). Allow this only when a narrow branch in the task should fire the skill without the PM naming the file — **`setup` on a missing stamp** (a stamp behind `VERSION` is reported to the caller; setup does not auto re-derive), and **`remember` when the task states what to bank**. A loose trigger on a one-way door, a product call, or a paid run is never ambient.
- A **user-invoked** skill strips the description from ambient reach: the PM loads it deliberately, and nothing else fires it from a menu label on every turn. Zero context load for skills that stall, capture, loop, or spend money without the task naming the approval. Mechanics: set `disable-model-invocation: true`; the `description` is still required frontmatter but is human-facing summary for the plugin catalog, not an always-loaded trigger. Scope — path, branch, PR number, verb — is read from the **invoking task**, not from slash-UI `argument-hint` chrome.

Pick model-invocation only when the task's wording should discover the skill on its own, or another skill must reach it. If it only runs when the PM names the file or the lead dispatches a seat, keep it user-invoked and pay no ambient description tax.

Shared reference that two user-invoked skills both need can live in neither: with ambient off, neither auto-fires the other. Push it to a plain file outside the skill system: external reference any skill can point at.

## Splitting by invocation

The invocation cut of splitting (the sequence cut lives in `SKILL.md`): split off a model-invoked skill when you have a distinct leading word that should trigger it on its own (a trigger word that actually appears in PM tasks), or another skill must reach it. You pay context load for the new always-loaded description, so that independent reach has to be worth it.

## Router skills

When many user-invoked skills would bury the PM in names, a **router skill** (usually `lead`) lists which file to `read` for which job. It names skills and seats; it does not ask a human to type them. User-invoked targets stay off the ambient menu — the lead loads them or dispatches the seat that reads the same file.
