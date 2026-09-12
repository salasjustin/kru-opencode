# The screen passes — what they are, how to brief them, and what stays the user's

Detail behind `SKILL.md` → Step 4, *Screen passes*. Reached on UI work; a non-UI change never loads this.

## The two passes have seats, and you dispatch them

`visual-reviewer` and `accessibility-reviewer` are review-only agents whose entire body is the corresponding skill file — same rules, same output, same boundaries, read from the one copy. **Two callers, one body:** the user still types `/kru/visual-review` · `/kru/accessibility-review` and gets the pass inline; you spawn the seat and get it in an isolated context, in parallel with your other Step 4 gates.

**Conformance is the repo's own gate**, written in Phase 0 and run at every commit (`{KRU_HOME}/kru/references/ui-handoff.md` → *Conformance is prevented, not detected*) — so an off-token value is already a failing test by the time a pass could look, and neither seat here is briefed for one.

What that reversal does **not** touch is what a pass may conclude. `visual-reviewer` returns **breakage and causes, never a verdict on intent** — whether the build looks like the design stays the user's glance, and it's prevented upstream by a closed token file (*Conformance is prevented, not detected*, `{KRU_HOME}/kru/references/ui-handoff.md`). Dispatching the pass buys you coverage and rule violations; it does not buy you the design gate, and it never replaces the user's look.

## Brief them for coverage and cause, because that's the only part they win

The user has already seen the happy path in their own window. What nobody has rendered is the empty state, the error state, loading, disabled, focus-visible, 375, and the row with the 90-character string — so **name the states you want reached** in the handoff, and treat "no one has ever seen this screen" as a finding when it comes back.

The other half is tracing: a defect the user spots in a second costs them an hour to locate, and this seat returns it as a `file:line` with a scope.

What `visual-reviewer` no longer does is table numbers — tap targets are `accessibility-reviewer`'s, off-token values are the repo gate's, and asking this seat for them buys a browser-priced duplicate. **Contrast is nobody's**: the design decided it and it ships as authored, so neither seat reports a ratio and neither one is briefed for one.

Three things bound the batch:

- **Cost** — `visual-reviewer` drives a browser for minutes; run it on a slice that renders, not on every commit, and hand it the target pages **and the states you want reached** rather than "the app."
- **A report path, named per seat** — the brief hands each one the `report:` destination from `SKILL.md` Step 4; the transcripts, path maps and screenshots land there, and the return stays a capped fix list plus a pointer. A "Report" heading only earns its keep once the path under it is written.
- **Run the suite first on a token-shaped defect** — a literal hex or an off-scale value is already a failing test, and finding it in a browser costs a hundred times more.

## The user's passes

These have no seat and you never dispatch them — they run inline in the main thread when the user names one, on the target they name:

- `/kru/seo-review` — technical SEO/AEO audit, markup fixes on request.
- `/copywriting` · `/copy-editing` · `/cro` — write/rewrite a marketing page's copy · line edit · conversion audit of an underperforming page/form.
- `/kru/review-animations` · `/kru/improve-animations` — motion craft review · prioritized motion roadmap.

These are cheap to run after the fact and each carries its own **taste** — which is exactly why they stayed the user's when the two screen passes didn't: a copy rewrite or a motion roadmap is a preference, and dispatching one as a gate means the team quietly editing the user's voice.

There's no copy or SEO seat: builders ship the page with working draft text, checked the way visuals and motion are — by the user, when they care. Copy for lay/client audiences explains deliverables by what they're for, not by category label (learned preference). In-product microcopy stays `ux-designer`/`ux-copy`'s lane; channels/campaigns stay out of scope (`ROSTER.md`).
