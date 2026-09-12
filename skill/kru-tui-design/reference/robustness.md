# Robustness

The production half: what the app does when the terminal is too small, the data is too fast, the connection drops, and someone has to prove a frame is right. Reach for it when reviewing for readiness, when the app talks to a network, database or file, or when the report is a freeze, a flicker, or a broken frame.

## The minimum-size gate
Pick `minWidth × minHeight` from the densest screen, not the simplest — a menu survives `40×10`, a six-column table does not. `80×24` is the conventional floor.

Re-check on **every** resize event, not at startup. Below the floor, render one centered line (`Terminal too small — resize to at least 80×24`) and nothing else; a frame folded into itself reads as a crash and costs a bug report.

## Backpressure — count what you drop
A log tail, an event feed or a metrics stream pushes faster than 60 frames a second can show, and the naive loop has two failure modes: unbounded memory, or a view that falls minutes behind while looking live.

Use a **bounded** channel or ring buffer sized to what the user can actually read back, drop the oldest on overflow, and **put the drop count on screen** — `dropped 1,204` in the status bar is honest, and silently lagging is not. Decouple ingest from render: accumulate into the buffer at stream speed, redraw on a tick (16–33 ms is plenty), not per message. A thousand messages arriving in one tick is one redraw.

Pasted input is the same shape arriving through the keyboard — bracketed paste can deliver 100 KB as a single event. Treat input as UTF-8 end to end and index it by rune or grapheme — a multi-byte key event sliced at a byte offset panics or corrupts.

## Reconnect
A dropped connection is a state, not an exit. Show it (`● Disconnected` in the status bar), retry with exponential backoff capped at ~30 s (1 → 2 → 4 → 8 → 16 → 30 → 30…), add jitter if more than one client reconnects to the same service, and on success restore what the user had — selection, scroll position, filter — rather than resetting the view. Offer a manual retry key too; a user watching a failure wants to act on it.

## Failure to behavior

| Failure | What ships by accident | What to build |
|---|---|---|
| Query fails | blank table, app appears hung | keep the last good rows, name the error in a banner, `r` retries |
| Connection drops | crash, or an infinite spinner | disconnected indicator, backoff retry, state restored on reconnect |
| Empty result set | a blank pane indistinguishable from loading | say it's empty, say what would be here, name the action that fills it |
| Slow request | frozen UI | spinner with elapsed time, a timeout with a rendered outcome, `Esc` cancels |
| Required file missing at startup | fullscreen UI that can't work | one line to stderr, exit non-zero, **before** entering fullscreen |
| Write fails mid-edit | silent loss | keep the buffer, surface the failure, hold the input until the write confirms |
| Terminal too small | folded frame | the size gate above |

Every row above is a designed surface, which is what `SKILL.md`'s *panics are bugs, errors are states* buys you: panic stays for invariants that are genuinely impossible.

## Proving a frame
A TUI's output is a string, which makes it more testable than most UI. This is the mechanism; what a slice owes before it's done is `SKILL.md`'s closing bar, and golden frames are how you pay it once instead of by hand every time.

**Golden frames.** Render the view at a fixed size against fixed state and assert the whole string. Each framework has the seam: Bubble Tea's `View()` returns one, Ratatui has `TestBackend` with a `Buffer` to compare, Textual has `Pilot` plus snapshot testing, Ink has `ink-testing-library`. Pin the size in the test — a golden that reads the real terminal is flaky by construction.

Three things make the suite catch the failures above rather than decorate them:

- **Widths, plural** — the minimum, one wide, and an awkward middle where truncation actually fires. A single happy width proves nothing about the layout math.
- **Fixtures carrying the extremes** — a CJK string, an emoji, a name longer than its column. That's how a cell-width bug fails a test instead of a user's terminal.
- **Input through the framework's harness** rather than by calling handlers directly, since key routing and focus are part of what's under test.
