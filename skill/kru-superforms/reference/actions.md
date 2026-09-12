# The server half — load, action, and what you return

Reproduced against `sveltekit-superforms@2.30.2` / `zod@4.4.3` / `@sveltejs/kit@2.70.2`. The traps live in `SKILL.md`; this file is the shape the code takes once you know them.

## The canonical route

```ts
// +page.server.ts
import { superValidate, message } from 'sveltekit-superforms/server'
import { fail } from 'sveltekit-superforms'            // NOT from /server — see SKILL.md
import { zod4 } from 'sveltekit-superforms/adapters'
import { inviteSchema } from './schema'

export const load = async () => ({
  form: await superValidate(zod4(inviteSchema), { id: 'invite' })
})

export const actions = {
  invite: async (event) => {
    const form = await superValidate(event, zod4(inviteSchema), { strict: true })
    if (!form.valid) return fail(400, { form })

    const created = await db.invite(form.data)          // form.data is the schema's OUTPUT type
    if (!created) return message(form, 'That address is already invited', { status: 409 })

    return message(form, 'Invitation sent')
  }
}
```

Order matters in two places. **`superValidate` before any other read of the body** — it calls `request.formData()` itself, and doing that first makes it rethrow `body already been consumed`. And **`if (!form.valid) return fail` before any side effect**, because `form.data` is fully populated with generated defaults either way; it is not a parsed-or-nothing result.

`superValidate` accepts `RequestEvent | Request | FormData | URL | URLSearchParams | Partial<In> | null`. Anything unrecognized falls through as plain partial data with `posted: false`. So does a body it fails to parse: `tryParseFormData` swallows every error except body-consumed and returns an **empty, unposted form** — a malformed multipart POST arrives looking like a fresh page load rather than an error.

## The return ladder

| Return | Client sees | Notes |
|---|---|---|
| `fail(400, { form })` *(Superforms')* | `valid: false`, errors rendered | Also sets `valid = false` on every nested form object and strips files. SvelteKit's `fail` does neither. |
| `message(form, 'text')` | `{ form }` if valid, **`fail(400, …)` if not** | Status is implicit in `form.valid`. |
| `message(form, 'text', { status: 409 })` | `fail(409, …)` | Any status `>= 400` forces `valid = false`. A status below 400 cannot be sent. |
| `setError(form, 'email', 'Taken')` | field error, `valid: false` | Returns an ActionFailure (`{ status, data }`), so `return` it directly. `setError(form, 'Whole-form problem')` files under `errors._errors`. |
| `redirect(303, '/done')` | navigation | The form object is gone with the page; carry the confirmation in a flash message, not in `message()`. |

`message` and `fail` strip files by default. Pass `{ removeFiles: false }` to `message` only if something downstream can serialize them, which in a normal action it cannot.

## `errors` is suppressed unless the data was posted

`addErrors = options.errors ?? (options.strict ? true : !!parsedData)`. An un-posted form — the `load` call, a `URL`/`URLSearchParams` source, an unparseable body — returns `errors: {}` even when `valid` is `false`, which is why a schema whose generated defaults violate their own constraints looks clean on first render. Pass `{ errors: true }` when you deliberately want the empty form to show its errors up front (a resumed draft, an SPA prefill).

`constraints` is the mirror image: it's attached **only when `posted` is false**. The form returned from a failed action carries none — `superForm` reuses the ones from the initial page data, so this is invisible until something re-derives constraints from the action's return value.

## Multiple forms on one page

```ts
export const load = async () => ({
  loginForm:    await superValidate(zod4(loginSchema),    { id: 'login' }),
  registerForm: await superValidate(zod4(registerSchema), { id: 'register' })
})
```

Ids are mandatory whenever two schemas have the same *shape* (see `SKILL.md`). Each action revalidates only its own:

```ts
login: async (event) => {
  const form = await superValidate(event, zod4(loginSchema), { id: 'login' })
  …
}
```

On the client, give every form but the one being submitted `invalidateAll: false`, and `resetForm: false` on any form whose response carries data to keep. Without `use:enhance`, the id has to travel in the body: `<input type="hidden" name="__superform_id" bind:value={$formId} />`. A posted `__superform_id` **outranks the `id` option** (`parsed.id ?? options.id ?? validator.id`), so a stale hidden field silently retargets the response.

## GET forms (search, filters)

```ts
export const load = async ({ url }) => ({
  form: await superValidate(url, zod4(filterSchema))
})
```

`posted` is forced to `false` for a URL source, so errors stay suppressed and constraints are attached — right for a filter bar, wrong if you wanted the invalid query string called out (`{ errors: true }`).

## Files, end to end

```svelte
<form method="POST" enctype="multipart/form-data" use:enhance>
```

```ts
const form = await superValidate(event, zod4(docSchema))   // allowFiles is ON by default
if (!form.valid) return fail(400, { form })                 // strips the File so this serializes
await store(form.data.doc)
return message(form, 'Uploaded')
```

An untouched file input arrives as `undefined`, not an empty `File` — model it `z.instanceof(File).optional()` unless the upload is genuinely required. `allowFiles: false` strips the file rather than rejecting the request, which surfaces as `expected File, received undefined` on a field the user did fill in.

## Progressive enhancement

Everything above works with JavaScript off — except `dataType: 'json'`, which needs both JS and Superforms' `use:enhance`. A form with nested objects or arrays of objects has no no-JS path; if that matters, flatten the schema instead of reaching for `json`.
