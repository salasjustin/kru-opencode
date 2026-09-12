---
name: kru-vitest
description: "Vitest recipes — a `*.test-d.ts` that never runs under a green `vitest run`, a passing test's `console.log` the agent-detected `minimal` reporter swallows, `.only` and a new snapshot that pass locally and fail the file in CI, `mockReset: true` turning every module-scope `mockResolvedValue` into `undefined`, `advanceTimersByTime` missing a timer queued behind an `await`, and Testing Library's `waitFor` hanging to `testTimeout` under fake timers. Use when writing, running or reviewing a test in a repo with `vitest` in `package.json`, reading a Vitest run's output, or working under Browser Mode (`@vitest/browser-playwright`). Vitest 5 with the v4 forks marked; not Jest, not Playwright Test."
---

**Vitest fails quietly.** The runner is Vite-native and fast, and every trap below is a run that reports what you did not ask: a test that was never collected, a log that was never printed, state that walked from one test into the next, a timer that never fired, an element left over from the previous render. Read the run you got, not the run you expected.

Reproduced on **`vitest@5.0.0`** with `vite@8.2.2`, `jsdom@30.0.1`, `@testing-library/react@16.3.3`, `@testing-library/user-event@14.6.7`, `react@19.2.8`, Node 24. Vitest 5 needs **Node ≥ 22.12** and **Vite ≥ 6.4**. Check the installed major in `package.json` first — the rows marked *v4* below behave differently there.

| | v4 | v5 |
|---|---|---|
| `clearMocks` default | `false` — call history carries between tests | `true` — history cleared before every test, implementations kept |
| `vi.mock` inside a hook or `describe` | warns, still hoisted | **throws**, names the call and line |
| unawaited `expect(p).rejects` / `.resolves` | warns, auto-awaits | **fails the test** |
| `toThrow('')` | matches only an empty message | matches any message |
| `expect.poll` past its timeout | could still pass late | rejects |
| `-t <pattern>` | matched space-joined names | matches the `' > '`-joined full name |
| config lookup | searched parent dirs | current dir only — pass `--config` from a subdir |
| Browser Mode `getByText(…, { exact: true })` | ignored | enforced — grep `exact: true` on the bump (reported from an engagement, not reproduced here) |

Everything else here holds on both. Full lists: `https://vitest.dev/guide/migration.md` (v5) and `https://v4.vitest.dev/guide/migration` (v4).

## Run it once, then read the run you got
- **`vitest run`**, always. `watch` defaults to `!process.env.CI && process.stdin.isTTY`. Scope it: `vitest run --changed --bail 1` runs only files touching uncommitted changes and stops at the first failure. In a workspace, invoke the binary rather than the package's `test` script — `pnpm --filter <pkg> exec vitest run <file>`. Reported, not reproduced: `pnpm --filter <pkg> test -- <file>` ran the whole project.
- **Vitest detects an AI coding agent and switches to the `minimal` reporter** — it checks `CLAUDECODE`, `CURSOR_AGENT`, `CODEX_SANDBOX`, `GEMINI_CLI` and friends (`std-env`'s agent list). That reporter prints failed tests only: **`console.log` from a passing test is dropped**, and so are the ✓ lines. Reproduced under `CLAUDECODE=1`: the same file prints its passing test's log under `--reporter=default` and nothing under the bare run. Debugging by log needs `--reporter=default` or `--reporter=verbose`.
- **Exit 1 with every test passing.** An unhandled rejection anywhere in the run is reported under *Unhandled Errors* with `This error originated in "<file>" test file` and fails the run while the counts read `2 passed`. Read that block before the summary line.
- **Nothing found is a failure.** A filter that matches no file exits 1 with `No test files found`; `--passWithNoTests` is the opt-out, and it is also how a typo in a path goes green.

## CI flips three defaults
Reproduced by setting `CI=1` on the same files:
- **`.only` fails the file** — `allowOnly` is `!process.env.CI`: `Error: [Vitest] Unexpected .only modifier. Remove it or pass --allowOnly argument to bypass this error`. Green on the laptop, red in the pipeline.
- **A new snapshot is not written** — `update: false` means *write new* locally and *write nothing* in CI, and the missing snapshot is reported as **`Snapshot \`new snapshot 1\` mismatched`**, which reads like a regression rather than a file that was never committed. Commit `__snapshots__/` with the test, or use inline snapshots.
- **Watch is off** — the one flip in your favour.

## Nothing resets between tests unless you say so
```js
const fn = vi.fn().mockReturnValue(7)                   // module scope
test('A', () => { fn(); vi.spyOn(cart, 'm').mockReturnValue('spied') })
test('B', () => { fn.mock.calls.length  // 0   — v5 clearMocks
                  fn()                  // 7   — the implementation stayed
                  cart.m()              // 'spied' — the spy from test A is still installed
                  process.env.FOO       // whatever test A stubbed with vi.stubEnv
})
```
`clearMocks` (v5 default) clears **history only**. Spies, `vi.stubEnv`, `vi.stubGlobal` and module-level state all survive into the next test; the matching flags are `restoreMocks`, `unstubEnvs`, `unstubGlobals`. A file's modules are shared by every test in the file and fresh for the next file (`isolate: true`).

**`mockReset: true` is the wrong flag, and it fails far from the config line.** It runs `vi.resetAllMocks()` before every test, which resets *every* mock's implementation — reproduced, a module-scope `vi.fn().mockResolvedValue(x)` returns `undefined` in every test, and the failure surfaces as `Cannot read properties of undefined` inside the code under test. **`restoreMocks: true` is the safe one**: it touches only spies made with `vi.spyOn` — reproduced, module-scope and in-test `vi.fn(...).mockReturnValue(...)` both kept their values across `vi.restoreAllMocks()` — so it is what the mock-leak advice means. (`mockReset` on a `vi.fn(impl)` resets to `impl`, not to `undefined` — Jest's rule does not apply.)

## `vi.mock` runs before your imports
The call is hoisted above every `import`, wherever it sits in the file. Consequences, each reproduced:
- **v5 throws** on a `vi.mock`/`vi.unmock`/`vi.hoisted` inside a hook, `describe` or `test`: `1 call in "<file>" was defined outside of the module's top level scope`. `vi.doMock` is the un-hoisted variant, and it mocks only imports that happen *after* it — never the static ones.
- **The factory cannot see a top-level `const`**: `ReferenceError: Cannot access 'fake' before initialization`, wrapped in `There was an error when mocking a module`. Declare what the factory needs inside `vi.hoisted(() => ({ fake: vi.fn() }))` and reference that.
- **A factory that omits an export fails on access, not on import**: `[vitest] No "a" export is defined on the "../src/mod" mock` the first time `a()` runs. Spread `await importOriginal()` first and override the one export you mean to.
- **Write `vi.mock(import('./mod'), …)`**, not the string form — TypeScript types the factory's return and `importOriginal`, and a rename follows the file.
- **A spy sees only external calls.** `vi.spyOn(ns, 'b').mockReturnValue(2)` on a namespace import: `ns.b()` → `2`, but `ns.a()` calling `b()` internally → `1`, spy called once. `vi.mock(import('./mod'), { spy: true })` has the same boundary — reproduced, `b.mock.calls.length` is `0` after `a()` called it internally. A function that must be observed from inside its own module is a seam problem, not a mocking problem.

## The test that never ran
- **`*.test-d.ts` is not a test file.** The default `include` is `**/*.{test,spec}.?(c|m)[jt]s?(x)`, so a directory holding `ok.test.ts` and `types.test-d.ts` reports **`Test Files 1 passed (1)`** — green, and the type test was never collected. Type tests run only under `--typecheck` (or `typecheck.enabled`), which needs a `tsconfig.json` the checker can find — without one it fails as `TypeScript compiler returned help text instead of type checking results` — and which also fails the run on **source** type errors outside the tests (`typecheck.ignoreSourceErrors` to scope it to the tests).
- **Coverage counts only files a test imported.** `coverage.include` defaults to *files that were imported during test run*: reproduced, a run touching one of two `src/` files reports `All files 57.14%` over that one file and never lists the other. An uncovered module is invisible until `coverage.include: ['src/**/*.ts']` names it.
- **A fixture runs only when the test destructures it.** `test.extend({ server: … })` then `test('x', () => …)` — reproduced, the fixture ran **0** times; `({ server }) =>` ran it. Setup that must happen regardless is `{ auto: true }`.

## Fake timers stop the clock, not the microtask queue
- **`vi.advanceTimersByTime` misses a timer queued behind an `await`.** `async () => { await x; setTimeout(cb, 100) }` then `vi.advanceTimersByTime(100)` → `cb` called **0** times; `await vi.advanceTimersByTimeAsync(100)` → **1**. The sync advance runs before the microtask that schedules the timer. Reach for the `Async` variants by default.
- `process.nextTick` and `queueMicrotask` are **not faked** (and `nextTick` can't be under the default `forks` pool). `Date` **is** faked and frozen until you advance — `Date.now()` returns the same value across a busy loop.
- **Testing Library under fake timers hangs to `testTimeout`.** `waitFor` and `userEvent.setup().click()` poll with the timers you just faked: reproduced, each dies at `Test timed out in 3000ms`, and user-event's documented `advanceTimers` option did not unblock it on this stack. The fix that did: **`vi.useFakeTimers({ shouldAdvanceTime: true })`** — fake time follows real time while your explicit advances still jump the timer you meant to fake; recipe in `reference/dom.md`. Vitest's own `vi.waitFor` and `expect.poll` advance fake timers themselves and work under plain `vi.useFakeTimers()`.
- `vi.useRealTimers()` in `afterEach` — fake timers are per-file state and outlive the test that installed them.

## jsdom is not a browser, and Testing Library needs one thing from the runner
- The default `environment` is **`node`**: `typeof document === 'undefined'`. A component test needs `// @vitest-environment jsdom` at the top of the file, or `environment: 'jsdom'` in config (jsdom itself is a peer you install).
- **`@testing-library/react` cleans up only if `afterEach` is a global.** With Vitest's default `globals: false` nothing unmounts between tests: reproduced, two tests each rendering `<p>hi</p>` leave **2** elements by the second test, and the symptom downstream is `Found multiple elements with the role "button"` on a `getByRole` that looked unambiguous. Fix once: `globals: true` (reproduced, count back to 1), or `afterEach(cleanup)` in a `setupFiles` entry. Vitest's own `globals` page carries this in a tip; nothing in a failing test does.
- **`fetch` is Node's, not the page's.** `fetch('/api/x')` in jsdom throws `TypeError: Failed to parse URL from /api/x`, because undici has no document base URL even though `location.href` reads `http://localhost:3000/`. A component that fetches a relative path needs a mock at the fetch boundary or an absolute base.
- **What jsdom 30 does not implement** (reproduced, all `undefined`): `window.matchMedia`, `ResizeObserver`, `IntersectionObserver`, `Element.scrollIntoView`, `HTMLDialogElement.showModal`, `showPopover`, `Element.animate`, `navigator.clipboard`. Layout is zero — `offsetWidth` is `0` — so anything measuring or observing size needs a stub in `setupFiles` or a real browser (`reference/dom.md`).

## Assertions that pass on the wrong thing
- **`toEqual` ignores `undefined` properties and class identity**: `{ a: 1, b: undefined }` equals `{ a: 1 }`, and `new P()` equals `{ a: 1 }`. `toHaveBeenCalledWith` uses the same equality, so a call that passed an extra `undefined` field matches an expectation without it. `toStrictEqual` fails both.
- **`expect(asyncFn).not.toThrow()` passes vacuously.** The function returns a rejected promise instead of throwing, the assertion passes, and the rejection lands in *Unhandled Errors* — attributed to the file, not the test, with the run exiting 1 (above). Async is `await expect(asyncFn()).rejects.toThrow(…)` — and in v5 forgetting the `await` fails the test with `Promise returned by expect(actual).rejects.toThrow(expected) was not awaited`.
- Detection is the runner's, not the assertion's: a `.then(() => expect(…))` that fires after the test returned is also an unhandled error, reported against the file.

## Consult current docs (official sources first)
`https://vitest.dev` is first-party, and every page has a markdown twin at `https://vitest.dev/<path>.md` (the migration guide's copy-prompt points there); the raw sources are `docs/` in `github.com/vitest-dev/vitest`, `main` for v5 and the `v4` branch for v4. Context7: `/vitest-dev/vitest` (versions `v4.1.6`, `v4.0.7`, `v3_2_4` — pin the installed major). `guide/learn/writing-tests-with-ai.md` is Vitest's own list of what agents get wrong.

## Recipes
Pull the one the task needs.
- `reference/mocks.md` — the module-mocking half: hoisting and `vi.hoisted`, `importOriginal`, `setupFiles` imports that stay real, the automock algorithm and `{ spy: true }`, class mocks and the v5 prototype chain, the clear/reset/restore matrix, `vi.doMock` and `vi.resetModules`.
- `reference/dom.md` — the DOM half: jsdom vs happy-dom vs Browser Mode (the v5 config shape; `expect.element` retrying to the test timeout rather than the documented 1 s; exact, strict locators; `toHaveTextContent` exactness; why `vi.spyOn` throws in the browser; the cold run that fails files a second run passes; the fixed api port two browser-mode packages collide on; `projects` includes that overlap; `test.env` never reaching `process.env`), Testing Library wiring under Vitest, the fake-timer recipe for RTL and user-event, and the `setupFiles` stubs jsdom needs.

## Not this skill's job
- **What makes a test worth keeping and how this repo tests** — discovery, assertions that can fail, one reason to fail, the run→fix loop: the **`testing`** skill. This one is the runner underneath it.
- **The red → green loop** — `tdd`.
- **Standing up the runner** — `vitest.config.ts` from nothing, scripts, CI wiring: `toolchain-engineer`.
- **End-to-end browser tests** — Playwright Test is a different runner with its own fixtures; Vitest Browser Mode runs *component* tests in a browser and is covered in `reference/dom.md`.
- **Jest** — same shape, different defaults (`globals`, `mockReset` semantics, persistent `mock.mock`); a Jest repo has no row here.
