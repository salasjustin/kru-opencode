---
name: kru-ux-principles
description: UX principles from the canon (Krug, Norman, Nielsen, Yablonski, Cooper), each carrying the code signal that betrays it in source and the fix that resolves it. Use when auditing a user flow for usability defects, when specifying the states a flow must handle, or when another skill needs the mechanism behind an interaction decision.
---

Canonical UX principles, written for an agent that has **only the source** — no browser, no screenshots. Each entry pairs the principle with its **signal**: what violating it looks like in real component code.

The principles are not the payload — any agent already half-knows them. The signal is. A principle you cannot spot in a file is a poster quote, and it does not belong here.

## The walk
An audit follows a **task**, never a file. Krug and Nielsen both evaluate "can they sign up", not "is this component good" — and the highest-value findings are the ones only a sequence exposes: the destination nothing links to, the branch with no way back, the state the code never renders.

1. Resolve the flow's entry route, then walk it: route → loader/action → components → every link, submit, and branch → terminal, error, empty, and loading states.
2. At each step, load the `reference/` group matching what that step *is* — a form step pulls `choice-and-load` and `errors-and-recovery`; a confirmation step pulls `states-and-feedback`. Two or three groups usually apply per flow, not six.
3. Match the step's source against each principle's **Code signal**. Cite `file:line` for every match.
4. Missing states are findings. The walk enumerates what the flow *should* handle; anything the code never renders is a defect, not an absence of evidence.

## Tier discipline — the rule that keeps the audit trustworthy
Every principle carries a `Detect:` tier. It governs what you are allowed to *claim*, and it is not negotiable:

- **`STATIC`** — visible in the source itself. Report as a **defect**, with `file:line`.
- **`HEURISTIC`** — inferable from source, but it turns on intent the code doesn't state. Report as a **question** ("is this the primary action?"), never as a defect.
- **`RENDERED`** — needs pixels, layout, or real timing to judge. You **cannot see it**. Name it as out of scope if it matters; reporting one as a finding is fabrication.

One invented finding costs more trust than ten real ones earn. When a signal *nearly* matches, say so and drop the tier — don't round up.

## Applying a principle
- **Read `Applies when` before applying.** Several principles invert between desktop and mobile, or between a first-run and a returning-user path.
- **Propose the fix, don't make it.** Findings are a list a builder applies.
- **A principle is a default, not a law.** Overriding one is a decision someone states out loud — a research finding, a platform constraint, an explicit call. "It reads better" is drift.
- **A stated override is not a violation — check for one before reporting.** It counts wherever the project writes it down: a comment above the code, `AGENTS.md`, the deploy or contributing docs, an ADR. Where it exists and gives a reason, the principle is answered; report it as a question about the trade at most, never as a defect. Two failure modes, both real: missing the comment sitting directly above the line you're flagging, and quoting it back as a defect anyway because it's "only prose."
- The project's own design plan and the user outrank this corpus. Surface the disagreement in one line; don't silently defer or silently override.

## The groups
`reference/` — grouped by *what the step is*, not by which book it came from:
`signifiers-and-affordances.md` (does the control announce what it does) · `flow-and-navigation.md` (where am I, where can I go, can I get back) · `states-and-feedback.md` (loading, empty, error, success, system status) · `choice-and-load.md` (how much is being asked of working memory) · `language-and-labels.md` (does the wording match the user's world) · `errors-and-recovery.md` (prevention, recovery, undo).

No group matches? `grep -ril "<term>" reference/` before concluding there's no principle. Still nothing — say so in your findings. An unlisted principle is a gap in the corpus, not licence to invent one and cite a book for it.

## Not this skill's job
- **WCAG conformance** — `accessibility-review`. The lanes touch at the signifier boundary (a `<div onClick>` is both a signifier defect and a keyboard defect); cite the overlap, don't re-audit it.
- **Rendered breakage** — `/kru/visual-review` reads rendered screens for what broke; this walks a task for journey breaks.
- **The words themselves** — `ux-copy`. This flags a *missing* error state; that skill decides what it says.
- **Conversion** — `cro`. A usability principle is not a conversion test, and the two genuinely disagree sometimes.
- **Building the primitive accessibly** — `ark-ui`. This says which principle is violated, never how to code the replacement.
- **The visual system** — palette, type scale, spacing, motion feel live in the repo's token file, transcribed from what the design turn settled.
