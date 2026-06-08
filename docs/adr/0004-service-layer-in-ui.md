# 0004 — Service layer in `@beak/ui`

- **Status:** Proposed
- **Date:** 2026-06-08
- **Deciders:** Alexander Forbes-Reed

## Context

`@beak/ui` has four directories playing the role of "the service":

- `packages/ui/src/lib/beak-project/`, `lib/beak-variable-set/`,
  `lib/beak-workflow/` — legacy service-shaped modules predating the
  `services/` convention. They read/write project files via IPC.
- `packages/ui/src/services/` — the newer service home. Clean shape
  for `flight`, `asset-attachment`, parts of `source-schemas`.
- `packages/ui/src/features/<d>/services/` and
  `packages/ui/src/features/<d>/lib/` — feature-internal services.
  Sometimes used in addition to a sibling under top-level
  `services/` (`features/source-schemas/lib/persist.ts` alongside
  `services/source-schemas/`).
- `packages/ui/src/store/effects/` — Redux listener middleware that
  has accreted service-grade work. `effects/project.ts` is 694 lines.
  `effects/cookies.ts` carries jar-picking heuristics. `effects/git.ts`
  decodes the isomorphic-git status matrix.

Beyond the layer confusion, components routinely bypass all of these:
`features/preferences/EditorPane.tsx` and `GeneralPane.tsx` call
`ipcPreferencesService` directly from `useEffect`;
`features/broken-request/BrokenRequest.tsx` reads/writes files via
`ipcFsService` from a component body. The full anti-pattern
inventory is in [`docs/audit/`](../audit/).

## Decision

### 1. One canonical service home per domain

For each domain `<d>` declared per
[0002](0002-domain-ownership-and-rendering-data-path.md):

- The canonical service lives at
  `packages/ui/src/services/<d>/index.ts`.
- If the service needs more than one file, expand to a folder
  (`services/<d>/{index.ts, types.ts, internal-helper.ts}`);
  `index.ts` is the public surface.
- A feature may add small feature-internal helpers under
  `features/<d>/<helper>.ts` — they are not exported outside the
  feature and they do not duplicate the service's responsibilities.

`lib/beak-project/`, `lib/beak-variable-set/`, `lib/beak-workflow/`
migrate into `services/<d>/`. `lib/` is reserved for cross-domain
runtime utilities (date formatters, the IPC client wrapper itself,
etc.) — not domain logic.

### 2. The service owns the side-effect column

The service is the only renderer-side surface that:

- Calls `ipc*Service` methods.
- Dispatches slice actions in response to side effects.
- Coordinates between two or more slices.
- Holds long-lived state that isn't in Redux (subscriptions,
  in-flight requests, listeners that span multiple components).

Reading state for display is the **selector's** job, accessed via
hooks. Mutating state in response to user intent is the **service's**
job, invoked via hooks.

### 3. Hooks are the only bridge between components and services

For each `services/<d>/`:

- `packages/ui/src/hooks/use<D>.ts` (or
  `features/<d>/hooks/use<D>.ts` if domain-internal) wraps the
  service + selectors into a single hook the component consumes.
- The component imports `use<D>` and nothing else from the domain.
  No direct `useDispatch`, `useSelector` of `<d>` state, or
  `ipc*Service` import.

Pre-existing thin selectors (`useAppSelector(state => state.x)`)
are allowed during migration; new code uses the hook.

### 4. `store/effects/` shrinks to slice-to-service orchestration

`store/effects/<d>.ts` files keep existing, but their remit narrows
to:

- Listen to a slice action.
- Call into a service.
- Optionally dispatch a follow-up action.

Effects do not contain business logic, parsing, debouncing strategy,
or IPC payload construction. Anything more than ~20 lines of
plumbing moves into the service. After migration,
`effects/project.ts` (694 LOC) should be ~30 lines.

Where an effect's only job is "dispatch B when A fires," consider
collapsing it into the service that owns A and removing the effect
entirely.

### 5. Components and direct IPC are mutually exclusive

A component (`.tsx` file under `components/` or
`features/<d>/components/`) must not import `ipc*Service`,
`window.secureBridge.ipc`, or `@beak/runtime-shared`. The Biome rule
for `@beak/ui` is extended to forbid these imports outside
`services/` and `store/effects/`.

### 6. Naming

- File names: `services/<d>/index.ts` exports a single namespace
  object or a flat function set. No `manager`, `provider`, or
  `helper` suffixes — the directory name is the namespace.
- Hooks: `use<D>` or `use<D><Verb>` (`useFlight`, `useFlightStart`).
- Action creators: `<d>Slice.actions.<verb>(...)`; no parallel
  thunk-shaped exports.

## Consequences

- The migration is mechanical for `lib/beak-*` (move to `services/`,
  update imports with `tslsp:rename_file`); harder for
  `store/effects/project.ts` (extract a `services/project/` first,
  then thin the effect).
- Components currently doing IPC fail the new Biome rule. They get
  fixed feature-by-feature; the rule lands the same day with an
  initial allowlist that drains.
- Reviewers gain a fast smell test: "does this PR import
  `ipc*Service` outside `services/`? Reject."
- `services/flight/prepare-request.ts` is the reference design —
  DI-typed, unit-tested, no React dependency.

## Alternatives considered

- **Keep `lib/beak-*` as the canonical home.** Rejected — these
  names encode the package they read from, which is leaky;
  `services/<d>/` encodes the domain, which is what matters.
- **Allow components to call services directly without a hook
  layer.** Considered — would simplify some trivial cases. Rejected
  because the hook is also where selector composition lives; making
  it optional means components reach for `useSelector` too. One
  bridge, not two.
- **Replace Redux entirely with a service-only architecture
  (Zustand, signals).** Out of scope. Redux is doing fine for state
  shape; the problem is what's wrapped around it.
- **Move services to `@beak/state` and re-export from `@beak/ui`.**
  Rejected — services hold React-specific concerns (lifecycle ties
  to windows, IPC listeners that need cleanup at unmount) and
  import `@beak/runtime-shared` in some cases. `@beak/state` must
  stay pure and React-free per its current Biome rule.

## References

- [`docs/audit/`](../audit/) — discovery reports.
- [0002](0002-domain-ownership-and-rendering-data-path.md) — owns
  the data-path direction this ADR fills in.
- [0005](0005-state-slice-convention.md) — what the slice
  underneath looks like.
- `docs/service-extraction-plan.md` — existing plan superseded by
  this ADR and [0002](0002-domain-ownership-and-rendering-data-path.md).
