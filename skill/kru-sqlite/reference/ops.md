# Operations — backup, WAL upkeep, integrity, shipping a database

## Backup: `VACUUM INTO` vs. the backup API

```sql
VACUUM INTO 'app.db.bak';
```

Runs against a live database — no exclusive lock, the original is untouched, and the output is a consistent snapshot. sqlite.org on the tradeoff:

> "The advantage of using VACUUM INTO is that the resulting backup database is minimal in size and hence the amount of filesystem I/O may be reduced. Also, all deleted content is purged from the backup, leaving behind no forensic traces. On the other hand, the backup API uses fewer CPU cycles and can be executed incrementally."

So: **`VACUUM INTO` for a one-shot backup** (before a migration, on user request, on a schedule) — it's one statement and the result is compact. **Backup API** when the database is large enough that you need the copy to proceed incrementally without pinning CPU (`node:sqlite` exports `backup()`; better-sqlite3 has `db.backup()`).

One caveat sqlite.org is explicit about: if `VACUUM INTO` is interrupted by power loss or an unplanned shutdown, the *output* file may be incomplete and corrupt. The source is fine. Verify a backup before trusting it — `PRAGMA integrity_check` on the copy, or simply don't delete the previous backup until the new one checks out.

Never back up a WAL-mode database by copying the `.db` file alone. The `-wal` file holds committed pages that have not been checkpointed yet; a bare `cp` gets you a torn, older database. Copy all three files with the database closed, or use one of the two mechanisms above.

## WAL upkeep

- Auto-checkpoint fires at **1000 pages (~4MB)** by default, and again when the last connection closes. `PRAGMA wal_autocheckpoint = N` changes the threshold, `0` disables it.
- The `-wal` file grows unbounded when a checkpoint can't complete. The usual cause is a long-lived read transaction: the checkpointer must stop at the end mark of any active reader. Bounded read transactions are the fix; raising the threshold is not.
- `PRAGMA wal_checkpoint(TRUNCATE)` forces a full checkpoint and resets the WAL to zero length — the right call before closing a database you're about to hand to a user, copy, or ship.
- Checkpoint modes: `PASSIVE` (default, never blocks), `FULL`, `RESTART`, `TRUNCATE`.

Documented WAL limitations worth knowing before committing to it:

| Limitation | Consequence |
|---|---|
| Requires shared memory between processes | **does not work on a network filesystem** — all processes must be on the same host |
| Creates `-wal` and `-shm` sidecar files | poor fit if the `.db` is meant to be a single-file application format users move around |
| `page_size` is frozen once in WAL | must revert to `delete` mode to change it |
| Transactions over ~100MB | WAL performs badly and may fail past ~1GB; the rollback journal is faster for bulk loads |
| Multiple `ATTACH`ed databases | a transaction is atomic per-database, **not** atomic across the set |
| Read-heavy workloads | ~1–2% slower than the rollback journal, degrading as the WAL grows |

For a bulk import, it is legitimate to switch to `journal_mode = delete`, load, then switch back to WAL.

## Integrity

- `PRAGMA integrity_check` — full verification, walks the whole database. Slow on large files, thorough.
- `PRAGMA quick_check` — skips the expensive index-vs-table cross-checks. Fast enough for startup on a small database.
- `PRAGMA foreign_key_check` — reports orphaned rows. Necessary after any table rebuild, and after any period the database ran with `foreign_keys=OFF`.

Run `quick_check` at open if the file came from somewhere you don't control (a user's disk, a sync folder, a restored backup), and fail loudly rather than querying a corrupt file.

## `VACUUM`

Rebuilds the entire database to reclaim free pages. It needs roughly **2× the database size** in free disk and holds a write lock for the duration — so it is not something to run on a schedule against a large file without thinking about it. `PRAGMA auto_vacuum = incremental` plus periodic `PRAGMA incremental_vacuum` is the gentler alternative, but it must be set **before** the database has any content (otherwise it requires a full `VACUUM` to take effect).

If the goal is a compact copy rather than compacting in place, `VACUUM INTO` is strictly better.

## Shipping a seed database in a package

- Ship it in `delete` journal mode, checkpointed and vacuumed (`VACUUM INTO` produces exactly this), so there are no sidecar files in the tarball and no WAL state to reconcile.
- Never open the packaged file for writing — a global install may sit in a read-only directory, and writing there mutates state shared across projects. Copy it to a user data directory on first run, then open the copy in WAL.
- If the database only ever needs to be read, `PRAGMA query_only = ON` and open the file read-only. As of SQLite 3.22.0 a read-only WAL database can be opened without write access provided the `-shm`/`-wal` files exist or the database is marked immutable — but shipping in `delete` mode sidesteps the whole question.
- Record the schema version in `user_version` in the shipped file, so the migration runner treats it like any other database rather than a special case.
