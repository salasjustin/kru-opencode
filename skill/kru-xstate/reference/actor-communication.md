# Actor communication, logic creators, testing, and inspection

Disclosed from [`SKILL.md`](../SKILL.md) — reach for this when a machine needs to talk to another actor, wrap something that isn't a machine, or be driven from a test.

## `sendTo`/`sendParent`/`forwardTo`/`stopChild` are action creators, not imperative calls
```ts
actions: ({ context }) => {
  sendTo(context.childRef, { type: 'ping' }); // WRONG — return value discarded, nothing sent
},
```
```ts
actions: sendTo(({ context }) => context.childRef, { type: 'ping' }), // right — placed in `actions:`
```
Reproduced: the bare call inside a custom action function is a **silent no-op** — `sendTo(...)` returns an `ActionFunction` descriptor; calling it and discarding the result never runs it, and nothing throws or warns. The rule is mechanical: `sendTo`/`sendParent`/`forwardTo`/`stopChild`/`raise`/`cancel`/`assign`/`emit`/`enqueueActions`'s own queued calls all have to be the value of `actions:` (directly, or inside `enqueueActions`'s callback via `enqueue.sendTo(...)` etc.) — never called and thrown away inside a plain function action.

## Actor logic creators — which one for which shape
- **`fromPromise(({ input }) => Promise<T>)`** — one-shot async work; the actor's snapshot goes `active` → `done` (`event.output` on the invoke's `onDone`) or `error` (see `SKILL.md`'s unhandled-rejection section — always pair with `onError` or a subscribed root).
- **`fromCallback(({ input, sendBack, receive, self }) => cleanup?)`** — an imperative subscription (event listener, WebSocket, timer). `receive` gets events sent *to* this actor; `sendBack` sends events *to its parent* (not the other way round — a common mix-up). **The function you return is the teardown**, run when the actor stops; a callback actor that opens a subscription and returns nothing leaks it on every stop.
- **`fromObservable(({ input }) => Observable<T>)`** — a stream; each emitted value becomes the actor's `context` (its snapshot shape matches a machine actor's — `.context`, not the raw emitted value at the top level).
- **`fromTransition((state, event, { input }) => state, initialState)`** — a reducer with no statechart, for logic that's genuinely just "event in, next value out" and doesn't need states/guards/`invoke`. Snapshot shape matches a machine actor's (`.context` holds the reducer's state) — reproduced, no shape surprise versus `fromPromise`/machine actors.

## Testing a machine: `waitFor` hangs forever by default
```ts
await waitFor(actor, (snapshot) => snapshot.matches('done')); // no `timeout` option
```
Reproduced: `waitFor`'s `timeout` defaults to **`Infinity`**, not a short default the way `expect.element` or `findBy*` queries do elsewhere on this team (`vitest`/`testing-library` skills) — a predicate that's never satisfied (a typo'd state name, a transition that doesn't fire the way the test assumes) leaves the `await` pending forever rather than failing fast. Always pass `{ timeout: <ms> }` in a test, and prefer the test runner's own timeout as the backstop rather than relying on this one. `toPromise(actor)` is the narrower sibling — it resolves when the actor reaches a **final** state and rejects on error, with no polling predicate to write.

## Watching a running system: `inspect`
```ts
const actor = createActor(machine, {
  inspect: (inspectionEvent) => {
    // inspectionEvent.type: '@xstate.actor' | '@xstate.event' | '@xstate.snapshot'
    //   | '@xstate.transition' | '@xstate.microstep' | '@xstate.action'
  },
});
```
Every actor created in the system (including ones `spawn`ed or `invoke`d deep inside) reports through this one callback — it's the cheapest way to see the actual sequence of transitions and events during development, including the `always`-loop trap in `SKILL.md`: an inspect callback logging every `@xstate.snapshot` for the same actor id, over and over with no incoming event between them, is that loop before it OOMs rather than after.
