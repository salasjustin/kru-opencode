# Errors — customization, structure, and getting them to a form

All examples verified on `zod@4.4.3`.

## The precedence ladder
Four places can set a message. Verified, most specific wins:

```js
z.string({ error: "schema" }).min(5, { error: "check" }).safeParse("a")   // → "check"
z.string({ error: "schema" }).safeParse(42, { error: () => "parse" })     // → "schema"
z.string().safeParse(42, { error: () => "parse" })                        // → "parse"
```

**per-check → per-schema → per-parse → locale default.** `error` takes a string or a function receiving the issue, so the function form is where dynamic messages and i18n keys go.

Locales are global and swappable — ~40 ship with the package:

```js
z.config(z.locales.fr())
z.string().safeParse(42).error.issues[0].message
// → "Entrée invalide : chaîne attendu, nombre reçu"
```

`z.config()` is process-wide state. Set it once at boot; setting it per-request in a server races across concurrent requests.

## Issue shape
```js
z.object({ a: z.string() }).safeParse({}).error.issues[0]
// { expected: "string", code: "invalid_type", path: ["a"], message: "Invalid input: expected string, received undefined" }
```

`path` is an **array of segments** (`["profile", "name"]`, `["items", 0, "quantity"]`) — the only reliable field identity. `ZodError` extends `Error`, so it survives a `catch` clause and stringifies usefully, but `.issues` is what you read.

Three renderers, one job each:

| call | shape | use for |
|---|---|---|
| `z.prettifyError(err)` | multi-line string, `→ at profile.name` | logs, CLI output, boot failures |
| `z.treeifyError(err)` | nested `{ properties: { … } }` mirroring the schema | walking structure programmatically |
| `err.flatten()` | `{ formErrors, fieldErrors }`, **one level deep** | flat forms only — see `SKILL.md` |

## Multiple issues from one check
`.refine()` reports one issue. `.check()` pushes as many as you like, with paths:

```js
const password = z.string().check(ctx => {
  if (ctx.value.length < 8)      ctx.issues.push({ code: "custom", message: "at least 8 characters", input: ctx.value })
  if (!/[A-Z]/.test(ctx.value))  ctx.issues.push({ code: "custom", message: "needs an uppercase letter", input: ctx.value })
})
```

`input` is required by the types on a pushed issue (the runtime tolerates its absence). Every issue surfaces at once, which is the point — a password field that reveals one rule per submit is four round-trips.

## Checks don't stop at the first failure
All checks on a schema run and report, unlike a short-circuiting chain:

```js
z.string().min(5, "min5").refine(v => /[A-Z]/.test(v), "needs upper").safeParse("ab")
// → ["min5", "needs upper"]
```

`{ abort: true }` on a check stops the ones after it — use it when a later check would be meaningless or would crash on the value that just failed:

```js
z.string().min(5, { error: "min5", abort: true }).refine(v => /[A-Z]/.test(v), "needs upper").safeParse("a")
// → ["min5"] only
```

## When an object-level `.refine()` is skipped
Cross-field validation runs against data whose fields may have already failed — but only up to a point. Verified with `z.object({ a: z.string().min(3), b: z.string() }).refine(d => d.a === d.b, { path: ["b"] })`:

| input | issues |
|---|---|
| `{ a: "x", b: "y" }` — field fails a **check** | both the `min(3)` issue **and** the refinement |
| `{ a: 1, b: "y" }` — field fails its **type** | type issue only; refinement **skipped** |
| `{ b: "y" }` — field **missing** | type issue only; refinement **skipped** |

So a type failure protects the callback (it never sees a number where it expects a string), while a check failure does not (it sees `"x"`, a valid string that's simply too short). Write cross-field callbacks to tolerate values that are well-typed but out of range — and don't count on a cross-field error appearing in the same response as a type error, because it won't.

Always give a cross-field refinement a `path`, or the issue lands on the object root where no input can display it:

```js
.refine(d => d.password === d.confirm, { error: "passwords must match", path: ["confirm"] })
```

## Handing errors to a form
The framework builder owns the wiring; this is the shape to hand over. Group by the joined path so nested fields keep their identity — the thing `flatten()` throws away:

```js
const fieldErrors = {}
for (const issue of result.error.issues) {
  const key = issue.path.join(".") || "_form"      // empty path = object-level issue
  ;(fieldErrors[key] ??= []).push(issue.message)
}
// → { email: [...], "profile.name": [...], _form: [...] }
```

Return `fieldErrors` plus the submitted values. Serializing the error directly doesn't leak the rejected value — `input` is dropped on the way out (verified: absent from `JSON.stringify(issue)` even when explicitly pushed onto a custom issue) — but it does ship internal constraint details (`minimum`, `origin`, regex-shaped messages) to the client, so shape it deliberately rather than forwarding the array.
