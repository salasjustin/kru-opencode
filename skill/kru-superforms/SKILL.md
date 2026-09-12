---
name: kru-superforms
description: "Superforms 2 (`sveltekit-superforms`) recipes — the empty POST that returns `valid: true` with `role: \"admin\"`, nested field values discarded while the form still validates, a form id that's a hash of the schema *shape* so login and register collide, number proxies writing `NaN` that logs as `null`, and `withFiles` being literally the same function as `removeFiles`. Use when writing or reviewing a SvelteKit form action, a `superForm` call, or form components in a repo with `sveltekit-superforms` in `package.json`. Superforms v2 on SvelteKit 2; not Formsnap internals, not React Hook Form."
---

**Superforms fills in what the browser didn't send, and then validates what it filled in.** A missing field is not a missing field — it's a generated default that passes. Two consequences drive the rest: `valid: true` is a claim about the *merged* object, never about what the user typed · the client stores hold values (`NaN`, `Invalid Date`, `"42"`) that `JSON.stringify` renders as something else, so SuperDebug shows you a value the form does not have.

Reproduced on **`sveltekit-superforms@2.30.2`** (npm `latest`, 2026-08-04) with `zod@4.4.3`, `@sveltejs/kit@2.70.2`, `svelte@5.56.8`. Re-verify after a major bump.

## An absent field is a default, not an error
The most dangerous line in this skill, because nothing anywhere reports it.

```js
const invite = z.object({
  name: z.string(), role: z.enum(['admin','editor','viewer']),
  active: z.boolean(), quota: z.number()
})
await superValidate(new FormData(), zod4(invite))   // a completely empty POST
// → valid: true, errors: {}, data: { name: "", role: "admin", active: false, quota: 0 }
```

`superValidate` fills every key the request didn't carry from the schema's JSON-Schema type — `string → ""`, `number → 0`, `boolean → false`, `array → []`, **`enum → its first member`** — and validates the merged object. A field the browser never sent is indistinguishable from one submitted blank, so a `disabled` input, an input you forgot to render, a typo'd `name=` attribute, and a bare `curl -X POST` all validate. Order an enum with the privileged value first and the empty POST grants it.

**`strict: true` is the switch that makes absent ≠ default** — the same POST then fails with `expected string, received undefined` on every field. It also breaks every checkbox, since an unchecked box is absent from FormData. The combination that works, verified: `strict: true` on the call **plus `.default(false)` on each boolean** (unchecked → `false`, valid; checked → `true`; a genuinely missing text field → error). Authorization is never the schema's job either way.

## Nested data is discarded, and the form still says valid
```js
const nested = z.object({ user: z.object({ name: z.string() }) })
await superValidate(fd([['user.name', 'bob']]), zod4(nested))
// → valid: true, data: { user: { name: "" } }   — "bob" is gone
```

Both `user.name` and `user[name]` do this. FormData is flat and Superforms does not unflatten it: the posted value is dropped, the generated default takes its place, and the default passes. **`dataType: 'json'`** is the fix — it posts `$form` itself rather than the DOM's fields, and needs JavaScript plus Superforms' own `use:enhance`. Two things change once it's on: `disabled` no longer excludes a field (everything in `$form` is posted), and the init-time guard that throws `Object found in form field "x"` inspects only top-level keys and the **first** element of an array — an array that starts empty clears the check and then silently posts nothing.

Arrays of primitives are the exception that needs nothing: repeated `name=` attributes arrive as `["a","b"]`, and `z.array(z.number())` coerces per element.

## The form id is a hash of the schema shape
```js
superValidate(zod4(z.object({ email: z.email(), password: z.string() })))   // id: 1p3ituu
superValidate(zod4(z.object({ email: z.email(), password: z.string() })))   // id: 1p3ituu
```

Same id — deterministic across processes, and a different variable name is not a different schema. A login and a register form built from structurally identical schemas share an id, so each action's response updates **both**, and `superForm` warns `Duplicate form id's found`. Pass `{ id: 'login' }` to `superValidate`. Then, on every form that isn't the one being submitted, `invalidateAll: false` — a successful submit invalidates the page by default and reloads the others out from under their edits — and `resetForm: false` wherever the response carries data you want kept.

## The client writes `NaN` and logs it as `null`
```js
intProxy(form, 'age').set('')          // → NaN            JSON.stringify → null
numberProxy(form, 'price').set('1,5')  // → 1              parseFloat stops at the comma
booleanProxy(form, 'agree').set('false') // → true         the write path is !!value
dateProxy(form, 'when').set('')        // → Invalid Date   JSON.stringify → null
```

`JSON.stringify(NaN) === 'null'`, so SuperDebug and every log render a `NaN` field as `null` while the server rejects it with `expected number, received NaN` — the field the UI showed as empty. Pass **`{ empty: 'null' | 'zero' | 'undefined' }`** matching what the schema accepts (`empty: 'null'` wants `.nullable()`), and **`{ delimiter: ',' }`** wherever users type comma decimals — `"1,5"` becoming `1` is silent data loss, not an error. Don't reach for `booleanProxy` on a true/false `<select>`: `trueStringValue` is consulted only on the way *out*, the way in is `!!`, so both options write `true`.

Plain `fieldProxy` coerces nothing — `set('42')` leaves the string `"42"` in a `z.number()` field, which is what a `<select>` or a text input hands you.

## `withFiles` is `removeFiles`
`export const removeFiles = withFiles` — verified `withFiles === removeFiles → true`. Both **delete** every `File` in the object. Read `withFiles({ form })` as *strip the files so this can be serialized*, never as *keep them*.

The rest of the return path is similarly implicit:

- **Superforms' `fail(400, { form })`** sets `valid = false` on every form object it finds and strips files. SvelteKit's `fail` does neither, so a form you failed for a business reason still arrives at the client claiming `valid: true`.
- **`message(form, 'text')` returns `{ form }` on a valid form but `fail(400, …)` on an invalid one** — the status is implicit in `form.valid`, and passing `{ status: >= 400 }` forces `valid = false`. It strips files unless `{ removeFiles: false }`.
- **`fail` is exported from `sveltekit-superforms`, not from `sveltekit-superforms/server`** (which does export `message`/`setError`/`withFiles`). The root entry default-exports `SuperDebug.svelte`.

## Files: on by default, and empty means undefined
`allowFiles` defaults to **on** (`options?.allowFiles !== false`), and an empty file input arrives as **`undefined`, not an empty `File`** (`entry.size ? entry : …`) — so `z.instanceof(File)` reports `expected File, received undefined` for a field the user simply left alone; `.optional()` on the field is what you meant. `allowFiles: false` doesn't reject an upload either — it strips the file to `undefined` and lets the schema produce that same confusing error. The form needs `enctype="multipart/form-data"`.

## Stores, not runes — and `superForm` reads its input once
2.30.2 ships **zero `.svelte.js` modules**: `$form`, `$errors`, `$tainted` are Svelte stores, not `$state`. `superForm` reads the object it's given at init and never again, so a parent re-rendering with a fresh `data.form` does not reach the child.

This is the one place the team's data-agnostic-component seam legitimately doesn't hold: a field component takes the whole **`SuperForm<T>` object** plus a `FormPathLeaves<T>` field name and builds its own bindings with `formFieldProxy` — deconstructed stores can't be re-bound. Everything above that (labels, layout, error rendering) stays ordinary props.

## Adapters, and the client validation you don't have
`zod` is the **Zod 3** adapter (`import {} from 'zod/v3'`); **`zod4`** is Zod 4's. Passing a Zod 4 schema to `zod()` throws `SchemaError` naming the fix, so this one fails loudly — the only trap here that does.

**`validators` defaults to `undefined`: there is no client-side validation out of the box.** A schema on the server buys you `constraints` (HTML5 `required`/`minlength`/`min`/`max`/`pattern` on the inputs) and nothing else. Opt in with `validators: zod4Client(schema)`; the `*Client` variants are the smaller build and cannot be swapped dynamically.

Keep `.transform()` out of a form schema: `defaults(zod4(z.object({ n: z.string().transform(v => v.length) })))` returns **`{}`** — no default at all, so `$form.n` is `undefined` and the input binds to nothing. `superValidate` types the form from the schema's *output* while the browser posts its *input*.

## No `validationMethod` gives the ladder
The house ladder is submit-first, then correct-on-change (`ui-patterns` → `forms-and-mutations`), and no single value produces it. `'auto'` marks a **pristine** field invalid on blur, before any submit. `'onsubmit'`/`'submit-only'` skip every input **and** blur event (`dist/client/superForm.js:387`), so a field the user has already corrected stays marked until the next press.

It's two settings, and the second one is a live write:

```js
const superform = superForm(data.form, {
  validationMethod: 'onsubmit',
  onSubmit(input) {
    if (input.submitter?.hasAttribute('formnovalidate')) return  // runs no pass at all
    superform.options.validationMethod = 'oninput'               // options are read per event
  }
})
```

The `formnovalidate` branch is the one that bites: a row-editor's Add/Remove submits without validating, and flipping on the way past leaves the whole form marking on every keystroke.

## Consult current docs (official sources first)
`https://superforms.rocks/` is first-party and v2-native (there is **no `llms.txt`**; the v1 docs live on a separate host and will answer v1 questions as if current). Use it for API surface, Context7 (`sveltekit-superforms`) for exact call signatures. Neither tells you which successful validations are describing data nobody entered, which is what this file is for. Verify anything version-sensitive against the installed package.

## Recipes
Pull the one the task needs, not both.
- `reference/actions.md` — the server half: the canonical action, the return ladder (`message`/`setError`/`fail`/redirect), status codes, multiple forms on a page, GET/query-param forms, and the file round trip.
- `reference/client.md` — `superForm` options with their reproduced defaults, the event order and what each one can cancel, the proxy table, componentization, SPA mode, tainted state, and snapshots.

## Not this skill's job
- **The Zod schema itself** — `.default()` vs `.prefault()`, coercion, transform output, error customization: the **`zod`** skill. This skill starts where the adapter wraps it.
- **Route structure, `load`, and the component seam** — the `sveltekit-builder` / `svelte-ui-builder` seats own those; this skill only marks the one seam exception above.
- **Formsnap / shadcn-svelte form wrappers** — a layer on top with its own API. Check the installed version before answering for it.
- **Authorization** — an enum defaulting to `admin` is a reminder that validation is not a permission check, not an invitation to fix permissions in the schema.
