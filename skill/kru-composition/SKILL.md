---
name: kru-composition
description: "Composition — how a screen's parts relate (grouping, hierarchy, alignment, width) and the craft of choosing values (color, type, depth, finish). Load when drafting mockups (designer), laying out a screen in code (UI builders), or checking layout that reads flat or cluttered."
user-invocable: false
---

A token file says which gaps, inks and weights exist. It never says which gap goes *between* two things and which goes *inside* one, so a screen built entirely on-system can still read as one undifferentiated stack. This skill carries that half — the **relations** between values — and, for the turns where values are being chosen at all, the craft of choosing them.

Two kinds of file, and the kind decides who loads it:

- **Relations** hold on any token file, so they bind every screen, every seat that composes one, every turn.
- **Values** are craft for the **designer's** work — choosing a palette, a type set or a shadow when drafting mockups or a system-change preview. Where a settled system exists in the repo, its token file answers every value question in engineering and these files stay closed; a value it lacks is a **named gap**, never one picked from here.

## The index

| About to | Load |
|---|---|
| lay out any screen, section or card — draft a mockup, build one, check one | `reference/layout.md` · `reference/hierarchy.md` · `reference/text.md` |
| place a photo, an icon at a new size, a screenshot, a user upload, text over an image | `reference/media.md` |
| draft visual directions from nothing — where to start, personality, what to leave undrawn (designer) | `reference/directions.md` |
| choose colours: a palette, a ramp, greys, colour on colour | `reference/color.md` |
| choose depth: shadows, raised and inset surfaces, layering | `reference/depth.md` |
| choose type: faces, a scale, line-height, tracking | `reference/text.md` → *Choosing type* |
| add finish to a plain but correct direction | `reference/directions.md` → *Finish* |

## The pass

Run it on every artboard before mockups publish to the PM (designer: `{KRU_HOME}/kru/references/designer-handoff.md`), and on any screen or section whose layout a UI builder touches before a build returns — a string fix, a token swap or a handler change skips it.

1. **Outline the groups before placing anything.** Write the screen as a tree: page → section → group → item → part (a label and its box, a title and its meta, an avatar and its name). Every node is something the reader should perceive as one unit.
2. **Give each depth of the tree its own space tier, strictly larger going outward.** Part-internal < item-internal < between items < between groups < between sections. A tier is a step on the repo's space ladder; two adjacent depths never share a step.
3. **Rank before styling.** Name the primary action per view (or none) and the reading order of the text; `hierarchy.md` spends that rank.
4. **Pick each step by its neighbours.** Guess a step, then try the one either side; two of the three usually look wrong at once. When an outer one wins, re-centre on it and compare again.
5. **Check the draft against every entry in the files the index mapped.**

**Done when** every node in the tree has a gap to its siblings larger than any gap inside it, no view has more than one distinct primary action, and every entry in the loaded files has been checked against the draft.

## Owned elsewhere

- **Whether a ladder has a rule for each step** — `design-system` (`audit`).
- **How a component behaves** — `ui-patterns`.
- **Charts and their colours** — `dataviz`.
- **Words on the screen** — `ux-copy`, and `ui-patterns` → `reference/text-and-icons.md` for which prose earns a place.
- **Whether a rendered state breaks, ambiguous grouping included** — `visual-reviewer`.
