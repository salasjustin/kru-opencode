# Boundaries — a parse recipe per entry point

All examples verified on `zod@4.4.3`. The shared rule: parse **once**, at the edge, and pass the parsed value inward. A schema applied twice to the same data is a smell — the second call is either dead work or an admission the first one didn't own the boundary.

## Env vars (parse at boot, crash loudly)
Everything is a string, and `undefined` for anything unset. Two traps live here — `z.coerce.boolean()` (see `SKILL.md`) and defaults that never validate.

```js
const Env = z.object({
  PORT:     z.coerce.number().int(),
  DEBUG:    z.stringbool(),                     // not z.coerce.boolean()
  DATABASE_URL: z.url(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).prefault("info"),
})

const parsed = Env.safeParse(process.env)
if (!parsed.success) {
  console.error("bad environment:\n" + z.prettifyError(parsed.error))
  process.exit(1)
}
export const env = parsed.data
```

Verified output when `PORT=abc DEBUG=maybe DATABASE_URL=nope`:

```
✖ Invalid input: expected number, received NaN
  → at PORT
✖ Invalid option: expected one of "true"|"1"|"yes"|"on"|"y"|"enabled"|"false"|"0"|"no"|"off"|"n"|"disabled"
  → at DEBUG
✖ Invalid URL
  → at DATABASE_URL
```

`z.stringbool()`'s defaults already accept `on`/`off`, `yes`/`no`, `enabled`/`disabled` — pass `{ truthy, falsy }` only for a vocabulary it doesn't cover. Note `z.coerce.number()` turns a non-numeric string into `NaN` and reports *expected number, received NaN*, which is the message to expect rather than a parse failure on the string.

## Form data (the empty-string trap)
`FormData` never yields `undefined`. A blank text input is `""`, and a name that wasn't submitted at all is `null` from `.get()` — neither is what `.optional()` handles.

```js
const body = Object.fromEntries(await request.formData())
// { name: "", age: "42", agree: "on" }
```

Verified consequences:

| written | result on `name: ""` |
|---|---|
| `z.string().min(1)` | fails — correct, and the message is the one to customize |
| `z.string().min(1).optional()` | **still fails** — `""` is present, so `.optional()` never applies |
| `z.string().transform(v => v === "" ? undefined : v).pipe(z.string().min(1).optional())` | passes — normalize *then* validate |

`.optional()` guards `undefined`, not emptiness. Normalize `""` to `undefined` in a `.transform()` and `.pipe()` into the real schema — the pipe matters, because a transform's output is otherwise unchecked.

Checkboxes submit `"on"` when ticked and are **absent** when not, so a naive `z.stringbool()` on the raw object fails on the missing key rather than reading `false`:

```js
agree: z.stringbool().prefault("off")     // absent → "off" → false, and the default is parsed
```

## JSON request bodies
`await request.json()` returns `any` — the widest hole in a typed server. Parse it into existence rather than casting it.

```js
const parsed = CreateUser.safeParse(await request.json())
if (!parsed.success) return Response.json({ errors: shape(parsed.error) }, { status: 400 })
```

Pick the unknown-key behavior deliberately — the default is silent removal:

| schema | unknown key `b` |
|---|---|
| `z.object({...})` | **stripped silently** — `{ a: "x" }` |
| `z.strictObject({...})` | rejected: `code: "unrecognized_keys"`, `issue.keys: ["b"]` |
| `z.looseObject({...})` | kept — `{ a: "x", b: 1 }` |

`strictObject` for a request body you control end-to-end (a client sending an unknown field is a version skew you want to hear about); plain `z.object` for third-party payloads that will grow fields without telling you. `z.json()` validates arbitrary JSON-shaped data when you genuinely don't know the shape yet — better than `z.any()`, which asserts nothing.

## Search params
`URLSearchParams` has the same all-strings problem as env, plus repeated keys collapsing under `Object.fromEntries` (last one wins). Coerce explicitly and give every optional param a `.prefault()` so downstream code never branches on `undefined`:

```js
const Query = z.object({
  page:  z.coerce.number().int().min(1).prefault(1),
  q:     z.string().trim().min(1).optional(),
  sort:  z.enum(["new", "top"]).prefault("new"),
})
const { page, q, sort } = Query.parse(Object.fromEntries(url.searchParams))
```

A route library that validates search params for you (TanStack Router's `validateSearch`) accepts the schema directly through Standard Schema and does the `getAll` for repeated keys itself; the coercions stay the same.

Use `.parse()` (not `safeParse`) only where a malformed URL genuinely should 500; for user-facing pages `safeParse` and fall back to defaults, since a hand-edited query string shouldn't be an error page.

## Choose the string pattern deliberately
`z.email()` is not RFC 5322 — it's a deliberately strict default. Verified rejections:

| input | `z.email()` |
|---|---|
| `user+tag@example.com` | accepted |
| `user@localhost` | **rejected** — no TLD |
| `très@example.com` | **rejected** — non-ASCII local part |
| `"quoted local"@example.com` | **rejected** |

`z.regexes` exposes the alternatives — `html5Email`, `browserEmail`, `rfc5322Email`, `unicodeEmail`, `idnEmail` — passed as `z.email({ pattern: z.regexes.rfc5322Email })` (verified to accept the quoted-local address). Match the pattern to the consumer: `html5Email` if the browser already validated it, `unicodeEmail`/`idnEmail` for international users, the default otherwise. `user@localhost` failing is a real dev-environment paper cut worth knowing before it's a bug report.

Numbers have their own edges: `z.number()` **rejects** `Infinity`, and `z.int()` rejects `1.5` — but `z.number()` accepts `2 ** 53`, past safe-integer range, so use `z.int()` for anything that becomes a database id.
