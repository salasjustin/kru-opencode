# Forms and mutations

Every entry here is the behavior the stack has to produce; the API that produces it lives in the framework seat's own prompt.

## A form's first validation pass is its submit; the correction pass is on change

**Trigger:** any form with validation — sign-up, settings, an inline edit with more than one field.
**Pattern:** three steps in order. An untouched form marks nothing. **Submit** runs the first pass and marks what failed. A field already marked invalid then re-checks **on change**, clearing the moment its value is good.
**Default it corrects:** wiring the whole form to change- or blur-time validation, so a field goes red while the user is still typing it, or the instant they tab out of one they meant to come back to.
**Why:** before submit the interface has no evidence the user is finished — an email is invalid for every keystroke but the last, and a blur fires on a field they intended to return to, so the error is a complaint about an unfinished thought. After submit that inverts: they've been told what's wrong and are now fixing it, and making them press the button again to learn whether the fix took is asking them to re-ask a question they can already see the answer to. Errors that fire early get tuned out; errors that clear late feel unresponsive.
**Shape:** track validity per field rather than one form-wide flag — a field renders its error once it has been submitted-and-failed, and re-runs its check on every change from then on.
**Applies when:** the field's rule is invisible until the value is complete. A field that teaches its rule as you type — password strength, live username availability — validates on change by design. A validation library's submit-then-revalidate mode is the usual mechanism; this is the ladder it has to produce.

## A failed submit moves focus to the first invalid field

**Trigger:** the failure branch of a submit — client-side or after a server round trip.
**Pattern:** on failure, move focus to the first control the pass marked invalid — the control on screen for that decision, so where a tray of shortcuts gave way to a free-entry box, the box.
**Default it corrects:** re-rendering the form with its errors painted in and leaving focus where it was — on the submit button, or reset to the top of the document by the round trip — or moving it to the hidden control behind the one the operator can see.
**Why:** the first invalid field is often several screens above the button that was just pressed, so from where the user is standing the page looks unchanged and the submit looks broken. One focus move does three jobs at once: it scrolls the field into view, it announces the error to a screen reader, and it puts the caret in the control that has to be edited. A summary at the top of the form supplements this; it doesn't replace it, because a summary still leaves the user to find the field.
**Applies when:** every validated form. On a server round trip the error map comes back with the render, and the focus move is the component's to make.

## The control that caused the mutation reports its outcome

**Trigger:** a submit button, a per-row Save, a toggle that writes — anything the user presses that then succeeds or fails.
**Pattern:** the control carries its own state in place — `Save` → `Saving…` → `Saved` — and settles back after the moment passes.
**Default it corrects:** firing a toast for something the user is already looking at, so the confirmation appears in a corner while their eye is on the button they just pressed — and holding the press back with `disabled`, which drops focus off the button the operator is standing on.
**Why:** the eye is already on the control; feedback anywhere else is a second thing to find, and a corner toast is the one region reliably tuned out. Reporting at the origin also makes the outcome unambiguous when several rows each have their own Save.
**Shape:**
```html
<button aria-disabled={pending} aria-busy={pending} onClick={e => { if (pending) e.preventDefault(); }}>
  {pending ? 'Saving…' : saved ? 'Saved' : 'Save'}
</button>
```
The held state is `aria-disabled` and the handler ignores the press. `disabled` blurs the button, so focus lands on `<body>` and the label change the button just made is announced to nobody.
**Applies when:** the outcome lands on the screen the control is on. Cross-screen outcomes are the next entry. A failure that needs explaining still renders as an error at the control's field, not only in the button's label.

## A toast is for an outcome that lands on a different screen

**Trigger:** a mutation that redirects — create-then-go-to-detail, delete-then-return-to-list.
**Pattern:** carry the outcome as a **one-shot flash** — set server-side on the redirect, consumed by the first render that reads it — and show it as a toast on arrival, put where assistive tech will meet it: focus moves to the outcome, or the text is written into a live region that was mounted empty.
**Default it corrects:** a persistent banner on the destination that stays until dismissed, or the message stuffed into a query parameter so the URL carries it — and a `role="status"` region that mounts on the destination already holding the message.
**Why:** on the destination there is no originating control left to report at, so a toast is the only thing that ties the message to the action. It has to be one-shot because the message describes a moment: a query param survives a refresh, a bookmark, a share and a back-navigation, and reappears long after the thing it described is gone. A banner has the same problem in a shape that also takes layout space. A live region announces what changes inside it after it mounts; one that arrives with the text already in it is announced by nobody, and the scroll reset the navigation performs is not a focus move.
**Shape:** set the flash server-side on the redirect, read and clear it on the next render — a cookie cleared on read, or the framework's session flash. Render the status region on every screen, empty, and write the flash into it — or move focus to the outcome itself.
**Applies when:** the outcome genuinely lands elsewhere. Same-screen is the previous entry. Errors that block the operation are neither — they belong at the field or control that produced them, where the user can act on them.

## A save that returns to the same screen doesn't move the scroll position

**Trigger:** a mutation that re-renders the current screen — a settings save, an inline edit, a row action on a long list.
**Pattern:** re-render in place rather than navigating; where a navigation is unavoidable, opt out of the scroll reset explicitly.
**Default it corrects:** navigating to the same URL to refresh the data, which most routers treat as a fresh navigation and scroll to the top.
**Why:** the operator is looking at the control they pressed, usually somewhere down a long form. Jumping to the top loses their place and reads as a failure — they can't see the thing they just changed, so they check it again. Only an outcome landing on a *different* screen earns the trip to the top.
**Applies when:** the current screen persists — this is the rule the component's callbacks have to leave room for.

## A form seeded from stored values shows the saved values after a same-screen save

**Trigger:** a settings or edit form whose fields start from server data and whose submit re-renders the same screen.
**Pattern:** leave the form alone when the answer lands; the fresh read re-seeds it.
**Default it corrects:** `form.reset()` in the submit-complete effect, to "clear the dirty state" once the save is acknowledged.
**Why:** reset restores each uncontrolled input to its mount-time default, the value from *before* the write. The answer arrives before the fresh read does, so the operator watches their edit disappear and the boxes hold the old data until something remounts them.
**Shape:** key the form on the stored record's version (or the loader's data) so a fresh read remounts it seeded with what was saved; the dirty comparison runs against that seed.
**Applies when:** inputs are seeded rather than blank. A create form that submits and stays is the opposite case — there the reset is the point.

## A confirmation step held in the URL keeps the operator where the trigger was

**Trigger:** a destructive action that confirms through URL state — `?confirm=<id>`, a `/confirm` child route — rather than a dialog.
**Pattern:** the confirm state appears without moving the operator: the page keeps its scroll position and focus stays on the trigger where it survives the change. Where the confirm panel replaces the trigger's element in place, focus moves to the panel as a named group — `role="group"`, `aria-label`, `tabIndex={-1}` — keyed to the state *changing* rather than to the URL, so a pasted link renders the panel without stealing focus; the link in and the link out both opt out of the scroll reset.
**Default it corrects:** reaching the confirm state through an ordinary navigation, so whatever the stack does on a route change happens — scroll to the top, focus reset to the document — while the control the operator now has to press is back down where they were. Or the panel swapped in over the trigger with nothing done, so focus falls to `<body>` because the element that held it is gone.
**Why:** the confirm step exists to make the operator look before they act, and it just moved the thing to look at off screen. They pressed a control at the foot of a long list and the page appears to have jumped somewhere unrelated; the confirm becomes something to hunt for, which is the opposite of a deliberate second press.
**Applies when:** the confirm state renders on the same screen. One that genuinely lands on a different screen is a navigation and resets normally — and where the stack resets nothing on a same-route change, there is nothing to do: the rule is the operator's position, not the opt-out.

## A confirm dialog itemises only what the press will touch

**Trigger:** a save that commits several fields at once, at least one of them destructive or irreversible.
**Pattern:** list one line per *changed* field, naming the act against the operator's own values — `Password · Removed`, `Mail host · Replaced`. Focus lands on the dismiss control.
**Default it corrects:** a generic "Are you sure?" over a paragraph of consequences written above the form in the abstract, and a dialog that opens with focus on the control that commits.
**Why:** this is the trade that lets the page carry no prose — the explanation is relocated to the one moment it changes a decision, stated against real values rather than in general. An untouched field listed anyway dilutes the three lines that matter. And focus on the committing control hands the operator the answer before the question, which is worse than no dialog.
**Applies when:** the press is hard to walk back. A save with no destructive branch reports at its control instead — and inside a dialog that has earned its place, a change with no way to hurt is still left off the list: the itemisation is what the press will **cost**, so a safe act padded in spends the read on a line to ignore and makes the destructive ones harder to count.

## A confirmed destructive act reports itself by the state it leaves

**Trigger:** the success branch of an act that passed a confirm — delete an account, revoke a key, purge a workspace.
**Pattern:** land the operator in the state the act produced — the list without the row, the signed-out door, the blank page a browser leaves where the last step asks to close a tab it isn't allowed to — and let that be the report.
**Default it corrects:** a success screen or a toast after the confirm — *Your account has been deleted* — on the rule that every mutation reports its outcome.
**Why:** the confirm itemised the consequence against real values and the operator pressed through it, so the restatement is a second read with no decision under it and a dismiss press where nothing is left to do. It also competes with the evidence: a sentence asserting success gets read instead of the state, so a partial failure — session ended, rows still there — reads as done because the page said so. A state can't be wrong about itself.
**Applies when:** the act leaves a state the operator lands in. One that leaves no trace — a queued deletion, a revoke whose effect is elsewhere — has something to report, and reports it at the control.

## An explanation goes on screen; `aria-describedby` points the control at it

**Trigger:** a control whose effect isn't obvious from its label — a toggle that changes what other people can see, a checkbox with a consequence, a destructive action.
**Pattern:** render the consequence as visible text near the control, give it an `id`, and point the control at it with `aria-describedby`.
**Default it corrects:** writing the explanation into the control's `aria-label` (or `title`), so the only person who gets it is the one using a screen reader.
**Why:** an accessible name is a name, not a place to put content — nothing paints it, so the sighted user infers the consequence from a bare toggle. Worse, it *replaces* the visible label rather than adding to it, so the string that was supposed to explain more explains less.
**Shape:**
```html
<input id="vis" type="checkbox" aria-describedby="vis-note">
<p id="vis-note">Anyone with the link can view this.</p>
```
**Applies when:** the string is a description. A genuinely icon-only control still needs `aria-label` for its *name*.

## A stateful control sits inside its own `<label>`

**Trigger:** a checkbox, radio or switch with visible text beside it.
**Pattern:** wrap the control and its text in one `<label>`, so the visible string *is* the accessible name.
**Default it corrects:** an `aria-label` on the input plus a separate `<span>` of visible text — two strings kept in step by hand, which drift the first time one is reworded.
**Why:** label-in-name (WCAG 2.5.3) requires the accessible name to contain the visible text, so a voice user can say what they can see. Wrapping makes that structural rather than a promise: there is only one string, so it can't drift.
**Shape:**
```html
<label><input type="checkbox" name="public"> Make this public</label>
```
**Applies when:** the text sits beside the control. A label placed elsewhere in the layout uses `<label for>` — same one-string rule, different mechanism.

## A field's own content states whether a value is stored

**Trigger:** a settings field holding a secret or a connection value — a key, a host, a sender address — that may or may not already be set.
**Pattern:** one label, one box. Empty means nothing is stored; seeded with a mask means something is, and focusing it clears it to retype. Semantics stay blunt — change it and it changes, empty it and it is deleted.
**Default it corrects:** a status row above the input ("Not set" / "Configured"), a second label, or a Remove checkbox beside the field — plus a snap-back on blur that refills an emptied box.
**Why:** the status row is a second representation of one fact, and the day it disagrees with the box the operator has no way to tell which is right. The snap-back is the costlier half: it makes deletion the one intent the form cannot express, so the operator retypes a value they meant to remove.
**Applies when:** the stored value is a scalar the field can seed. A list, or a value the server declines to echo, carries its own state; this is the single-slot case.

## A decoration inside a control is contained by the control, not by its own position

**Trigger:** a control carrying a painted layer behind its text — a fill that tracks progress, a hover wash, a pressed ground.
**Pattern:** give the label its own `position: relative` so it stacks above the decoration, and `overflow: hidden` to the control so the decoration is clipped to its shape.
**Default it corrects:** absolutely positioning the decoration inside the control and leaving the text static — which paints the decoration over the words, and runs it past the control's rounded corners.
**Why:** a positioned element outranks static siblings in paint order whatever the source order, so the text loses without a stacking claim of its own; and a `border-radius` clips only what its element owns an overflow rule for. Both read correct at rest and surface only once the decoration has extent, which is the state a screenshot of the default rarely catches.
**Shape:**
```css
.control { position: relative; overflow: hidden; border-radius: var(--radius-2); }
.control > .fill  { position: absolute; inset: 0 auto 0 0; }
.control > .label { position: relative; }
```

## A control that repairs one of a rung's reasons needs its own condition

**Trigger:** one derived state — `disabled`, `locked`, `pending` — closing both a submit button and the field beside it.
**Pattern:** before a control reads a shared rung, ask whether *this* control is where one of that rung's reasons gets fixed. Where it is, give it the subset of reasons it cannot repair.
**Default it corrects:** deriving the text box's `disabled` from the same expression as its button's, once a second reason — nothing entered yet — joins the first on that rung.
**Why:** the box is closed in exactly the state the operator would type their way out of, so the one input that clears the condition is the one the condition removed. Nothing throws and both controls are correct read alone; the deadlock exists only in the empty state, which is the state nobody opens twice.
**Applies when:** a rung gains a reason. A rung shared by controls that all merely observe it stays shared.

## A control closes over its own request and reopens over its own answer

**Trigger:** a box or button whose `disabled` reads a page-wide pending flag — "the app is writing".
**Pattern:** close a control while its own request is in flight and while another press writes; reopen it on the render its answer lands in. Derive `disabled` from the control's own request phase, never the page's.
**Default it corrects:** `disabled={isSubmitting}` on every control from one global flag, plus an effect that focuses the field a refusal named.
**Why:** the page-wide flag is still up on the render the refusal arrives in, and `element.focus()` on a disabled control is a silent no-op — the effect fires once, moves nothing, never re-runs once the flag drops. The operator reads a refusal on a box they can't type into. The fix is the disabled reading, not the effect.
**Applies when:** the answer lands while the page is still revalidating; the framework seat's prompt names the mechanism.

## A field's error is the predicate its label completes

**Trigger:** the message under an invalid field — required, out of range, malformed, a cross-field bound.
**Pattern:** the column reads as one sentence — label, box, predicate. The predicate stands alone, as an instruction, in the operator's own figures, lowercase with no full stop: `required`, `between $5 and $50,000`, `required, or untick to skip`.
**Default it corrects:** `Email is required` / `Required.` / `The email you entered is invalid` / `above the largest gift of $20.00` — the label restated, the value echoed under the box still showing it, a report of what went wrong where an instruction was owed, a clause capitalised and stopped as a sentence of its own, and `$20.00` from an operator who typed `20`.
**Why:** the label and the box are already on screen; a message repeating either is read twice and trusted less. An instruction is the fix; a report leaves the operator to derive it. A figure in a form they never typed is a second value to reconcile. Consequence prose belongs to the confirm dialog, on the one press where it changes a decision.
**Applies when:** the message sits under its own field. A summary that folds fields into one string has left the box, so it names the field — and that is where a secret gets masked, because the control showing it is out of view. Folded into one live-region line, the predicates join on commas: each is a clause, and the line reads as one. Repair before you refuse: what the parse can normalise — surrounding whitespace, a missing scheme — it accepts, and only what survives that earns a predicate. A refusal the system could have repaired itself sends the operator back to retype a value it already understood.

## A control inside a labelled group is named for what it asks

**Trigger:** a select, radio set or input inside a `<fieldset>` or `role="group"` whose legend already names the subject — a *Program* group holding the program picker.
**Pattern:** name the control for the question it asks — *Which program*, *Amount* — so legend and control read as a subject and its question.
**Default it corrects:** giving the control the legend's noun as its label, so a screen reader announces "Program, Program" on entry.
**Why:** the accessible name is read after the group name; a repeated word costs the listener the second one for nothing and hides which of two controls in the group is which. The legend states the subject; the control states what it wants.
**Applies when:** a group with a legend holds one or more controls. A control outside any group carries the subject itself.

## A refused group is marked once, on the group

**Trigger:** validation refusing a set of controls that fail together — a date range, an address, a mode and its box.
**Pattern:** mark the group's outermost box invalid and place the predicate once beneath it; the controls inside stay unmarked.
**Default it corrects:** painting every control in the group invalid and repeating the message under each.
**Why:** the refusal is one decision about one thing; several marks say several things went wrong and send the operator fixing each. One mark on the box that bounds the decision matches what the check tested, and one `aria-describedby` on the group carries the predicate once.
**Applies when:** the check tests the controls together. A control that fails on its own is marked on its own.

## The dirty comparison covers only what the mode submits

**Trigger:** a form with modes — a radio deciding which of two boxes counts, a *custom* option opening a free-entry field — and a Save gated on whether anything changed.
**Pattern:** on a mode change, clear the box the new mode does not submit, or compare only the fields the current mode submits.
**Default it corrects:** leaving the value the operator typed before switching modes in its box, so the comparison keeps reporting a change after they switch back and Save stays lit over a form that submits nothing new.
**Why:** the operator sees the form they loaded and a button insisting it changed; they save to make it go away and produce a no-op write, or hunt for a change that isn't there. A box mounted in a mode that doesn't submit it is state the form carries without showing.
**Applies when:** any control stays mounted in a mode that does not submit it. A form that unmounts the box on mode change has nothing to clear.

## An optional sub-group opens on a press with no inverse

**Trigger:** an optional pair inside an already-opened disclosure — notify a recipient, add a note, a second address.
**Pattern:** the pair is absent until a press reveals it (*+ Notify recipient*); once open it stays open, and empty fields mean absent on submit.
**Default it corrects:** a checkbox or toggle that shows and hides the pair, so the operator keeps two things in agreement — the toggle and the fields — and can submit a filled pair with the toggle off.
**Why:** a hide control carries state the fields already carry: empty is the *off* the toggle was for. One way means one state to read and nothing to reconcile; the submit reads the fields, never the toggle.
**Applies when:** the pair is optional and empty is a valid absence. A choice that has to be explicit — consent, an opt-in — is a control with a value of its own, not a disclosure.

## A long-running job reports the step it is on, never a fraction it invented

**Trigger:** a job that outlasts a moment — an import, an upload, a batch, a migration — with any progress indicator.
**Pattern:** surface the detail the engine already emits (bytes of total, the file's name, batch N of M); split a silent stretch longer than a few seconds into its own reported step; where a stage has nothing to count, show elapsed time.
**Default it corrects:** a percentage interpolated on a timer, or a bar eased to 90% while one step runs — the number moving because time passed, not because work did.
**Why:** an invented fraction is checkable, and the operator checks it: it reaches 100% with the job still running, or sits still through the step that was actually fastest. One bar that lied is enough — every later bar is read as decoration, and the operator goes looking for the real state in the logs. Elapsed time claims nothing and so can never be wrong.
**Applies when:** the engine reports anything at all. A stage that genuinely emits nothing still gets its name and its elapsed clock, which beats a fabricated fraction.

## The busy indicator sits on the innermost running node

**Trigger:** a progress display with more than one level — stages containing steps, a run tree, a per-file batch inside a phase.
**Pattern:** one indicator, on the deepest node the run is inside. Ancestors carry their state as a mark, a name and an elapsed clock, `aria-busy="false"`.
**Default it corrects:** deriving busy from *contains something running*, so the stage and the step inside it both spin, three deep on a nested batch.
**Why:** motion is the only channel that says *here, now*; repeated up the tree it locates nothing, and the operator counts spinners and reads that many concurrent runs. It also hides the thing the display exists to show — when the frontier moves to the next child, an ancestor's spinner looks identical through the whole step it was meant to report, so the one moving part is the one that never changes.
**Shape:**
```html
<li aria-busy="false">Migrate schema <span>0:12</span>   <!-- ancestor: state and clock, no motion -->
  <ul><li aria-busy="true"><span class="spinner"></span> Copying rows… <span>0:07</span></li></ul>
</li>
```
**Applies when:** more than one level renders at once. A parent doing its own work between children *is* the innermost running node then, and takes the indicator for that stretch.

## An imperatively mounted prompt is cancelled by whoever raised it

**Trigger:** an imperative `ask()` / `confirm()` — call a function, it mounts a dialog and resolves with the answer — served by a host mounted at the root.
**Pattern:** scope each request to its caller. The caller gets back a disposer (or hands in an `AbortSignal`) that settles the promise and unmounts the dialog, and it runs on unmount — the same shape the repo already uses for its timers and subscriptions.
**Default it corrects:** returning the bare promise, with dismissal left to the dialog's own buttons.
**Why:** the promise and its dialog live in the host, not in the caller's tree, so an owner that goes away mid-prompt — a route change, a closed drawer — leaves a dialog nothing can close over a promise nothing will settle. The operator is left holding a prompt whose subject no longer exists.
**Applies when:** the host outlives its callers, which is the point of an imperative API. A dialog rendered inside the component that owns it unmounts with it and needs no disposer.

## An error no control carries is drawn at the control that was pressed

**Trigger:** a form-level or array-level refusal — *add at least one recipient*, *these dates overlap* — keyed to a name no input on the form has.
**Pattern:** render it at the button that submitted, and point that button at it with `aria-describedby`.
**Default it corrects:** rendering it in the field-message slot for its key, where the framework's error map files it — a message that mounts against nothing, or mounts somewhere no focus move will ever reach.
**Why:** submit-time focus walks the form's own controls to find the first refused one, so a key matching no control is skipped: the press validates, refuses, moves nothing and scrolls nothing, and reads as a button that did nothing. The pressed control is the one element the operator is certainly standing on.
**Applies when:** the key names no control. A key that does name one is marked at that field — or once on its group, above.
