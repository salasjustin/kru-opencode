# Drizzle — the sqlite dialect

Read `SKILL.md` first; the generated table rebuild and its child-row deletion live there and are not repeated here.

## Drivers
0.45.2 ships these sqlite-dialect entry points: `better-sqlite3` · `bun-sqlite` · `libsql` (+ `/http`, `/node`, `/sqlite3`, `/wasm`, `/web`, `/ws`) · `d1` · `durable-sqlite` · `expo-sqlite` · `op-sqlite` · `sqlite-proxy`.

**There is no `drizzle-orm/node-sqlite` in 0.45.2** — `node:sqlite` support is v1-era. A project on stable that wants the Node built-in driver either waits, or uses `sqlite-proxy` and hands Drizzle its own executor. For an embedded `.db` in node, `better-sqlite3` remains the default choice.

## Set the pragmas yourself — construct the driver, don't let Drizzle do it
`drizzle('./app.db')` builds the driver internally and hands you no handle to configure. Measured defaults on that path: `journal_mode=delete`, `synchronous=FULL` — **no WAL**. Always build the driver first:

```js
// pragmas belong on the raw handle at open; drizzle sets none of them
const sqlite = new Database('./app.db');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('busy_timeout = 5000');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('synchronous = NORMAL');
const db = drizzle(sqlite, { schema });
```

`db.$client` reaches the underlying driver afterwards, for pragmas an ORM has no API for (`optimize`, `wal_checkpoint`, `foreign_key_check`). Reach for it deliberately — it is the escape hatch, not the interface you hand builders.

## Transactions default to deferred — pass `immediate` on anything that writes
```js
db.transaction((tx) => { ... }, { behavior: 'immediate' });
```

Verified at `better-sqlite3/session.js`: the behavior is `config.behavior ?? "deferred"`. A deferred transaction that reads and then tries to upgrade to a write gets `SQLITE_BUSY` **immediately, with no busy-handler retry** — see the `sqlite` skill. Drizzle's default is the failing case, so `{ behavior: 'immediate' }` is not a tuning knob, it is the rule for every writing transaction.

The `better-sqlite3` and `bun-sqlite` transaction callback is **synchronous** (`(tx) => T`, not `Promise<T>`). An `async` callback commits before the awaited work runs. Keep transactions sync and free of I/O.

## No `STRICT` — the one place this skill contradicts the `sqlite` skill
`sqlite-core` has no strict-table option and `drizzle-kit generate` never emits `STRICT`. Verified generated DDL:

```sql
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL
);
```

The `sqlite` skill's rule is `STRICT` on every table, and Drizzle cannot express it. Resolve it explicitly rather than silently dropping the rule:

- **Add it in a `--custom` migration** doing the rebuild by hand, and accept that the next `generate` diffs against a snapshot that doesn't know the table is strict — a change to that table regenerates it without `STRICT`. Only worth it on tables that rarely change shape.
- **Or accept type affinity** and compensate with `CHECK` constraints in the table config, which Drizzle *can* express. This is the pragmatic default; say which one was chosen and why.
- **Or append `STRICT` in a post-generate script wired into `db:generate`**, with a test asserting every table carries it. This is the option that survives a regenerate: the script runs over the freshly emitted SQL every time, so the rule holds the next time a table changes shape — which is exactly where the hand-edited `--custom` migration above loses it.

Either way the writes going through Drizzle are typed at the TS boundary — the exposure is data arriving from anything that isn't Drizzle.

## The types SQLite doesn't have
| Domain type | Column | Notes |
|---|---|---|
| boolean | `integer({ mode: 'boolean' })` | stores `0`/`1`, maps to `boolean` in TS |
| timestamp | `integer({ mode: 'timestamp' })` or `'timestamp_ms'` | seconds vs milliseconds — pick one per project; they are not interchangeable and nothing warns you |
| date as text | `text()` holding ISO-8601 | comparisons are lexical, so pad and use UTC consistently |
| json | `text({ mode: 'json' }).$type<Shape>()` | stores a JSON string; the shape is a TS assertion (`SKILL.md`) |

## Collation is an index expression
The `sqlite` skill puts case-insensitive uniqueness on the index; the spelling here is `uniqueIndex('t_name_nocase').on(sql`${t.name} collate nocase`)` — there is no column-level collation option, and `generate` emits `("name" collate nocase)` (reproduced on `drizzle-kit@0.31.10`).

## Migrations for a file you don't control
An embedded database ships on someone's disk. On top of `reference/migrations.md`:

- Run `migrate()` at app boot, not from a CLI step — you are not present when the user upgrades.
- `VACUUM INTO` a backup before migrating, so a failed rebuild is recoverable.
- Refuse to open a file whose schema is newer than the code (a downgrade), rather than letting the migrator diff against something it doesn't understand.
- Never open a packaged/read-only install path for writing; copy a seed database to a user data directory first.
