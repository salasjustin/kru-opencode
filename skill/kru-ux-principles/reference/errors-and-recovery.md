# Errors & recovery

Prevention, recovery, undo. This is the most directly greppable group in the corpus — the code that fails here (validation schemas, form actions, catch blocks, error branches) is not inferred, it's read.

---

## Make the invalid input unreachable, don't just validate it afterwards

**Principle:** where an invalid value can be made untypeable, remove the path to it instead of catching it once it's in.
**Mechanism:** Nielsen's error prevention — the cheapest error is the one the interface never permitted. Validating after entry taxes the user with a report on a mistake the input's own type class allowed them to make.
**Code signal:**
  - a bare text `<input>` (no `type`, `pattern`, `min`/`max`, `maxLength`) whose value is checked against a constraint in the submit handler that the input itself could have enforced — a date field with no `min` paired with a "must be in the future" check
  - a free-text field for a value drawn from a fixed set (country, currency, plan tier) validated against an enum after submit rather than rendered as a `<select>`/combobox
  - a numeric-looking `<input type="text">` whose only guard is a post-submit `isNaN`/`parseFloat` check
**Fix:** move the constraint onto the input itself (`type`, `min`, `max`, `step`, `pattern`, `<select>` for enums) so the invalid value can't be typed; keep the after-the-fact check only as a safety net.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (error prevention) · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)

---

## Fix a slip with a constraint, a mistake with a better model

**Principle:** an execution error (right goal, wrong action) and a planning error (wrong goal) are different failures and take different fixes.
**Mechanism:** Norman's slip/mistake split — a slip is attention failing on a plan that was already correct; a mistake is the plan itself being wrong. A constraint, more space, or an undo window cures a slip. A mistake just recurs, because the interface taught the user something false, and no amount of friction on the same false model fixes it.
**Code signal:**
  - a destructive action rendered with the same size, style, and spacing as a benign adjacent one, with no visual differentiation, gap, or confirm/undo step — slip risk
  - a control's label or icon promising one action while its handler performs a materially different one (a button reading "Save draft" wired to a handler that also publishes) — mistake risk, since the user's model of the control was wrong before the click
  - one generic `confirm()` guarding both kinds of action identically, treating "wrong click" and "wrong understanding" as the same problem
**Fix:** for slip risk, separate or differentiate the controls (spacing, color, an undo window) instead of adding a dialog; for mistake risk, fix the label or icon so it states the real action — a confirm step doesn't correct a false model.
**Detect:** HEURISTIC — telling a slip from a mistake needs a pattern of actual use the source doesn't record; report as a question, not a defect.
**Source:** *The Design of Everyday Things*, ch. 5 · https://www.nngroup.com/articles/slips/ (2015)

---

## An error renders next to the field that caused it, not just in a banner

**Principle:** a validation error attaches to the specific control it concerns; a form-level summary supplements that, never replaces it.
**Mechanism:** recognition over recall. A banner-only error forces the user to hold "which field was it" in working memory while re-scanning the whole form; binding the message to the control turns a search into a glance.
**Code signal:**
  - a single top-of-form error banner/alert with no matching error state (`aria-invalid`, error styling) on the individual field it refers to
  - a validation-error object keyed by field name that's rendered only as one joined string, never mapped back onto each field's own error slot
  - an error summary with no anchor (`href="#field-id"`) into the field it names
**Fix:** render each field's own error inline beside or below it, and mark the control `aria-invalid`; keep a top summary only as a second, optional aid.
**Applies when:** a summary at the top is additionally useful for long forms and screen-reader users navigating by heading — its *presence* isn't the defect, being the *only* signal is.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (help users recognize, diagnose, and recover from errors) · https://www.nngroup.com/articles/error-message-guidelines/ (2023)

---

## State how to fix it, not just that it broke

**Principle:** an error message pairs what went wrong with a concrete next step — it doesn't stop at naming the failure.
**Mechanism:** diagnosing a problem and knowing its fix are different cognitive tasks. A message that only names the failure ("Invalid input") outsources the diagnosis to the user, who now has to reverse-engineer the validation rule from a blank field.
**Code signal:**
  - an error string that's the exception's raw message or a generic constant ("Something went wrong", "Invalid input") with no field-specific detail
  - a validation schema whose custom error messages restate the rule's name rather than the fix (`"emailInvalid"` surfaced verbatim instead of "enter an email with an @ and a domain")
  - a caught error rendered to the user as a status code or error class name instead of a written message
**Fix:** write the message as diagnosis plus remedy ("Password needs 8+ characters — you have 5"), sourced from the rule that actually failed, not the exception object.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (help users recognize, diagnose, and recover from errors) · https://www.nngroup.com/articles/error-message-guidelines/ (2023)

---

## A failed submit never wipes what the user typed

**Principle:** when a submission is rejected, every value the user entered comes back populated — never blank.
**Mechanism:** redoing entry costs the same effort as the first pass, plus the tax of remembering what was typed. A form that clears on error punishes the user for the interface's validation timing, not for their mistake. (Related to, but narrower than, the "bookkeeping" excise entry in signifiers-and-affordances — that one covers data the system already knew; this one covers data the user just gave it.)
**Code signal:**
  - a server action/route handler that on validation failure returns only an error message/object, with no echo of the submitted `formData`/body back to the rendered form
  - form state initialized from a prop/loader default rather than from the request body or the action's returned data on the error branch
  - a `catch` block that redirects to, or re-renders, an empty form instead of one populated with what was submitted
**Fix:** thread the submitted values through the error response and initialize every field from them on the error render path, not from a blank default.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (help users recover from errors) · https://www.nngroup.com/articles/error-message-guidelines/ (2023)

---

## An irreversible action is confirmed or undoable, never neither

**Principle:** a destructive, hard-to-reverse operation either interrupts with a confirmation or completes with a reversal window open behind it.
**Mechanism:** Nielsen's user control and freedom — mistakes are inevitable, so an "emergency exit" has to exist somewhere in the flow. Without one, a single misclick becomes permanent, a cost wildly disproportionate to an ordinary input error.
**Code signal:**
  - a delete/destroy handler firing straight from `onClick` with no confirm step and no subsequent undo affordance (toast with "Undo", soft-delete flag, trash/recovery view)
  - a destructive mutation or `DELETE` request with no corresponding restore endpoint and no confirmation component anywhere above it in the tree
  - a confirmation dialog whose default-focused button is the destructive action rather than cancel
**Fix:** add a confirm step for genuinely catastrophic actions; prefer an undo window (soft delete plus timed toast) over a dialog anywhere the operation can be made reversible instead.
**Applies when:** routine, low-cost actions (archiving a draft, clearing a filter) don't need a confirm — reserve it for the hard-to-reverse ones. Confirming everything trains users to click through it.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (user control and freedom) · https://www.nngroup.com/articles/confirmation-dialog/ (2018)

---

## Accept the format the user types, not the one you'd prefer

**Principle:** input validation accepts any format that unambiguously carries the value, and normalizes it — it doesn't reject on formatting the user can't see.
**Mechanism:** Postel's law — be liberal in what you accept. A phone/card/postcode regex encodes the author's preferred formatting, not the user's; every valid value typed with a space, dash, or unanticipated separator is a false rejection charged to someone who did nothing wrong.
**Code signal:**
  - a `pattern`/regex validator on phone, card, postcode, or name fields anchored to one exact shape (`^\d{3}-\d{3}-\d{4}$`) instead of stripping non-significant characters before checking
  - a validator that rejects leading/trailing/internal whitespace instead of trimming it first
  - a name-field regex restricted to a single character set — no space, no hyphen, no apostrophe — that excludes real names
  - client and server validators with different tolerances, so a value the client accepted still fails server-side
**Fix:** normalize (strip whitespace/punctuation, trim) before validating and storing; validate the underlying value, not its incidental formatting.
**Applies when:** fields with a genuine fixed grammar (an email's `@`, a currency code) still need real structure — liberal applies to formatting variance, not to values that are actually invalid.
**Detect:** STATIC
**Source:** *Laws of UX* (Postel's law) · https://lawsofux.com/postels-law/ (2020)

---

## Validate after the user finishes, not while they're mid-keystroke

**Principle:** a field's error state appears once the user has finished with it — on blur or submit — not on every keystroke before they've had a chance to complete it.
**Mechanism:** an error shown before the input is complete is reporting on an unfinished thought. It's necessarily premature, so it reads as the interface complaining rather than helping — and repeated false negatives teach users to ignore the error state altogether.
**Code signal:**
  - an `onChange`/`oninput` handler that sets or renders a field error on every keystroke, with no check for blur or field-complete state
  - a form-validation library configured for change-time validation (e.g. `mode: 'onChange'`) applied uniformly across a whole form, including fields with no real-time benefit
  - the inverse defect: a long, multi-section form with zero validation until the final submit, surfacing every error at once
**Fix:** validate on blur for the first error, then on change for subsequent edits, as the default; reserve keystroke-level validation for fields with a real formation rule to teach.
**Applies when:** fields the user builds up character-by-character against a visible rule (password strength, live username availability) benefit from instant feedback — the general rule inverts there. Of the two moments this rule permits, the house default picks **submit** for the first pass, then change for the correction pass (`ui-patterns` → `forms-and-mutations`); a form built that way satisfies this entry. The third signal is unaffected — a long multi-section form's first pass is per section, not one final submit at the end.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (help users recognize, diagnose, and recover from errors) · https://www.nngroup.com/articles/errors-forms-design-guidelines/ (2019)
