---
name: kru-xstate
description: "XState 5 (actor model + statecharts): an invoked promise actor that rejects with no `onError` handler doesn't fail its state — it throws an **uncaught exception on the process** and puts the whole root actor into `status: 'error'`; an `always` transition with no exit condition runs its action in an unbounded microstep loop that grows heap until the process OOMs; an `invoke`d actor is torn down and recreated from scratch every time its state is re-entered, silently losing whatever internal state it accumulated, where a `spawn`ed one (held in `context`) survives; and the docs' own `llms.txt` links to a `v6` doc tree whose quick start says `npm install xstate@alpha`, which breaks the peer range of any `@xstate/react` installed at `latest`. Use when writing or reviewing an XState machine or actor, or a repo with `xstate` in `package.json`. XState 5.x; the React bindings (`useMachine`/`useSelector`) are the sibling `xstate-react` skill, not this one."
---

XState models behavior as an **actor** — something started, sent events, and eventually stopped — and a machine is one kind of actor logic. Every trap below follows from actors being genuinely concurrent and supervised rather than a bag of `useState` hooks bolted together: an actor that errors doesn't return an error value, it **stops** and tells whoever is watching; an actor scoped to a state doesn't pause when you leave, it **stops**; and a transition that produces no visible change can still **run forever**, because nothing about a statechart requires a microstep to be observable to end it.

Reproduced on **`xstate@5.32.6`** (npm `latest`), Node 24, with **`@xstate/react@6.1.0`** (`peerDependencies: { xstate: "^5.28.0" }`). Re-verify after a minor bump — the ecosystem is also mid-migration to a `6.0.0-alpha` line (below).

## An actor's own error is not caught by the machine that has it — it propagates up
```ts
const failing = fromPromise(async () => { throw new Error('boom'); });
const machine = setup({ actors: { failing } }).createMachine({
  initial: 'loading',
  states: { loading: { invoke: { src: 'failing' /* no onError */ } } },
});
const actor = createActor(machine);
actor.start();
```
Reproduced: with no `subscribe({ error })` and no `onError` on the `invoke`, this is an **uncaught exception on the process** — not a promise rejection anyone can `.catch()`, an actual thrown error, the kind that crashes a Node process or shows a red overlay with nothing to click past. `actor.getSnapshot().status` flips to `'error'` in the same microtask, and every observer sees that status before or instead of ever getting the value they subscribed for. This is the normal consequence of the actor model, not a bug: an actor's error is an event to its *parent*, and the root actor's parent is you — the code that called `createActor`. Two independent fixes, do both: give every `invoke` an `onError` (`{ target: 'failed', actions: assign({ error: ({ event }) => event.error }) }`) so the error becomes a transition instead of a crash, and call `actor.subscribe({ error: (err) => { ... } })` on the root actor so a still-uncaught path degrades to a log line instead of an uncaught exception. `fromPromise`'s rejection and `fromCallback`'s thrown error both take this path identically.

## `always` with no way out is not a warning, it's a live OOM
```ts
const machine = setup({}).createMachine({
  context: { count: 0 },
  initial: 'a',
  states: {
    a: { always: { actions: assign({ count: ({ context }) => context.count + 1 }) } },
  },
});
createActor(machine).start();
```
Reproduced: this crashes the process — `FATAL ERROR: Ineffective mark-compacts near heap limit — JavaScript heap out of memory` — because an `always` transition with no `target` re-enters the **same** state, which re-evaluates `always` again, forever, and XState's eventless-transition loop has no built-in step limit. The same failure follows from a guard that's unconditionally true, or a small cycle of `always` transitions between two states with no event in between. This is the one trap on this team's constrained dev machines that can take the whole session down with it, not just the actor — treat every `always` as needing either a `guard` that becomes false or a `target` that leaves the eventless chain, and sanity-check any machine with more than one `always` for a cycle before running it.

## `invoke` is scoped to the state; `spawn` is scoped to `context`
```ts
// re-entering state 'a' recreates the invoked actor from nothing
states: { a: { invoke: { id: 'counter', src: 'counterLogic' } }, b: {} }
```
Reproduced: an `invoke`d actor is stopped when its state exits and a **brand-new instance** is created when the state is entered again — `actor.getSnapshot().children.counter` before leaving `a` and after returning to `a` are not the same reference, and any state the old instance accumulated (a running total in a `fromCallback` closure, a WebSocket connection, an in-flight subscription) is gone with no signal that it happened. `spawn` inverts this: `assign({ ref: ({ spawn }) => spawn('counterLogic', { id: 'counter' }) })` in `context` puts the actor reference in machine context, which persists across **any** transition that doesn't reassign it — the actor keeps running while the machine visits other states, and you `stop`/`stopChild` it explicitly when you're done. Pick `invoke` for "this actor's lifetime is exactly this state" (a fetch that should cancel if the user navigates away) and `spawn` for "this actor outlives the state that created it" (a background poller, a websocket, a per-item actor in a list).

## `assign` actions in one transition see each other's writes, in order
```ts
actions: [
  assign({ count: ({ context }) => context.count + 1 }),
  assign({ count: ({ context }) => context.count + 1 }),
]
```
Reproduced: `count` ends at `2`, not `1` — each `assign` in an `actions` array resolves against the context the **previous** `assign` in that same array just produced, sequentially, not against one shared snapshot taken at the start of the transition. Don't reach for `enqueueActions` to sequence a chain of `assign` calls that already work in order; reach for it when you need to conditionally choose *which* actions to run based on a value an earlier action in the same transition just computed, since a plain `actions` array can't branch on that.

## A crashed actor throws where it's read, not where it crashed
An actor whose `status` becomes `'error'` (previous section) doesn't just stop quietly — `getSnapshot()` and every subscriber's `next` stop firing, and the error surfaces the next time *anything* reads the snapshot through XState's own accessors. In a plain script that's your own `actor.subscribe({ error })` catching it; in a component tree using `@xstate/react`'s `useSelector`/`useActor`/`useMachine`, that "next read" is the next render — see the `xstate-react` skill for the reproduced React-side consequence (it throws **during render**, and needs an Error Boundary, not a `try`/`catch`, to stop it from blanking the tree).

## `setup()` is the whole typed-implementations story now
```ts
const machine = setup({
  types: { context: {} as { count: number }, events: {} as { type: 'inc' } },
  actions: { logIt: () => console.log('hi') },
  guards: { isReady: ({ context }) => context.count > 0 },
  actors: { fetchThing: fromPromise(async () => 42) },
}).createMachine({ /* string names below are strongly typed */
  entry: { type: 'logIt' },
  on: { inc: { guard: 'isReady', actions: assign({ count: ({ context }) => context.count + 1 }) } },
});
```
A machine's `actions`/`guards`/`actors`/`delays` are declared once in `setup()` and referenced by string name in the machine config, which is what makes the string names type-checked against real implementations rather than plain string literals. There is no separate code-generation step and no `.typegen.ts` file to run or go stale — a machine written without `setup()` (bare `createMachine({...})` with string action/guard names and no `.provide()`) still runs, but the names aren't checked against anything, so a typo in an action name fails silently at runtime (nothing calls it) rather than at compile time.

## Consult current docs (official sources first) — and mind the version split
`https://stately.ai/llms.txt` is first-party and indexes both API surfaces at once: `/docs/xstate` teaches the **stable v5 API** (what `npm install xstate` gives you, and what this skill is reproduced against), while the same index links a parallel `/docs/xstate/v6/*` tree — its own quick start's install line is **`npm install xstate@alpha`** (npm dist-tag `alpha`, currently `6.0.0-alpha.x`), not `latest`. **That matters past documentation confusion**: `@xstate/react@6.1.0` (npm `latest`) declares `peerDependencies: { xstate: "^5.28.0" }`, so following the v6 quick start's install command in a repo that also uses `@xstate/react` breaks the peer range outright. Check `xstate`'s installed major in `package.json`/the lockfile before trusting any doc page that starts `npm install xstate@alpha` — Context7 (`/statelyai/docs`, High reputation) carries both trees too and doesn't disambiguate by version any more than the site does. `stately.ai/docs/migration` is the v4→v5 guide if the repo predates `setup()`.

## Recipes
`reference/actor-communication.md` — the actor logic creators (`fromPromise`/`fromCallback`/`fromObservable`/`fromTransition`) and which lifecycle each follows, `sendTo`/`sendParent`/`forwardTo`, stopping actors (`stop` action vs `stopChild` vs the actor's own `.stop()`), `waitFor`/`toPromise` for driving a machine from a test or a script, and the `inspect` option for watching every transition/event during development.

## Not this skill's job
- **`@xstate/react`'s hooks** (`useMachine`/`useSelector`/`useActorRef`/`createActorContext`) — the sibling **`xstate-react`** skill; this one is the actor/machine runtime underneath.
- **`@xstate/store`** — a separate, simpler package (`createStore`/`createAtom`) with no statecharts, no `invoke`/`spawn`, and no actor supervision; none of the traps here (the error-propagation model, `always`-loop risk, `setup()`'s typed implementations) apply to it, and a repo can have either or both.
- **`@statelyai/agent`** and **Stately Studio** — the LLM-agent framework and the hosted visual editor/SaaS are separate products in the same docs tree; this skill covers the open-source `xstate` runtime only.
