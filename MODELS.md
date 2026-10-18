# Models: one per seat, through opencode zen

Upstream pins most seats to `claude-opus-5-5` (seven to `claude-sonnet-5-5`), because that is what its
harness sells. This fork is zen-native: each seat runs on the model its *work* is worth, and the map
lives in exactly one place: `scripts/port.mjs` → `ZEN` and `SEATS`. Nothing else in the tree names a
model id: `ROSTER.md` → *Model tiers* points here, and every seat's frontmatter is generated. Edit there, run
`node scripts/port.mjs && node bin/kru-oc.mjs sync`, and every seat's frontmatter follows.

## The tiers

| tier | model | $/1M in | seats |
|---|---|---|---|
| **judgment** | `opencode/claude-opus-5` | 5.00 | the lead (primary), `planner`, `code-reviewer`, `architecture-reviewer`, `ux-auditor`, `conversion-copywriter` |
| **ui** | `opencode/kimi-k3` | 3.00 | `react-ui-builder`, `svelte-ui-builder`, `web-components-builder` |
| **coding** | `opencode/glm-5.3` | 1.40 | the 26 remaining seats (frameworks, APIs, data, auth, payments, integrations, platform, tooling, tests) |
| **vision** | `opencode/gemini-3.8-flash` | 1.50 | `visual-reviewer`, `accessibility-reviewer` |
| **mechanical** | `opencode/claude-haiku-5-5` | 0.10¹ | `dispatch-auditor` |

¹ Anthropic's list price for Claude Haiku 5.5 ($0.10 in / $0.50 out per 1M, prompts under 100k tokens);
the zen price for it is unverified.

## Why each tier is where it is

**Judgment: the seats whose output is a decision, not a diff.** The lead spends its context on
routing, briefing and reading returns: a bad call there costs a whole build, which is the one place
where the most expensive model is the cheap option. The two adversarial reviewers are the same
economics inverted: a missed bug ships. `planner` writes the documents every later seat executes
against, so an error compounds across sessions rather than staying in one file.
`conversion-copywriter` is the same case on a marketing page: its deck settles the position, the
section order and every claim, and the designer and the build are both drawn around it verbatim.

**UI: `kimi-k3` for the seats where taste is the deliverable.** Component structure, spacing rhythm,
state coverage, and motion against a closed token set from the PM's approved spec. Strong
instruction-following on long style contracts matters more here than raw reasoning depth, and these
seats are handed a closed token set rather than asked to decide anything.

**Coding: `glm-5.3` for the builders.** These seats arrive with the decisions already made: a file
list, named anchors, a behavior list, an official source to read. That is execution inside a tight
brief, which is where the price-per-token difference actually shows up in a bill. Most dispatches on
a normal day are here. A seat that turns out to need more is a one-line change in `SEATS`.

**Vision: the two seats that read screenshots.** `visual-reviewer` and `accessibility-reviewer` drive
a real browser and judge rendered pixels, so the model has to be multimodal; `gemini-3.8-flash` is the
cheapest capable one in the catalog. `visual-reviewer` checks spec match at 1440 and 375; neither seat
renders a verdict on design intent beyond what the approved spec states.

**Mechanical: `dispatch-auditor` at `claude-haiku-5-5`.** It reads a JSONL ledger and
checks each line against a contract it carries. No design calls, no prose, a fixed rubric. It is the one
seat where the smallest model is not a compromise. Upstream kru v0.150.0 moved the seat from
`claude-sonnet-5-5` to Claude Haiku 5.5; this fork pins zen's `claude-haiku-5-5` now that the catalog
lists it. On input, Anthropic's list price is below the flash model
it replaced; what zen charges for it has not been checked.

## Temperature

Only where it earns the line: `0.1` on the four review seats and `ux-auditor` (a review that varies
between runs cannot be trusted as a gate). Every other seat takes the provider default. A builder
writing prose, copy or a component is worse at 0. `dispatch-auditor` would take `0`, but
`claude-haiku-5-5` rejects the parameter outright (HTTP 400, "`temperature` is deprecated for this
model"), so it carries none.

## Retiering

```js
// scripts/port.mjs
const ZEN = {
  judgment: "opencode/claude-opus-5",
  ui: "opencode/kimi-k3",
  coding: "opencode/glm-5.3",
  vision: "opencode/gemini-3.8-flash",
  mechanical: "opencode/claude-haiku-5-5",
}
```

Change a tier's model and every seat in it moves. Move one seat between tiers by editing `SEATS`; a
seat absent from `SEATS` gets `coding`, which is why adding a builder upstream needs no model decision
here.

Two things worth knowing before a retier:

- **The cheap tier is where the volume is.** 26 of 37 seats are `coding`, and a build dispatches them
  repeatedly. Raising that tier moves the bill far more than raising `judgment`, which runs once per turn.
- **A model id that no longer exists fails at dispatch, not at install.** Nothing in the port validates
  against the catalog; `opencode models` is the check.

The current catalog and prices: <https://opencode.ai/docs/zen/>. Prices above are the input side as of
this fork's port of kru 0.156.0. They move, and the tiers are the decision, not the numbers.
