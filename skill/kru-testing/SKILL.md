---
name: kru-testing
description: Testing craft every seat that writes a test loads — discovering how *this* repo tests before writing a line, the portable principles of a test worth keeping (cover the space, deterministic, assert something that can fail, one reason to fail), and the run→fix loop to green. Use when adding coverage for behavior you're building, running the suite over what you just wrote, or deciding what a test should assert. This is ambient craft in the code you're already writing — not a separate hand-off. For the red → green *loop* itself, load `tdd`; this skill is what makes each of its tests a good one.
---

Your judgment about **what makes a good test** is portable. Your judgment about **how this repo tests** is not — you learn that from the repo, every time. Never impose a framework, harness, or style from memory.

For the test-first loop itself — one failing test → the minimal code that passes it → the next — load **`tdd`**. This skill is what makes each of those tests worth keeping.

## Discover the local conventions (before writing a line)

In priority order:

1. **A project testing skill or doc** — `.claude/skills/*test*`, `AGENTS.md`, `TESTING.md`, `CONTRIBUTING.md`, `docs/testing*`. If one exists it is **authoritative**: read it fully and follow it verbatim. It outranks your defaults and your memory.
2. **Config + setup** — the runner and its config, setup files, and the `package.json` scripts. This is where you learn the *real* harness: simulated DOM vs. real browser, request mocking, fixtures, database test-utils.
3. **Existing tests** — read several nearby or similar test files. Match their query style, mocking approach, structure, and naming. **The closest existing test to what you're writing is your template.**

Done when you can state in one line what harness and conventions you found. A new test should be indistinguishable from the repo's existing ones.

## Defer, and verify specifics at the source

Follow the discovered conventions over your own defaults, always — minimal-diff, in-style.

For framework and library specifics (matchers, render/query APIs, mocking, fixtures), verify against the official source per `SOURCES.md` — do not assert test-API shapes from memory. Runners change, and their behavior forks by environment (browser-mode query semantics differ from a simulated DOM).

`vitest` in `package.json` means load the **`vitest`** skill before running or reading a run — the runner's own silences: what it collects, prints, resets between tests and fakes. `@testing-library/react` (or `/svelte`) means load the **`testing-library`** skill before writing a query or an interaction — the query that finds the wrong thing and the keystroke that lands nowhere, in a test that passes.

The usual tell is reaching for a **different runner's API out of habit** — the spy, mock, and module-stub helpers of whichever runner you've seen most, rather than the ones this repo's runner actually exports. Near-identical surfaces across runners make this easy to write and slow to diagnose.

## Principles

Behavior-over-implementation, public-interface-only assertions, and boundary-only mocking belong to **`tdd`**, which loads alongside this skill — not restated here. What it doesn't cover:

- **The source ships one shape, and the test adapts to it.** The dependency runs one way: a test reads the code, the code never reads the test. Meet a test-only need in the runner's config or setup, or by fixing the design until the test needs nothing special — a seam the production caller also uses. The tell is a source file that can tell it's under test (`NODE_ENV`, an `isTest` flag), or an export that only a spec calls: that branch ships a second path production takes and no test runs, so green says nothing about the code that actually executes.
- **Assert something that can fail.** `toBeDefined()`, a bare `not.toThrow()`, or a snapshot nobody read prove only that the code ran. Assert the value or effect the caller actually depends on.
- **Scope the assertion to the block under test, then mutation-check it.** A `toContain` over the whole rendered output passes whether or not the block did anything — the same figure is usually emphasised somewhere else in the document. Assert against the element or slice you're covering, then break the line it covers and confirm the test goes red. Scoping alone isn't enough where the matcher itself substring-matches: `toHaveTextContent('touched')` passes on `"untouched"`, so a fixture rendering a word and its negation is green in both states — use disjoint tokens (`yes`/`no`) or anchor the regex. In Browser Mode each locator a mutation makes miss costs the full `testTimeout` before it reports (`vitest` → `reference/dom.md`), so a mutation check over several assertions is one backgrounded run, not a run per mutation.
- **A render helper that mounts once can't cover a prop change.** Announce-again, reset-on-change, anything that exists only *when* a prop moves is unassertable through a mount-only helper — give the helper a re-render before reading the gap as a component that needs no coverage.
- **A source sweep is a test only once mutation has proved it.** Where a package has no DOM to render into, a sweep over the parsed file is the only gate a markup rule gets — and a matcher that stops reaching anything passes green and silent. Mutate the real source until each assertion fails, then restore.
- **A test that asserts a literal was passed is a change-detector.** `toMatchObject({ x: "value" })` restates the source line and covers no behavior; the comment on that line is the guard against deletion, and a test on top of it is redundant with the comment. Cut it — even when the value is irreversible or invisible to `tsc`.
- **Trace who can produce the input before testing a guard.** If the only writer is our own code from a closed set (and the upstream API enforces the set too), the branch is unreachable and the test covers nothing. "Defense in depth" is not a reason — keep the guard, drop its test.
- **User flows over isolated renders.** One flow exercising render + interaction + result beats many "renders X" tests. Cross-boundary flows are highest-value.
- **Cover the space, not just the happy path** — validation failures, empty and boundary inputs, error and permission paths, concurrency where it's real. Map the edge cases before writing.
- **One reason to fail per test**, arrange-act-assert shape, and a name that's a scannable statement of the behavior — `formats USD prices`, not `should correctly return the formatted price string when given a valid positive number`.
- **Deterministic — no flakes.** Control time, randomness, and network, and reset mock/spy state between tests (the runner's restore-mocks config where it has one, otherwise explicit teardown) — a leaked spy is an order-dependent failure that passes locally and only appears in CI. No sleeps; wait on conditions — for a transition, the promises from `Element.getAnimations()` on the element after forcing a style read; `document.getAnimations()` waits on whatever else happens to be moving. A flaky test is a failing test.
- **A module-level store needs a reset the suite can call.** A root-mounted imperative host — a toaster, an `ask` — keeps its queue outside any test's tree: ship a reset export and drain it in `afterEach`, and mount the host inside each test's own tree, since one mounted in setup resolves navigation against the setup's router rather than the one under test.
- **A duplicate-looking test is redundant only when both paths run one implementation.** Two tests asserting one behavior through two entry points cover two things where the entry points diverge below the surface; trace before cutting. Siblings sharing a behavior take a fixture exporting the shared spec — `describeSortable(Component, case)` — run once per sibling, so the behavior is stated once and every sibling is held to it.
- **A tolerance is calibrated against the smallest defect it must catch.** A golden image polices drawing, not text: measure what a one-character difference actually costs in pixels before picking a threshold, or a wrong string passes as a rounding error. Assert strings exactly, in a tier that doesn't go through the image.
- **Right level.** Favor integration for confidence, unit for logic-dense pieces — and where a mock is unavoidable, `tdd`'s boundary rule decides whether it's allowed at all.
- **A double mirrors one boundary, and says which.** A module double serving both a direct unit call and a rendered flow can only be shape-honest at one of them. Name the boundary it mirrors, assert the other through the mock's call args, never through a field the double invented.

## The run→fix loop

- Run the exact suite command the repo uses (from its scripts), scoped to the files you touched; fail fast where the runner supports it.
- **One-shot, never watch.** Plenty of repos wire the default `test` script to interactive watch mode — it never exits, and it hangs your run with no result to report. Take the repo's own one-shot/CI script if it has one, otherwise pass the runner's non-watch flag; confirm from the script and the runner's docs, not from habit.
- On failure, read the actual error and fix the test **or** flag a genuine product bug — say which. Don't paper over a real defect by loosening the assertion.
- Cap at ~3 fix iterations on the same failure. Still red? Stop and surface what's blocking, with the error.
- **Red because another seat's artifact doesn't exist yet** (a table the data seat owns, a helper the auth seat exposes) is handed over red — but proved first: pass the test against a throwaway stand-in, delete the stand-in, and say in your return that the red is the missing artifact and nothing else. A red nobody has seen green is a test that might be wrong, not a spec.

Done when the scoped suite is green, or you've named what's blocking and why.

## Not this skill's job

- **The red → green loop** — one failing test → the minimal code that passes it → the next; where the seams under test are agreed; and the anti-patterns (never batch the tests, never let the expected value restate the implementation): `tdd`. Refactoring is not in that loop — it belongs to review.
- **Coverage sweeps, fan-out across many files, repairing a suite that was already red, and writing the discovered conventions down** for next time: the `test-writer` seat, which runs this skill in its own context.
- **Standing up a runner** where none exists — config, scripts, CI wiring: `toolchain-engineer`. If discovery finds no harness at all, say so and stop; don't scaffold one mid-feature.
