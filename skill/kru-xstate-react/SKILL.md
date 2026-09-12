---
name: kru-xstate-react
description: "@xstate/react 6 (useMachine/useActor/useSelector/useActorRef/createActorContext): `useMachine(machine, { input })` only ever applies `input` from the render that first mounted it — reproduced, a prop that changes on every later render leaves the machine's context stuck on its first value with no error; defining the machine object inline in the component body gives it a new identity every render, which the hook detects and silently tears down and recreates the actor **every render** (restored from a persisted snapshot, so it doesn't visibly reset — it's still real churn); `useSelector`'s default compare is `===`, so a selector returning a new array/object re-renders the component on **every** emitted snapshot even when the selected value is unchanged (reproduced: 2 unrelated context updates → 2 extra renders with a `[value]`-wrapping selector, 0 with a bare `value` one); and a crashed actor's error surfaces by **throwing during render** the next time anything reads it, which only an Error Boundary — not a `try`/`catch` — stops from blanking the tree. Use when writing or reviewing a React component that calls `useMachine`/`useActor`/`useSelector`/`useActorRef`/`createActorContext`, or a repo with `@xstate/react` in `package.json`. `@xstate/react` 6.x on React 16–19 with `xstate` 5.x — the state-machine core is the sibling `xstate` skill, not this one."
---

`@xstate/react`'s hooks are a thin `useSyncExternalStore` wrapper around an actor that lives **outside** React — the actor doesn't know a component unmounted until an effect tells it to, and a component doesn't know the actor changed until it re-reads the snapshot. Every trap here is a consequence of that seam: a prop the hook only reads once, an object identity check standing in for "did the machine actually change", and a subscription that surfaces failure by throwing on the next read rather than by any React-visible signal at the point it actually failed.

Reproduced on **`@xstate/react@6.1.0`** with **`xstate@5.32.6`** (the pinned peer range: `^5.28.0`) and **`react@19.2.8`**, under jsdom + `react-dom/client`. Re-verify after a minor bump on either package — see the `xstate` skill's version-split note before installing `xstate@alpha` alongside this package.

## `input` is read once, at the actor's creation — not on every render
```jsx
function Labeled({ label }) {
  const [state] = useMachine(machine, { input: { label } });
  return <div>{state.context.label}</div>;
}
```
Reproduced: mounted with `label="first"` then re-rendered with `label="second"` (same `machine` reference both times) — the rendered text stays **`"first"`**. `useMachine`/`useActor` create the actor lazily inside `useState(() => createActor(logic, options))`, so `options` (which carries `input`) is only ever read on that first call; a later render with different `options` doesn't recreate the actor unless the *machine itself* changes identity (next section). This is the same shape as `useForm`'s `defaultValues` in the `react-hook-form` skill — late or changing data needs a different channel, either re-keying the component (`key={label}` forces a fresh mount) or driving the value through an event (`send({ type: 'labelChanged', label })`) instead of through `input`.

## Defining the machine inline gives it a new identity every render — and the hook silently recreates the actor
```jsx
function Widget() {
  const machine = setup({}).createMachine({ /* ... */ }); // new object every render
  const [state, send] = useMachine(machine);
  // ...
}
```
`useIdleActorRef` (what `useMachine`/`useActor`/`useActorRef` share underneath) checks `logic.config !== currentConfig` on every render, and `setup(...).createMachine(...)` called inline produces a new `config` object each time — so this condition is true on **every** render, and the hook stops the old actor and creates a new one from a persisted snapshot (`getPersistedSnapshot`) to make the swap invisible to the state your component reads. Nothing looks broken — the displayed state doesn't jump — but the actor identity churns every render: any code holding onto the actor ref across renders (a `useEffect([actorRef])`, a ref passed to a child that keys off identity) re-runs every render too, and every `invoke`d actor inside the machine is torn down and recreated with it (the `xstate` skill's invoke-vs-spawn section). Define the machine outside the component (the common case — most machines don't need per-instance config) or wrap the `setup(...).createMachine(...)` call in `useMemo` with a stable dependency list when it genuinely needs one.

## `useSelector`'s default compare is `===` — an unstable selector re-renders on every unrelated update
```jsx
const [count] = useSelector(actorRef, (s) => [s.context.count]); // new array every call
```
Reproduced against a machine with two unrelated context fields (`count`, `other`): a selector wrapping the value in a new array re-rendered the component **once per `send`**, including two `send`s that only changed `other` — 1 render at mount, 3 after two unrelated updates. The same selector returning the bare primitive (`(s) => s.context.count`) rendered **once, total** — 0 extra renders for either unrelated update, because `Object.is`/`===` sees the same number both times. `useSelector`'s third argument is a custom `compare` function, and the package exports **`shallowEqual`** for exactly this case: `useSelector(actorRef, (s) => ({ count: s.context.count, name: s.context.name }), shallowEqual)` when the selector has to return an object shape rather than a single field. Prefer a primitive-returning selector first; reach for `shallowEqual` only when the component genuinely needs several fields together.

## A crashed actor throws on the next render that reads it — wrap it in an Error Boundary, not a `try`/`catch`
Reproduced: once an actor's status is `'error'` (the `xstate` skill's unhandled-actor-error section), the internal `getSnapshot` every hook here calls **re-throws that error** the next time React reads it — observed as the error surfacing inside the component during render, caught by the nearest class Error Boundary (`getDerivedStateFromError`) and nowhere else. A `try`/`catch` around the `send` call that triggered the failure does nothing, because the throw doesn't happen at the call site — it happens later, on the read, which is a React render pass and outside any synchronous `try` your event handler could wrap. Any tree that renders `useSelector`/`useActor`/`useMachine` over an actor with a fallible `invoke` needs an Error Boundary above it; without one, a crashed actor blanks the whole tree past the next scheduled render.

## Which hook re-renders your component, and which doesn't
`useActorRef(logic, options)` returns the actor reference and **never re-renders** the calling component on its own — it doesn't subscribe to snapshots at all, so it's the right hook when a component only needs to `send` events or hand the ref to a child. `useMachine`/`useActor` (an alias of each other in this version) and `useSelector` both subscribe and re-render on every value the compare function reports as changed. Reading `state` from `useMachine` and never using it still subscribes the component to every snapshot — if a component only sends events, `useActorRef` is the one that doesn't pay for renders it doesn't need.

## `createActorContext` — the provider prop is `logic`, not `machine`
```jsx
const MachineContext = createActorContext(machine);
// <MachineContext.Provider machine={machine}>   // throws immediately
// <MachineContext.Provider logic={machine}>      // correct
```
Reproduced: passing the old `machine` prop throws `The "machine" prop has been deprecated. Please use "logic" instead.` synchronously — loud, not silent, so it's a fast fix once hit, but it's exactly the prop name every pre-context-API example still teaches. `MachineContext.useSelector`/`.useActorRef` called from a component that isn't inside the matching `.Provider` also throw immediately, naming the provider's `displayName` — neither of this pair silently returns `undefined`.

## Consult current docs
`https://stately.ai/llms.txt` → `/docs/xstate/v6/react/*` is the same doc tree the `xstate` skill flags as ahead of npm `latest` — check `@xstate/react`'s installed major (`package.json`) before trusting a page under that path. Context7 (`/statelyai/docs`) mirrors both trees. The stable-v5-paired docs (what this skill is reproduced against) are at **`/docs/xstate-react`** (no `v6` segment, a sibling path rather than a nested one).
