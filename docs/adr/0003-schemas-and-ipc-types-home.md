# 0003 — Single home for schemas and IPC types

- **Status:** Proposed
- **Date:** 2026-06-08
- **Deciders:** Alexander Forbes-Reed

## Context

Type duplication is the biggest single blocker to clean domain
boundaries. The audit found `AssetRef` declared in four places:

1. `packages/state/src/assets/types.ts` — the canonical
   `assetRefSchema`.
2. `packages/state/src/requests/introspection.ts` — a hand-written
   interface, with a comment justifying the duplication.
3. Inline in `packages/state/src/schemas/beak-project.ts` body.file.
4. Inline in `packages/state/src/schemas/request-values.ts`
   bodyValue.file.

The same pattern repeats: IPC payload types live in `@beak/state`
(`GitCommitRequest` / `GitPushRequest` in `state/git/index.ts`,
`RequestPreference` in `state/preferences/`, `Extension` shapes in
`state/extensions/`) when they cross the renderer↔host boundary and
should be on the contract. `packages/state/src/schemas/` is itself a
"schemas" home that competes with per-domain `<d>/types.ts` files,
producing a split-brain where neither side is authoritative.

The cost is concrete: every reducer that constructs an `AssetRef`
has to pick which of the four definitions to import; refactors
silently diverge; agents scoped to a domain can't trust that "the
type of X" is one thing.

## Decision

### 1. `@beak/common` owns wire and disk types

Two subdirectories under `packages/common/src/`:

- `packages/common/src/ipc/<d>.ts` — IPC payload + response Zod
  schemas and the paired `IpcServiceRenderer` / `IpcServiceMain`
  classes for domain `<d>`. Unchanged from today.
- `packages/common/src/types/<d>.ts` — on-disk schemas (the shapes
  written to `tree/`, `_collection.json`, `_assets/`, `.beak/`, etc.)
  for domain `<d>`. New canonical home.

Every type that is serialised to disk or sent across IPC has exactly
one declaration in `@beak/common`. Importers — `@beak/state`,
`@beak/ui`, `@beak/runtime-shared`, both hosts — `import type` from
there.

### 2. `@beak/state` holds only derived types

`packages/state/src/<d>/types.ts` is allowed to exist, but only for:

- The slice's `State` shape (Redux internal, never persisted).
- View-model / projection types selectors return.
- Discriminated-union helpers that are computed from on-disk types
  but never round-tripped.

If a type is imported by an IPC handler or written to disk, it's in
`@beak/common`.

### 3. `packages/state/src/schemas/` is dissolved

Its contents move into `packages/common/src/types/<d>.ts` files by
domain. The file `packages/state/src/schemas/collection-merge.ts` is
not a schema — it's the sparse-merge implementation; it moves to
`packages/state/src/project/collection-merge.ts` (or
`@beak/runtime-shared` if both hosts need it).

### 4. Zod is the source of truth, TypeScript is derived

Where both a Zod schema and a TS interface exist for the same shape,
the TS type is derived: `type X = z.infer<typeof xSchema>`. We do
not hand-write the interface alongside the schema.

### 5. SDK types stay in `@getbeak/extension-sdk`

Types that are part of the **public** extension-author contract
(`VariableHandler`, `RtvHandler`, `AssetRef` as exposed to
extensions, the `getAssetRef?` contract) stay in
`@getbeak/extension-sdk` and are re-exported from `@beak/common` for
internal use. When the SDK and internal use diverge, the SDK is the
source of truth and `@beak/common` re-exports.

## Consequences

- The four `AssetRef` declarations collapse to one (in
  `@getbeak/extension-sdk`, re-exported from `@beak/common`).
- `packages/state/src/schemas/` disappears as a top-level folder.
- The Biome rule for `@beak/state` that already forbids importing
  `@beak/ui` is extended to forbid `@beak/state/<d>/types.ts` from
  declaring a type that's also serialised — manually enforced for
  now via PR review until we have tooling.
- Migrating an existing duplicate is a per-type ADR-free PR: move
  the canonical version, delete the others, fix imports with
  `tslsp:rename_file`. No behaviour change.
- IPC handlers (`apps-host/electron/src/ipc-layer/<d>-service.ts`,
  `apps-host/web/src/ipc/<d>.ts`) keep importing schemas from
  `@beak/common/ipc/<d>.ts` — that's already how Zod validation
  happens at the boundary. Nothing changes there.

## Alternatives considered

- **Keep types in each package that uses them, dedupe via
  re-exports.** Rejected — re-exports are easy to bypass; the audit
  shows people hand-write the type rather than re-export when the
  canonical home is unclear. One home, one import path.
- **Put on-disk types in `@beak/runtime-shared` instead of
  `@beak/common`.** Rejected — `@beak/runtime-shared` is host-side
  code (Node + filesystem helpers). The renderer should not depend
  on it for type-only imports. `@beak/common` is the cross-process
  surface and already has no runtime weight.
- **Generate types from a single IDL (Protobuf, OpenAPI, JSON
  Schema).** Rejected — overkill for the size of the surface; we
  already use Zod successfully on the IPC side and Zod doubles as
  runtime validator and TS type source.

## References

- [`docs/audit/`](../audit/) — discovery reports.
- [0002](0002-domain-ownership-and-rendering-data-path.md) — domain
  ownership; this ADR fills in the
  `packages/common/src/types/<d>.ts` cell.
