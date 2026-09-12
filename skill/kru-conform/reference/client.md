# The component half

`useForm`, the helpers, and mounting the form in a framework. Classic API on `@conform-to/react@1.21.1`; defaults below are read out of the shipped `dist/`.

## `useForm` options, with their real defaults
| option | default | what it actually does |
|---|---|---|
| `onValidate` | **absent** | `({ formData }) => parseWithZod(formData, { schema })` — the client half of validation |
| `shouldValidate` | `'onSubmit'` | when a field is validated the first time; `'onBlur'` reports as the user leaves it |
| `shouldRevalidate` | same as `shouldValidate` | when an already-validated field re-checks; `'onInput'` clears an error as the user fixes it |
| `lastResult` | — | the `SubmissionResult` the action returned |
| `defaultValue` | — | initial values, in payload shape (`{ user: { name } }`, arrays as arrays) |
| `constraint` | — | `getZodConstraint(schema)` → `required`/`minLength`/`min`/`pattern` on the controls |
| `id` | `useId()` | pass one when two forms must not collide, or when a test needs a stable id |
| `defaultNoValidate` | `true` | `false` keeps native constraint validation for the pre-JS window |
| `shouldDirtyConsider` | — | exclude fields conform doesn't own (CSRF token, framework inputs) from dirty state |
| `onSubmit` | — | called with `(event, { formData, action, method, encType, submission })` — and **not called for intent submissions** |

## The metadata surface
`form`: `id` · `errorId` · `descriptionId` · `errors` · `allErrors` · `valid` · `dirty` · `status` · `noValidate` · `onSubmit` · `getFieldset()` · one method per intent (`form.validate`, `reset`, `update`, `insert`, `remove`, `reorder`), each also carrying `.getButtonProps(payload)`.

`field`: `key` · `id` · `errorId` · `descriptionId` · `name` · `initialValue` · `value` · `defaultValue` · `defaultChecked` · `defaultOptions` · `errors` · `allErrors` · `valid` · `dirty` · `formId` · the constraint attributes · plus `getFieldset()` on an object field and `getFieldList()` on an array field.

`errors` is this field's own; `allErrors` is a map including everything beneath it — the one to read for a summary at the top of the form.

## What the helpers emit, and what they drop
- `getFormProps(form)` → `id`, `onSubmit`, `noValidate`, `aria-describedby` when the form has errors.
- `getInputProps(field, { type })` → `id`, `name`, `form`, `type`, the constraint attributes, and `defaultValue` **only when `initialValue` is a string**. For `type: 'checkbox' | 'radio'` it emits `value` (`'on'` unless you pass one) and `defaultChecked` instead.
- `getSelectProps` / `getTextareaProps` → the same minus type; select maps an array `initialValue` to a `defaultValue` array.
- `getCollectionProps(field, { type, options })` → one props object per option, `id` suffixed per value, a real `key`, and **`required` deliberately omitted for checkboxes** (it would demand every box).
- All of them: `aria-invalid` and `aria-describedby` appear **only when that field currently has errors**, pointing at `field.errorId`.
- `{ value: false }` suppresses `defaultValue`/`defaultChecked` for a control you manage yourself.
- `{ ariaDescribedBy: field.descriptionId }` appends your hint's id; `{ ariaAttributes: false }` opts out entirely; `{ ariaInvalid: 'allErrors' }` marks a fieldset invalid when anything inside it is.

You still owe the elements those ids point at: `<div id={field.errorId}>{field.errors}</div>` rendered whether or not it has content, and `<div id={field.descriptionId}>` for a hint. `aria-describedby` naming a missing id says nothing to a screen reader.

## Where the key goes
```tsx
<input key={fields.title.key} {...getInputProps(fields.title, { type: 'text' })} />
```
Conform regenerates `field.key` on exactly three events — `reset`, `update`, and every list `insert`/`remove`/`reorder` — so a field reachable by none of them needs no key.

## Dynamic lists
```tsx
const items = fields.tags.getFieldList()
{items.map((item, i) => (
  <li key={item.key}>
    <input {...getInputProps(item, { type: 'text' })} />
    <button {...form.remove.getButtonProps({ name: fields.tags.name, index: i })}>Remove</button>
  </li>
))}
<button {...form.insert.getButtonProps({ name: fields.tags.name, defaultValue: '' })}>Add</button>
```
`getButtonProps` renders `name="__intent__" value='{"type":…}' formNoValidate` and works without JS — the action re-renders the list from `submission.reply()`. The imperative `form.insert({ name, defaultValue })` is the same intent dispatched from an event handler; it needs JS. Field names inside a list are `tags[0]`, and the payload keys match, so a hand-written `name` has to use that syntax (`tags[name]` never parses).

**An intent runs before the schema, on both sides.** `insert`/`remove` apply to the payload before validation, and the client applies them whether or not the last result carried errors — so a schema rule cannot stop an Add over rows that were just refused; the schema sees the list *after* the insert. Guard it on the button: an `onClick` that parses the live form, `preventDefault()`s when that list has errors, and calls `form.validate({ name })` so the refusal paints instead of the row appearing.
```tsx
<button {...form.insert.getButtonProps({ name: fields.tags.name, defaultValue: '' })}
  onClick={(e) => {
    const { error } = parseWithZod(new FormData(e.currentTarget.form!), { schema })
    if (Object.keys(error ?? {}).some((k) => k.startsWith(fields.tags.name))) {
      e.preventDefault()
      form.validate({ name: fields.tags.name })
    }
  }}>Add</button>
```

## Custom and UI-library controls
A component that doesn't render a native control (Radix/shadcn `Select`, a combobox, a rich-text editor) needs one anyway — conform reads the DOM.

```tsx
const control = unstable_useControl(fields.role)      // classic; `useControl` in /future has a different signature
<select name={fields.role.name} ref={control.register} defaultValue={fields.role.initialValue} hidden aria-hidden />
<Select value={control.value} onValueChange={control.change} onOpenChange={(open) => !open && control.blur()}>…</Select>
```
The hidden native control must be the **only named control for that field** — if the library also renders one, `FormData` gets two entries and the array coercion turns a string field into an array. `control.change`/`control.blur` are what make `shouldValidate`/`shouldRevalidate` fire at all; without them the field validates only on submit. Forward focus to the visible component so the error-focus pass doesn't land on a hidden node.

## Split components
`useField(name)` and `useFormMetadata()` read from context and **throw `Form context is not available`** without a provider — wrap in `<FormProvider context={form.context}>`. Passing `fields.x` down as a prop needs no provider and is the smaller move; reach for the provider when the child is far enough down that threading it is worse. `<FormStateInput />` (which persists validated-state across no-JS intent round trips, via the reserved `__state__` field) needs the provider too.

## Mounting it
**React Router 7 / Remix** — the action returns `submission.reply()`; the route reads it back with `useActionData()` (or `fetcher.data`) into `lastResult`. Where the route also has loader defaults **and** the action resets, pass `lastResult` only while `navigation.state === 'idle'`: otherwise the form resets to stale loader data before revalidation lands.

**Next.js App Router** — the Server Action's signature is `(prevState, formData)`, and the client half is `useActionState(action, undefined)` from `react`. The integration page still shows `useFormState` from `react-dom`; on React 19 that logs *"ReactDOM.useFormState has been renamed to React.useActionState"*. The schema is imported by both halves, so it lives in its own module, not next to `'use server'`.

**TanStack Start** — a `createServerFn` taking `FormData` runs the same parse-and-reply; feed its returned `SubmissionResult` back as `lastResult`. There's no official conform page for it, so keep the server half in a plain function and let the route call it.

Everything above `useForm` stays ordinary props. The form hook belongs to the route-level component that has `lastResult`; fields below it take `field` metadata (or the provider) — never a second `useForm` for the same form.
