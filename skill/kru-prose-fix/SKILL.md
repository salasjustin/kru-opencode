---
name: kru-prose-fix
description: Audit the strings a target renders to the user — labels, helper text, errors, empty states, CTAs, confirms, catalogs — and fix them in place.
disable-model-invocation: true
argument-hint: "[<path> | <branch> | <pr number> — omit for the working tree]"
---

The rendered string is the deliverable and the only thing that moves. The house standard, in one line: **copy says what the UI cannot show, and promises only what the code holds.** The rules behind it live in `ui-patterns` (the text-and-icons group) and `ux-copy`; load both before reading a hunk, and take the reasoning from there — this file carries the classes to look for, not the why.

**Every hunk in the resulting diff is a string the user reads or hears** — JSX text, `placeholder` / `aria-label` / `alt` / `title` values, i18n catalog entries, form-action error strings, toasts, email templates, and the test literal that pins one of those. That's the completion criterion, and it's checkable: read `git diff` at the end, and revert anything else the pass touched.

## Do

1. **Resolve the target** from `$ARGUMENTS`:

   | argument | scope |
   | --- | --- |
   | *(none)* | the working tree — `git diff HEAD`, plus untracked files |
   | a path or glob | those files, whole |
   | a branch name | `git diff <base>...<branch>` — three dots, the branch's own work |
   | a number | a PR: `gh pr checkout <n>` first (fixing needs a working tree), then its three-dot diff |

   **A diff target audits what the change wrote, not every string in the files it grazed.** Out of the target regardless: log lines, developer-facing `Error` messages, fixtures, `README`/`docs/` (`doc-fix`'s), marketing routes (`copy-editing`'s), and whether a mark has an `alt` or `aria-label` at all (`accessibility-reviewer`'s — its wording is yours).

2. **Match the repo's vocabulary.** Grep the existing strings before rewording one: a term users have already learned beats a better word for it. In a catalog, the **source locale is the target**; a reworded `en.json` beside an untouched `fr.json` is a stale-translation line in the report, not a second edit.

3. **Cut or reword** — each is a class, not a phrasing:
   - **Narration** — a line describing what the screen already demonstrates: *use the form below to update your profile*, *enter your email* under Email, a caption naming what the picture shows, a tooltip restating the label. Cut it. `ui-patterns` reads such a line as a defect report on the control; the control is code, so it goes in the report, not the diff.
   - **Outcome claims** — copy promising the side of a number the product doesn't fix (*100% reaches the recipient* from a rule that only sets the sender's fee). Reword to the side the rule holds.
   - **A stored name leading a sentence** or in the possessive — `{name} removed this`, `{name}'s changes` → `removed by {name}`, `changes by {name}`.
   - **A vague action** — *Submit*, *OK*, *Are you sure?* → the verb and its object: *Create account*, *Delete 3 files?* / *Delete files* · *Keep files*.
   - **A field error restating its label** — *Email is required* under Email → *required*. A system-level error missing what happened, why, or what to do next gets the missing part.
   - **A status word that only parses relative to its column** — *Ready*, *Not yet*, *None yet* → one that reads alone (*Configured* / *Incomplete*), spelled the same in every section.
   - **AI tells** — filler verbs (*elevate*, *seamless*, *unleash*, *effortless*) and fake-perfect numbers, from the `design-taste-frontend` skill's **AI Tells** catalog; and copy's own: exclamation cheer (*Great job!*, *You're all set!*) where a state word says it (*Saved*), *oops* / *uh-oh* / *whoops* leading an error, and mock-warm asides (*we're here to help*, *don't worry*) that carry no instruction.
   - **Em-dashes** — binary, no *sparingly* allowance: no `—` survives, and no `–` used as a separator. Restructure instead — a period, a comma, a colon, or two strings; ranges take a hyphen (`Mon-Fri`, `$40-80`); a title-and-subtitle pair takes two elements. It's checkable: at the end, `grep -n '—\|–' <touched files>` hits nothing inside a rendered string. A hit inside a comment is `comment-fix`'s; leave it and say so.

4. **Keep, always:**
   - **Empty states, errors, confirms, refusals** — nothing on screen demonstrates what happened or what to do next, so these are what copy is for. Tighten the wording, keep the line.
   - **A consequence the UI cannot show** — *this can't be undone*, a fee, an errand elsewhere.
   - **Vendored and generated strings** — a library's default messages are not yours to restyle.

5. **Carry the edit to its shadow.** A test that pins the old string by literal (`getByText`, `toHaveTextContent`, a snapshot) gets the same edit — it's the same string, and the diff shows both halves.

6. **Report.** One line per edit, grouped *cut* · *reworded* · *carried*, each with `file:line`; then the controls step 3 surfaced, each with its `file:line`. Then the diff check from the top of this file, in a line: what moved, and that it was rendered strings only.

## Don't

- Don't run the formatter or the build afterwards. The literals step 5 carried are the only thing that could go red, and the diff already shows them.
