# Flow & navigation

Where am I, where can I go, can I get back? These entries catch the step a user takes *between* screens — the ones a single-component review never sees because no one screen is wrong on its own.

---

## Every screen states its place in the hierarchy

**Principle:** every screen shows, via heading, active nav state, or breadcrumb, which node of the app the user is currently on.
**Mechanism:** users parachute in via search and deep links, bypassing the homepage entirely — Krug's trunk test: a stranger dropped onto any page must answer "what is this, and where in the site" without backtracking. Nothing here is inferred from memory of how they arrived.
**Code signal:**
  - a route component rendering no heading distinct from the shell — every route resolves to the same static page title
  - a nav list with no active-item marker: no `aria-current="page"`, no `data-state="active"` or equivalent class keyed off the current route
  - a dynamic route segment (`/projects/:id`) that renders nowhere in the visible UI — no name, crumb, or title reflecting *which* project
**Fix:** derive an `<h1>` per route from route data; mark the current nav item with `aria-current="page"`; add a breadcrumb keyed off route segments once hierarchy exceeds two levels.
**Detect:** STATIC
**Source:** *Don't Make Me Think*, ch. 5 (trunk test) · https://www.nngroup.com/articles/navigation-you-are-here/ (2015)

---

## Navigation is one component, not one per route

**Principle:** primary navigation renders from a single shared source across every route — same items, same order, same active-state logic — never re-declared per page.
**Mechanism:** Nielsen's consistency and standards: inconsistency forces the user to re-learn the interface on every screen, and it forces the code to keep N independent copies in sync — which is where it drifts first, one route at a time.
**Code signal:**
  - nav markup or an item array duplicated inline in more than one route/page component instead of imported from one layout
  - a page branching its own `<nav>` JSX per route instead of passing route state into one shared nav component
  - a layout/parent route that some child routes render outside of, bypassing the shared shell entirely
**Fix:** hoist nav into one layout component (or one config array every layout reads); drive per-route highlighting off the router's current-path state, never a hand-maintained class.
**Applies when:** framework-nested layouts (a React Router/Next.js layout route, a SvelteKit `+layout`) satisfy this by construction — check whether any route opts out.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (consistency and standards) · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)

---

## Every screen has a marked way out

**Principle:** any screen reachable without one already on it — a modal, a wizard step, a destructive-confirmation page — renders a visible cancel, close, or back control, not just reliance on the browser's own back button.
**Mechanism:** Nielsen's user control and freedom: users choose the wrong path constantly, and the browser back button doesn't reliably undo *app* state (a modal's open/closed flag, a wizard's current step). Without a control on the screen itself, the only recourse is trust or abandonment.
**Code signal:**
  - a dialog/modal whose only dismissal path is an overlay `onClick`, with no rendered close control
  - a multi-step form whose step N wires a "next" handler but no "back"/"cancel"
  - a destructive-confirmation route (`/delete`, `/confirm`) with a single confirm action and no cancel path
**Fix:** add an explicit close/cancel/back control to every screen enterable without one already present; wire it to a real prior state, not a bare `history.back()`.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (user control and freedom) · https://www.nngroup.com/articles/user-control-and-freedom/ (2020)

---

## Terminal screens hand off the next action

**Principle:** any screen that ends a task — success, empty result, no-match, cancelled — renders at least one action forward, not only a message.
**Mechanism:** finishing the current task was never the goal; the next task was. A screen that states an outcome and stops leaves the user to reconstruct where to go next at the exact moment their attention has already dropped — the same failure NN/g documents for "no results" pages generalizes to every terminal branch.
**Code signal:**
  - a success/confirmation route whose rendered content is a message or icon with no link, button, or redirect
  - an empty-state or no-results branch rendering explanatory text with no call-to-action distinct from that text
  - a redirect target that is itself a dead end — its component tree contains no outgoing link or button
**Fix:** render at least one primary action on every terminal branch — continue, view result, return to list.
**Detect:** STATIC
**Source:** *10 Usability Heuristics* (visibility of system status) · https://www.nngroup.com/articles/search-no-results-serp/ (2014)

---

## No route without a link to it

**Principle:** every route defined in the app is referenced by at least one navigation primitive somewhere in the app's own source.
**Mechanism:** the trunk test only holds if the trunk actually connects to every branch. A route with no incoming link is invisible to a user regardless of how correct its code is — reachable only to the router, and to whoever already has the raw URL.
**Code signal:**
  - a path in the route config or file-based route tree with zero matches for that path string across `<Link to=`, `<a href=`, `router.push(`, `redirect(` in the rest of the source — **but resolve the repo's own link idiom first**: a typed-route helper (`resolve('/(app)/admin/forms/[id]', …)`, `route('posts.show')`, a generated path module) means the string on the page never equals the string in the route tree, and a raw grep returns every route as unlinked. Find how one *known-linked* route is referenced, then search that shape.
  - a route whose only component tree contains no self-referential `<Link>`/anchor either, so a user who lands on it once can't be sent back to it later
**Fix:** link it from somewhere reachable in the nav or flow, or delete it if it's genuinely unreachable.
**Applies when:** routes intentionally reached only from outside the app — webhook callback pages, print views opened via `window.open` — are the exception; note it rather than flag it.
**Detect:** HEURISTIC — a route can be legitimately reached by a server-side redirect or an external link the source doesn't show. Report as a question unless nothing in the repo references it.
**Source:** *Don't Make Me Think*, ch. 2 · https://www.nngroup.com/articles/is-navigation-useful/ (2000)

---

## Back reflects a real, restorable state

**Principle:** any state that changes what's on screen — a filter, a tab, a page number, a selected row — is written to the URL as it changes, not held only in component state.
**Mechanism:** users trust the browser back button as undo — their mental model, not the app's. When the state that produced a view lives only in memory, back returns to a route the browser considers unchanged and nothing visibly happens, breaking that trust on the first press.
**Code signal:**
  - `useState`/`$state` driving a filter, tab, or page number with no corresponding `useSearchParams` / `$page.url.searchParams` write alongside it
  - a tab component switching rendered content via local state while the URL never changes
  - a paginated list whose page resets to 1 on back-navigation instead of restoring from the URL
**Fix:** make the URL the write target for state that changes the view; read component state from it rather than the reverse.
**Detect:** STATIC — the absence of a URL write next to state that visibly drives the view is visible in the component.
**Source:** *10 Usability Heuristics* (user control and freedom) · https://www.nngroup.com/articles/mental-models/ (2024)

---

## A shareable view loads from its URL alone

**Principle:** a filtered, paginated, or tabbed view can be reconstructed by loading its URL with no prior interaction — the loader reads the state, the UI doesn't just write it.
**Mechanism:** a link's value is proportional to how specific it is — a generic link that always resolves to the default view discards everything the user configured, so every refresh, share, or bookmark of that view loses the thing they meant to send.
**Code signal:**
  - a loader / `getServerSideProps` / `load` function reading only path params while ignoring search params the UI clearly writes (filter, sort, tab)
  - filter/sort/tab controls wired to state-only `onChange` handlers with no corresponding `router.push`/`goto` updating the URL
  - a component initializing its filter or tab from a hardcoded default instead of parsing it from the incoming URL on load
**Fix:** parse filter/tab/page state from the URL in the loader on every load; write to the URL on every change, so the two never diverge.
**Applies when:** ephemeral UI state that isn't part of "the view" — an open dropdown, a hover tooltip — is the exception; don't encode everything.
**Detect:** STATIC
**Source:** *Don't Make Me Think*, ch. 2 · https://www.nngroup.com/articles/deep-linking-is-good-linking/ (2002)

---

## Don't hide navigation behind a menu when the viewport has room

**Principle:** primary navigation renders inline whenever the viewport affords it; a collapsed, icon-triggered menu is a narrow-viewport fallback, not a default.
**Mechanism:** hidden navigation roughly halves discoverability regardless of how recognizable the trigger icon has become — recognizing what the icon *means* doesn't remove the extra tap-and-scan step it imposes, so the interaction cost the original research measured still applies whenever space isn't actually constrained.
**Code signal:**
  - primary nav wrapped in a drawer/menu component with no responsive breakpoint that unwraps it to inline links on wide viewports
  - a desktop-width breakpoint present elsewhere in the codebase, but nav visibility still gated behind the same toggle used at mobile widths
**Fix:** render nav items inline above the width where they actually fit (measured against item count, not guessed), collapsing to the icon menu only below that breakpoint.
**Applies when:** this verdict has partly reversed — hold both dates. 2016 found hidden nav hurt task success and time-on-task outright, full stop. 2025 found the icon itself now well-recognized; the live objection narrowed to *hiding nav when there was room not to*, not the icon's use on genuinely narrow viewports.
**Detect:** HEURISTIC — "room" is a judgment about this layout's available width versus item count, not a fact the component states outright.
**Source:** NN/g, "The Hamburger-Menu Icon Today" · https://www.nngroup.com/articles/hamburger-menu-icon-recognizability/ (2025); supersedes "Hamburger Menus and Hidden Navigation Hurt UX Metrics" · https://www.nngroup.com/articles/hamburger-menus/ (2016)

---

## A gated setup shows its locked steps and unlocks them from state

**Principle:** where later steps depend on earlier ones, render the whole sequence from the first screen — the unavailable steps locked and labelled with what they need — and unlock each from its prerequisite existing.
**Mechanism:** one step at a time withholds the model of the process: the user can't see how much is left, or why the thing they came to configure isn't on screen. A step counter reading no real state also re-offers work whose side effects already happened — in setup, resources already created outside the app.
**Code signal:**
  - `useState(0)` / `?step=` / `activeStep` as the only input deciding which panel renders — nothing queries whether the previous step's resource exists
  - `{step === 2 && <Panel/>}` gating with no disabled branch for the steps not yet reached
  - a setup route whose loader fetches nothing already-provisioned, so a return visit restarts at zero
**Fix:** derive the active step from the persisted prerequisites; render the full sequence on every screen with the unreached steps disabled.
**Applies when:** infrequent configuration done once — a repeat run wants a direct path (one form, a CLI call) over the guided one. Inverts for a single-sitting sequence (address → payment) that provisions nothing and has nothing to resume. Orientation *within* a sequence the user can already see is `states-and-feedback` → "shows the step count and current position".
**Detect:** STATIC
**Source:** NN/g, "Wizards: Definition and Design Recommendations" · https://www.nngroup.com/articles/wizards/ (2017)
