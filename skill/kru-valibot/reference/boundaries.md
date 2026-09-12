# Boundaries — a parse recipe per entry point

All examples verified on `valibot@1.4.2`. The shared rule: parse **once**, at the edge, and pass the parsed value inward. A schema applied twice to the same data is a smell — the second call is either dead work or an admission the first one didn't own the boundary.

## Env vars (parse at boot, crash loudly)
Everything is a string, and missing for anything unset. The two traps live in the coercion actions — `v.toBoolean()` reads truthiness and `v.toNumber()` reads `""` as `0` (see `SKILL.md`) — so a flag is a `picklist` and a number has `nonEmpty` and `digits` in front of it.

```js
const Env = v.object({
  PORT:         v.pipe(v.string(), v.trim(), v.nonEmpty(), v.digits(), v.toNumber(), v.integer(), v.minValue(1), v.maxValue(65535)),
  DEBUG:        v.optional(v.pipe(v.picklist(['true', 'false']), v.transform(s => s === 'true')), 'false'),  // not toBoolean()
  DATABASE_URL: v.pipe(v.string(), v.url()),
  LOG_LEVEL:    v.optional(v.picklist(['debug', 'info', 'warn', 'error']), 'info'),
})

const parsed = v.safeParse(Env, process.env)
if (!parsed.success) {
  console.error('bad environment:\n' + v.summarize(parsed.issues))   // "× Invalid digits: Received \"\"\n  → at PORT"
  process.exit(1)
}
export const env = parsed.output
```

The `DEBUG` default is the *input* string `'false'`, not the boolean — a default runs through the wrapped pipe (that's what makes `optional`'s default safe), so it has to be something the pipe accepts. `process.env` parses as a plain object. Parse in the module that exports `env`, at import time, so the first request never sees an unvalidated value.

## Form data (what arrives as `""`)
`Object.fromEntries(formData)` keeps the **last** value of a repeated field (`tags=a&tags=b` → `'b'`), keeps an empty text input as `''`, and omits an unchecked checkbox. `decode-formdata` (Fabian Hiller's companion package, `decode(formData, { numbers, booleans, arrays, dates, files })`) fixes the shape — `arrays` become `[]` when absent, `booleans` become `false` — but an empty text input is still `''` and an empty `numbers` field becomes **`null`**:

```js
import { decode } from 'decode-formdata'
decode(fd, { numbers: ['qty'], booleans: ['agree'], arrays: ['tags'] })   // { nick: '', qty: null, agree: true, tags: [] }
```

So `v.optional(v.pipe(v.string(), v.minLength(2)))` on an untouched optional field fails with "Expected >=2 but received 0", and `v.optional(v.number())` fails on `null`. Normalize the blank in the pipe, before the real schema:

```js
const blank = v.transform(s => (s === '' || s === null ? undefined : s))
const Form = v.object({
  nick: v.pipe(v.optional(v.string()), blank, v.optional(v.pipe(v.string(), v.minLength(2)))),
  qty:  v.pipe(v.optional(v.nullable(v.number())), blank, v.optional(v.pipe(v.number(), v.integer()))),
  agree: v.literal(true, 'You must accept the terms'),
})
```

The second `optional` is the schema the field *means*; the first exists so the pipe has something typed to hand to `blank`. `v.safeParse(Form, decode(fd, {...}))` then reports `{}` for an all-blank submit and `nick: 'ab'` for a real one.

Where a form library sits in front of the schema, it owns this normalization and the skill for it owns the rest — Conform strips `''` to `undefined` before the schema sees it; Superforms fills absent fields from the schema; React Hook Form hands the schema the DOM's strings. See *The Standard Schema seam* below.

## JSON request bodies
`await request.json()` is `unknown` until something parses it. The trap is `null`: a client that serializes an empty field as `null` fails `v.optional` (which accepts only `undefined`), and a database row round-tripped through JSON has `null` everywhere the column was nullable.

```js
const Body = v.object({
  title: v.pipe(v.string(), v.trim(), v.nonEmpty(), v.maxLength(200)),
  bio:   v.nullish(v.string()),          // client may omit or send null
  tags:  v.optional(v.array(v.pipe(v.string(), v.nonEmpty())), []),
})

const r = v.safeParse(Body, await request.json())
if (!r.success) return Response.json({ errors: v.flatten(r.issues).nested }, { status: 400 })
```

`v.object` strips unknown keys, so a body with extra fields parses to exactly the entries you named — `looseObject` keeps them, `strictObject` rejects them. Sparse arrays (`[ 'a', , 'b' ]`) fail on the hole. A body that is itself a JSON *string* (a webhook, a queue message) parses with `v.pipe(v.string(), v.parseJson(), Body)`.

## Search params
`URLSearchParams.get` returns `null` for an absent key and `''` for `?q=`; `getAll` is the only way a repeated key survives. Build the object by hand — `Object.fromEntries(searchParams)` has the last-value-wins problem and hands `tag=a&tag=b` to `v.array()` as the string `'b'`.

```js
const Query = v.object({
  page: v.optional(v.pipe(v.string(), v.digits(), v.toNumber(), v.minValue(1)), '1'),   // default is the input form
  tag:  v.optional(v.array(v.string()), []),
  q:    v.optional(v.pipe(v.string(), v.trim(), v.transform(s => s || undefined))),
})
const sp = new URL(request.url).searchParams
const query = v.parse(Query, { page: sp.get('page') ?? undefined, tag: sp.getAll('tag'), q: sp.get('q') ?? undefined })
// ?page=2&tag=a&tag=b&q=   →  { page: 2, tag: ['a', 'b'] }
```

A route library that validates search params for you (TanStack Router's `validateSearch`) accepts the schema directly through Standard Schema and does the `getAll` for repeated keys itself; the pipes stay the same.

## The Standard Schema seam
Every Valibot 1.x schema carries `~standard` (`{ vendor: 'valibot', version: 1, validate }`), and `validate(input)` returns `{ value, typed }` or `{ value, typed, issues }` in Valibot's own issue shape. That is the whole contract a form library needs, so the adapter is one import and the skill for that library owns everything after it:

| library | adapter | then load |
|---|---|---|
| Conform | `@conform-to/valibot` → `parseWithValibot(formData, { schema })` | `conform` |
| React Hook Form | `valibotResolver` from `@hookform/resolvers/valibot`, or `standardSchemaResolver` from `@hookform/resolvers/standard-schema` | `react-hook-form` |
| Superforms | `valibot(schema)` from `sveltekit-superforms/adapters` | `superforms` |
| TanStack Form / Router | pass the schema — both consume Standard Schema directly | — |

The async gate in `SKILL.md` applies through the seam: an `objectAsync` handed to a resolver that calls `~standard.validate` synchronously gets a Promise back where issues were expected — check which adapters await it before making a schema async.

## Choose the string pattern deliberately
`v.email()` is the "common addresses" regex by design — it rejects `o'neil@x.com`, `a@localhost`, and one-letter TLDs; `v.rfcEmail()` accepts those and rejects a 64+-character domain label that `email()` lets through. Both reject quoted local parts, IP-literal domains, and non-ASCII on either side. A signup form for the public wants `rfcEmail` or a deliberately looser `regex`; an internal tool matching a corporate directory wants `email`. `v.url()` accepts anything `new URL()` accepts, `javascript:` included — add `v.startsWith('https://')` when it will be rendered as a link. Date strings: `isoDate` is a format regex (`2024-02-30` passes); add `toDate` then a `check` comparing `getUTCDate()` to the day in the string when the calendar matters.
