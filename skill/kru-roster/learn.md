# learn — sweep the preference inbox back into the team

The **promote** half of the preference loop (`PREFERENCES.md`): read the cross-project inbox, and edit the good preferences into the team. It's roster-ops because it edits the orchestration surface (agent prompts) and bumps a version — a subagent can't own that. **Gated**: propose every edit, land nothing unreviewed.

Run this **from the plugin source repo** (it commits the plugin), not a product repo. The inbox is user-global, so it's the same source wherever you run it.

## 1. Read the inbox
Read `~/.claude/kru/inbox.md` (+ `~/.claude/kru/patterns/`). If missing or empty, say so and stop — nothing to sweep. Group the lines by lane (`design`/`code`/`workflow`), **dedupe** (collapse repeats, merge near-duplicates), and **drop noise** (contradictory, or too vague to act on — call these out so the user can override).

**Count engagements, not lines.** Every inbox line is stamped with the project slug it came from, and that stamp is what separates an anecdote from a practice: the same preference from **one** repo is that client, from **two or more** it is the team. Collapse a group to its distinct slugs and carry the count into step 2 — it is what decides destination. The bar is advisory, so a one-slug line the user recognizes as doctrine still promotes; say the count and let them override.

## 2. Route each keeper to a destination
For each surviving preference, pick the narrowest home:
- **A component-level UI default** (how a control, row, form or label *behaves* — validation timing, where focus goes, what a mutation reports, what a repeated control announces) → an **entry in the `ui-patterns` corpus**, filed in the group matching the build target that summons it. This is the destination for most `[design]`-lane keepers, and it's what keeps one rule from being copied into six seat prompts. It has two bars, both in `skill/kru-ui-patterns/CURATION.md`: **the entry must name the default it corrects** (write that field first; if it stalls, the preference isn't corpus material), and **a design system must not be able to decide it the other way** — a preference about rank, ink, borders or what a focus indicator looks like belongs to the project's token file, so it's returned to the user rather than filed.
- **Seat-specific** (only one seat should carry it — e.g. a Svelte-only idiom, a `graphic-designer`-only default) → a **targeted prompt edit** to that `agent/kru/<seat>.md`. Name the seat and show the exact insertion. Where a rule has a **stack mechanism**, the rule goes in the corpus and only the mechanism goes in the seat (the three framework builders' mutation-feedback sections are the shape to copy).
- **Cross-seat** (several seats should carry it) → the same targeted edit in each affected seat, or the owning skill (`lead` SKILL.md for orchestration-wide rules). There is no central style file — a preference lives where the seat already reads (see `PREFERENCES.md` → *The destination*).
- **Reusable concrete pattern** → keep the `patterns/<slug>.md` artifact in the plugin (copy it under a repo path if you want it version-shared), referenced from the seat/skill that uses it.

- **One engagement, and it describes that repo rather than the team** (its gate, its runner's cost, its own subsystem) → the repo's **sheet**, the answers `/kru/setup` writes into its `AGENTS.md`. Name the repo and the line you'd add, and leave the typing to the user: this skill edits the plugin, and a sweep that reaches into product repos would be the plugin editing engagements it isn't in.
- **Project-specific and about the *product*** (a want, a defect, a decision) → that project's plan store (`~/.claude/kru/management/<project-slug>/`, `TRACKER.md`).

## 3. Propose, then gate
Show the user the full set of proposed diffs (agent-prompt + skill edits), grouped by destination, each with the inbox line it came from. **Land nothing until the user approves** — editing an agent prompt has global blast radius. The user can accept, drop, or reword per item.

## 4. Apply + drain
- Write the approved edits (`agent/kru/<seat>.md` insertions, skill edits, kept artifacts).
- **Drain** the inbox: remove the promoted lines from `~/.claude/kru/inbox.md`, leaving un-promoted/deferred lines for next time. Move kept artifacts out of the inbox's `patterns/` if you copied them into the repo.

## 5. Version + hand off (wiring map #6–#8)
No agent added → **count stays the same** (don't touch the `package.json`/`README.md` count). Bump version: **minor** if it adds a new default or capability, **patch** for a tiny prompt tweak. Set `VERSION`, `package.json` `version`, and the `ROSTER.md` header — all equal. Then **run `audit` (`audit.md`) — it must pass.** Report what landed where; leave `commit`+`tag` to the user (git rule).

Completion: approved preferences edited into seats/skills, inbox drained of them, version bumped, `audit` green.
