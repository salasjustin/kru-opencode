---
name: kru-modern-html
description: Baseline judgment for native HTML — which platform elements and attributes now do a job that used to need a library or hand-rolled JS. Covers <dialog> vs the popover attribute, invoker commands, exclusive <details> accordions, inert, constraint validation and :user-invalid, <output>, <search>, and the loading/priority hints. Use before reaching for a headless primitive, a wrapper element, or JS for something the platform now ships.
---

The **native-element** half of the platform judgment: what HTML now does on its own, and which of those are safe to reach for. Load it when you're about to build an overlay, a disclosure, a form control, or a status message — before you reach for a primitive library or write JS.

**Semantics are not this skill.** Landmarks, heading order, `<button>` over `<div onclick>` — every model already writes those correctly, and a restatement here would just be a file to keep true. What earns the load is the newly-native interactive layer and the traps in it.

## The three Baseline states, and the aging rule
Both live in **`modern-css`** — same states, same *year + ~30 months* math, one source for both halves of the platform. Statuses below were computed against **2026-08-13** from `api.webstatus.dev`; recompute against today, or check live (MDN's Baseline badge, `web.dev/baseline/<feature>`) for anything not listed.

## What this replaces — reach for the element before the library

| Old technique | Native HTML | Status |
|---|---|---|
| A JS modal: focus trap, scroll lock, backdrop, escape handler | `<dialog>` + `showModal()` | Widely (2022-03) |
| A JS popover/tooltip/menu: outside-click dismiss, z-index stack, positioning root | `popover` attribute + `popovertarget` | Newly (2025-01) |
| A click handler whose only job is to open/close another element | `command` / `commandfor` invoker attributes | Newly (2025-12) |
| A JS accordion that closes its siblings | `<details name="group">` | Newly (2024-09) |
| `tabindex="-1"` sweeps + `aria-hidden` to freeze the background | `inert` attribute | Widely (2023-04) |
| A validation library for required/type/range/pattern | Constraint validation + `setCustomValidity()` | Widely (2018-12) |
| Validating on every keystroke, or `:invalid` styling an untouched field | `:user-invalid` / `:user-valid` | Widely (2023-11) |
| A hand-wired `aria-live` region for a calculated result | `<output>` — implicit `role="status"`; MDN: *"many browsers implement this element as an `aria-live` region"*, so treat it as the default and verify announcement on your targets rather than assuming it universally | Widely |
| `<div role="search">` | `<search>` | Widely (2023-10) |
| An `IntersectionObserver` purely to defer offscreen images/iframes | `loading="lazy"` | Widely (2023-12) |
| A `<link rel=preload>` to promote the LCP image | `fetchpriority="high"` | Newly (2024-10) |

**Limited availability — not interoperable yet.** Don't reach for these without the user's go-ahead, and always behind `@supports`: CSS anchor positioning, customizable `<select>` (`<selectedcontent>`), `<dialog closedby>`, `popover="hint"`, interest invokers, `<input type="checkbox" switch>`, `hidden="until-found"`.

The full grouped table, with every feature's status and Baseline date: **`reference/baseline.md`**.

## Native first, then the primitive library
Check this skill before `ark-ui`. A native element you style is smaller, has no dependency, and cannot have its a11y defeated by half-composed parts. **Which** library when native isn't enough is `ark-ui`'s reach-for section — that call is written once, there.

Native is enough for: a modal shell, a disclosure, an exclusive accordion, a light-dismiss popover, a status region. Reach past it for the primitives with real state machines and typeahead — combobox, select, date picker — and for anything needing anchored positioning, since anchor positioning is still limited.

## Traps — each written as the failure it causes
- **`<dialog open>` is not a modal.** The attribute (and `.show()`) renders the dialog non-modally: no top layer, no `::backdrop`, no focus trap, no inert background, no Escape-to-close, and `aria-modal="false"`. Only **`showModal()`** gets those. MDN: *"It is recommended to use the `.show()` or `.showModal()` method to render dialogs, rather than the `open` attribute"* — a dialog opened by attribute screenshots correctly and is keyboard-escapable into the page behind it.
- **A popover is not a dialog.** `popover` gives light dismiss and the top layer, and deliberately gives no modality — the page behind stays interactive and focus is not trapped. Using it for a confirm or a destructive-action prompt ships a prompt the user can click past. `popover="manual"` opts out of light dismiss; it does not add modality.
- **`:invalid` matches before the user has typed.** An empty `required` field is invalid on first paint, so `:invalid` styling paints a fresh form red. `:user-invalid` waits for interaction or a submit attempt — it is the selector you want in essentially every case, and it has been Widely available since 2026-05. (*When* the field reports its error is `ui-patterns` → `forms-and-mutations`.)
- **Native validation bubbles can't be styled and can't be read back.** The moment you want your own error text, put `novalidate` on the form and drive it from `ValidityState` yourself — a half-measure leaves two error surfaces disagreeing.
- **`<input type="number">` loses digits.** Scroll-wheel changes the value silently, the spinner is a mis-tap target, and a locale using `,` as the decimal separator can hand you an empty `value`. For an amount, use `type="text"` + `inputmode="decimal"` and validate yourself.
- **Autofill needs the token, not a guess at the name.** `autocomplete="name"` / `email` / `street-address` / `cc-name` is what fills; `autocomplete="on"` beside `name="fullname"` does not. It's also WCAG 2.1 AA (1.3.5 Identify Input Purpose), so it's a finding either way.
- **`<dialog>` returns focus to the invoker; nothing else does.** A popover, an `inert`-toggled panel, or a custom overlay leaves focus where it was — put it back yourself, or the next Tab starts from the top of the document.
- **Invoker commands are eight months into Newly available.** `command`/`commandfor` is the right shape and crosses to Widely around mid-2028 — check the project's support floor before shipping it as the only path, and keep the JS fallback until then.

## Not this skill's job
- **Baseline states and the aging rule** — `modern-css`, which owns them for both halves of the platform.
- **What the component does** — validation timing, where a failed submit sends focus, where an outcome reports: `ui-patterns`, the one group matching your build target.
- **Which primitive library, and its part anatomy** — `ark-ui` (or the repo's existing lib).
- **Appearance** — the project's token file, via the `## Design system` pointer. This skill names elements, never values.
- **Shadow DOM, slots, custom elements** — `web-components`.
- **The WCAG audit afterwards** — `accessibility-reviewer` / `/kru/accessibility-review`.
