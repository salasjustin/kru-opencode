# Mocks — the module half

The mocking half of `vitest`. Reproduced on the versions pinned in `SKILL.md`; the rest cites the page it comes from.

## Hoisting, and the three ways to reference something from a factory
`vi.mock` is moved to the top of the file before any `import` runs, so the factory executes in a module that has evaluated nothing yet.

```ts
import { b } from './mod'
const mocks = vi.hoisted(() => ({ b: vi.fn(() => 5) }))   // hoisted with vi.mock, so it exists in time
vi.mock(import('./mod'), () => ({ b: mocks.b }))
```
- **`vi.hoisted`** — the only top-level binding a factory may read. Declared *before* the `vi.mock` that uses it.
- **`importOriginal`** — `vi.mock(import('./mod'), async (importOriginal) => ({ ...await importOriginal(), b: vi.fn() }))`. Async, must be awaited; keeps every export you did not name, which is what avoids the `No "a" export is defined on the mock` failure on first access.
- **`vi.doMock`** — not hoisted, may reference anything in scope, mocks only the *next* import: pair it with a dynamic `await import('./mod')` inside the test. A static `import` above it is already resolved and stays real.

`vi` must be the `vi` imported from `vitest` (or the global under `globals: true`) — the hoisting is a static transform and does not follow a re-export from a utility file. `vi.mock` applies to `import` only, never `require`. Paths resolve like an import from the test file, aliases included.

**Anything a `setupFiles` entry imported is already cached** when the test file's `vi.mock` runs, so it stays real; `vi.resetModules()` inside `vi.hoisted` clears the cache first. The other direction works: a `vi.mock` *in* a setup file mocks the module for every test file.

## What automocking produces
`vi.mock(import('./mod'))` with no factory replaces the module by its shape:
- functions → `vi.fn()` returning `undefined`; classes → mocked constructors whose instances get mocked methods
- arrays → `[]`; primitives and plain-object leaves → unchanged; getters → `undefined` (v4+ — they do not call the original)
- **`{ spy: true }`** keeps every implementation and wraps it in a spy — assertions on calls, real behaviour. Browser Mode has no other way to observe an export (`dom.md`).

Both forms observe **external** calls only: a function the module calls internally is invoked through the module's own binding, not the mocked namespace (`SKILL.md`, *`vi.mock` runs before your imports*).

## Class mocks (v5 chain)
```ts
class Dog { speak() { return 'bark' } }
const MockedDog = vi.fn(Dog)
const dog = new MockedDog()
dog instanceof Dog        // true    (v4: false)
typeof dog.speak          // 'function' (v4: 'undefined')
```
The mock's `prototype` is chained to the implementation's, so a `vi.fn(Class)` or `vi.spyOn(obj, 'Class')` builds instances that behave like the class. A `mockImplementation` for a constructor is a `function` or a `class` — an arrow gives `<anonymous> is not a constructor`. `mockReset` reverts the chain along with the implementation. Automocked instance methods share state with the prototype method; overriding the prototype reaches every instance unless the instance has its own implementation (v4 migration guide, *Changes to Mocking*).

## Clear, reset, restore — what each touches
| call | history (`mock.calls`, results) | implementation | `vi.spyOn` original |
|---|---|---|---|
| `mockClear` / `vi.clearAllMocks` / `clearMocks: true` (**v5 default**) | cleared | kept | still spied |
| `mockReset` / `vi.resetAllMocks` / `mockReset: true` | cleared | **reset** — to `impl` for `vi.fn(impl)`, to `() => undefined` for `vi.fn()`; "once" queues dropped | still spied, running the original |
| `mockRestore` / `vi.restoreAllMocks` / `restoreMocks: true` | untouched on `vi.fn` | untouched on `vi.fn` | **restored** — descriptor put back, `vi.isMockFunction` false |

`mockRestore` on a `vi.fn()` is `mockReset`. Every one of the three config flags fires *before* each test, so history recorded in a `beforeAll` or at module top level is gone by the time a test asserts on it (v5 migration guide, `clearMocks`). Each flag also carries a warning for `test.concurrent`: one test finishing clears the mocks another test is mid-way through.

## Stubs that outlive the test
`vi.stubEnv` and `vi.stubGlobal` persist until `vi.unstubAllEnvs()` / `vi.unstubAllGlobals()` or the `unstubEnvs` / `unstubGlobals` config flags — reproduced, a value stubbed in one test read back in the next. `import.meta.env.MODE` is `'test'`, `process.env.NODE_ENV` is `'test'`, `process.env.VITEST` is `'true'`; `.env.test` loads through Vite's `mode`.

## Fake timers, precisely
`vi.useFakeTimers()` fakes everything `@sinonjs/fake-timers` can reach **except `nextTick` and `queueMicrotask`** (`fakeTimers.toFake`), plus `Date`, `performance`, `Intl` and `Temporal` when present. Under the default `forks` pool `nextTick` is added to `toNotFake` automatically — faking it hangs `node:child_process`.

- Advance with the **`Async` variants** (`advanceTimersByTimeAsync`, `runAllTimersAsync`, `advanceTimersToNextTimerAsync`) whenever the code under test has an `await` before it schedules — the sync forms run before that microtask.
- `vi.setSystemTime` moves `Date` (and `Temporal`) without touching the timer queue; `vi.getMockedSystemTime()` reads it.
- `shouldAdvanceTime: true` ties fake time to real time — the recipe for anything that polls with `setTimeout` (`dom.md`); explicit advances still jump.
- `vi.runAllTimers()` throws after `fakeTimers.loopLimit` (10 000) iterations — an interval with no clear.
- Fake timers are file-level state: install in `beforeEach`, `vi.useRealTimers()` in `afterEach`.
