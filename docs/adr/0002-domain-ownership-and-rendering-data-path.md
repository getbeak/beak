# 0002 — Domain ownership and the rendering data path

- **Status:** Proposed
- **Date:** 2026-06-08
- **Deciders:** Alexander Forbes-Reed

## Context

Beak has ~18 business domains (project, requests, flight, variables,
workflows, cookies, schemas, sources, assets, extensions, encryption,
sockets, git, local-agent, preferences, window, dialog, notification).
Each one is smeared across five or six packages with no agreed
pipeline. Two consequences:

- `@beak/ui` has *four* parallel service-shaped layers — `lib/beak-*`
  (legacy), `services/` (new), `features/<d>/services/` (per-feature),
  and `store/effects/` (Redux listener middleware that has accreted
  service-grade work; `effects/project.ts` is 694 lines).
- A "domain" is not a unit anyone can hand to one engineer (or one
  agent) without producing merge conflicts in the other domains.

We want a sentence that says "the requests domain is files X, Y, Z
across these packages, layered like this" and have it be true for
every domain. Until that sentence exists, scoped parallel work
isn't viable.

The audit reports in [`docs/audit/`](../audit/) catalogue the
specific anti-patterns this ADR addresses — components calling IPC
directly, useEffect chains doing service work, cross-feature reaches
into internals, etc.

## Decision

### 1. A domain is the slice that runs end-to-end across packages

For each domain `<d>`, exactly these directories belong to it:

| Layer | Path |
| --- | --- |
| IPC contract + on-disk types | `packages/common/src/ipc/<d>.ts` and `packages/common/src/types/<d>.ts` |
| State + pure helpers | `packages/state/src/<d>/` |
| Renderer service | `packages/ui/src/services/<d>/` |
| Feature UI | `packages/ui/src/features/<d>/` |
| Host port | `packages/runtime-shared/src/ports/<d>.ts` (if the domain crosses the IPC boundary) |
| Host adapters | `apps-host/electron/src/adapters/<d>.ts` and `apps-host/web/src/adapters/<d>.ts` |

A domain owns those paths and nothing else. Tier-3 host plumbing
(dialog, window, context menu, notification, explorer) follows the
same shape but the upper renderer/state layers are usually empty.

### 2. The rendering data path is one-way

```
component  →  hook  →  service  →  slice + IPC  →  port  →  adapter
```

- A **component** consumes hooks. It does not call `useDispatch`,
  `useSelector`, or `ipc*Service` directly.
- A **hook** composes one or more selectors with a service. It does
  not contain business logic or `useEffect` chains that mutate state
  in response to other state.
- A **service** owns IPC calls, side-effects, slice dispatch, and
  cross-slice orchestration. It is the only renderer-side surface
  that talks to host adapters via IPC.
- A **slice** is pure state shape + selectors + pure helpers. See
  [0005](0005-state-slice-convention.md).
- A **port** is a host-side interface in `@beak/runtime-shared`. See
  [0006](0006-host-ports-and-adapters.md).
- An **adapter** is the concrete per-shell implementation.

Reads flow up the same chain: selectors → hook → component.

### 3. Cross-domain references go through the public API

Each domain exposes a `packages/ui/src/services/<d>/index.ts` and a
`packages/state/src/<d>/index.ts`. Imports from outside the domain
must hit one of those barrels. Reaching into
`features/<other>/components/...` or `state/<other>/internal/...` is a
build error.

This is enforced by extending the Biome `noRestrictedImports` rule
that already polices the package layering (`biome.json`) to also
police feature-to-feature imports inside `packages/ui/`. The
component-level half of this rule lands as part of
[0004](0004-service-layer-in-ui.md) §5.

### 4. New domains: one ADR, one feature file

Adding a domain — or splitting an existing one — is itself an ADR.
That ADR lists which of the six paths in §1 are new and what's in
them. Renaming a directory inside a domain is not.

## Consequences

- Every existing leak documented in [`docs/audit/`](../audit/)
  becomes a tractable fix scoped to one domain. Agents driving
  features, code, tests, and security can be parallelised by domain
  without colliding.
- The Biome rule shipping with [0004](0004-service-layer-in-ui.md)
  produces a wave of pre-existing violations; we accept them as the
  migration backlog rather than rewriting in one big bang.
- Feature-internal helper directories with no public API (e.g. a
  `lib/` folder inside a feature) are still allowed; they're
  invisible to the rest of the app.
- "Three folders for one concept" cases — `state/{request-values,
  value-parts, entry-map}`, `features/{variables-editor,
  variables-sets, variable-sets}` — must consolidate into one domain
  before this rule can be applied to them.

## Alternatives considered

- **Layered packages** (one package per layer: `@beak/services`,
  `@beak/hooks`, etc.). Rejected — Beak already has ~17 workspaces;
  doubling that for layering would slow installs and confuse
  imports. Layering inside packages, by convention, is what we
  already have capacity to enforce.
- **Vertical-slice features with no shared services layer.**
  Rejected — flight, variables, and project legitimately cross every
  feature. A shared service layer per domain is unavoidable; the
  question was only where it lives.
- **Free-form (status quo).** Rejected — it's what we have now and
  the audit catalogued the cost.

## References

- [`docs/audit/`](../audit/) — discovery reports that motivate this
  ADR set.
- [0003](0003-schemas-and-ipc-types-home.md) — where canonical types
  live.
- [0004](0004-service-layer-in-ui.md) — what a service looks like.
- [0005](0005-state-slice-convention.md) — what a slice looks like.
- [0006](0006-host-ports-and-adapters.md) — what a port looks like.
