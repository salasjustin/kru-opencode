# States & feedback

Loading, empty, error, success, system status — does the interface say what's happening, or does silence stand in for an answer? This is the group where a *missing* branch is the finding: code that never renders a state is a defect, not an absence of evidence, which makes it unusually rich in `STATIC` tiers.

---

## Every async action needs a pending state

**Principle:** any operation triggered by a user action that takes non-zero time renders a pending state while it runs.
**Mechanism:** without a pending state the interface goes silent between click and result, and the user has no way to tell "working" from "broken" — so they escalate: click again, navigate away, or assume it failed.
**Code signal:**
  - an `async` handler / `fetch`/`mutate` call inside an event handler with no boolean (`isLoading`, `isPending`, `isSubmitting`) read anywhere in the render output
  - a submit button with no `disabled` state or spinner tied to the request in flight — same label, same clickable state before, during, and after
  - a data hook (`useQuery`/`useMutation`, a framework's own async-state rune/store) whose `isLoading`/`pending` field is destructured and never referenced again
  - pending *reported* but not *enforced* — `aria-busy`, a swapped label, or a spinner on a control that stays submittable, with no `disabled` (or equivalent guard) tied to the same boolean. The user is told it's working and can still fire it twice; if a redirect is what actually stops the double-submit, the button isn't doing the job.
**Fix:** gate the trigger on a pending boolean, disable/spin the control, clear it in a `finally`.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (visibility of system status), Nielsen · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)

---

## An empty collection must say so

**Principle:** a collection rendered with zero items shows an explicit empty state, not blank space.
**Mechanism:** blank space carries no information — it's indistinguishable from "still loading," "the fetch failed," and "there is genuinely nothing here." The user is left to guess which one they're looking at.
**Code signal:**
  - `.map()`/`.forEach()`/a loop rendering list items with no sibling branch for `data.length === 0`
  - a table whose body has no fallback row, or a list/grid component wrapping children with no `empty`/`fallback` prop ever passed
  - an empty-state component that exists in the codebase (`Empty`, `NoResults`, `ZeroState`) but isn't imported by this particular list
**Fix:** add a length check that renders a stated empty state — what's missing and, where relevant, the action that fills it.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (visibility of system status), Nielsen · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)

---

## A mutation isn't finished until the user is told it worked

**Principle:** an action that changes data ends in a stated confirmation — a message, a visibly updated value, an inline state change — not just a return or a redirect.
**Mechanism:** a silent success and a silent failure look identical from the user's chair. Without a stated outcome they re-submit to be sure, which is how duplicate charges and duplicate posts happen.
**Code signal:**
  - a form action / route handler that returns or redirects on success with no toast, banner, or inline acknowledgment anywhere in the component that called it
  - a mutation's `onSuccess`/`.then()` left empty, or only invalidating a cache with no user-visible change
  - a delete/save/send action whose only observable effect is the item disappearing or the page navigating, with nothing of its own saying "Saved" or "Sent"
**Fix:** add a toast, banner, or inline updated-value render to the success path — not just the redirect or the cache invalidation.
**Applies when:** two exceptions, and the third signal above fires falsely without them. (1) A global toast/notification layer wired at the app root can supply this off-screen — confirm one isn't already firing before flagging. (2) **The destination is itself the confirmation** — sign-out landing on the sign-in screen, a delete landing on a list the row is visibly gone from, a create landing on the thing it created. The defect is a *silent* outcome, not a *navigated* one; post-redirect-get is the correct shape, not a missing acknowledgment. Flag only where the landing screen leaves the outcome genuinely ambiguous.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (visibility of system status), Nielsen · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)

---

## Background activity still needs a visible status

**Principle:** work the system starts on its own — autosave, reconnect, background sync, an optimistic update that might roll back — surfaces a status somewhere in the UI, not just in the console.
**Mechanism:** visibility of system status doesn't stop applying once the user's hands leave the keyboard; a change happening to their data without their action and without their knowledge is the failure mode, not an edge case of it.
**Code signal:**
  - a debounced/interval-driven save (`setInterval`, a debounced effect) with no rendered "Saving…" / "Saved" / "Unsaved changes" text anywhere in the tree
  - a websocket/SSE reconnect handler with no connection-status indicator
  - an optimistic update (state set before the request resolves) with no rollback or error affordance if the request fails
**Fix:** add a small persistent status element (saving/saved/reconnecting) wired to the same state driving the background operation.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (visibility of system status), Nielsen · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)

---

## How much feedback an operation needs scales with how long it takes

**Principle:** sub-second results need no special feedback, roughly one to ten seconds needs a lightweight indicator, and anything past about ten seconds needs a determinate, percent-style indicator — one spinner for all three under-serves the slow end and over-serves the fast end.
**Mechanism:** below ~0.1s an action reads as direct manipulation and needs nothing; up to ~1s the user's train of thought survives a visible pause; past ~10s attention drifts unless the system commits to a number the user can watch move.
**Code signal:**
  - one `isLoading` boolean driving the same indeterminate spinner for every async call in a file, used identically for a cache-hit lookup and a report/export/upload endpoint
  - a long-running operation (bulk import, file/video upload, report generation) with no percent- or count-based progress prop, only a spinner
  - a request with no staged messaging — nothing in the UI distinguishes a 2s wait from a 20s one
**Fix:** replace the single spinner with tiered feedback — nothing under ~1s, a lightweight indicator up to ~10s, a percent/count-based indicator beyond it.
**Applies when:** the operation's actual duration isn't stated in source — weigh this against the endpoint's known cost (payload size, batch size, an external API call), and report it as a question, not an assertion, when that's not conclusive from the code.
**Detect:** HEURISTIC — the code shows what feedback exists, not how long the operation actually runs.
**Source:** Jakob Nielsen, "Response Times: The 3 Important Limits" · https://www.nngroup.com/articles/response-times-3-important-limits/ (1993)

---

## Destructive, irreversible actions get a confirmation step

**Principle:** an action that destroys data or can't be undone sits behind an explicit confirm step — never a single, unguarded click.
**Mechanism:** Norman's slip/mistake distinction — a slip is a correct intention executed wrong (the mis-click), and the interface's job is to bound its cost. When the destructive path and the accidental path are the same single click, a moment of bad motor control becomes unrecoverable.
**Code signal:**
  - a delete/destroy/remove handler wired straight to a button's `onClick`/`on:click` with no modal, dialog, or second control between click and execution
  - a `DELETE` fetcher or form action (`action="?/delete"`, `method="delete"`) invoked from one button with no confirm dialog component wrapping it
  - a destructive label ("Delete account", "Cancel subscription", "Remove permanently") rendered with the same visual weight and click cost as a benign control beside it
**Fix:** wrap the trigger in a confirm step that restates what will happen; for genuinely catastrophic actions, require typed confirmation rather than a single OK.
**Detect:** STATIC
**Source:** *The Design of Everyday Things*, ch. 5 (Human Error? No, Bad Design) · https://www.nngroup.com/articles/confirmation-dialog/ (2018)

---

## Reversible actions get undo, not a confirmation dialog

**Principle:** when an action can be cheaply reversed, ship it immediately with an undo affordance instead of stopping the user with a dialog first.
**Mechanism:** Cooper's forgiveness principle — a dialog taxes every user for a mistake only some of them will make, and habituation means it gets reflexively dismissed, including by the person about to actually err. Undo only costs the person who needed it.
**Code signal:**
  - a `window.confirm()` or modal gating an action whose handler sets a soft-delete flag, moves a row to a trash/archive table, or otherwise keeps the data recoverable (`deletedAt`, `archived`, `status: 'trashed'`)
  - a toast/snackbar component already used elsewhere in the codebase, absent from this action's success path where an "Undo" action would fit
  - an archive/dismiss/unsubscribe action gated behind a confirm step identical in weight to the app's genuinely irreversible deletes
**Fix:** drop the confirm dialog, execute immediately, and surface a toast with an "Undo" action for a short window instead.
**Applies when:** reversibility is a judgment the code hints at (soft-delete columns, a trash view) but rarely states outright — report as a question, not an assertion, when the data model isn't conclusive.
**Detect:** HEURISTIC — recoverability has to be inferred from the data model, not read directly off the handler.
**Source:** *About Face*, ch. "Eliminating Errors, Alerts, and Confirmations" · https://www.nngroup.com/articles/user-control-and-freedom/ (2020)

---

## A confirmation worth asking for is modal

**Principle:** once an action has earned a confirm, render it as a dialog that traps focus and disables the page behind it.
**Mechanism:** the confirm exists to break a motor sequence already in flight, and a prompt drawn into the region the user is clicking through gets answered by the reflex that fired the first click. Modality is priced by the decision's cost, not the message's importance — the same reason everything short of irreversible gets undo instead (entry above).
**Code signal:**
  - a `confirmingId === row.id` / `pendingDelete` branch swapping a row's button for "Are you sure?" in place, the rest of the list still live
  - a toast/snackbar carrying the affirmative action for an operation the data model can't reverse
  - a hand-rolled overlay `<div>` with no `<dialog>`, `role="alertdialog"`, focus trap, or focus restored on close — an overlay that doesn't hold focus isn't modal
**Fix:** render a real dialog: focus trapped, defaulted to the safe choice, returned to the trigger on dismiss.
**Applies when:** only for actions that earned a confirm under the two entries above — a modal on a reversible action is the more common defect, and its fix is deletion, not relocation. The focus-trap signals overlap `accessibility-review`; cite it rather than re-auditing.
**Detect:** STATIC
**Source:** NN/g, "Modal & Nonmodal Dialogs: When (& When Not) to Use Them" · https://www.nngroup.com/articles/modal-nonmodal-dialog/ (2017)

---

## A multi-step flow shows the step count and current position

**Principle:** a flow that takes more than one screen to complete displays how many steps exist and which one the user is on.
**Mechanism:** Zeigarnik effect — an unfinished task occupies working memory more heavily than a finished one, and an open-ended "how much is left" is harder to hold onto than a bounded one. A step indicator converts an unknown-length task into a bounded, trackable one.
**Code signal:**
  - a `step`/`currentStep`/`activeStep` variable driving which form panel renders, with no stepper, progress bar, or "Step N of M" text reading that same variable
  - a route-per-step wizard (`/onboarding/1`, `/onboarding/2`) with no shared layout rendering position across the routes
  - a multi-page form whose only orientation cue is the browser's own back button
**Fix:** add a stepper/progress element reading the same step variable, rendered in a shared layout across every step.
**Detect:** STATIC
**Source:** *Laws of UX* (Zeigarnik effect), Yablonski · https://lawsofux.com/zeigarnik-effect/ (2020)
