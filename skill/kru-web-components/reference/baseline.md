# Baseline status — custom elements and shadow DOM

Curated from **`api.webstatus.dev`** (the Baseline / `web-features` dataset), read **2026-08-13**. Grouped by **capability** — how you'd reach for it — not by year.

`Status` is the Baseline state *as of that read*, and `Since` is the Baseline **low** date (the day it became interoperable across Chrome/Edge/Firefox/Safari). Turn one into the other with `modern-css`'s aging rule — **Since + ~30 months ≈ Widely available** — and recompute against today rather than trusting the label. Dates are recorded at the precision the read returned.

The "What it does" column is a **signpost to jog recognition, not a spec** — look the feature up on MDN before relying on its exact behavior.

## Defining the element

| Feature | Status | Since | What it does |
|---|---|---|---|
| Shadow DOM · autonomous custom elements · `:host` | Widely | 2020-01 | The base capability: `customElements.define`, `attachShadow`, and the selector for the host itself |
| **Scoped custom element registries** | **Limited** | — | A registry per shadow root, so a tag name isn't a page-wide global. Its absence is a design constraint, not a nicety |
| **Customized built-ins** (`is="…"`) | **Limited** | — | Extending `HTMLButtonElement` and friends. Limited for years; an autonomous element wrapping a real control is the portable shape |

## Styling and slotting across the boundary

| Feature | Status | Since | What it does |
|---|---|---|---|
| Shadow parts (`::part`) | Widely | 2020-07 | The outward styling hook, opted into with `part="name"` |
| Constructed stylesheets (`adoptedStyleSheets`) | Widely | 2023-03 | One `CSSStyleSheet` shared across every instance, instead of a `<style>` parsed per shadow root |
| Imperative slot assignment | Widely | 2023-03 | `slot.assign()` — assigning slotted nodes from script rather than by `slot=` attribute |
| **`:host-context()`** | **Limited** | — | Styling based on an ancestor outside the root |

## State, forms and ARIA

| Feature | Status | Since | What it does |
|---|---|---|---|
| Form-associated custom elements (`ElementInternals`) | Widely | 2023-03 | `formAssociated` + `setFormValue`/`setValidity` — the element participates in a `<form>` |
| `:state()` / `CustomStateSet` | Newly | 2024-05 | Exposes internal state to outside selectors; the supported replacement for reflecting state as a class |
| **Reference target** (cross-root ARIA) | **Limited** | — | The platform's fix for `aria-labelledby`/`aria-controls` not crossing a shadow root. Until it lands, keep both ends of a labelled relationship in the same root |

## Serialization and SSR

| Feature | Status | Since | What it does |
|---|---|---|---|
| Declarative shadow DOM | Newly | 2024-02 | `<template shadowrootmode="open">` — a shadow root the parser builds, so it can arrive in server-rendered HTML |
| `getHTML()` | Newly | 2024-09 | Serializes an element *including* its shadow roots, which `innerHTML` won't do |

**Not in this read, so check live before depending on it:** `connectedMoveCallback()`, `delegatesFocus`, and anything shipped after 2026-08-13.
