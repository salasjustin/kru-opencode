# DOM — jsdom, happy-dom, Browser Mode

The DOM half of `vitest`. Reproduced on the versions pinned in `SKILL.md`; the rest cites the page it comes from.

## Pick the environment per file
`environment` defaults to `'node'`. A DOM test names its own: `// @vitest-environment jsdom` (or `happy-dom`) as the first line, or `environment` in config, or a `projects` entry per environment so unit tests keep the cheap one. `jsdom` / `happy-dom` are peers — install the one the repo uses. `testTimeout` is `5_000` in Node and `15_000` under Browser Mode.

## Testing Library under Vitest
- **Cleanup is not automatic.** RTL registers `afterEach(cleanup)` only when `afterEach` is a global; Vitest ships `globals: false`. Either `globals: true` (and `"types": ["vitest/globals"]` in `tsconfig`), or one `setupFiles` entry:
  ```ts
  import { afterEach } from 'vitest'
  import { cleanup } from '@testing-library/react'
  afterEach(cleanup)
  ```
- **`jest-dom` matchers**: `import '@testing-library/jest-dom/vitest'` in the same setup file — the `/vitest` entry registers against Vitest's `expect` (the bare entry reaches for a global `expect` and fails the file under `globals: false`). Types come from that import, so the setup file sits in tsconfig's `include` — or `types: ["@testing-library/jest-dom/vitest"]`; the README's `types: ["@testing-library/jest-dom"]` leaves the matchers untyped here.
- **`globalThis.IS_REACT_ACT_ENVIRONMENT = true`** in the same setup file: RTL sets it in a `beforeAll` that only registers under `globals: true`, and without it React never prints its *not wrapped in act* warning. Then `--reporter=default` to see it (`SKILL.md`, the reporter swap). A test rendering through `react-dom/client` under `act` from `react`, with no RTL at all, needs the same line — React 19.2.8 prints *The current testing environment is not configured to support act(...)* without it (reproduced).
- **`fetch` is Node's**, so a relative URL throws (`SKILL.md`). Mock at the fetch boundary — `vi.spyOn(globalThis, 'fetch')`, or a request-mocking library at the network seam — and leave the component's call alone.
- What the queries and interactions do once wired — the matcher that reads a different attribute, the key descriptor that lands nowhere — is the **`testing-library`** skill.

## Fake timers with RTL and user-event
Both libraries poll with `setTimeout`, so plain `vi.useFakeTimers()` freezes them: reproduced, `await waitFor(…)` and `await user.click(…)` each ran to `Test timed out`. On this stack the `advanceTimers` option user-event documents did **not** unblock `click` — three variants (`vi.advanceTimersByTime`, an arrow wrapping it, the `Async` form) all hung, as did `delay: null`.

```ts
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

test('debounced search fires once', async () => {
  render(<Search />)
  await userEvent.setup().type(screen.getByRole('searchbox'), 'abc')   // completes
  vi.advanceTimersByTime(300)                                          // jumps the debounce
  await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1))       // polls fine
})
```
`shouldAdvanceTime` lets real time drive fake time (20 ms steps, `advanceTimeDelta`), so the libraries' own timers fire while your explicit advances still jump the timers you meant to fake. Vitest's `vi.waitFor` and `expect.poll` advance fake timers themselves and work under plain `vi.useFakeTimers()`.

## What jsdom leaves out
The `undefined` list is in `SKILL.md` (*jsdom is not a browser*). Present: `localStorage`, `structuredClone`, `CSS.supports`, `PointerEvent`, `getComputedStyle` (values, no layout — every rect is zeros). Stub in `setupFiles` with `vi.stubGlobal` or `Object.defineProperty(window, 'matchMedia', …)`; a component whose behaviour *depends* on layout or observers is a Browser Mode test. Three more from one engagement, reported rather than reproduced here: a double-press guard is a Browser Mode test, because jsdom's `.click()` dispatches synchronously and the disabling re-render is never flushed between two clicks, so the guard passes with nothing guarding; a zag / `ark-ui` combobox is one too — `user.type('Canada')` lands as `Caaa` and `fireEvent.change` never runs the filter; and jsdom measured 0.8–2.6× per file against Browser Mode with a slower flow suite, so measure the repo's own files before migrating for speed.

Setting `window.foo = …` or `globalThis.foo = …` in jsdom/happy-dom reaches the underlying window in v5 (v4 wrote a shadow property). `populateGlobal` returns descriptors, restored with `Object.defineProperty`.

**CSS imports resolve to `''`** — `./page.css`, `?inline` and `?raw` alike — until `css: true` (or `css: { include: [/page\.css/] }`) is in the config: a component reading its own stylesheet as a string gets an empty one, and the document has no sheet (reproduced on 5.0.0). The Tailwind 4 half is `testing-library` → *Hidden is what jsdom can see*.

**happy-dom** (reproduced on `happy-dom@20.14.0`): a package with a `browser` export condition resolves its `default` branch until `resolve.conditions: ['browser']` is in the config. A `<script src>` in test markup logs `DOMException [NotSupportedError]: Failed to load script … JavaScript file loading is disabled` on every test that renders it; `environmentOptions: { happyDOM: { settings: { handleDisabledFileLoadingAsSuccess: true } } }` silences it.

## Browser Mode
Runs the test file in a real browser through Vite; nothing is simulated, and the trade is startup cost plus a Playwright install. Reproduced with `@vitest/browser-playwright@5.0.0`, `playwright@1.62.1` (Chromium 151), `vitest-browser-react@2.2.0`.

```ts
// vitest.config.ts — v4+ shape
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'   // v4+: the provider is a package and a function
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),        // launch options go here, named as Playwright names them
      instances: [{ browser: 'chromium' }],   // at least one
    },
  },
})
```
`pnpm add -D @vitest/browser-playwright` (v5 also ships `@vitest/browser-preview`; WebdriverIO moved to community). `import { page } from 'vitest/browser'` for locators and `userEvent`; `vitest-browser-react` / `-vue` / `-svelte` give `render` (async in v5 for Vue and Svelte — `await render(...)`).

What changes from jsdom, each reproduced:
- **A failing `expect.element` retries until the test times out.** Docs say it defaults to `expect.poll.timeout` (1000 ms); the run says otherwise — a locator that never resolves retried for 14.9 s under the 15 s `testTimeout`, with `expect.poll.timeout: 1000` set in config and ignored. Only the per-call option shortens it: `expect.element(loc, { timeout: 300 })` gave up at 310 ms. The non-retrying form is plain `expect(loc).toBeVisible()` — 3 ms to `Cannot find element with locator: getByText('nope')`. A strict-mode violation (below) is retried the same way, so a locator that matches two elements costs the full timeout before it reports.
- **Locators are exact and strict.** `getByText('Save')` with `Save` and `Save draft` on the page resolves to **1** element; `{ exact: false }` (or `browser.locators.exact: false`) resolves to 2. A locator that resolves to two elements fails an assertion or action with `strict mode violation: getByRole('button') resolved to 2 elements` — narrow with `{ name }`, `.filter`, `.nth`.
- **`expect.element(...).toHaveTextContent('hello')`** against `hello world` fails — exact equality; substring and regex are `toMatchTextContent('hello')` / `toMatchTextContent(/HELLO/i)`.
- **`vi.spyOn(namespace, 'fn')` throws** `Cannot spy on export "b". Module namespace is not configurable in ESM.` — `vi.mock(import('./mod'), { spy: true })` is the observation tool and has the same external-calls-only boundary as in Node (`a()` calling `b()` internally left `b.mock.calls` at 0). Automocked modules return `undefined`.
- **`@testing-library/react` leaks renders here too** (1 button, then 2 across two tests — same cause as under jsdom). `render` from `vitest-browser-react` cleans up between tests without a hook: 0 elements left over. Within a test, `screen.unmount()` leaves the container div behind — a cross-page flow (act on page A, render page B) is `await cleanup()` between the renders.
- **`// @vitest-environment jsdom` is ignored** in a browser project — the file runs in Chromium regardless. Split environments with `projects`.
- **`projects` includes overlap.** A node project's `include: ['**/*.node.test.ts']` subtracts nothing from the sibling browser project's default include, so those files run twice — the second time in Chromium, where `node:fs` is undefined. The browser project `exclude`s them.
- **The api server sits on a fixed port and won't step off it.** Browser mode's Vite server listens on `63315` (top-level `test.api` on v5; `browser.api` on v4), and two browser-mode packages starting together — under one `turbo run test` — crash the second with `Port 63315 is already in use`, which the runner reports as a run with no tests rather than a crash. `api: { strictPort: false }` restores Vite's try-next-port, and every browser-mode package in the workspace needs it, not the one that happened to lose.
- **`test.env` lands only as `import.meta.env.X`.** A module reading `process.env.X` at scope throws `ReferenceError: process is not defined` — naming `process`, not the key. Vitest turns on Vite's `keepProcessEnv`, which drops Vite's own `process.env` define, so the fix is a `define` scoped to the browser project: `"process.env": "{}"` as the catch-all under one `process.env.X` entry per key (the longest matching key wins, so the per-key entries take precedence).
- `alert`/`confirm`/`print` are stubbed (`alert` → `undefined`, `confirm` → `false`) with a stderr warning carrying the `vi.spyOn(window, 'confirm').mockReturnValue(true)` snippet. `matchMedia`, `ResizeObserver` and layout are real (`offsetWidth` reads the actual width).
- Failure screenshots land at `.vitest/attachments/failure-screenshots/<file>/<test-name>.png`, path printed under the failure.
- **A cold run fails files that are fine.** Vitest scans every test file to pre-bundle dependencies; one file the scanner rejects (here, assigning to an import: `[ASSIGN_TO_IMPORT] Cannot assign to import 'b'`) skips pre-bundling for the whole run, and every *other* file that pulls a new dependency then dies at `Failed to import test file` under `Vite unexpectedly reloaded a test`. The second run is green because the dependencies got optimized anyway. Read the `(!) Failed to run dependency scan` block — the offending file is not one of the ones that failed.
- The `minimal` reporter under an agent drops passing tests' `console.log` here too (`SKILL.md`).

Route the choice: **jsdom** for logic-bearing components whose DOM needs are a render and a click; **Browser Mode** for layout, observers, real focus and scrolling, CSS-dependent behaviour, and anything the list above marks `undefined`.
