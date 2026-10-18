---
name: kru-modern-css
description: Baseline 2023-2025 native CSS safe to use now — container queries, :has(), nesting, subgrid, color-mix()/light-dark(), @starting-style, scroll-driven animation, view transitions, @scope — plus the defensive defaults that break on real content (overflow, viewport units, zoom, RTL). Use before writing CSS that would reach for a JS workaround, extra wrapper, or preprocessor trick.
user-invocable: false
---

This is the **Baseline** judgment: which native CSS a builder can reach for today without a fallback, and which still needs one. Load it when writing or reviewing CSS, and specifically when you're about to write a JS workaround, an extra wrapper `div`, a preprocessor trick, or an older hack for something — check first whether native CSS now does it outright.

## The three states you judge by
Every feature below carries a Baseline status (from web.dev/baseline), and the status *is* the decision:
- **Widely available** — interoperable across Chrome/Edge/Firefox/Safari for 30+ months. Use it outright, no fallback, no `@supports` check.
- **Newly available** — interoperable now, but hasn't crossed the 30-month mark. Safe for an evergreen-browser audience; check the repo's actual browser-support target (a `browserslist` entry, a stated "supports X+" note) before treating it as unconditional, and pair it with `@supports` when the fallback is cheap and the feature is non-critical (decorative, progressive enhancement).
- **Limited availability** — not yet interoperable across all four. Free where the browsers without it fall back to the baseline behavior unaided; gate CSS that breaks without it behind `@supports`; ask the user before shipping one the design depends on.

## Aging rule — this snapshot goes stale, recompute against today
Baseline status moves with the calendar, not with this file. Rule: **feature's Baseline year (`BL` column in `reference/baseline.md`) + ~30 months ≈ when it crosses into Widely available.** So as of any given date:
- `BL 2023` — 30+ months out from any 2023 date, so treat as **Widely available**.
- `BL 2024` — right around the 30-month line; verify individually if the project has a strict support floor, otherwise treat as **Newly available** trending to widely.
- `BL 2025` — well short of 30 months; treat as **Newly available**, verify support target before using unconditionally.

Don't hardcode "safe" onto a year forever — redo this math against the current date, or just check live status (MDN's Baseline badge, caniuse.com, or `web.dev/baseline/<feature>`) when it matters.

## What this replaces — reach for native CSS before a workaround
The actual value of this skill: recognizing when a familiar workaround is now obsolete.

| Old technique | Native CSS replacement |
|---|---|
| SASS/LESS nesting | CSS Nesting (native, no preprocessor) |
| Per-component JS `ResizeObserver` breakpoints | Container queries (`@container`) |
| JS class-toggling based on a child's state/count | `:has()` |
| JS height-sync across sibling cards/grids | Subgrid |
| Sass `darken()`/`lighten()` or hand-computed hex shades | `color-mix()`, relative color syntax, `oklch()` |
| Duplicated light/dark color values under two media queries | `light-dark()` |
| `IntersectionObserver`-driven scroll-linked animation | CSS scroll-driven animations (`animation-timeline: view()`/`scroll()`) |
| JS enter/exit animation for `display: none` ↔ shown elements | `@starting-style` + `transition-behavior: allow-discrete` |
| JS-orchestrated page/route transitions | View Transitions (`::view-transition-*`, `view-transition-class`) |
| Custom scrollbar-styling libraries | `scrollbar-color`, `scrollbar-width`, `scrollbar-gutter` |
| JS virtualization purely for offscreen render cost | `content-visibility: auto` + `contain-intrinsic-size` |
| Manually maintained typed CSS custom properties | `@property` (registered custom properties) |
| Global unscoped selectors reached for encapsulation via BEM alone | `@scope` |
| Hand-tuned `margin-top` to line an icon up with a multiline label | `lh` units (the pattern is `ui-patterns` → `text-and-icons`; this skill owns whether `lh` needs a fallback here) |
| JS carousel library | `scroll-snap-type` + `scroll-snap-align` on a native scroller, `overscroll-behavior-x: contain`; buttons call `scrollBy` (sign flipped in RTL) |
| JS auto-growing `<textarea>` | `field-sizing: content` with `min-height`/`max-height` in `lh` — limited availability; unsupported browsers keep a fixed-height textarea that scrolls, which is the fallback |
| JS height measurement to animate an accordion | `::details-content` + `interpolate-size: allow-keywords` transitioning `height` — `interpolate-size` is limited availability; unsupported browsers open instantly, which is the fallback |
| Popper/Floating UI placing a popover beside its trigger | anchor positioning (`position-area`, `position-try-fallbacks`) — check live status; unsupported placement breaks, so gate it behind `@supports (position-area: block-end)` and keep the library where the support floor needs it |

If a build is doing any of the left column, check the right column's Baseline status in `reference/baseline.md` before assuming it needs the old approach.

## A font-relative unit resolves on the element that uses it
`em`, `ch` and `ex` inside a custom property resolve at **use**, not at definition — one `--inset: 0.75em` is two different lengths on a 14px caption and an 18px heading, so a token meant to line two elements up doesn't. Derive a shared inset from a px- or rem-valued root token; leave font-relative only what is genuinely text-relative. (`lh` resolves the same way, which is exactly why the icon-alignment pattern above wants it.)

## Consult current status, don't guess
This snapshot covers Baseline 2023–2025 only. For anything shipped after 2025, or a feature not in the reference list, or a project with an unusual support floor — don't answer from memory. Check live: MDN's Baseline badge on the feature's page, caniuse.com, or `web.dev/baseline/<feature-slug>` via webfetch. Baseline status changes monthly; training data lags it.

## Defaults that break on real content
`reference/defensive.md` — CSS that renders right on the content it was written against and breaks on production's — overflow, viewport units, zoom, RTL, colour mixing. Read it when laying out a page, a card grid or a scroller, or when reviewing CSS for overflow.

## Full curated list
`reference/baseline.md` — the exhaustive CSS feature tables, grouped by capability (selectors · layout · color · units & math · animation · scroll/perf · effects · typography · custom properties), each row carrying its Baseline year (`BL`) and a one-line description. Jump to the category that matches the task; consult it when you need the specific property/selector/function name, not just the judgment above.

## Not this skill's job
- **Native HTML elements and attributes** — `<dialog>` vs the `popover` attribute, invoker commands, `<details name>`, `inert`, constraint validation and `:user-invalid`, `<search>`, the loading/priority hints: the **`modern-html`** skill, which is the HTML half of the same judgment and defers to this file for the three Baseline states and the aging rule.
- **Whether to use a feature here** (palette, layout, motion feel) is the design's call (the repo's token file + approved spec) — this only answers "is this CSS mechanism safe to reach for," never "should this be the design."
- **Accessibility semantics** of a CSS-driven pattern (focus, ARIA) — that's the `ark-ui` skill / `accessibility-review`.
- **Framework-specific CSS tooling** (Tailwind config, CSS Modules, vanilla-extract) — match whatever the repo already uses; this skill is about the native platform underneath it.
