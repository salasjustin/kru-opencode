# Reviewed — the marks and the standing verdicts

## opencode

### Swept through

**2.1.295** — 2026-10-10, read back to 2.1.289. Installed: 2.1.295.

Previous: 2.1.288 — 2026-10-03, read back to 2.1.281. 2.1.280 — 2026-09-23, read back to 2.1.251. Before that: 2.1.250 — 2026-08-28, first sweep, read back to 2.1.200.

### Adopted

| Shipped | Feature | Wired into |
|---|---|---|
| 2.1.78 | `effort:` on plugin-shipped agents (`low`\|`medium`\|`high`\|`xhigh`\|`max`) | `agent/kru/*.md` frontmatter; policy in `ROSTER.md` → *Model tiers* |
| 2.1.248 | `experimental.cacheTtl: "1h"` per-agent prompt cache TTL | the re-dispatched seats' frontmatter (builders, `test-writer`, `code-reviewer`) |
| — | `claude plugin details <plugin>` — component inventory + projected always-on token cost | `skill/kru-roster/audit.md`, as the roster's context-load read |
| 2.1.218 · 2.1.223 | `kru/code-reviewer` runs as a background subagent, and with no level reuses the last one typed | `lead` SKILL.md → Step 4 |
| 2.1.261 | `/skill-doctor` — which loaded skills go unused and what each costs in context | `skill/kru-roster/audit.md` → *Context load*, beside `claude plugin details`, as a read the user types |
| 2.1.280 | Claude Opus 5.5 (`claude-opus-5-5`) — 1M context, $4/$20 per Mtok, $0.20 cache reads | the 33 opus-tier seats' `model:`; `ROSTER.md` → *Model tiers*; `roster/hire.md` + `audit.md` pin text; README → *Requirements* (model access, floor ≥ 2.1.280) |
| — | Claude Sonnet 5.5 (`claude-sonnet-5-5`) — same $2/$10 as Sonnet 5, ~30% faster, fewer tokens per task | the 3 sonnet-tier seats' `model:`, plus `test-writer`, `visual-reviewer`, `accessibility-reviewer`, `graphic-designer` moved down from opus; `ROSTER.md` → *Model tiers*; `roster/hire.md` + `audit.md` pin text; README → *Requirements* |
| 2.1.283 | `/doctor prompt-audit` — audits AGENTS.md, skills and agents for prompting written for older models; an installed plugin's files are reported, never edited | `skill/kru-roster/audit.md` → *Context load*, as a read the user types beside `/skill-doctor` |
| 2.1.286 | Correction, not a feature: no built-in `/verify` ships; the CLI runs a *project or user* skill named `verify` before a commit. `kru-tdd` and `kru-diagnosing-bugs` are this plugin's vendored skills, not built-ins | `ROSTER.md` intro, `lead` → `references/gates.md` → *Behavior*, `claude.md` surface table |
| 2.1.286 | opencode runs a project skill named `verify` before a non-docs commit | `skill/kru-setup/SKILL.md` → 1d writes `.claude/skills/verify/SKILL.md` from the sheet's `verify` line |
| 2.1.287 | *You should know* built-in mod — a side agent flagging mid-task what the turn missed | README → *Requirements* (recommended); `setup` cloud script enables it; `lead` → *Returns are input* triages its cards |
| 2.1.287 | Claude Mods — plugin function hooks with UI | `kru-board`, a row above the prompt naming the running seats; on trial as a session dev mod outside this repo, not yet shipped in the plugin |
| — | `userConfig` (values reach hooks as `CLAUDE_PLUGIN_OPTION_<KEY>`; `claude plugin configure` 2.1.286) | `package.json` → `KRU_STORE_REPO` + four `KRU_NO_*` switches; `scripts/kru-store.sh` maps each onto its unset env var |
| 2.1.290 | Correction: `kru/code-reviewer` at `medium` on Opus 5.5 / Sonnet 5.5 also reports cleanup and AGENTS.md-convention findings — not correctness only | `lead` → `references/gates.md` → *Correctness*; the comment pass stays the lead's (Block I isn't in AGENTS.md) |
| 2.1.293 | Claude Haiku 5.5 (`claude-haiku-5-5`) — $0.10/$0.50 per Mtok to 100k-token prompts, $0.50/$2.50 above; 1M context; retires no sooner than 2027-10-07 | `dispatch-auditor`'s `model:` moved down from sonnet, the one haiku seat; `ROSTER.md` → *Model tiers*; `scripts/audit.sh` pin regex; `roster/hire.md` + `audit.md` pin text; README → *Requirements* |
| — | Correction: `brainstorm-guard.sh` read any transcript line carrying an invocation, tool output included, and locked a session that never brainstormed | the anchor now matches only a string-content user turn; fixtures splice the name |

### Considered — the user's call

- **`hooks:` in agent frontmatter** (PreToolUse/PostToolUse/Stop, agent-scoped). The obvious target is the conformance gate, but that gate is built in the *target* repo at Phase 0 and keyed to that repo's token file — a plugin-level hook can't know it. Worth revisiting as a builder-authored hook written into the target repo's own `.claude/settings.json` alongside the test.
- **`isolation: worktree`** on builders — declarative parallel builds without collision. Against it: parallel worktrees plus `tsc` is the fan-out a machine budget in `~/.claude/CLAUDE.md` forbids.
- **`context: fork` + `background:`** on the read-only skills (`todos`, `issues`, `comment-fix`'s audit). Forked skills run in the background by default (2.1.218), which is the wrong shape for a list the user typed and is waiting on.
- **`claude plugin eval`** — `evals/**/case.yaml` with an `--ablation` arm scores the plugin against a no-plugin baseline, which is the only mechanical answer to *did the lead route to the right seat*. Shipped 2.1.269 and reachable on this install as of 2.1.280 (`--help` answers, no early-access reply). The cost is authoring and paying for the suite. Banked 2026-09-23: the user tracks it on a todo/branch of its own.

### Declined

- **`--restricted` / `CLAUDE_CODE_RESTRICTED`** — every seat here needs Bash or file writes.
- **`maxTurns` on agents** — a builder truncated mid-change costs more than the runaway it prevents; the per-session spawn caps already bound the fan-out.
- **`disallowedTools` on agents** — the seats that need a bound already carry an explicit `tools:` allowlist.
- **`modelPicker`, `modelPricing`, `promptCacheTtl`/`subagentPromptCacheTtl`, `spinnerTipsOverride`** — user or managed settings, outside a plugin's reach.
- **Cross-session a `task` call carrying the prior `task_id` / `ListAgents`** — the lead already owns its subagents' results; peer sessions are a workflow the team doesn't run.
- **`omitClaudeMd`** (2.1.271) — the machine budget, the comment standard and the repo's `/kru/setup` sheet reach seats only through AGENTS.md (`lead` SKILL.md → *Ambient blocks*). `dispatch-auditor`, which reads only the ledger, was the one candidate; the user declined it 2026-09-23.
- **`claude plugin validate --json`, `plugin install|update --json` / `--accept-command`, `--plugin-dir` over a folder of plugins** — no sweep or audit step here parses their output.
- **`CLAUDE_CODE_SUBAGENT_MODEL` / `_FORCE`** (2.1.251 · 2.1.257) — user env. As of 2.1.251 a seat's `model:` wins over the non-forced one, which is what the pins assume.
- **`PreModelSwitch` / `PostModelSwitch` hooks, the `PermissionRequest` agent-hook removal** — the plugin ships no model-switch or `PermissionRequest` hook.
- **Current, no line moves:** subagent returns now arrive under a subagent-output header (2.1.277; `lead` → *Returns are input* still holds). `TaskOutput` was removed (2.1.277), and no team file names it. `kru/code-reviewer` uses leaner inline prompts on untuned models (2.1.274); the background-run claim in `gates.md` still holds.
- **`SendFeedback`, `/usage-credits`, self-hosted runner, GitLab marketplaces + MR support, `archive` plugin source, IDE and terminal rendering, managed/enterprise settings, provider plumbing** — no surface in this repo.
- **`/code-review --max-findings`** (2.1.288), **agent-teams plugin-agent fix**, **`claude plugin validate` MCP checks**, foreground-subagent task-tools fix — no line moves: `lead` passes no finding cap, the team runs no agent teams, the plugin ships no MCP server, and `check-task-tools.sh` still covers a session with the tools off.
- **`onFailure: "block"` on command hooks** (2.1.295) — the gates (`require-lead`, `check-handoff`, `brainstorm-guard`) fail open on purpose: a gate that can't start would otherwise lock every tool call in the session.
- **Agent tool `effort` parameter** (2.1.292) — seat effort is policy in frontmatter (`ROSTER.md` → *Model tiers*); no routing rule asks for a per-dispatch override.
- **`claude plugin install --marketplace`** (2.1.292) — not in this install's `--help`; the two-line add + install works on every CLI above the floor.
- **Current, no line moves:** subagents preload ≤32 `skills:` (2.1.295; no seat uses the field). `<system-reminder>` escaped in hook output (2.1.292; no hook emits one). `prompt`/`agent` hook judging (2.1.294; plugin ships command hooks only). `claude plugin validate` README install-line advice and the marketplace-manifest fix (2.1.289/2.1.295; validate passes clean). Skill `allowed-tools`/`effort` drop fixes, mod API additions (`$.ui.notify`, `isDeferred`, `agent.spawn`, `tool.check` `agentId`; `kru-board` isn't shipped), `subagentStatusLine` `agentType`.
- **Plan mode under `/kru/brainstorm`** — the user rejects it: every piece of feedback re-raises the plan-approval prompt. `brainstorm-guard.sh` stays, its anchor fixed.

## Vendored skills

### Swept through

**2026-10-10**. Previous: 2026-10-05 (mattpocock only, v1.3.1); 2026-09-23, first sweep. Tag-pinned copies are compared tag to tag. Copies with no recorded sha were diffed file by file against the upstream head.

| Skill | Recorded | Upstream head | Verdict |
|---|---|---|---|
| `codebase-design` · `tdd` · `diagnosing-bugs` · `domain-modeling` · `to-spec` · `to-tickets` · `wayfinder` · `grilling` · `writing-for-agents` | mattpocock v1.3.1 · 24fe0ef | v1.3.1 (main 49dd158, untagged) | **Current.** No tag above v1.3.1. Changesets queued on main touch `diagnosing-bugs`, `tdd`, `to-tickets`, `wayfinder`, `grilling`: expect a re-sync at the next tag. |
| `accessibility-review` · `user-research` · `research-synthesis` · `ux-copy` | knowledge-work design v1.2.0 · 15898ec | 2d6f7e2 / 4fa3cb9 (2026-03) | **Current.** |
| `copywriting` | marketingskills · 5b2c000 | 12188f1 | **Re-sync.** `SKILL.md` 2.1.0 adds *No AI Tells* (never-write list, swap test, `[NEED: …]`, self-check); new `references/ai-tells.md`; `copy-frameworks.md` drops "Everything you need to"; em-dash purge elsewhere. Re-apply provenance comment + trimmed description; `evals/` stays out. The unsourced "+81%" stats remain flagged. |
| `copy-editing` | marketingskills · 286d371 | b7fb899 | **Re-sync**, with `copywriting` (points at its `ai-tells.md`). `SKILL.md` 2.1.1: "replace with the fact", *AI-Tell Check* pass; `references/checklist.md` *AI Tells*; `content-refresh.md` SERP gap analysis. Re-apply provenance comment + trimmed description. |
| `cro` | marketingskills · 286d371 | e88ace7 | **Re-sync.** `SKILL.md` 2.0.3 *Reference Routing* table; `references/form.md` enrichment examples Clearbit → HubSpot Breeze/Clay/Apollo. Re-apply provenance comment + trimmed description. |
| `emil-design-eng` · `animation-vocabulary` · `find-animation-opportunities` · `review-animations` · `improve-animations` | mark 85e8e23 (Decline) | 85e8e23 | **Current.** The Decline stands. |
| `cloudflare` | cloudflare/skills · 320fbbc | a18ffe2 | **Re-sync + re-adapt.** Upstream: `/index.md` suffix on every docs link (41e0d19), `llms.txt` as docs entry, Pipelines/R2 Data Catalog/R2 SQL → Basin Pipelines/Catalog/SQL pointing at `basin`, new K2 Streams row → `k2`, twelve reference dirs deleted for docs links (f39e641/3055be5/02552fd), moved `containers/*` + `tunnel/*` URLs. Local: strip the declined `cf`-first section, re-apply provenance, `user-invocable: false`, `LICENSE`; delete the twelve local dirs. |
| `wrangler` · `durable-objects` · `nextjs-on-cloudflare` | 320fbbc / b052c32 | 41e0d19 | **Re-sync** (link suffix only), to keep the group on one pin. `wrangler`'s `cf` gate line stays stripped; `nextjs-on-cloudflare` keeps its trimmed description. |
| `workers-best-practices` | b052c32 | 41e0d19 | **Re-sync.** Link suffix in `SKILL.md` + three references; DO KV anchor `#put-1` → `#do-kv-async-put`. |
| `agents-sdk` | b052c32 | 41e0d19 | **Re-sync.** Agents docs restructured: every `/agents/api-reference/*` link in `SKILL.md` and 11 references moves to `/agents/runtime/…`, `/agents/communication-channels/`, `/agents/tools/`, `/agents/harnesses/think/`. Local fetch targets were stale. |
| `cloudflare` · `wrangler` `cf` gate | gate b90d284 · 5929c29 | cf 1.0.0-beta.14 | **Decline holds, re-check each sweep.** cloudflare/cf #197 #199 #200 #68 open; #198 moved to workers-sdk#16126, open. React Router `--mode` not re-checked. |
| `hono` | honojs/skills · 8b1938b | 5becff4 | **Re-sync + re-adapt.** 5becff4 rewrites the CLI section for `@hono/cli` 1.0.0-rc.0: `npx hono agent-context` is gone from `@next` (the copy was broken), verify with `--help`, app file passed to every command, `--runtime workerd` takes no file; type notes for `c.req.query()`/`c.req.json<T>()`. Taken verbatim: upstream's `@hono/cloudflare-workers` import works on today's `latest` (adapter 1.0.1 peers `hono >=4.13.9 \|\| ^5`), so no re-adapt. |
| `turso-db` · `turso-cloud` | tursodatabase/agent-skills · 34ced52 | 34ced52 | **Current.** |
| `turborepo` | vercel/turborepo · 53629a0 (2.11.3) | b19f6a5 | **Consider.** b19f6a5 cuts the skill to a 26-line pointer at `node_modules/turbo/docs/README.md` (bundled from turbo 2.11.5) and deletes `command/` + `references/`. Taking it drops the offline playbook for repos on turbo < 2.11.5 or before install. |
| `shadcn` | shadcn-ui/ui path · c257f68 | 2d3f1cd | **Re-sync.** *Design Systems from DESIGN.md* section; new `design-system.md`, `design-system-page.md`, `scripts/showcase-coverage.mjs`, `assets/showcase/{color-pair.tsx,state-matrix.tsx,preview-states.css}` (code, taken); `customization.md` pinned-radius line. `evals/` and `assets/*.png` stay out. |
| `webgpu-threejs-tsl` | dgreenheck · af2319b | af2319b | **Current.** |
| `algorithmic-art` | anthropics/skills · b9e19e6 | b9e19e6 | **Current.** |
| `react-router` | remix-run · 8f364c8 | 8f364c8 | **Current.** |
| `local-browser` | locally authored | — | Not applicable. |

### Considered — the user's call

- **`turborepo` → bundled-docs pointer** (row above).
- **cloudflare `basin` · `k2`** (32fcd7b): after the re-sync the `cloudflare` table routes Basin and K2 Streams to skills this team doesn't carry.
- **mattpocock v1.3 new siblings**: `implement-spec`, `pr`, `retro`; `in-progress/chief-of-staff` on main, untagged. `implement-spec` overlaps the lead's frontier dispatch, `retro` overlaps `/kru/roster learn`; `pr` has no counterpart here.
- **emilkowalski new siblings**: `animate`, `pick-ui-library`, `prototype`, `ask-sonner`, `expo`, `write-swift`, `mobile-native`. `animate` and `pick-ui-library` sit nearest the UI builders' motion and primitive lanes.

### For `/kru/roster audit`

- `SOURCES.md` Hono row names `npx hono agent-context`, gone from `@hono/cli@next`.
- `shadcn`'s exclusion stays `assets/*.png` only; `assets/showcase/` is code.
- `agents-sdk`, `workers-best-practices`, `nextjs-on-cloudflare` provenance comments carry no sha; b052c32 is only in `SOURCES.md`.
- `user-invocable: false` (and `disable-model-invocation: true` on `improve-animations`) isn't listed as a re-apply deviation in most comments.
- `turborepo`, `algorithmic-art` and `react-router` have no sha in their comments.

## Libraries

### Swept through

**2026-10-10**. Previous: 2026-09-23, first sweep. Sources: registries, release notes for each range above its pin. Nothing installed.

| Skill | Pin | Latest (date) | Delta | Verdict · claims to re-verify |
|---|---|---|---|---|
| `superforms` | 2.30.2 + kit 2.70.2, svelte 5.56.8, zod 4.4.3 | **3.0.0** (10-04) · kit **3.0.1** (10-06) | **major**; kit **major** | **Re-verified 2026-10-10 on 3.0.0 + kit 3.0.1** (svelte 5.57.2, zod 4.6.5); premise moved to Superforms 3 on SvelteKit 3. ~40 claims: 31 held, 7 rewritten (all already wrong on 2.30.2, checked against a Kit 2 baseline): `invalidateAll: false` belongs on the submitting form; Superforms 3 still calls the deprecated `invalidateAll()`, wiping `page.state`; a shared id lands the response on the first-constructed form; bare `curl -X POST` gets 415; Node 24's body-consumed message; URL-sourced forms show errors; `resetForm` reverts to the construction value. New `reference/migration.md`: bump Superforms before Kit, enhanced submits now carry the action's HTTP status, `$lib` → `#lib`, cross-origin POST needs a `Content-Type`. Not rerun: password-manager taint, snapshot across back/forward. |
| `react-hook-form` | 7.88.0 + resolvers 5.9.1 | 7.89.0 (09-26) | minor (threshold: minor) | **Re-verified 2026-10-10 on 7.89.0** (split pin). Every named claim held: Proxy short-circuit, `isValid` resolver counts (0 / 3), `setValue` silence, `reset()`/`values`, `useFieldArray` ids and snapshot, `fieldState`. The rest stays on 7.88.0. |
| `react-email` | 6.9.5 + render 2.1.0 | 6.11.1 (10-06) | 2 minors (threshold: minor) | **Re-verified 2026-10-10 on 6.11.1** (+ `@react-email/ui`, react 19.3.0, resend 6.32.1). 13 claims held. Changed: `sm:` under `pixelBasedPreset` now converts sizes to px (breakpoint stays rem) and `render()` throws without `<Head />` inside `<Tailwind>`; the preview shows the plain-text part in its code panel's `md` tab. Nodemailer/SES lines not rerun (outside the library). |
| `neon` | serverless 1.1.0 + drizzle-orm 0.45.2 | 1.2.0 (10-01) · 0.45.4 | minor; patch | **Re-verified 2026-10-10 on 1.2.0** (stubbed `fetchFunction`, no live endpoint; split pin). All three claims hold; `neon()` keeps port/params, only `pool.query` drops them. New trap: a function `password` is never called on the `pool.query` HTTP path (its source text is sent as the password). WebSocket half and Drizzle leak stay on the 1.1.0/0.45.2 pin. |
| `tui-design` | docs-verified 2026-09-11; Ink 7.1.1, Bubble Tea v2.0.9 | Ink **8.0.0** (10-03) · bubbletea v2.1.0 | Ink **major** | **Re-verified 2026-10-10, Ink half, on 8.0.0** (react 19.3.0, ink-testing-library 4.0.0; split pin). Wrong and rewritten: capping `<Static>` items (`slice(-100)`) silently stops printing. Changed: `useWindowSize()` is the resize gate (`stdout.columns` no longer types); `alternateScreen` drops the last frame and teardown output and is ignored when piped. Held: raw mode, `isRawModeSupported`, `<Static>` render-once. Added: React ≥19.3, Node ≥22 floor. Bubble Tea: no hits. |
| `ark-ui` | `@ark-ui/react@5.37.2` (inline) | 5.39.3 (10-05) | 2 minors | **Re-verified 2026-10-10 on 5.39.3** (Browser Mode, react 19.3.0). Both pinned traps gone: Escape closes on the first keydown (zag registers it synchronously on layer mount), and a click inside an open modal passes the `Dialog.Backdrop` in all three layouts. Section *Under a browser-mode test* deleted with them; the skill now carries no pin. |
| `panda-css` | 2.1.0 + vite plugin 2.1.0 | 2.1.2 (10-06) | patch | **Current.** a63cb20, b220f62, 24718f4 read; none contradict. |
| `msw` | 3.0.1 | 3.0.2 (10-03) | patch | **Current.** |
| `vitest` | 5.0.0 | 5.0.3 (09-30) | patch | **Current.** 5.0.2 `agent` respects `--silent`, adjacent to `SKILL.md:26`, not contradicting. |
| `testing-library` | RTL 16.3.3 | 16.3.3 | none | **Current.** |
| `conform` | 1.21.1 | 1.21.1 | none | **Current.** |
| `zod` · `valibot` · `xstate` · `xstate-react` | 4.6.5 · 1.5.0 · 5.33.2 · 6.1.0 | same | none | **Current.** |
| `drizzle` | As of 2026-07-29: `latest` 0.45.2, site documents 1.0 rc.4 | `latest` 0.45.4 (10-08) · `rc` 1.0.0-rc.4 | patch, premise holds | **Current.** Next Refresh: table 0.45.2/0.31.10 → 0.45.4/0.31.11; `reference/postgres.md` driver list (0.45.3 Netlify DB); `.prepare(name)` on `postgres-js` fixed 0.45.4. |
| `tailwind` | 4.3.3 | 4.3.3 | none | **Current.** `v3-lts` claim holds. |
| `node` | v24.20.0 | v24.21.0 (09-07) | minor | **Current.** Undici 7.29.1 not checked line by line against the fetch-timeout claims. Node 26 enters Active LTS this month: premise check at next Refresh. |
| `cli` | Node 24.20.0 · 3.14.3 · go1.26.1 · commander 15.0.0 · typer 0.27.2 · cobra v1.10.2 | 24.21.0 · 3.14.8 · go1.27.2 · 15.0.0 · 0.27.3 · v1.10.2 | minor / feature / patch | **Current.** go1.27 doesn't touch `flag`/`os/signal`. |
| `go` | go1.27.1 | go1.27.2 (10-08) | patch | **Current.** |
| `python` | 3.14.3 · ruff 0.16.5 · mcp 2.1.1 | 3.14.8 · 0.16.10 · mcp 2.3.0 | patch · patch · 2 minors | **Current.** mcp 2.3.0 changes hit no skill line. |
| `postgres` · `sql` | PostgreSQL 18.3 (+ SQLite 3.43.2) | 18.6 · 3.54.0 | patch | **Current.** |

### For `/kru/roster audit`

- No threshold on the pin line: `panda-css`, `msw`, `vitest`, `node`, `cli`, `tailwind`, `go`, `python`, `postgres`, `sql`.
- Pin lines step 1's greps miss: `tailwind` ("All claims below reproduced on…"), `sql` ("Claims marked *reproduced* ran on…"), `cli` (non-bold). `panda-css` has no `^As of` line.
- No pin: `sqlite`, `typescript`, `python`'s hatchling, `ark-ui` (its only pinned claims were removed 2026-10-10; the anatomy claim that a dialog missing `Backdrop`/`Positioner`/`CloseTrigger` loses focus-trap and Escape was never reproduced).
- Library traps in seat files sit outside this sweep: `cloudflare-builder` (`@cloudflare/vitest-pool-workers`), `sveltekit-builder` (kit 3, `$app/stores` removed in kit 3.0.0), `vercel-platform-engineer` (TS 7 under `@vercel/node`).
- `cli` pins go1.26.1 while `go` pins go1.27.1.

## Plugin-installed skills

A fourth ground, which `SKILL.md`'s dispatch table has no sweep for — recorded here because the
first sweep of it found a live breakage. A seat's source chain may name a skill shipped by
**another** plugin (every `vercel:*` name, and any pack installed rather than vendored). That
ground moves on the other plugin's release schedule, and a renamed or retired skill leaves the
seat's first rung resolving to nothing — at which point the chain fails silently into training
data, which is the failure the *Official source first* section exists to prevent. Nothing pins
these names but the seat files themselves.

### Swept through

`vercel` plugin **0.48.0** — swept 2026-09-17. All 33 shipped skill names diffed against every
`vercel:*` name in `SOURCES.md` and in the three Vercel-touching seats.

| Named by a seat | State at 0.48.0 | Verdict |
|---|---|---|
| `vercel:performance-optimizer` | **absent** | **Adopt** — was `vercel-perf-optimizer`'s first rung and resolved to nothing. Its ground is split: `vercel:cdn-caching` for caching/ISR/PPR/`cacheReason`, `vercel:nextjs` → `references/{image,font,bundling,functions}.md` for the asset levers, `vercel:react-best-practices` → `rules/bundle-*.md`, `vercel:vercel-cli` → `references/monitoring-and-debugging.md`. Seat + row moved to those names. |
| the 16 other `vercel:*` names in seats | present | **Current.** |
| `vercel:bootstrap` · `vercel:vercel-connect` | present, unreferenced | **Adopt** into `vercel-platform-engineer` — provisioning order (it carries Neon's three provisioning routes and the `@vercel/postgres` sunset) and OIDC-scoped third-party tokens, the mechanism behind that seat's existing OIDC preference. |
| `vercel-services` · `microfrontends` · `turbopack` · `auth` · `verification` · `build-agents` · `vercel-agent` · `eve` · `next-forge` · `chat-sdk` · `ai-sdk` · `shadcn` · `access-protected-vercel-deployment` | present, unreferenced | **Consider** — each needs a routing call before it enters a chain. `turbopack` sits nearest `nextjs-builder`/`toolchain-engineer`; `auth` covers Clerk/Descope/Auth0 marketplace provisioning, a different product set from `better-auth-specialist`'s lane, so it is not that seat's by name alone. |
| `vercel:knowledge-update` | present | **Decline** as a chain entry — injected at session start by design, so naming it in a seat buys nothing. |
