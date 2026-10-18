# The screen passes — what they are, how to brief them, and what stays the user's

Detail for **PM-named** screen passes and Step 5 acceptance checks. The lead **does not** dispatch these in Step 4; list screens and flows for the PM on the preview unless the **task names** a pass or seat explicitly.

## The two passes have seats — PM or task invokes them

`visual-reviewer` and `accessibility-reviewer` are review-only agents whose entire body is the corresponding skill file — same rules, same output, same boundaries, read from the one copy. **Two callers, one body:** the PM types `skill/kru-visual-review/SKILL.md` · `skill/kru-accessibility-review/SKILL.md` for an inline sweep, or names the seat in the task for an isolated run — not an automatic Step 4 batch.

**Conformance is the repo's own gate**, written in Phase 0 and run at every commit (`{KRU_HOME}/kru/references/ui-handoff.md` → *Conformance is prevented, not detected*) — so an off-token value is already a failing test by the time a pass could look, and neither seat here is briefed for one.

## Brief `visual-reviewer` for spec match and coverage

Hand it:

1. **Approved mockups** — paths or URLs for the screens in the slice, at the frames engineering must match.
2. **Build spec pointer** — file or link from the PM brief.
3. **Target** — URLs/pages and the states the spec names that mockups do not show.
4. **Report path** — per `gates.md`.

The seat compares the running UI to the mockups at **1440** and **375**. Mismatches are **FIX** findings for the builder. It still covers empty/error/loading/disabled/focus and traces breakage to `file:line`.

Without mockups in the brief, the seat returns that spec match cannot run; you should have stopped at Step 3's design spec gate.

`accessibility-reviewer` is unchanged — structural WCAG; contrast ratios are not recomputed.

Three things bound the batch:

- **Cost** — `visual-reviewer` drives a browser for minutes; run on slices that render, with explicit pages and spec pointers.
- **A report path, named per seat** — transcripts and screenshots land there; the return is a capped fix list plus pointer.
- **Run the suite first on a token-shaped defect** — literals and off-scale values belong in the repo gate, not the browser.

## The user's passes

These have no seat and you never dispatch them — they run inline when the user names one:

- `skill/kru-seo-review/SKILL.md` — technical SEO/AEO audit, markup fixes on request.
- `skill/kru-copywriting/SKILL.md` (PM loads when the task names it) · `skill/kru-copy-editing/SKILL.md` (PM loads when the task names it) · `skill/kru-cro/SKILL.md` (PM loads when the task names it) — on copy that already ships. A page not yet written is `conversion-copywriter`'s, routed before design (to the external designer) or build.
- `skill/kru-review-animations/SKILL.md` · `skill/kru-improve-animations/SKILL.md` — motion craft review · roadmap (PM or lead `read` when the task names that pass).

Marketing copy for new pages: `conversion-copywriter` → PM → designer mockups → PM spec → engineering. In-product microcopy and flows: design spec only; technical SEO: `skill/kru-seo-review/SKILL.md`.
