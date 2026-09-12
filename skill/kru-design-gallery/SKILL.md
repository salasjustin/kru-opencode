---
name: kru-design-gallery
description: The in-repo component gallery — every component and its states on the app's own dev server, maintained as ordinary app code.
disable-model-invocation: true
argument-hint: "[component or area]"
---

Every component and every state it has, on one page, out of the repo's real parts — with the loop a builder already has: save the file, see it.

## Convention over configuration — the whole design

A preview is a source file that renders one component in the states worth seeing and default-exports it. The gallery finds it by globbing the directory. **Registration is the file existing.**

```tsx
// previews/button.tsx
import { Button } from "@app/ui";

export default () => (
  <>
    <Button variant="primary">Donate</Button>
    <Button variant="primary" disabled>Donate</Button>
    <Button variant="primary" is_loading>Donate</Button>
    <Button variant="primary" icon aria-label="Donate" />
  </>
);
```

```tsx
const previews = import.meta.glob("./previews/*.tsx", { eager: true });
```

A gallery that lists its components in a config has a second place to update, and the list is the half that gets forgotten — so a builder adds a component, ships it, and it is missing from the surface people open to find out what exists. Under convention the add is one file and the removal is a delete. The filename is the label; the import says what it renders.

`import.meta.glob` is Vite's (SvelteKit, React Router 7, TanStack Start). Elsewhere the same move is whatever the stack reads a directory with — the format holds, the glob call is the stack's.

## Stand one up

1. **Put it where the components already live.** Components inside an app get a dev-only route there — `/dev/gallery`, excluded from the production build — inheriting the providers, the stylesheet, the token file, the router and HMR the app already wires, so a preview renders what a screen renders. Components in their own package get a **workspace app** of their own depending on it (`workspace:*`): a package has no dev server, so the gallery is the app that gives it one. The gallery is an app in both branches — the workspace layout picks which branch, not whether.
   A gallery app imports the package's **source** stylesheet entry rather than its built `dist`: under a JIT engine the built sheet holds only the utilities the app already wrote, so a class a preview introduces has no rule and fails silently.
2. **Glob the previews directory** and render each default export under its filename.
3. **Write one preview and open the route.** Done when changing a component shows up in the gallery with no file touched but its own.

The repo's own typecheck and lint already cover it — it is app code.

## What a preview carries

**The states, not the happy variant.** The default render is the one everyone has already seen; a preview earns its line by holding the ones nobody opens — empty, loading, error, disabled, focus, the string long enough to wrap, the list of one. Shipping only the primary variant tells the next reader the other states are fine when nobody has looked.

Sample data is a literal in the file: it reads at a glance and it diffs.

Three things a screen gives a component for free, which a preview supplies itself:

- **Explicit size** for anything with no intrinsic one — loaders, rings and image placeholders render invisible without it.
- **An open state** for overlays. A control holding its own open state is driven by the preview; one taking `open` is passed it.
- **Its context** — a component reaching for a router or a theme provider needs one wrapped around it. The in-app route supplies this, which is why it is step 1.

`fixed` resolves against the cell the gallery lays out rather than the viewport, so a corner-anchored element lands at the cell's corner. Compose around it.

## Keep it true

**The preview lands in the same slice as the component.** A gallery is worth opening while it is complete; a lagging one answers *what does this system have* wrongly, which is worse than not answering.

## Owned elsewhere

- **Rendered routes** — the states and widths of the running app, and the `file:line` behind a defect: `/kru/visual-review`.
- **Whether a value is on-system** — the repo's conformance gate, at every commit.
- **Publishing to people who don't write code** — there is no surface for it in this fork (`lead` → `{KRU_HOME}/kru/references/ui-practice.md`); the gallery on the dev server is what a non-coder reads.
- **Whether the design is any good** — the user's glance.
