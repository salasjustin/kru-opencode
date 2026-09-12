# Drizzle — query craft

Two query surfaces, and they are not interchangeable.

## `db.query` (relational) vs `db.select()` (builder)
`db.query.users.findMany({ with: { posts: true } })` returns a **nested object graph**, and requires the schema (and, on 0.45.x, the `relations()` definitions) passed to `drizzle(client, { schema })`. Without it, `db.query` is empty and the failure reads as a missing table.

It is **one query, not N+1** — verified emitted SQL:

```sql
select "id", "email",
  (select coalesce(json_group_array(json_array("id", "user_id", "title")), json_array())
     from "posts" "users_posts" where "users_posts"."user_id" = "users"."id") as "posts"
from "users" "users"
```

So the N+1 to hunt is never RQB — it is a `for` loop in app code awaiting a query per row. That is the failure to look for in review.

`db.select()` gives joins, aggregates, CTEs, and set operations, and returns **flat rows** — one row per join row, which you regroup yourself. Choosing it means you own the regrouping and the duplicate parent columns. Reach for the builder when you need SQL the relational API can't say; reach for `db.query` when you want the graph.

## Left joins are nullable and the types say so
```ts
const rows = await db.select().from(users).leftJoin(posts, eq(users.id, posts.userId));
// rows[number] is { users: {...}, posts: {...} | null }  — type-checked, verified
```
The joined side is `| null`. Code that reads `row.posts.title` after a left join is a type error, and if it compiles, someone widened it. A partial select changes the shape entirely — `db.select({ email: users.email })` returns `{ email }`, not a nested `users` object. Select the columns you need; `select()` with no argument is `SELECT *` and pulls every column including the ones you added last week.

## Conditional queries — `$dynamic()`
A builder is immutable-ish and its type narrows as you chain, so `if (x) qb = qb.where(...)` fights the types. `$dynamic()` opts out of that narrowing:

```ts
let qb = db.select().from(users).$dynamic();
if (search) qb = qb.where(ilike(users.email, `%${search}%`));
if (limit) qb = qb.limit(limit);
```

`.where()` called twice **replaces** rather than accumulates — build the condition with `and(...)` from an array of filters instead of chaining `.where()`.

## Prepared statements
```ts
const byId = db.select().from(users).where(eq(users.id, sql.placeholder('id'))).prepare();
const row = await byId.execute({ id: 1 });   // "select ... where "users"."id" = ?"
```
Prepare once at module scope, not per request — the point is skipping the SQL build and letting the database reuse the plan. Note the pooler caveat in `reference/postgres.md`: `postgres.js` prepares by default and transaction-mode poolers can't carry that.

## `sql` is parameterized — `sql.raw` is not
```ts
sql`select * from users where email = ${email}`   // bound parameter, safe
sql.raw(`select * from users where email = '${email}'`)   // string concatenation — injection
```
Interpolation into the `sql` template becomes a bind parameter. `sql.raw` splices text verbatim; it exists for statements that can't be parameterized (identifiers, DDL — the migrator uses it on migration files). Any `sql.raw` reachable from user input is a finding. For identifiers use `sql.identifier(name)`; for a value, always the template.

`sql<T>` sets the *expected* type of an expression and checks nothing:
```ts
const q = db.select({ n: sql<number>`count(*)` }).from(users);
```
On pg, `count(*)` comes back from the driver as a **string** (bigint), so `sql<number>` there is a lie the types won't catch. Use `count()` from `drizzle-orm`, or `db.$count(table)`, and cast deliberately when you hand-write the aggregate.

## Transactions
```ts
await db.transaction(async (tx) => { ... });          // pg — async
db.transaction((tx) => { ... }, { behavior: 'immediate' });   // sqlite — sync, and immediate (see reference/sqlite.md)
```
Use `tx`, never the outer `db`, inside the callback — a stray `db` call runs on a different connection, outside the transaction, and commits independently. Nested `transaction()` calls become savepoints. Throwing rolls back; so does `tx.rollback()`. Keep network calls and other I/O out of the block — an open transaction holds locks (pg) or blocks every other writer (sqlite).

## A constraint failure is asserted on its extended result code

The error is the driver's, and 0.45 and 1.0 hand it over in different shapes (better-sqlite3 13, one FK violation):

| | 0.45.2 | 1.0.0-rc.4 |
|---|---|---|
| thrown | the driver's `SqliteError`, unwrapped | `DrizzleQueryError` |
| `.message` | `FOREIGN KEY constraint failed` | `Failed query: insert into "p" … \nparams: 2,99` |
| `.code` | `SQLITE_CONSTRAINT_FOREIGNKEY` | `undefined` |
| `.cause` | absent | the driver's `SqliteError`, carrying `.code` |

```ts
const code = (e: any) => e.code ?? e.cause?.code;   // 0.45 on the error, 1.0 on the cause
let err: any; try { insert(); } catch (e) { err = e; }   // the sqlite drivers are sync
expect(code(err)).toBe('SQLITE_CONSTRAINT_FOREIGNKEY');
```

A test that asserts on the **message** instead fails differently per version, and the 1.0 way is the expensive one. On 0.45 no message carries the extended result code, so `toThrowError(/SQLITE_CONSTRAINT_FOREIGNKEY/)` can never match and the run reads as a missing constraint. On 1.0 that same assertion passes on the wrong error: the wrapper's message is the statement, identical for every way the statement can fail, so a typo'd table name satisfies `/Failed query/`, the error class, or a snapshot exactly as the violation would.

Pin the extended code rather than `SQLITE_CONSTRAINT`, which is unique, check, not-null and FK alike.

## Review checklist
- `select()` with no columns on a wide table.
- A query inside a loop.
- `sql.raw` anywhere near request data.
- `.where()` chained twice, expecting AND.
- A left join whose result is read as non-null.
- `db` used instead of `tx` inside a transaction.
- `.prepare()` called per request.
- `$type<T>()` treated as validation.
- A constraint-failure test asserting on the error's message.
