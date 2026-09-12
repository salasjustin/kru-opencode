# Preference Store — how the team evolves

The team is **project-agnostic**: the same agents start from the same frozen definitions in every repo. Left alone, a preference the user expresses in one project — a liked UI pattern, a code convention they approved, a workflow they always want — dies with that session. Nothing carries it into the next project.

This file documents the loop that fixes that: **capture → sweep → evolve**. It is the preference-store sibling of `TRACKER.md` (the plan store). The distinction:

- **`TRACKER.md` / `TODOS.md` / `issues/` / `notes/`** — *project-specific* todos, known defects, brainstorming, and the current change's brief. They live at user level too, but **keyed per project** (`~/.claude/kru/management/<project-slug>/`), because they're about *that product*.
- **This store** — *cross-project* preferences about how **the team itself** should work. They live **un-keyed at the kru root**, because they belong to the team, not any product.

## The loop

```
any project (cwd = someone's repo)         ~/.claude/kru/
  /kru/remember  ───────────────▶  inbox.md   ◀─── agents append learnings
                                              │            (end-of-run, via lead handoff)
                                              │        ◀─── dispatch-auditor files process
                                              │            deviations (hook-fired at turn end)
                                              │        ◀─── /kru/setup files what a repo knows
                                              │            that a plugin skill lacks
                                     /kru/roster learn
                                              │  (run from the plugin source repo; user gates each edit)
                                              ▼
                              the plugin, versioned + shared
                                agent/kru/<seat>.md              (targeted prompt edits)
                                skills/<owner>/SKILL.md       (incl. lead — orchestration-wide rules)
                                → commit + tag  (minor bump)
                                              │
                                     /kru/setup      (typed in a repo)
                                              ▼
                              that repo's AGENTS.md
                                this engagement's answers, in that file's voice,
                                stamped with the plugin version they came from
```

Three arrows, one circuit. **Cheap lossless capture**, then a **curated, human-gated sweep** that edits the team (mirroring the `TODOS.md` → `/kru/brief` promotion the team already runs), then the **return leg**: a repo picks the evolved practice back up by re-running `/kru/setup`, which re-derives its answers against the newer plugin.

**The plugin holds the practice; a repo's own file holds the engagement.** That split is what the sweep routes on — a preference that would still be true in the next repo goes upstream into a seat or a skill, one true only where it surfaced goes into that repo's sheet (`skill/kru-roster/learn.md` → step 2). The plugin is the same in every engagement, which is exactly why nothing client-specific may land in it.

## Tier 1 — capture (the inbox)

**Location: `~/.claude/kru/inbox.md`** — a single user-global file, created on first capture. Not per-project (the team is project-agnostic, so captures don't belong in any per-project plan store), and **not** the install dir (the installed copy is a build the next `kru-oc sync` overwrites). Home dir is the one place writable from every project and durable across syncs.

It has **three writers**:

1. **The user, explicitly** — `/kru/remember <what they liked>`. Never inferred from approval; the team does not guess. A liked *pattern* with concrete code is saved as an artifact under `~/.claude/kru/patterns/<slug>.md` and indexed by an inbox line.
2. **Agents, as they work** — a builder/reviewer that discovers a durable preference (the user rejected X twice and chose Y; this repo's approved convention is Z) appends one line at end-of-run. This is journaling a *learning*, not reading approval — the same instinct as `test-writer` capturing a repo's testing conventions. The **lead** hands each dispatched seat the inbox path + this format so the learning lands (Step 3).
3. **`dispatch-auditor`, on the team's own process** — the plugin's hooks log every team-seat dispatch to a session ledger (`~/.claude/kru/audit/`), and a standing audit nudge asks the lead to dispatch the seat to audit it against the `lead` Step 3 contract, filing `[workflow]` lines for durable deviations (routing misses, incomplete handoffs, restated ambient blocks). This is the loop's autonomous half — the team observes how it was run and proposes its own corrections — and it is autonomy at the **capture** tier only: still never inferred from approval (the ledger holds the lead's dispatch text, not the user's reactions), and still gated at the sweep like every other line.

Entry format — one line, untriaged, lossless (mirrors the `TODOS.md` line):

```markdown
- [design] prefers bento-grid hero over centered-stack — _user · acme-site · 2026-07-21_
- [code] approved Result<T,E> returns over throwing at call boundaries — _agent:sveltekit-builder · acme-site · 2026-07-21_
- [workflow] wants the plan grilled before any build, always — _user · acme-site · 2026-07-21_
- [design] liked this pricing table → patterns/pricing-3col.md — _user · acme-site · 2026-07-21_
```

- **lane tag** `[design|code|workflow]` — routes the sweep to the right destination.
- **source** `user`, `agent:<seat-slug>`, or `setup` — who captured it (`setup` files a recipe a repo holds that a plugin skill lacks, found while deriving its sheet).
- **project** the repo slug it surfaced in, then the date captured. The slug is the **promotion bar**, not just context: the sweep collapses a group to its distinct slugs, and one slug reads as that client where two or more read as the team (`skill/kru-roster/learn.md` → step 1).
- Optional `→ patterns/<slug>.md` when a concrete artifact backs it.

Capture never derails the task — park the line, keep working (`TODOS.md` discipline).

## Tier 2 — sweep (`/kru/roster learn`)

The **curated, human-gated** half — it edits the team, so it lives under roster-ops (`/kru/roster learn`), reusing the same version/wiring machinery as `hire`/`author`. Run it **from the plugin source repo** periodically (not from a product repo — it commits the plugin). It:

1. Reads `~/.claude/kru/inbox.md` (+ `patterns/`); groups by lane, dedupes, drops noise.
2. For each keeper, picks a **destination**:
   - **seat-specific** (a default only `graphic-designer`, or only the Svelte builder, should carry) → a **targeted prompt edit** to that `agent/kru/<seat>.md`.
   - **cross-seat** (several seats should carry it) → the same targeted edit in each affected seat, or the owning skill (`lead` SKILL.md for orchestration-wide rules).
   - **reusable concrete pattern** → keep the `patterns/<slug>.md` artifact, reference it from the seat/skill that uses it.
3. **Proposes the diffs to the user and gates on approval** — editing agent prompts has global blast radius, so nothing lands unreviewed (same as `hire`'s hand-off).
4. Applies approved edits; **drains** the promoted lines from the inbox (leaves un-promoted lines for next time), archiving artifacts it kept.
5. Version-bumps (minor for new prefs/capability, patch for a tiny tweak), runs `audit`, hands off. Commit/tag left to the user (git rule).

## The destination — a consulted corpus, or the seat itself

There is deliberately **no central style file**. opencode plugins cannot ship auto-loaded context (no plugin AGENTS.md/rules mechanism), so a file that has to be *handed down* only reaches a seat if the lead remembers to re-read and re-slice it on every dispatch — a hop that silently drops. A preference therefore lands in one of two places, both of which the seat reaches on its own:

- **`ui-patterns`** (`skill/kru-ui-patterns/`) for a component-level UI default — the corpus a builder **consults by build target**, loading the one group matching what it's about to write. This is where most `[design]`-lane preferences go. It's a skill the seat loads itself rather than context the lead carries, which is what makes it survive the dispatch hop the retired central style file never did; and it holds the bound a flat list of preferences can't — `CURATION.md` requires every entry to name **the default it corrects**, so the corpus grows with wrong defaults rather than with taste. It takes **behavior only**: validation timing, where focus goes, where an outcome reports, what a control announces. A preference about how something *looks* — rank, ink, borders, the focus indicator itself — is the project design system's to settle, so the sweep returns it to you instead of filing it.
- **The seat's own `agent/kru/<seat>.md` prompt**, or the owning skill (`lead`'s SKILL.md for orchestration-wide rules), for everything that isn't a component pattern — a stack-specific mechanism, a routing rule, a seat's posture. Where a rule has both, the rule goes in the corpus and only the mechanism goes in the seat.

Versioned and shared either way — every install inherits them; the raw inbox stays personal to the user's machine.

The team starts frozen and earns its defaults one swept preference at a time — in place.
