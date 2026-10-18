---
name: kru-visual-review
description: Compare the rendered UI to the approved design spec at desktop 1440 and mobile 375, plus coverage of states nobody opens — report mismatches and breakage to the builder. Spawns the sweep to a subagent; report-only.
disable-model-invocation: true
---

You review the UI as it actually renders, in a real browser, against the **approved design spec** the PM handed engineering.

## What this pass is for

**The build must match the approved mockups and build spec.** Engineering does not design in-session; this pass is where intent is checked in pixels.

1. **Spec match (required)** — at **desktop ~1440** and **mobile 375**, compare each screen in the slice to the mockups the brief names. Layout, hierarchy, spacing, type scale, colour roles, component choice, and visible copy that appears on the mockup are in scope. Report each mismatch as a finding with evidence (screenshot path) and a concrete fix for the builder. Name the spec file or mockup path in the report header.
2. **Coverage** — states and widths the mockups do not show but the build spec names (empty, error, loading, disabled, focus-visible, content extremes). **"This state exists and no one has checked it"** is a finding even when it looks fine.
3. **Root cause** — when something is broken (not merely off-spec), trace to `file:line` and scope.

**Contrast and ratios** stay as authored in the spec — report unreadable text as breakage or mismatch, do not re-litigate the design's chosen pairs.

**Numbers are evidence, not output.** Measure when the eye is unsure; never table computed styles across a page. Tap targets and WCAG criteria → `skill/kru-accessibility-review/SKILL.md`. Off-token values → the repo's conformance gate.

**Target**: URL, pages, or states named in the task; otherwise pages touched by the slice. **Context**: paths/links to the approved mockups and build spec from the brief — without them, stop and return that the sweep cannot run; the lead should have stopped at the design-spec gate and must not dispatch UI builders.

**Report-only**: findings with evidence; fixes are for the builder unless the task asks otherwise after reading the report.

## Dispatch — spawn the sweep, never run it in the main thread
The sweep is browser-driven and pins a thread for minutes; the main thread must stay free. After gathering target + spec context, spawn **`visual-reviewer`** with: target (URL/pages/states/viewports) and spec (mockup paths/links, build spec pointer, states to reach). Everything outside this section is the sweep body that seat executes.

**Two callers, one body.** The lead loads this file or dispatches `visual-reviewer`. `disable-model-invocation` keeps the skill off the ambient menu.

## Drive the browser via local-browser
Follow **`local-browser`** — dev server must already be running; use **`emulate`** for 375 (not `resize_page` below ~500px).

## Scope the sweep before you start
- **Spec pass:** every screen in the slice at **1440 and 375** against the named mockups — one finding per mismatch, grouped by screen.
- **One representative page per layout family** for extra state coverage if the spec lists states beyond the mockups.
- **Systemic causes once** — shared header, token, root `font-size` — one finding with scope, not per route.
- **Say what you skipped** in the coverage line.

## Sweep — for each target page
1. **Spec viewports first** — emulate desktop ~1440, then `{viewport: "375x812x3,mobile,touch"}`. Screenshot and compare to the matching mockup frame.
2. **Named states** — drive empty, loading, error, disabled, focus-visible, extremes per build spec; capture each.
3. **Trace breakage** to `file:line` when the issue is implementation, not spec ambiguity.

## What to catch
- **Spec mismatches** — wrong spacing, type, colour role, missing/extra element, wrong breakpoint behavior vs mockup at 1440 or 375.
- **Missing or broken states** per build spec.
- **Overflow/clipping**, unreadable text, broken layout, assets wrong.
- **Ambiguous grouping** — see `skill/kru-composition/reference/layout.md` when it affects match to spec.

## Output
- Per finding: `SEV(high|med|low) — <what>` + page/state/viewport + evidence + mockup/spec reference + fix (and `file:line` when traced).
- **Spec summary line** — screens checked at 1440/375, pass or count of mismatches.
- **Coverage line** — states reached, states unreachable, skips.
- Verdict: **SHIP** (no high/med) or **FIX** (builder should address, priority order). Mismatches to the approved spec are **FIX**.

## Boundary
Spec match at 1440 and 375, coverage, root cause. WCAG → `skill/kru-accessibility-review/SKILL.md`; off-token values → repo gate; correctness → `code-reviewer`; journey → `ux-auditor`.
