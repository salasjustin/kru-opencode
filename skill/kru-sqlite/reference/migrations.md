# Migrations

## The 12-step table rebuild

`ALTER TABLE` supports exactly four operations: add column, rename column, rename table, drop column. Any other schema change — altering a type, adding or removing a `CHECK` / `NOT NULL` / `UNIQUE` / foreign key, reordering columns, adding `STRICT` — requires rebuilding the table. This is sqlite.org's official procedure, in this order:

1. If foreign key constraints are enabled, disable them with `PRAGMA foreign_keys=OFF`. **Outside** the transaction — the pragma is a no-op inside one.
2. Start a transaction.
3. Record the format of all indexes, triggers, and views on table `X`: `SELECT type, sql FROM sqlite_schema WHERE tbl_name='X'`.
4. `CREATE TABLE new_X` in the desired revised format.
5. Copy the content: `INSERT INTO new_X SELECT ... FROM X`.
6. `DROP TABLE X`.
7. `ALTER TABLE new_X RENAME TO X`.
8. Recreate the indexes, triggers, and views recorded in step 3.
9. Drop and recreate any views that referred to `X` in a way the change affects.
10. If foreign keys were originally on, run `PRAGMA foreign_key_check` to verify the change broke nothing. **Before** the commit.
11. Commit the transaction from step 2.
12. Re-enable `PRAGMA foreign_keys=ON`.

Steps 1/12 and 10/11 are the ones that get skipped. Disabling foreign keys inside the transaction does nothing, and checking them after the commit means you find the corruption after it is durable.

Do not set `legacy_alter_table` to work around step 7 behavior — it changes how `RENAME` rewrites references and is there for backwards compatibility, not for new code.

## Hand-rolled versioning with `user_version`

`PRAGMA user_version` is a 4-byte integer in the database file header. No table, no extra read, nothing to bootstrap — which is why it beats a `migrations` table for a small embedded database.

```js
// each entry is one forward step; index + 1 is the version it produces
const steps = [
  (db) => db.exec(`CREATE TABLE note (id INTEGER PRIMARY KEY, body TEXT NOT NULL) STRICT`),
  (db) => db.exec(`ALTER TABLE note ADD COLUMN created_at TEXT NOT NULL DEFAULT ''`),
];

export function migrate(db) {
  const current = db.pragma('user_version', { simple: true });
  for (let v = current; v < steps.length; v++) {
    // each step is its own transaction, so a failure leaves the version at the last good state
    const step = db.transaction(() => {
      steps[v](db);
      db.pragma(`user_version = ${v + 1}`); // not parameterizable — pragmas take literals only
    });
    step.immediate();
  }
}
```

Notes:
- Pragma values cannot be bound parameters. Interpolate only a number you computed, never user input.
- Run `migrate()` once at startup on the writer connection, before anything else queries.
- `PRAGMA optimize` after a migration that adds an index.
- Append steps only — never edit a step that has shipped, for the same reason you never edit an applied migration anywhere else.

## Drizzle Kit

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: './app.db' },
});
```

`drizzle-kit generate` writes the SQL, `drizzle-kit migrate` applies it. Drizzle emits the table rebuild for you when a change can't be expressed as an `ALTER` — read the generated SQL before shipping it, because the rebuild is where data loss happens and the generator can't know your intent for a narrowed column.

`drizzle-kit push` is for local iteration only. Never point it at a database a user owns.

Driver wiring:

```ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('app.db');
// pragmas still go on the raw handle — the ORM does not set them for you
sqlite.pragma('journal_mode = WAL');
export const db = drizzle({ client: sqlite });
```

## Migrating a database file that's already in users' hands

The case that separates an embedded database from a server one: you do not control when the migration runs, and you cannot roll the fleet forward together. An old build of the app may open a file a newer build already migrated.

- **Back up before migrating.** `VACUUM INTO 'app.db.bak-v3'` before step 1 (see `ops.md`) — it is cheap and it is the only undo you get.
- **Additive changes are free; destructive ones are not.** Adding a nullable or defaulted column keeps old builds working. Dropping or narrowing a column breaks them. Sequence a destructive change across two releases the same way you would a zero-downtime server migration: add → backfill → switch reads → drop in the following release.
- **Refuse to open a database newer than the code.** If `user_version` exceeds the highest step, throw with a clear "this file was written by a newer version" message rather than running queries against a schema you don't understand.
- **Don't migrate on every process start if the app is multi-process.** Take the write lock once (`BEGIN IMMEDIATE`) and re-read `user_version` inside it, so two processes racing at launch don't both apply step N.
