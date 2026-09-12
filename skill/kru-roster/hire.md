# hire — mint a specialist

Wire every point of the **wiring map** in `SKILL.md`. Steps:

## 1. Justify the seam
State, in one line each: the seat's **single responsibility**, its **boundary** against the nearest existing seat (what it owns / where it stops), and its **backing official source**. If the responsibility overlaps a seat that already exists, **stop** — sharpen the boundary until it's distinct, or don't mint it. A seat with a fuzzy boundary is worse than no seat (`ROSTER.md` → *Scope*: adding a seat is fine, adding a blurred lane is not).

Completion: role + boundary-vs-nearest-peer + named source, all one line, no overlap.

## 2. Draft `agent/kru/<name>.md` (map #1)
Copy the **nearest peer's shape** for the seat-specific body — read it first. Optionally spawn a drafting agent with that peer file and `writing-for-agents` in context to write the body, then review it yourself. Frontmatter:
- `description` — trigger-rich, ending in a **boundary clause** that names its complementary seat (see how `architecture-reviewer` names `code-reviewer`).
- `tools` — omit for a full-access builder; scope it for a read-only reviewer (copy a reviewer's list).
- `model` — **pin an explicit full ID**, never omit and never an alias: `claude-opus-5` for code/judgment seats (the floor for anything writing code, reviewing it, or making security calls), `claude-sonnet-5` only for mechanical pattern-matching/checklist work. `inherit` is retired — it scaled every subagent's cost to the *lead's* tier; the floating `opus`/`sonnet` aliases silently change behavior under an install (`ROSTER.md` → *Model tiers*).

**The shared blocks come from `shared-blocks.md`, not from the peer.** Copy `## Context hygiene (stay lean)`, `## TypeScript (shared skill)` with `## Comments (earn the line)` right behind it, and — if the seat implements **executable behavior with a specifiable contract** — `## Test-first (shared skill)` verbatim from there, filling only the marked `{…}` slots. Peer-copying these is what caused the one real drift on record: three seats minted in one commit copied each other and silently dropped two load-bearing clauses.

**Decide Test-first explicitly, and record it.** A new code-writing seat either gets Block D or joins its exemption list *with a reason* — "it wasn't on the peer I copied" is how a whole cohort ends up untested. Add the seat to the right list in `shared-blocks.md` Block D, and to the behavior-seat roster in `lead` SKILL.md Step 3 if it's in.

Completion: file exists, meets the standard, description carries a boundary clause, and every applicable shared block matches `shared-blocks.md`.

## 3. Register (map #2–#5)
- `ROSTER.md` *Current specialists* row and *Model tiers* entry (grouped `inherit` list, or a pinned row with a one-line why in the ROSTER rationale style).
- `SOURCES.md` backing-source row (skip only if genuinely stack-agnostic — then say so in the ROSTER row).
- `{KRU_HOME}/kru/references/routing.md` row — the `detected/needed → specialist`. That table has two callers (`lead` and `/kru/setup`), so one row serves both; a repo already deployed picks the new seat up on its next `/kru/setup`. A **review-only** seat wires into *Step 4* (review & verify) instead, next to its sibling reviewer.

## 4. Version + count (map #6–#8)
Recompute the count — `ls agent/kru/*.md | wc -l` — and set it in **both** `package.json`'s description and `README.md` (don't hand-increment). Minor bump: `VERSION`, `package.json` `version`, and the `ROSTER.md` header, all equal.

Completion: **run `audit` (see `audit.md`) — it must pass.**

## 5. Hand off
Report the new seat + its boundary. Leave `commit`+`tag` to the user unless they asked (git rule). Then route work to the seat.
