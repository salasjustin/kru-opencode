# The action half

Everything the server does with a Conform submission. Classic API (`@conform-to/react` + `@conform-to/zod/v4`); the future shape is the last section. Values below are reproduced on 1.21.1.

## The action, and its guard ladder
```ts
const submission = parseWithZod(formData, { schema })          // add `async: true` for an async schema
if (submission.status !== 'success') return submission.reply() // covers 'error' AND the intent branch (status undefined)
await write(submission.value)                                  // `value` exists only on this side of the guard
throw redirect('/done')                                        // or: return submission.reply({ resetForm: true })
```
Order inside the guard: **validate, then authorize, then write** — `submission.value` is the first typed thing in the request.

## What each `reply()` produces
| call | result | use |
|---|---|---|
| `reply()` | `{ status, initialValue: <payload>, error, fields }` | the default failure return — re-renders the form with what was typed |
| `reply({ resetForm: true })` | `{ initialValue: null }` — **no `status`, no `error`** | success where the form stays on screen; `initialValue: null` is conform's reset signal |
| `reply({ formErrors: ['…'] })` | adds `error: { '': ['…'] }` | form-level failure (bad credentials) — read back as `form.errors` |
| `reply({ fieldErrors: { email: ['taken'] } })` | merges into `error` under that name | a server-only rule that belongs on one field |
| `reply({ hideFields: ['password'] })` | drops those keys from `initialValue` | every secret the form posts |

`resetForm` and the error options are separate shapes, and passing both is silent: the reply is `{ initialValue: null }` and every error is dropped.

Everything in the result is JSON — `File` values are dropped, `Date` never appears (the payload holds the raw strings). It crosses an RSC boundary and a `json()` response unchanged.

## Intents arrive at the action too
Before hydration, `form.insert.getButtonProps({ name, defaultValue })` is just `<button name="__intent__" value='{"type":"insert","payload":{…}}' formNoValidate>`. Clicking it posts the whole form. What conform does with it server-side, verified:

- **`insert` / `remove` / `reorder`** apply to the payload before validation — `insert` on `tags` returns the payload with the new item appended, `remove` with it gone.
- **`update`** replaces the named path — or, with no `name`, the **entire payload**. It's client-supplied; it decides only what is echoed back, never what you write, because there's no `value` on this branch.
- **`reset`** empties the payload.
- **`validate`** parses and reports errors for the named field.
- An unrecognised `type` is ignored, and the request still returns the intent branch.

So the action's correct response to any of them is `submission.reply()` — the same line the failure branch already returns. Skip it and a no-JS "Add item" click does nothing visible.

`__state__` is the other reserved name — `FormStateInput` writes it, to carry validated-state across those no-JS round trips.

## An async check (uniqueness, a remote call)
`parseWithZod` is synchronous by default and Zod throws `$ZodAsyncError` the moment an async refinement runs under it. Two changes, together:

```ts
// schema.ts — a function of the intent, so the client can skip the half it can't run
export function createSchema(options?: { isEmailUnique: (email: string) => Promise<boolean> }) {
  return z.object({
    email: z.string('Email is required').pipe(
      z.string().superRefine((email, ctx) => {
        if (typeof options?.isEmailUnique !== 'function') {
          // "unknown — ask the server": conform sees error === null and lets the submit through
          ctx.addIssue({ code: 'custom', message: conformZodMessage.VALIDATION_UNDEFINED, fatal: true })
          return
        }
        return options.isEmailUnique(email).then((unique) => {
          if (!unique) ctx.addIssue({ code: 'custom', message: 'Email is already taken' })
        })
      }),
    ),
  })
}

// action
const submission = await parseWithZod(formData, {
  schema: createSchema({ isEmailUnique }),
  async: true,
})
```
The client passes `createSchema()` with no options to `onValidate`. `VALIDATION_UNDEFINED` makes the whole error map `null`, which is the one state where conform stops preventing the default submit; `conformZodMessage.VALIDATION_SKIPPED` is the narrower version — it marks a single field as not-checked-here and keeps the error the last server response gave it.

`await` the parse when `async: true` is set. The return type is a `Promise`, so a missed `await` fails the `status` check silently rather than at the type level only if the result is cast.

## Uploads
- Size and type live in Zod (`z.file().max(5_000_000).mime(['image/png'])`), not in conform.
- The form needs `encType="multipart/form-data"`, and the framework needs its own upload handler for anything large — conform reads whatever `FormData` the request already parsed.
- A failed submit loses the picked file (it's stripped from the reply and browsers won't re-populate a file input). Persist on first receipt and carry an id field if the retry has to keep it.

## Constraints
`getZodConstraint(schema)` is a pure function of the schema — compute it once at module scope, not per request, and pass it to `useForm({ constraint })`. `z.enum` arrives as `pattern: "a|b"` and a regex as a lookahead-wrapped `pattern`. What it produces is the pre-hydration validation layer, so it buys something only with `defaultNoValidate: false` on the client.

## The future server shape
```ts
import { parseSubmission, report } from '@conform-to/react/future'
import { coerceFormValue, formatResult } from '@conform-to/zod/v4/future'

const submission = parseSubmission(formData)                  // { payload, fields, intent } — no value, no status
const result = coerceFormValue(schema).safeParse(submission.payload)
if (!result.success) return report(submission, { error: formatResult(result) })
```
`parseSubmission` does no validation and no coercion — the payload is raw strings, so a schema used without `coerceFormValue` fails every non-string field. `formatResult` returns `null` on success, which is what `report` wants. `report(submission, { hideFields })` mutates the payload the same way `reply` does, and `report(submission, { reset: true })` is the reset signal.
