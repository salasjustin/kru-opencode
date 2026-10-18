---
name: kru-briefs
description: Check every brief against what shipped — tick, archive, or resume the effort the user picks.
disable-model-invocation: true
---

Take the efforts to the user as a decision. The artifact is `plan/` at the plan store root, one `<effort>/` dir each; `{KRU_HOME}/kru/TRACKER.md` → *The brief* holds its lifecycle.

Two halves of a brief, two owners. The **bookkeeping** — `Landing plan` ticks, `Done when` ticks, `Blast radius` paths, ticket `status` — is this skill's to reconcile. The **account** — `Change`, `Why now`, `Decisions resolved`, `Non-goals` — is read here and re-decided through `skill/kru-brief/SKILL.md` (scope in the invoking task: <effort>).

**The gate is the verb.** §1 computes a proposal; §2 applies the bookkeeping without asking and shows the rest; §3 writes only what the user answered — resume, archive, re-grill.

## 1. Reconcile — every effort against git

List the dir `bash "{KRU_HOME}/kru/scripts/kru-store.sh" path plan` names. Missing or empty → *no efforts on file*, name `skill/kru-brief/SKILL.md` (scope in the invoking task: <subject>), stop.

For each `plan/<effort>/`, read `brief.md` and the ticket frontmatter under `tickets/`, then record a result for every bookkeeping line — a read pass per effort:

- **`Landing plan`** — each commit line against `git log` on the base and current branch (match by subject, then by the change it names); each PR line against `gh pr list --state all --search`. *landed* · *open* · *absent*.
- **`Done when`** — each box against the code, by a targeted grep or file-open for the behaviour it names. *holds* · *missing* · *unverifiable* (needs a run).
- **`Blast radius`** — each cited path. *resolves* · *moved* (new anchor) · *gone*.
- **tickets** — `status` per ticket and the frontier (`TRACKER.md` → *Status & the frontier*). A `done` ticket with unchecked boxes is *drift*.
- **What's still open** — on every effort short of *shipped*, each unticked line and each open question (an open decision ticket included) against today's code, since a tick records only what landed, and the code has moved on from it. *valid* · *reworded* (carries the new wording) · *obsolete* · *done*. A resume proposal names only *valid* and *reworded* work; the rest goes to the gate as its own line.

Then bucket each effort:

- **drifted** — a tick disagrees with its result: ticked but *absent*/*missing*, or unticked but *landed*/*holds*. Carries the boxes to flip.
- **in flight** — ticks match results, work left. Carries the next unticked landing-plan step, or the frontier.
- **stale** — `Blast radius` paths *gone*, or the subject removed or rebuilt another way. Carries re-grill or archive.
- **brief only** — no landing-plan line *landed*, no ticket moved.
- **shipped** — every landing-plan line *landed*, every PR merged, every `Done when` *holds*, every ticket `done`. Carries archive.

*drifted* stacks on any other bucket; name both. Mark age off `brief.md`'s mtime at 30+ days (`· 47d`).

**Candidates** — every dir up to ~8; past that, the 8 most recently edited plus every effort named in the task (exact slug, else case-insensitive substring). The rest are counted at the gate.

**Done when every candidate has a bucket and every bookkeeping line in it has a recorded result.**

## 2. Gate — return the list

Print by bucket — in flight → drifted → stale → brief only → shipped — most recently edited first within each. That order is the whole ordering: efforts are never ranked against each other (`TRACKER.md` → *Four lifetimes*), so each line proposes what its bookkeeping says, and the choice among them stays the user's.

First the bookkeeping, without asking — it's the team's: flip every box whose §1 result backs it (*landed* or *holds* to checked, *absent* or *missing* to unchecked; *unverifiable* stays as filed), set ticket `status` to match, re-anchor *moved* paths. Only those lines change, and a *drifted* effort then reads as whichever bucket its corrected ticks put it in. Then return one message as this step's result. Headings: in flight → *In progress* (pick it up?), stale → *Needs a decision* (re-plan or drop?), shipped → *Done* (close it out?); brief only and the unread count → the closing count line:

```
In progress
  1. Onboarding — next: a new workspace opens with demo content          → pick it up?
  2. Search — next: results stay current as the catalog changes          → pick it up?
Needs a decision
  3. Sign-in (112 days old) — since built another way                    → re-plan or drop?
Done
  4. Pricing — everything planned is live                                → close it out?
Plus 1 planned but not started, 3 not looked at yet.
```

Each line names the effort and what's next or what happened, in what someone using the product would notice — no PR or commit numbers, SHAs, paths, tick counts or bucket names. Only resume, archive and re-grill are offered; *brief only* efforts and the unread count are one counted clause. The PM picks by number in the next task; at most one effort to resume — execution is sequential. Apply §3 when the task names the pick.

## 3. Apply what they picked

In this order:

1. **Archives** — move each confirmed `plan/<effort>/` to `archive/<effort>-<date>/` with the `README.md` `TRACKER.md` → *Naming* requires.
2. **Outcomes** — each effort the user touched gets one:
   - **resumed** — its next landing-plan step or frontier ticket goes to `lead` as the task.
   - **re-grill** — load `skill/kru-brief/SKILL.md` for that effort when the task asks.
   - **left** — as filed.
3. **Report** — which efforts are done and closed out, which one is resumed and what it's building next, and which need a decision from the user (with the command to type for a re-grill), in product terms. Flipped boxes, archive paths and dir counts stay in the store and surface when asked.

**Done when the bookkeeping and every confirmed edit are on disk and every effort the user touched has a named outcome.**
