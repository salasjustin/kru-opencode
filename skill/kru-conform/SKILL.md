---
name: kru-conform
description: Conform on React — the `required` message that never fires because `""` is stripped to `undefined` before validation, a `.default()` that turns a cleared field into a silent success, a `reply()` that echoes the submitted password back into the HTML, an intent submission whose `status` is `undefined` and whose `value` doesn't exist, and two parallel APIs (`@conform-to/react` vs `/future`) that the docs teach side by side. Use when writing or reviewing a React form action/server function, a `useForm` call, or form components in a repo with `@conform-to/react` in `package.json`. Conform 1.x with Zod 4; not React Hook Form, not TanStack Form.
---

**Conform's parse deletes; it never invents.** Every empty string becomes `undefined` before the schema sees it, so a blank field fails the *type* check rather than the rule you wrote for it — and any wrapper that tolerates `undefined` (`.optional()`, `.default()`) turns *the user cleared this* into a quiet success. Two consequences drive the rest: the message the user reads is Zod's unless yours sits on the **type constructor** · the server's reply is the **payload echoed back**, and it replaces the form's initial value wholesale — carrying what was typed, including what you'd rather not send back.

Reproduced on **`@conform-to/react@1.21.1`** + **`@conform-to/zod@1.21.1`** (npm `latest`, 2026-08-18) with `zod@4.4.3`, `react@19.2.8`. Re-verify after a minor bump — the `future` half of this package breaks on those by policy.

## Two APIs ship in one package, and the docs teach both
| | classic — `@conform-to/react` | preview — `@conform-to/react/future` |
|---|---|---|
| hook | `const [form, fields] = useForm({ onValidate })` | `const { form, fields } = useForm(schema, { … })` |
| markup | `getFormProps` / `getInputProps` helpers | `form.props`, `fields.x.name` by hand |
| server | `parseWithZod(formData, { schema })` → `submission.reply()` | `parseSubmission(formData)` → `report(submission, { error })` |
| validation | adapter package | any **Standard Schema** (Zod 4, Valibot, ArkType) — coercion still comes from `@conform-to/zod/v4/future` |
| intent field | `__intent__` | `__INTENT__` |
| custom controls | `unstable_useControl(meta)` | `useControl(options)`, `BaseControl` |

The docs say the future APIs "are experimental and may change in minor versions", and they mean it — 1.19.0, 1.20.0 and 1.21.0 each removed or renamed future exports. The trap is that **conform.guide's guide pages already teach the future hooks**: its UI-libraries integration page is written around `useControl` + `control.register`, which classic doesn't export under that name or shape. A snippet copied from a guide page into a classic codebase doesn't compile. Read the imports in an existing form before adding one, keep a repo on one half, and pin the exact version on `future`.

## The adapter path in the examples is the Zod 3 one
`import { parseWithZod } from '@conform-to/zod'` is what most examples show, and it is the **Zod 3** adapter. With `zod@4` installed it dies on import — `SyntaxError: The requested module 'zod' does not provide an export named 'ZodBranded'`, an error that names a Zod 3 internal and not the mistake. Zod 4 → **`@conform-to/zod/v4`**. Zod 3 → `/v3`, spelled explicitly so the next upgrade has to look at it.

## Empty is `undefined`, and half the schema you'd write is written for `""`
```js
parseWithZod(fd([['name','']]), { schema: z.object({ name: z.string().min(1, 'Name is required') }) })
// → error: { name: ['Invalid input: expected string, received undefined'] }   ← not your message
parseWithZod(fd([['name','']]), { schema: z.object({ name: z.string().default('anon') }) })
// → status: 'success', value: { name: 'anon' }                                ← the cleared field, defaulted
```
The message for a *missing* value belongs on the type: `z.string('Name is required')`. `.min(1, …)` only ever speaks about a non-empty string. And `.default()` / `.optional()` are the two wrappers that make blank a success — `.nullable()` isn't one of them (`undefined` is not `null`).

Coercion, as reproduced — it converts strings and falls back to the original string on failure, so a bad value surfaces as a **type** error:

| schema | what passes | what bites |
|---|---|---|
| `z.string()` | anything non-empty | `' '` passes `.min(1)` — add `.trim()` |
| `z.number()` | `Number()` after trim: `' 42 '` → `42`, `'1e3'` → `1000` | `'1,5'` → `NaN` → "expected number, received NaN"; `z.coerce.number()` adds nothing and turns the empty case into that same NaN message |
| `z.boolean()` | **only the literal `'on'`** — the browser's checkbox value | a `<select>` posting `'true'`/`'false'` errors either way; an unchecked box is *absent* → error unless `.default(false)`. Terms-acceptance is `z.literal(true, 'You must accept')` |
| `z.array(...)` | repeated `name=`, or `tags[0]`/`tags[1]` | **absent → `[]`, which validates** — a multi-select with nothing chosen is a silent success until `.min(1)` |
| `z.date()` | `new Date(text)`, so both input types parse | the two frames differ: `<input type="date">` → **UTC** midnight, `<input type="datetime-local">` → midnight **in the server's timezone** (reproduced under `TZ=America/New_York`: `2026-08-21T04:00:00Z`) |
| `z.file()` | a real upload; an empty file input (`name === ''`, `size === 0`) → `undefined` | **`z.instanceof(File)` gets no coercion at all** — the empty `File` reaches the schema and *passes*, so "no file chosen" is a valid submission |
| `z.object({...})` | dotted names: `user.name` | `user[name]` is **dropped from the payload entirely** (silently — the path never parses); an `.optional()` nested object still errors when one leaf is blank |

## The reply is the payload, echoed
```js
parseWithZod(fd([['email','x@y.zz'],['password','hunter2']]), { schema }).reply()
// initialValue: { email: 'x@y.zz', password: 'hunter2' }
// → renders <input type="password" name="password" value="hunter2">
```
The submitted password ships back inside the HTML (and any RSC payload or log of that result). **`reply({ hideFields: ['password'] })`** removes it and keeps the errors — and it does so by **mutating `submission.payload` in place**, so read anything you still need out of the submission before replying.

Two more properties of that echo:

- **`lastResult.initialValue` replaces `defaultValue` wholesale.** A field the browser didn't post — disabled, on another step, on a collapsed tab — renders **empty** after a failed submit, even though `defaultValue` still names it. Edit forms lose the values nobody touched.
- **Files are stripped from the reply.** A picked upload is gone after any failed submit; the user re-picks it. If that's unacceptable, store the upload server-side on first receipt and carry an id field.

## An intent submission has no `status` and no `value`
```js
parseWithZod(fd([...fields, ['__intent__', '{"type":"insert","payload":{"name":"tags"}}']]), { schema })
// → { payload: {...}, error: {} }      status: undefined · value: absent · error EMPTY, not populated
```
`if (submission.status !== 'success') return submission.reply()` is the guard that covers it — and the `Submission` union is written so it's the only one that compiles. A check for `status === 'error'`, or for a non-empty `error`, lets an intent request fall through to the write.

Those requests are real traffic: every `form.insert/remove/reorder/reset/update` button renders as `<button name="__intent__" value='{"type":…}' formNoValidate>`, and before hydration it posts to the action like any other submit. The action's job for one is exactly `reply()` — conform re-renders the list from it.

**A hostile `__intent__` throws out of `parseWithZod`.** `__intent__=x` (or `__state__=x`) is `JSON.parse`d unguarded: a raw `SyntaxError`, a 500, no validation error. Both names are conform's; a field of yours gets another.

## A message keyed to no control has nowhere to report
Conform focuses the first invalid **input element** when a submit fails — it resolves errors through the form's own named controls. A form-level or array-level key (`fields.recipients.errors` on the array itself, the schema's root error) matches no `name` in the form, so the walk passes over it: the press refuses, focuses nothing, scrolls nothing, and reads as a button that did nothing. Where such a message goes instead: `ui-patterns` → `forms-and-mutations`. Where a real control exists but conform can't reach it — a custom select wrapping its own input — that's focus delegation instead: `useInputControl`'s docs carry the hidden-input shape.

## Client validation is opt-in, and so is the native layer
- **No `onValidate` → conform never validates on the client.** It hands the submit straight through, so every message costs a round trip. Wire it: `onValidate({ formData }) { return parseWithZod(formData, { schema }) }`.
- `shouldValidate` defaults to **`'onSubmit'`**, and `shouldRevalidate` mirrors whatever it is. `{ shouldValidate: 'onBlur', shouldRevalidate: 'onInput' }` is the pairing that reports late and clears early.
- **`noValidate` is rendered on the server by default**, so the browser's own constraint validation is off even before hydration. `defaultNoValidate: false` keeps native validation for the pre-JS window and flips it off once conform takes over. Without that, the `required`/`minLength`/`pattern` attributes `getZodConstraint` produces are decoration.
- `getZodConstraint` reads types, not rules: a `.refine()` contributes **nothing**, and every branch of a union comes out `required: false`.

## `key` is typed on the helpers and deleted before they return
`getInputProps` declares `key: string | undefined`, then sets it to `undefined` — which the helper's own `simplify()` strips — so the spread never carries one. Pass **`key={fields.x.key}`** yourself on any field that can be reset, updated, or list-mutated: conform regenerates that key at exactly those moments, and an uncontrolled input only picks up a new `defaultValue` when React remounts it. Without it the input keeps the value the user typed after a reset.

## An async check can't run on the client
`onValidate` must return a `Submission` synchronously, and a schema carrying an async `.refine()` throws Zod's `$ZodAsyncError` ("Encountered Promise during synchronous parse") the moment it's parsed that way. On the server, `parseWithZod(formData, { schema, async: true })` and await it. To keep one schema for both, make it a function of the intent and have the client-side branch raise `conformZodMessage.VALIDATION_UNDEFINED`: that produces `error: null`, which is conform's word for *unknown — ask the server*, and is the one case where it lets the submit through instead of preventing it. Full recipe in `reference/server.md`.

## Consult current docs (official sources first)
`https://conform.guide/` is first-party — there is **no `llms.txt`** (404) — plus Context7 (`@conform-to/react`). Check which half of the API a page is teaching before copying from it; the API Reference is split into current and Future sections, and the integration guides are not. Neither source tells you which passing validations describe data nobody entered, which is what this file is for. Verify anything version-sensitive against the installed package.

## Recipes
Pull the one the task needs, not both.
- `reference/server.md` — the action half: the canonical action and its guard ladder, intents arriving without JS, the two-phase async check, file uploads, constraints, and the future-API server shape.
- `reference/client.md` — `useForm` options with their reproduced defaults, what each helper emits and drops, the accessibility wiring you still owe, dynamic lists, custom/UI-library controls, and the framework mounts (React Router 7 · Next.js · TanStack Start).

## Not this skill's job
- **The Zod schema itself** — `.default()` vs `.prefault()`, transform output, error customization: the **`zod`** skill. This one starts where conform's coercion wraps it.
- **Route structure and the component seam** — the framework builder seats own actions and routes; `react-ui-builder` owns the component boundary. This skill only marks where a form field has to hold the whole field metadata.
- **The future API's full surface** — it's a preview that moves every minor; read its own docs at the version the repo pins.
- **Other adapters and other libraries** — Valibot and Yup ship their own conform packages with their own coercion; React Hook Form and TanStack Form are different stacks entirely.
- **Authorization** — a schema that validates says nothing about who may submit it.
