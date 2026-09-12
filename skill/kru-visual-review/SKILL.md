---
name: kru-visual-review
description: Coverage pass on the rendered UI in a live browser — the states and widths nobody ever renders, what breaks in them, and the root cause behind it. Spawns the sweep to a subagent; report-only.
disable-model-invocation: true
argument-hint: "[url or pages/states]"
---

You review the UI as it actually renders, in a real browser.

## What this pass is for — the states nobody renders, and the root cause behind a defect
**The user has already looked at this page.** They looked at it in their window, at their width, logged in, with their seed data, on the happy path — and at *does this look right* they beat any agent in a glance. Two things that look does not cover are what this pass is worth its cost for:

- **Coverage** — the states and widths in *Sweep* below, most of which nobody has ever rendered. A state nobody has looked at is where defects survive, so **"this state exists and no one has seen it"** is a finding by itself: say it even when what rendered was fine.
- **Root cause** — a defect is visible in one glance and costs an hour to locate: three pages read subtly wrong because root `font-size` is 15px at `app.css:12`, so every rem is 6.25% short. Turning a symptom into a `file:line` and a **scope** is the expensive half, and it's your half.

**Report what broke and where it came from; leave what it should have looked like to the user.** Whether the build matches its design is settled by their glance, prevented upstream by a token file that closes the set, and enforced by the repo's own conformance gate at every commit. A finding of yours that would survive the user disagreeing about the design is a finding; "feels off" is you guessing at their call.

**Numbers are evidence, not output.** Measure when the eye is genuinely unsure — is that actually overflowing, is that element really 8px out — and put the one number inline next to the finding. Never a table, never a sweep of computed values across a page. Two whole classes of number are somebody else's: **tap-target sizes and WCAG criteria → `/kru/accessibility-review`** (it drives the same browser and carries the criterion number), **values outside the token file → the repo's conformance gate** (already a failing test, and a hundred times cheaper there). Hand those over by name rather than tabling them here. Contrast is the **design's** — report unreadable text as breakage and leave the number out.

**Target**: `$ARGUMENTS` if given (URL, pages, specific states/viewports); otherwise the running dev server's pages touched by the current build. Read the `AGENTS.md` `## Design system` pointer if one exists — not to certify intent, but so a cause you trace lands on the token that owns it. **Report-only**: findings with their evidence, unsoftened; fixes only when the user asks after reading the report.

## Dispatch — spawn the sweep, never run it in the main thread
The sweep is browser-driven and pins a thread for minutes (viewport drives, state drives, screenshots); the main thread must stay free for the user. After gathering the target + context above, spawn the **`visual-reviewer`** agent with a prompt carrying: the target (URL/pages/states/viewports) and the context (design plan / token pointer / user-named states). Relay the returned report unedited. Everything outside this section is the sweep body that seat executes.

**Two callers, one body.** The user runs `/kru/visual-review` and lands here; the lead dispatches `visual-reviewer`, which reads this same file and executes every section but this one (it *is* what gets dispatched, and subagents can't spawn subagents). `disable-model-invocation` still holds on the skill, so the slash command stays the user's front door and nothing fires this ambiently.

## Drive the browser via local-browser
Invoke and follow the **`local-browser`** skill — it wraps the `chrome-devtools` MCP server, headless, on a profile that keeps the login. Its rules bind you:
- **The dev server must already be running — never start it.** If nothing responds at the target URL, stop and ask the user to start it.
- **`emulate` owns the breakpoint** — `resize_page` clamps at ~500px and reports success, so anything narrower measured that way is a fiction.
- Work from `take_snapshot` uids; the skill's *Done when* binds this pass too.

Capture screenshots to files and `read` them — the capture is the evidence, and a defect you can point at in one is worth more than a value you computed. When you do need ground truth, `evaluate_script` gives it:
```js
// one targeted question, not a survey: is the page actually wider than its viewport?
() => ({doc: document.documentElement.scrollWidth, vw: innerWidth})
```

## Scope the sweep before you start — breadth is what makes this pass expensive
The full matrix is pages × viewports × states, and driven literally it runs for tens of minutes and returns the same finding many times. Cut it before the first screenshot:
- **One representative page per layout family gets the full matrix** — every viewport, every state. Pick the densest instance of each family (a form page, a list/table page, a detail page, the marketing hero). Every *other* page gets a targeted check only: does it overflow at 375, does its own unique content render.
- **Chase a systemic cause once, then stop enumerating.** A defect that appears on every route is one finding — a shared header, a token, a root `font-size` — not one per route. The moment it traces to something global, trace it to source, name the cause, state its scope ("all 7 admin routes"), and move on. Re-confirming it route by route is the single biggest way this pass burns time for no new information.
- **Don't re-derive what source can tell you faster.** One `grep` for the token or the class usually gives the cause in a step; iterating screenshots to infer it does not.
- **Say what you skipped** in the report (see *Output*). A bounded sweep that names its bounds is honest; a bounded sweep presented as exhaustive is worse than either.

## Sweep — for each target page
1. **States first — this is the half nobody else covers.** Empty, loading, error, disabled, hover, focus-visible, and the content extremes (a long string, a name that wraps, a list of one, a list of two hundred). Drive them via snapshot+click/fill; capture each. **A state you couldn't reach is reported, not skipped silently** — behind auth, needs seed data, no way to trigger it from the UI. A state that doesn't exist at all is a finding.
2. **Viewports**: desktop (~1440), tablet (~768), mobile (~375). Set each with **`emulate`** — `{viewport: "375x812x3,mobile,touch"}` renders a true 375px CSS viewport with the right DPR and touch. Chrome floors a real window at ~500px wide, headless included, so `resize_page` at 375 renders 500 and calls it a success. The override survives navigation, so set it once per breakpoint and drive every route under it — but `emulate` replaces the whole emulation state, so a later call for `colorScheme` carries the viewport with it or drops it. 375 is the mobile **floor** — no real phone is narrower; don't test 320/360 widths. Screenshot each.
3. **Trace what broke back to source.** A finding without a cause is a bug report the builder has to re-investigate. `grep` the class/testid/token and give `file:line` with the scope it affects.

## What to catch (cite viewport + state + evidence, assign severity)
Everything here is **plainly visible in a capture** — that's the bar.
- **Missing or broken states**: no empty state, no loading indicator, an error that renders as a blank page, focus that produces nothing visible, a disabled control that looks enabled. Layout shift between states.
- **Overflow/clipping**: horizontal scroll at any breakpoint, clipped text/controls, content escaping containers, `100vh` vs `100dvh` mobile cutoff.
- **Breakage in the pixels**: overlapping elements, an element rendering unstyled, a broken grid, content collapsing at one breakpoint, text unreadable over the image or gradient behind it (report it as unreadable and hand the *ratio* to `/kru/accessibility-review`).
- **Responsive**: does each breakpoint reflow, or is a desktop layout leaking into mobile?
- **Asset render**: blurry/stretched images, wrong aspect ratio, missing art, icon misalignment.
- **Motion/keyboard**: `prefers-reduced-motion` honored; keyboard focus visible and ordered; no motion-only affordances.

## Output
- Per finding: `SEV(high|med|low) — <what>` + page/state/viewport + evidence (screenshot path, and a number only where one settled the question) + the cause as `file:line` when you traced it + a concrete fix.
- **Systemic findings lead, and carry their cause and scope**: "root `font-size` is 15px (`app.css:12` shorthand), so every rem is 6.25% short — affects the whole type and spacing scale" beats seven per-route reports of the same thing. One entry, `file:line`, scope named.
- **The states you reached and what they showed** — including the clean ones, in one grouped line. "Empty and error render correctly on `/projects`" is the deliverable of a coverage pass, not filler. Don't invent defects to look thorough.
- **Coverage line** — what you actually swept and what you didn't: pages given the full matrix vs. the targeted check, states you couldn't reach and why (behind auth, needs seed data, no trigger), anything the browser wouldn't render. An unstated skip reads as a pass.
- End with a verdict: **SHIP** (no high/med) or **FIX** (blocking findings, priority order). The verdict is about breakage, never about whether the design is right.

## Boundary
What rendered, in the states and widths nobody else visits, plus the root cause behind it. Everything else routes: tap-target sizes and WCAG criteria → `/kru/accessibility-review` (contrast is the design's, audited nowhere); values outside the token file → the repo's conformance gate; correctness → `code-reviewer`; structure → `architecture-reviewer`; visual-regression baseline diffing (Percy/Playwright snapshots) → CI.
