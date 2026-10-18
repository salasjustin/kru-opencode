# Design spec — what the PM hands engineering

Read when a brief touches UI. The engineering lead checks for this **before** dispatching builders; it does not draft or approve design.

## What counts as a design spec

An **approved design spec** is two parts the PM received from the designer (a separate bot or human) and attached to the brief:

1. **Mockups** — a link or path the build can open: Figma, PNGs, a published canvas, PDF, or equivalent. Every screen and state named in the build slice appears at **desktop (1440px)** and **mobile (375px)** unless the build spec says a screen is desktop-only.
2. **Build spec** — prose or structured notes the builder transcribes from, not paraphrase: **user flows and IA** (screen inventory, entry/exit, critical paths); token values or a pointer to the token file the design settled; component/variant names; required states (empty, loading, error, disabled, focus); motion intent; **in-product and on-screen copy** the design approved; breakpoints; anything the mockup alone does not pin (spacing steps, type scale, icon set); **`design/conventions.md`** in header era when the repo uses it; and **brand/imagery paths** (marks, icons, illustration, generated or cutout assets) the build must wire without hunting.

Optional but useful: motion dials, coverage-ledger gaps handed to the PM as builder slices.

## What engineering does with it

- **Build** to the spec — the UI component builders implement components and screens; the token file and conformance gate stay the repo's (`references/ui-practice.md`, `references/ui-handoff.md`).
- **Verify** — `visual-reviewer` compares the running UI to the mockups at 1440 and 375 and reports mismatches back to the builder (`skill/kru-visual-review/SKILL.md`). `accessibility-reviewer` and `ux-auditor` run on the built UI as before.
- **Gaps** — a value the approved spec does not cover is a **named gap** to the PM (with the token name it would need), not an invention in code.

## What is out of scope for the lead

The lead **never** runs `/design`, `composition` for mockups, or a design/mockup step. Design skills in the plugin library are for the **designer** session; their output is the spec above, approved by the PM before engineering starts.
