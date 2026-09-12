---
name: kru-drizzle
description: Drizzle ORM recipes for the Postgres and SQLite dialects — the version split between what npm installs and what orm.drizzle.team documents, reading the SQL `drizzle-kit generate` writes before it ships (its SQLite table rebuild deletes child rows), `generate`+`migrate` vs `push`, the connection settings Drizzle does not set for you, and relational queries vs joins. Use when writing or reviewing a Drizzle schema, a drizzle-kit migration, or a query built with Drizzle, in either the pg or sqlite dialect. Not MySQL, not Prisma.
---

**Drizzle is a typed SQL builder with a migration generator attached — not a database, and not a safety net.** Three consequences drive everything below: the SQL in `drizzle/` is a *draft the generator wrote*, not a reviewed migration · Drizzle owns neither the connection nor its settings · the types prove a query compiles, never that it is correct against the rows already in the table.

## First: check the installed version — the docs are ahead of npm
As of 2026-07-29, `npm i drizzle-orm` does **not** install what orm.drizzle.team shows you by default.

| | installed by `latest` | documented on the site |
|---|---|---|
| `drizzle-orm` | **0.45.2** (2026-03-27) | **1.0** (`1.0.0-rc.4`, 2026-06-27) |
| `drizzle-kit` | **0.31.10** | 1.0 rc |

Read `package.json` before writing a line. On 0.45.x, these v1 APIs **do not exist** — verified against the shipped package, not release notes:

- **`defineRelations`** is not exported, and `drizzle-orm/_relations` does not resolve. Relations are per-table `relations(table, ({ one, many }) => …)`, passed as `drizzle(client, { schema })`. The site's relations page documents the v2 shape only.
- **`db.query` filters take callbacks**, not objects — `where: (t, { eq }) => eq(t.id, 1)`, not `where: { id: 1 }`.
- `getTableColumns`, not `getColumns` · `.array().array()`, not `.array('[][]')` · `.enableRLS()`, not `pgTable.withRLS()` · `drizzle({ casing })`, not per-table casing · validators are the separate `drizzle-zod`/`drizzle-valibot` packages, not `drizzle-orm/zod`.

Writing v1 code against 0.45 fails at import. Writing 0.45 code and pasting a v1 doc snippet beside it is the likelier accident — it type-checks in isolation and breaks at the seam. If a project wants v1, that is a deliberate upgrade to an **RC**, with the migration-folder format change (v3, no `_journal.json`) attached — not a default.

## The generated SQL is a draft — read it before it ships
`drizzle-kit generate` diffs two snapshots and emits SQL. It does not know what data is in the table, so it cannot know which of its statements is destructive. Three failures that survive review only because nobody opened the `.sql` file:

**A constraint change with existing rows aborts the migration.** Adding `.notNull().default(0)` to a populated nullable column generates `INSERT INTO __new_users(...) SELECT ... FROM users` — the `SELECT` copies the existing `NULL` straight into the new `NOT NULL` column and the column default never applies. Verified: the migration throws on that statement and rolls back. Backfill first, in a separate `drizzle-kit generate --custom` migration, *then* add the constraint.

**Renames are guesses.** A dropped column plus an added column looks identical to a rename in a snapshot diff; the CLI asks, and a wrong answer is a `DROP COLUMN` on live data. Answer it deliberately, and never let it run unattended in CI.

**The sqlite rebuild can `SELECT` a column the old table doesn't have.** Adding a column alongside a rebuild-forcing change (`drizzle-kit@0.31.x`) can emit a copy step that selects the *new* column from the old table — better-sqlite3 fails with `no such column`; under SQLite's double-quoted-string misfeature the literal column name is silently written into every row instead. Prefer a hand-written `ADD COLUMN` migration, and keep a guard test that fails when a generated migration contains an unasked-for rebuild.

**Reviewed means every statement in the file is named** — safe, or destructive and with the rows it touches said out loud. A file skimmed for the statement you expected is a file not read.

## SQLite: the generated table rebuild deletes child rows
The single most dangerous interaction in this skill, verified end-to-end and not covered by any community source.

Any SQLite change `ALTER TABLE` can't do (a constraint, a type, a check) makes drizzle-kit emit the create-copy-drop-rename rebuild, wrapped in its own pragma toggle:

```sql
PRAGMA foreign_keys=OFF;                  -- a no-op where the migrator puts it
CREATE TABLE `__new_users` (...);
INSERT INTO `__new_users`(...) SELECT ... FROM `users`;
DROP TABLE `users`;                       -- cascades to children, because FKs are still on
ALTER TABLE `__new_users` RENAME TO `users`;
PRAGMA foreign_keys=ON;
```

The migrator runs every statement of the file inside `BEGIN … COMMIT` (`drizzle-orm/sqlite-core/dialect.js`, `migrate()`). **`PRAGMA foreign_keys` is a no-op inside a transaction** — so foreign keys are live during the `DROP TABLE`, and every child row with `ON DELETE CASCADE` is deleted. Reproduced on `drizzle-orm@0.45.2` / `drizzle-kit@0.31.10`: 3 child rows before the migration, **0 after**, migration reported success, and `PRAGMA foreign_key_check` came back clean afterwards because the cascade removed the evidence.

It fires precisely when the connection is set up correctly — `foreign_keys = ON` is mandatory (see the `sqlite` skill) and is what arms the cascade. Drizzle also never emits step 11 of the official rebuild, `PRAGMA foreign_key_check` before the commit.

**The fix — toggle the pragma on the connection, outside the transaction, around the migrator:**

```js
// PRAGMA foreign_keys only takes effect outside a transaction; the migrator's own toggle is inside one
sqlite.pragma('foreign_keys = OFF');
migrate(db, { migrationsFolder: './drizzle' });
const violations = sqlite.pragma('foreign_key_check');   // the step drizzle never emits
sqlite.pragma('foreign_keys = ON');
if (violations.length) throw new Error(`migration left FK violations: ${JSON.stringify(violations)}`);
```

Verified to preserve all 3 child rows with a clean `foreign_key_check`. Back it up first regardless — `VACUUM INTO` a copy before migrating a file you don't control.

**`foreign_keys` is the pragma, and `defer_foreign_keys` is the one that looks like it.** The sibling does take effect inside a transaction — it holds a violation open until the commit — which is what makes it the tempting hand-edit to the migration file. It defers the *check*, not the `ON DELETE CASCADE` action, so with `PRAGMA defer_foreign_keys=ON` as the file's first statement the cascade still fires and `foreign_key_check` still comes back clean (verified, SQLite 3.53.4).

## `push` vs `generate` + `migrate`
`push` diffs your schema against the live database and applies it with no migration file. Official guidance: **`push` for local prototyping, `generate` + `migrate` for production** — and the drizzle-kit docs do note teams running `push` in production behind blue/green deploys. Take that as a claim about their deployment model, not a default: `push` leaves no reviewable artifact, no ordering, and no record of what ran. Pick one per project and hold it; alternating between them desynchronizes the snapshots that both commands diff against.

## What Drizzle does not do for you
- **Connection settings.** The string form (`drizzle('./app.db')`, `drizzle(process.env.DATABASE_URL)`) builds the driver itself and hands you no handle — so every setting stays at the driver's default. Construct the driver yourself and pass it in; `reference/sqlite.md` has the pragma block that depends on it.
- **Pooling.** Drizzle wraps a pool you configure; it has no opinion on size or lifetime.
- **Down migrations.** There are none. A rollback is a new forward migration you write.
- **Column defaults, unless `schema.ts` carries them too.** Drizzle names *every* column in an `insert` and, for a key absent from the values object, binds the **schema-level** `.default(...)` as a parameter — it never emits the SQL `DEFAULT` keyword (sqlite rejects it in a `VALUES` list). So a column with `DEFAULT x NOT NULL` in the migration but no `.default(x)` in `schema.ts` binds `null` and trips `NOT NULL` on every insert that omits it. The two defaults are a **pair**; write both.
- **Backfills.** Schema diffing only. Data movement is `generate --custom`.
- **Validation.** Column types constrain SQL, not input; parse at the boundary. `.$type<T>()` is a cast, not a parser — it constrains what TS lets you write, validates nothing on read, and old rows keep their old shape.

## A brand has to reach the column
A branded type (`PostableAccountId`, `ParsedContact`) exists to make a value unforgeable, and it only holds as far as it's carried. Put it on the **column** — `text().$type<PostableAccountId>()` — not just on the argument of the function that writes it. Otherwise the first caller that reads the value back out of the database gets a raw `string`, writes `as PostableAccountId`, and the brand is dead from that seam onward. Costs nothing: `$type<T>()` is compile-time only — no migration, no runtime change.

## Consult current docs (official sources first)
`https://orm.drizzle.team/llms.txt` indexes the docs per dialect (`/docs/pg/…`, `/docs/sqlite/…`) — use it for schema, drizzle-kit, and connection docs, and Context7 (`drizzle-orm`) for exact call signatures. **Both now serve v1 content by default**, so cross-check any API against the installed version before using it. For engine semantics underneath the ORM — SQLite pragma and locking behavior, Postgres locking and index types — go to sqlite.org / postgresql.org, not the Drizzle docs.

## Recipes
Pull the file that matches the task, not all four.
- `reference/postgres.md` — pg schema idioms (identity vs `serial`, `timestamptz` modes, enums, indexes), driver choice, pooling and transaction-mode poolers, migration locking.
- `reference/sqlite.md` — driver choice and where the pragmas go when an ORM sits on top, the types SQLite doesn't have (`boolean`/date modes), no `STRICT` support, sync vs async transactions.
- `reference/migrations.md` — the drizzle-kit workflow end to end: `generate`/`migrate`/`push`/`pull`, custom migrations for backfills, running migrations at deploy vs at boot, and sequencing a breaking change across releases.
- `reference/queries.md` — relational queries vs joins, left-join nullability, `$dynamic()` builders, prepared statements and `placeholder`, the `sql` template and where `sql.raw` becomes injection, transactions.

## Not this skill's job
- **Engine semantics** — WAL, `busy_timeout`, `IMMEDIATE` transactions, the official 12-step rebuild, `STRICT`: the **`sqlite`** skill. Indexing strategy, normalization, lock impact of DDL: the **`postgres-architect`** seat's own discipline. This skill is only the ORM layer over them.
- **MySQL / SingleStore / MSSQL / CockroachDB dialects** — no seat owns them; the recipes here are pg + sqlite and mislead if stretched.
- **Cloudflare D1** — `cloudflare-builder`'s. It is the sqlite dialect, but the binding and migration CLI are Workers-shaped.
- **Typing the query surface** (generics, inference, `.d.ts`) — the `typescript` skill, in whichever seat owns the code.
