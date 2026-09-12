---
name: kru-panda-css
description: Panda CSS recipes — what the build-time extractor can and cannot see (it reads source text, never types), the config recipe whose runtime variant ships a class with no rule, `cx` conflicts resolved by sheet order instead of argument order, the `include` globs that silently skip `app/` and `.svelte`, `strictTokens` as a type-only gate, and the `_dark` condition that only matches `.dark`. Use when writing or reviewing styles in a repo with a `panda.config.*` / `styled-system/` directory, wiring Panda into a build, or debugging a Panda style that renders with no CSS. Not Tailwind, not vanilla-extract, not StyleX.
---

**Panda compiles styles by reading your source as text at build time.** Three consequences drive everything below: only what the extractor can resolve **inside one file, down to a literal**, becomes CSS · `styled-system/` is a generated **artifact**, not source · and nothing here fails loudly — an unextracted style renders as a class name with no rule behind it, and the CLI still prints `Successfully extracted css ✨`.

All claims below reproduced on `@pandacss/dev@1.12.0` unless cited otherwise.

## Version: `latest` is v1, and v2 is a rewrite in beta
As of 2026-08-04, npm `latest` is **1.12.0** (2026-07-29) and panda-css.com documents v1 — no split to work around. The `beta` tag carries **2.0.0-beta.12**: per its own release notes, the compiler hot path is rewritten in **Rust/Oxc**, replacing the `ts-morph` + `ts-evaluator` pipeline, with new bundler packages (`@pandacss/vite`, `@pandacss/webpack`, `@pandacss/rollup`, `@pandacss/typescript-plugin`) and the MCP moved out of the CLI into `@pandacss/mcp` (`panda mcp` / `panda init-mcp` removed). Read `package.json` before writing config: a beta is a deliberate choice with a moving plugin surface, not a default, and v1's integration is the PostCSS plugin (`@pandacss/dev/postcss`) or the CLI.

## What the extractor can see — and what it silently drops
It resolves values **per file**, by evaluating the source, not by reading types. Verified:

| Reaches CSS | Never reaches CSS |
|---|---|
| literals — `css({ color: 'blue.500' })` | a value imported from another module (`css({ color: EXTERNAL })`) |
| a `const` declared in the same file, incl. inside a template literal | a **function parameter** — a union type does not help; types are not read |
| a ternary — **both branches** are emitted (`on ? 'teal.500' : 'orange.500'`) | an indexed lookup, `map[k]` |
| an object declared in the same file and passed to `css(obj, {...})` | anything routed through **your own wrapper** — `const mine = (o) => css(o)` emits nothing |

So the rule at every call site: **the style object is literal, or the value is a variant**. A value that arrives as a prop has exactly three legitimate homes — a recipe variant, a `staticCss` entry, or a CSS variable you set with `style={{ '--x': v }}`. Wrapping `css()` in your own helper is the most common way a codebase turns its entire styling layer into no-ops.

## The one that ships broken: a config recipe with a runtime variant
The asymmetry between the two recipe forms is invisible in the source and decides whether the component has any CSS at all.

- **`cva()` declared in a file** — the extractor reads the *definition* and emits **every variant**. `chip({ look: someProp })` works.
- **A config recipe** (`theme.recipes`, imported from `styled-system/recipes`) — only the variants used **with a literal** anywhere in the codebase are emitted. Reproduced: a recipe with 5 variant values, used once as `btn({ tone: 'primary', size: 'sm' })`, emits `.btn--tone_primary` and `.btn--size_sm` and nothing else. `btn({ tone: 'danger' })` then returns the string `btn btn--tone_danger` — a class with **no rule in the sheet**. No error, no warning, no missing import; the button just renders unstyled.

Pick by where the variant is chosen: **at the call site → config recipe** (smaller CSS, one shared class). **By a prop at runtime → `cva`, or keep the config recipe and safelist it**:

```ts
staticCss: { recipes: { btn: ['*'] } }   // verified: emits all 5 variant rules
```

Same trap, same fix, for any recipe reached through a passthrough prop in a design-system package.

## `cx` does not resolve conflicts — an unrelated file does
`css(a, b)` **merges by property**: `css({color:'red.500'}, {color:'green.500'})` → `c_green.500`, one class, last wins. `cx()` only joins strings — `cx(css({color:'red.500'}), css({color:'green.500'}))` → `"c_red.500 c_green.500"`, both classes live, and the winner is whichever rule the generator wrote **later in the sheet**.

That order is extraction order across your whole codebase. Reproduced: with an unrelated file that happened to use `green.500` present, `.c_green.500` was emitted first and **the first `cx` argument won**; deleting that file — which does not import the component — flipped the sheet order and the last argument won instead. Same component, same call, opposite color.

**Merge style objects (`css(base, override)`, or the `css` prop on `styled` components). Use `cx` only for class strings that don't fight** — a recipe class plus a conditional utility, `cx(btn({tone}), isActive && css({...}))`.

## `include` is the entire contract with your codebase
`panda init` writes `include: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"]`. Everything outside those globs is skipped **silently** — verified with a Next.js App Router `app/page.tsx`: zero utilities emitted, log still reads `Successfully extracted css from 1 file(s) ✨`. The usual casualties: `app/` (App Router), root-level `components/`/`ui/`, and `.svelte` / `.vue` / `.astro` — none of which are in the default extension list.

- Widen `include` before debugging anything else, and **read the file count in the log** — it is the only signal that a directory is being scanned.
- `node_modules` is never scanned. A component library ships its own `styled-system` and both sides set the same `importMap: '@acme/styled-system'` (docs, *Component library* guide), so the app's Panda emits the library's styles; alternatives are shipping a preset, static CSS, or `panda ship --outfile dist/panda.buildinfo.json`.

## An unknown token is not an error — and `strictTokens` is a type-only gate
`css({ color: 'nosuchtoken', padding: '13px' })` emits `.c_nosuchtoken { color: nosuchtoken }` and `.p_13px { padding: 13px }`. The browser drops the first and honors the second, so a typo'd token degrades to "that one component isn't themed."

`strictTokens: true` catches it — **but only through the type-checker**. Verified: with `strictTokens` on, `panda cssgen` emits both rules happily; `tsc --noEmit` is what fails (`Type '"nosuchtoken"' is not assignable to … ColorToken`). So `strictTokens` buys nothing unless typecheck runs in CI, and a deliberate raw value needs the bracket escape hatch — `padding: '[13px]'`.

## `styled-system/` is a build artifact
Two commands, two outputs: **`panda codegen`** writes the JS/TS artifacts (`css`, `recipes`, `tokens`, `jsx`), **`panda cssgen`** (or the PostCSS plugin in the dev loop) writes the CSS. Consequences:

- Gitignore the outdir and add `"prepare": "panda codegen"` (both per the docs) so a fresh clone and CI have artifacts before typecheck.
- **Re-run `codegen` after every config change.** A new token, recipe, or condition does not exist to the type system — or to `styled-system/recipes` — until it does.
- `jsxFramework: 'react' | 'preact' | 'solid' | 'vue' | 'qwik'` is what generates `styled-system/jsx` at all. Without it there is no `styled` factory and no JSX style-prop extraction; with it, `<styled.div bg="surface" fontSize="lg" />` and pattern components extract normally.

## Layers: unlayered CSS beats all of Panda
Output is wrapped in `@layer reset, base, tokens, recipes, utilities` (the declaration ships at the top of the generated sheet). Per the cascade spec, **any unlayered stylesheet outranks every layer regardless of specificity** — so a third-party plain CSS file silently overrides your utilities. Import it into a layer you control (`@import "lib.css" layer(vendor);`) rather than escalating specificity or reaching for `!important`.

Turn it around when *you* are the library: rename Panda's layers so consumers' unlayered app CSS wins predictably, whatever the load order (docs, *Component library* / *Micro-frontends*):

```ts
layers: { recipes: 'ds.recipes', utilities: 'ds.utilities' }   // and `prefix` for multi-version isolation
```

## Dark mode matches `.dark`, not `[data-theme]`
A semantic token's `_dark` value compiles to a `.dark` selector by default. An app toggling `data-theme="dark"` gets **no** theme flip and no warning. Extend the condition to cover both — verified output `:where([data-theme=dark], .dark)`:

```ts
conditions: { extend: { dark: '[data-theme=dark] &, .dark &' } }
```

## Runtime values, done properly
`style={{ '--accent': color }}` plus `css({ color: 'var(--accent)' })` is the sanctioned escape hatch — one static rule, a runtime variable. Reach for the token values via `styled-system/tokens`, and know which one you get: `token('colors.red.500')` returns the **raw value** `#ef4444`, while `token('colors.surface')` (a semantic token) returns `var(--colors-surface)`. Use **`token.var(...)`** when you need the variable either way, and `token(...)` only when you genuinely want the resolved value (a canvas fill, a meta theme-color).

## Consult current docs (official sources first)
Never answer config/API specifics from memory. In priority order:
1. **Panda MCP** — `npx -y @pandacss/mcp`, or `claude mcp add panda -- npx -y @pandacss/mcp`. It answers against **this repo's resolved config**, which no docs page can: `get_tokens`, `get_semantic_tokens`, `get_recipes`, `get_patterns`, `get_conditions`, `get_keyframes`, `get_text_styles`, `get_layer_styles`, `get_animation_styles`, `get_color_palette`, `get_config`, and **`get_usage_report`** (which tokens/recipes are used, unused, or misused — the sweep before you invent a token that already exists).
2. **`llms.txt`** — `https://panda-css.com/llms.txt` indexes per-category files (`/installation`, `/concepts`, `/theming`, `/utilities`, `/customization`, `/guides`, `/references`, `/migration`); `llms-full.txt` is the whole thing.
3. **Context7** (`panda-css`) as the fallback.

State which source you used; if the MCP isn't connected, say so and fall back rather than guessing tool names.

## Not this skill's job
- **Introducing Panda into a repo that already has a styling system** — brownfield matches what's there (Tailwind, CSS modules, vanilla-extract). Flag the mismatch to the lead instead.
- **Which tokens exist** — palette, type scale, spacing, motion are the design's, and they live in the repo's token file; this skill is how they're expressed and why they fail to compile.
- **Native CSS feature safety** (container queries, `:has()`, `@starting-style`) — the `modern-css` skill; Panda emits whatever you write.
- **Accessible interactive primitives** — the `ark-ui` skill. Panda styles them via their `data-*` state attributes.
- **Config/recipe generic typing, `.d.ts`, module augmentation** — the `typescript` skill, in whichever seat owns the code.
