---
name: kru-web-components
description: Vanilla custom elements and shadow DOM — customElements.define, the lifecycle callbacks, observedAttributes, attachShadow, slots and ::part, CustomEvent across the boundary, and form participation via ElementInternals. Load when writing or reviewing a custom element; reference/embedding.md carries the third-party-embed branch, a widget shipped into a page you don't control.
---

Custom elements written by hand, with a shadow root. The failure mode this skill exists for: **almost none of these throw.** The element upgrades, the console is clean, and the widget is subtly wrong — a keystroke dropped, an event nobody receives, a color inherited from a stranger's stylesheet.

Use a custom element when the component has to **outlive a framework**: a widget embedded in a page you don't control, or a design system consumed by more than one stack. Inside an app that already has React or Svelte, the framework's component is the right unit and this skill isn't the lane.

## Platform status
Four features are **Limited availability**, and two of those shape the design rather than decorate it: **scoped custom element registries**, so a tag name is a global on every page you land on; and **reference target**, so ARIA still cannot cross a shadow root. Build for both. The other two are **`:host-context()`** and **customized built-ins** (`is="…"`) — reach for something else.

Everything else here is Widely or Newly available, `adoptedStyleSheets` and form-associated elements included (both since 2023-03), so the rest of this skill needs no fallbacks. Full table with dates: **`reference/baseline.md`** (`api.webstatus.dev`, read 2026-08-13). `modern-css` owns the three Baseline states and the aging rule; recompute against today.

## Definition and upgrade
- **The constructor may not touch attributes, children, or the DOM.** MDN, on the constructor: *"you should not inspect the element's attributes or children, or add new attributes or children"* — it runs before the element is in a document, and for parser-created elements before its attributes exist. `attachInternals()` and `attachShadow()` belong here; everything else belongs in `connectedCallback`.
- **A property set before upgrade permanently shadows your accessor.** A host page that does `el.amount = 25` before your script loads creates an *own* property on the instance; when the class upgrades, the prototype getter/setter beneath it is never reached again. The value looks stored and nothing you wrote runs. web.dev's custom-element best practices name the fix — capture, delete, re-set, per property, in `connectedCallback`:

  ```js
  #upgrade(prop) {
    if (!Object.hasOwn(this, prop)) return
    const value = this[prop]
    delete this[prop]      // uncover the prototype accessor
    this[prop] = value     // re-run it with the value the host set
  }
  ```

- **`connectedCallback` is not a mount hook — a *move* re-fires it.** MDN: *"Each time a custom element is moved … the `disconnectedCallback()` and `connectedCallback()` lifecycle callbacks are fired, because the element is disconnected from and reconnected to the DOM."* So make it idempotent: build the shadow root once (guard on `this.shadowRoot`), and register listeners against a fresh `AbortController` each time. A newer `connectedMoveCallback()` runs *instead of* the pair during moves — check its live status before depending on it.
- **`observedAttributes` sees strings, and only the ones you list.** Attributes are the *config* surface (strings, from markup); properties are the *rich* surface (objects, numbers, set from script). Reflect deliberately in one direction — writing an attribute from inside its own `attributeChangedCallback` is the infinite loop.
- **Extend `HTMLElement`, not a built-in.** Customized built-ins (`is="my-button"`) are Limited and have been for years; an autonomous element wrapping a real `<button>` is the portable shape.

## Rendering — there is no diff
Vanilla means every update is one you wrote. The default that breaks things:

- **Re-assigning `innerHTML` destroys focus, selection, and in-flight input.** Re-render a form while someone is typing in it and the caret leaves, the partial value goes, and an IME composition is dropped. `innerHTML` is for the **initial** structure only; every later change is a targeted write to a node you already hold (`this.#amountEl.textContent = …`).
- Build the initial tree from a **`<template>` cloned per instance** rather than parsing a string per instance.
- **Share one stylesheet across every instance** via `adoptedStyleSheets` and a module-level `CSSStyleSheet` (Widely available since 2023-03) — a `<style>` element per shadow root is a parse per instance.

  ```js
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  // in connectedCallback:
  this.shadowRoot.adoptedStyleSheets = [sheet]
  ```

## The shadow boundary — what crosses
This is the part that surprises, in both directions.

**Crosses in:** inherited CSS properties (`color`, `font`, `line-height`) and **every custom property**. `--primary` defined anywhere up the tree lands inside your shadow root. That is the theming channel *and* the collision — see the namespacing rule below.

**Does not cross:** selectors (nothing outside can target inside, `!important` included), `document.querySelector`, `document.activeElement` (it returns your host — use `shadowRoot.activeElement`), and **ARIA ID references**. `aria-labelledby`, `aria-describedby` and `aria-controls` cannot point across a shadow root in either direction, and the platform's fix (*reference target*) is still Limited. A label outside and its input inside are simply not associated; nothing warns you. Keep every element of a labelled relationship in the **same root**.

**Your styling API is the only one you get:**
- `:host`, `:host(.modifier)` — the element itself. `:host-context()` is **Limited**; don't build on it.
- `::part(name)` — the outward hook, exposed by `part="name"` (Widely since 2020-07). `::slotted()` matches **top-level** slotted nodes only, and only compound selectors — no descendants.
- `:state()` (Newly, 2024-05) exposes internal state to outside selectors via `ElementInternals.states` — the supported replacement for reflecting state as a class.
- **Slotted content stays light DOM and is styled by the page around you**, not by your sheet. In a page you don't own, a slot is an opening for their CSS; prefer attributes and properties for anything that has to look right.

**Namespace your tokens.** The team's vocabulary is deliberately generic (`--primary`, `--background`), and generic names inherit. On a page you don't own, an unrelated `--primary` bleeds into your component. Prefix the token file this element reads (`--dg-primary`) and map the public subset explicitly. This is a stated exception to the one-vocabulary rule, and it applies only inside a shadow root distributed beyond the app.

## Events
`bubbles`, `cancelable` and `composed` all default to **`false`** on the `CustomEvent` constructor, and MDN is explicit about the consequence: with `composed: false`, *"the shadow root will be the last node to be offered the event."* An event dispatched inside your shadow root with the defaults never reaches a host page listening on your element. Emit with both set:

```js
this.dispatchEvent(new CustomEvent('donation:submit', {
  bubbles: true, composed: true, detail: { amount },
}))
```

Retargeting is the counterpart: a listener outside sees `event.target` as **your host element**, never the inner button. That's the boundary working — read your own `detail`, don't reach for `event.target`.

## Focus and forms
- **`delegatesFocus: true`** on `attachShadow` sends focus to the first focusable descendant and applies `:focus` to the host. Without it, clicking your element's padding focuses nothing.
- **A custom element is invisible to a `<form>` until you make it visible.** `static formAssociated = true` + `attachInternals()`, then `internals.setFormValue(value)` on every change and `internals.setValidity(flags, message, anchorEl)` for validity — the anchor is the element the browser points its message at, and omitting it is why the message never appears. Widely available since 2023-03, so it needs no fallback. This also buys `:user-invalid` on the host, which is the selector to style against (`modern-html`).

## Cleanup and first paint
- **One `AbortController` per element, every listener registered with its signal, `abort()` in `disconnectedCallback`.** Hand-tracking `removeEventListener` per listener is how one gets missed, and a host page that swaps your widget out leaks the whole element graph. It also pairs correctly with the move-refires-connected rule above: a fresh controller per connect, aborted on every disconnect.

  ```js
  connectedCallback() {
    this.#ac = new AbortController()
    const { signal } = this.#ac
    button.addEventListener('click', this.#onClick, { signal })
    window.addEventListener('resize', this.#onResize, { signal })
  }
  disconnectedCallback() { this.#ac.abort() }
  ```

- **Before upgrade your element is an unknown inline element with no size.** Style `:not(:defined)` with the reserved dimensions so the page doesn't reflow when your script lands.

## Embedding in a page you don't control
A widget distributed to third-party sites carries a second set of constraints — the registration guard, the bundle rules, the host's CSP, the theming contract as a versioned public API, and where a payment redirect returns to. **`reference/embedding.md`** — read it when the element ships to someone else's page.

## Not this skill's job
- **Which native element to use, and its Baseline status** — `modern-html`. Reach for the platform first; the shadow root goes around what's left.
- **CSS feature safety** — `modern-css`, which owns the Baseline states for both.
- **What the component does** — `ui-patterns`, one group per build target.
- **Appearance** — the project's token file. This skill decides how a token *reaches* the component, never what it is.
- **The payment layer** — `stripe-specialist` owns the client, the intent, and the webhook; this skill owns the shell and the mount node it hands over.
