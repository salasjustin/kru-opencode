# The client half — `superForm`, its defaults, and binding

Defaults below are read from `dist/client/superForm.js` in `sveltekit-superforms@2.30.2`, not from the docs page. The traps live in `SKILL.md`.

## Defaults that decide behavior

| Option | Default | What it means in practice |
|---|---|---|
| `validators` | `undefined` | **No client-side validation at all.** You get HTML5 `constraints` and nothing more. |
| `validationMethod` | `'auto'` | Reward early, validate late: `input` for a field that has or had an error, `blur` otherwise. Marks a **pristine** field on blur, before any submit — `SKILL.md` has the ladder. |
| `dataType` | `'form'` | The DOM's fields are posted, not `$form`. Nested objects need `'json'`. |
| `resetForm` | `true` | On a valid result, fields revert to the form the page currently holds. |
| `invalidateAll` | `true` | A successful submit re-runs `load` first. |
| `applyAction` | `true` | The action's result is applied to `page.form`/`page.status`. |
| `taintedMessage` | `false` | No "unsaved changes" prompt unless you ask for one. |
| `clearOnSubmit` | `'message'` | Errors stay on screen through a submit; only the status message clears. |
| `onError` | throws | Without an `onError` handler, a server exception throws in the browser. |
| `multipleSubmits` | `'prevent'` | A second click during a submit is dropped. |
| `delayMs` / `timeoutMs` | `500` / `8000` | When `$delayed` and `$timeout` flip — the two stores a spinner should read, not `$submitting`. |
| `autoFocusOnError` | `'detect'` | Focuses the first error field on non-touch devices. |
| `errorSelector` | `'[aria-invalid="true"],[data-invalid]'` | Mark invalid inputs with one of these or error scrolling finds nothing. |

Setting `legacy: true` (or the v1 build flag) flips `resetForm` to `false` and `taintedMessage` to `true` — the v1 defaults, which is why older tutorials describe the opposite behavior.

**Neither reset path returns to the schema's defaults.** `resetForm` restores the data currently in `data.form`; the `reset()` method restores what `superForm` was constructed with. With `invalidateAll` on (the default) the page reloads before the reset, so an edit form lands on the freshly saved record — the intended pairing. Turn `invalidateAll` off while leaving `resetForm` on and the screen reverts to the stale load data instead.

## Events

`onSubmit` → `onResult` → `onUpdate` → `onUpdated`, with `onChange` firing on any `$form` modification and `onError` on a server exception.

- **`onSubmit({ cancel, jsonData, validators, customRequest })`** — the only place to change what gets sent. Under `dataType: 'json'` the `FormData` you're handed is not what will be posted; call `jsonData(obj)` (it throws unless `dataType` is `'json'`) or mutate `$form`.
- **`onResult({ result, cancel })`** — the raw `ActionResult`. Rarely what you want.
- **`onUpdate({ form, cancel })`** — fires before the stores change, and `form` is mutable: the place to add an error, and the submit handler in SPA mode.
- **`onUpdated({ form })`** — after the stores have changed; read-only. Toasts and redirects go here.

## Proxies

Bind `<input type="number">` and `<input type="date">` through a proxy or the store takes the browser's string.

| Proxy | Use for | Watch |
|---|---|---|
| `intProxy` / `numberProxy` | number fields | Empty or non-numeric input writes **`NaN`**, which logs as `null`. Set `{ empty: 'null' \| 'zero' \| 'undefined' }` to match the schema, and `{ delimiter: ',' }` for comma decimals. |
| `dateProxy` | date/datetime inputs | `{ format: 'date' }` for `<input type="date">`; empty writes an `Invalid Date`. |
| `booleanProxy` | a string that means true/false | The write path is `!!value`, so **every non-empty string is `true`** — never use it for a `true`/`false` `<select>`. |
| `stringProxy` | string fields whose empty value must be `null`/`undefined` | `{ empty: 'null' }` for a `.nullable()` column. |
| `fieldProxy` | any path, no coercion | `set('42')` leaves the string `"42"` in a number field. |
| `arrayProxy` | array fields | `{ path, values, errors, valueErrors }` — `errors` belongs to the array, `valueErrors` to its items. Takes the `SuperForm` object, not a store. |
| `fileProxy` / `filesProxy` | file inputs | Browser-only; on the server they hold an empty object. |

A checkbox binds directly (`bind:checked={$form.agree}`) — no proxy. A `<select>` of primitives binds directly too; a `<select>` whose values are numbers needs `intProxy`.

## Componentizing a form

`superForm` returns stores, so a field component cannot take deconstructed values and re-bind them. Pass the whole object:

```svelte
<!-- TextField.svelte -->
<script lang="ts" module>
  type T = Record<string, unknown>
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import { formFieldProxy, type SuperForm, type FormPathLeaves } from 'sveltekit-superforms'

  let { superform, field, label }: {
    superform: SuperForm<T>
    field: FormPathLeaves<T>
    label: string
  } = $props()

  const { value, errors, constraints } = formFieldProxy(superform, field)
</script>

<label for={field}>{label}</label>
<input id={field} name={field} bind:value={$value}
       aria-invalid={$errors ? 'true' : undefined} {...$constraints} />
{#if $errors}<span class="error">{$errors}</span>{/if}
```

`formFieldProxy` returns `{ path, value, errors, constraints, tainted }` and takes the `SuperForm` object rather than a store — as does `arrayProxy`, while the string/number/date proxies accept either. `FormPathLeaves<T>` restricts `field` to leaf paths — nested objects and arrays are not bindable this way. Everything above the field (layout, labels, submit button, error summary) is ordinary props and stays on the normal component seam.

Passing a whole form to a child component instead: the child calls `superForm(untrack(() => data))`. `superForm` reads its input **once**, so without `untrack` a reactive prop re-runs the constructor, and with it a later prop change never reaches the child. Prefer one `superForm` at the route and pass the object down.

## SPA mode

```ts
const { form, enhance } = superForm(defaults(zod4(schema)), {
  SPA: true,
  validators: zod4Client(schema),
  onUpdate({ form }) {
    if (!form.valid) return
    // the submit handler — call the API here, setError on failure
  }
})
```

`SPA: true` without `validators` logs a warning and validates nothing, since there's no server to do it. `defaults()` builds the form object without a `load` function, and its data is **not validated** — call `validateForm({ update: true })` if the initial errors should show. Client validation is tamper-able by definition; the API still validates.

## Tainted state and snapshots

`isTainted()` / `isTainted('field')` read the `$tainted` store; a successful validation untaints the whole form. Update `$form` without tainting via `form.update(fn, { taint: false })` — needed whenever code, not the user, writes to the form. Password managers filling a login form will taint it, so a "discard changes?" prompt on a login page is a false positive.

`capture` / `restore` wire straight into SvelteKit's snapshot API and preserve the form across back/forward navigation:

```svelte
<script>
  const { form, enhance, capture, restore } = superForm(data.form)
  export const snapshot = { capture, restore }
</script>
```
