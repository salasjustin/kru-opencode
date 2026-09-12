---
name: kru-artboards
description: Artboards — self-contained `.dc.html` files drafted into the repo's design-work path for the user to open in a browser. Use when a look is unsettled and someone has to see it before a screen is built: 2-4 directions at bootstrap, a screen set once a look is settled, a re-draft after the user's verdict.
---

The artboard mechanics `ui-designer` draws on, and the team's whole design surface. A direction is a **static render the user opens in a browser**, and reshaping one is a re-brief to the seat (`{KRU_HOME}/kru/references/ui-practice.md` → *The artboards*).

## What an artboard is

One `.dc.html` file per **direction** (bootstrap) or per **screen** (a mockup set). Self-contained: no build step, no imports, no network — a file the user double-clicks.

```
.design-work/
  index.html            a plain list of links, one per artboard, with its one-line label
  direction-a.dc.html   "quiet editorial"  — the whole screen, at one viewport
  direction-b.dc.html   "dense terminal"
  direction-c.dc.html   "soft product"
```

- **Gitignored.** The artboards are build inputs, not the system (*ui-practice* → *Its working files are build inputs with a home*). Put them under the path a pulled spec lands in — `.design-work/` unless the repo already has one — and say **uncommitted** in your return.
- **`.dc.html` for an artboard**, plain `.html` for the index. The extension is how a later pass finds what to re-draft.
- **Absolute paths in the return.** The lead opens them (`open <file>`), and the user reads a render, not markup.

## Match before you invent

The first step is always the repo, and the return says in one line what you matched: the token file, the stylesheets, the closest existing screen, the icon set. An artboard inventing a value the repo already has is a design nobody can transcribe back.

At bootstrap there is nothing to match but the **conventions corpus** and whatever the brief names — that is the one turn where the look is genuinely yours to propose.

## How to draft one

- **Inline everything.** A `<style>` block in the head, values as literals. Every value in an artboard is a literal by definition — the token file is a builder's to write, downstream, once (*ui-practice* → *Nothing in an artboard is a token*).
- **One viewport per file, stated.** Draw at 1280 for desktop and 375 for mobile; a direction that only makes sense at both is two files, labelled. Each file renders at its one width: breakpoint behaviour is the builder's, and a half-working one in an artboard reads as a defect in the look.
- **Real content.** The copy `ux-designer` wrote, the real labels, a plausible long string in the one field that will overflow. Lorem ipsum hides the decision the user is being asked to make.
- **The states the screen has**, stacked down the file under small labels, where the brief names them: empty, one row, many, error, loading, disabled. A direction that only renders the happy path is a direction nobody can judge.
- **Static by default.** Ask the lead whether the user wants working controls before spending them; a hover or focus style shown as a labelled second copy of the element costs nothing and shows more than a real `:hover` the user has to discover.
- **Web-safe faces, or a `<link>` to Google Fonts.** Those are the file's two outside loads; everything else is local — repo images by path, and art routed to `kru/graphic-designer` before the draft so you place a file it returned.
- **Label every artboard in the file itself** — a small header carrying the direction's name and its one-line thesis, so the file is self-describing when the user opens it a week later.

## Directions have to actually differ

At bootstrap, 2–4 directions, and the test is whether a reader can say what each one *is* in a phrase. Three palettes of the same layout is one direction rendered three times. Vary the things that carry a look: density, type scale and face pairing, how much chrome a surface gets, whether depth comes from shadow or from line, how colour is spent (one accent or a family), the shape language.

State each direction's thesis in one line in your return. A direction you cannot name in a phrase is the one to cut.

## The handoff

You have no user channel: the lead opens the files and puts the directions to the user. So the return carries what the lead needs in order to ask well, and nothing bulky — never the markup itself:

- the absolute path of each artboard and the index, marked uncommitted
- each direction's name and one-line thesis
- the one line saying what you matched from the repo
- the design question for the user (static mockups or working controls; anything the brief left genuinely open)
- any screen or element from the inventory you could not cover, and what it would need

## Re-drafting

A later change re-drafts from the files that are there rather than starting over: the user's pick becomes the base, and what they wanted different is the next brief. Keep the rejected directions until the pick is transcribed into the token file — they are the cheapest record of what was considered.

Two rounds of re-draft is normal. A third means the brief is what's wrong, not the draft: say so and hand the question back.
