---
name: kru-zod
description: Zod 4 recipes — a `.default()` that never validates its own default, `z.coerce.boolean('false') === true`, `safeParse` throwing on async schemas, `.catch()` that isn't try/catch, transform output nothing checks, and `flatten()` losing which nested field failed. Use when writing or reviewing a Zod schema, a parse boundary, or validation-error plumbing in a repo with `zod` in `package.json`. Zod 4 classic + mini; not Valibot, Yup, or ArkType.
---

**Zod's dangerous failure is not the throw — it's the parse that succeeds.** Every trap below returns a value: an unvalidated default, a coerced truthy string, an unchecked transform output, an error object that can't name the field that failed. Two consequences drive the rest: a schema that parses is not a schema that validated · the type checker proves the shape, never the boundary.

Reproduced on **`zod@4.4.3`** (npm `latest`, 2026-08-04), TypeScript 7.0.2, `strict: true`. Re-verify after a major bump. Pin `zod@^4` rather than installing by dist-tag — `next`/`alpha` resolve to an older major and `beta` is currently behind `latest`.

## `.default()` never validates its own default
The most dangerous line in this skill, because both layers stay quiet.

```js
z.string().min(5).default("ab").parse(undefined)                   // → "ab"  — min(5) never ran
z.string().transform(v => v.length).default(999).parse(undefined)  // → 999   — not a string, no transform
```

`.default()` short-circuits: on `undefined` it returns the value **as-is**, skipping every check and transform on the schema it's attached to. Neither `tsc` nor the parse complains — the default is typed against the schema's *output*, so `999` is legal for a schema that outputs `number`. A default that violates its own constraints ships and reads as validated data forever.

**`.prefault()` is the parse-it variant** — `z.string().min(5).prefault("ab")` throws, which is what you wanted. Reach for `.prefault()` whenever the default is anything but a trivially-conformant literal, and read every `.default()` in a review as an unvalidated constant.

## Coercion is JavaScript coercion, not parsing
`z.coerce.X()` is `X(input)`. The two most common boundaries are therefore wrong by default:

```js
z.coerce.boolean().parse("false")   // → true    — Boolean("false"), a truthy string
z.coerce.boolean().parse("")        // → false
z.coerce.number().parse("")         // → 0       — Number("")
```

Every env var, query param, and checkbox arrives as a string. **`z.stringbool()`** is the schema that reads the word rather than the truthiness: `z.stringbool().parse("false") === false`. Use it for flags; use `z.coerce.number()` only where `"" → 0` is genuinely correct.

At the type level, `z.input<>` of a coerced field is **`unknown`** — so a typed request-payload type gives no compile-time protection on exactly the fields most likely to hold junk.

## `safeParse` throws
Not a figure of speech. A schema carrying an async refinement throws `$ZodAsyncError` out of `safeParse` — it does not return `{ success: false }`:

```js
z.string().refine(async () => true).safeParse("x")   // throws: Encountered Promise during synchronous parse
```

`safeParse` is safe against *invalid data*, never against *a misused schema*. One `async` refinement three levels down turns every sync call site into a throw site, so adding an async check is a change to every caller, not a local edit.

## `.catch()` is not try/catch, and transform output is unchecked
`.catch()` intercepts **ZodErrors only**. An exception thrown inside a `.transform()` goes straight through it:

```js
z.string().transform(() => { throw new Error("boom") }).catch("fallback").parse("x")   // throws boom
```

And a transform's *output* is never validated — `.transform()` is an exit from the schema, not a stage inside it:

```js
z.string().transform(v => ({ bad: v })).parse("x")             // → { bad: "x" }, no complaint
z.string().transform(v => v.length).pipe(z.number().min(10))   // pipe is what re-enters validation
```

`.brand()` is likewise **compile-time only** — a runtime no-op returning the input untouched. It marks a value as checked; it doesn't check it.

## Nested errors lose their field identity through `flatten()`
```js
z.object({ email: z.email(), profile: z.object({ name: z.string().min(1) }) })
  .safeParse({ email: "x", profile: { name: "" } }).error.flatten().fieldErrors
// → { email: [...], profile: ["Too small: expected string to have >=1 characters"] }
```

The key is **`profile`**, not `profile.name` — the inner message is filed under the top-level property, so a form can't route it to the input that failed. `flatten()` is one level deep by design (and deprecated). Use **`z.treeifyError(err)`** when you need the structure, **`z.prettifyError(err)`** for logs (it renders `→ at profile.name`), and read `issue.path` directly when you need the field identity. Details and the customization ladder: `reference/errors.md`.

## Records over enums are exhaustive
`z.record(keySchema, valueSchema)` with an enum key demands **every** key:

```js
z.record(z.enum(["a", "b"]), z.string()).parse({ a: "x" })          // throws — "b" missing
z.partialRecord(z.enum(["a", "b"]), z.string()).parse({ a: "x" })   // ok
```

Deliberate — it's how you force a lookup table to cover its union — and a surprise when the input is a sparse map.

## Generated JSON Schema defaults to the wrong direction
`z.toJSONSchema()` emits the **output** view unless told otherwise, so a `.default()` field comes out `required` — inverted for a request body, where the point of the default is that the client may omit it:

```js
z.toJSONSchema(schema)                   // required: ["a"]  — output view
z.toJSONSchema(schema, { io: "input" })  // not required     — what a request body wants
```

It also **throws** on any transform (`Transforms cannot be represented in JSON Schema`); `{ unrepresentable: "any" }` degrades to `{}` instead of throwing. Pass `io: "input"` for request/param schemas, and keep transforms out of schemas you intend to publish.

## Bundle: `zod/mini` is the real lever
Measured with esbuild (`--bundle --minify --format=esm`), one trivial object schema:

| import | minified |
|---|---|
| `zod` | **70,489 B** |
| `zod/mini` | **10,432 B** |

~6.8× on a schema that does nothing, because the classic method chain isn't tree-shakeable — the methods hang off the schema classes. `zod/mini` trades them for standalone functions (`z.string().check(z.minLength(1))`). Worth it in a Worker, edge middleware, or client bundle; not worth the ergonomic cost on a server. Don't mix the two in one file.

## Consult current docs (official sources first)
`https://zod.dev/llms.txt` (index) and `https://zod.dev/llms-full.txt` (full text) are first-party and v4-native — use them for API surface, Context7 (`zod`) for exact call signatures. Neither tells you which successful parses are lying to you, which is what this file is for. Verify anything version-sensitive against the installed package, not release notes.

## Recipes
Pull the one the task needs, not both.
- `reference/errors.md` — the error-customization precedence ladder, issue shape and paths, `.check()` for multiple issues, when an object-level `.refine()` is skipped, locales, and wiring errors into a form.
- `reference/boundaries.md` — parse recipes per boundary: env vars at boot, form data (the empty-string trap), JSON bodies, search params, and choosing an email/URL pattern deliberately.

## Not this skill's job
- **The TypeScript around the schema** — generics, inference, `satisfies`, `.d.ts`, tsconfig strictness: the **`typescript`** skill. Zod's inference only holds under `strict: true`; that's that skill's floor, not a Zod setting.
- **Drizzle's schema/column types and `drizzle-zod`** — the **`drizzle`** skill. A column type constrains SQL, not input; separate packages, separate concerns.
- **Form-library wiring** (React Hook Form resolvers, Server Action state) — the framework builder's, in the seat that owns the route. This skill ends where the `ZodError` is handed over. **Superforms** picks it up there: the **`superforms`** skill (`skill/kru-superforms/`) owns everything past the adapter, including why a schema that parses cleanly still describes data nobody entered.
- **Which data belongs at which boundary** — a modeling question (`codebase-design`, or the data seats), not a validation one.
- **Valibot / Yup / ArkType / Standard Schema comparisons** — not a decision this skill makes; a repo on Valibot loads the **`valibot`** skill.
