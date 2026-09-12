---
name: kru-react-hook-form
description: "React Hook Form on React — a submit button that can never enable because `!isDirty || !isValid` short-circuits before the Proxy subscribes, `<input type=\"number\">` submitting the string `\"42\"`, two same-named checkboxes submitting `false` where the schema expects `[]`, `register('x', { disabled: true })` dropping the key from the payload entirely, and `handleSubmit` calling `preventDefault()` so a `<form action={serverAction}>` never runs. Use when writing or reviewing a React form, a `useForm` call, or form components in a repo with `react-hook-form` in `package.json`. RHF 7.x with Zod 4 via `@hookform/resolvers`; not Conform, not TanStack Form."
---

**RHF keeps the form outside React, and everything it does for you is an opt-in.** A `formState` property re-renders only if render *read* it — the Proxy tracks what it saw. A field arrives as the string the DOM held unless the registration asked for a conversion. And the values RHF holds are not the values the browser posts, so `FormData`, `getValues()` and the object your handler receives are three different objects. Every failure below is one missed opt-in, and none of them throw.

Reproduced on **`react-hook-form@7.87.0`** + **`@hookform/resolvers@5.9.1`** (npm `latest`, 2026-09-03) with `zod@4.5.4`, `react@19.2.8`. Re-verify after a minor bump.

## The Proxy tracks only what render read
```jsx
<button disabled={!formState.isDirty || !formState.isValid} />
// pristine → isDirty is false → || short-circuits → isValid is never read
// → never subscribed → the button stays disabled forever, however valid the form becomes
const { isDirty, isValid } = formState        // both read, both subscribed
```
Reproduced: after typing a valid value into a `mode: 'onChange'` form, the short-circuit button is still `disabled` and the destructured one enables. The rule reaches past `||` — a component that reads **no** `formState` property during render re-renders **zero** times across two keystrokes, so the error markup under the input never appears at all. Read every property you branch on, unconditionally, at the top of render.

**Subscribing to `isValid` is also what makes it track under the default `mode: 'onSubmit'`, and it isn't free.** Reading it turns validation on: over mount plus two keystrokes the resolver ran **0** times unread and **3** times read — the whole schema, every keystroke, in a form whose `mode` says otherwise. That's the price of a live-enabling button; a form that reports on submit shouldn't pay it.

## Every value arrives as the DOM held it
`register` attaches to a real input and reads `.value` — a string — unless the registration asks for something else.

| field | what submits | what bites |
|---|---|---|
| `<input type="number">` | the string `"42"` | a `z.number()` reports **`expected number, received string`**, naming the schema instead of the missing `valueAsNumber` |
| `register('n', { valueAsNumber: true })` | `42` | an **empty** input gives `NaN`, which `JSON.stringify` writes as `null` — a required-number check that tests for `null`/`undefined` misses it |
| `register('d', { valueAsDate: true })` | a `Date` | `<input type="date">` parses as **UTC** midnight (`2026-08-21T00:00:00.000Z`) |
| `<input type="checkbox">` | `true` / `false` | — |
| one checkbox with `value="a"` | `"a"` when checked, **`false`** when not | the field's *type* flips between string and boolean |
| two checkboxes sharing a name | `["x"]` when one is checked, **`false`** when none are | a `z.array(z.string())` gets `false`, not `[]` — the empty multi-select is the case nobody tests |
| `register('x', { disabled: true })` | **the key is absent from the payload** | a PATCH built by spreading that object silently stops sending the field. A plain `disabled` attribute on the input keeps the value |

Dotted names build structure rather than keys: `register('user.name')` submits `{ user: { name } }` and `register('tags.0')` submits an **array**. A field whose real key contains a dot has no spelling here.

## The resolver's output is not the form's values
```js
// schema: { t: z.string().transform(s => s.length) }, user typed "abcd"
handleSubmit(data => …)   // → { t: 4 }        the schema's OUTPUT
getValues()               // → { t: 'abcd' }   the form's INPUT, unchanged
```
Everything on screen — `getValues`, `watch`, `useWatch`, the DOM — stays on the input side; only the handler's argument is transformed. Type the hook to match with `useForm<Input, unknown, Output>`, or the argument lies about itself.

**Coercion in the schema hides the empty field instead of catching it.** `z.coerce.number()` over a blank input is `Number('') === 0`: reproduced, an all-empty form validated clean as `{ n: 0, s: '', b: false }`. A required number wants `valueAsNumber` plus a plain `z.number()`, so blank arrives as `NaN` and fails, rather than arriving as a plausible zero.

`zodResolver` from `@hookform/resolvers/zod` covers Zod 3 and Zod 4 from one export — it detects v4 by the schema's `_zod` property, so there is no version-suffixed import path to choose.

## RHF's values and the browser's `FormData` are different sets
**`shouldUnregister` defaults to `false`, so unmounting a field keeps its value.** A conditional field the user filled and then hid still ships:
```js
// user types into a field behind a toggle, then flips the toggle off
{ show: false, secret: 'typed-then-hidden' }   // the input is gone from the DOM; the value is not gone from the payload
```
That default is what lets a multi-step form keep step 1 while step 2 renders — it is only a leak when the hidden branch is meant to be *dropped*, which is a per-form call: `shouldUnregister: true` on the form, or clear the field in the same handler that hides it.

The mirror image, reproduced: a `Controller`-managed value never reaches the browser's own `FormData`, because no named input carries it.

## A server action and `handleSubmit` cancel each other
```jsx
<form action={serverAction} onSubmit={handleSubmit(onValid)}>
// reproduced: onValid ran, serverAction fired 0 times
```
`handleSubmit` calls `preventDefault()` on every submit before anything else, and React reads that as the submission being handled — so the action never runs, validation passes, and nothing is saved. Dropping `onSubmit` runs the action but skips RHF entirely, and hands it a `FormData` missing every `Controller` field.

Wire one boundary, not two: keep `onSubmit={handleSubmit(...)}` and call the action **inside** the valid handler with RHF's data. `reference/wiring.md` has that shape per framework, plus the progressive-enhancement variant for a form that must work before hydration.

## `setValue` is silent by default
```js
setValue('a', 'x')
// → isDirty false · touchedFields {} · errors {} — even under mode: 'onChange'
```
The DOM updates and nothing else does, so a value written by a date picker, an autocomplete, or a "copy billing address" button leaves the form reading pristine and valid. An unsaved-changes guard on `isDirty` never fires for it. Pass what you need: `{ shouldDirty: true, shouldValidate: true, shouldTouch: true }`.

## `defaultValues` are captured at mount
`reset()` with no argument returns to the values `useForm` was given on its **first** render — reproduced, a field loaded afterwards by `setValue` reverts to the mount-time default. For data that arrives late, pass **`values`** instead: it re-syncs whenever it changes, and `resetOptions: { keepDirtyValues: true }` is what stops an in-flight refetch overwriting what the user is typing (without it, reproduced, the user's text is replaced).

## Read errors from the handler's argument
```js
handleSubmit(onValid, (errors) => { … })
// errors        → { name: … }   populated
// formState.errors in the same closure → {}   the render that built the closure had none
```
`criteriaMode` defaults to `'firstError'`, so `errors.x.types` is `undefined` and only one rule per field is reported; `'all'` populates `types` (`{ too_small: …, invalid_format: … }`) while `message` stays the first. A password field listing every unmet rule needs it. `valibotResolver` is stricter about it: it passes `abortPipeEarly: true` unless `criteriaMode` is `'all'`, so only the first failing `v.check`/`v.partialCheck` in a pipe reports — a test asserting two errors off one submit fails until the mode is set, or leaves one field invalid per submission (reproduced on `@hookform/resolvers@3.9.0`).

## Spread `register` first
```jsx
<input {...register('a')} onChange={mine} />   // clobbers RHF's onChange → submits ""
<input onChange={mine} {...register('b')} />   // RHF wins; `mine` never runs
```
The first form validates and submits happily with an empty string for a field the user filled. A field that needs both behaviours calls its own work from inside the registered handler: `const { onChange, ...rest } = register('a')`.

## The accessibility attributes are yours to write
`register` returns `{ name, onChange, onBlur, ref }` — all of it, with or without `shouldUseNativeValidation` — so after a failed submit the input carries only its `name` and whatever `id` you gave it. Every attribute that tells a screen reader the field is in error is yours, pointed at the `id` of the element rendering the message; `reference/fields.md` has the markup. RHF focuses the first errored field on a failed submit (`shouldFocusError`, default on).

`reValidateMode` defaults to `'onChange'`, so once a submit has failed the errors clear as the user types — that path needs nothing from you.

## Consult current docs (official sources first)
`https://react-hook-form.com/docs` is first-party — there is **no `llms.txt`** (404) — plus Context7 (`/react-hook-form/documentation`, and `/react-hook-form/resolvers` for the adapter). The API pages are accurate about shapes and quiet about cost: they document the Proxy subscription rule without the render counts, and `isValid`'s relationship to `mode` without the validation runs that subscribing turns on. Reproduce anything version-sensitive against the installed package.

## Recipes
Pull the one the task needs, not both.
- `reference/wiring.md` — the boundary half: the submit ladder, server actions and progressive enhancement per framework, async defaults and `isLoading`, resolver setup and typing the three generics, `trigger`/`setError`/server-side errors.
- `reference/fields.md` — the component half: `useFieldArray`, `Controller` and non-native controls, the accessibility markup `register` leaves to you, `watch` vs `useWatch` and where re-renders land, `useFormContext`, and file inputs.

## Not this skill's job
- **The Zod schema itself** — `.default()` vs `.prefault()`, transform output, error customization: the **`zod`** skill. This one starts where the resolver hands the result over.
- **Route structure and the component seam** — the framework builder seats own actions, routes and server functions; `react-ui-builder` owns the component boundary. This skill marks only where a field's wiring dictates the props.
- **Other resolvers** — Yup, ArkType and the rest ship their own adapters with their own coercion. Valibot's has the one row above, because its failure reads as a `criteriaMode` bug.
- **Other form libraries** — Conform and TanStack Form are different stacks; a repo on one of them has that skill's row instead.
- **Authorization** — a form that validates says nothing about who may submit it.
