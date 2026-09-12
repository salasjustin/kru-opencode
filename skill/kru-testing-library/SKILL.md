---
name: kru-testing-library
description: "Testing Library recipes — the green component test whose query found the wrong element or whose interaction did nothing: `getByText` failing on text split across elements under a regex and `exact: false` alike, a regex `name` matching every button containing the word, `toBeDisabled` passing over `aria-disabled` while `user.click` on it fires, `waitFor` resolving on a falsy return, user-event 14 silently dropping v13 key descriptors, and the act warning that never prints under Vitest's `globals: false`. Use when writing or reviewing a component test in a repo with `@testing-library/react` or `/svelte`, or reading a query failure. Not Playwright, not Vitest Browser Mode locators."
---

**A green component test proves what its queries prove, and the queries only ask the accessibility tree what the markup put there.** Every trap below is a green that proves nothing: a matcher reading a different attribute than the one you meant, a keystroke that fell on the floor, a `waitFor` that never waited, a warning with nowhere to print. Read a query failure as a report on the markup before reading it as a report on the query.

Reproduced on **`@testing-library/react@16.3.3`** (npm `latest`, 2026-09-06) with `@testing-library/dom@10.4.1`, `@testing-library/user-event@14.6.7`, `@testing-library/jest-dom@7.0.1`, `react@19.2.8`, `vitest@5.0.0`, `jsdom@30.0.1`, TypeScript 7.0.2, Node 24. Re-verify after a major bump. `@testing-library/dom` is a peer of RTL 16 and of jest-dom 7 (Node ≥ 22) — install it explicitly. `@testing-library/svelte` shares the query and user-event halves; the `render`/`act` half is React's.

## `getByText` reads an element's own text nodes
```tsx
<p>Hello <b>world</b></p>
screen.getByText('Hello world')                   // throws — "text is broken up by multiple elements"
screen.getByText(/Hello world/)                   // throws — same
screen.getByText('Hello world', { exact: false }) // throws — same
screen.getByText('Hello')                         // <p>  — its own text node, trimmed
screen.getByText('world')                         // <b>
screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === 'Hello world')   // <p>
```
The matcher runs against each element's *own* text nodes joined, never `textContent`, so no matcher form crosses an element boundary — the function matcher is the only one that does. Normalization trims and collapses whitespace (`&nbsp;` included). For "does this block say X", assert on the parent with `toHaveTextContent`, under the `testing` skill's rule on its substring match.

## A string matches the whole name; a regex matches anywhere
```tsx
<button>Save changes</button> <button>Save</button>
screen.getByRole('button', { name: 'Save' })      // "Save" — a string is a full match after normalization
screen.getByRole('button', { name: /Save/ })      // throws — Found multiple elements
screen.getByRole('button', { name: /^save$/i })   // "Save"
<label>Email:<input /></label>
screen.getByLabelText('Email')                    // throws — the label's text is "Email:"
screen.getByLabelText(/^email/i)                  // <input>
```
`exact: true` is the default everywhere and means the full string, case-sensitive. The docs' regex habit (`/submit/i`) is a substring match: on a page with two buttons sharing a word it is the *multiple elements* error, and on a page with one it matches the wrong button after a copy change. Anchor it.

## The name is the accessible name, not the text
```tsx
<button aria-label="Close">×</button>
screen.getByText('Close')                              // throws — aria-label is not text
screen.getByRole('button', { name: '×' })              // throws — aria-label replaces the content
screen.getByRole('button', { name: 'Close' })          // ✓
<button>Save <span aria-hidden="true">*</span></button>
screen.getByRole('button', { name: 'Save' })           // ✓ — aria-hidden content is out of the name
<label>Email</label><input placeholder="Email" />
screen.getByLabelText('Email')                         // throws — "Found a label … however no form control was found associated to that label"
screen.getByRole('textbox', { name: 'Email' })         // throws — a placeholder is not a name
screen.getByPlaceholderText('Email')                   // ✓, and the only query that finds it
```
A role query that fails where the placeholder query passes has found an unlabelled field. Fix the markup (`htmlFor`/`id`, or wrap the input in the label) and keep the role query; the `getByLabelText` message above is the exact wording of that defect.

## Roles that aren't there
Reproduced, each `getByRole` a miss:
- `<input type="password">`, `type="date"`, `type="file"`, `type="color"` have **no role** — `getByRole('textbox')` never finds a password field; `getByLabelText` does.
- `<a>` without `href` is not a `link`. `<div onClick>` has no role. `<img alt="">` is `presentation`.
- `<select>` is `combobox`; `<select multiple>` is `listbox`. `type="number"` is `spinbutton`, `type="search"` is `searchbox`, `type="range"` is `slider`.
- `getAllByRole('textbox')` returns `text`, `email`, `tel`, `url` inputs **and** `<textarea>`. `<input type="submit" value="Go">` is a `button` named `Go`.

## `getByRole` costs seconds on a big DOM
Measured cold on a 3,000-item list under jsdom: `getByText` 104 ms, `getByRole('link', { name })` **968 ms**, the same with `hidden: true` 253 ms, `getAllByRole('listitem')` 588 ms; a role nothing on the page has is cheap (18 ms). The cost is the visibility pass — `getComputedStyle` up every ancestor of every candidate — and a handful of role queries over a rendered table is Vitest's 5 s `testTimeout`. Scope with `within(row)` first; pass `hidden: true` when visibility isn't what the assertion is about. `findBy*` polls the same computation, so its 1 s timeout buys one or two checks.

## Hidden is what jsdom can see
`getByRole` excludes (reproduced): the `hidden` attribute, inline `display: none`, `aria-hidden`, an ancestor's `visibility: hidden`, a `<style>` rule in the document, a closed `<dialog>`. It **includes** a `className="hidden"` element, and `toBeVisible()` passes on it: Vitest processes no imported CSS by default — `document.styleSheets.length` is `0` with the stylesheet imported. `css: true` in the Vitest config applies the import (1 sheet; `.hide` then fails `toBeVisible`); a utility framework's classes exist only once its build step is in that pipeline. `getByText` ignores visibility entirely, and a closed `<details>` is visible to `getByRole` while `toBeVisible` demands `open`. A Tailwind 4 sheet compounds it: jsdom's parser rejects most of its output (`Could not parse CSS stylesheet` per rejected block, a handful of rules survive), so with `css: true` and the sheet imported, `.hidden` still computes `display: block` and `toBeVisible()` passes on it — under jsdom assert the attribute or role a hidden state sets, and leave visibility to Browser Mode (reproduced on `tailwindcss@4.3.3`).

## jest-dom reads one attribute, and it may not be yours
```tsx
expect(ariaDisabledButton).toBeDisabled()     // fails — the matcher reads `disabled` (and fieldset ancestry) only
await user.click(ariaDisabledButton)          // onClick fires — 1 call
expect(numberInput).toHaveValue('5')          // fails — a number input's value is the number 5
expect(numberInput).toHaveValue(5)            // ✓; toHaveDisplayValue('5') for the string
expect(screen.queryByText('Save')).toBeInTheDocument()
// on a miss: "received value must be an HTMLElement or an SVGElement. Received has type: Null" — no DOM in the message
```
A component that disables with `aria-disabled` guards in its handler, and its test asserts `toHaveAttribute('aria-disabled', 'true')` *and* that the click did nothing. Presence goes through `getBy` (its failure prints the DOM); `queryBy` is for absence, `expect(queryBy…).not.toBeInTheDocument()`.

## Under Vitest, two failures are silent
The wiring recipe — cleanup, the setup file, matcher types, the act flag, fake timers — is the `vitest` skill's `reference/dom.md`. What the run shows when a line of it is missing, reproduced:
- **`import '@testing-library/jest-dom'`** (no `/vitest`) under `globals: false` throws `ReferenceError: expect is not defined` from the setup file, and every test file reports **0 tests**. The README's `types: ["@testing-library/jest-dom"]` leaves `toBeDisabled` a `tsc` error on Vitest's `Assertion`.
- **Act warnings are off.** RTL sets `IS_REACT_ACT_ENVIRONMENT` in a `beforeAll` it registers only when `beforeAll` is a global; under `globals: false` the flag stays `undefined` and React 19 never prints *An update to %s inside a test was not wrapped in act(...)* — the same state update after a raw `await` warns with the flag set and says nothing without it. The agent-detected `minimal` reporter drops a passing test's `console.error` besides. The warning is the only signal that an assertion raced an update; it reaches you with the flag on **and** `--reporter=default`.
- jsdom's `Not implemented: HTMLFormElement's requestSubmit() method` (a submit nobody `preventDefault`ed) and `Not implemented: navigation to another Document` (a click on a real `href`) print under every reporter and fail nothing — unless the handler was supposed to prevent it.

## `waitFor` retries only on a throw
```ts
await waitFor(() => false)                                       // resolves in 2 ms — a falsy return is success
await waitFor(async () => { await user.click(btn); expect(n).toBe(3) })   // passes: the click ran 3 times
await waitFor(() => { throw phase < 5 ? new Error('early') : new Error('late') }, { timeout: 300 })   // rejects with "late" — the last error, not the first
await waitForElementToBeRemoved(screen.queryByText('gone'))      // throws synchronously: "already removed … requires that the element(s) exist(s) before waiting for removal"
```
The callback is an assertion: `expect` inside it, side effects outside. `findBy*` is `getBy*` inside `waitFor` (1000 ms, 50 ms interval plus a MutationObserver) and already asserts presence — the `toBeInTheDocument` after `await screen.findByText(…)` is the vacuous assertion `testing` bans. `waitForElementToBeRemoved` takes the element captured *before* the action that removes it. Fake timers freeze all of this; the `vitest` skill has the thaw.

## user-event: the interaction that did nothing
Every call is `await`ed; one `userEvent.setup()` per test, before `render`. Reproduced on 14.6.7:
- **`type` appends and clicks first.** `'ab'` + `type('c')` is `'abc'` — `clear` first; the implied click fires `onFocus`/`onClick` (`skipClick: true` to skip). `type` into a `readonly` or `disabled` input, `type` on a `<div>`, and `keyboard` with nothing focused change nothing and throw nothing.
- **v13 descriptors are silently wrong in v14.** `{selectall}` does nothing, `{space}` does nothing, `{del}` does nothing, `{esc}` dispatches a key literally named `"esc"`. v14 spells them `{Control>}a{/Control}`, `' '` or `[Space]`, `{Delete}`, `{Escape}`; a literal brace is doubled (`{{`, `[[`); an unclosed `{a` throws. `{enter}` and `{arrowleft}` happen to resolve; the keyboard page's spelling is the one to use.
- **`pointer-events: none` on the element or any ancestor throws** (`Unable to perform pointer interaction as the element has pointer-events: none`) where `fireEvent.click` on the same element fires; `pointerEventsCheck: 0` opts out for a test that means it. A `disabled` button click is 0 calls under both.

## `fireEvent.change` with the value already set is dropped
`change` to `'a'`, `'a'`, `'b'` on a controlled input reaches `onChange` as `['a', 'b']` — React's value tracker skips a change that doesn't move the value, and `fireEvent.input` takes the same path. A test that "changes" a field to what it already holds fails on the tracker, not on the handler.

## `renderHook`: read `result.current` after the act
```ts
const { result } = renderHook(() => useState(0))
const [v0, set] = result.current
act(() => set(5))
v0                  // 0 — the destructured value is the old render
result.current[0]   // 5
```
`act` comes from `@testing-library/react` (or `react`); `react-dom/test-utils` still exports it in React 19 with a deprecation `console.error` per call.

## Debug output stops at 7,000 characters
`screen.debug()` and every `getBy` failure's DOM dump are cut with `...` at 7,000 characters (`DEBUG_PRINT_LIMIT=20000` raises it), so on a real page the element you're looking for is past the end. `screen.debug(el)` / `within(el)` to narrow; `logRoles(container)` when the question is which roles exist.

## Consult current docs (official sources first)
`https://testing-library.com/docs/` (queries: `/queries/about`, `/queries/byrole`; async: `/dom-testing-library/api-async`; user-event: `/user-event/intro`, `/user-event/options`, `/user-event/keyboard`) — raw Markdown under `docs/` in `github.com/testing-library/testing-library-docs`. jest-dom's matcher list is its README (`github.com/testing-library/jest-dom`). Context7: `kru-testing-library/testing-library-docs`, `kru-testing-library/user-event`. Verify anything version-sensitive against the installed package.

## Not this skill's job
- **What makes a test worth keeping and how this repo tests** — discovery, `toHaveTextContent`'s substring match, the mount-once helper, the run→fix loop: the **`testing`** skill.
- **The runner** — cleanup between tests, the setup file, `globals`, fake timers with RTL and user-event, the reporter that drops output, jsdom's missing APIs, Browser Mode (whose `page.getByRole` locators are exact-and-strict by their own rules): the **`vitest`** skill.
- **Whether the markup is accessible** — a query that can't name a control is a defect the builder fixes now; the audit of the rest is `accessibility-reviewer`'s.
- **End-to-end** — Playwright Test's locators share the vocabulary and none of the semantics.
