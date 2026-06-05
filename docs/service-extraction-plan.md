# Service-extraction refactor — plan

## Goal

Move business logic out of components and ad-hoc `utils/` files into
**domain-aligned services**. After the refactor, components should be
glue: read state, render, dispatch — no IPC, no multi-step
orchestration, no validation chains, no async control flow. Same goal
applies on the host side: handlers should validate, delegate to a
shared `Runtime.*` method, and return — not re-implement business
logic each side of the IPC.

The pattern already exists in the codebase, it's just not used uniformly.
This document is the plan to make it uniform.

## What "service" means here

A service is a function (or small module) that owns a slice of domain
logic, with three properties:

1. **Pure-ish core, injected IO.** The gold-standard example is
   `packages/ui/src/services/flight/prepare-request.ts`: takes a
   `PrepareRequestDeps` interface, every IPC / variable-resolution call
   comes in through that injected struct. The function is unit-testable
   without a renderer or saga.

2. **Domain-aligned location.** Project loading → `services/project/`,
   flight prep → `services/flight/`. New renderer services land at
   `packages/ui/src/services/<domain>/`. If the logic is provider-shaped
   (IPC vs in-memory differ across hosts), the service lives under
   `@beak/runtime-shared` instead (see `Runtime.openapi.syncToFolder`).

3. **Returns Results, not throws.** `ProjectLoaderService.loadProject`
   returns `{ kind: 'ok', value } | { kind: 'error', error: Squawk }`.
   Caller branches on the discriminator. No try/catch sprinkled across
   components.

A service is *not*:
- a hook (those are renderer glue),
- a redux effect (those are dispatch routers),
- a `utils/` file holding stateless string helpers (those stay).

## Why now

The Chakra-v3 migration + state-slice reshuffle landed UIs that embed
several hundred lines of orchestration inline. Three audit passes (see
appendices) found:

- **15 components / effects** with multi-step async + IPC chains. The
  worst single file is `SourceSchemasPane.tsx` (948 LOC, 4 concerns in
  one async function); the heaviest effect is `store/effects/project.ts`
  (891 LOC, disk-mode/memory-mode/write-debounce all mingled).
- **10 cross-cutting data-transformation clusters** where the same
  value-parts / entry-map / body-type logic is duplicated across 5–25
  files each. One literal predicate (`parts.every(p => typeof p === 'string' && p.length === 0)`)
  appears verbatim in 8 files including one I wrote ten minutes before
  the audit.
- **12 host duplications** between `apps-host/electron/` and `apps-host/web/`.
  The extension manager registry is ~250 LOC of parallel implementation;
  every FS handler (×26) opens with the same `ensureWithinProject(...)`
  prologue; git handlers (×34 per host) each carry an identical
  `withProjectDir(payload)` line.

The cost is in change-coupling: testing `GrpcRequestPane` today means
mounting the component because descriptor resolution sits inside a
`useEffect`. Touching the value-parts emptiness rule means editing 8
files. Adjusting the project-folder lookup means editing 20 handlers
across two hosts.

## Criteria for "needs extracting"

A file qualifies when it hits ≥ 2 of:

1. **Direct IPC call inside a component.** 11 component files import
   `ipcFsService` / `ipcDialogService` / `ipcOpenApiService` /
   `ipcGrpcService` / `ipcAssetsService` / `ipcHttpService` directly.
2. **Multi-step async orchestration in JSX-bearing code.** A `useEffect`
   or click handler with ≥ 2 awaited IO calls chained.
3. **Domain validation outside the schema layer.** Components inferring
   "is this required?" or "what's the right Content-Type?" — that's
   domain logic, belongs in the source-of-truth module.
4. **Cross-file duplication.** `summarizeMissingRequired` in `Header.tsx`
   and `Modifiers.tsx`; `isValueEmpty` × 5 variants across 3 files.
5. **>300 LOC with async control flow.** Hard cutoff.

Host-side qualifiers (same spirit, different shape):
- **Logic duplicated across electron + web.** A handler-pair where the
  business work is identical and only the FS/exec leaves differ →
  belongs in `Runtime.*`.
- **Boilerplate prologue.** 13/26/34 handlers all opening with the same
  3-line preamble → middleware/wrapper.

## Pattern to copy

```ts
// packages/ui/src/services/<domain>/<thing>.ts

export interface FooServiceDeps {
  readSidecar: (path: string) => Promise<unknown>;
  writeSidecar: (path: string, data: unknown) => Promise<void>;
  // ...IO-shaped fields only
}

export type FooResult = { kind: 'ok'; value: FooValue } | { kind: 'error'; error: Squawk };

export async function doFoo(input: FooInput, deps: FooServiceDeps): Promise<FooResult> {
  // pure-ish core; no `import { ipcFsService }` here
}

// Mirror tests in `services/<domain>/__tests__/<thing>.test.ts` with
// a hand-rolled `deps` object — no MSW, no Redux store, no mount.
```

The caller (effect or component) builds `deps` once and hands it to the
service. Effects continue to be dispatch routers; services do the work.

For the host side, the analog is `Runtime.<domain>.<method>` in
`@beak/runtime-shared`: both hosts call the same method, providing
their FS / executor through `Runtime.p.*`.

## Status (as of 2026-05-17)

| Stream | Completion |
|---|---|
| Stream B (cross-cutting primitives) | **10/10 — done.** All clusters landed. |
| Stream A (per-feature) | **5/5 — done.** Wave 1 (schema-source), Wave 2 (Header URL handler, missing-required service, gRPC descriptor resolver, FileUploadView preview chain, OpenApiSyncBanner read-validate), Wave 3 (workflows override-merge + folder-overview stats), Wave 4 (effects/project tree-events helpers extracted — 200 LOC out of 891; main file now 700 LOC), Wave 5 (sweep complete — remaining components have single-IPC-call event handlers that don't qualify per the criteria). |
| Stream C (host duplication) | **7/8.** Done: C1 (extensions disk-scan + manifest manager), C2 (OpenAPI target-folder validation), C3 (ensureWithinProject), C5 (Git handler factory), C6-partial (ProjectExtensionRegistry — both managers now share the per-project record store + lifecycle: `resetProject`, `unload`, `list`, `insert`, `byPackage`), C7 (HTTP fetch helpers), C8 (naming alignment). **Deferred**: C4 (project-context middleware — largely subsumed by C3), full C6 ManagerBase with Executor strategy abstraction across isolated-vm vs Workers (deserves a dedicated PR). |

## Phasing — three parallel streams

The full refactor is months of grinding. Three streams can move
independently, with Stream B unblocking Stream A.

### Stream A — Top-down by feature (renderer components & effects)

The original phasing. Walks the offender table in Appendix A from
smallest to biggest blast radius.

**Wave 1 — schema-source domain** (just touched, smallest)
- Lift `runDiscover` / `runOpenApiSync` / `confirmDelete` out of
  `SourceSchemasPane.tsx` into `services/source-schemas/`.
- Lift validate-then-persist out of `SourceSchemaDialog.tsx`.
- Done when: both files < 600 LOC, no `async function` outside event
  handlers.

**Wave 2 — request pane**
- `services/request/url-parsing.ts` — `handleUrlChange`, query-string
  extraction, socket-URL detection. (Uses Stream B7.)
- `services/request/missing-required.ts` — single `summarizeMissingRequired`
  used by Header + Modifiers + PreFlightWarningDialog. (Uses Stream B1, B2.)
- `services/grpc/descriptor-resolver.ts` — descriptor read + message-name
  resolution (`GrpcRequestPane.tsx:67–135`).
- `services/grpc/invoke.ts` — the call chain currently inline at lines
  137–162.
- Done when: `Header.tsx` < 350 LOC, `GrpcRequestPane.tsx` < 400 LOC.

**Wave 3 — workflows + folder-overview**
- `services/workflows/node-properties.ts` — property-row derivation,
  shape-based form generation (`NodePropertiesPanel.tsx`, 950).
- `services/folder-overview/stats.ts` — folder traversal + stats
  aggregation (`FolderOverview.tsx`, 576). Uses Stream B8.

**Wave 4 — effects split**
- `effects/project/disk-mode.ts` — disk-mode create/rename/move/delete.
- `effects/project/memory-mode.ts` — in-memory mirror.
- `effects/project/write-debouncer.ts` — the 500ms request-write debounce.
- `effects/project/index.ts` re-exports.
- Splits the 891-LOC `effects/project.ts`.

**Wave 5 — leftover IPC-in-component callsites**
- Sweep the remaining 11 components that import IPC services directly
  (`features/preferences/`, `features/extension/`, `features/broken-request/`,
  etc). Small services per domain.

### Stream B — Cross-cutting domain primitives (data-transformation)

These cut across waves and most of them unblock Stream A. Order roughly
by leverage — see Appendix B for full evidence.

| # | Service | Replaces | Unblocks |
|---|---|---|---|
| B1 | `value-parts` (`isEmpty`, `flatten`, `walk`, `splitOn`, `substitute`) | 8 duplicate emptiness predicates; 5 `isValueEmpty` variants; my own `substitutePathParameters` in `utils/uri.ts` | A2, A1 |
| B2 | `entry-map` (`findRoot`, `findChildren`, `walkEnabled`, `countRequired`, plus `convertToEntryJson`/`convertToRealJson`) | 15+ ad-hoc tree walks; the root-finding bug where some callers forget the enabled-check | A2, A3 |
| B3 | `body-type-transitions` (pure state-machine module under `@beak/state/requests/`) | The 310-line `use-change-body-type.ts`; 25+ `body.type === ...` switches scattered through the request pane | A2 |
| B4 | `provenance` (`isLinked`, `unlinkRequest`, `stripProvenance`) | 7 duplicate `_provenance.linked === true` checks; hardcoded unlink rule in `request.ts` and the host writer | A1, A4 |
| B5 | (mostly already good — `useVariableContext` is the canonical hook). Audit confirms call sites use it; add a `makeVariableContext(state, requestId)` for saga/test code so the shape lives in one place. | inline context construction in `flight.ts` effect + a test util that duplicates the shape | — |
| B6 | `assets/resolve` (`resolveAssetRef → fileReferenceId` fallback) | 3-way duplication in `prepare-request.ts` / `FileUploadView.tsx` / `RequestOutput.tsx` / `binary.ts` | A2 |
| B7 | `url` service (`extractQueryFromUrl`, `substituteParts`, `convertRequestToUrl`) | `Header.tsx`'s `handleUrlChange`; my `substitutePathParameters`; `convertRequestToUrl` itself | A2 |
| B8 | `project-tree` (`findFolderByPath`, `findDescendants`, `getParentChain`, `filterByType`) | 8+ hand-rolled `Object.values(tree).filter(...)` walks | A3 |
| B9 | `projects/untitled` (`isUntitled`, `promoteUntitled`) | Scattered flag checks + the rename round-trip in `request.ts` and tab effects | — |
| B10 | `ksuid-prefixes` registry (typed constants + `generateId(kind)`) | ~20 hardcoded prefix string literals; catches typos at compile time | — |

### Stream C — Host duplication → `@beak/runtime-shared`

The host audit (Appendix C) is the missing third leg. Goal: every
business-logic line lives once in `@beak/runtime-shared`; the IPC
handlers in `apps-host/electron/` and `apps-host/web/` shrink to
"validate, delegate, return".

| # | Extract | Wins |
|---|---|---|
| C1 | `Runtime.extensions.scanInstalledOnDisk` + `Runtime.extensions.manifest.*` | Removes ~100 LOC duplicate disk-scanner + ~60 LOC manifest-manager from both hosts |
| C2 | `Runtime.openapi.resolveTargetFolder` (path validation + sandboxing) | Aligns electron's `path.sep` and web's hardcoded `/` checks; one safety surface |
| C3 | `Runtime.fs.ensureWithinProject` | Used by 26+ handlers across both hosts; today diverges in safety guarantees |
| C4 | IPC middleware that resolves project-context once per call | 50+ handler-prologue instances become a typed second argument |
| C5 | Git handler factory (auto-applies `withProjectDir`) | Collapses 34 × 2 boilerplate registrations per host |
| C6 | `Runtime.extensions.ManagerBase` + `ExecutorInterface` (isolate vs worker) | ~250 LOC of parallel manager plumbing → one |
| C7 | `Runtime.http.fetchText` (shared parseUrl + fetch; electron keeps its `readCapped` wrapper) | ~50 LOC of byte-identical url+fetch code |
| C8 | Rename `electron/.../extension-service.ts` → `extensions-service.ts`; align `electron/.../host/extensions/` → `lib/extensions/` to mirror web | Cosmetic but removes asymmetry that breaks cross-host pattern-matching |

## Cross-stream sequencing

- **Stream B is highest leverage and lowest risk.** Most extractions
  are small, well-bounded pure modules that components opt into one
  call-site at a time. Land B1, B7, B8 first — they unblock Stream A.
- **Stream A consumes Stream B.** Don't extract `services/request/url-parsing.ts`
  while `Header.tsx` and `convertRequestToUrl` still hand-roll URL
  parsing in three different ways — fix B7 first, then A2 becomes a
  thin wrapper.
- **Stream C is independent.** Host work doesn't block renderer work
  and vice versa. Sequence C internally by leverage: C1 → C2 → C3 →
  C4 → rest.

## Out of scope

- Renaming `utils/` to `services/`. Stateless helpers (string utils,
  array sort comparators) stay as utils — that's not what this is.
- Moving anything into `@beak/common`. That package is for cross-process
  types + IPC schemas; it explicitly can't import `@beak/ui` or
  `@beak/state`. Services live in the renderer or `@beak/runtime-shared`.
- Adding a DI framework. The deps-as-interface pattern is enough; we're
  not introducing inversify or anything like it.

## Success metric

When the next "tweak this dialog" task lands, the diff doesn't touch
both the component and a service file — only the service file, with
unit tests, and the component change is a single import or none. For
host changes: edit one `Runtime.<domain>.<method>` and neither
`apps-host/electron/` nor `apps-host/web/` needs touching.

---

# Appendices

The three audits below are the working offender lists. They are
date-stamped at the top because some entries (LOC, line numbers) will
drift as files change. Re-run the audits at the start of each wave to
refresh them.

## Appendix A — Component & effect offenders

Audit run 2026-05-16. Scope: `packages/ui/src/features/**` and
`packages/ui/src/store/effects/**`. 311 files scanned, 15 flagged.

### Schema sources

| File | LOC | Signals | What moves |
|---|---:|---|---|
| `features/source-schemas/components/SourceSchemasPane.tsx` | 948 | 1, 2, 5 | `runDiscover` (172–218): IPC + persist + alert + dialog-state; `runOpenApiSync` (239–269); `openInvokeDialog` (137–151) |
| `features/source-schemas/components/GrpcInvokeDialog.tsx` | 357 | 1, 2 | `invoke` (76–95); service/method filtering (47–69) |
| `features/project-home/lib/sync-from-url.ts` | 76 | 1, 2 | Chains URL validation → HTTP fetch → spec parse → IPC sync (27–69); IPC behind a deps interface like `prepareRequest` |
| `features/openapi-import/import-action.ts` | 70 | 1, 2 | parseSpecSource → looksLikeOpenApi3 → `ipcOpenApiService.syncFromSpec` (28–52) |

### Request pane

| File | LOC | Signals | What moves |
|---|---:|---|---|
| `features/request-pane/components/GrpcRequestPane.tsx` | 688 | 1, 2, 5 | `useEffect` lines 67–135: read collection → validate → load descriptor sidecar → resolve message names. → `services/grpc/resolve-descriptor.ts` |
| `features/request-pane/components/molecules/RequestOutput.tsx` | 225 | 1, 2 | `createSplitHttpOutput` (101–192): URL convert + header/query/body flatten + content-type infer + Monaco language pick. Belongs alongside `prepareRequest` |
| `features/request-pane/components/molecules/FileUploadView.tsx` | 346 | 1, 2 | Preview-open chain (27–60); drop → attachFile → dispatch chain (121–145) |
| `features/request-pane/components/organisms/Header.tsx` | 510 | 1, 2 | `handleUrlChange` (172–205): URL parse + query auto-extract + sidebar-tab flip; `summarizeMissingRequired` (60–105): body-shape walking |

### Welcome / onboarding

| File | LOC | Signals | What moves |
|---|---:|---|---|
| `features/welcome/components/molecules/RecentsList.tsx` | 379 | 1, 2 | `commit` rename (130–145): `renameProjectAtPath` → conditional callback |

### Store effects (acting as orchestrators)

| File | LOC | Signals | What moves |
|---|---:|---|---|
| `store/effects/flight.ts` | 345 | 2 | `notifyOutcome` (241–288): preference derivation + notification routing — domain logic, not effect glue. `buildPrepareDeps` (76–93) is **good** — keep |
| `store/effects/cookies.ts` | 277 | 2 | `persistNow` (56–75); `projectOpened` (98–150): path-exists → read → decrypt → validate → hydrate |
| `store/effects/project.ts` | 891 | 2, 5 | Kitchen-sink — see Stream A Wave 4 split |
| `store/effects/variable-sets.ts` | 306 | 2 | Same shape as cookies: read → parse → decrypt → hydrate across multiple handlers |
| `store/effects/git.ts` | 340 | 2 | Watcher setup + initial import (45–83); init → current-branch → list-remotes → dispatch chain (87–111) |

### Low-priority single-signal hits (phase 5 sweep)

`FixProjectEncryption.tsx`, `GeneralPane.tsx`, `ExtensionsPane.tsx`,
`ProjectPane.tsx` — import IPC but only single-call delegations from
event handlers. Wave 5.

## Appendix B — Data-transformation & domain-knowledge clusters

Audit run 2026-05-16. Scope: `packages/ui/src/**`, `packages/state/src/**`,
`packages/runtime-shared/src/**`, `packages/common/src/**`. 10 clusters.

### B1 — Value-parts emptiness checks and walkers

**Evidence**: `parts.every(p => typeof p === 'string' && p.length === 0)`
duplicated verbatim in:
- `features/json-editor/components/molecules/EntryPrimary.tsx:169`
- `features/json-editor/components/molecules/EntryRow.tsx:39`
- `features/request-pane/components/organisms/PathParameters.tsx:44`
- `features/request-pane/components/organisms/Header.tsx:40, 48`
- `features/request-pane/components/organisms/Modifiers.tsx:29, 42`
- `features/basic-table-editor/components/BasicTableEditor.tsx:42`

Plus 5 near-identical predicates: `isValueEmpty`, `isScalarEmpty`,
`isToggleValueEmpty`, `isJsonEntryEmpty`, `isJsonEntryValueEmpty`.
`Modifiers.tsx` line 23 literally says "Mirror of `isValueEmpty` from
BasicTableEditor". `VariableCard.tsx:427` uses a different rule
(`parts.length === 1 && parts[0] === ''`) — likely a bug.

**Suggested home**: `@beak/state/value-parts/` exporting `isEmpty`,
`flatten`, `walk`, `splitOn`, `substitute`. Blast radius: medium.

### B2 — Entry-map (JSON editor rows) ↔ JSON + tree-walking

**Evidence**:
- `features/json-editor/parsers.ts:10–16, 31, 37` — canonical `convertToRealJson`
- `features/json-editor/.../JsonArrayEntry.tsx`, `JsonObjectEntry.tsx`,
  `JsonEditor.tsx` — duplicate child-finding patterns
- `Header.tsx:86–99` + `Modifiers.tsx:45–63` — duplicate body-type-specific
  required-field counters
- `RequestOutput.tsx` — inline entry-map iteration for display
- `Object.values(...).filter(e => e.enabled !== false)` appears ~15 times
- `JsonEditor.tsx` `find(e => e.parentId === null)` — **missing the
  enabled-check, latent bug**

**Suggested home**: `@beak/state/schemas/entry-map` with `findRoot`,
`findChildren`, `walkEnabled`, `countRequired`. Blast radius: large
(15+ files), but single source of truth.

### B3 — Body-type-change state machine

**Evidence**:
- `features/request-pane/use-change-body-type.ts:26–309` — 310 lines of
  `if (oldType === X && newType === Y)` branches
- `BodyTab.tsx` (~15 switch branches), `RequestOutput.tsx` (~10), `Modifiers.tsx:45–63`,
  `Header.tsx:85–99`, `prepare-request.ts:120–181` (~8 branches)
- 50+ touches of `info.body.type` across the codebase
- `requestBodyContentType` in `@beak/common/helpers/request` is **already
  good** — content-type inference is centralised

**Suggested home**: `@beak/state/requests/body-type-transitions` —
pure module: `transitionBody(oldBody, newType, schemaSeed?): RequestBody`.
Hook becomes thin wrapper. Enables future migration scripts + undo/redo.
Blast radius: large.

### B4 — Provenance / linked-rule duplication

**Evidence**:
- `@beak/state/schemas/collection-merge.ts` — canonical merge/diff (good)
- `lib/beak-project/request.ts:123–140` — `ensureRuntimeShape` second
  backfill layer
- `lib/beak-project/request.ts:204` — hardcoded `_provenance.linked: false`
  on unlink
- `store/effects/project.ts:1118` — `_provenance.linked === true` check
- `RequestTab.tsx:65`, `NodeName.tsx:30` — duplicate linked checks
- `runtime-shared/openapi-writer.ts:88–92` — host-side linked-check

**Suggested home**: `@beak/state/requests/provenance` with `isLinked`,
`unlinkRequest`, `stripProvenance`. Blast radius: medium (7 files,
high correctness impact).

### B5 — Variable context construction

**Evidence**:
- `useVariableContext` is canonical, well-memoised (good)
- 12 callers including `Header`, `RequestOutput`, `GraphQlQueryEditor`,
  `VariableInput`, `VariableSelector`, `use-change-body-type`
- `store/effects/flight.ts` rebuilds it from selectors **without** the hook
- `prepare-request.test.ts`'s `makeContext()` duplicates the shape

**Action**: add `makeVariableContext(state, requestId)` for non-React
callers (sagas + tests) so the shape lives in one place. Blast radius:
small.

### B6 — Asset-resolution fallback

**Evidence**: "prefer `assetRef`, fall back to `fileReferenceId`" rule
in 3+ places:
- `services/flight/prepare-request.ts:140–170` (file body flattening)
- `features/request-pane/components/molecules/FileUploadView.tsx:226–235`
- `features/variables/binary.ts:22–36`
- `features/request-pane/components/molecules/RequestOutput.tsx:270–280`
  — **reads `fileReferenceId` only, no assetRef path**, divergence

**Suggested home**: `@beak/ui/services/assets/resolve` exporting
`resolveAsset(payload): Promise<AssetResolveResult>`. Inject into
prepare-request deps. Blast radius: small (3–4 files, high correctness).

### B7 — URL parsing surfaces

**Evidence**: three URL-touching surfaces, none aware of each other:
- `features/request-pane/components/organisms/Header.tsx:173–206` —
  `handleUrlChange` parses query, flips sidebar tab, dispatches rows
- `utils/uri.ts:58–90` — `convertRequestToUrl` (flight prep)
- `utils/uri.ts:20–56` — `substitutePathParameters` (path-param splice)

**Suggested home**: `@beak/ui/services/url/` with `extractQueryFromUrl`,
`substituteParts`, `convertRequestToUrl`. Blast radius: small-to-medium
(5 files).

### B8 — Tree-walking and folder lookups

**Evidence**: hand-rolled `Object.values(tree).filter(...)` in:
- `SourceSchemasPane.tsx:195` — folder-by-path lookup
- `FolderOverview.tsx:42–44` — folder enumeration
- `source-schemas/hooks/use-source-schemas.ts` — folder filter
- `render-request-select-options.tsx:8–14` — DFS folder walk
- `NotTheTabYourLookingFor.tsx:32` — type-filtered list
- `workflows/NodePropertiesPanel.tsx:81` — type-filtered list

**Suggested home**: `@beak/ui/services/project-tree/` with
`findFolderByPath`, `findDescendants`, `getParentChain`, `filterByType`.
Blast radius: medium (8+ files).

### B9 — Untitled-project promotion

**Evidence**: scattered flag checks in `project-home/` + `openapi-import/`;
no central `isUntitled` predicate; rename round-trip duplicated in
`request.ts` and tab effects.

**Suggested home**: `@beak/state/projects/untitled` with `isUntitled`,
`promoteUntitled`. Blast radius: small.

### B10 — KSUID prefix registry

**Evidence**: prefixes used as bare string literals in ~20 sites:
`'request'`, `'flight'`, `'query'`, `'header'`, `'project'`, `'socket'`,
`'binstore'`, `'failedrequest'`, `'alert'`, `'edge'`, `'ctxmenu'`,
`'workflow'`, `'urlencodeditem'`, `'prvval'`, `'fswatch'`, `'node'`,
`'item'`, `'set'`, `'test'`. No central registry.

**Suggested home**: `@beak/ksuid` exports a typed `KSUID_PREFIXES` const
and `generateId(kind: KsuidKind)`. Blast radius: trivial.

## Appendix C — Host-apps duplication and boilerplate

Audit run 2026-05-16. Scope: `apps-host/electron/src/**`,
`apps-host/web/src/**`, `packages/runtime-shared/src/**`,
`packages/common/src/ipc/**`. 12 findings.

### Cross-host business-logic duplication

| # | Files | LOC | Extract to |
|---|---|---:|---|
| C1a | `electron/.../extension-service.ts:202–244` ↔ `web/.../extensions-service.ts:169–204` — `listInstalledOnDisk` byte-for-byte twin | ~100 | `Runtime.extensions.scanInstalledOnDisk(fs, nodeModulesDir)` |
| C1b | Same two files: `ensureExtensionsScaffold`, `updateManifestEntry`, `removeManifestEntry` (265–302 / 226–291) | ~60 | `Runtime.extensions.manifest.*` |
| C2 | `electron/.../openapi-service.ts:12–25` ↔ `web/.../openapi-service.ts:10–22` — target-folder path validation + sandboxing (electron uses `path.sep`, web hardcodes `/`) | small but correctness | `Runtime.openapi.resolveTargetFolder` |
| C7 | Both `http-service.ts` files — identical `parseUrl()`, identical fetch core (electron adds 16MB `readCapped`, web uses `res.text()`) | ~50 | `Runtime.http.fetchText` (electron keeps its `readCapped` wrapper) |
| C10 | `electron/.../lib/extension/index.ts` (487) ↔ `web/.../lib/extension/manager.ts` (200+) — same registry shape, same 8 variable methods, same 6 lifecycle methods. Bootstrap script (electron 72–162) ↔ worker source (web) — both validate definition, wrap context, expose handles | ~250 of manager plumbing | `Runtime.extensions.ManagerBase` + `ExecutorInterface` (isolate vs worker) |

### Registration boilerplate

| # | Pattern | Count |
|---|---|---|
| C4 | `ensureWithinProject(getProjectFilePathWindowMapping(event), payload.filePath)` (electron) / `ensureWithinProject(getCurrentProjectFolder(), payload.filePath)` (web) opening every FS handler | 13 × 2 = 26 instances; ~70 LOC per host |
| C5 | `ensureWithinProject` itself is duplicated with **divergent safety logic**: electron explicitly validates `project.json`; web trusts `readProjectFile()`. `path.sep` vs `/`. Latent bug surface. | `electron/.../fs-service.ts:154–177` (24 lines) ↔ `web/.../fs-service.ts:230–243` (13 lines) |
| C6 | Project-folder + project-ID resolution prologue across 20+ handlers each side | electron `window-management.ts:14–24` (module-scope `Record<windowId, projectPath>`); web `ipc/utils.ts:3–35` (URL regex on every IPC) |
| C8 | Git handler `withProjectDir(payload)` wrapper applied to **34 handlers** per host, identical 1-liner | 35 LOC per host of pure registration noise |

### Host-side state hand-rolling

| # | Evidence |
|---|---|
| C9 | Project-binding registries asymmetric and ad-hoc. Electron: module-scope mutable `Record<windowId, projectPath>` (`window-management.ts:14–24`) read by every handler via `getProjectFilePathWindowMapping(event)`. Web: re-parses `window.location.pathname` with a regex on every IPC (`ipc/utils.ts:3–35`). Renderer shouldn't have to know which binding scheme it's talking to. |

### Naming chaos

| # | Cost |
|---|---|
| C11 | `electron/.../ipc-layer/extension-service.ts` (singular) vs `web/.../ipc/extensions-service.ts` (plural). Schema in `@beak/common/ipc/extensions.ts` is plural — web is right. `electron/.../host/extensions/` vs `web/.../lib/extension/` — different parent folder + singular/plural. Cross-host pattern-matching costs you a sec every time. |

### Already factored well (positive references)

- **`Runtime.*` is the working escape valve.** `runtime.openapi.syncToFolder`,
  `runtime.values.*`, `runtime.project.*`, `runtime.git.*` correctly
  delegate. The fs-service should follow this pattern but doesn't.
- **Provider base classes** (`CredentialsProviderBase`, `AesProviderBase`,
  `StorageProviderBase` in `@beak/runtime-shared`) correctly abstract
  divergent storage backings. Public surface is identical across hosts.
  No duplication at the contract level.
- **IPC schemas in `@beak/common/ipc/`** are defined once; both hosts
  implement against the same shape. The schema is doing its job — the
  duplication is in *implementation around the schema*, not the schema
  itself.
