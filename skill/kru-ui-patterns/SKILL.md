---
name: kru-ui-patterns
description: "House rules for how a built surface behaves — form validation and focus, mutation outcomes, per-row control labels, an icon beside a wrapping label, prose to cut, actionable CLI output spans. Behavior, semantics and grouping only, never appearance. Load the one group matching your build target."
user-invocable: false
---

Match what you're about to build in the index, load that **one** `reference/` group, leave the rest. Most patterns don't apply to most components, so loading the corpus is the failure this index exists to prevent.

Each entry states the pattern, then the **default it corrects** — the thing that gets written when nobody consults the file. Read the second field as recognition: if it describes what you were about to do, the entry is for you.

## The index

| About to build | Load |
|---|---|
| a form · a submit button · validation · the message under an invalid field · a checkbox, radio or switch and the words beside it · a compact field stack · a field seeded with a stored value · a confirm dialog · anything that mutates and has to report back | `reference/forms-and-mutations.md` |
| a control that repeats per row — Remove, edit, a per-row menu · a row that renders differently for the viewer who owns it · a data table · a nav item, tab or row with an active/open state · a clickable row that also names an entity · a card or tile whose whole surface opens its item · a column of figures · a label/value ledger · a meta line, subtitle or header carrying several facts about one item | `reference/lists-and-rows.md` |
| an icon beside a label · an icon-only button in a row of text · helper text under a control · a caption · prose introducing a section · a claim about a fee, a date or a rate · a stored name or a status word the UI renders · a glyph, arrow or brand mark · a figure with a caveat or fixed period · a page heading under a breadcrumb · a target inside a line of text · a QR code | `reference/text-and-icons.md` |
| what a CLI prints for someone watching — a status line, an error, a run summary, a next-step hint | `reference/terminal-output.md` |

One file is the normal load for a slice, two where it spans a form and the list it sits in. Nothing matched? `grep -ril "<term>" reference/`, then build it your way and name the gap in your return — silence here is an unwritten pattern, not a ruling.

## Applying one
- **Every entry here decides what a component does; the design system decides how it looks.** Sequence, semantics, grouping, where focus lands, where feedback reports — that's this corpus, and all of it holds whatever the project's system says. Appearance is the token file's alone (below). A pattern here that reads like a look is a pattern to raise in your return.
- **A pattern decides what the repo hasn't settled.** Where the repo has settled it — a written note (a comment above the code, `AGENTS.md`, the plan the lead handed down) or consistent practice across its neighbours — match the repo and name the divergence in your return, so one component never reads unlike the rest. Where you disagree with a pattern the repo hasn't settled, follow it and raise it in your return.

## Owned elsewhere
- **Appearance** — color, spacing, type, radius, elevation, duration, the rank a control takes, what a focus indicator or a selected row looks like: the project's token file, via the `## Design system` pointer.
- **Whether a CSS feature is safe here** — `modern-css` owns Baseline status and fallbacks.
- **An accessible primitive's anatomy** — dialogs, comboboxes, date pickers: `ark-ui`, or the repo's existing library.
- **Whether the journey works** — `ux-principles`, audited by `ux-auditor`. This corpus is the component in front of you, not the path through the product.
