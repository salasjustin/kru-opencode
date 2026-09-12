# Errors — the issue shape, routing to a field, and the message ladder

All examples verified on `valibot@1.4.2`. Issues are plain objects in an array — `ValiError.issues` when you `parse`, `result.issues` when you `safeParse` — and every formatter below is a pure function over that array.

## Issue shape
```js
{
  kind: 'validation',            // 'schema' (wrong type) | 'validation' (right type, failed check) | 'transformation'
  type: 'min_length',            // the function that raised it, snake_case
  input: 'ab', expected: '>=5', received: '2',
  message: 'Invalid length: Expected >=5 but received 2',
  requirement: 5,                // the check's argument, when it has one
  path: [{ type: 'object', origin: 'value', input: {...}, key: 'name', value: 'ab' }],   // absent at the root
  issues: [...],                 // union only: the per-branch issues
}
```

`kind: 'schema'` is what `typed: false` means on a result; a `'validation'` issue leaves the result typed. A path item's `input` is the *parent's* input, before that parent's transforms ran — read `value` for what the failing schema saw. `v.getDotPath(issue)` renders the path as `items.1.qty` and returns `null` for a root issue.

## Routing to a field
`v.flatten(issues)` → `{ root?: string[], nested?: Record<dotPath, string[]>, other?: string[] }`. Keys are dot paths, arrays included (`profile.name`, `items.1.qty`), so a form can look up its input's messages directly. Three things land in `root` instead: an object-level `check` with no `forward`, a `union`'s one generic issue (the branch issues are under `issue.issues`, never flattened — use `variant`), and a top-level type mismatch.

```js
const Register = v.pipe(
  v.object({
    email: v.pipe(v.string(), v.email('Enter a valid email')),
    pw:    v.pipe(v.string(), v.minLength(8)),
    pw2:   v.string(),
  }),
  v.forward(v.partialCheck([['pw'], ['pw2']], i => i.pw === i.pw2, 'Passwords do not match'), ['pw2']),
)
v.flatten(v.safeParse(Register, { email: 'x', pw: 'a', pw2: 'b' }).issues)
// → { nested: { email: ['Enter a valid email'], pw2: ['Passwords do not match'] } }
```

`forward` assigns the path; `partialCheck` decides *when* the check runs. Plain `check` runs whenever the object is typed — every entry has the right type — so a failed `email()` on a sibling doesn't stop it, but a missing `pw2` (a type failure) does. `partialCheck` runs when its listed paths are typed, which is what a form wants: the mismatch shows even while `email` is still empty, and doesn't fire on a half-filled form where `pw2` doesn't exist yet. The `forward` path is type-checked against the object's keys.

`v.summarize(issues)` renders `× message\n  → at dot.path` per issue — the log format. For a machine-readable list keep the issues themselves; `flatten` throws away `type`, `requirement`, and `received`.

## The message ladder
Five places can set a message; the most specific wins:

1. the inline argument — `v.string('Required')`, `v.minLength(8, i => \`need ${i.requirement}, got ${i.received}\`)` (a function receives the issue minus `message`)
2. `v.setSpecificMessage(v.string, 'Required')` — one function, every instance
3. `v.setSchemaMessage('Wrong type')` — every **schema** (`string`, `object`, …); actions like `minLength` fall through to the next rung
4. `v.setGlobalMessage('Invalid input')` — everything
5. the built-in English

Each of 2–4 takes a `lang` as its last argument, and `v.parse(schema, input, { lang: 'de' })` selects that language; with no message registered for it, the built-in English is what comes back (the `@valibot/i18n` package registers the translations). The global setters are module state — set them once at boot, and in tests reset with `undefined`.

## Collecting vs aborting
By default every schema entry and every pipe action runs, so one submit reports every problem. `{ abortEarly: true }` stops at the first issue anywhere (one issue for a three-field failure); `{ abortPipeEarly: true }` stops each pipe at its first issue but still visits every entry (one issue per failed field — the form default). Both are config on the `parse` call, or pinned to one schema with `v.config(schema, { abortPipeEarly: true })` so a password field reports its first rule while the rest of the form reports everything. Whatever aborts, transforms after an issue are already skipped — `typed` tells you whether `output` went through them.
