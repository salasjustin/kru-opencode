# Choice & load

How much is being asked of working memory at this step? These entries catch the moment a screen asks the user to hold, compare, or decide among more than the task actually requires.

---

## A long, ungrouped option list costs decision time — group it, search it, or cut it

**Principle:** the number of choices presented at once is a cost; reduce it by grouping, search, or staged reveal rather than dumping the full set.
**Mechanism:** Hick's law — decision time rises with the number and complexity of options in front of the user. It isn't linear and it isn't fixed by a magic threshold; a flat 40-item list costs more than the same 40 items sorted into 6 labeled groups, because grouping lets the user discard whole branches without reading every leaf.
**Code signal:**
  - a `<select>`/listbox with 25+ hardcoded `<option>` elements, no `<optgroup>`, and no search or filter input
  - a top-level nav or tab bar rendered from an array of 8+ sibling items with no submenu/grouping structure
  - a filter panel rendering every enum value from a schema as an individual checkbox with no "show more" or category wrapper
**Fix:** add search/typeahead for long lists, segment with `<optgroup>`/headers, or split the decision into stages (progressive disclosure).
**Applies when:** short, genuinely flat sets (under ~10, no natural grouping) don't need this — grouping a 6-item list adds a layer of decision without reducing one.
**Detect:** STATIC — option/item count is countable in source.
**Source:** *Laws of UX* (Hick's law) · https://lawsofux.com/hicks-law/ (2020)

---

## Chunk long lists and long digit strings — don't leave scanning to do the grouping

**Principle:** a long undifferentiated list or number string is broken into labeled or visually separated chunks before it reaches the user.
**Mechanism:** Miller's law — working memory holds a small number of *chunks*, not a small number of *items*; grouping trades many items for few chunks, which is what actually helps, not raw list length. The "7±2" figure gets misquoted as "keep every list under 7 items" — it isn't a UI list-length rule, it was a measure of short-term recall span, and most on-screen lists are scanned and filtered, not memorized, so the count itself rarely matters. What matters is whether related items are grouped.
**Code signal:**
  - a flat `<ul>`/`<li>` or `.map()` rendering 10+ items with no group headers, dividers, or `<section>` boundaries between related runs
  - a card/account/confirmation number rendered as one unbroken string with no space, dash, or grouping markup (`1234567890123456` vs `1234 5678 9012 3456`)
  - a form with 15+ fields in a single unsegmented block, no `<fieldset>`/section splitting related inputs
**Fix:** insert group headers or `<fieldset>` boundaries around related items; chunk digit strings in the format the user would write them by hand.
**Applies when:** doesn't apply to a list left deliberately flat for sorting/scanning a table — grouping there fights the sort the user asked for.
**Detect:** STATIC
**Source:** *Laws of UX* (Miller's law) · https://lawsofux.com/millers-law/ (2020)

---

## Advanced and rare options stay hidden until asked for

**Principle:** the default view of a screen shows only what most users need; anything advanced or rarely used sits behind an explicit reveal.
**Mechanism:** progressive disclosure — every visible field or option is scan cost paid by every user, including the majority who will never touch it. Rendering the full surface flat charges the common case for the exception's sake.
**Code signal:**
  - an "Advanced"/"More options" section rendered inline and expanded by default instead of behind a `<details>`, accordion, or collapsed toggle
  - a settings/create form rendering every field from a schema with no `advanced`/`optional`-style flag consulted for default visibility
  - a create/edit dialog with 20+ simultaneously visible fields where most carry a rarely-changed or blank default
**Fix:** collapse rare/advanced fields behind a disclosure control, default collapsed, and let the common path stay short.
**Applies when:** inverts for expert-only tools — Cooper's *About Face* argues persistent visibility is correct when the entire audience is power users who pay the scan cost once and then benefit from not clicking to reveal it every time. Krug's version applies to general/mixed-audience flows; state which audience the screen has before flagging this.
**Detect:** HEURISTIC — "advanced/rare" is a judgment on how often a field is used, which the code doesn't state on its own; report as a question unless the code carries an explicit flag (`advanced`, `optional`) that visibility ignores.
**Source:** *Don't Make Me Think*, ch. 5 · https://www.nngroup.com/articles/progressive-disclosure/ (2006)

---

## Ranking is a decision — users take the first plausible option, not the best one

**Principle:** the option order in a list is treated as a ranking decision, not left to insertion order or the database's default sort.
**Mechanism:** satisficing — Krug's observation that users scan quickly and commit to the first option that looks "good enough," rather than comparing every alternative. Whatever sits first absorbs a disproportionate share of selections regardless of whether it's actually the best fit, which makes list order a design lever, not a neutral detail.
**Code signal:**
  - a `<select>`/list whose items come straight from a DB query or object with no explicit `order`/`sort`/`rank`/`recommended` field driving position
  - several similarly-worded CTAs or plan/tier cards where the option intended for most users is not first in DOM order
  - a search/results list rendered in raw insertion or alphabetical order when a relevance or popularity signal exists elsewhere in the same payload and goes unused
**Fix:** sort by likelihood/recommendation, or mark one option explicitly "recommended" and place it first.
**Applies when:** inverts where order is externally mandated — alphabetical country/state pickers, legally required disclosure ordering. Flag as a question there, not a defect.
**Detect:** HEURISTIC — "most likely to be correct" is a judgment on user intent the code doesn't state; report as a question, citing the actual sort/order source as evidence.
**Source:** *Don't Make Me Think*, ch. 1 · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)

---

## The first and last slots in a sequence are what gets remembered

**Principle:** the highest-priority items in a nav, list, or step sequence occupy the first and/or last position; lower-priority items sit in the middle.
**Mechanism:** the serial position effect — primacy and recency mean items at the edges of a sequence are recalled far better than anything in the middle, independent of how long the sequence is.
**Code signal:**
  - a primary-nav config/array where the single most-used route (or the account/logout control) sits mid-array rather than first or last
  - a settings/menu list where the one high-consequence action (delete, upgrade, submit) is positioned mid-list among low-stakes items
  - a multi-step wizard/stepper array where the step that actually differentiates the choice (price, confirm) is buried between filler steps
**Fix:** move the 1-2 highest-priority items to the first and/or last slot of the sequence.
**Applies when:** N/A for sets with no priority ordering at all (e.g. alphabetized reference data) — this only bites when the code has an implicit priority the position ignores.
**Detect:** HEURISTIC — "most important" is a judgment on task priority; the array/config order is the STATIC evidence, but the priority claim itself is a question.
**Source:** *Laws of UX* (serial position effect) · https://lawsofux.com/serial-position-effect/ (2020)

---

## One action wears the primary style per screen

**Principle:** at most one control per screen or section carries the high-emphasis (primary/filled/accent) treatment; every other action is visually secondary.
**Mechanism:** the Von Restorff effect — a single visually distinct element is what draws the eye and gets acted on. Style every button "primary," and the effect cancels itself: nothing stands out because everything does, and the user is back to reading labels one by one.
**Code signal:**
  - 2+ sibling `<button>`/`<Button>` elements in one view sharing the same `variant="primary"` (or equivalent accent-filled class) prop
  - a design-system `Button` component invoked 3+ times with the primary variant inside one route/section
  - a modal or form where "Cancel" and multiple confirm-style actions all carry equal visual weight
**Fix:** demote all but one action per screen to secondary/outline/ghost; keep exactly one primary, or none if the screen has no dominant action.
**Applies when:** a screen of genuinely independent widgets (e.g. a dashboard) may correctly have zero primary actions — absence isn't the defect there, multiplicity is.
**Detect:** STATIC — variant/class usage per screen is countable directly in source.
**Source:** *Laws of UX* (Von Restorff effect) · https://lawsofux.com/von-restorff-effect/ (2020)

---

## Irreducible complexity is absorbed by the system, not pushed onto the user

**Principle:** when a task has complexity that can't be removed, the software does the reconciling — computing, deriving, validating — rather than asking the user to supply or resolve it by hand.
**Mechanism:** Tesler's law — total complexity in a task is roughly conserved; every unit the software doesn't handle becomes a unit of user work. Which side absorbs it is a design decision made once per field, not a fact about the domain.
**Code signal:**
  - a required field asking the user to compute a value derivable from other fields already on the same form (total, duration, a checksum) instead of the app deriving it
  - client-side validation re-implementing a server rule with no shared source of truth — the user has to satisfy two independent guesses at the same constraint
  - a field requiring manual selection of a value that's already inferable from context on the page (timezone, currency, org/plan) with no read of that context feeding a default
**Fix:** compute/derive the value instead of collecting it, or prefill from context already available and let the user only override.
**Applies when:** distinct from the smart-defaults entry below — this is about removing a field entirely because it's derivable; that entry is about pre-filling a field that has to stay because it's occasionally not the default.
**Detect:** HEURISTIC — "derivable" requires knowing what data the system already holds; confirm against the loader/session/other-field shape before reporting.
**Source:** *Laws of UX* (Tesler's law) · https://lawsofux.com/teslers-law/ (2020)

---

## A field with one overwhelmingly common value ships with that value pre-selected

**Principle:** a required input whose correct value is the same for nearly every user renders with that value already selected, not empty and waiting.
**Mechanism:** every unfilled choice is decision cost paid again by each user, most of whom would answer identically; a default absorbs that cost for everyone it predicts correctly and leaves an explicit override for who it doesn't.
**Code signal:**
  - a `<select>`/radio group over a small closed set with no `defaultValue`/`checked` set, where the schema/DB column backing it already declares a `DEFAULT`
  - a required field with no initial value wired, even though the same literal value is hardcoded elsewhere in the codebase (single supported currency, single region, single plan)
  - a boolean/toggle setting rendered unchecked with no default read, where the column or config it maps to defines one
**Fix:** wire the control's initial value to the schema/config default or the one already-known common case; keep it changeable.
**Applies when:** genuinely bimodal or user-specific fields (no dominant value) don't get a default forced onto them — that trades one bias for another.
**Detect:** HEURISTIC in general (needs usage data the code doesn't state) — narrows to STATIC in the specific case where the schema/DB already declares a default the form fails to mirror; that mismatch is directly checkable.
**Source:** *10 Usability Heuristics* (error prevention) · https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, rev. 2024)
