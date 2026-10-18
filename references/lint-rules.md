# Lint rules — the seat rules a check can hold

The rules the seats carry as prose that a static check in the product repo can enforce instead. Prose
holds only when its reader notices and complies; a failing gate holds without either. Three callers:
**`skill/kru-setup/SKILL.md`** diffs each row against a repo's config and proposes the gap, **the row's owner**
wires what the user accepts, and **`skill/kru-roster/learn.md` (PM or lead loads)** adds a row when a shortfall recurs (`learn.md` →
*Encode it*).

Every mechanism here is a tool the team already runs. A rule the repo's own tool can't express stays
prose in its seat.

## Wiring a row
- **The owner by tool**: Biome, ESLint (brownfield), GritQL plugins, `tsconfig` flags and the
  script rows → `toolchain-engineer`; `ruff`/`mypy` → `python-developer`; `go vet`/`golangci-lint`
  → `go-fullstack-builder`; `sveltekit({...})` in `vite.config.ts` → `sveltekit-builder`.
- **Strongest first.** A compiler or config flag, then a built-in rule, then a GritQL plugin, then a
  script. Take the first the repo's tool can express.
- **Scoped to where the rule is true.** A seam rule binds the components directory, not the tree —
  Biome `overrides` for a built-in rule, `includes` on a plugin.
- **Red before `error`.** Run the rule over the tree first. Clean lands at `error`. Hits land at
  `warn` with the count in the return, and the cleanup goes on the worklist as its own slice — a
  wiring slice that rewrites app code has crossed into the builders' lanes.
- **The sheet names the gate.** Once a row is wired, the repo's sheet says what enforces it
  (`setup` bar 7), and a seat reading the rule knows the gate backs it.

## TypeScript / JavaScript — Biome (ESLint equivalent in brownfield)
| rule | mechanism | backs |
|---|---|---|
| components import no route, loader or server hooks, and no api client | `style/noRestrictedImports`, override on the components dir | the UI builders + framework builders → *The seam*; `references/ui-handoff.md` |
| server-only modules (db client, auth instance, secrets) never reach client code | `style/noRestrictedImports`, override on client paths; `server-only` import on Next | framework builders' defaults; `postgres-architect`, `sqlite-architect`, `better-auth-specialist` |
| no floating promise | `nursery/noFloatingPromises` (type-aware) · `@typescript-eslint/no-floating-promises` | `code-reviewer`; `vitest`, `testing-library`, `react-email` skills |
| a clickable element is a button | `a11y/noStaticElementInteractions` + `a11y/useKeyWithClickEvents` | `ark-ui`; `ux-principles` |
| `autocomplete` values are valid | `a11y/useValidAutocomplete` | `modern-html` |
| a stdio MCP server writes nothing to stdout | `suspicious/noConsole` allowing `error`, scoped to the server package | `extension-builder` → *MCP servers* |
| no `eval` / `new Function` | `security/noGlobalEval` | `web-components` → embedding |
| no `@ts-ignore` | `suspicious/noTsIgnore` | `typescript` → *Strict is the floor* |
| no `.only` reaches the tree | `suspicious/noFocusedTests` | `vitest` |

## TypeScript / JavaScript — GritQL plugins (`biome.json` → `plugins`)
| rule | pattern | backs |
|---|---|---|
| no `sql.raw` over input | `` `sql.raw($x)` `` | `postgres-architect`, `sqlite-architect`; `drizzle` → queries |
| no truthy coercion of a string flag | `` `z.coerce.boolean($x)` ``, `` `v.toBoolean()` `` | `zod`, `valibot` |
| source never branches on the test environment or the deployment stage | `process.env.NODE_ENV` / `VERCEL_ENV` / `import.meta.env.MODE` compared to a stage literal (`'test'`, `'production'`, `'preview'`, `'development'`), `includes` excluding test globs | `code-reviewer` → *Test accommodation in source*, *Stage branching*; `testing` → *Principles* |
| no `<noscript>` fallback | JSX `noscript` element | UI + framework builders → *Scope — build the real path* |
| no placeholder text ships | string literal matching `lorem ipsum` | UI builders → *Phase 0* |
| class names are whole literals | template literal inside `class` / `className` | `tailwind` → *The scan is text*; `panda-css` |
| full-height sections use `dvh` | `h-screen` in a class literal | UI builders → *Quality floor* |
| no legacy Stripe surface | `stripe.charges.create`, Card Element, Sources/Tokens | `stripe-specialist` → *Product choices* |
| a crossing `CustomEvent` is `composed` | `new CustomEvent` without `composed: true` | `web-components-builder` → *The seam* |
| no `transition: all` | `language css;` declaration `transition: all` | UI builders → *Motion*; `design-system` |

## TypeScript — compiler
| rule | mechanism | backs |
|---|---|---|
| strict stays on, indexed access is checked | `strict`, `noUncheckedIndexedAccess` in `tsconfig`, gated by `tsc --noEmit` | `typescript` → *Strict is the floor* |

## Svelte — compiler
| rule | mechanism | backs |
|---|---|---|
| runes only | `compilerOptions.runes: true` in `sveltekit({...})` (`vite.config.ts`) | `svelte-ui-builder`, `sveltekit-builder` → *Svelte 5 defaults* |

## Python — ruff / mypy
| rule | mechanism | backs |
|---|---|---|
| no broad `except` swallowing into a plausible value | `BLE001`, `S110` | `python-developer` → *Exceptions are the control flow*; `python` |
| no `shell=True` | `S602`, `S604` | `python` → *Async, threads* |
| no SQL built by string | `S608` | `sql` → queries |
| a stdio MCP server never `print`s | `T201`, scoped to the server package | `python` → mcp-servers |
| no commented-out code | `ERA001` | Block I |
| no bare `dict`/`Any` crossing a boundary | mypy `disallow_any_generics`, `warn_return_any` | `python-developer` |

## Go — `golangci-lint` v2
The gate order and the baseline set are `go` → `reference/testing.md`; these rows extend it.
| rule | mechanism | backs |
|---|---|---|
| bodies and rows closed, `rows.Err` checked, calls take a context | `bodyclose`, `sqlclosecheck`, `rowserrcheck`, `noctx` | `go` → *Both ends of the wire*, `reference/database.md` |
| errors compared with `errors.Is`/`As` | `errorlint` | `go` → *Errors* |
| no SQL built by string, tokens from `crypto/rand` | `gosec` `G201`, `G202`, `G404` | `go` → `reference/security.md` |
| no `DefaultServeMux`, no `net/http/pprof` in the binary | `forbidigo` (`http.Handle`, `http.HandleFunc`), `depguard` | `go-fullstack-builder`; `go` → *What the binary exposes* |
| `os.Exit` / `log.Fatal` only in `main` | `revive` `deep-exit` | `go-fullstack-builder` → *Shutdown* |

## Scripts — a task in the repo's gate
| rule | mechanism | backs |
|---|---|---|
| an applied migration is never edited | `git diff --diff-filter=M <base> -- <migrations dir>` fails the task | `postgres-architect`, `sqlite-architect`; `drizzle` → migrations |
| every SQLite `CREATE TABLE` is `STRICT` | grep over the migrations dir | `sqlite` → *Types* |
