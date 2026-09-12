# Visual craft

Hierarchy in a medium with one font, one size, and a grid. Reach for it when designing or reviewing the look of a screen — the frame rules it sits on are `SKILL.md`.

## The emphasis ladder
A terminal has no type scale. Everything is one size, so hierarchy comes from a small ladder of attributes, and the whole design is deciding which rung each thing gets. Roughly strongest to weakest:

1. **Reverse video** — the selected row. Reads at a glance, works in mono, survives any theme. Spend it on exactly one thing per pane.
2. **Accent color on the foreground** — focus, active state, the key in a hint.
3. **Bold** — column headers, the current value, a heading.
4. **Plain** — the default, and most of the screen by count.
5. **Dim** — labels, hints, timestamps, anything the eye should skip.

**Attribute support is uneven below that.** Bold, dim and reverse are universal. *Italic*, strikethrough, underline-style variants and blink are not — they render as plain, or as reverse, or as nothing, depending on the emulator. Build hierarchy from the top three and let the rest be decoration that degrades silently.

**One rung per element.** Bold + accent + reverse on a selected header spends three at once and leaves the ladder no headroom for whatever is genuinely urgent.

## Structure without borders
Borders are the most expensive element on a terminal grid: each one costs two cells of width and two rows of height, and a screen of bordered boxes spends a third of its area on lines. They also compete with content for the eye, which is why a fully-boxed TUI reads as a debug console.

Reach for structure in this order — **blank line, then alignment, then a single rule, then a border**:

- A blank line separates as well as a box and costs one row.
- Columns aligned on a shared left edge group without any glyph at all.
- A single horizontal rule (`─`) under a header does what a full box does, for one row.
- A border earns its place when a region is **focusable** or **overlays** — a pane that can take focus (color the border to show it has it) or a modal that must visually detach from what's behind it.

One border style per screen — rounded, heavy and double mixed together read as accidental rather than deliberate.

**Box-drawing needs a fallback.** `─│┌┐└┘` are Unicode, and they are also *ambiguous-width* — which is the `RUNEWIDTH_EASTASIAN` trap in `SKILL.md`. Where the terminal or locale is uncertain, ASCII (`-|+`) renders correctly everywhere and is the safer default for anything that must not break.

## Spacing
One unit of horizontal padding inside any bordered or reverse-video region — text touching a border or a highlight edge is the single most common tell of an unconsidered TUI. Vertical padding is expensive (a row is a lot of screen); spend it between *groups*, not inside them.

Alignment is the cheapest quality signal available: numbers right-aligned, text left, headers matching their column's alignment. A column of right-aligned numbers reads as scannable data; the same numbers left-aligned read as a log.

## Screen skeleton
Most TUIs converge on the same three bands, and diverging from it costs the user their priors:

```
┌ title / breadcrumb / connection state ─────────────┐   1 row
│                                                    │
│  content — the pane that grows with the terminal   │   flex
│                                                    │
├────────────────────────────────────────────────────┤
│ j/k move   /  search   enter open   q quit         │   1 row
└────────────────────────────────────────────────────┘
```

The footer is not decoration — it is the app's only discoverability surface, and it changes with context. In a list it names list keys; with a modal open it names the modal's. A static footer listing global keys while the user is in a text field is worse than none, because it's wrong.

## Component treatments
- **List** — reverse-video the selection; dim the secondary line of each item; show position (`12/340`) rather than a scrollbar unless the pane is tall enough for one to mean something.
- **Table** — bold headers, right-align numerics, one dim separator row at most. Truncate with `…` at the cell-aware width, and truncate the *middle* of a path (`/Users/…/project/src/main.go`) where the tail carries the meaning.
- **Input** — visible cursor, a dim placeholder that disappears on first keystroke, and validation that reports on blur or submit rather than after every character.
- **Modal / confirm** — border it, dim or leave the background visible behind it so context isn't lost, name the destructive action in the button text (`Delete 3 records`, not `OK`), and default focus to the safe choice.
- **Status / toast** — one line, colored by severity, with an explicit dismissal or a timeout the user can outrun. A message that vanishes in 800 ms wasn't shown.
- **Spinner / progress** — a spinner for unknown duration, a bar for known. Both carry a label saying what is happening; a bare spinner is indistinguishable from a hang.
- **Help** — `?` opens a full keymap. The footer carries the four keys that matter here; the overlay carries everything.

## Reviewing a screen
What the eye can settle without rendering anything, ordered by how often each one lands. The four renders that need a running app are `SKILL.md`'s closing bar.

1. Does the footer name the keys that work **right now**?
2. Is there exactly one thing on screen carrying the strongest emphasis?
3. Does every border belong to something focusable or overlaying?
4. Do the four states each have a designed frame?
5. Is focus visible without moving it to find out?
6. Does anything communicate through color alone — a status that's a colored dot and nothing else?
