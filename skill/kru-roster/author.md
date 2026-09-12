# author — mint or vendor a skill

A skill touches the **smaller** map (see `SKILL.md`): no agent-count bump. First decide whether it **earns existence** at all, then **first-party vs vendored**.

## What earns a skill — recipes, not a restatement
Docs are hammer and nails. Having them doesn't build a house on the first try, and a fresh session with only the docs takes the same wrong turns the last one did. Context7 and every first-party source in `SOURCES.md` already answer *what the API is* — more currently than any file in this repo ever will. A skill exists to carry what a source **can't** serve: what someone has only after working with the thing for a while — the order operations have to happen in, the default that was picked after the obvious one failed, the case where correct-by-the-docs is wrong in practice, and the popular advice that's wrong (the `sqlite` skill's cargo-cult pragma table; `drizzle`'s rebuild that deletes cascade children and reports success).

**The test, before writing a line:** could a careful agent derive this from the official source *in the moment*? Then it isn't a skill — it's a lookup, and the stack's `SOURCES.md` row already covers it. A skill that restates docs is worse than no skill: it drifts out of sync with the source it copied, and outranks that source while stale. Vendored packs face the same bar — a community pack teaching quickstart material for a stack Context7 already serves gets **rejected**, not vendored (`SOURCES.md`, the Drizzle row).

On the page that means: sequences whose order matters, defaults with the reason attached, traps written as the failure they cause, and — the one nobody writes — what to deliberately leave out. Every load-bearing claim verified at the source or reproduced, and cited, since a recipe outranks the docs in the reader's hands.

## First-party (write it)
1. `skills/<name>/SKILL.md` to the `writing-for-agents` standard (its `SKILL-MECHANICS.md` carries the skill-only half) — loaded **before the first edit, and run again over the finished draft and every file that draft touched**. The second pass is not optional and it is not the first one repeated: the pruning bars (no-ops, duplication, relevance, sprawl) are measurements over text, so they have no input until a draft exists, and duplication has none until *every* surface does — which is why the catches land across files rather than inside the new one. Decide **invocation** per that skill: model-invoked (keeps a trigger-rich `description`, pays context load) only if the agent or another skill must reach it on its own; else **user-invoked** (`disable-model-invocation: true`, zero context load). Disclose long reference to sibling files (disclosure-by-branch), keeping `SKILL.md` legible.
2. Wire: if it **backs a seat**, add it to that seat's `SOURCES.md` row and have the seat's file load it; note it in `ROSTER.md` → *Reused, not owned*.

## Vendored (bring it in verbatim)
1. Download the source **unmodified** into `skills/<name>/`. Add the provenance HTML comment at the top — source repo + branch + sha + a one-line re-sync instruction (copy the exact shape at the top of `skill/kru-writing-for-agents/SKILL.md`).
2. Record it in `SOURCES.md` → *Vendored resources* (repo, license, what it backs) and in `ROSTER.md` → *Reused, not owned*. Confirm the license permits vendoring; note it.

## Refresh (`author <existing name>`) — executing an `/kru/update` verdict
`/kru/update` reads upstream and the registries and records a verdict per skill in `skill/kru-update/reviewed.md` (*Vendored skills* · *Libraries*); this branch executes it. Read the skill's row there first — it names the files, the sha, or the claims.
- **Re-sync a vendored skill**: re-download the files the row names from upstream at the head sha, verbatim, into `skills/<name>/`; re-apply the deviations the provenance comment lists, and only those; move the comment's sha and the `SOURCES.md` row to the head. Diff before and after — the only local hunks left are the listed deviations.
- **Re-verify a library skill**: install the new version in a scratch dir (one package at a time), reproduce each claim the row names, edit the ones that changed (a fixed trap is deleted), then move the `Reproduced on` line to the version and date of the run. The pin names only versions a claim ran on — a claim you didn't rerun keeps its old pin, split across two lines if it comes to that.
- **Rewrite**: the entry bar above, on the new version, from a blank page.

## Both
Minor version bump — `VERSION` · `ROSTER.md` header · `.claude-plugin/plugin.json`, all equal (the plugin manifest is the one that gets forgotten — it has shipped stale before). Leave commit/tag to the user (git rule).

Completion: the skill loads, meets the standard (or is verbatim-vendored with provenance), and is recorded in `ROSTER.md`/`SOURCES.md` if it backs a seat or is vendored.
