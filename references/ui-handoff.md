# The UI handoff — the seam, the closed set, and what rides with the builders

Detail behind `lead` → Step 3, and `visual-reviewer`'s conformance rule. Reached when the change list contains a `.tsx`/`.svelte`/custom-element file; a change that touches no component never loads this.

Four things live here: **who writes components** (the seam), **why conformance is a handoff property rather than a review finding** (the closed set), and the two crafts that ride *with* the UI builders instead of getting a hop of their own (**motion**, **primitives**).

## The UI seam (component ↔ everything-else split)

**Only `react-ui-builder`, `svelte-ui-builder` and `web-components-builder` write components.** Every other seat hands component implementation across the seam — the framework seats (`sveltekit-builder`, `react-router-builder`, `nextjs-builder`), which own the **network boundary** (routes, loaders/`load`, actions, caching) and mount components as thin glue (`<Page {...props} />`), and the domain seats (`stripe-specialist`, `better-auth-specialist`, the data seats) alike, each of which states its own half in a **Builder owns** line.

**A file's directory does not own it**: `methods/stripe/form.tsx` is a component that happens to live under `stripe/`, and its React state, effects and lifecycle are `react-ui-builder`'s however much money the surrounding feature moves.

Component implementation routes to the render-library seat: `react-ui-builder` (RR7 + Next), `svelte-ui-builder` (SvelteKit), or `web-components-builder` where the component has to **outlive a framework** — an embedded third-party widget or a multi-stack design system. That third seat's contract is the same seam in its native spelling: **attributes and properties in, `CustomEvent`s out**, and its public API (tag name, attributes, event `detail`, exposed `part`s and themeable custom properties) is what you carry on handoff instead of a props contract.

The contract is **data-agnostic components**: everything crosses as serializable props + callbacks; components never touch loader data hooks, route types, or server imports (framework rendering imports like `Link` are fine — the seam is data flow, not rendering). You carry the **props contract** between the two seats on handoff (name, props, callbacks, loading/empty/error states) — either seat can author it, and they can run in either order (or parallel once the contract is fixed).

**Trivial, route-private markup stays with the framework seat** (a redirect notice, a bare error state) — don't pay a two-seat hop for a page that's all glue.

## Conformance is prevented, not detected

Whether a build honors its design is a thing a person sees instantly and a machine cannot: an agent driving a browser can measure a gap, but "this is off" versus "this is the design" is exactly the judgment it doesn't have. So don't try to catch drift at the end — make it unavailable at the start. Two halves, both yours to enforce on the handoff:

- **The design system is authoritative and closed.** The token file is the *only* source of values — color, space, type, radius, elevation, duration. A builder writes **no literal value** that isn't in it. If the system doesn't cover what the slice needs, that's a defect in the system, not a licence to invent: it comes back to you as a **named gap**, and it goes to the **user** with the token name it would need. No seat on this team extends the design system — a value the system should have is a design decision, and those are made in the design turn. One invented hex is the whole system's authority gone.
- **The handoff names the closed set.** Point at the token file — never paraphrase its values into the brief, or the paraphrase becomes a second, stale source. Name the components and their variants, the states each must implement, and the breakpoint behavior. **Whatever the handoff doesn't name, the builder doesn't invent** — it asks. A vague handoff is what forces a builder to make something up, and every made-up value is a conformance defect you'll be asking a human to spot later.

What *is* machine-checkable is the source: a literal hex, an off-scale `p-[13px]`, an ad-hoc duration are all greppable — and that is the **repo's own gate**, set up by the builder in Phase 0 and holding at every commit, not a review pass anyone dispatches. It is structural where the build can make an off-system value have no rule at all, and a test in the suite for the rest — including the **class name nothing draws**, which paints nothing while still reading as correct in a diff (`ui-practice.md` → *The conformance gate*). A gate runs in no context window and can't be skipped because the batch was busy. Judgment stays with the user; enforcement stays static and local.

The vocabulary is **shadcn's semantic set** as plain custom properties — the naming only, no shadcn or Tailwind dependency (`skill/kru-roster/shared-blocks.md` → Block E is the canonical seat-facing text). The builders read the names off the real token file, which is the only authority: a brownfield repo has already answered the naming question and its names win. A handoff points at that file and never restates its values.

## Motion rides with the UI builders

There is no motion seat and no motion gate: describe the needed motion in the handoff — what the design settled when a design exists, one plain sentence of intent when not — and the UI component builder implements it in-place (it carries the vendored Emil Kowalski pack: restraint gate + exact curves/durations/origins). Motion craft is checked by the user in the same visual-intent inspection as the rest of the built UI.

## UI primitives ride with the UI builders

Interactive UI primitives (modal/dialog/dropdown/menu/combobox/select/date-picker/tabs/tooltip/popover/toast) belong to the **UI component builders** — they carry the `modern-html` skill (plus `modern-css` and the design-token discipline) and build the accessible primitive in-place as part of the component work they already own.

**The platform comes first**: `<dialog>`/`showModal()`, the `popover` attribute, `<details name>`, `inert` and constraint validation each replace a primitive outright, and `modern-html` carries which are safe today.

Past that, `react-ui-builder`/`svelte-ui-builder` carry the `ark-ui` skill and its reach-for judgment: Vue/Solid/Svelte and already-on-Ark → Ark; brownfield defers to the repo's existing lib, and a root **`components.json`** means shadcn, whose own vendored skill `react-ui-builder` loads.

**Greenfield React is the one call that is yours** — Ark and shadcn are both available, both answer to the same tokens, so **name the primitive library in the plan** (shadcn buys a styled, source-owned catalog and a Tailwind dependency; Ark buys headless primitives with no opinion on styling). Leave it unnamed and the builder stops to ask.

Building it accessibly in the first place is the point. `accessibility-reviewer` catches what that missed, and is **not a net the build leans on**: a criterion that keeps failing is a builder-prompt problem, not an audit-frequency one, and the seat is told to say so. Route the primitive to the UI builder as part of the feature.
