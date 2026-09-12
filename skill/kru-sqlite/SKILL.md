---
name: kru-sqlite
description: SQLite recipes for an embedded local database in node/bun — the per-connection pragma block (WAL · busy_timeout · foreign_keys · synchronous), single-writer concurrency and what actually fixes SQLITE_BUSY, STRICT tables vs. type affinity, the 12-step rebuild that stands in for the ALTER TABLE SQLite can't do, user_version migrations, and VACUUM INTO backups. Use when writing or reviewing SQLite schema, migrations, or queries against a local `.db` file, or when choosing between better-sqlite3 / node:sqlite / bun:sqlite. Covers embedded SQLite only — not D1, not libSQL/Turso.
---

**SQLite is not a small Postgres.** Four differences burn a Postgres-shaped instinct, and everything below follows from them: one writer at a time regardless of pool size · types are advisory unless the table is `STRICT` · `ALTER TABLE` cannot touch a constraint · most settings you care about are **per-connection** and reset on every open.

## The connection recipe
Run on every connection, at open, before anything else.

```js
// journal_mode persists in the db file header; the other three are per-connection and reset on every open
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
```

| Pragma | Default | Why |
|---|---|---|
| `journal_mode = WAL` | `delete` | concurrent readers alongside one writer, instead of readers and writers blocking each other. Set once — it's stored in the file |
| `busy_timeout = 5000` | `0` — a blocked write throws instantly | makes a contended write wait and retry rather than surface `SQLITE_BUSY` to the caller. 5–10s is the usual band |
| `foreign_keys = ON` | `OFF` | SQLite ships FK enforcement off for backwards compatibility. Per-connection — one connection that misses this silently skips **every** FK |
| `synchronous = NORMAL` | `FULL` | skips an fsync per commit. In WAL this cannot corrupt the database; the only exposure is losing the last committed transactions on **power loss** (not on an app crash) |

Then `PRAGMA optimize`, per sqlite.org's stated recipe: short-lived connection → run it just before closing; long-lived → `PRAGMA optimize = 0x10002` at open plus a plain `PRAGMA optimize` hourly or daily; **always** after a schema change or `CREATE INDEX`. Don't hand-set `analysis_limit` first — `optimize` now applies its own temporary limit.

## Cargo-cult pragmas — leave them out
Widely copied off blog posts, wrong or situational as a default:

| Seen everywhere | Why not |
|---|---|
| `mmap_size = 30000000000` | trades away SQLite's ability to detect I/O errors (a bad read becomes a segfault, not an error), caps out on 32-bit, and mostly duplicates the OS page cache. Situational tuning, never a baseline |
| `page_size = 32768` | only pays off for large-blob workloads, and it **can't be changed** once the db is in WAL mode without reverting to `delete` and vacuuming. Decide at creation or not at all |
| `synchronous = OFF` | the one setting here that can actually corrupt the database. `NORMAL` is the floor |
| `cache_size = -32000` | usually redundant with the OS page cache. Set it from a measurement, not on principle |
| `PRAGMA vacuum` | not a pragma. `VACUUM` is a statement — and see `reference/ops.md` before running it on anything large |

## Concurrency — one writer, and the real fix for SQLITE_BUSY
- WAL buys **concurrent readers + exactly one writer**. It does not buy concurrent writers, and no pool size changes that. Shape the app as one writer connection and N readers.
- `busy_timeout` retries a blocked write — **except in the case that actually bites**: a `DEFERRED` transaction that has already read, then tries to upgrade to a write. SQLite returns `SQLITE_BUSY` immediately and does not invoke the busy handler at all, because two connections both waiting to promote would deadlock: *"SQLite returns SQLITE_BUSY for the first process, hoping that this will induce the first process to release its read lock and allow the second process to proceed."*
- So: **every transaction that will write starts `IMMEDIATE`** — `tx.immediate(args)` in better-sqlite3 and bun:sqlite, `BEGIN IMMEDIATE` by hand elsewhere. Deferred is for read-only work. This is the single most common cause of intermittent `SQLITE_BUSY` under load.
- A long-running **read** transaction stops the checkpointer at its end mark, so the `-wal` file grows unbounded until that reader finishes. Never hold a read transaction open across an await point or a whole request lifetime.
- Transaction wrappers are **sync-only** in better-sqlite3 and bun:sqlite — an `async` function inside one commits early. Don't interleave them with hand-written `BEGIN`/`COMMIT` either.

## Types — declare STRICT
Without it, a column's declared type is an *affinity*, not a constraint: `age INTEGER` happily stores `'banana'`. Add `STRICT` to every `CREATE TABLE` (SQLite 3.37+) and the type is enforced. Note what STRICT does not give you: still no native boolean (store `0`/`1` with a `CHECK`), no date/time type (store ISO-8601 `TEXT` or an integer epoch, and be consistent — comparisons are lexical), and `INTEGER PRIMARY KEY` remains the one true rowid alias.

## Schema changes — `ALTER` can't, so rebuild
`ALTER TABLE` does four things only: add a column, rename a column, rename a table, drop a column. Every other change — a type, a `CHECK`, a `NOT NULL`, a foreign key, column order — is the official 12-step table rebuild, reproduced verbatim in `reference/migrations.md`. Two steps that get skipped and cost data: `PRAGMA foreign_keys=OFF` goes **outside** the transaction (it is a no-op inside one), and `PRAGMA foreign_key_check` runs **before** the commit, not after.

## Case-insensitive uniqueness lives on the index
A user-visible name that must be unique regardless of case keeps its typed capitals in the row; the index carries the collation — `create unique index t_name on t(name collate nocase)`. Lower-casing the column rewrites what the user typed, and a second lower-cased column stores twice for a rule the index states in two words. `nocase` folds ASCII only; a Unicode fold is an application-side normalised column.

## Consult current docs (official sources first)
sqlite.org is the authority for engine semantics — pragma behavior, WAL, transaction locking, `ALTER TABLE`, `VACUUM INTO` — and it is precise where community posts are approximate. Fetch it rather than answering from memory. For the driver or ORM API (`better-sqlite3`, `node:sqlite`, `bun:sqlite`, Drizzle, Kysely), resolve via Context7; for Drizzle prefer its official `llms.txt` index (`https://orm.drizzle.team/llms.txt`) for schema/migration docs and Context7 for exact call signatures.

## Recipes
Pull the file that matches the task, not all three.
- `reference/drivers.md` — choosing between better-sqlite3 / `node:sqlite` / bun:sqlite, their transaction APIs, and the gotchas each one has (integer truncation, FK defaults, macOS sidecar files).
- `reference/migrations.md` — the 12-step rebuild verbatim, the `user_version` stepper, Drizzle Kit for the sqlite dialect, and migrating a database file that's already in users' hands.
- `reference/ops.md` — `VACUUM INTO` vs. the backup API, WAL checkpointing and growth, integrity checks, and shipping a seed database inside a package.

## Not this skill's job
- **Cloudflare D1** — `cloudflare-builder`'s seat. The engine recipes above are shared (that seat loads this skill for them); what stays out of scope here are the Workers-shaped deltas — the binding, the migration CLI, `defer_foreign_keys` in place of `PRAGMA foreign_keys=OFF`, `batch()` instead of transactions, and the bound-param cap.
- **libSQL / Turso** — a remote or replica server changes the concurrency and pragma story enough that these recipes mislead.
- **Postgres** — `postgres-architect`. Reaching for `postgres-architect`'s indexing and migration habits here is exactly the failure this skill exists to prevent.
- **Typing the query surface** (generics, inference, `.d.ts`) — the `typescript` skill, in whichever seat owns the code.
