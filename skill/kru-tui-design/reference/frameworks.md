# The four stacks

What each framework already solves against `SKILL.md`'s rules, what it leaves to you, and what ships alongside it. Read the one row you're in.

Version numbers appear below only where the number *is* the trap — a split across import paths, a pre-1.0 API that moves. What the repo actually runs is a one-command lookup (`go list -m all`, `cargo tree`, `uv pip show`, `npm ls`) and belongs there rather than here; `SKILL.md` carries the verification pin.

## Choosing

| If the deliverable is | Reach for | Because |
|---|---|---|
| a single static binary — devops tool, system utility, anything `go install`-able | **Bubble Tea** | no runtime to ship; the Charm ecosystem covers most widgets |
| a data-dense dashboard or admin panel, fastest to a working screen | **Textual** | CSS-like layout, the richest built-in widget set, real async and devtools |
| a long-running monitor, or the host process is already Rust | **Ratatui** | immediate-mode redraw with no allocation surprises; you own the loop |
| a dev tool whose users already run `npx`, or the repo is TypeScript | **Ink** | React component model, flexbox layout, ships through npm |

The repo usually decides before you do — a TUI in a Rust workspace is Ratatui. Reach for this table for a greenfield choice, not to argue with an existing `go.mod`.

## Bubble Tea (Go) — the Elm loop

**Free:** panic catching and terminal cleanup by default; altscreen and mouse tracking disabled on exit; `WithAltScreen` handles enter/leave; `tea.WindowSizeMsg` delivers resize as a message.

**Yours:** request exclusion — no built-in cancellation, so stale `tea.Msg` arrivals are the generation counter's to drop. Debounce is a `tea.Tick` you write. Cell math is Lip Gloss's, but only if you route through it.

**Alongside** (the set that appears together in `go.mod`):

| Module | Role |
|---|---|
| `charmbracelet/lipgloss` | styling, layout, and the cell-aware `Width`/`Height`/`MaxWidth` |
| `charmbracelet/bubbles` | the widget set — `list`, `table`, `textinput`, `viewport`, `spinner`, `progress`, `paginator`, `help`, `key` |
| `charmbracelet/huh` | standalone forms; embeds into a Bubble Tea model or runs on its own |
| `charmbracelet/glamour` | markdown rendered to the terminal |
| `charmbracelet/x/ansi` | low-level ANSI — truncation, wrapping, escape parsing |

**The version trap.** The v2 line is released and lives on a **different import path** — `bubbletea/v2`, `lipgloss/v2`, `bubbles/v2` — while the bare paths stay v1. pkg.go.dev's default page for a bare path is v1, so docs read casually describe the older API. Read the import path out of `go.mod` before writing a call, and keep one major across the whole Charm set in a binary.

**The color trap.** Lip Gloss v1's `AdaptiveColor` / `CompleteColor` / `CompleteAdaptiveColor` exist in v2 only under `compat`, kept for migration — they probe global stdin/stdout, which is what v2 moved away from. New v2 code detects once with `HasDarkBackground(os.Stdin, os.Stdout)` and branches through `LightDark`.

## Ratatui (Rust) — immediate mode, your loop

**Free:** `ratatui::init()` enables raw mode and the alternate screen **and installs a panic hook that restores the terminal before panicking**. `ratatui::run()` wraps init, restore and the hook around your loop. Widgets clip to their `Rect`, so layout can't overflow its pane.

**Yours:** everything async. There is no built-in task system — I/O is a worker thread plus a channel, or a tokio task feeding an event enum, and stale arrivals are the generation counter's either way. Immediate mode also means state is entirely yours: nothing persists between frames except what's in your app struct.

**The ordering trap.** `init()`'s own docs: call it *after* any other panic hook you install. `color_eyre::install()` before `ratatui::init()` and the terminal is restored first, then the pretty report prints into a usable shell. The reverse order prints the report into a raw-mode alternate screen the user never sees.

**Alongside:** `crossterm` (the default backend; you reach for it directly for events and terminal queries), `color-eyre` (panic/error reports), `tui-textarea` (multiline editing), `ratatui-image` (sixel/kitty/iterm2 images).

**Ratatui is pre-1.0 and its minors have moved the terminal-lifecycle API** — `init`/`restore`/`run` are recent additions. Pin the version and read the release notes on upgrade; an example older than your pin may set up the terminal by hand in a way that is now three functions.

## Textual (Python) — the batteries-included one

**Free:** the most of any of these. `@work(exclusive=True)` cancels prior runs of the same worker — the stale-response race is solved by a decorator argument. Workers are tied to their DOM node, so popping a screen cancels its pending loads for you. CSS-like styling with real layout, a large built-in widget set, and `textual-dev` gives a live console and `--dev` hot reload.

**Yours:** blocking libraries. A synchronous call inside an async handler still freezes the loop — that's `@work(thread=True)`, and from a threaded worker you touch the UI only through `App.call_from_thread()`. Debounce is `set_timer` / `Timer` you wire yourself.

**The trap:** `await`-ing a slow call directly in a message handler. It type-checks, it runs, and the app stops processing messages — including keystrokes — until it returns. Textual's own worker guide leads with this, because it's the mistake everyone makes first.

**Alongside:** `rich` (the rendering foundation; `rich.cells.cell_len` is the cell-width measure), `textual-dev` (console, `textual run --dev`). `rich` on its own is formatted *output* rather than a TUI.

## Ink (React/TypeScript) — React in the terminal

**Free:** flexbox layout via Yoga, so `<Box>` composition behaves like a familiar mental model; `useInput` enables raw mode on its own; `render(<App/>, {alternateScreen: true})` gives fullscreen with scrollback preserved.

**Yours:** everything the React ecosystem normally hands you at the data layer. No built-in request exclusion — cancel in the effect's cleanup and stamp responses. No built-in resize gate beyond `useStdout`.

**Two traps:**
- **Raw mode isn't always available.** `useInput` needs it, and a non-TTY stdin (CI, a pipe) doesn't have it. Guard with `useStdin().isRawModeSupported` and render a non-interactive fallback rather than crashing on mount.
- **Growing output.** Ink redraws a live region; content that only accumulates — a log stream — belongs in `<Static>`, which prints above the live region permanently and is never re-rendered. Cap what you pass it (`logs.slice(-100)`), because `<Static>` holds every item you give it in memory. Reaching for a third-party fullscreen wrapper is stale advice: `alternateScreen` is a render option now.

**Alongside:** `@inkjs/ui` (the component collection), `ink-testing-library` (render-to-string assertions, and what makes a golden frame cheap here).
