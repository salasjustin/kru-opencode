# Curating this corpus

Authoring guidance, not runtime context — `SKILL.md` does not point here, so this file costs nothing during an audit. Read it when adding or revising a principle.

## The entry bar

`skill/kru-roster/author.md` is blunt: a skill that restates its sources is **worse than none**, because it drifts and outranks the source while stale. Every principle in here is already in the model's pretraining — Nielsen's ten heuristics are not news to anyone reading this file.

So the canon is **not what this corpus contributes**. The `Code signal` is. Nobody has written down what Norman's signifiers look like in a `.tsx` file, and that is the entire reason this skill exists.

The consequence is a writing rule, applied per entry: **if you cannot name a concrete, source-visible tell, the principle does not go in.** Peak-end rule is true, load-bearing, and unwriteable here — it needs a rendered session to judge. Leave it out rather than filing it as `RENDERED` padding.

## The principle file

Entries live in `reference/<group>.md`, several per file, `##`-headed:

```markdown
## <Principle stated as an instruction>

**Principle:** the rule, one line, imperative.
**Mechanism:** the cognitive cause — working-memory limit, scan path,
  decision cost. Never "studies show"; that's an appeal, not a mechanism.
**Code signal:**
  - <tell>, e.g. `<p>go to /admin/settings</p>`
  - <tell>
**Fix:** the edit shape to propose, one line.
**Applies when:** scope + where it inverts. Omit if genuinely universal.
**Detect:** STATIC | HEURISTIC | RENDERED
**Source:** <Book>, ch. N · <free URL> (YYYY)
```

~10 lines. Longer and it stops being matchable mid-walk.

- **`Code signal` is the field that earns the entry.** Two or three tells, each concrete enough to grep toward. A signal that reads "the flow feels heavy" is not a signal.
- **`Mechanism` is what stops misapplication.** One line, the actual cause. Without it, the first person with an opinion overrides the principle, or applies it where it doesn't hold.
- **`Detect` is honesty, not metadata.** Tier by what the *signal* can prove, not by how sure you feel. If the tell needs intent the code doesn't state, it's `HEURISTIC` — most "is this the primary action" cases are.
- **Title the instruction, not the concept.** "Clickable things must look clickable" — not "Affordances and Signifiers". The reader is matching against code, not studying.

## Writing from sources

The canon is widely-restated common property; the books are each one articulation of it. So: **record the principle, write it yourself, cite both.**

- Never reproduce a book's prose, structure, or worked examples. If a sentence could be diffed against the original, rewrite it.
- **Every entry needs a free, resolving URL** alongside the book citation — `nngroup.com`, `lawsofux.com`, `jnd.org`, `interaction-design.org`. The book is the origin; the URL is the receipt a reader can actually check. An entry citing only a book nobody can open is unverifiable.
- **Synthesize across books.** Krug's "self-evidence", Norman's "signifiers", and Nielsen's "recognition rather than recall" converge on one auditable rule. One entry citing all three beats three entries.
- A principle you cannot state without the book in front of you is one you haven't understood yet.

## Grouping

By **what the flow step is**, never by which book it came from. Grouping by book would force an audit to load all six files on every walk, which defeats the pointer.

Six groups: `signifiers-and-affordances` · `flow-and-navigation` · `states-and-feedback` · `choice-and-load` · `language-and-labels` · `errors-and-recovery`.

A principle that fits two groups goes in the one matching the *step where it would be caught*, and is cross-referenced from the other — never duplicated. Two files stating one rule is the failure this corpus exists to prevent.

## Framework spread

Signals are written **framework-agnostically, with a concrete example** in whichever framework shows it most clearly. `<div onClick>` reads the same in React and Svelte; `<a href="#">` reads the same everywhere.

Where a signal genuinely differs by stack (route definitions, form actions, navigation primitives), name the shapes rather than one framework's syntax: "a navigation primitive — `<a>`, `<Link>`, `<a href>` in Svelte". The auditor detects the repo's stack before it walks; it doesn't need per-framework entries.

## Conflicts and revision

- **Two books disagree** → one entry, with `Applies when` carrying the split. Cooper and Krug genuinely differ on progressive disclosure for expert tools; that's scope, not a contradiction.
- **A principle has been overturned** (hamburger menus, infinite scroll, carousels — a handful do turn over across a decade) → rewrite to the current position, keep both sources cited, newest first. The old date is the evidence it moved.

Principles age far slower than platform APIs, which is why this is worth writing down at all and why there's no aging rule. The source date on every entry is the check when one smells dated.

## Adding to the corpus

1. Confirm it isn't already covered — `grep -ril "<term>" reference/`. Convergence is the normal case.
2. Write the `Code signal` **first**. If that stalls, the entry fails the entry bar; stop.
3. Verify the free URL resolves and says what you claim.
4. File it in the group matching the step where it'd be caught.
