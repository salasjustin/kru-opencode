# Drizzle — the pg dialect

Read `SKILL.md` first. Indexing strategy, normalization, and the lock impact of DDL are the `postgres-architect` seat's own discipline — this file is only what the ORM layer changes about them.

## Drivers
0.45.2 ships: `node-postgres` · `postgres-js` · `neon-http` · `neon-serverless` · `vercel-postgres` · `pglite` · `aws-data-api/pg` · `xata-http` · `pg-proxy`.

Long-lived server → `node-postgres` or `postgres-js` over a pool. Serverless/edge with a per-request lifetime → the HTTP driver for that provider (`neon-http`), because a TCP pool that doesn't outlive the invocation is a connection leak, not a pool.

## Transaction-mode poolers break prepared statements
`postgres.js` uses prepared statements by default. Behind a pooler in **transaction** mode (Supabase's pooler, pgBouncer), a prepared statement's lifetime doesn't match the connection it was prepared on, and queries fail in ways that look intermittent:

```js
// transaction-mode pooling can't carry prepared statements across the pool
const client = postgres(process.env.DATABASE_URL, { prepare: false });
const db = drizzle({ client });
```

Two connection strings on the same database (a pooled one for the app, a direct one for migrations) is the normal shape. Point drizzle-kit at the **direct** one — a migration behind a transaction pooler is a bad trade.

## Schema idioms that aren't already deprecated
```ts
export const users = pgTable('users', {
  // identity is the standard-conformant key; serial predates it and still works
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text().notNull(),
  // timestamptz — mode picks what TS sees, withTimezone picks the column type
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  metadata: jsonb().$type<Metadata>(),
}, (table) => [
  index('users_email_idx').on(table.email),
]);
```

- **The third argument returns an array.** The object-returning form is marked `@deprecated` in the shipped `pg-core/table.d.ts` ("will only accept an array instead of an object"). Most material in circulation — including the skills.sh `drizzle-orm` package — still teaches the object form.
- **The column-name string is optional.** `text()` infers `email` from the key. Mixing inferred and explicit names in one table is how a column silently gets the wrong name; pick one convention per project. On 0.45.x, `drizzle({ casing: 'snake_case' })` is the connection-level switch (per-table casing is v1).
- **`timestamp` without `withTimezone` is `timestamp`, not `timestamptz`** — the default is the one you almost never want. `mode: 'string'` avoids the driver's Date parsing when you want the raw value.

## Migrations
The pg migrator (`pg-core/dialect.js`, `migrate()`) does two things worth knowing, both verified at source:

**All pending migrations run inside one transaction.** Good: a mid-batch failure rolls the whole batch back. Two costs:
- A slow migration holds its locks for the duration of every migration in the batch. Deploy migrations one at a time when a statement takes a table lock.
- **`CREATE INDEX CONCURRENTLY` cannot run inside a transaction block** and will error. The zero-downtime index build has to move to a step run outside the migrator — a manual/ops step, not a `drizzle-kit migrate` step. Hand it to the user.

**There is no advisory lock.** The migrator reads the last applied row, then opens its transaction. Two instances booting at once can both read the same state and both try to apply — the loser fails on duplicate DDL, mid-deploy. Run migrations as **one** deploy step, not from every app instance at boot.

## Enums and other types drizzle-kit diffs poorly
`pgEnum` creates a real Postgres type, and altering one is not a plain diff — Postgres only allows adding values (and not inside a transaction, pre-12). Read the generated SQL for any enum change, and reach for a `--custom` migration or a lookup table when the diff looks wrong. The same caution applies to anything drizzle-kit models thinly: RLS policies, generated columns, extensions, partitions, and views. The rule from `SKILL.md` holds hardest here — the SQL is a draft.

## Where the query surface lives
Server-only: `$lib/server/db/*` (SvelteKit) or equivalent, imported only from server modules. Export typed, parameterized query functions; never hand a builder the `db` handle or a raw-SQL escape hatch. See `reference/queries.md` for `sql.raw` and where interpolation becomes injection.
