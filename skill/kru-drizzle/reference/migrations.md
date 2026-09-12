# Drizzle — the drizzle-kit workflow

Read `SKILL.md` first: the generated SQL is a draft, and on sqlite the generated rebuild deletes child rows.

## The commands
| Command | What it does | When |
|---|---|---|
| `generate` | diffs the schema against the last snapshot, writes a `.sql` file | every schema change on a project that keeps migrations |
| `generate --custom --name=x` | writes an **empty** migration for you to fill | backfills, data moves, DDL drizzle-kit can't model |
| `migrate` | applies pending files, records them | deploy |
| `push` | diffs against the **live database** and applies directly, no file | local prototyping |
| `pull` | introspects an existing database into a schema file | brownfield adoption |
| `check` / `up` | detects collisions in the snapshots / upgrades snapshot format | after a messy merge, after a kit upgrade |

Pick `generate`+`migrate` **or** `push` per project and hold it. They diff against different sources of truth — snapshots vs. the live database — so alternating desynchronizes both.

## Migrations are applied by timestamp against the *last applied one only*
Verified at source (`pg-core/dialect.js` and `sqlite-core/dialect.js`, `migrate()`): the migrator reads the single most recent row from the migrations table, then applies every migration whose folder timestamp is **greater than** that one.

```js
if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) { /* apply */ }
```

**Consequence: a migration that merges in with an older timestamp than one already applied is skipped silently, forever.** Two developers generating migrations on parallel branches is enough to trigger it — branch A generates at 10:00, branch B at 10:05, B merges and deploys first, then A merges and its file is never applied. No error, no warning; the schema is just missing a change and the snapshot claims otherwise.

Defences: regenerate (don't merge) a migration whose branch was overtaken, run `drizzle-kit check` after any merge that touches `drizzle/`, and treat a migration file in a merge conflict as a rebase-and-regenerate, never a hand-merge.

Ledger location: `__drizzle_migrations` in the `drizzle` schema on pg (both names configurable), a plain table on sqlite.

## The whole pending batch runs in one transaction
Good — a mid-batch failure rolls everything back. The costs are in `reference/postgres.md` (lock duration, and `CREATE INDEX CONCURRENTLY` erroring because it cannot run inside a transaction block) and `reference/sqlite.md` (the pragma toggle inside the file being a no-op).

## Backfills are a separate migration
Schema diffing never moves data. A constraint that existing rows violate makes the migration abort — see `SKILL.md`. The sequence is three migrations, not one:

1. `generate` — add the column nullable / without the constraint.
2. `generate --custom` — write the `UPDATE` that backfills it.
3. `generate` — add the `NOT NULL` / `CHECK` / unique constraint.

Same shape for a rename done safely and for anything destructive — **expand/contract**: add, dual-write, backfill, switch reads, drop. Splitting it across **deploys**, not just migrations, is what makes it zero-downtime — old code must survive the intermediate schema.

## There are no down migrations
Drizzle does not generate them and `migrate` cannot reverse. A rollback is a new forward migration you write and test. Which means:

- The deploy that fails is not undone by redeploying the previous build — the schema stays migrated. Old code has to tolerate the new schema, which is the real argument for expand/contract.
- Take a backup before a destructive migration. On embedded sqlite that's `VACUUM INTO`; on pg it's the provider's snapshot, taken deliberately, not the nightly one.

## Never edit an applied migration
The file is already recorded in the ledger by timestamp, so editing it does not re-run it — it just makes the migration history a lie for every environment that already applied it, while a fresh database gets the edited version. New change, new file. The same rule as every migration tool, and drizzle-kit will not save you from breaking it.

## Running migrations
- **Server (pg):** one deploy step, before the new instances take traffic. Not from app boot — the migrator takes no advisory lock, so concurrent instances race (see `reference/postgres.md`).
- **Embedded (sqlite):** at app boot, because you are not present when the user upgrades. Back up first, and refuse a database newer than the code.
- Keep the migration credentials separate from the app's; which connection string drizzle-kit gets is in `reference/postgres.md`.
