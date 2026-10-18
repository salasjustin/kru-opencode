---
name: kru-copy-deck
description: Write a marketing page's argument and its copy — the section order, the headline, the proof — as a deck the designer and UI builder mount verbatim.
disable-model-invocation: true
---

You commission the **argument** a marketing page makes: which sections it has, in what order, with what strings in them. The output is a SECTION deck — a closed set a designer draws around and a builder mounts without writing a word of its own.

**The writing is `conversion-copywriter`'s body; the lead runs this file** — resolve the page, spawn the seat, return gaps the seat cannot fill.

## Resolve the page

| task names | page |
| --- | --- |
| a route or a page name | that page |
| what the page is for, with no route | a new page — say which route you're assuming before spawning |
| *(none)* | the marketing route the working tree touches — read `git diff HEAD`, and name the page you resolved |

**A marketing route is the bar.** In-product strings belong in the PM's design spec from the designer; a line edit of copy that already reads well is `skill/kru-copy-editing/SKILL.md` (PM loads when the task names it)'s, and a page that ships and under-performs is `skill/kru-cro/SKILL.md` (PM loads when the task names it)'s.

## Gather what only you can
The seat cannot invent a fact and will return a gap instead, so the facts it has decide how much of the deck comes back filled. Before spawning, hand it whatever exists: **the traffic source** (what the reader clicked, and what it already told them — this places the whole deck), **the price and what's in each tier**, **proof with sources** (named customers, metrics, ratings, logos), and **research** — reviews, tickets, transcripts the copy should mirror. **Each of the four is accounted for before you spawn — handed over, or declared absent in the brief.** An absence comes back as a gap either way; declared up front, the user can answer it before the run instead of after.

## Dispatch — spawn the write, never run it inline
Spawn the **`conversion-copywriter`** agent with: the page and its route, the audience and what the page is meant to get someone to do, the facts above, and the repo's `design/conventions.md` if one exists.

Relay the return unedited, then:
- **Return the gap list as questions for the PM.** Each gap is a fact someone has; the deck stays unfinished until the next task answers or the claim is cut.
- **Lead with the placement.** The deck derives from an awareness stage. A stage the seat guessed is a one-line correction now and a rewritten page later.
- **The voice is the user's.** The alternatives in the return exist for them to pick from; don't settle a headline on their behalf.

Then hand the deck on: **deck → PM → designer → approved spec → UI builder** — always, including when a design system already exists in the repo. The lead does not run the bundled opencode `design` skill (designer loads) or dispatch builders until the PM attaches that spec.

## Boundary
The argument and the words on a marketing page. The look → the designer's mockups; in-product strings → the design spec; a line edit of existing copy → `skill/kru-copy-editing/SKILL.md` (PM loads when the task names it); a shipped page's conversion → `skill/kru-cro/SKILL.md` (PM loads when the task names it); technical SEO markup → `skill/kru-seo-review/SKILL.md`.
