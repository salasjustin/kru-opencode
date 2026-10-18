---
name: kru-text-fix
description: Run every text pass a target earns — comments, rendered strings, human docs, agent docs — in one go, each under its own standard.
disable-model-invocation: true
---

Four classes of text, four standards, and a real target almost always carries more than one. **One target, one read, every class that fires — each still under its own standard, none of them restated here.**

**Every hunk in the resulting diff is text** — a comment line, a string the user reads, human doc prose, or agent-doc prose. No code moves, nothing reformats, no imports churn, and no frontmatter `name` or invocation changes. That's the completion criterion, and it's checkable: read `git diff` at the end, and revert anything else the passes or a formatter touched.

## Do

1. **Resolve the target** from the invoking task, by the table at `{KRU_HOME}/skill/kru-comment-fix/SKILL.md` → step 1 — the four-row one, and the bound under it that a *diff* target audits what the change wrote while a *path* target means whole files. That bound is what keeps four passes from becoming four sweeps.

2. **Classify every file the target resolved to.** A file firing more than one pass is the normal case, not an edge:

   | what the file carries | pass | canonical text |
   | --- | --- | --- |
   | comment lines, in any language | comments | `{KRU_HOME}/skill/kru-comment-fix/SKILL.md` |
   | strings the user reads or hears — JSX text, `placeholder`/`aria-label`/`alt`/`title`, i18n source locale, form-action errors, toasts, email templates | rendered copy | `{KRU_HOME}/skill/kru-prose-fix/SKILL.md` |
   | `README*`, `CONTRIBUTING*`, `DEPLOY*`, `docs/**`, root-level `*.md` | doc prose | `{KRU_HOME}/skill/kru-doc-fix/SKILL.md` |
   | `AGENTS.md` | agent docs, always-loaded | `{KRU_HOME}/skill/kru-setup/SKILL.md` → *3. The bars, and the pass* |
   | `skill/kru-*/SKILL.md` and the reference files beside them, `agent/kru/*.md`, any doc a pointer names | agent docs, reached by a pointer | `{KRU_HOME}/skill/kru-writing-for-agents/SKILL.md` — plus `SKILL-MECHANICS.md` when the file is a skill, `REFUSALS.md` when the line is a gate's block message |

   A `.ts`/`.tsx`/`.svelte`/`.go`/`.py` file fires **comments**, and also **rendered copy** when it holds a string a user reads. A marketing route's copy is `copy-editing`'s and stays out, as does everything each pass's own file excludes.

3. **Run pass by pass, not file by file.** Load one standard, run it over every file that fired it, then move to the next — each pass's classes are a lens, and two cut-lists read at once blur both. A pass no file fired is skipped, and step 6 says so.

4. **The three `-fix` standards carry their own bounds. The agent-doc rows are a standard rather than a pass, so the bounds are here.** Cut what the bars and the levers name: no-ops, duplication, a re-authored rule whose home is elsewhere, cheap caches of what the environment already answers, stale lines, self-description, a prohibition where the positive target reads better, a pointer whose wording is too weak to fire it. Two things stay: **frontmatter `name` and `disable-model-invocation`**, which are API rather than prose — a `description` is prose and in scope — and a **vendored body**, upstream's text, whose disclosed deviations are the only part that is ours.

   A **sprawl** call — a document simply too long, whose cure is splitting by branch or disclosing reference behind a pointer — goes in the report. Restructuring a document the whole repo reads is a design call, and this pass changes wording.

5. **Each standard's own "only thing that moves" line is scoped to its class here, and the union above is the bound.** `comment-fix` alone says every hunk is a comment line; here that means every hunk *it* writes is a comment line. Where two passes meet in one file, both are yours and each edit answers to its own standard — the hand-off notes those files carry (*a hit inside a comment is `comment-fix`'s; leave it and say so*) resolve to *fix it under the other pass* rather than to a line in the report.

   One conflict has a winner: `doc-fix` and `prose-fix` ban `—` binary because a human reads that text, and an agent doc is not that text. **The file's class decides**, so a `—` in `README.md` goes and the same character in `AGENTS.md` stays.

6. **Report, one section per pass that ran**, each a counted summary with its notable changes, as its own standard specifies; the per-edit lists with `file:line` on request. Then the passes that were skipped, and the sprawl calls from step 4. Then the union diff check from the top of this file, in a line: what moved, and that it was text only.

## Don't

- Don't run the formatter, the linter, or the build afterwards. The test literals `prose-fix` carried are the only thing that could go red, and the diff already shows them; a formatter's diff hides all four passes at once.
