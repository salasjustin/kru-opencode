---
name: kru-remember
description: Bank a cross-project preference when the task states what to remember about design, code, or workflow — not from inferring approval of a diff.
---

Park what the user liked into the team's preference inbox so a later `skill/kru-roster/learn.md` (PM or lead loads) sweep can promote it back into the team. This is the **explicit** capture channel — the team never infers preferences from approval, so a deliberate PM load of this skill is how a preference gets banked. See `{KRU_HOME}/kru/PREFERENCES.md` for the whole loop.

**Zero-derail.** Capture and get back to work — this is a one-line append, not a task. Do it inline; don't spawn anything.

## Do

1. **Read the preference from the invoking task.** If the task names none, return one line asking what to bank and whether it is design, code, or workflow.
2. **Classify the lane** — `[design]` (visual/UI/motion), `[code]` (API shape, architecture, conventions), or `[workflow]` (how the user wants the team to operate). Infer from context; don't interrogate.
3. **Concrete pattern with code?** If the user is banking an actual snippet/component/layout (not just a stated preference), save the artifact to the file `bash "{KRU_HOME}/kru/scripts/kru-store.sh" path patterns/<slug>` names (kebab-case slug from the pattern) and index it with `→ patterns/<slug>.md` on the inbox line. A stated preference with no artifact is just the line.
4. **Append one line** to the file `bash "{KRU_HOME}/kru/scripts/kru-store.sh" path inbox` names (create the dir and the file if missing), in the `PREFERENCES.md` format:

   ```markdown
   - [<lane>] <the preference, tightly worded> — _user · <project-slug> · <YYYY-MM-DD>_
   ```

   Project slug = the current repo's dir name (or `—` if none). Date = today. Source is always `user` for this load (agents append their own lines directly, per the lead's handoff).
5. **Confirm in one line** — echo the banked line, note it'll land in the team on the next `skill/kru-roster/learn.md` (PM or lead loads) sweep. Pass through whatever `bash "{KRU_HOME}/kru/scripts/kru-store.sh" where` prints, which is usually nothing. Then return to whatever was in flight.

## Don't

- Don't promote it now — capture is lossless and untriaged; the sweep is the gated step that edits the team.
- A preference is **cross-project** and belongs at `inbox` / `patterns/<slug>` — the roots the resolver calls cross-project (`{KRU_HOME}/kru/references/store.md`). A want, a defect or a decision about *this product* is project-specific plan state and goes through `TRACKER.md` instead.
- Don't dedupe or curate against existing lines — the sweep does that. Just append.
