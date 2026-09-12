# create — the shape, at bootstrap

Runs on an empty tree: no components, no token file, and a conventions corpus that deliberately names no hue, face or layout. What lands is every decision Phase 0 would otherwise take one component at a time.

## Influences shape the set

An influence supplies a **step count and step semantics**. [Radix's scale composition](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) is the reference shape for exactly this and is the colour default; the user names others (`--palette radix`, or a URL). Take the structure and hand the values back — a step count is not a hue.

Defaults when nothing is named, each because it is the cheapest thing to expand later:

- **12 colour steps** — the smallest ramp separating border-at-rest from border-at-hover without a `color-mix()`.
- **A named modular type ratio**, steps enumerated.
- **A 4px base**, the five ladders separate from step one.
- **4 elevation levels**, and the bundle each binds.
- **3 durations × 3 easings**, and the named transitions binding them.

## What lands

**1. `design-system.ts`** — the authored source, and the one place a value is ever written. The rule is **data, not a comment**, which is what makes it checkable: an emitter reading `role` can assert `semantic.border` points inside it.

```ts
export const UNSET = Symbol.for("ds.unset");

export const color = {
  steps: 12,
  role: { appBg: [1, 2], componentBg: [3, 5], border: [6, 8],
          solid: 9, solidHover: 10, text: 11, textStrong: 12 },
  ramps: { neutral: UNSET, accent: UNSET, danger: UNSET },  // 12 values each — the design's
} as const;

export const semantic = {
  background: ["neutral", 1],   foreground:        ["neutral", 12],
  muted:      ["neutral", 3],   mutedForeground:   ["neutral", 11],
  border:     ["neutral", 6],   ring:              ["accent",  8],
  primary:    ["accent",  9],   primaryForeground: ["accent",  "contrast"],
} as const;
```

**2. The token file** — emitted, committed, at the destination the app's own style layer uses. Semantic tokens alias their ramp step rather than copying it, so the mapping stays legible in the shipped file:

```css
/* generated from design-system.ts — edit that, then run the emit script */
:root {
  --unset: magenta;              /* 47 unfilled — delete this line when it reaches 0 */
  --neutral-1: var(--unset);
  --border:  var(--neutral-6);
  --primary: var(--accent-9);
}
```

**3. `design-system.md`** — the parts half: `## Primitives` and `## Shells` as element × state rows, above the `## Elements` ledger `ui-designer` fills from the screen inventory.

## The `UNSET` sentinel earns three things

A real value rather than an omission, because an empty custom property is invalid at computed-value time and fails **silently** — the one failure mode this bootstrap cannot afford.

- It **screams on screen**, so nothing ships half-filled.
- `grep -c 'var(--unset)'` is the bootstrap progress bar.
- Deleting its one declaration at the end **proves** completeness: anything still referencing it breaks loudly.

## Two scripts, and the second is why the source is TS

Emit regenerates the token file. **Check** emits to memory and diffs the committed file, wired into the repo's own runner so a hand-edit turns the suite red at the next commit. Name both by the repo's script convention and add them in the same slice — a generator without its check is a second place to author values wearing a costume, and the first hotfix typed straight into the token file proves it.

The token file is a build product now, so the generated header names `design-system.ts` as the file to edit and the return says the same. That header is the only thing standing between the next reader and a hand-edit.

## Done when

Every one of the seven foundations has a **set** and a **rule** in `design-system.ts`; emit and check both run green in the repo's runner; every influence the user named is recorded with the half of it that was declined; and the return states the unfilled count and the token names the design has yet to settle.
