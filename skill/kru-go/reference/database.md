# `database/sql` — the Go code that runs the data seat's schema

Schema and migrations are `postgres-architect`'s / `sqlite-architect`'s. What follows is the driver-side discipline the seat owns: how a pooled connection is leaked, how a NULL becomes a runtime error, and how "not found" is spelled.

## The pool
`sql.Open` returns a pool with **no upper bound** — a traffic spike opens connections until the server refuses them. Set all four, once, at startup:

```go
db.SetMaxOpenConns(25)                  // ≤ the server's limit ÷ replicas
db.SetMaxIdleConns(25)                  // == MaxOpen, or churn replaces the reuse
db.SetConnMaxLifetime(5 * time.Minute)  // survives a failover / LB rotation
db.SetConnMaxIdleTime(time.Minute)
```

Then `db.PingContext(ctx)` — `sql.Open` validates arguments, it doesn't connect.

## Query vs Exec
- **`Query` for a non-SELECT leaks a connection.** `Query` returns `*Rows` that holds the connection until iterated to the end or closed; an INSERT run through it never releases. `ExecContext` for INSERT/UPDATE/DELETE; `QueryRowContext` for a single row (its `Scan` releases).
- **`defer rows.Close()` on the line after the nil check, and `rows.Err()` after the loop.** A loop that ends early on a scan error hides the driver error the iteration stopped on; without `Close` the connection stays checked out until GC.
- **Every call takes the request context** — `QueryContext`, `ExecContext`, `BeginTx`. The plain forms outlive a disconnected client.

## "Not found"
`sql.ErrNoRows` is an error value from `QueryRow(...).Scan`. `errors.Is(err, sql.ErrNoRows)` → the domain's not-found (a 404 at the adapter); `err == sql.ErrNoRows` breaks the moment a layer wraps it. A query that can legitimately find nothing is cleaner as `(*T, bool, error)` — absence isn't a failure, and the caller can't forget to branch on it.

## NULL
Scanning a NULL column into `string`/`int`/`time.Time` fails at runtime: `converting NULL to string is unsupported`. Pointer fields (`*string`, `*time.Time`) scan NULL as nil **and** marshal to JSON `null` unchanged; `sql.NullString` marshals as `{"String":"","Valid":false}` unless you write the marshaler. `sql.Null[T]` (1.22) is the generic form when the scan target isn't going to the wire.

## Identifiers
Placeholders bind **values**. `ORDER BY $1` binds a string constant and sorts by nothing; the sortable column from a clickable table header can't be a parameter. Map it through an explicit allowlist with a default:

```go
var sortCols = map[string]string{"created": "created_at", "name": "name"}
col, ok := sortCols[q.Get("sort")]
if !ok { col = "created_at" }
```

Same for table names, direction (`ASC`/`DESC` from a two-entry map), and `LIMIT` (parse to int, clamp).

## Transactions
- **`defer tx.Rollback()` immediately after `BeginTx`.** It's a no-op after a successful `Commit`, and it's the only thing that releases the connection on the early-return paths.
- **Read-modify-write needs the row lock.** Two requests that `SELECT` a balance, add, and `UPDATE` both win. `SELECT … FOR UPDATE` inside the transaction, or push the arithmetic into the `UPDATE` (`SET n = n + $1 … RETURNING n`).
- **A transaction doesn't span an HTTP call.** Anything that waits on the network while holding a tx holds the row lock for that long.
- **Idempotency keys** live in a table with a unique constraint; the duplicate insert's conflict is the signal to return the original result.

## Tests
- `//go:build integration` on any test that opens a real database, so `go test ./...` stays green without one; run with `-tags=integration`.
- Per-test isolation is a transaction opened in setup and rolled back in `t.Cleanup` — faster than truncation and order-independent.
- Unit tests of a service take a one-method consumer-side interface over the query it calls, extracted at that call site; `sqlmock` for the adapter that must prove its SQL. Neither is "an interface with one implementation" in the seat's sense — a seam at a real external boundary is the test surface, not an abstraction.
