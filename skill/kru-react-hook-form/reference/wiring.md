# Wiring — the submit boundary

The action/server half of `react-hook-form`. Reproduced on the versions pinned in `SKILL.md`.

## The submit ladder
```jsx
const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
  resolver: zodResolver(Schema),
  defaultValues: { email: '' },      // every field named, or isDirty lies (below)
})

<form onSubmit={handleSubmit(onValid, onInvalid)} noValidate>
```
- **`onValid(data)`** receives the schema's *output*. Awaited — `isSubmitting` is `true` for its whole duration (reproduced: `[isSubmitting, isSubmitSuccessful, submitCount]` goes `[true, false, 0]` → `[false, true, 1]`, so `submitCount` only increments once it settles).
- **`onInvalid(errors)`** is the only place with the errors at the moment of the failure; `formState.errors` read from the same closure is the previous render's, which is `{}` on a first submit.
- **A throw inside `onValid` propagates out of the promise `handleSubmit` returns** and becomes an unhandled rejection — RHF does not turn it into a form error. Catch it and call `setError` yourself.
- `noValidate` on the `<form>` is yours to add. RHF does not set it, so the browser's own bubble fires first on any `required`/`type="email"` attribute you rendered.

## Server errors: field vs root
```js
setError('email', { message: 'Already registered' })   // cleared by the user's next keystroke in that field
setError('root.server', { message: 'Payment declined' }) // survives editing; cleared on the next submit
```
Reproduced, and the difference is the whole design: a field-scoped error is a statement about a value, so it dies when the value changes. A `root.*` error is a statement about the *attempt* — it has no field to re-validate, is absent from the schema, and reads at `errors.root.server`. Use the field path for anything the user can fix by editing, `root` for everything else.

`isSubmitSuccessful` is `false` after a `setError` in `onValid` — the flag tracks the outcome, not whether the handler ran, so `useEffect(() => { if (isSubmitSuccessful) reset() }, …)` does not wipe a form that failed server-side.

## Server actions and progressive enhancement
`handleSubmit` calls `preventDefault()` unconditionally, so `action` and `onSubmit` cannot both work (`SKILL.md`). One boundary:

```jsx
// Next.js App Router — the action is called with RHF's validated data, not FormData
<form onSubmit={handleSubmit(async (data) => {
  const result = await saveUser(data)          // 'use server' action taking a typed object
  if (result?.fieldErrors) for (const [k, m] of Object.entries(result.fieldErrors)) setError(k, { message: m })
  else if (result?.error) setError('root.server', { message: result.error })
})} noValidate>
```
A `'use server'` action takes any serializable argument — it does not have to take `FormData` — so the typed object RHF already produced is the natural payload, and the action re-validates it with the same schema (the client's parse is a UX affordance; the server's is the boundary).

**React Router 7** and **TanStack Start** are the same shape with their own callee: `useSubmit()`/`fetcher.submit(data, { method: 'post', encType: 'application/json' })` in a route module, or a `createServerFn` call in Start. In all three the route's own server side re-validates.

**Where the form must work before hydration**, the native `FormData` path is the only one that survives — and it carries only what the DOM holds, so every `Controller` field needs a `<input type="hidden">` shadowing it, and the server must validate `FormData` on its own terms. RHF's exported `<Form>` component wraps that submission, but the values it posts are still the DOM's. Decide which of the two paths the form is on rather than layering them.

## Async and late-arriving defaults
```js
useForm({ defaultValues: async () => (await fetch(…)).json() })
// formState.isLoading is true while it settles; every input renders EMPTY until it resolves
```
Reproduced. An edit form built this way flashes blank, so gate the fields on `isLoading` rather than letting them render.

For data already being fetched by the route (a loader, a query hook), pass **`values`** instead — it re-syncs on every change, where `defaultValues` is read once at mount:
```js
useForm({ defaultValues: EMPTY, values: data, resetOptions: { keepDirtyValues: true } })
```
`keepDirtyValues` is what stops a background refetch overwriting fields the user is editing (reproduced: without it, a changed `values` replaces the user's text mid-edit). `EMPTY` still names every field — `isDirty` and `dirtyFields` are computed against the defaults, so a field with no default is dirty from its first keystroke and never comes back (reproduced: typing then clearing leaves `isDirty: true` permanently).

## Typing the three generics
```ts
useForm<Input, unknown, Output>({ resolver: zodResolver(Schema) })
```
With a schema that transforms or coerces, `handleSubmit`'s argument is the **output** type and everything else (`getValues`, `watch`, `setValue`, the field paths) is the **input** type. Naming both keeps the action's parameter honest; naming only the first types the handler as the pre-transform shape it isn't. `z.input<typeof Schema>` / `z.output<typeof Schema>` are the two to feed it.

## `trigger` and per-field validation
`trigger()` validates everything and returns a boolean; `trigger('email')` or `trigger(['a', 'b'])` scopes it. This is the multi-step form's gate — validate the current step's fields before advancing, rather than splitting the schema. It writes to `errors` like any other validation run, so a step that fails shows its messages without a submit.
