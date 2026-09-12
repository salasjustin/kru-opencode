# Drivers — choosing one, and its sharp edges

Three real options for an embedded `.db` file. For an OSS project the deciding factor is usually **install friction**, not benchmark numbers.

| | `node:sqlite` | `better-sqlite3` | `bun:sqlite` |
|---|---|---|---|
| Install | none — ships with Node | native module; prebuilds for common platforms, `node-gyp` fallback otherwise | none — ships with Bun |
| Status | Release Candidate (stability 1.2) as of Node v25.7.0; added v22.5.0 | mature, the long-standing default | stable |
| Runtime | Node only | Node (and Electron, with a rebuild step) | Bun only |
| API | sync only | sync only | sync only |
| Transaction helper | none — hand-write `BEGIN`/`COMMIT` | `db.transaction(fn)` + `.deferred/.immediate/.exclusive` | `db.transaction(fn)` + `.deferred/.immediate/.exclusive` |

**Pick for an OSS library or CLI**: `node:sqlite` if you can require Node ≥22 — a zero-dependency install is worth a lot in an issue tracker, and it removes the "`node-gyp` failed on my machine" class of bug report entirely. Pick `better-sqlite3` if you need to support older Node, Electron, or want the transaction helper and a decade of Stack Overflow answers. `bun:sqlite` only if the project is Bun-exclusive.

All three are synchronous by design. That is correct for SQLite — the engine is not doing network I/O, and an async wrapper buys nothing but a chance to hold a transaction open across an await point (see the concurrency section in `SKILL.md`).

## `node:sqlite`

```js
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('app.db', {
  timeout: 5000,                    // busy_timeout, no separate pragma needed
  enableForeignKeyConstraints: true, // defaults to true here — unlike raw SQLite
});
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA synchronous = NORMAL');

const insert = db.prepare('INSERT INTO note (body) VALUES (?)');
insert.run('hello');               // → { changes: 1, lastInsertRowid: 1 }
db.prepare('SELECT * FROM note').all();
for (const row of db.prepare('SELECT * FROM note').iterate()) { /* streams */ }
```

Gotchas:
- **No transaction helper.** Write the wrapper yourself and make it `BEGIN IMMEDIATE`; check `db.isTransaction` to detect nesting.
- `enableForeignKeyConstraints` defaults to `true`, which is the opposite of raw SQLite. Don't carry that assumption to another driver.
- `readBigInts: false` by default — integers beyond 2^53 lose precision silently. Turn it on if the schema has real 64-bit ids.
- `backup(sourceDb, 'backup.db')` is the one async export.

## `better-sqlite3`

```js
import Database from 'better-sqlite3';

const db = new Database('app.db');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');     // required — off by default
db.pragma('synchronous = NORMAL');

const insert = db.prepare('INSERT INTO note (body) VALUES (?)');
const insertMany = db.transaction((rows) => {
  for (const r of rows) insert.run(r.body);
});
insertMany.immediate(rows);         // IMMEDIATE, not the default deferred BEGIN
```

Gotchas:
- `db.transaction(fn)` uses plain `BEGIN` (deferred) unless you call `.immediate()`. Any transaction that writes should be `.immediate()`.
- The wrapped function **must be synchronous** — an `async` fn commits at the first await.
- Never mix a transaction function with hand-written `BEGIN`/`COMMIT` on the same connection.
- Nested transaction functions become savepoints, which is usually what you want.
- `db.pragma('cache_size', { simple: true })` returns a scalar instead of a row array.

## `bun:sqlite`

```js
import { Database } from 'bun:sqlite';

const db = new Database('app.db', { strict: true, safeIntegers: true });
db.run('PRAGMA journal_mode = WAL');

const insert = db.query('INSERT INTO note (body) VALUES ($body)');  // query() caches; prepare() does not
const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(r); });
insertMany.immediate(rows);
```

Gotchas:
- `strict: true` is worth setting — without it a typo'd parameter name is silently `NULL` instead of an error.
- `safeIntegers: true` for anything past 52 bits.
- `query()` caches the compiled statement by SQL text; `prepare()` doesn't. Use `prepare()` for dynamically generated one-off SQL so the cache doesn't grow unbounded.
- On macOS the `-wal`/`-shm` sidecar files persist after close because of Apple's SQLite build. Checkpoint explicitly before closing if the project cares about leaving a single clean file.
