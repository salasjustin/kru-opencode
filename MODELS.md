# Models — one per seat, through opencode zen

Upstream pins every seat to `claude-opus-5` (three to `claude-sonnet-5`), because that is what its
harness sells. This fork is zen-native: each seat runs on the model its *work* is worth, and the map
lives in exactly one place — `scripts/port.mjs` → `ZEN` and `SEATS`. Nothing else in the tree names a
model id: `ROSTER.md` → *Model tiers* points here, and every seat's frontmatter is generated. Edit there, run
`node scripts/port.mjs && node bin/kru-oc.mjs sync`, and every seat's frontmatter follows.

## The tiers

| tier | model | $/1M in | seats |
|---|---|---|---|
| **judgment** | `opencode/claude-opus-5` | 5.00 | the lead (primary), `planner`, `code-reviewer`, `architecture-reviewer`, `ux-auditor`, `ux-designer` |
| **ui** | `opencode/kimi-k3` | 3.00 | `react-ui-builder`, `svelte-ui-builder`, `web-components-builder`, `ui-designer`, `graphic-designer` |
| **coding** | `opencode/glm-5.3` | 1.40 | the 18 remaining builders — frameworks, data, auth, payments, platform, tooling, tests |
| **vision** | `opencode/gemini-3.8-flash` | 1.50 | `visual-reviewer`, `accessibility-reviewer` |
| **mechanical** | `opencode/glm-5.3-flash` | 0.15 | `dispatch-auditor` |

## Why each tier is where it is

**Judgment — the seats whose output is a decision, not a diff.** The lead spends its context on
routing, briefing and reading returns: a bad call there costs a whole build, which is the one place
where the most expensive model is the cheap option. The two adversarial reviewers are the same
economics inverted — a missed bug ships. `planner` and `ux-designer` write the documents every later
seat executes against, so an error compounds across sessions rather than staying in one file.

**UI — `kimi-k3` for the seats where taste is the deliverable.** Component structure, spacing rhythm,
state coverage, the artboards a look is settled on. Strong instruction-following on long style
contracts matters more here than raw reasoning depth, and these seats are handed a closed token set
rather than asked to decide anything.

**Coding — `glm-5.3` for the builders.** These seats arrive with the decisions already made: a file
list, named anchors, a behavior list, an official source to read. That is execution inside a tight
brief, which is where the price-per-token difference actually shows up in a bill — most dispatches on
a normal day are here. A seat that turns out to need more is a one-line change in `SEATS`.

**Vision — the two seats that read screenshots.** `visual-reviewer` and `accessibility-reviewer` drive
a real browser and judge rendered pixels, so the model has to be multimodal; `gemini-3.8-flash` is the
cheapest capable one in the catalog. Neither seat renders a verdict on design intent, so the ceiling
they need is lower than a reviewer's.

**Mechanical — `dispatch-auditor` at `glm-5.3-flash`, temperature 0.** It reads a JSONL ledger and
checks each line against a contract it carries. No design calls, no prose, a fixed rubric — the one
seat where a flash model is not a compromise.

## Temperature

Only where it earns the line: `0.1` on the five review seats and `ux-auditor` (a review that varies
between runs cannot be trusted as a gate), `0` on `dispatch-auditor`. Every other seat takes the
provider default — a builder writing prose, copy or a component is worse at 0.

## Retiering

```js
// scripts/port.mjs
const ZEN = {
  judgment: "opencode/claude-opus-5",
  ui: "opencode/kimi-k3",
  coding: "opencode/glm-5.3",
  vision: "opencode/gemini-3.8-flash",
  mechanical: "opencode/glm-5.3-flash",
}
```

Change a tier's model and every seat in it moves. Move one seat between tiers by editing `SEATS`; a
seat absent from `SEATS` gets `coding`, which is why adding a builder upstream needs no model decision
here.

Two things worth knowing before a retier:

- **The cheap tier is where the volume is.** 18 of 31 seats are `coding`, and a build dispatches them
  repeatedly. Raising that tier moves the bill far more than raising `judgment`, which runs once per turn.
- **A model id that no longer exists fails at dispatch, not at install.** Nothing in the port validates
  against the catalog; `opencode models` is the check.

The current catalog and prices: <https://opencode.ai/docs/zen/>. Prices above are the input side as of
this fork's port of kru 0.82.0 — they move, and the tiers are the decision, not the numbers.
