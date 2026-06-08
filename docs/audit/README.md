# Domain audit — discovery material

> Discovery work that motivated ADRs
> [0002](../adr/0002-domain-ownership-and-rendering-data-path.md),
> [0003](../adr/0003-schemas-and-ipc-types-home.md),
> [0004](../adr/0004-service-layer-in-ui.md),
> [0005](../adr/0005-state-slice-convention.md), and
> [0006](../adr/0006-host-ports-and-adapters.md). Reference, not
> load-bearing. Read the ADRs first; come here for the evidence.

## Why this audit happened

Beak has reached the point where the work that lands well in a
single PR — one feature, one author — is starting to be
out-numbered by work that spans the renderer, both hosts, the
state library, and the wire contract simultaneously. The goal is
to get the codebase into a shape where **scoped agents (human or
otherwise) can work in parallel on different domains without
colliding**. That requires clear domain boundaries: each domain
owns a defined set of files across packages, with one-way data
flow between layers (components → hooks → services → state/IPC →
ports → adapters).

The audit catalogued where today's code conforms to that shape and
where it doesn't. The five ADRs prescribe the target shape.

## What's in this directory

The audit produced two kinds of material:

### 1. Cross-package codebase scan (this README)

The synthesis below distils findings from a per-package read of
`packages/state`, `packages/ui`, `apps-host/electron`, and
`apps-host/web` — the four packages the original brief
prioritised. Per-package report files were working notes during
the audit and are not retained; the synthesis here is what
survives.

### 2. Per-feature drive-* reports

Four focused audits applied to the local-agent feature as a
concrete example of the patterns the cross-package scan
identified. They are kept because (a) they prove the architecture
work isn't abstract — every cross-cutting theme below has a
named, file:line example — and (b) they document the gap list for
that one feature's GA-readiness.

- [`drive-feature-local-agent.md`](drive-feature-local-agent.md) —
  35 Gherkin scenarios checked end-to-end against ADR 0001 and the
  `.feature` files. 23 pass / 8 partial / 4 gap.
- [`drive-code-local-agent.md`](drive-code-local-agent.md) — 13
  files audited for single-responsibility, layer fit, naming, and
  anti-patterns.
- [`drive-test-local-agent.md`](drive-test-local-agent.md) —
  coverage gaps prioritised P0 / P1 / P2 across the 11-file
  surface.
- [`drive-security-local-agent.md`](drive-security-local-agent.md)
  — PKCE, HMAC, loopback HTTP, token storage, SSE trust boundary,
  dependency scan. 4 P0 findings.

Hardening for those findings ships through a separate PR on
`chore/harden-local-agent`. This PR is the architectural
prescription, not the feature work.

## The 18 domains

A "domain" is one coherent business concept that flows from on-disk
schema → IPC contract → slice → renderer service → UI → host
adapter. Grouped by how central they are to the product:

### Tier 1 — core product domains

| Domain | Owns |
| --- | --- |
| **Project** | Lifecycle on disk: open / create / rename / save-as / untitled / recents |
| **Filesystem** | Reads/writes under `tree/`, change watching, path sandboxing |
| **Requests** | Request file CRUD, body types, defaults vs sparse overrides |
| **Flight** | Executing requests (HTTP, gRPC, WebSocket), heartbeats, response history |
| **Variables** | Registry + parser + built-in handlers; runtime resolution at flight time |
| **Variable Sets** | Per-set storage of variable values |
| **Workflows** | Node-graph orchestrations of requests |
| **Cookies** | Cookie jars, Set-Cookie capture |
| **Schemas** | On-disk file formats (`_collection.json`, request files, etc.) |
| **Sources** | OpenAPI / GraphQL / gRPC import/export + per-project sync metadata |

### Tier 2 — supporting domains

| Domain | Owns |
| --- | --- |
| **Assets** | Content-addressed binary blob store referenced from requests |
| **Extensions** | Third-party variable runtimes, isolated per project |
| **Encryption** | Per-project secret encryption |
| **Sockets** | WebSocket bridge |
| **Git** | Source control on the project folder |
| **Local Agent** | Optional user-run process for the web shell — proxies CORS-blocked requests |

### Tier 3 — host plumbing (UI-shaped, not business logic)

| Domain | Owns |
| --- | --- |
| **Preferences** | User settings (theme, editor, notifications, environment) |
| **Window** | Electron-only window mappings + dirty state |
| **Dialog / Notification / Explorer / Context Menu** | Native UI affordances — pure host-side IPC plumbing |

## Cross-cutting findings

These themes keep showing up across packages. They are the actual
blockers to "scoped agents working in parallel."

### A — Multiple service-shaped layers in `@beak/ui`

`packages/ui` has **four** places that play the role of "the
service":

| Layer | Today | Should be (ADR [0004](../adr/0004-service-layer-in-ui.md)) |
| --- | --- | --- |
| `lib/beak-project/`, `lib/beak-variable-set/`, `lib/beak-workflow/` | Legacy service-shaped modules predating the `services/` convention | Migrate into `services/` |
| `services/` | New-style services (clean for `flight`, `asset-attachment`) | Keep; canonical home |
| `features/*/services/` and `features/*/lib/` | Feature-internal services. Often used alongside a sibling under top-level `services/` | Pick one home per feature |
| `store/effects/*.ts` | Several files (`project.ts` 694 LOC, `cookies.ts`, `git.ts`) carry service-grade logic | Effects orchestrate slices; services do the work |

This is the single biggest blocker. Agents can't be scoped to
"project" if half the project logic lives in
`store/effects/project.ts` and half lives in `lib/beak-project/`.

### B — Components do IPC

Concrete examples:

- `features/preferences/EditorPane.tsx` and `GeneralPane.tsx` call
  `ipcPreferencesService` directly in `useEffect`;
  `GeneralPane.tsx:34` registers a raw
  `window.secureBridge.ipc.on(...)` listener inline.
- `features/broken-request/components/BrokenRequest.tsx` reads/writes
  via `ipcFsService` directly (lines 90, 137); calls
  `ipcExplorerService.revealFile` (line 190).
- `features/request-pane/GrpcRequestPane.tsx` (670 LOC) mixes IPC +
  state + UI.
- `containers/FolderOverview.tsx`, `containers/RequestOutput.tsx`
  etc. do load-on-mount work in `useEffect` that should be a hook +
  service.

### C — Reducers do work

`Date.now()` / `new Date().toISOString()` / `ksuid.generate()` are
called *inside* reducer cases across `flight`, `cookies`,
`sockets`, `workflows`, `variable-sets`, `git`. The natural ports
(`clock`, `idMinter`) are being pierced from inside the pure layer.

`project/reducer.ts` contains the only real implementation of
`rewriteFolderTreePaths` and rename/move logic — inlined inside
reducer cases, unreachable from tests without dispatching through
the store.

### D — Schemas / types live in three homes

`AssetRef` is the canonical example: declared **four** times.

1. `assets/types.ts` (canonical `assetRefSchema`)
2. `requests/introspection.ts` (hand-written interface with a
   comment justifying the duplication)
3. Inline in `schemas/beak-project.ts` body.file
4. Inline in `schemas/request-values.ts` bodyValue.file

Plus `state/git/index.ts` carries RPC-shaped `GitCommitRequest` /
`GitPushRequest` payloads that should live in
`@beak/common/ipc/git.ts`. `preferences/`, `extensions/` carry
similar IPC-shaped types in state.

**There is no clear answer to "where does the canonical type for X
live?"** Until there is, every refactor will pick whichever copy is
most local and duplicate the rest.

### E — Three slice conventions coexist

`@beak/state` has three patterns:

1. `createSlice` + selectors — `agent`, `cookies`, `flight`,
   `request-values`, `sockets`
2. `createReducer` with **no selectors** — `extensions`, `git`,
   `preferences`
3. `buildXReducer<S>(builder)` composer with **no selectors** —
   `project`, `variable-sets`, `workflows`

Pattern 2 and 3 leak `RootState` shape into `@beak/ui` because the
renderer has to know the slice's internal shape to select from
it. Pattern 1 is the right answer; the others are technical debt.

### F — No port for shared host concepts

Three concrete ports exist and are clean (`AesProvider`,
`CredentialsProvider`, `StorageProvider`) — both hosts subclass
them. They are the model.

Missing ports (covered by ADR
[0006](../adr/0006-host-ports-and-adapters.md)):

| Concept | Today | Why a port |
| --- | --- | --- |
| **ProjectOpener** | `electron/host/project.ts` is Electron-dialog-coupled; web improvises | Same lifecycle, different dialog |
| **ProjectSecrets** | Encryption handlers do the work inline; both hosts re-implement | Shared shape, different backing crypto |
| **ExtensionRuntime** | `ExtensionManager` carries `IpcMainInvokeEvent` directly | Different sender abstraction on web |
| **WindowManager** | Electron-only globals; no web counterpart, but a thin port would let UI gate on it | One side may be a no-op, that's fine |
| **PreferencesStore** | Both hosts re-implement persistence + broadcast | Storage + multicast in one |
| **Dialog** | Electron native dialog vs web `alert()` placeholder | Web needs a real renderer-driven modal |
| **Requester** | Web has a clean port; Electron embeds `@beak/requester-node` directly | Same shape exists, just isn't formalised as cross-host |
| **LocalAgentClient** | Discovery + PKCE + SSE smeared across slice + service + host | One client surface |

### G — Features cross-import unrestricted

No package boundary inside `packages/ui/src/features/*` is enforced.
Real example: `features/json-editor/components/molecules/EntryFolder.tsx:1`
imports `request-pane/contexts/selected-node` — a generic editor
reaching into a specific feature's context. Once we have services,
the Biome `noRestrictedImports` rule should ban
`features/*/components/**` from importing `features/<other>/**`
except via that feature's public API.

### H — `features/` vs `containers/` vs `components/` is only partially meaningful

- `components/` is the **design-system extension layer** — atoms +
  molecules, no domain. Real.
- `containers/` is a **routing/entry layer** — small files mapping
  window/route → which features to render. Real.
- `features/` is everything else.

The "smart-vs-dumb" split that `containers/` *seems* to imply
isn't what's there. The split is genuinely "entry point vs feature
module" — fine, but should be documented and the names probably
revisited.

## How the ADRs respond

| Theme | Addressed by |
| --- | --- |
| A. Multiple service layers | [0004](../adr/0004-service-layer-in-ui.md) — one canonical service home; `store/effects/` is plumbing only |
| B. Components doing IPC | [0004](../adr/0004-service-layer-in-ui.md) §5 — components must not import `ipc*Service`; Biome rule |
| C. Reducers doing work | [0005](../adr/0005-state-slice-convention.md) — pure reducers; ids/timestamps minted in action creators |
| D. Schemas in three homes | [0003](../adr/0003-schemas-and-ipc-types-home.md) — `@beak/common` is the single home; Zod is source of truth |
| E. Three slice patterns | [0005](../adr/0005-state-slice-convention.md) — `createSlice` only; named selectors mandatory |
| F. Missing host ports | [0006](../adr/0006-host-ports-and-adapters.md) — `runtime-shared/src/ports/` + `apps-host/<shell>/src/adapters/` |
| G. Cross-feature imports | [0002](../adr/0002-domain-ownership-and-rendering-data-path.md) §3 — Biome rule on public-API barrels |
| H. `features/`/`containers/` ambiguity | Out of scope for this ADR set — naming clean-up follow-up |

## Sequencing

The audit's recommended order for actually implementing these ADRs:

1. **Single home for types** ([0003](../adr/0003-schemas-and-ipc-types-home.md)).
   Foundational — until types have one home, every other refactor
   has the same problem.
2. **UI service consolidation** ([0004](../adr/0004-service-layer-in-ui.md)).
   `lib/beak-*` → `services/`; pick one home per feature; Biome
   rule landing day 1.
3. **Effects → services migration** ([0004](../adr/0004-service-layer-in-ui.md)
   §4). `store/effects/project.ts` (694 LOC) becomes ~30 lines.
4. **Reducer purification** ([0005](../adr/0005-state-slice-convention.md) §2).
   Mechanical sweep — strip `Date.now()` / ksuid mints out of
   reducer cases.
5. **Slice convention** ([0005](../adr/0005-state-slice-convention.md) §1).
   Migrate `createReducer` / `buildXReducer` slices to
   `createSlice`.
6. **Host ports lift** ([0006](../adr/0006-host-ports-and-adapters.md) §1).
   Rename `providers/` → `ports/`; introduce missing ports in
   priority order.
7. **Per-domain refactors** (parallel, once 1-3 land). Each domain
   moves to the shape ADR [0002](../adr/0002-domain-ownership-and-rendering-data-path.md)
   §1 prescribes.

Step 7 is what the original brief — "scoped agents working in
parallel" — actually enables. Steps 1-6 are the prerequisites.

## What this audit didn't cover

- `apps-web/share`, `apps-web/marketing` — out of scope (the brief
  explicitly excluded the less-important packages).
- `@getbeak/extension-sdk` — the SDK API surface is a separate
  audit.
- Test coverage / quality across the codebase — not asked.
- Performance — not asked.
- The build/bundler architecture (Vite plugin chain, monaco
  patching) — out of scope.
