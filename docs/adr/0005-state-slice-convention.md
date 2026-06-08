# 0005 — State slice convention in `@beak/state`

- **Status:** Proposed
- **Date:** 2026-06-08
- **Deciders:** Alexander Forbes-Reed

## Context

`@beak/state` ships three different slice patterns at once:

1. **`createSlice` + named selectors** — `agent`, `cookies`,
   `flight`, `request-values`, `sockets`. The intended target.
2. **`createReducer` with no selectors** — `extensions`, `git`,
   `preferences`.
3. **`buildXReducer<S>(builder)` composer with no selectors** —
   `project`, `variable-sets`, `workflows`.

Patterns 2 and 3 force `@beak/ui` to know each slice's internal
shape in order to read from it — `useAppSelector(state =>
state.git.commits)` instead of `useAppSelector(selectGitCommits)`.
That makes selector contracts implicit and breaks the abstraction
the slice is supposed to provide.

The audit also found pervasive reducer impurity: `Date.now()`, `new
Date().toISOString()`, and `ksuid.generate()` are called inside
reducer cases across `flight`, `cookies`, `sockets`, `workflows`,
`variable-sets`, `git`. Reducers store `Error` instances
(`flight/`). The `project/reducer.ts` carries the only real
implementation of `rewriteFolderTreePaths` and rename/move logic
inside reducer cases — unreachable from tests without dispatching
through the store.

## Decision

### 1. `createSlice` is the only slice pattern

Every slice in `packages/state/src/<d>/` is built with
`createSlice({...})`. Reducers live as `reducers: {...}`
(synchronous shape updates) and `extraReducers: (builder) => {...}`
(cross-slice listeners and async-thunk handling). No bare
`createReducer`, no hand-rolled `buildXReducer<S>(builder)`
composer.

Migrating `extensions`, `git`, `preferences`, `project`,
`variable-sets`, and `workflows` is mechanical and can run
per-slice.

### 2. Reducers are pure

A reducer case may:

- Read `state` and `action.payload`.
- Update `state` (via Immer-style mutation).
- Throw on invariant violation.

A reducer case may **not**:

- Call `Date.now()`, `new Date()`, `Math.random()`,
  `ksuid.generate()`, or any other non-deterministic function.
- Construct `Error` instances for storage in state.
- Read from `localStorage`, `process.env`, or any side-effecting
  API.
- Call IPC, fetch, or any async function.

Wallclock times, ids, and randomly-generated identifiers are minted
in the action creator (or upstream service) and passed in via
`action.payload`. Errors crossing into state are serialised first
(`{message, code}`) — the boundary that serialises them is the
service.

### 3. Each slice exports named selectors

`packages/state/src/<d>/index.ts` re-exports:

- The reducer (default export, or named).
- The action creators.
- A set of named selectors: `selectActive<X>`, `select<X>By<Y>`, etc.
- The slice's public types (re-export from
  `@beak/common/types/<d>` per
  [0003](0003-schemas-and-ipc-types-home.md); the slice's
  internal `State` shape is **not** exported).

Renderer code (`@beak/ui`) imports selectors by name. Reaching
into `state.<d>.<field>` from the renderer is forbidden by the
same Biome rule extension as
[0002](0002-domain-ownership-and-rendering-data-path.md) §3.

### 4. Pure helpers live alongside the slice

Domain logic that doesn't belong in a reducer (graph walks, layout
math, validation, sparse-merge, rename pipelines) lives in
`packages/state/src/<d>/<helper>.ts` as exported pure functions.
Tests sit next to them as `<helper>.test.ts`.

The 1496-LOC `state/workflows/helpers.ts` god file (audit found it
as the largest single anti-pattern in the package) splits into 6-8
files by concern — graph walks, placement/layout, search,
validation, import/export, identity — each independently testable.

### 5. Effects do not live in `@beak/state`

This package contains no `effects/`, no `thunks/`, no listener
middleware. All async / IPC orchestration lives in `@beak/ui`'s
service layer per [0004](0004-service-layer-in-ui.md). If a slice
needs to react to another slice, that's an `extraReducers` builder
case, not an effect.

### 6. The slice's `State` type is internal

`State` is declared in the slice file and not re-exported. Other
packages reach state only through selectors, which return view-models
typed by what they actually return (not by the raw `State` shape).
That is the abstraction.

## Consequences

- Every reducer that mints an id or stamps a timestamp gains a new
  action-payload field. Action creators (in the service or
  component-facing hook) compute the value once.
- The audit flagged six slices doing this; each is a small, scoped
  PR.
- Pure helpers gain real test coverage. `project/reducer.ts`'s
  rename pipeline becomes a function we can fuzz outside the
  store.
- The renderer's selector imports become symmetric across slices —
  every slice has a `selectFoo` for every field worth reading.
  That produces some boilerplate; we accept it as the cost of the
  abstraction.
- The `tslsp:references` view of "who reads from
  `state.git.commits`" becomes meaningful — there's one selector
  and one set of callers.

## Alternatives considered

- **Leave the three patterns in place; just stop adding new
  `buildXReducer` slices.** Rejected — the renderer-side shape
  leak is the symptom, not the slice pattern itself. We've already
  paid the cost of the leak; we should pay the (smaller) cost of
  migrating.
- **Allow `Date.now()` in reducers if the action is replayed
  identically.** Rejected — the entire point of pure reducers is
  determinism. "Identically replayable" is a property we can't
  enforce by review.
- **Move pure helpers to `@beak/runtime-shared`.** Rejected for
  helpers that are renderer-only; `runtime-shared` is for code
  that runs in either the renderer **or** the host. Most state
  helpers are renderer-only and depend on slice state shape.

## References

- [`docs/audit/`](../audit/) — discovery reports.
- [0002](0002-domain-ownership-and-rendering-data-path.md) —
  domain ownership.
- [0003](0003-schemas-and-ipc-types-home.md) — where the slice's
  imported types come from.
- [0004](0004-service-layer-in-ui.md) — where the work the reducer
  isn't doing actually goes.
