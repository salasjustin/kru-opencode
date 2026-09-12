# Testing and the gate

The harness ships with the toolchain; what doesn't ship is the flag set that makes a green mean something, and the analyzers `go vet` leaves out.

## The gate, in order
```sh
go build ./... && go vet ./...
go vet -vettool="$(go env GOPATH)/bin/shadow" ./...   # the := that eats an err — not in default vet
go test -race -shuffle=on -count=1 -timeout 60s ./...
go tool govulncheck ./...
```

- **`-race`** because the handlers are concurrent; a race report is a failure, not a warning. Under `-race` the fatal map race in `SKILL.md` is reported before it kills anything.
- **`-shuffle=on`** randomizes test order; the seed prints on failure and `-shuffle=<seed>` replays it. Order-dependent tests are the ones that pass alone and fail in CI.
- **`-count=1`** disables the result cache so a green is a fresh green.
- **`-timeout`** turns a deadlock into a stack dump instead of a hung CI job.
- **`shadow`**: `go install golang.org/x/tools/go/analysis/passes/shadow/cmd/shadow@latest`. If the repo runs `golangci-lint`, its `govet` config enables `shadow` instead.
- **`govulncheck`**: `go get -tool golang.org/x/vuln/cmd/govulncheck@latest` (1.24+ `tool` directive; `go tool govulncheck` after). Reports only vulnerabilities in reachable symbols, so every line is actionable; `-mode=binary ./app` audits the built artifact.

Flake confirmation: `go test -count=100 -run TestSuspect -failfast ./pkg/...`; parallelism suspicion: `-parallel 1 -count=10`.

`golangci-lint` v2 (`golangci-lint migrate` converts a v1 config): the linters that pay for this seat's surface are `errcheck`, `bodyclose`, `sqlclosecheck`, `nilerr`, `forcetypeassert`, `thelper`, `testifylint`, `gofumpt`; `modernize` needs v2.6+. Pin it as a module tool the same way. `go fix ./...` on 1.26 carries the modernize fixers (`rangeint`, `minmax`, `stringscut`, `omitzero`, …) — run it on a branch and read the diff.

## Coverage — two caveats
```sh
go test -covermode=atomic -coverpkg=./... -coverprofile=cover.out ./...
go tool cover -func=cover.out
```
Go's coverage is **statement** coverage, not branch — an `if err != nil { return err }` counts as covered when only the happy path ran. And `go test ./...` **drops any package with no `_test.go`** from the aggregate — not 0%, absent — which is what `-coverpkg=./...` corrects.

## Integration tests
- `//go:build integration` on the file; `go test -tags=integration ./...` runs them. Without the tag, `go test ./...` tries to reach a database on every developer's machine.
- **A fixed port flakes.** Listen on `":0"` and read `ln.Addr().(*net.TCPAddr).Port`; `httptest.NewServer` does this for you.
- `t.TempDir()` for files, `t.Context()` (1.24+) for the context — canceled when the test ends, so a leaked goroutine stops with it. `t.Setenv` for env (and it forbids `t.Parallel()` in the same test, on purpose).
- **`goleak.VerifyTestMain(m)`** in `TestMain` for any package that starts goroutines — a worker leaked per request is invisible to `-race` and to a passing suite.

## Handler tests
- `httptest.NewRecorder()` + `httptest.NewRequest` exercise a handler without a socket; assert status, the body's shape (decode it, don't string-compare), and the field-error map on a `422`.
- Route the request through the real `ServeMux` when the test is about the pattern (`GET /api/items/{id}` matching, `PathValue`), through the handler directly when it's about the handler.
- Middleware tests wrap a handler that records what it saw (`r.Context()` value present, header set, body capped).
- A round-trip test that compares a `time.Time` uses `.Equal` or `.Round(0)` on the way in (`SKILL.md`).

## testify, if the repo uses it
`assert.New(t)` built in the parent test and reused inside `t.Run` attributes every failure to the parent — the subtest prints `--- PASS` while the parent fails, and you can't tell which case broke. Build `is := assert.New(t)` (or use the `require` package functions with the subtest's `t`) inside each subtest.

## File conventions
Test files are named after the **source file** (`handler.go` → `handler_test.go`), not the function, and test functions follow the order of the functions they cover — tooling and coverage resolve by file. Table-driven tests name each case; `t.Run(tc.name, …)` with `tc := tc` unnecessary from `go 1.22`.
