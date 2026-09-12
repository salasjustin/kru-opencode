---
name: kru-go
description: Use when writing or reviewing a Go `net/http` handler, middleware, JSON contract, session/CSRF code, `database/sql` call, or `_test.go` in a repo with a `go.mod`. The traps that compile, pass `vet` and ship quiet — a nil slice serializing as JSON `null`, `http.Error` not ending the handler, a map race that is `fatal` and skips `recover`, a goroutine dying with the request because it took `r.Context()`, `omitempty` keeping a zero `time.Time` while dropping `false` — with the security, `database/sql`, test-gate and version-gate halves in `reference/`. Go 1.22+ on the stdlib; not Gin/Echo/Fiber internals, not gRPC.
---

**Go's dangerous failure is the one that compiles and stays quiet.** The type checker proves the shape and `go vet` catches a slice of the rest; everything below passes both and ships as wrong data, a dead process, or a hole. Three consequences drive the file: a zero value is a *value* (not absent, not an error, not `null`) · a handler is a plain function (nothing ends it but `return`, nothing catches what it spawns) · the runtime has failures `recover` cannot see.

Reproduced on **go1.26.1** (`darwin/arm64`, 2026-08-30) unless a line says otherwise. Version-gated behavior follows the `go` directive in `go.mod`, not the installed toolchain — check it before reaching for anything marked with a version.

## The JSON contract
- **A nil slice marshals to `null`.** `var items []Item` → `{"items":null}`; the SPA's `data.items.map()` throws on the empty result. Every response slice is `[]Item{}` or `make([]Item, 0, n)`. A `[]byte` field is base64, not an array.
- **`omitempty` is not "omit the zero value."** It keeps a zero `time.Time` (`"0001-01-01T00:00:00Z"`) and any struct, and it *drops* `false` and `0` as if absent — a `bool` field with `omitempty` cannot say no. `omitzero` (1.24+) is the tag that means what `omitempty` sounds like; pointers are the pre-1.24 shape.
- **A missing field decodes to the zero value**, indistinguishable from `0`/`""`/`false`. A pointer field (`new(v)` from 1.26) or an explicit required-check is how absence survives decode; the test for it is a decode of `{}` asserting the field is nil.
- **An unexported field with a `json` tag is silently dropped** — `json.Marshal` returns `{}` and `err == nil`. `go vet` reports it, which is one reason vet is a gate.
- **Decoding into `map[string]any` makes every number a `float64`.** `m["id"].(int)` panics; an id above 2^53 loses precision. Decode into a typed struct, or `dec.UseNumber()` + `json.Number.Int64()`.
- **The decoder is permissive.** `json.NewDecoder(r.Body)` accepts unknown fields and reads without a cap — `DisallowUnknownFields()` and `http.MaxBytesReader(w, r.Body, n)` at the boundary, every handler. A `*http.MaxBytesError` from decode is a `413`.
- **An enum at `iota` 0 is the absent value.** `StatusUnknown` at 0, or `iota + 1`, so a missing field can't read as the first real state.
- **`time.Time == time.Time` compares the monotonic clock.** A time round-tripped through JSON or the DB is never `==` to the `time.Now()` it came from; `.Equal()`, or `.Round(0)` before storing. This is the usual mystery failure in a handler round-trip test.

## Handlers
- **`http.Error` does not end the handler.** It writes a status and returns; the code after it runs — the privileged action happens *and* the body is doubled. Reproduced: `403` + `"forbidden\ndid the privileged thing"`. Every error write is followed by `return`, or the handler returns `error` and one adapter writes.
- **After a service error, check `r.Context().Err()` before writing.** A client that disconnected is a canceled context; the write goes to nobody and the log entry is noise.
- **Auth header parsing:** `strings.Trim(h, "Bearer ")` strips a character *set* (`Bearer abcdef` → `bcdef`); `strings.CutPrefix(h, "Bearer ")`.
- **A redirect target from a query param is an open redirect.** `?next=` on login is exactly where a SPA puts one — see `reference/security.md`.
- **`regexp.MustCompile` in a handler recompiles per request.** Package-level `var`.
- **Every deferred `Close` in a loop waits for the function to end.** A handler looping over rows, files or outbound responses with `defer x.Close()` inside holds every handle until it returns — extract the body to a function.

## Errors
- **A typed nil pointer in an `error` is not nil.** `var e *AppError; return e` makes `err != nil` true on the success path, then `Error()` panics. Return the literal `nil`.
- **`:=` inside `if`/`for` shadows the outer `err`.** The inner failure is a different variable; the function returns nil and the error vanishes. Default `go vet` does not report it — the `shadow` analyzer is a separate install (`reference/testing.md`).
- **`%w` inside the module, `%v` at the public boundary** — a caller that can `errors.Is` your internal sentinel now depends on it. `errors.AsType[T](err)` (1.26) replaces `errors.As(err, &target)` when `T` implements `error`.
- **Log or return, never both.** A handler that logs an error and returns it produces one entry per layer. The HTTP adapter is the layer that logs; below it, wrap and return.
- **Error strings carry no variable data.** `fmt.Errorf("fetching user: %w", err)` groups in Sentry; `fmt.Errorf("fetching user %s: %w", id, err)` is one group per user. The id is a `slog` attribute at the log site.
- **`log.Fatal` and `os.Exit` skip every `defer`** — including `srv.Shutdown` and `db.Close`. `main` calls `run() error` and exits only after it returns.

## Goroutines and the runtime
- **A goroutine started in a handler with `r.Context()` dies with the request.** The audit write, the email, the enqueue — canceled the moment the response is flushed. Background work takes `context.WithoutCancel(r.Context())` (1.21+): values and trace ids survive, cancellation doesn't. `context.Background()` here is the other failure: it drops the trace. Give it its own deadline.
- **`recover` only catches panics in its own goroutine.** The panic middleware does not cover `go func(){…}()`; a panic there kills the process. Every spawned goroutine carries its own `defer recover()`.
- **A concurrent map read+write is `fatal error`, not a panic.** No `recover` runs; the process is gone. Reproduced with a shared map behind two goroutines. A cache shared across requests lives behind `sync.RWMutex`, or `sync.Map` for a read-heavy, stable key set. `-race` finds it before production does.
- **There is no panic middleware until you write one.** `defer func(){ if p := recover(); p != nil { slog.Error("panic", "panic", p, "stack", string(debug.Stack())); http.Error(w, "internal error", 500) } }()` around `next.ServeHTTP`, outermost.
- **Bounded fan-out.** `errgroup.WithContext` + `SetLimit` (`golang.org/x/sync`, check `go.mod`); `sync.WaitGroup.Go` (1.25) for the unbounded-by-design case.
- **Timers and loop variables are `go.mod`-gated.** `go 1.22`+ gives per-iteration loop variables; `go 1.23`+ makes timer channels unbuffered and GC-able without `Stop()`. A module pinned lower keeps the old semantics whatever toolchain builds it — `reference/versions.md` has the table.

## Slices, maps, tags
- **`append` to a sub-slice writes into the parent.** `head := all[:2]; head = append(head, x)` overwrites `all[2]` when capacity allows — reproduced: `[1 2 3 4]` → `[1 2 99 4]`. A slice handed out of a function and appended to by the caller is the same bug one hop away. The full slice expression `all[:2:2]` caps it so `append` must copy; `slices.Clone` when the caller owns it.
- **Map iteration order is random per run**, by design. A response built by ranging a map is a different order on every request; sort the keys (`slices.Sorted(maps.Keys(m))`) or use a slice.
- **A rename doesn't see struct tags.** gopls Rename keeps the code compiling; the `json:"userId"` / `db:"user_id"` tag on the field it renamed stays as it was, and the wire or the scan silently changes. After any field rename, grep the tags — and the `text/template` fields, which it can't see either.

## Both ends of the wire have no timeout by default
`http.Server` (`ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, `IdleTimeout`, plus **`MaxHeaderBytes`** — `MaxBytesReader` caps the body, headers are a separate surface) *and* `http.Client` — the zero `http.Client` and `http.Get` wait forever. Outbound: `http.NewRequestWithContext` under a `context.WithTimeout` with `defer cancel()`, and `defer resp.Body.Close()` on every response, error or not.

## Disclosed
- `reference/security.md` — sessions and cookies (`__Host-`, `crypto/rand`, constant-time compare), `net/http.CrossOriginProtection` (1.25) for CSRF, the headers middleware, open redirect, `X-Forwarded-For`, rate limiting, Argon2id, `pprof` on the default mux, `os.OpenRoot` for disk paths, what never reaches a log line.
- `reference/database.md` — `database/sql` traps: the unbounded pool, `Query` vs `Exec`, `rows.Close`/`rows.Err`, `sql.ErrNoRows`, NULL scanning, identifiers a placeholder can't bind, `defer tx.Rollback()` and `FOR UPDATE`.
- `reference/versions.md` — what the `go.mod` directive gates vs. what the toolchain merely offers, 1.21–1.26, and the deprecations `vet` won't flag.
- `reference/testing.md` — the gate (`vet` + `shadow`, `-race -shuffle=on -count=1`, `govulncheck`, coverage caveats), integration build tags, port `0`, `t.Context()`, `goleak`, the testify subtest-scope pitfall, file naming.
