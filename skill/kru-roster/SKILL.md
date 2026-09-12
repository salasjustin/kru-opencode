---
name: kru-roster
description: Roster operations for this team plugin — hire or retire a specialist, author a skill, sweep learned preferences back into the team, or audit the roster for drift. The versioned "Growing the team" checklist, executed as a tool.
disable-model-invocation: true
argument-hint: "<hire|author|learn|retire|audit> [name]"
---

You run in the **main thread** (like `lead`) — minting a seat edits the orchestration contract (the `lead` routing table) and bumps + tags a version, which a subagent can't own. This skill operationalizes `ROSTER.md` → *Growing the team* so every seat is wired **identically** and nothing drifts.

**Roster-ops, not the excluded "ops/HR."** `ROSTER.md` → *Scope* excludes ops/HR as a *product-org* seat that serves end users. This skill mints the team's **own members** — self-authoring/governance, a different thing. It adds seats and skills; it never adds a business function.

## The standard (every branch)
Everything authored here meets **`writing-for-agents`** (context pointers · the two loads · information hierarchy · single source of truth · aggressive pruning; `SKILL-MECHANICS.md` for frontmatter/invocation/router skills) and the team's **official-sources-first** floor — under which a *skill* is the earned-recipe layer over a source, never a restatement of it (entry bar: `author.md`). **Present tense only — no archeology.** A seat prompt states what is true now. What a rule replaced, what a seat used to own, which pass was retired, "no longer", "predates", "the team dropped X" — none of it changes what the agent does, and all of it goes stale on its own schedule. The *reason* behind a live choice earns its place (it's what no config confesses); the *history* of arriving at it belongs in the commit body. A correction to a vendored file is live text, not archeology — state the correction, not the chronology. **Positive framing**: document where a responsibility lives, in the flow where it lives — an ambient skill is "carried by seat X", a user-invoked seat is "spawned directly by the user" in its `ROSTER.md` row; a capability outside a flow is simply absent from that flow's text ("X isn't routed / not a seat / never dispatch" lines are drift magnets and noise). Don't restate the repo's conventions — **copy the shape of the nearest existing peer** (a builder for a builder, a reviewer for a reviewer) and diff against it. **Exception: the shared blocks come from `shared-blocks.md`, never from the peer** — an unpinned "nearest peer" reference is how a dropped clause propagates into every seat hired after it.

## Wiring map — the single source of truth
Every place a **seat (agent)** is registered. `hire` writes all of them, `retire` removes all of them, `audit` asserts all of them agree. This table is the authority; the verb files point back here rather than restating it.

| # | File | Entry |
|---|---|---|
| 1 | `agents/<name>.md` | the definition — frontmatter `name`/`description`/`tools`/**pinned** `model`; seat-specific body copies a peer's shape, **shared blocks copy `shared-blocks.md`** |
| 2 | `ROSTER.md` → *Current specialists* | one role row (agent · role · backing source) |
| 3 | `ROSTER.md` → *Model tiers* | a **pinned** row (explicit full ID) + one-line why — `inherit` is retired |
| 4 | `SOURCES.md` | backing-source row (skip only for a genuinely stack-agnostic seat, e.g. a pure reviewer — and say so) |
| 5 | `{KRU_HOME}/kru/references/routing.md` | the `detected/needed → specialist` row — read by `lead` and by `/kru/setup`, which is what puts the seat into a repo's sheet (a review-only seat wires into *Step 4* instead; a **user-invoked** seat — triggered by the user, via a thin invoker skill (`/<name>`) or by spawning the agent — wires via its `ROSTER.md` row marked user-invoked, plus that invoker skill if it has one, and stays out of `lead` entirely; a **hook-invoked** seat — fired by the plugin's own `hooks/hooks.json`, e.g. the Stop nudge — wires via its `ROSTER.md` row marked hook-invoked plus its hook scripts, and likewise stays out of `lead` routing) |
| 6 | `.claude-plugin/plugin.json` | `version` bump **and** the "routes to N specialist subagents" **count** in `description` |
| 7 | `.claude-plugin/marketplace.json` | the "N specialist subagents" **count** in `description` |
| 8 | `VERSION` · `ROSTER.md` header | version — minor for a new seat: `VERSION` and the `# Roster — vX.Y.Z` header, equal |
| 9 | git | `commit` + `tag vX.Y.Z` — **only when the user asks** (team git rule) |

A **skill** touches a smaller map: `skills/<name>/SKILL.md` (+ any disclosed sibling files), a note in `ROSTER.md` → *Reused, not owned* (and `SOURCES.md` if it backs a seat), `VERSION`/header, git. A skill gated on a **library the repo may or may not have** takes one more row — `references/routing.md` → *Conditional skills*, which is what puts it into a repo's sheet; a skill its seats load unconditionally stays out of that table. **No agent-count bump** (#6–#7 count is agents only). A *vendored* skill also needs the provenance HTML comment + a `SOURCES.md` → *Vendored resources* note — copy the shape at the top of `skill/kru-writing-for-agents/SKILL.md`.

**`learn`** touches a map of its own: it promotes preferences from the inbox (`PREFERENCES.md`) into targeted `agents/<name>.md` prompt edits and/or the owning skill (`lead` SKILL.md for orchestration-wide rules), then bumps `VERSION`/header. No agent added → **no count bump**. It's the only verb that reads user-global state (`~/.claude/kru/`) and the only one gated on a per-edit user OK before it writes.

The **count N** (#6–#7) is drift-prone — never hand-increment it; recompute from `ls agents/*.md | wc -l`.

## Dispatch
Read the one file for the requested verb, then execute it against the wiring map above.

| `$ARGUMENTS` | Do | File |
|---|---|---|
| `hire [role]` | mint a specialist + wire #1–#9 | `hire.md` |
| `author [name]` | mint or vendor a skill; an existing name refreshes it from an `/kru/update` verdict | `author.md` |
| `learn` | sweep the preference inbox back into the team (gated) | `learn.md` |
| `retire <name>` | remove a seat + unwire everywhere | `retire.md` |
| `audit` | report roster drift (read-only) | `audit.md` |

Plus one shared reference, read by `hire` and `audit` rather than dispatched to: **`shared-blocks.md`** — the canonical text of the blocks every seat carries (`Context hygiene`, `TypeScript`, the return contract), with its invariant clauses and its per-seat tailored slots marked.

No verb given → run `audit` and report, then ask which of the others they want.
