# kru

*(said “crew”)*

An engineering team for **opencode**. A primary `kru` agent scopes the work, detects the stack, and
routes it to 31 specialist subagents — builders, reviewers, design, platform — each pinned to its
framework's official source rather than to training data, and each **on the model its seat is worth**
through opencode zen (`MODELS.md`).

You talk to the lead the way you'd talk to an engineering lead. It does the routing.

This is a **port of [kru](https://github.com/ap-justin/kru)**, the Claude Code original, tracking it
as a git remote: the fork's own rewrites live in `scripts/port.mjs` so an upstream merge is
re-normalized rather than hand-patched. What opencode has no equivalent for is in `PORTING.md`.

## Install
```
git clone https://github.com/ap-justin/kru-opencode
cd kru-opencode
node bin/kru-oc.mjs install          # copies into ~/.config/opencode
node bin/kru-oc.mjs doctor           # checks the install, the port, and the claude-code side
```
Then run `opencode` and **tab to the `kru` agent** — or make it the default with
`node bin/kru-oc.mjs install --default-agent`.

Install is a copy, not a symlink: the prompts carry absolute paths that only exist once a config dir
is known. The repo stays the source — edit, `node scripts/port.mjs`, then `kru-oc sync`.

### Alongside the Claude Code original
The two never collide. opencode reads `~/.config/opencode` and `~/.claude/skills`; the Claude plugin
lives in `~/.claude/plugins/cache`, which opencode never scans. What they **share on purpose** is the
state store at `~/.claude/kru/` — the same briefs, plans, tickets, todos and learnings inbox, so a
plan started in one harness continues in the other.

- **Already running kru, adding opencode** → `kru-oc install`. It reports the Claude-side version and
  warns when this fork's port is behind it.
- **Running this fork, adding Claude Code later** → `kru-oc claude` prints the two commands.
- **opencode only** → nothing else to do; the Claude side is never touched.

## Requirements
- **opencode 1.18 or newer**, and **node 22+** for the port and install scripts.
- **opencode zen access** to the five models the seats are pinned to: `claude-opus-5`, `kimi-k3`,
  `glm-5.3`, `glm-5.3-flash`, `gemini-3.8-flash`. Retier them in one place — `scripts/port.mjs` →
  `ZEN` — then re-port. The reasoning per tier is `MODELS.md`.
- **`jq`**, for the two shell gates. Without it they fail open and the team still runs, ungated.
- **The `chrome-devtools` MCP server**, for the visual and accessibility reviewers only; without it they audit from source. In `~/.config/opencode/opencode.json`, keyed exactly `chrome-devtools` (the key is the tool prefix the seats name):
  ```json
  {
    "mcp": {
      "chrome-devtools": {
        "type": "local",
        "enabled": true,
        "command": ["npx", "chrome-devtools-mcp@latest", "--headless=true", "--screenshotFormat=webp", "--screenshotMaxWidth=1440"]
      }
    }
  }
  ```
- **Context7**, for every seat that reads library docs — keyed exactly `context7`:
  ```json
  { "mcp": { "context7": { "type": "remote", "enabled": true, "url": "https://mcp.context7.com/mcp" } } }
  ```
- **Optional, for generated image/video assets:** `GOOGLE_API_KEY` (Google AI Studio) and a one-time
  `npm install` in this repo. Without them the `graphic-designer` seat reports what's missing
  and offers a fallback instead of shipping a placeholder.

## First run
In the repo you want the team to work on:

```
/kru/setup
```

It reads the repo — stack, framework versions, conventions, test setup, design system — and writes the
answers into that repo's `AGENTS.md`, so later sessions don't re-derive them. Run it once per
repo, again when the repo or the plugin moves. On an empty repo it grills the subject and the stack
with you first.

Then just ask: *"add feature Y"*, *"fix Z"*, *"build a landing page for X"*. The lead picks the seats.

## What it does to your machine
The team is opinionated about process, and it enforces that with one plugin (`plugin/kru.ts`) wrapping
the two shell gates. Each interruption below is one you can turn off.

| When | What happens | Turn it off |
|---|---|---|
| First tool call of a session not on the `kru` agent | Blocks once until the lead contract is loaded, so no build starts off-contract | `export KRU_NO_LEAD_GATE=1` |
| Dispatching a seat | Refuses a handoff that carries stale line numbers, restates a rule the seat already has, or leaves a decision open | `export KRU_NO_GATE=1` |
| While a session has unaudited dispatches | Adds a standing line asking for the dispatch auditor before the turn ends | `export KRU_NO_AUDIT=1` |
| After each dispatch | Appends one line to a session ledger the auditor reads | — |

It writes outside your repo, never inside it — the one exception is `/kru/setup`, which edits
that repo's `AGENTS.md`:

- `~/.claude/kru/management/<project>/` — briefs, plans, tickets, todos, issues. Kept at user
  level on purpose: your repo stays clean, and the plan survives branch churn and a re-clone.
- `~/.claude/kru/inbox.md`, `patterns/` — preferences you bank with `/kru/remember`.
- `~/.claude/kru/audit/`, `lead-gate/` — per-session bookkeeping for the hooks above; audit
  ledgers self-delete after 7 days.
- `${TMPDIR}/kru-review/` — review reports, so an audit trail stays out of the conversation.

## Commands
**Getting started**
- `/kru/setup`: set the team up in this repo. Once per repo, again when the repo or the plugin moves.
- Then ask: "add feature Y", "fix Z", "build a landing page for X". Or `/kru/lead <task>`.

**Coding sessions**
- `/kru/brief <subject>`: grill a change and keep the record before building.
- `/kru/todo <the thing>`, `/kru/issue <what's wrong>`: park a want or a defect without breaking the session.
- `/kru/remember <what you liked>`: bank a preference for the team to absorb later.
- `/kru/landed`: after the PR merges, sync back onto the base branch.
- `/kru/comment-fix`, `/kru/prose-fix`, `/kru/doc-fix` `[<path> | <branch> | <pr>]`: fix comments, rendered copy, or doc prose in place.

**Backlog and tech debt**
- `/kru/todos`, `/kru/issues`: work the backlog; each entry landed is deleted.
- `/kru/design-system audit`: audit the design system.
- `/kru/seo-review`, `/kru/review-animations`, `/kru/improve-animations`, `/kru/design-gallery`: audits on shipped pages.
- `/kru/ux-review <flow>`: audit a user flow — signup, checkout — end to end through source.

## Stack
- **UI**: React, Svelte 5, Web Components.
- **Framework**: React Router 7, Next.js App Router, TanStack Start, SvelteKit, Go-served React, Python.
- **Data**: Postgres, SQLite, Sanity.
- **Auth and payments**: Better Auth, Stripe.
- **Platform**: Vercel, Cloudflare, Fly.io.
- **Tooling**: pnpm, Turborepo, Biome.

Design runs upstream of every build (flows, artboards, assets) and review after it (correctness, structure, rendered UI, accessibility, UX). The seats behind each layer, and how to spawn one directly: `ROSTER.md`.

A stack with no seat is a question the lead brings to you before it guesses.

## Forking the team
`/kru/roster` (hire a seat, author a skill, sweep banked preferences into the seats) and
`/kru/update` (sweep what moved upstream) **edit the team's own files**. Run them in this repo, not
against the installed copy — the installed copy is a build, and the next `kru-oc sync` overwrites it.
After either one: `node scripts/port.mjs && node bin/kru-oc.mjs sync`.

If you just want the team to learn your preferences, `/kru/remember` is the channel that works
against the installed copy: it writes to your home directory, and what it banks survives a sync.

Tracking upstream:
```
git fetch upstream && git merge upstream/main
node scripts/port.mjs            # re-normalize what the merge brought in
node bin/kru-oc.mjs sync
```

How the team is structured and grown: `ROSTER.md`. What each stack's official source is: `SOURCES.md`.
The preference loop: `PREFERENCES.md`. The plan store's file format: `TRACKER.md`. What the port
changes and what opencode cannot do: `PORTING.md`. Which model each seat runs on: `MODELS.md`.

## License
MIT — see `LICENSE`. Vendored upstream skills keep their own licenses; see `NOTICE`.
