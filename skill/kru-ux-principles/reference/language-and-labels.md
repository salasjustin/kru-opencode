# Language & labels

Does the wording match the user's world, not the system's? Every entry here flags a structural mismatch — a leaked system value, a missing label, a promise a link doesn't keep — never the wording itself; picking the right words is `ux-copy`'s job.

---

## Speak the user's language, not the system's

**Principle:** user-facing text is written in the vocabulary of the user's task, never the system's internal vocabulary — error codes, enum values, database column names.
**Mechanism:** users map interface text onto their own mental model of the task; a raw system token has no such mapping, so it reads as noise they must decode or escalate to support instead of act on.
**Code signal:**
  - an error message rendered straight from a caught error's `.message`/`.code` with no mapping — `{error.message}`, `<p>{err.code}</p>`
  - a raw enum/status value rendered verbatim as the visible text — `status: "PENDING_REVIEW_L2"`, a badge whose text is `role_id === 3 ? "3" : ...`
  - a database column or internal key leaking into a label — `<label>fk_user_id</label>`, a table header literally `created_at_utc`
**Fix:** add a lookup from system value to user-facing string and render that; keep the raw value in logs/`data-*` attributes only. The string itself is `ux-copy`'s call — this only flags that the leak exists.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (match between system and the real world) · https://www.nngroup.com/articles/match-system-real-world/ (2018)

---

## A link's label must promise its destination

**Principle:** a nav item or link's text and the heading of the page it lands on share the same word for the same thing.
**Mechanism:** a link label is a promise the user acts on before seeing the result; on arrival they scan for confirmation — usually the page's own heading — and if it shares no word with the label they clicked, they can't tell whether they arrived correctly or misread the label.
**Code signal:**
  - a nav item's text and the destination route's `<h1>`/page-title string share no common word — a sidebar link "Team" routing to a page headed "Members"
  - the link label and the destination heading are pulled from two unrelated string constants with no shared source
  - a breadcrumb's final crumb differs from the page's own title string
**Fix:** derive the nav label and the destination heading from one shared string, or make one an explicit variant of the other.
**Applies when:** a link to a hub/index page that intentionally covers several concepts is the exception — the mismatch matters when the label promises one specific thing.
**Detect:** STATIC
**Source:** *Don't Make Me Think*, ch. 2 · https://www.nngroup.com/articles/link-promise/ (2014)

---

## The same concept keeps the same word everywhere

**Principle:** one entity or action is named with a single term across every component, route, and string it appears in.
**Mechanism:** consistency is what lets a user transfer what they learned on one screen to the next; if the same underlying thing carries several names, they can't tell it's the same thing, and each divergent term forces a fresh re-learning.
**Code signal:**
  - one backend entity rendered under different labels by different components — a `project` record labeled "Project" in the sidebar, "Workspace" in settings, "Team" in billing
  - the same mutation's trigger button reading differently by route — "Remove" here, "Delete" there, "Archive" on a third screen, for the identical call
  - grepping the entity name across the codebase turns up three or more distinct literal spellings instead of one shared constant/i18n key
**Fix:** pick one term, centralize it in a shared constant/i18n key, and replace the drifted literals.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (consistency and standards) · https://www.nngroup.com/articles/consistency-and-standards/ (2021)

---

## Button labels name the action, not a status word

**Principle:** a button that changes state is labeled with the verb it performs; generic acknowledgements are reserved for dialogs with no consequence.
**Mechanism:** recognition beats recall — a specific verb lets the user confirm what they're about to do without having re-read and remembered the surrounding sentence, and a habitual click-through skips exactly that check when the label is generic.
**Code signal:**
  - a `<button>` whose literal text is `OK`, `Submit`, `Yes`, or `Confirm` on a form or dialog that isn't a no-op acknowledgement
  - a confirmation dialog's affirmative button reusing one shared, generic label regardless of what it confirms — a single `<ConfirmButton label="OK">` used at delete, archive, and publish call sites
**Fix:** name the button after the mutation it triggers ("Delete project", "Publish post"). The exact wording is `ux-copy`'s call; this flags that the label is generic, not what it should say instead.
**Applies when:** transient, no-consequence acknowledgements ("Got it", "OK" on a toast) are the accepted exception.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (match between system and the real world) · https://www.nngroup.com/articles/ui-copy/ (2019)

---

## A placeholder is not a label

**Principle:** every input has a persistent label element; placeholder text supplements it and never stands in for it.
**Mechanism:** placeholder text vanishes the instant the user types, so it can't be referred back to — the user has to hold what the field wants in working memory for the entire time they're filling it in, and a screen reader has nothing to announce as the field's name.
**Code signal:**
  - an `<input>`/`<textarea>` carrying a `placeholder` attribute with no associated `<label for>`, `aria-label`, or `aria-labelledby`
  - a form field whose only visible text lives inside the input itself, gone the moment it holds a value
  - a component library's `label` prop left unset while its `placeholder` prop is populated
**Fix:** add a persistent label associated via `for`/`id` (or `aria-label`); keep the placeholder, if any, for a format hint layered on top of a real label.
**Applies when:** always — note the overlap: a missing accessible name is simultaneously a WCAG defect, so cite `accessibility-review`'s lane rather than re-auditing it.
**Detect:** STATIC
**Source:** *Don't Make Me Think*, ch. 3 · https://www.nngroup.com/articles/form-design-placeholders/ (2014)

---

## One label must not mean two different things

**Principle:** the same word or label is never bound to two semantically different actions or entities elsewhere in the app.
**Mechanism:** recognition only works if a label reliably predicts its outcome. Meeting a control with a familiar label that now does something else doesn't teach the user something new — it overwrites a correct memory with a wrong one, which costs more than an unfamiliar label would have.
**Code signal:**
  - a shared component or string constant (`ArchiveButton`, `t('actions.remove')`) wired to different handlers at different call sites — one soft-hides, another hard-deletes
  - one field name ("Name") used as the label for two different entities within the same flow — a person on one step, an organization on the next — with nothing distinguishing which
  - a status word ("Active") whose meaning flips between two resource types in the same UI with no qualifier
**Fix:** give each distinct meaning its own label, or qualify the shared word ("Archive project" vs. "Archive comment").
**Applies when:** deliberate reuse of one word for genuinely equivalent actions is fine — the defect is when the underlying operation actually differs.
**Detect:** HEURISTIC — telling "different enough to confuse" from "consistent metaphor" needs domain knowledge the code doesn't state; report as a question.
**Source:** *10 Usability Heuristics* (recognition rather than recall) · https://www.nngroup.com/articles/recognition-and-recall/ (2024)

---

## Mark required and optional on the field, not just at the top

**Principle:** every form field states, at the field, whether it's required or optional — never left to a top-of-form legend or color alone.
**Mechanism:** users skim a form field-by-field and rarely read a page-level instruction line more than once, if at all; a marker that lives only at the top is absent at the exact moment — mid-field — that it's needed.
**Code signal:**
  - a `required` attribute or validator on the field with no visible `*`/"(required)" text rendered next to that specific label. **The HTML `required` attribute is not a marker** — it's enforcement the user only meets *after* trying to submit, which is the moment the marker exists to precede. A field carrying `required` and no visible text still fires this signal.
  - a page-level sentence like `"* = required"` or `"all fields required unless noted"` with no per-field marker anywhere else
  - required fields marked but optional ones left bare, or vice versa — only one side of the pair is stated
**Fix:** render an explicit marker on every field, driven from the same validator the form already uses so the marker can't drift from the actual rule.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (recognition rather than recall) · https://www.nngroup.com/articles/required-fields/ (2019)

---

## Truncation must not destroy the only copy of an identifier

**Principle:** a user-facing identifier that gets visually or programmatically clipped is still available in full somewhere the user can reach.
**Mechanism:** recognition depends on comparing what's on screen to what's remembered or seen elsewhere; a truncated string that drops the differentiating part stops being comparable, and two different values can collapse to an identical, indistinguishable display.
**Code signal:**
  - a hardcoded `.slice(0, N)` / `.substring(0, N)` / `.substr(0, N)` applied to a user-facing name, email, or ID, with no full value shown in a `title` attribute, tooltip, or detail view
  - a CSS `text-overflow: ellipsis` / `truncate` class on a label that is the row's only distinguishing text, with no hover/focus/click affordance to see the full value
  - an abbreviation computed at render time (`name.slice(0,3) + '.'`) rather than sourced from the domain, so distinct values can render identically
**Fix:** stop clipping where space allows; where it doesn't, pair the clipped text with the full value in `title`/`aria-label` or a one-click detail view.
**Applies when:** lower stakes where the full value is already shown elsewhere on the same screen (e.g. a detail panel already open) — worst when the truncated string is the *only* identifier visible.
**Detect:** STATIC
**Source:** *Don't Make Me Think* (recognition over recall) · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)
