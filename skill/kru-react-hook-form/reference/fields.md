# Fields — the component half

The component/UI half of `react-hook-form`. Reproduced on the versions pinned in `SKILL.md`.

## Where a re-render lands
Three subscriptions, and the choice is *which component re-renders*, not whether one does:

| | re-renders | reach for it |
|---|---|---|
| `watch('a')` | the component holding `useForm` — the whole form | a value the form's own markup branches on |
| `watch()` | same, on **every** field's every keystroke (reproduced: 2 renders → 4 across two keystrokes in two fields) | debugging, and little else |
| `useWatch({ control, name: 'a' })` | only the component calling it (reproduced: parent stays at 2, child goes 2 → 3) | a value one child displays |
| `useFormState({ control, name: 'a' })` | only the component calling it (same numbers) | an error or dirty flag one child displays |

Pushing `useWatch`/`useFormState` into a leaf is how a large form stops re-rendering itself per keystroke. Their `formState` is the same Proxy with the same rule — read the property during render or it never subscribes.

## `Controller` — the non-native control
```jsx
<Controller control={control} name="picked" render={({ field, fieldState }) => (
  <MySelect {...field} invalid={fieldState.invalid} />
)} />
```
`field` is `{ name, value, onChange, onBlur, ref }` and `fieldState` is `{ invalid, isDirty, isTouched, isValidating, error }`. Reach for it when the control is not an `<input>` RHF can attach a ref to — a Radix/Ark select, a combobox, a date picker, an editor.

Three things it changes:
- The value lives in RHF only, so a form that also has a native submit path needs an `<input type="hidden">` shadowing it.
- `field.onChange` takes the *value*, not an event — a control that emits an event needs `onChange={e => field.onChange(e.target.value)}`.
- `shouldFocusError` reaches it only through `field.ref`. Forward that ref to a focusable node or a failed submit focuses nothing, and keyboard users land nowhere.

## `useFieldArray`
```jsx
const { fields, append, remove, move } = useFieldArray({ control, name: 'rows' })
fields.map((field, i) => <input key={field.id} {...register(`rows.${i}.v`)} />)
```
- **`key={field.id}`, never `key={index}`.** The `id` is a uuid RHF generates per row and keeps stable across appends (reproduced); an index key makes React reuse the wrong DOM node after a remove, and the user's text lands on a different row.
- The registered path carries the index — `rows.${i}.v` — so a row's inputs re-register on every reorder. That is the design; the `id` is what keeps React's tree aligned through it.
- **Over an array of primitives the field object is the string spread across numeric keys** — `{ "0": "a", id: … }` for `['a', 'b']` (reproduced). Submission is fine, because `register('tags.0')` reads the DOM, but the item is useless as a value: read it from `watch`/`getValues`, and prefer `[{ value }]` objects when the array is more than a rendering detail.
- `fields` is a snapshot for rendering, not live state. Read current values from `getValues('rows')`.

## The accessibility markup you owe
`register` emits no accessibility attributes (`SKILL.md`), so a failed submit leaves the error visible with nothing announcing it. The markup that fixes it:

```jsx
<label htmlFor="email">Email</label>
<input id="email" {...register('email')}
       aria-invalid={!!errors.email}
       aria-describedby={errors.email ? 'email-error' : undefined} />
{errors.email && <p id="email-error" role="alert">{errors.email.message}</p>}
```
Every attribute above is yours: the `id`/`htmlFor` pair, `aria-invalid`, the `aria-describedby` pointing at the message element, and the `role="alert"` that makes a message appearing after submit announce itself.

## `useFormContext`
`useFormContext()` returns **`null`** outside a `<FormProvider>` (reproduced), so the failure is `Cannot destructure property 'register' of null` at the child — not a message naming the missing provider. A field component meant to work both inside and outside a provider takes `control` as a prop instead; one that requires the provider should say so where it fails.

Pass `control` down explicitly for a handful of fields; reach for `FormProvider` when the tree is deep enough that threading it is the larger cost. `useFormContext` re-renders its consumer on the same Proxy rules as `formState`.

## File inputs
`register('doc')` on `<input type="file">` submits the input's **`FileList`** (reproduced), not a `File` — so a schema written against `File` fails on a real upload, and the value wants `files?.[0]` (or `Array.from(files)`) before it reaches one. A `FileList` is also not JSON-serializable: a file that has to survive a failed submit is uploaded on selection and carried as an id.
