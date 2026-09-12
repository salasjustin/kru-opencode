# Curating this corpus

Authoring guidance, not runtime context — `SKILL.md` doesn't point here, so this file costs nothing during a build. Read it when adding or revising a pattern, which in practice means during a `/kru/roster learn` sweep.

## The entry bar

`skill/kru-roster/author.md` is blunt: a skill that restates what its reader already knows is **worse than none**, because it drifts and outranks its source while stale. Most UI advice fails that bar — a model writing a submit button already knows it needs a disabled state.

So the pattern is **not what an entry contributes**. The **default it corrects** is. An entry earns its place by naming the specific wrong thing that gets written when nobody consults this file, in enough detail that a reader recognizes it as what they were about to do.

The writing rule that follows, applied per entry: **if you cannot name the default it corrects, it does not go in.** "Use good spacing" corrects nothing. "Centers the icon on the whole text block instead of its first line" corrects something specific, and that's why it's here. A true, useful, widely-agreed pattern that a careful builder would produce anyway is padding — leave it out.

This is the bloat gate, and it's the reason the corpus can accept every sweep without growing without bound: it grows with the number of wrong defaults, not with the number of preferences the user has.

## The second bar — behavior, not appearance

Every entry is **design-system agnostic**: it holds identically under any token file, because it decides something a design system was never going to decide. Behavior, sequence, semantics, grouping, and layout mechanics qualify — when a form validates, where a failed submit sends focus, what a repeated control announces, what groups with what, how an icon boxes itself against a label that wraps. Appearance does not: rank, ink, borders, underlines, indicators, what any state looks like. Every project's token file settles those, and settles them differently.

Two failures this bar prevents, and the second is the expensive one. A pattern about appearance is **overridden** in any repo with a real system, so it's dead weight. Worse, it's dead weight that *contradicts* — the builder reads a rule here and a token file there, both authoritative, and has to guess. The corpus is only trustworthy while everything in it is something the system was never going to say.

The test on a candidate: could a good design system ship the opposite and still be good? If yes, it's the system's and stays out. Apply it to the whole entry, not to a core you can carve out of one — a pattern about focus versus selection has a real behavioral residue (both states are reachable at once), but every mark it turns on is the system's, so the entry goes rather than shrinking to a sentence that only makes sense next to the look it lost.

## The entry

Entries live in `reference/<group>.md`, several per file, `##`-headed:

```markdown
## <Instruction, titled as the rule>

**Trigger:** the thing you're about to build that summons this.
**Pattern:** the rule, one line, imperative.
**Default it corrects:** what gets written without this entry.
**Why:** the mechanism — what the wrong default actually costs the
  reader or the operator. Keep it to a cost; "it looks better" is
  taste, and taste is what makes a corpus unbounded.
**Shape:** 1–3 lines of markup/CSS, framework-agnostic, tokens as
  `var(--token)` placeholders rather than values. Omit where the rule
  is a sequence rather than a snippet.
**Applies when:** scope + where it inverts. Omit if genuinely universal.
```

~10 lines. Longer and it stops being scannable mid-build, which is the only moment it gets read.

- **Authoring order is not reading order.** You write `Default it corrects` **first** — it's the bar, and an entry that can't state it doesn't exist. It then sits *below* `Pattern` in the file, because naming a wrong shape makes that shape more available, not less: the reader has to land on what to do, with the corrected default underneath as the recognition hook.
- **`Default it corrects` is the field that earns the entry.** If writing it stalls, stop — the entry fails the bar.
- **`Why` is what stops misapplication.** Without the mechanism, the first reader with a different opinion overrides the pattern, or applies it where it doesn't hold.
- **`Shape` is a shape, not a component.** Enough to write the right thing, never a copy-paste implementation — a component in here is a second implementation that drifts from the repo's.
- **Title the instruction, not the concept.** "A failed submit moves focus to the first invalid field" — not "Form error handling".

## Grouping

By **what the builder is about to build**, never by what kind of rule it is. Grouping by category (color rules, spacing rules) would force every build to load every file, which defeats the index.

Four groups: `forms-and-mutations` · `lists-and-rows` · `text-and-icons` · `terminal-output`.

**`terminal-output`'s reader is not building a component**, which is why the second bar is worded *appearance* rather than *the token file*: a CLI has neither, so the test there is whether the entry survives the program choosing any palette. An entry naming a colour fails it exactly as a web entry naming a border would.

A pattern fitting two groups goes in the one matching the **build target that summons it**, cross-referenced from the other — never duplicated. Two files stating one rule is the failure this corpus exists to prevent, and it's the failure that killed the seat-prompt version of these patterns.

## Framework spread

Shapes are written framework-agnostically. An `aria-label` reads the same in React and Svelte; where a pattern genuinely differs by stack (validation modes, submission state, flash messages), name the behavior the stack has to produce and leave the API to the framework seat's own prompt. The builder knows its own stack; it needs the rule, not a port.

## What lives elsewhere, and stays there

- A value → the project's token file. This corpus never carries color, spacing or type values.
- Whether a CSS feature is safe to use → `modern-css`, which owns Baseline status and the obsolete-workaround table. A pattern here may *use* a feature that skill covers; it never restates its status.
- An accessible primitive's anatomy → `ark-ui`.
- Whether a journey works → `ux-principles`.

## Adding to the corpus

1. Confirm it isn't covered — `grep -ril "<term>" reference/`.
2. Write **`Default it corrects`** first. If you can't, stop.
3. Apply the second bar to the **whole** entry: could a good design system decide this the other way and still be good? If yes it's the system's and the entry stays out — a behavioral residue is not a rescue.
4. Check the rule doesn't belong in one of the four homes above.
5. File it in the group matching the build target that summons it.
