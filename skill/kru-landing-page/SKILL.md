---
name: kru-landing-page
description: Landing page structure — which sections a marketing page gets, in what order, as a SECTION deck mounted verbatim. Use when a landing, home, pricing, feature or about page needs structure and copy, when its order doesn't argue, or before it goes to design or build. Post-ship audit is `cro`.
user-invocable: false
---

# landing-page — which structure the page gets, and what earns a place on it

`{KRU_HOME}/skill/kru-copywriting/references/copy-frameworks.md` holds eighteen section types and five page templates. It is a menu. Nothing in it says which template this page takes, which sections earn a place, or what order they go in — so a deck assembled off a template is complete and arbitrary: every section renders, and none of them had to be there.

This skill is the decision in front of that menu and the handoff behind it. The sentences are `copywriting`'s.

## The method

Five steps in order; each one's output is the next one's input.

### 1. Place the visitor

Two axes, both Eugene Schwartz, *Breakthrough Advertising* (1966):

- **awareness** — what the reader already grants: unaware → problem-aware → solution-aware → product-aware → most-aware. Sets where the page starts and how far it has to travel.
- **sophistication** — how many times this market has already heard a claim like this one, on a five-level ladder. Sets what the headline has to do to still be read.

They are independent, and the pair is what turns five templates into one choice. Full table, and the template each row maps to: `reference/selector.md`.

**A stage is diagnosed from the traffic, never asserted.** What places it:

| evidence | what it settles |
|---|---|
| the ad creative or email the click came from | the visitor arrives already holding that claim — the page starts *after* it, and repeats its words in the hero |
| search intent — a problem phrase vs. the product's own name | problem-aware vs. product-aware |
| the referring context — a comparison post, the docs, an in-app upgrade banner, a cold list | solution-aware · product-aware · most-aware · unaware, in that order |
| reachable from site navigation | mixed — no single stage; see `reference/selector.md` → *The mixed-awareness page* |
| nothing supplied | a **named gap**: write to the widest plausible stage, and return which stage the deck assumes and what would confirm it |

Sophistication is read off the market the same way: how many direct competitors make this same claim, whether the category noun is already in the buyer's vocabulary, whether review sites for the category exist. Unsupplied and underivable, `reference/selector.md` carries the default and the direction to err in.

### 2. Settle the position, then cut the headline

The headline is the last step of positioning, not a separate act of writing — and the flow starts from **competitive alternatives**, what the customer does if this product doesn't exist, never from the product itself. The five components in their required order, why starting elsewhere fails, the phantom-competitor trap, and the mapping from a settled position to the actual headline and subhead: `reference/positioning.md`.

The gate, before a headline leaves: **swap a competitor's name into it.** If it stays true, it carries no position.

### 3. Attach proof to the claim it clears

A page is a chain of assertions, and a claim lands only if the claims it depends on have already been accepted. Build the chain before the sections:

1. List the claims the CTA needs accepted, in dependency order — *this problem costs me something* → *it is solvable* → *solvable this way* → *by this product* → *for someone like me* → *at acceptable risk*. Drop the links this visitor already grants (step 1 told you which).
2. Against each claim, name the objection that blocks it and the **one** piece of evidence that clears it.
3. That ordering is the section order. A claim with no dependants and no objection is not a section.

**The proof sits in the section that asserts the claim**, not in a proof block elsewhere on the page. A logo bar at position 2 backs no claim — nothing has been asserted yet — and a testimonial three sections downstream of the benefit it evidences arrives after the reader already decided. `cro` → *5. Trust Signals and Social Proof* carries the types and the one-clause placement rule; this is the rule underneath it.

Evidence ranked by what it can actually clear, strongest first: a demonstration the reader can see work · a named customer's numbered result · a third-party count or rating with its source · a recognizable logo · unattributed praise, which clears nothing. Match the strength to the objection — a price objection is not cleared by a logo.

A claim whose evidence does not exist is cut, or ships with its proof as a **named gap** (step 5).

### 4. Spend the length as a budget

> Purchase Rate = Desire − (Labor + Confusion)
> — Julian Shapiro, <https://www.julian.com/guide/growth/landing-pages>

Every section is labor charged to the reader, so it has to return more desire than it costs or remove confusion that was costing more. The per-section test: **which claim from step 3 does this assert, and does that claim have to be accepted before the CTA?** No to either — cut it, whatever the template lists.

What moves the budget:

- **price and commitment** — more money, or a longer lock-in, raises the number of objections that must clear before the CTA, and each one is a section.
- **risk carried by the buyer** — irreversible, public, or touching their customers' data. Raises length *and* moves risk reversal up the page, out of the final CTA section.
- **traffic temperature** — a most-aware visitor on a free, reversible action needs hero, one proof, CTA; every further section is pure labor. Cold traffic pays for the whole chain.

Where price and risk are unknown, they are given facts that did not arrive: name them as gaps and write to the shortest defensible budget rather than padding against the uncertainty.

### 5. Return the deck

The output is a **SECTION deck**: an ordered, closed set of sections, each carrying its id, its job, the claim it asserts, the proof attached to that claim, the verbatim copy, and its CTA where it has one. Shape, field meanings, gap format and a worked example: `reference/section-contract.md`.

**Done when** every claim in the chain has a section, every section has one claim, every claim carries its proof or a named gap, and the section count matches the budget the price, risk and temperature set.

## What the deck leaves out

- **Numbers only the business has.** This seat writes pricing-page prose and never picks a price, a tier count, or what sits in a tier. Those arrive as given facts; absent, each is a named gap and the section ships with its slot empty.
- **Proof that was not supplied.** A customer quote, a metric, a logo, a rating, a customer count, a case-study result — each either arrived with a source or it is a gap. An unsourced proof point is fabrication, and one of them makes every other claim on the page unverifiable too. The sharpest form of this failure is the plausible placeholder: `Join 10,000+ teams` mounts and reads exactly like a fact.
- **Voice-of-customer language.** The reader's own words come from supplied research — reviews, tickets, interview transcripts. Where none arrived, the copy uses plain language and the return says which phrases are the writer's guess.
- **Compliance and legal claims** — certifications, uptime figures, guarantees, regulatory status. Given facts, quoted exactly or named as gaps.
- **The look.** A section names a job and carries strings. Colour, layout, component names, image direction and length-in-pixels belong to the designer downstream.

**The gap list is the only way a missing fact reaches a human** — the consumer of this skill has no channel to one. What a gap does to the section it sits in: `reference/section-contract.md` → *Naming a gap*.

## Owned elsewhere

All three live under `{KRU_HOME}/kru/skills/`.

| | |
|---|---|
| headline formulas, section-type catalogue, CTA formula, page-type guidance | `copywriting/SKILL.md` and `copywriting/references/copy-frameworks.md` |
| the line edit over copy that exists | `copy-editing/SKILL.md` → *The Seven Sweeps Framework* |
| the audit of a page already shipped | `cro/SKILL.md` → *CRO Analysis Framework* |
| mockups drawn around this deck | external **designer** (`/design`, `landing-page`, `composition` — `{KRU_HOME}/kru/references/designer-handoff.md`) |
| the price, the tiers, the research | the business |
