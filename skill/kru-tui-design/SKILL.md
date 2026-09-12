---
name: kru-tui-design
description: Terminal UI recipes for Bubble Tea (Go), Ratatui (Rust), Textual (Python) and Ink (React) — the frame measured in cells rather than characters, color on a background you have to detect, I/O that leaves the render loop, the exit path that gives the terminal back in every branch including panic, and resize as an event rather than a startup fact. Use when building or reviewing a terminal app, making an existing CLI interactive, or choosing a TUI framework. Terminal surfaces only — a browser UI is the UI builders' lane.
---

Verified against docs on 2026-09-11 — Ratatui 0.30.2 · Bubble Tea v1.3.10 + v2.0.9 · Lip Gloss v1.1.0 + v2.0.6 · Textual 8.2.8 · Ink 7.1.1. Re-verify after a major bump; the per-stack currency check is `reference/frameworks.md`. What's below is the layer the docs don't carry.

**You borrow the terminal; you don't own it.** Its width changes mid-frame, its background may be white, its color depth may be four bits, its user may be piping you into `less`, and every mode you switch on is theirs to get back. Every recipe here follows from that, and the visual craft in `reference/visual.md` sits on top of it — a frame that survives the terminal comes first, which is the order most TUIs get wrong.

## The frame is cells, not characters
A terminal grid is measured in **display cells**. One rune is not one cell: CJK ideographs and most emoji occupy two, combining marks occupy zero, and an ANSI escape occupies none while inflating any length function you reach for by reflex. Slice a line by byte or rune index to fit a column and you tear a wide glyph in half or cut a string mid-escape — the frame is corrupt from that row down.

Measure and truncate with the library's own cell-aware helper, which is a different call from the language's length:

| Stack | Measure | Notes |
|---|---|---|
| Go | `lipgloss.Width` / `Height` / `Size` | ignores ANSI, counts wide runes; `Style.MaxWidth` clamps on render |
| Rust | `Line::width()` / `Span::width()` | Ratatui widgets clip to their `Rect`; hand-built strings don't |
| Python | `rich.cells.cell_len` | Textual widgets measure themselves; raw `Static` content doesn't |
| Node | `string-width` | Ink's Yoga layout measures `<Text>`; strings you slice yourself are yours |

**The gotcha no config confesses:** `go-runewidth` (under Lip Gloss, so under every Charm app) reads the locale, and an East-Asian one — `zh_CN.UTF-8`, `ja_JP.UTF-8` — flips *ambiguous-width* characters to two cells. Box-drawing and arrows are ambiguous-width. The same binary renders a clean frame in one shell and a shredded one in another, with no code difference. Set `RUNEWIDTH_EASTASIAN=0` in the process when the layout assumes narrow ambiguous glyphs.

**Budget** columns before styling: a bordered pane is content width minus 2 for the border and minus its horizontal padding on both sides, derived from the stored terminal width.

## Color on a background you don't own
The terminal's background is unknown until you ask, and the answer is a light theme often enough to matter. A hardcoded `#222` foreground is invisible on half of installs, and a truecolor hex on a 16-color terminal degrades to whatever the emulator guesses.

- **Prefer the terminal's own ANSI 16** for anything structural. Those are the colors the user themed, so they are correct in both directions by construction.
- **Detect once at startup and branch on the result** when a specific hue is load-bearing. The call differs per stack (`reference/frameworks.md`).
- **Write through the framework's writer, not `fmt`/`print`.** The writer downsamples to the detected profile and strips ANSI when the output isn't a TTY; bypass it and a piped or redirected run emits escape soup.
- **Honor `NO_COLOR`, and design a mono fallback that still communicates** — bold, reverse video, and the leading glyph carry state when color can't.
- **Color says one thing: state.** Reserve it for status, focus and destructive emphasis, cap the palette at four or five roles, and let structure come from spacing. `reference/visual.md` carries the ladder.

## All I/O leaves the render loop
Each of these frameworks is an event loop plus a draw path, and a draw path that waits is a frozen app — no spinner, no keypress, no `q`. I/O goes out as a command, task, worker or future and comes back as an event.

The failure that survives that rule is **stale data winning**. Hold `r` down, three reloads race, and the slowest response lands last and overwrites the newest. Only Textual solves this for you; everywhere else it's a **generation counter** in the model — increment on dispatch, stamp the request, discard any arrival whose stamp is behind (`reference/frameworks.md` per stack).

Three more rules, ordered by how often they're violated: every request carries a **timeout** with a rendered outcome (a spinner with no timeout is a permanent spinner); live filters **debounce** at 100–300 ms and filter locally first; leaving a view **cancels** its pending loads and drops their arrivals. Streams get their own treatment in `reference/robustness.md`.

## Give the terminal back
Raw mode and the alternate screen are borrowed global state. A panic that escapes without returning them leaves the user's shell with no echo and no cursor, to be fixed by typing `reset` blind — which is why this is the one place the popular advice is actively wrong. **All four frameworks restore on their own, two of them through a panic hook they install for you, and the more common bug is hand-rolling one on top rather than omitting it.** Read your stack's row in `reference/frameworks.md` before writing a `recover` or a `set_hook`; both hooks carry a constraint a hand-rolled version violates.

Beyond the hook: **panics are bugs, errors are states.** A missing file, a refused connection, a bad query is a designed error surface with a retry affordance. And fail before you paint — a required resource that's missing gets one line on stderr and a non-zero exit *before* entering fullscreen.

## Resize is an event, not a startup fact
Store width and height in the model and derive every layout number from them — column widths, page size, pane splits, truncation points. A layout constant that survives a resize is a bug waiting for a window drag, and the check is mechanical: every integer literal in the view path that isn't a border thickness or a padding unit. Below a minimum size, render one line saying so rather than a frame folded into itself — `reference/robustness.md` sizes the gate.

## Keyboard first, and say so on screen
Keyboard reaches everything; mouse is a bonus. Spend the conventions users already hold — `j`/`k` and arrows to move, `/` to search, `Enter` to open, `Esc` to back out, `q` to quit, `?` for help, `Ctrl-C` always works. Focus is always visibly somewhere, Tab moves it in reading order, and a persistent footer names the keys live in the current context — a keybinding the user has to discover doesn't exist.

## The four states
**Empty, loading, error, populated** — the set every data surface owes, and the token the rest of this skill spends. On a slow network they are most of what a user sees: empty says what would be here and how to get it, loading holds the layout rather than collapsing it, error keeps the last good data on screen with the failure named and a retry key. `reference/robustness.md` maps each failure to the behavior it earns.

## Done means rendered in the conditions you don't develop in
A TUI that works is one that worked in the author's terminal, which is one theme, one width, one locale and ASCII data. **Four renders close the slice, each of which has caught a shipped bug:** at the **minimum size**, in **mono** (`NO_COLOR=1`), with a **CJK string and an emoji** in the data, and in the **four states**. Golden frames make all four cheap and permanent — `reference/robustness.md` → *Proving a frame*. A slice that skipped one names which, rather than reporting done.

## Consult current docs (official sources first)
Framework APIs here move faster than this file: Bubble Tea and Lip Gloss both have a v2 on a new import path, Ratatui's `run()` is recent, Ink gained `alternateScreen`. Resolve the call you're about to write, and treat this skill as the layer on top.

- **Go** — `go doc github.com/charmbracelet/bubbletea` off the installed module first; it answers for the version in `go.mod`, which Context7's Bubble Tea coverage (`/websites/pkg_go_dev_github_com_charmbracelet_bubbletea`, the only entry) does not reliably distinguish across the v1/v2 split.
- **Rust** — `/websites/ratatui_rs` on Context7, or docs.rs pinned to the version in `Cargo.toml` (`docs.rs/ratatui/<version>`), since the terminal-lifecycle API has moved across minors.
- **Python** — `/textualize/textual`, or `textual.textualize.io`.
- **Node** — `/vadimdemedes/ink`.

## Recipes
- `reference/frameworks.md` — the four stacks: what each gives you free against the rules above, what it leaves you, the companion libraries that ship alongside each, and how to choose.
- `reference/robustness.md` — the minimum-size gate, backpressure and drop counts, reconnect with backoff, failure-to-behavior, and proving a frame.
- `reference/visual.md` — hierarchy without color, the emphasis ladder, what earns a border, box-drawing fallback, and component treatments.

## Owned elsewhere
- **Browser UI** — `react-ui-builder` / `svelte-ui-builder` / `web-components-builder`. Terminal constraints invert most web instincts; carrying them across is the failure this skill prevents.
- **A CLI that prints and exits** — flags, streams, exit codes are `ui-patterns` → `reference/terminal-output.md`. That tool wants argument design, and a render loop is the wrong medium for it.
- **The language layer** — Go craft is the `go` skill, Python the `python` skill, TypeScript the `typescript` skill, in whichever seat owns the code.
