---
name: kru-valibot
description: Valibot 1.x recipes — `v.is()` over an async schema returning `true` under strict TypeScript, `v.toBoolean()` on `"false"` being `true`, a failed `safeParse` that still carries `output`, and `fallback` swallowing a validation issue into a typed value. Use when writing or reviewing a Valibot schema, a parse boundary, or issue plumbing in a repo with `valibot` in `package.json`. Not Zod, Yup, or ArkType.
---

**Valibot's dangerous failure is the validation that never ran.** Every trap below returns a value: a type guard that says yes to an async schema it never awaited, a coerced truthy string, a fallback that replaced bad data with a typed default, a result whose `output` is populated on failure. Two consequences drive the rest: `success` and `typed` are different flags, and `tsc` is the gate for exactly half of these — the other half compiles clean under `strict`.

Reproduced on **`valibot@1.4.2`** (npm `latest`, 2026-06-28), TypeScript 7.0.2, `strict: true` + `exactOptionalPropertyTypes`, Node 24. Re-verify after a major bump. Version floors inside 1.x: `toNumber`/`toBoolean`/`toDate` need **1.2.0**, `summarize`/`parseJson` **1.1.0**, `exactOptional`/`rfcEmail`/Standard Schema **1.0.0**. A repo below 0.31 is on a different API (`string([email()])` instead of `v.pipe`) — read `package.json` before writing a line. Pin `valibot@^1`; the `beta` dist-tag resolves to `1.0.0-beta.14`, older than `latest`.

## A sync call over an async schema validates nothing
The most dangerous line in this skill, because the type checker only catches part of it.

```js
const S = v.pipeAsync(v.string(), v.checkAsync(async () => false, 'nope'))
v.is(S, 'x')                 // → true       — compiles clean under strict
v.assert(S, 'x')             // no throw     — compiles clean under strict
v.parse(S, 'x')              // → undefined  — tsc rejects this line
v.safeParse(S, 'x')          // → { success: true }, no output — tsc rejects
v.object({ a: S, b: v.string() })   // sync object, async entry: parses { a:'x', b:'y' } to { success: true, output: { b: 'y' } } — key dropped, tsc rejects
v.pipe(v.string(), v.check(async () => false))   // Promise is truthy: always passes — tsc rejects
```

The sync runners see a Promise where they expect a result and read no issues off it. `is`/`assert` accept the async schema at the type level, so a guard in a route handler passes every input and the program keeps its narrowed type. Rule: the `Async` suffix propagates **up** — one `checkAsync` makes its `pipeAsync`, its `objectAsync`, and its `parseAsync` — and `tsc --noEmit` is the gate for the four calls it can see. In a `.js` file or behind an `any`, none of this is caught.

## `toBoolean()` is `Boolean()`, and `toNumber("")` is `0`
```js
v.parse(v.pipe(v.string(), v.toBoolean()), 'false')   // → true   — Boolean('false')
v.parse(v.pipe(v.string(), v.toNumber()), '')          // → 0      — Number('')
v.parse(v.pipe(v.string(), v.toNumber()), '0x10')      // → 16
v.parse(v.pipe(v.string(), v.toNumber()), 'abc')       // throws  — NaN is reported as an issue, the one thing it does catch
```

Every env var, query param, and form field arrives as a string, and `v.pipe(v.string(), v.toBoolean())` is the flag recipe in Valibot's own agent `SKILL.md` — so `FEATURE=false` enables the feature. There is no `stringbool`; the schema that reads the word is `v.pipe(v.picklist(['true', 'false']), v.transform(s => s === 'true'))`. For numbers, put `v.trim()` and `v.nonEmpty()` (and `v.digits()` when only a decimal string is legal) in front of `toNumber()`, so blank and hexadecimal fail instead of parsing. Nothing coerces into `picklist`/`literal`/`number` — `v.picklist([1, 2])` rejects the string `"1"` that every URL and form sends, so list the string forms or transform first.

## A failed `safeParse` still carries `output`
```js
const r = v.safeParse(v.object({ a: v.pipe(v.string(), v.minLength(5)), b: v.pipe(v.string(), v.trim()) }), { a: 'ab', b: '  x  ' })
// → { success: false, typed: true, output: { a: 'ab', b: 'x' }, issues: [...] }
```

`typed` says the shape matched; `success` says every check passed. On a validation failure the result is `typed: true, success: false`, and `output` holds the data with the transforms that did run already applied (`b` is trimmed). It is typed `unknown`, so TS forces a narrow — and `if (r.output)` is the wrong one. Branch on `success`.

## `fallback` swallows the issue and never checks the value
```js
v.parse(v.object({ role: v.fallback(v.picklist(['admin', 'user']), 'user') }), { role: 'admin ' })   // → { role: 'user' }, success
v.parse(v.fallback(v.pipe(v.number(), v.minValue(1)), 0), -5)                                        // → 0 — violates the schema it fell back from
```

`fallback` catches **every** issue on its schema — a type mismatch and a failed `minValue` alike — and returns the fallback unvalidated (the docs say so; the role downgrade above is what it looks like). It is not `try/catch`: an exception thrown inside a `transform` passes straight through it. **`optional(schema, default)` is the safe one** — the default runs through the wrapped pipe, so `v.optional(v.pipe(v.string(), v.minLength(5)), 'ab')` throws on `undefined` instead of shipping `'ab'`. Reach for `optional`/`nullish` for defaults; reach for `fallback` only where "any garbage becomes this value" is the spec, with the value checked by hand.

## Missing, `undefined`, and `null` are three inputs
```js
v.safeParse(v.object({ a: v.optional(v.string()) }), { a: null })      // fails — optional is not nullable
v.safeParse(v.object({ a: v.nullable(v.string()) }), {})              // fails — "Invalid key": nullable doesn't make the key optional
v.safeParse(v.object({ a: v.exactOptional(v.string()) }), { a: undefined })   // fails — present-undefined is not missing
Object.keys(v.parse(v.object({ a: v.optional(v.string()) }), {}))              // → []     — a missing key stays missing in the output
Object.keys(v.parse(v.object({ a: v.optional(v.string()) }), { a: undefined }))// → ['a']
```

Only `optional`, `exactOptional`, and `nullish` mark the key `?:`. A JSON body from a client that serializes empties as `null` needs `nullish`; a database row needs `nullable`; a TS client that omits keys is `optional` (or `exactOptional` under `exactOptionalPropertyTypes`, which is what the type says). The pipe on an `optional` entry does **not** run for a missing key unless a default is given — `v.optional(v.string(), () => undefined)` forces the key into the output.

## Pipes collect validations, skip transforms, and accept a schema mid-stream
```js
v.safeParse(v.pipe(v.string(), v.minLength(5), v.email()), 'ab').issues.length   // → 2 — every validation runs (abortPipeEarly: true for 1)
v.safeParse(v.pipe(v.string(), v.minLength(3), v.transform(s => s.length), v.minValue(10)), 'ab')
// → typed: false, output: 'ab' — after any issue, transforms and later schemas are skipped
v.safeParse(v.pipe(v.string(), v.transform(Number), v.number()), 'abc')          // fails — v.number() mid-pipe rejects NaN; this is how transform output gets checked
v.safeParse(v.pipe(v.string(), v.nonEmpty(), v.trim()), '   ')                   // success, output '' — order: trim first
v.parse(v.pipe(v.number(), v.toMinValue(10)), 3)                                  // → 10 — a "validation" that edits
```

`maxLength` counts UTF-16 units (`'👍🏽'.length` is 4; `maxGraphemes` counts 1). `brand()` is a runtime no-op. The pipe accepts 20 items at the type level and any number at runtime — nest a `pipe` inside a `pipe` rather than lose the check.

## `union` of objects reports "Expected Object but received Object"
```js
v.safeParse(v.union([v.object({ a: v.string() }), v.object({ b: v.number() })]), { a: 1 }).issues[0].message
// → 'Invalid type: Expected Object but received Object' — the real issues sit under .issues, and flatten() files this one under root
```

When both branches match the input's type, `union` returns one generic issue with the branch issues nested. `v.variant('type', [...])` reports at the discriminator's path or the failing field's. Object unions are `variant`; `union` is for genuinely different types.

## `email()` rejects real addresses; `isoDate()` accepts unreal dates
`v.email()` refuses `o'neil@x.com`, `a@localhost`, and a single-letter TLD; `v.rfcEmail()` accepts them; both refuse quoted local parts, IP-literal domains, and non-ASCII. Pick per audience, deliberately. `v.isoDate()` is a format regex — `'2024-02-30'` passes and `v.toDate()` then rolls it to March 1 with no issue. A calendar check is a `v.check` after `toDate` comparing `getUTCDate()` to the parsed day.

## Errors keep their path — until a `check` loses it
`v.flatten(issues).nested` is keyed by dot path — `profile.name`, `items.1.qty` — so a form routes each message to its input with no path-walking of your own. An object-level `v.check` has no path and lands in `root`; `v.forward(check, ['pw2'])` gives it one. `check` runs whenever the object is *typed* — a sibling field's failed `email()` doesn't stop it; `partialCheck([['pw'], ['pw2']], fn)` runs when *its* paths are typed, which is what a form wants. Issue shape, `getDotPath`, `summarize`, the message ladder, `abortEarly`/`config`: `reference/errors.md`.

## JSON Schema throws on the first transform
`toJsonSchema` (from `@valibot/to-json-schema`) throws on any `transform`/`toNumber`/`date()` by default. `errorMode: 'ignore'` converts `v.date()` to `{}` — accept anything — and drops the action it can't express, silently. `typeMode: 'output'` starts from the **last schema in the pipe**, so `v.pipe(v.string(), v.toNumber())` still emits `type: string` until a `v.number()` follows the transform. A defaulted `optional` is never `required` in either mode.

## Bundle: the reason the repo chose it
Measured with esbuild 0.28.2 (`--bundle --minify --format=esm`), one two-field object schema plus a `safeParse` call:

| import | minified |
|---|---|
| `valibot` | **3,014 B** |
| `zod/mini` (4.5.4) | 12,558 B |
| `zod` (4.5.4) | 433,303 B |

A form schema with a pipe per field, a `picklist`, an array, and a forwarded `partialCheck` is 7,249 B. `import * as v from 'valibot'` tree-shakes — the namespace import is the documented form, not a bundle cost.

## Consult current docs (official sources first)
`https://valibot.dev/llms.txt` (index; `llms-full.txt`, `llms-api.txt`) is first-party and every page serves Markdown at `.md`. The MCP server (`claude mcp add --transport http valibot https://valibot.dev/mcp`) answers API lookups in one call. Valibot also publishes an agent `SKILL.md` (`valibot.dev/.well-known/agent-skills/valibot/SKILL.md`) — a Zod-vs-Valibot spelling table worth a glance when Zod habits leak into a pipe, and quickstart otherwise; its flag recipe is the `toBoolean` trap above. Verify anything version-sensitive against the installed package.

## Recipes
Pull the one the task needs, not both.
- `reference/boundaries.md` — a parse recipe per entry point: env vars at boot, form data (`decode-formdata` and what it leaves as `""`), JSON bodies, search params, and the Standard Schema seam into Conform, React Hook Form, Superforms, and TanStack.
- `reference/errors.md` — the issue and path-item shape, `getDotPath`/`flatten`/`summarize`, `forward` + `partialCheck` for cross-field checks, the message ladder and i18n, `abortEarly`/`abortPipeEarly`/`config`.

## Not this skill's job
- **The TypeScript around the schema** — inference, `satisfies`, `exactOptionalPropertyTypes` itself, tsconfig strictness: the **`typescript`** skill. The async gate above only exists under `strict`; that's that skill's floor.
- **Drizzle's column types and `drizzle-valibot`** — the **`drizzle`** skill. A column constrains SQL, not input.
- **Form-library wiring past the adapter** — the **`conform`**, **`react-hook-form`**, and **`superforms`** skills own everything after the schema is handed over. This skill ends at the Standard Schema seam (`reference/boundaries.md`).
- **Which data belongs at which boundary** — a modeling question (`codebase-design`, or the data seats).
- **Zod vs Valibot** — a repo fact, read from `package.json`; a repo on Zod loads the **`zod`** skill.
