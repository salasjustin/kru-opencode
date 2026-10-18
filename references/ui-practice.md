# UI — approved design upstream, system owned by the repo

The team's UI doctrine, read by the three UI component builders, `design-system`, `design-gallery`, and `lead`'s from-scratch path. Read when any UI build starts: from scratch at *Bootstrap*, an existing repo at *Steady state*.

**Design is made outside this team.** A designer (standalone bot or human) uses the plugin's design skills (`/design`, `composition`, `landing-page`, and the rest — `{KRU_HOME}/kru/references/designer-handoff.md`). The **owner approves** mockups and build spec; the **PM** attaches that approved package to engineering (`references/design-spec.md`). Engineering never runs a mockup or canvas step.

**The approved spec is authoritative.** Every value it settled ships as authored. The repo's token file is where values live in code, transcribed from the build spec.

**The foundation is the shape the values land in.** Seven foundations — color · typography · size · elevation · motion · primitives · shells — each answered by a closed **set**, a **rule** for picking a step, and a **consumer** spending it: `skill/kru-design-system/SKILL.md`, the user's `/kru/design-system` (audit and coverage reads — not engineering bootstrap). `create` emits an unset skeleton for greenfield repos that have no token architecture yet; values always come from the approved spec, not from engineering choosing a look.

**The gallery is the builder's local loop.** `skill/kru-design-gallery/SKILL.md`, the user's `/kru/design-gallery`.

## Who owns what

| | owns |
| --- | --- |
| **Designer** (outside engineering) | mockups, build spec (flows, IA, copy, brand paths, imagery), owner approval before PM handoff |
| **PM** | attaches the approved design spec to the brief; product calls on gaps |
| `conversion-copywriter` | marketing argument and SECTION deck — often **before** the designer draws |
| the UI builder | token file, **conformance gate**, components — built to the spec |
| the lead | routes, dispatches, verifies — **no** design drafting |
| `visual-reviewer` | rendered UI vs approved mockups at **1440** and **375**, plus coverage states — mismatches go to the builder |

## The conventions file

`design/conventions.md`, when the repo keeps one: constraints and, once a system exists, the shipped-system header. The designer authors it in the build spec when the product needs it; engineering reads it while building. Not a substitute for approved mockups.

## Bootstrap — no components exist yet

1. **PM brings an approved design spec** — mockups + build spec from the designer (`design-spec.md`). Without it, engineering stops and asks the PM to get design first.
2. **Builder Phase 0** — transcribe token values from the build spec into `design-system.ts`, emit the token file, ship the **conformance gate** in the same slice (see *The conformance gate*). Do **not** invoke `/kru/design-system create` to invent values — either the spec supplies the tokens or the builder implements the mapping the spec names. First components; conventions file turns to header era when applicable.
3. **Feature slices** — builders implement screens to the spec; Step 4 runs `visual-reviewer` against the same mockups.

Greenfield team defaults (`pnpm`, React when unstated) apply when scaffolding; brownfield matches the repo.

## Steady state — the loop

1. **PM attaches the design spec** for the slice (or points at an unchanged spec already on the brief).
2. **Build** — component + token edits in the repo, to the closed set (`references/ui-handoff.md`).
3. **Verify** — repo gate every commit; `visual-reviewer` + `accessibility-reviewer` (+ `ux-auditor` on multi-screen flows) at Step 4.

A **named gap** — the spec lacks a value the slice needs — goes to the **PM** with the token name; no seat invents it.

## System change — the trip that moves the token file

Most trips round the loop compose a screen out of parts that already exist and settle no new value. A **system change** is the other kind: the token file itself moves. Two things start one — a builder's **named gap**, blocked and reported (*The conformance gate*, below), or a deliberate improvement the owner approves through an **updated design spec** from the designer. Both run the same steps; what differs is what the landing step lands and what closes it.

- **The token edit is its own slice, and it lands first.** A value that is retuned, renamed or retired reaches every consumer in the tree, so it goes in ahead of the components that consume it rather than riding along inside one of them. Where the repo generates its token file from `design-system.ts`, the edit is to `design-system.ts` and the emitted CSS rides along in the same commit — never the reverse.
- **A change to a ladder's *shape* is a different animal from a change to a value in it.** Adding a step, splitting a ladder, or restating what a step is for changes what every future value choice resolves against, so it runs `/kru/design-system audit` first and lands as its own slice ahead of any value edit.
- **The gate runs over the whole tree on that slice**, not over the components that changed. Whether the rest of the tree still resolves is the question a system change asks, and a repo-wide sweep is what answers it — a name that stopped resolving is a rename that stranded its consumers, and it is a finding on the slice that renamed it.
- **A type-stack swap is a repo-wide grep on both ends, and the second one reads the built CSS.** A `font-family` literal inside a component-scoped style block survives the swap in silence — no build, lint or type error, just the wrong face resolving from a system fallback — so the slice greps the whole tree for family literals rather than the token file alone, then greps the *emitted* stylesheet for the outgoing family names. Zero hits there is the proof the swap landed. The same slice re-measures anything sized in `ch`: a `ch` is that face's own `0` advance, so a fixed `Nch` rail holds a different number of characters under the new face (a 1.33 vs 1.27 `0`-to-average-lowercase ratio moved a `60ch` measure from ~75 characters to ~80). Measure the incoming face in the browser — x-height scales the wrong quantity.
- **The conventions file moves in the same change** when the designer's updated build spec says so. A header that lags the system sends the next design session at constraints the repo no longer holds.

## The conformance gate — structural first, test for the rest

Whether a build honors its system is **enforced, not reviewed**. Two mechanisms, and the first is the cheaper one:

- **Generated — the token file can't be hand-edited without the suite noticing.** Where the repo emits its token file from `design-system.ts`, the check script re-emits and diffs the committed file at every commit. That is what buys the generator its keep: without it the source of truth is a suggestion, and the first hotfix edited into the CSS becomes a value authored in two places.
- **Structural — the build makes an off-system value have no rule at all.** A Tailwind v4 theme that zeroes the default palette (`--color-*: initial`) leaves `gray-500` and `red-600` matching nothing; a stylesheet compiled from the app's own source leaves an off-ladder step matching nothing. Nothing to run, nothing to skip, and the closed set is enforced by the same artifact that ships. Reach for this wherever the stack offers it, and say in Phase 0's return which half of the system it covers.
- **Test — the sweeps the build can't make impossible.** In the repo's own runner, at every commit. **Values**: every colour, length, type bundle, radius, duration and easing in a screen resolves to the token file; a literal is a finding. **Names**: every class the components write is one the real sheets draw. Both return findings rather than asserting them — a finding carries the file and the name, which a caller's `expect(...).toEqual([])` already prints.

The **names** sweep is the one nothing else catches. A class name borrowed from another system — `btn-outline` where the recipe list is closed at `btn-primary`/`-secondary`/`-ghost`/… — has no rule, paints nothing, throws no error, and still reads as correct in a diff and in review. Structural enforcement doesn't help: not existing *is* the failure mode.

**Gate craft** — what keeps a sweep honest:
- A sheet's header claiming *no literals* is true only where a gate sweeps that sheet. A sheet that permits literals names them — a `raw-*-ok:` note on the line or in the comment directly above it, and the gate reads both places, since a formatter folds a long trailing note onto the next line.
- A token *role* layer (`--color-surface` over `--color-gray-100`) holds only where the check tells a role from a step; a sweep that accepts either passes a component written entirely in steps.
- A gate reading a custom property through a standard property (`getComputedStyle(el).paddingLeft`) rejects that property's *initial* value: an unresolved `var(--unset)` computes to `0px` and passes a check for any resolved length.
- Every gate ships with a negative-control fixture carrying the exact marker string the gate matches — `raw-ok:` with the colon the gate greps for — so a sweep that stops reaching anything goes red.

A value the system cannot express is a **named gap** — reported to the **PM**, with the token name it would need. One line, not a round trip.

A gate runs in no context window, at every commit, and can't be skipped because the review batch was busy.

Handoff detail: `references/ui-handoff.md` → *Conformance is prevented, not detected*.

## Contrast — the design settles it, the system records it, the gate holds it

Three different things, and collapsing them is what makes this rule look like it forbids the ledger.

- **Settling a pair is the design's**, and that pair ships as authored in the approved spec. No seat re-derives one, overrides one, or argues one under an a11y heading. Where a conformance *claim* is needed — procurement, public sector — that is a person with a tool, outside this team.
- **Recording what was settled is the system's.** A mature token file has a ledger beside it saying what each token is *for* and which pairs are legible as text, ratio included, because the distinction between a **fill** and an **ink** is the single largest source of drift and no reader can recover it from the values. Those numbers are measurements of decisions already taken, written once, and they are what the header carries into the next design session. Recording a ratio is not computing a verdict.
- **Using a pair as authored is conformance**, and the gate's business. A fill token spent as a text colour — a warning fill on a body line, or a tint paired with its own full-strength ink — is not a design decision anyone took; it is a component reaching past the surface-and-ink pair the system authored for exactly that case. That is a **names/values** finding on the same footing as any other. (The token names differ per system; the failure doesn't.)

What stays banned is a **review seat computing a ratio to overturn the spec**: `accessibility-reviewer`, `visual-reviewer`, and `ux-auditor` report structure — keyboard operability, focus order and visibility, target size, name/role/value, error identification — and name 1.4.3/1.4.11 unassessed so a clean run never reads as full AA.

## Reviewing the built UI

What runs, and when:

- **Every commit, mechanical:** the gate above — whatever the build enforces structurally, plus the sweeps in the suite.
- **At Step 4, in the parallel batch:** `visual-reviewer` — **spec match at 1440 and 375** plus states nobody opens and defect root cause; `accessibility-reviewer`; `ux-auditor` on a named flow.
- **Outside kru:** the designer bot may compare the finished UI to her mockups after ship.

## Team defaults (greenfield only)

- **Package manager (JS/Node): `pnpm`**
- **UI stack: React when the user states no preference**, on the framework the brief names.
