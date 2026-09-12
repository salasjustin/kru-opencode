# Baseline CSS features, 2023–2025

Curated from web.dev/baseline/2023, /2024, /2025. CSS only (selectors, properties, functions, at-rules, units, media features) — closely-related HTML/JS platform features are in the last table since builders reach for them alongside CSS.

Grouped by **capability** (how you'd reach for it), not by year — the year is the `BL` column. See `SKILL.md`'s aging rule for turning that year into a *current* Baseline status: 2023 ≈ Widely available, 2024 ≈ crossing the line, 2025 ≈ Newly available. Recompute against today; don't trust the year as a fixed label.

The "What it does" column is a one-line **signpost to jog recognition, not a spec** — for exact syntax, values, and edge behavior, look the feature up on MDN (`developer.mozilla.org`) or `web.dev/baseline/<feature>` before relying on it.

## Selectors, pseudo-classes & scoping

| Feature | BL | What it does |
|---|---|---|
| `:has()` | 2023 | Parent/relational selector — style an element based on what it contains |
| `:dir()` | 2023 | Matches an element's text direction (LTR/RTL) |
| `:nth-child(An+B of S)` | 2023 | Filters `:nth-child` matches by an inner selector |
| `:user-valid`, `:user-invalid` | 2023 | Form-validation pseudo-classes that only fire after user interaction |
| `:state()` | 2024 | Matches a custom element's internal state, set via its `CustomStateSet` |
| `@scope` | 2025 | Scopes selectors to a DOM subtree, with a scoping root and optional lower limit boundary |
| `::target-text` | 2024 | Styles text highlighted via a URL text-fragment link |
| `::details-content` | 2025 | Targets a `<details>` element's disclosure content |
| `::spelling-error`, `::grammar-error` | 2025 | Styling hooks for browser-flagged spelling/grammar text |
| CSS Nesting | 2023 | Native selector nesting, no preprocessor needed |

## Layout

| Feature | BL | What it does |
|---|---|---|
| Container queries | 2023 | `@container` — styles based on a containing element's size or style, not the viewport |
| Subgrid | 2023 | A grid item's own grid can inherit the parent's tracks (`grid-template-columns/rows: subgrid`) |
| Two-value `display` | 2023 | Shorthand for outer + inner display (e.g. `display: block flow-root`) |
| `align-content` on block containers | 2024 | Distributes a block formatting context's children along the block axis |
| `text-wrap` (incl. `balance`, `pretty`) | 2024 | Controls line-wrapping strategy; `balance` evens out line lengths for headlines |
| Vertical form controls | 2024 | Form-control alignment/orientation adapted for vertical writing modes |

## Color

| Feature | BL | What it does |
|---|---|---|
| `color-mix()` | 2023 | Blends two colors by a given ratio, in a given color space |
| `color()` | 2023 | Absolute color function across color spaces (`srgb-linear`, `display-p3`, …) |
| `lab()`, `lch()` | 2023 | Perceptually-uniform CIE color spaces |
| `oklab()`, `oklch()` | 2023 | Perceptually-uniform spaces tuned for the web (better hue stability than Lab/LCH) |
| Relative color syntax | 2024 | Derives a new color from an existing one, e.g. `lch(from var(--c) calc(l + 20) c h)` — channels resolve to unitless `<number>`, not `%` |
| `light-dark()` | 2024 | Picks between two color values based on the active color scheme |
| Gradient interpolation color space | 2024 | `linear-gradient(in oklch, …)` — controls which space a gradient interpolates through |
| `color-gamut` media feature | 2023 | `@media (color-gamut: srgb/p3/rec2020)` |

## Units & math

| Feature | BL | What it does |
|---|---|---|
| `cap` unit | 2023 | Font-relative length based on cap height |
| `lh`, `rlh` units | 2023 | Line-height-relative and root-line-height-relative length units |
| `calc()` constants | 2023 | `e` and `pi` usable inside `calc()` |
| `exp()`, `pow()`, `sqrt()`, `log()` | 2023 | Exponential/logarithmic math functions |
| Trigonometric functions | 2023 | `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`, `atan2()` |
| `round()`, `mod()`, `rem()` | 2024 | Rounding and remainder math functions |
| `abs()`, `sign()` | 2025 | Absolute value and sign math functions |
| Media query range syntax | 2023 | `@media (width >= 400px)` comparison syntax |

## Animation & transitions

| Feature | BL | What it does |
|---|---|---|
| `@starting-style` | 2024 | Defines the "from" state for an element entering the render tree (e.g. `display: none` → shown) |
| `transition-behavior: allow-discrete` | 2024 | Lets a transition apply across a discrete property jump (`display`, `content-visibility`) |
| `linear()` easing | 2023 | Custom easing function defined by interpolation points |
| `animation-composition` | 2023 | How multiple animations on a property combine (replace/add/accumulate) |
| View Transitions (same-document) | 2025 | Animates between two DOM states via the `::view-transition-*` pseudo-element tree |
| `view-transition-class` | 2025 | Assigns a class to elements in a view transition, for shared styling |

Scroll-driven animation (`animation-timeline: scroll()/view()`) is the native replacement for `IntersectionObserver`-linked animation — verify its live Baseline status (it trails the years above); see SKILL.md.

## Scroll & rendering performance

| Feature | BL | What it does |
|---|---|---|
| `scrollbar-gutter` | 2024 | Reserves scrollbar space up front, preventing layout shift when a scrollbar appears |
| `scrollbar-width` | 2024 | Sets scrollbar thickness (`thin`/`auto`/`none`) |
| `scrollbar-color` | 2025 | Sets scrollbar track and thumb colors |
| `content-visibility` | 2025 | Skips layout/paint work for off-screen content until it's needed |
| `contain-intrinsic-size` | 2023 | Placeholder size for elements skipped by `content-visibility` |

## Effects & masking

| Feature | BL | What it does |
|---|---|---|
| `backdrop-filter` | 2024 | Applies filter effects (blur, etc.) to whatever renders behind a transparent element |
| CSS Masking (`mask-*`) | 2023 | Complex shape/transparency masks on an element |
| Clip-path box geometry | 2023 | Extended `clip-path` with box keywords (`margin-box`, `fill-box`, …) |
| `rect()`, `xywh()` basic shapes | 2024 | Rectangle basic-shape values for `clip-path`/`shape-outside` |
| `transform-box` | 2024 | Sets the reference box a `transform` is relative to |
| `paint-order` | 2024 | Controls stacking order of fill/stroke/markers (SVG, text) |
| `zoom` | 2024 | Scales an element and its content, reflowing surrounding layout (unlike `transform: scale()`, which scales visually only) |

## Custom properties

| Feature | BL | What it does |
|---|---|---|
| `@property` (registered custom properties) | 2024 | Typed custom properties with defined syntax, inheritance, and animatability |

## Typography, forms & print

| Feature | BL | What it does |
|---|---|---|
| `hyphens` | 2023 | Controls automatic hyphenation |
| `hyphenate-character` | 2023 | Sets the character used at a hyphenation break |
| `font-synthesis-small-caps`/`-style`/`-weight` | 2023 | Whether the browser synthesizes small-caps/italic/bold when the font lacks them |
| `font-variant-alternates` | 2023 | Selects a font's stylistic alternate glyphs |
| `font-size-adjust` | 2024 | Adjusts apparent font size by x-height, to match fallback fonts |
| `white-space-collapse` | 2024 | Fine-grained whitespace-collapsing control (splits out of `white-space`) |
| `@counter-style` | 2023 | Defines a custom counter style for lists/numbering |
| `counter-set` | 2023 | Sets a counter's value without incrementing it |
| `image-set()` | 2023 | Picks an image source by resolution/format |
| Alt text for CSS-generated content | 2024 | `content: "text" / "alt text"` — accessible label for generated content |
| `outline` shorthand | 2023 | Shorthand for `outline-color`/`-style`/`-width` |
| `@page` | 2024 | Print/paging layout control |
| `print-color-adjust` | 2025 | Whether the browser may adjust colors for print output |
| `ruby-align`, `ruby-position` | 2024 | Positions ruby annotation text relative to its base |

## Environment media features

| Feature | BL | What it does |
|---|---|---|
| `scripting` media feature | 2023 | `@media (scripting: none/enabled)` — detects JS availability |
| Overflow media features | 2023 | `@media (overflow-block/inline)` — detects scroll vs. paginate behavior |
| Update-frequency media feature | 2023 | `@media (update)` — detects refresh-rate capability |

## Closely-related platform features (not CSS, but reached for alongside it)

| Feature | BL | What it does |
|---|---|---|
| Declarative Shadow DOM | 2024 | Defines a shadow root directly in HTML, no JS required |
| Popover API | 2025 | Native dismissible overlay (`popover` attribute, `::backdrop`, `:popover-open`) |
| Invoker Commands | 2025 | Declarative button-invoked actions on another element (`commandfor`/`command`) |
