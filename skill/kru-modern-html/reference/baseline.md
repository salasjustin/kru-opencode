# Baseline HTML features — the interactive layer

Curated from **`api.webstatus.dev`** (the Baseline / `web-features` dataset), read **2026-08-13**. Grouped by **capability** — how you'd reach for it — not by year.

`Status` is the Baseline state *as of that read*, and `Since` is the Baseline **low** date (the day it became interoperable across Chrome/Edge/Firefox/Safari). Turn one into the other with `SKILL.md`'s aging rule — **Since + ~30 months ≈ Widely available** — and recompute against today rather than trusting the label. Anything not in this table, or shipped after this read: check live.

The "What it does" column is a **signpost to jog recognition, not a spec** — look the feature up on MDN before relying on its exact behavior.

## Overlays & the top layer

| Feature | Status | Since | What it does |
|---|---|---|---|
| `<dialog>` | Widely | 2022-03-14 | Native dialog element; `showModal()` gets top layer, focus trap, inert background, Escape |
| `::backdrop` | Widely | 2022-03-14 | Styles the layer behind a top-layer element |
| `:modal` | Widely | 2022-09-02 | Matches an element in the modal state (`showModal()`, not `open`) |
| `dialog.requestClose()` | Newly | 2025-05-27 | Closes a dialog by running its close-request steps (fires `cancel`, respects a form) |
| Popover | Newly | 2025-01-27 | `popover` + `popovertarget`: top layer + light dismiss, deliberately non-modal |
| Invoker commands | Newly | 2025-12-12 | `command`/`commandfor` — declarative open/close/toggle with no click handler |
| `:open` | Newly | 2026-05-11 | Matches an element in its open state (dialog, details, select, popover) |
| ToggleEvent source | Newly | 2026-05-11 | `event.source` on a toggle event — which invoker opened it |
| `<dialog closedby>` | Limited | — | Declares what may close a dialog (`any`/`closerequest`/`none`) |
| `popover="hint"` | Limited | — | A third popover type for hover-triggered hints |
| Interest invokers | Limited | — | `interestfor` — hover/focus-triggered invocation |
| CloseWatcher | Limited | — | Intercepts platform close requests (Escape, Android back) |
| Anchor positioning | Limited | — | `anchor-name`/`position-area` — tether an element to another without JS |

## Disclosure & content

| Feature | Status | Since | What it does |
|---|---|---|---|
| `<details>` | Widely | 2020-01-15 | Native disclosure widget |
| Mutually exclusive `<details>` | Newly | 2024-09-03 | `name="group"` — an accordion that closes its siblings, no JS |
| `::details-content` | Newly | 2025-09-16 | Targets the disclosure content, which is what makes it animatable |
| `hidden="until-found"` | Limited | — | Hidden content that find-in-page and fragment links can reveal |

## Forms & validation

| Feature | Status | Since | What it does |
|---|---|---|---|
| Constraint validation API | Widely | 2018-12-11 | `checkValidity()`, `setCustomValidity()`, `ValidityState` |
| `:user-valid`, `:user-invalid` | Widely | 2023-11-02 | Validity pseudo-classes that fire only after interaction or a submit attempt |
| Form-associated custom elements | Widely | 2023-03-27 | `formAssociated` + `ElementInternals` — a custom element that participates in a form |
| Vertical form controls | Newly | 2024-04-18 | Control alignment/orientation for vertical writing modes |
| Customizable `<select>` | Limited | — | `appearance: base-select` + `<selectedcontent>` — a stylable select without a library |
| `<input type="checkbox" switch>` | Limited | — | Native switch rendering for a checkbox |
| `showPicker()` for `<select>` | Limited | — | Opens a select's picker programmatically |
| `<input type="color">` alpha/colorspace | Limited | — | Alpha and wide-gamut support on the color input |

## Landmarks & status

| Feature | Status | Since | What it does |
|---|---|---|---|
| `<search>` | Widely | 2023-10-13 | The search landmark as an element, replacing `<div role="search">` |
| `<output>` | Widely | — | Result of a calculation; implicit `role="status"` — *"many browsers"* (MDN) treat it as an `aria-live` region, so it usually announces without a hand-wired one |
| `inert` | Widely | 2023-04-11 | Removes a subtree from focus, hit-testing and the a11y tree in one attribute |
| `enterkeyhint` | Widely | 2021-11-02 | Labels the virtual keyboard's action key (`send`, `go`, `next`) |

## Loading & priority

| Feature | Status | Since | What it does |
|---|---|---|---|
| Lazy-loading images and iframes | Widely | 2023-12-19 | `loading="lazy"` — defers offscreen resources with no observer |
| Fetch priority | Newly | 2024-10-29 | `fetchpriority="high"/"low"` — reprioritizes a resource without a preload tag |
| Lazy-loading media | Limited | — | `loading="lazy"` on `<video>`/`<audio>` |
| `<img sizes="auto">` | Limited | — | Lets the browser compute `sizes` for a lazy-loaded image |
| `blocking="render"` | Limited | — | Explicitly marks a resource as render-blocking |
