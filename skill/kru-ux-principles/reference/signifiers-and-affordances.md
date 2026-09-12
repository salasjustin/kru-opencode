# Signifiers & affordances

Does the control announce what it does, before anyone clicks it? These are the highest-yield entries in the corpus: an affordance defect is almost always visible in the markup, which makes this the group with the most `STATIC` tiers.

---

## Anything that navigates must be a link

**Principle:** a destination the user is told about is rendered as a navigation primitive, not as text describing it.
**Mechanism:** users scan for signifiers, not for meaning. A path rendered as prose costs a manual copy-paste into the address bar — the user has to *do the routing themselves*, which is exactly the work the interface exists to absorb.
**Code signal:**
  - a route-shaped string sitting in a text node with no navigation ancestor — `<p>go to /admin/settings</p>`, `<span>visit /billing to upgrade</span>`
  - instructional prose naming a screen with no link beside it — `"head to Settings to enable this"`
  - a bare URL in a template string or a toast/notification payload
**Fix:** wrap the destination in the repo's navigation primitive (`<Link to>`, `<a href>`), keeping the visible text as the label.
**Detect:** STATIC
**Source:** *Don't Make Me Think*, ch. 2 · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)

---

## The element must match the behaviour it carries

**Principle:** navigation uses a link; an action that changes state uses a button. Never a generic element with a handler bolted on.
**Mechanism:** the element *is* the signifier. A `<div>` carries no pretrained expectation, so nothing about it tells a user it can be clicked — and nothing tells the browser either, which is why the keyboard and screen-reader failures ride along with the usability one.
**Code signal:**
  - `onClick` / `on:click` on a `<div>` or `<span>` with no `role` and no `tabIndex`
  - a `<button>` whose only job is `navigate('/x')` or `router.push('/x')`
  - an `<a>` with `href="#"`, `href=""`, or no `href`, doing its real work in a click handler
**Fix:** swap to the semantically correct element — `<a>`/`<Link>` for navigation, `<button>` for actions — and delete the hand-rolled key handling it needed.
**Applies when:** always. Note the overlap: this is simultaneously a WCAG keyboard defect, so cite `accessibility-review`'s lane rather than re-auditing it.
**Detect:** STATIC
**Source:** *The Design of Everyday Things*, ch. 1 · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)

---

## An affordance that only appears on hover doesn't exist on touch

**Principle:** no control is revealed exclusively by hover.
**Mechanism:** touch has no hover state, so a hover-revealed control is simply absent for a large share of users — and undiscoverable for the rest, since nothing invites the hover that would reveal it.
**Code signal:**
  - a control whose visibility is set only under a hover selector — `.row:hover .actions { display: block }`, `group-hover:opacity-100` on the only path to an action
  - `onMouseEnter` / `onMouseOver` as the sole trigger for rendering an interactive element
  - a row/card whose actions render conditionally on a `isHovered` state with no focus or touch equivalent
**Fix:** render the control persistently, or reveal it on focus and tap as well as hover; reserve hover-only for redundant emphasis, never for the sole path.
**Applies when:** inverts nowhere, but the cost is highest in dense list/table UI where hover-reveal is the standard pattern.
**Detect:** STATIC
**Source:** *Don't Make Me Think*, ch. 6 · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)

---

## A control's state must be visible on the control

**Principle:** selected, active, expanded, and disabled states are rendered on the control itself, not inferred from something elsewhere on the screen.
**Mechanism:** recognition beats recall. If the only evidence a filter is active lives in the results below it, the user has to hold the mapping in working memory and re-derive it every time they look away.
**Code signal:**
  - a toggle/tab/filter whose active styling is applied by a parent, with no `aria-pressed`, `aria-selected`, `aria-expanded`, or `data-state` on the control
  - state conveyed by colour alone — an active class that changes only `color` or `background`, with no weight, border, icon, or text change
  - a disabled control rendered with `disabled` and no adjacent explanation of *why*
**Fix:** put the state on the control (`data-state` / the appropriate ARIA state) and give it a non-colour cue; for disabled, render the reason next to it.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (visibility of system status; recognition rather than recall) · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)

---

## The clickable area is the whole thing that looks clickable

**Principle:** the interactive element wraps the entire visual affordance — the label, the icon, and the padding that reads as part of it.
**Mechanism:** Fitts's law — acquisition time falls as the target grows. Worse than slow, though, is a target whose *visual* bounds and *actual* bounds disagree: the user aims at what looks like the button, misses, and concludes the interface is broken.
**Code signal:**
  - a card or row rendered as clickable-looking while only its title text is inside the `<a>`/`<button>`
  - an icon button whose element wraps the `<svg>` but not its padding — padding applied to a parent wrapper instead of the control
  - a label rendered as a sibling of its input with no `htmlFor`/`for` association
**Fix:** move the interactive element outward so it encloses the full visual affordance; put padding on the control, not around it.
**Applies when:** cards containing *multiple* independent destinations are the exception — nesting them inside one big link makes the inner ones unreachable. Use one primary link plus explicit secondary links.
**Detect:** STATIC
**Source:** *Laws of UX* (Fitts's law) · https://lawsofux.com/fittss-law/ (2020)

---

## An icon alone doesn't say what it does

**Principle:** an icon-only control carries a text label, or a persistent, discoverable equivalent.
**Mechanism:** almost no icons are universal — the floppy disk and the hamburger are learned conventions, and everything past that handful is a guess the user makes and sometimes gets wrong. An icon's meaning is recalled, not recognised, which inverts the property that makes icons feel fast.
**Code signal:**
  - a `<button>` whose children are only an `<svg>`/icon component, with no `aria-label` and no visible text
  - a tooltip supplying the *only* statement of what the control does (hover-gated meaning — see the hover entry above)
  - an icon repurposed away from its conventional meaning — a gear that opens something other than settings, a magnifier that filters rather than searches
**Fix:** add a visible label where space allows; otherwise an `aria-label` plus a tooltip, and never let the tooltip be the only source.
**Applies when:** a small set of conventional icons (close, search, menu, back) survive unlabelled in familiar positions. Novel or domain-specific icons never do.
**Detect:** STATIC
**Source:** *Don't Make Me Think*, ch. 3 · https://www.nngroup.com/articles/icon-usability/ (2014)

---

## Match the convention rather than inventing one

**Principle:** placement and behaviour of common controls follow the pattern users already carry from every other product.
**Mechanism:** Jakob's law — people spend nearly all their time in *other* interfaces, so their expectations are formed elsewhere. A novel arrangement isn't neutral; it spends attention on relearning something that was already free.
**Code signal:**
  - a logo in the header that isn't a link to the home/root route
  - primary navigation rendered below the fold or after the main content in source order
  - a cancel/confirm pair in the reverse of the platform's order, or a submit button that isn't last in the form
  - search rendered as a control that doesn't accept typed input directly
**Fix:** adopt the conventional placement and ordering; if a deviation is deliberate, it should be a recorded decision, not an accident.
**Applies when:** deviation is defensible for a genuinely novel interaction with no established convention — rare, and never true of nav, search, or form submission.
**Detect:** HEURISTIC — conventionality is a judgment about the user's world, not a fact in the file. Report as a question.
**Source:** *Laws of UX* (Jakob's law) · https://lawsofux.com/jakobs-law/ (2020)

---

## Don't make the user do the system's bookkeeping

**Principle:** the interface does not ask for anything it already knows, nor make the user transcribe data between its own screens.
**Mechanism:** Cooper's *excise* — work the user performs for the software's benefit rather than their own. It doesn't feel like a bug to the person who built it, because each individual step is small; it accumulates into the sense that the tool is fighting you.
**Code signal:**
  - a form field collecting something already present on the session/user object
  - a confirmation or success screen that displays an identifier the user must copy to use on the next screen
  - a required field whose value is derivable from another field already submitted
  - a flow that re-asks for input after a validation failure instead of preserving what was entered
**Fix:** prefill from what's known, carry the value forward through the flow, or derive it — and preserve submitted input across a failed validation.
**Detect:** HEURISTIC — needs knowledge of what the system already holds; confirm against the loader/session shape before reporting.
**Source:** *About Face*, ch. 11 · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)
