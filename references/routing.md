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
| Go, `go.mod` serving a React SPA — `net/http` handlers/middleware, the JSON contract, embed + serve the built app, **and** the SPA's typed client/query hooks/route glue (whole request path) | `go-fullstack-builder` |
| React **component implementation** — pages/sections/interactive UI as props-in/callbacks-out `.tsx` (RR7, Next, TanStack Start, or Go-served repo) | `react-ui-builder` |
| Svelte **component implementation** — pages/sections/interactive UI as props-in/callbacks-out `.svelte` | `svelte-ui-builder` |
| **Vanilla custom element / shadow DOM** — an embeddable widget for a page the team doesn't control, a design system consumed by more than one stack, or a repo that already defines custom elements | `web-components-builder` |
| Sanity, `sanity` / `@sanity/*` / `next-sanity` | `sanity-builder` |
| Cloudflare Workers / Pages / `wrangler` / bindings / D1 / KV / R2 / Durable Objects / Queues / framework-on-Workers adapter | `cloudflare-builder` |
| slow page / CWV / caching / bundle (post-build) | `vercel-perf-optimizer` |
| Vercel platform-ops: deploy/CI-CD, env/secrets, `vercel.json`, Functions/edge runtime, Cron, domains, Firewall/WAF, AI Gateway, storage provisioning | `vercel-platform-engineer` |
| Fly.io platform-ops: `fly deploy` / `fly.toml`, the `Dockerfile`, Machines + scaling, Volumes, `fly secrets`, regions, private networking, MPG/Tigris provisioning | `fly-platform-engineer` |
| Postgres / Drizzle / Prisma / postgres.js | `postgres-architect` |
| embedded SQLite — a local `.db` file the app opens directly (`better-sqlite3` / `node:sqlite` / `bun:sqlite`, Drizzle's `sqlite` dialect) | `sqlite-architect` |
| auth / login / signup / sessions / social-OAuth / SSO / `better-auth` — the **server + session** half | `better-auth-specialist` |
| payments / checkout / subscriptions / paywall or plan-gating / refunds / Stripe webhooks / Connect / `stripe` — the **server + money** half | `stripe-specialist` |
| PayPal or Venmo checkout / PayPal subscriptions + billing plans / order capture / refunds / PayPal webhooks / `@paypal/paypal-js` / `@paypal/paypal-server-sdk` — the **server + money** half | `paypal-specialist` |
| user research / user flows / IA / usability critique / UX copy / the conventions file the design agent works from (corpus **or** header) | `ux-designer` |
| design/landing/marketing/portfolio UI — **no system yet** | the chain in *UI from scratch*, Step 2 |
| a look that is genuinely unsettled — bootstrap directions, a system change the user wants to see, a marketing or print one-off — or a **coverage read** of the ledger before feature work | `ui-designer` (drafts + publishes the canvas; you put it to the user) |
| UI feature or screen — **system exists** | `ux-designer` (flow pass) → UI builder against the existing tokens (*UI on an existing system*, Step 2) |
| a builder returned a **named gap** | the **user**, with the token name it would need. No seat fills it, and no seat extends the system |
| needs generated/enhanced image assets (hero art, textures, OG, restyle a photo) | `graphic-designer` → builder (**preflight** below) |
| correctness/quality review of a diff | `code-reviewer` (or `kru/code-reviewer` skill inline) |
| module/interface design, refactor with fuzzy boundaries, "where's the seam", coupling/testability | `architecture-reviewer` (design mode, before builder) |
| structural-integrity gate on a change (boundary erosion, coupling drift) | `architecture-reviewer` (review mode, after builder) |
| coverage sweep or fan-out across many files; repair a red/flaky suite; an exempt seat's logic-dense output; a repo with no testing conventions captured yet | `test-writer` |
| repo tooling: pnpm workspaces/catalogs/lockfile · `turbo.json` monorepo task graph + caching · Biome/ESLint/Prettier lint+format · wiring a new package into the graph | `toolchain-engineer` |
| repo-wide TypeScript infrastructure: strict migration, monorepo project references, type-perf profiling | a general agent with the `typescript` skill loaded |
| ambiguous or high-blast-radius change the user wants stress-tested and written down before building | **`/kru/brief`** — name it for the user to type; it is not a seat you spawn |
| something the user wants but doesn't want done now — "not yet," "remember this for later" | **`/kru/todo`** — user-invoked, so name it in one line; mid-task it's your Step 4.5 `TODOS.md` capture |
| something *wrong* the user wants recorded before it evaporates — a bug they just hit, not being fixed now | **`/kru/issue`** — user-invoked, same deal; mid-task it's your Step 4.5 `issues/` capture |
| the user wants to work what's parked or what's broken — the `TODOS.md` lines, the open defect files | **`/kru/todos`** / **`/kru/issues`** — user-invoked; each reconciles the store against the code, scores, proposes a batch and waits for the pick before building. Name the one they want; only the user can fire them. Mid-task you already read the store directly when a step needs it |
| work too big for one context / needs a durable plan of record / decompose a spec into parallelizable slices | `planner` (Step 2.6) |
| **no specialist matches** | the **user**, naming the seat it would need (*Handling gaps*); the general path only on their say-so |

**Contested lanes — the tie-breaks the table can't hold.** Each seat's own definition states its half; read that rather than a copy, and reach for these when two rows look plausible:
- **SQLite three ways**: an embedded `.db` file the app opens = `sqlite-architect` · **D1** = `cloudflare-builder` (it's CF's SQLite) · a Postgres server = `postgres-architect`.
- **Vercel two ways**: app code = the framework builder · deploy/env/infra = `vercel-platform-engineer` · speed and caching-for-speed = `vercel-perf-optimizer`.
- **Three platform lanes, split by runtime shape, not by vendor preference**: Vercel = `vercel-platform-engineer` · the Workers runtime = `cloudflare-builder` · a **long-lived VM with a persistent disk** (a container that has to be a container, a background worker, scale-to-zero with state) = `fly-platform-engineer`. App code is the framework builder's in all three.
- **Anything that renders** crosses *the UI seam* — see below. The domain seats (`stripe-specialist`, `paypal-specialist`, `better-auth-specialist`, the data seats) each name their handoff in a **Builder owns** line.
- **Two payment rails, split by provider**: Stripe = `stripe-specialist` · PayPal/Venmo = `paypal-specialist`. A repo can run both, and a change touching each is two dispatches — neither provider's object graph, webhook vocabulary or idempotency mechanism transfers. The record they both settle into (the order/donation row, the shared settlement math) is the data seat's and the framework builder's.
- **`web-components-builder`'s trigger is the consumer, not the markup**: UI inside a React or Svelte app stays with that stack's UI builder.
- **`graphic-designer` preflight**: generation needs `GOOGLE_API_KEY` + a one-time `npm install` in the plugin dir (video/cutouts also need ffmpeg/rembg). Before routing — or the moment the specialist returns `BLOCKED (setup)` — **surface the exact setup to the user** and let them choose: set it up for real assets, or proceed with the static fallback. Never silently degrade to a placeholder without telling them the real-asset path exists.

## Conditional skills — the library choice inside a lane

Ambient craft — TypeScript, `tdd` + `testing`, UI patterns, modern CSS/HTML, Ark UI, motion — loads on
every dispatch in every repo, and a skill a seat *always* loads is already carried by that seat's own
line. What earns deriving is the **library choice inside a lane**: the seat prompt carries one
*libraries* section that loads the skill the brief names, and what these skills catch is a call that
*succeeds* and returns wrong data.

| Detected in the repo | Skill |
|---|---|
| `drizzle-orm` | `drizzle` |
| `zod` | `zod` |
| `valibot` | `valibot` |
| `@conform-to/react` | `conform` |
| `react-hook-form` | `react-hook-form` |
| `xstate` | `xstate` |
| `@xstate/react` | `xstate-react` |
| `vitest` | `vitest` — carried by the `testing` skill's discovery step, so every seat that writes a test reaches it |
| `@testing-library/react` or `@testing-library/svelte` | `testing-library` — carried by the same discovery step |
| `sveltekit-superforms` | `superforms` |
| `panda.config.*` or a `styled-system/` directory | `panda-css` |
| `components.json` | `shadcn` — the repo has settled its primitive library, and `ark-ui`'s reach-for section is where that rule lives |
| `charmbracelet/bubbletea` (`go.mod`) · `ratatui` (`Cargo.toml`) · `textual` (`pyproject.toml`) · `ink` (`package.json`) | `tui-design` — the repo draws a terminal screen rather than printing to one |

**The TUI frameworks travel in sets**, and it's the framework that answers, not a companion: Bubble Tea brings `lipgloss` + `bubbles` (+ `huh`, `glamour`, `x/ansi`); Ratatui brings `crossterm` + `color-eyre` (+ `tui-textarea`, `ratatui-image`); Textual brings `rich` + `textual-dev`; Ink brings `@inkjs/ui` + `ink-testing-library`. A companion alone is a different answer — `rich` or `lipgloss` on its own is *formatted output* (`ui-patterns` → `reference/terminal-output.md`), `crossterm` on its own is raw terminal control, and neither is this skill.

Which seats carry each: `ROSTER.md` → *Reused, not owned*.

**Answered *yes* only.** The sheet holds what this repo *is*; a library it doesn't have is an absence.

**The answer outruns the seat that owns the conditional**, which is half of why it is written down: a
skill the boundary seats carry reaches a UI builder writing a schema in a component only once the repo
says it is on that library.
