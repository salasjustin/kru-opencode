# Routing — detected stack to seat and skill

The derivation tables, with three callers. **`/kru/setup`** runs them once over a repo and
writes the answers into that repo's block — that block is then the repo's routing, in prose, and
re-running the tables is what a block exists to retire. **`/kru/roster`** writes this file when
a seat is hired or retired, or a conditional skill authored. **`lead`** runs them where no block has
resolved them, or where a slice reaches a stack the block never covered. A repo whose block already
names the seat and its skills has this question answered — take the answer.

| Detected / needed | Specialist |
|---|---|
| Svelte, `@sveltejs/kit` — routes, `load`, form actions, hooks, endpoints (network boundary) | `sveltekit-builder` |
| React Router, `@react-router/*` / `react-router` — route modules, loaders, actions, fetchers (network boundary) | `react-router-builder` |
| Next.js, `next` (App Router) — pages/layouts as fetch+compose, Server Actions, route handlers, caching, middleware (network boundary) | `nextjs-builder` |
| TanStack Start, `@tanstack/react-start` — file routes, `createServerFn`, server routes, middleware, loaders/`beforeLoad`, SSR/RSC (network boundary); also `@tanstack/react-router` routing in a Start-less SPA | `tanstack-start-builder` |
| Python — `pyproject.toml` / `.py`: an MCP server (the official `mcp` SDK), a library's public API, a CLI, packaging, or a red `ruff`/`mypy`/`pytest` gate | `python-developer` |
| A Vite plugin (a package exporting a `Plugin` for someone's `vite.config` — dev-server-only code, page script injection, dev endpoints), a stdio MCP server in TypeScript (`@modelcontextprotocol/server` / `@modelcontextprotocol/sdk`) incl. a opencode channel (`claude/channel`), or a small Node/TS library — the code and the package's own pnpm/TS/Biome/Vitest scaffold | `extension-builder` |
| A Node program a person, shell or scheduler runs — a CLI and its `bin`, a script, a queue worker, a cron job, a daemon: flags, stdout/stderr/exit codes, `--json`, stdin, env/config precedence, signals and clean shutdown | `node-developer` |
| Hono, `hono` — an API: routes, middleware, validators, `onError`/`notFound`, streaming/SSE, the exported `AppType` + `hc` client (any runtime; the runtime's config, bindings and deploy stay with its platform seat) | `hono-builder` |
| Go, `go.mod` serving a React SPA — `net/http` handlers/middleware, the JSON contract, embed + serve the built app, **and** the SPA's typed client/query hooks/route glue (whole request path) | `go-fullstack-builder` |
| React **component implementation** — pages/sections/interactive UI as props-in/callbacks-out `.tsx` (RR7, Next, TanStack Start, or Go-served repo) | `react-ui-builder` |
| Svelte **component implementation** — pages/sections/interactive UI as props-in/callbacks-out `.svelte` | `svelte-ui-builder` |
| **Vanilla custom element / shadow DOM** — an embeddable widget for a page the team doesn't control, a design system consumed by more than one stack, or a repo that already defines custom elements | `web-components-builder` |
| Sanity, `sanity` / `@sanity/*` / `next-sanity` | `sanity-builder` |
| Cloudflare Workers / Pages / `wrangler` / bindings / D1 / KV / R2 / Durable Objects / Queues / framework-on-Workers adapter — the runtime and its config; the app logic running on it (settlement, ledger posting) is the framework builder's and each processor adapter is its rail's | `cloudflare-builder` |
| slow page / CWV / caching / bundle (post-build) | `vercel-perf-optimizer` |
| Vercel platform-ops: deploy/CI-CD, env/secrets, `vercel.json`, Functions/edge runtime, Cron, domains, Firewall/WAF, AI Gateway, storage provisioning | `vercel-platform-engineer` |
| Fly.io platform-ops: `fly deploy` / `fly.toml`, the `Dockerfile`, Machines + scaling, Volumes, `fly secrets`, regions, private networking, MPG/Tigris provisioning | `fly-platform-engineer` |
| Postgres / Drizzle / Prisma / postgres.js | `postgres-architect` |
| Turso / libSQL — `@tursodatabase/*`, `@libsql/client`, `libsql`/`pyturso`/`tursogo`, or a feature needing a Turso Cloud database: driver, schema, migrations, queries, sync, tokens, Cloud databases/branches | `turso-specialist` |
| embedded SQLite — a local `.db` file the app opens directly (`better-sqlite3` / `node:sqlite` / `bun:sqlite`, Drizzle's `sqlite` dialect) | `sqlite-architect` |
| auth / login / signup / sessions / social-OAuth / SSO / `better-auth` · `@neondatabase/auth` — the **server + session** half | `better-auth-specialist` |
| payments / checkout / subscriptions / paywall or plan-gating / refunds / Stripe webhooks / Connect / `stripe` — the **server + money** half | `stripe-specialist` |
| PayPal or Venmo checkout / PayPal subscriptions + billing plans / order capture / refunds / PayPal webhooks / `@paypal/paypal-js` / `@paypal/paypal-server-sdk` — the **server + money** half | `paypal-specialist` |
| DAF gifts / Chariot DAFpay / `<chariot-connect>` / `react-chariot-connect` / `@chariot-giving/typescript-sdk` / Chariot grants / Chariot webhooks + event subscriptions — the **server + grant** half | `chariot-specialist` |
| Crypto payments or donations via NOWPayments / `@nowpaymentsio/nowpayments-sdk-nodejs` / `api.nowpayments.io` / pay-currency minimums + estimates / NOWPayments IPN callbacks — the **server + settlement** half | `nowpayments-specialist` |
| QuickBooks Online / `intuit-oauth` / Intuit OAuth connect / syncing settled payments, gifts or corrections into QuickBooks / reading its chart of accounts — the **adapter** half | `quickbooks-specialist` |
| Zapier integration / `zapier-platform-core` / `zapier-platform-cli` / `.zapierapprc` / Zapier triggers, actions or searches / REST-hook subscribe + unsubscribe endpoints / fanning an app event out to Zapier hooks — the **integration + its app endpoints** half | `zapier-specialist` |
| a **marketing page's words** — landing, home, pricing, feature or about: a new page before it reaches the designer or build, or one whose copy is placeholder or whose section order doesn't argue | `conversion-copywriter` → its deck goes to the **designer** via the PM, then the approved spec briefs the builder |
| user research / flows / IA / in-product UX copy / brand marks / generated imagery / UI mockups | **not routed** — the **external designer**; arrives in the PM's design spec (`references/design-spec.md`) |
| design/landing/marketing/portfolio UI — **no system yet** | *UI from scratch*, Step 2 — **PM must attach approved design spec** before builders |
| UI feature or screen — **system exists** | PM's **approved design spec** → UI builder (*UI on an existing system*, Step 2) |
| a builder returned a **named gap** | the **PM**, with the token name it would need. No seat fills it, and no seat extends the system |
| correctness/quality review of a diff | `code-reviewer` (or `kru/code-reviewer` skill inline) |
| module/interface design, refactor with fuzzy boundaries, "where's the seam", coupling/testability | `architecture-reviewer` (design mode, before builder) |
| structural-integrity gate on a change (boundary erosion, coupling drift) | `architecture-reviewer` (review mode, after builder) |
| coverage sweep or fan-out across many files; repair a red/flaky suite; an exempt seat's logic-dense output; a repo with no testing conventions captured yet | `test-writer` |
| repo tooling: pnpm workspaces/catalogs/lockfile · `turbo.json` monorepo task graph + caching · Biome/ESLint/Prettier lint+format · wiring a new package into the graph | `toolchain-engineer` |
| repo-wide TypeScript infrastructure: strict migration, monorepo project references, type-perf profiling | a general agent with the `typescript` skill loaded |
| a half-formed idea the user wants grilled without committing to a record | **`/kru/brainstorm`** — user-invoked; `brief`'s grill with nothing written, persisted as a `/kru/brief` on their go |
| ambiguous or high-blast-radius change the user wants stress-tested and written down before building | **`/kru/brief`** — name it for the user to type; it is not a seat you spawn |
| something the user wants but doesn't want done now — "not yet," "remember this for later" | **`/kru/todo`** — user-invoked, so name it in one line; mid-task it's your Step 4.5 `TODOS.md` capture |
| something *wrong* the user wants recorded before it evaporates — a bug they just hit, not being fixed now | **`/kru/issue`** — user-invoked, same deal; mid-task it's your Step 4.5 `issues/` capture |
| the user wants to work what's parked or what's broken — the `TODOS.md` lines, the open defect files | **`/kru/todos`** / **`/kru/issues`** — user-invoked; each reconciles the store against the code, scores, proposes a batch and waits for the pick before building. Name the one they want; only the user can fire them. Mid-task you already read the store directly when a step needs it |
| the user wants to know where their efforts stand, or to pick one back up — the `plan/<effort>/brief.md` files | **`/kru/briefs`** — user-invoked; reconciles every brief's ticks against git and the code, and waits for the pick before ticking, archiving or resuming |
| work too big for one context / needs a durable plan of record / decompose a spec into parallelizable slices | `planner` (Step 2.6) |
| **no specialist matches** | the **user**, naming the seat it would need (*Handling gaps*); the general path only on their say-so |

**Contested lanes — the tie-breaks the table can't hold.** Each seat's own definition states its half; read that rather than a copy, and reach for these when two rows look plausible:
- **Hono splits like a framework on Workers**: the Hono app = `hono-builder` · `wrangler` config, bindings, D1 and deploy = `cloudflare-builder` (on Node/Bun, the image and deploy = `fly-platform-engineer`) · the code calling its `hc` client = that consumer's seat.
- **SQLite four ways, split by the driver**: an embedded `.db` file on `better-sqlite3`/`node:sqlite`/`bun:sqlite` = `sqlite-architect` · **D1** = `cloudflare-builder` (it's CF's SQLite) · **Turso/libSQL**, local, Cloud or synced = `turso-specialist` · a Postgres server = `postgres-architect`.
- **Vercel two ways**: app code = the framework builder · deploy/env/infra = `vercel-platform-engineer` · speed and caching-for-speed = `vercel-perf-optimizer`.
- **Three platform lanes, split by runtime shape, not by vendor preference**: Vercel = `vercel-platform-engineer` · the Workers runtime = `cloudflare-builder` · a **long-lived VM with a persistent disk** (a container that has to be a container, a background worker, scale-to-zero with state) = `fly-platform-engineer`. App code is the framework builder's in all three.
- **Copy splits by the route's job, not by the file**: a route that persuades someone who has not committed is `conversion-copywriter`'s (the pricing page). Wording and flows on product screens are in the **design spec** from the designer — the lead does not dispatch a copy seat for them. A page that already ships and reads badly is the user's `/copy-editing`; one that converts badly is their `/cro`.
- **Anything that renders** crosses *the UI seam* — see below. The domain seats (`stripe-specialist`, `paypal-specialist`, `chariot-specialist`, `nowpayments-specialist`, `better-auth-specialist`, the data seats) each name their handoff in a **Builder owns** line.
- **Payment rails, split by provider**: Stripe = `stripe-specialist` · PayPal/Venmo = `paypal-specialist` · Chariot DAF grants = `chariot-specialist` · NOWPayments crypto = `nowpayments-specialist`. A repo can run several, and a change touching each is one dispatch per rail — no provider's object graph, webhook vocabulary or idempotency mechanism transfers. The record they settle into (the order/donation row, the shared settlement math) is the data seat's and the framework builder's.
- **Accounting sits downstream of every rail**: posting a settled record into QuickBooks is `quickbooks-specialist`'s adapter; the queue, cron and OAuth routes that drive it stay with the platform seat and framework builder.
- **Zapier splits like accounting**: the app's own integration and the endpoints it calls are `zapier-specialist`'s; the queue firing the fan-out stays with the platform seat and the key a user pastes with the identity owner.
- **An email template belongs to the seat that sends it**: a React Email `.tsx` is the framework builder's, beside the `render()` and the send, not `react-ui-builder`'s. It renders once on the server into an inbox, never mounts in the app, and the token file's CSS variables never reach it.
- **Tooling config splits by what ships**: a standalone package's own `package.json`, `tsconfig.json`, `biome.json` and Vitest config = `extension-builder` (they ship with the package) · a monorepo's workspace graph, Turborepo, or an app repo's lint/format = `toolchain-engineer`. A React UI such a package shows inside an app is `react-ui-builder`'s.
- **Node splits by who calls it**: a person, shell or scheduler (a CLI, script, worker, daemon) = `node-developer` · another program that imports or loads it (a Vite plugin, an MCP server, a library) = `extension-builder` · an HTTP request = `hono-builder` or the framework builder. A CLI that wraps a library splits on the same seam: the `bin` and its contract are `node-developer`'s, the library's exports `extension-builder`'s.
- **`web-components-builder`'s trigger is the consumer, not the markup**: UI inside a React or Svelte app stays with that stack's UI builder.

## Conditional skills — the library choice inside a lane

Ambient craft — TypeScript, `tdd` + `testing`, UI patterns, modern CSS/HTML, Ark UI, motion — loads on
every dispatch in every repo, and a skill a seat *always* loads is already carried by that seat's own
line. What earns deriving is the **library choice inside a lane**, and what these skills catch is a
call that *succeeds* and returns wrong data.

**One table, three channels.** The answer reaches a seat in the brief, or on the `skills` line a
`/kru/setup` sheet writes into the repo's always-loaded docs; a seat that gets neither reads
`package.json` against the table below. Past one conditional, a seat carries a single *libraries*
section naming those three channels rather than a section per library, and keeps a named section only
for a library it has something of its own to say about — a seam that library bends
(`svelte-ui-builder` on Superforms), or a playbook with no skill to load (`react-ui-builder` on
TanStack Table). So adding a skill here is a row plus the skill, and the seat files hold still.

| Detected in the repo | Skill |
|---|---|
| `drizzle-orm` | `drizzle` |
| `@neondatabase/serverless` | `neon` — the driver seam beneath whatever ORM sits on it, so a Drizzle-on-Neon repo answers yes twice and the brief names both |
| `zod` | `zod` |
| `valibot` | `valibot` |
| `@conform-to/react` | `conform` |
| `react-hook-form` | `react-hook-form` |
| `xstate` | `xstate` |
| `@xstate/react` | `xstate-react` |
| `react-email` or `@react-email/*` | `react-email` |
| `vitest` | `vitest` — carried by the `testing` skill's discovery step, so every seat that writes a test reaches it |
| `@testing-library/react` or `@testing-library/svelte` | `testing-library` — carried by the same discovery step |
| `msw` | `msw` — carried by the same discovery step |
| `sveltekit-superforms` | `superforms` |
| `panda.config.*` or a `styled-system/` directory | `panda-css` |
| `tailwindcss` | `tailwind` — v4, and `v3-lts` is a different product rather than a version behind, so the brief names the installed major |
| `components.json` | `shadcn` — the repo has settled its primitive library, and `ark-ui`'s reach-for section is where that rule lives |
| `@tanstack/react-table` | **no kru skill** — the playbook ships in the installed `react-table` and `table-core` packages, and the brief names both `skills/` directories |
| `charmbracelet/bubbletea` (`go.mod`) · `ratatui` (`Cargo.toml`) · `textual` (`pyproject.toml`) · `ink` (`package.json`) | `tui-design` — the repo draws a terminal screen rather than printing to one |
| a surface code the repo doesn't own calls — a versioned `/api/v<n>` route, an `openapi.*` document, API keys the app mints, or webhooks the app sends | `api-design` — a surface rather than a library, so the brief names it for a slice that builds the first one, before any of these exists to detect |

**The TUI frameworks travel in sets**, and it's the framework that answers, not a companion: Bubble Tea brings `lipgloss` + `bubbles` (+ `huh`, `glamour`, `x/ansi`); Ratatui brings `crossterm` + `color-eyre` (+ `tui-textarea`, `ratatui-image`); Textual brings `rich` + `textual-dev`; Ink brings `@inkjs/ui` + `ink-testing-library`. A companion alone is a different answer — `rich` or `lipgloss` on its own is *formatted output* (`ui-patterns` → `reference/terminal-output.md`), `crossterm` on its own is raw terminal control, and neither is this skill.

Which seats carry each: `ROSTER.md` → *Reused, not owned*.

**Answered *yes* only.** The sheet holds what this repo *is*; a library it doesn't have is an absence.

**The answer outruns the seat that owns the conditional**, which is half of why it is written down: a
skill the boundary seats carry reaches a UI builder writing a schema in a component only once the repo
says it is on that library.
