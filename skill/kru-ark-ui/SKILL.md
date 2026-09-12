---
name: kru-ark-ui
description: Ark UI headless-component reference every UI builder loads for accessible interactive primitives — dialog/modal, dropdown/menu, combobox, select, date-picker, tabs, tooltip, popover, toast, and the rest of Ark's catalog on Zag.js state machines, across React / Vue / Solid / Svelte. Covers when to reach for Ark vs. the repo's existing lib, compound-component part anatomy, the built-in a11y surface (ARIA/focus/keyboard) and how not to defeat it, and the styling hookup (data-attributes / CSS vars) onto the design system's tokens. Use when a feature needs an interactive UI primitive built accessibly instead of hand-rolled — reach for it on the complex ones (overlays, form controls, date pickers), not a styled button. This is ambient component craft woven into the route you're already building — not a separate hand-off.
---

Ark UI is the **headless component layer** — accessible, unstyled interactive primitives on Zag.js state machines. It's **ambient craft**: you (the framework builder) build the primitive in-place in the route you're already writing, style it against the design tokens, and place it — no separate hand-off. Load this when a feature needs a real interactive primitive (an overlay, a form control, a date picker) done accessibly, and you're deciding whether to reach for Ark, and how to compose it so its built-in a11y actually fires.

## When to reach for Ark (vs. the repo's lib, vs. hand-rolling)
The reach-for-Ark call is the load-bearing judgment — get it wrong and you either drag a second primitive library into a repo that has one, or hand-roll a focus trap that ships broken.
- **Check the platform first.** A modal shell, a disclosure, an exclusive accordion, a light-dismiss popover and a status region are all native now — `<dialog>`/`showModal()`, `<details name>`, the `popover` attribute, `<output>`, with `inert` for the background. Load the **`modern-html`** skill for what's native and whether it's safe to reach for today; a native element you style has no dependency and no anatomy to half-compose. Reach past it for the primitives with real state machines and typeahead (combobox, select, date picker) and for anything needing anchored positioning, which is still Limited availability.
- **Brownfield defers to the repo's existing component library.** If the repo is already on shadcn/Radix/Headless UI/Skeleton/etc., use that — minimal diff. Don't introduce Ark as a second primitive library; flag the mismatch to the lead instead. The tell for shadcn is a **`components.json`** at the root, and that repo has its own vendored playbook: load the **`shadcn`** skill and build from what's installed.
- **Reach for Ark** when the stack is **Vue/Solid/Svelte** (where a React-only kit like Radix doesn't fit) or when the repo **already uses Ark**.
- **Greenfield React is the one open call, and it isn't yours** — Ark and shadcn are both available, they answer to the same design tokens, and the choice belongs to the plan the lead hands down. Build the primitive the plan names; with no name in it, ask the lead rather than default. Whichever comes down, it's the only primitive library in the repo from then on.
- **Reach for it on the complex primitives** — the ones where a11y is hard and hand-rolling silently breaks it: dialogs/modals, dropdowns/menus, comboboxes, selects, date pickers, tabs, tooltips, popovers, toasts. A styled button or a plain `<a>` doesn't need Ark — don't over-reach.

## Consult current docs (official sources first)
Never answer Ark component/API specifics from memory — the part/anatomy API and per-component props move fast, and there are four framework packages. In priority order:
1. **Ark UI MCP** — install with `claude mcp add ark-ui -- npx -y @ark-ui/mcp`. If connected (`list_components` / `list_examples` / `get_example` / `styling_guide` tools present), use it: `list_components` to find the primitive, `get_example` for the exact anatomy/props for the repo's framework, `styling_guide` for `data-*` attributes / CSS vars / design tokens. Prefer it over everything below.
2. **`llms.txt`** — `https://ark-ui.com/docs/ai/llms.txt` when the MCP isn't connected.
3. **Context7 fallback** — `ark-ui` (resolve → query-docs) when nothing above is reachable. Verify component names, part names, and props here before writing.

State which source you used. If the MCP isn't connected, say so and fall back — don't guess tool names.

## Framework awareness (match the repo)
Ark ships one package per framework — `@ark-ui/react`, `@ark-ui/vue`, `@ark-ui/solid`, `@ark-ui/svelte`. Use **your framework's package + idioms** — the component anatomy is shared, but the import path, control-flow, and reactivity differ. Pull the framework-correct example from the MCP (`get_example` is framework-aware) — never port a React snippet into Svelte by hand.

## Composition — use the full part anatomy
- Use the **compound-component / part API** (`X.Root` wrapping `X.Trigger`, `X.Content`, `X.Positioner`, etc.) — that's how state and a11y wire together. Don't collapse it into a single opaque prop-bag component unless the repo's convention is a thin wrapper, and even then wrap the **full anatomy** inside it.
- Prefer **uncontrolled** (Ark manages state) unless the feature needs controlled state — syncing to a URL/query or a form library — then wire `value`/`onValueChange` explicitly.
- Expose a small, typed surface: the component + the props it needs, not Ark's entire API re-exported.

## Accessibility (non-negotiable)
- Ark + Zag already provide the correct ARIA roles/attributes, focus management, keyboard interaction, and typeahead for each primitive. **Don't reinvent or override them** — compose all documented parts so the built-in a11y actually fires. A dialog missing its `Backdrop`/`Positioner`/`CloseTrigger` loses focus-trap and escape handling; the config *looks* fine while silently broken.
- Preserve labelling: wire `Label`/`Description` parts (or `aria-label`) so every control has an accessible name.
- Respect `prefers-reduced-motion` for any open/close animation you add.
- Never render a raw `<div onClick>` in place of the `Trigger` part or suppress focus return — that defeats the reason to use Ark. If you catch yourself doing it, stop.

## Styling — hook onto the design tokens
- Ark is **headless/unstyled** — style via the parts' `data-*` state attributes (`[data-state=open]`, `[data-disabled]`, `[data-highlighted]`, …) and Ark's CSS variables, per the `styling_guide`. Consult it; don't assume attribute names.
- Use whatever the repo already uses to apply styles (Tailwind, CSS modules, vanilla-extract, Panda) — match it, don't introduce a styling system.
- Map the repo's tokens onto the component; keep styling co-located the way the repo does. If a token you need is missing, ask the lead — don't improvise a value.

## Under a browser-mode test
Two things zag does that a Playwright-driven test reads as failure (reproduced on `@ark-ui/react@5.37.2`, Vitest 5 Browser Mode):
- **`Dialog.Backdrop` fails actionability.** The backdrop is `fixed; inset: 0`, and Playwright's pre-click check reads it as intercepting the pointer, so `locator.click()` on anything inside an open dialog times out. Click the element directly — `(loc.element() as HTMLElement).click()` — which skips the check; the dialog's own handlers still run.
- **Escape is registered late.** The dismissable layer attaches its document `keydown` listener in a deferred `requestAnimationFrame`, so one `{Escape}` right after render races the registration and passes or fails by timing. Dispatch it inside `vi.waitFor` until the content is gone.

## TypeScript
Ark components are TS-heavy (generic `value`/`collection` types, part props). For any hard type work — a cryptic generic on `Select`/`Combobox`, controlled-state typing, a `.d.ts` — load the **`typescript`** skill and solve it in-context.

## Not this skill's job
- **Placing the primitive in a route, wiring page data, form submission / server actions** — that's the framework build you're already doing; this skill is just the primitive's composition + a11y + styling.
- **The visual system** (palette, type, spacing, motion tokens) is the design's — you *apply* those tokens, you don't invent them.
- **Post-build passes** — `/kru/accessibility-review` (WCAG) and `/kru/visual-review` (rendered UI) are the user's to pull afterward; this skill is the build-time discipline that makes them come back clean.
