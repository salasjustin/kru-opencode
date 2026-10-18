# Defensive CSS

CSS that renders right on the content it was written against and breaks on what production sends: a long name, a phone, 200% zoom, an RTL locale. Each entry names the default that breaks, then the fix. Every fix runs in all four engines with no fallback; the newer replacements, each with its fallback, are in `SKILL.md` → *What this replaces*.

## Flex and grid

**A flex or grid child shrinks below its content only when told to.**
Default it corrects: a child holding a long word, a `<pre>` or a table that won't shrink, pushing the row past the viewport. Fix: `min-width: 0` on the child — `min-width: auto` is the default that causes it. The same on the block axis: a column's middle wrapper that must scroll takes `min-block-size: 0`.

**An auto-fit track's minimum is capped at the container.**
Default it corrects: `repeat(auto-fit, minmax(16rem, 1fr))`, which overflows any container narrower than 16rem. Fix: `minmax(min(100%, 16rem), 1fr)`.

**Centering that can overflow is `safe`.**
Default it corrects: `justify-content: center` on content that can outgrow its box, which pushes the overflow off the start edge where no scroll reaches it. Fix: `safe center`, which falls back to start when the content doesn't fit.

**A full-bleed section breaks out by grid line, never `100vw`.**
Default it corrects: `width: 100vw` with negative margins. `100vw` includes a classic scrollbar's width, so the page scrolls sideways on every desktop that shows one. Fix: a page grid with named lines (`full-width`, `content`); a child takes `grid-column: full-width`, and one that lays out its own children inherits the tracks with `grid-template-columns: inherit`.

**Stacked layers share one grid cell.**
Default it corrects: text over an image by `position: absolute`, which drops the text out of sizing, so a long caption spills past the image. Fix: `display: grid` on the parent, `grid-area: 1 / 1` on every layer, `place-self` to place each. Absolute stays for a layer that must not size the box.

**A query container is a box whose width comes from outside.**
Default it corrects: `container-type: inline-size` on a shrink-to-fit element (a content-sized flex item, `inline-block`, an absolute box). Size containment drops its intrinsic width and it collapses to zero. Fix: put the container on the slot — a block, a grid track, a `flex: 1` item — and the component inside it queries.

## Overflow and scroll

**Cutting off overflow is `overflow: clip`.**
Default it corrects: `overflow: hidden`, which makes a scroll container — a `position: sticky` descendant stops sticking, and focus moving into hidden content scrolls it into view. Fix: `clip`. `hidden` stays where a script scrolls the box.

**An inner scroller contains its own overscroll.**
Default it corrects: a dialog body, drawer or carousel whose scroll, once it hits the end, scrolls the page behind it. Fix: `overscroll-behavior: contain` on the inner scroller.

**A sticky header sets the page's scroll padding.**
Default it corrects: anchor links and keyboard focus landing under the header, which fails WCAG 2.4.11 (Focus Not Obscured). Fix: `html { scroll-padding-block-start: <header height> }`, from the same token the header's height uses.

## Viewport

**Full height is `svh` or `dvh`.**
Default it corrects: `100vh` on a phone, which is the height with the browser toolbar retracted, so the bottom of the screen sits under the toolbar. Fix: `min-height: 100svh` for a layout floor, `dvh` only for an element that should track the toolbar.

**An edge-to-edge page pads by the safe area.**
Default it corrects: a fixed bottom bar under the home indicator, or a header under the notch, once the viewport meta carries `viewport-fit=cover`. Fix: `padding-block-end: max(var(--space), env(safe-area-inset-bottom, 0px))`, and the same at the top.

## Text

**User-supplied text breaks anywhere.**
Default it corrects: a URL, email or long name blowing a card's width. `overflow-wrap: break-word` wraps it in a block, but doesn't reduce a flex or grid item's min-content width, so the item still overflows. Fix: `overflow-wrap: anywhere` on that text — or `break-word` plus `min-width: 0` on the item.

**A form field's text is at least 16px.**
Default it corrects: a 14px input that iOS Safari zooms into on focus, leaving the page zoomed. Fix: `font-size: max(16px, 1rem)` on `input`, `select`, `textarea`.

**Fluid type is `rem` plus `vw`, and its max is at most 2.5× its min.**
Default it corrects: `font-size: 4vw`, or a clamp whose middle term is `vw` alone — viewport units ignore browser zoom, failing WCAG 1.4.4 (Resize Text). Fix: `clamp(min, Xrem + Yvw, max)` with bounds in rem. The slope is (max − min) / (wide − narrow): `Yvw` is slope × 100, `Xrem` is min − slope × narrow. Past 2.5× apart, zoom can't reach 200%.

**A shipped RTL locale means logical sides.**
Default it corrects: `padding-left`, `margin-right`, `left: 0`, `text-align: left`, all of which stay on the wrong side when `dir="rtl"`. Fix: `padding-inline-start`, `margin-inline-end`, `inset-inline-start`, `text-align: start`. Applies when the product ships an RTL locale; otherwise follow the repo.

## Colour and theme

**A grey's hue is `none`.**
Default it corrects: `oklch(70% 0 0)` mixed toward a coloured token with `color-mix(in oklch, …)`. The hue interpolates from 0, so the midpoints tint pink. Fix: `oklch(70% 0 none)` — a missing hue takes the other colour's.

**A theme toggle sets `color-scheme`, never the tokens.**
Default it corrects: every `light-dark()` token restated under `[data-theme="dark"]`, which is a second palette to drift. Fix: `:root[data-theme="dark"] { color-scheme: dark }` (and `light`); every `light-dark()` value flips with it.
