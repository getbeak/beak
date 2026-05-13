# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

Beak is a cross-platform API crafting tool. The repo is a pnpm monorepo (pnpm >= 9, currently `pnpm@10.15.1`) of ~17 workspaces under `apps-host/*`, `apps-web/*`, and `packages/*`. It ships as both an Electron desktop app and a web app, sharing the same React renderer (`@beak/ui`) across both shells.

## Common commands

Run everything from the repo root unless noted.

```bash
# Install
pnpm install                       # runs build/package-overrides postinstall

# Type-check (uses tsgo — @typescript/native-preview, not vanilla tsc)
pnpm typecheck                     # all workspaces
pnpm typecheck:apps-host           # electron + web host only

# Lint / format (Biome — replaces ESLint + Prettier)
pnpm lint                          # check
pnpm lint:fix                      # auto-fix lint
pnpm format                        # format only
pnpm check                         # lint + format + organize imports, writes

# Build
pnpm build                         # all workspaces, recursive
pnpm build:apps-host-electron      # build electron host + its deps
pnpm build:apps-web-share          # build the web share viewer

# Dev (Electron desktop app — renderer + main in parallel)
pnpm start:apps-host-electron      # main = @beak/apps-host-electron, renderer = @beak/ui (vite dev)

# Dev (other hosts)
pnpm start:apps-host-web           # web shell (vite) wrapping @beak/ui
pnpm dev:apps-web-marketing        # Astro marketing site
pnpm start:apps-web-share          # share viewer (vite + react-router)

# Package the desktop app
pnpm package                       # local unsigned build
pnpm package:release               # signed release build (CI)

# Tests — vitest, per package
pnpm --filter @beak/ui test:run                # run once in CI mode
pnpm --filter @beak/common test                # watch mode
pnpm --filter @beak/core test:ui               # vitest UI
# Single test file:
pnpm --filter @beak/ui exec vitest run src/path/to/file.test.ts
# Single test by name:
pnpm --filter @beak/ui exec vitest run -t 'my test name'

# Nuclear reinstall when node_modules drift
pnpm unfuck

# Pre-release safety net (runs in CI on tags)
pnpm release-safety                # typecheck + lint + build
```

Note: `pnpm typecheck` uses `tsgo` (the native TypeScript preview compiler, pinned via `@typescript/native-preview`). It is faster than `tsc` but occasionally lags on edge-case diagnostics — if a type error looks impossible, try `pnpm install` and re-run.

## Architecture

### Three shells, one renderer

The renderer (UI, store, features, services) lives entirely in `@beak/ui` (`packages/ui`). Each shell embeds it:

- **`apps-host/electron`** — Electron main process. Bundled with `electron-esbuild`. Before `build`, it copies `packages/ui/dist/**` into `apps-host/electron/dist-react/` and loads it as the renderer. Runs Node-side services in `src/host/` (extensions, providers — keytar credentials, AES, fs storage) and an IPC layer in `src/ipc-layer/`.
- **`apps-host/web`** — Vite-built web shell. Provides an in-browser filesystem via `@isomorphic-git/lightning-fs` so projects work without a backend. Mounts `@beak/ui` directly.
- **`apps-web/share`** — Standalone Vite + React Router app for viewing shared projects (does not embed `@beak/ui`).
- **`apps-web/marketing`** — Astro static site for getbeak.app.

In `@beak/ui`, `src/entrypoints/electron.tsx` vs `src/entrypoints/web.tsx` is chosen at runtime by `window.embeddedIndicator` (see `packages/ui/src/index.tsx`).

### Renderer ↔ host IPC

All cross-process communication goes through `packages/common/src/ipc/`:

- `IpcServiceBase` (`base.ts`) is subclassed by `IpcServiceMain` (Node side, in the host) and `IpcServiceRenderer` (renderer side).
- Each domain has a paired schema/handlers file: `fs.ts`, `flight.ts`, `project.ts`, `encryption.ts`, `extensions.ts`, etc.
- Payloads crossing the boundary are validated with **Zod** at the main-process edge. Treat the renderer as untrusted — it runs extension code. The host applies additional sandboxing (`ensureWithinProject`, etc.) inside individual handlers.
- When adding a new IPC call: define the schema and message constants in `packages/common/src/ipc/<domain>.ts`, register the handler in `apps-host/electron/src/ipc-layer/<domain>-service.ts`, and call it from `@beak/ui` services.

### Package layering (enforced by Biome)

`biome.json` enforces import restrictions per package via `noRestrictedImports`. **Do not work around these — they encode the architecture:**

- `@beak/common` — pure cross-process types & IPC schemas. **Cannot import** `@beak/ui`, `@beak/state`, `@getbeak/extension-sdk`.
- `@getbeak/extension-sdk` — public SDK for extension authors (variable/RTV type contracts + helpers, plus the `AssetRef` shape and `getAssetRef?` contract). **Cannot import** `@beak/ui`, `@beak/state`, `@beak/common`. Published to npm as v0.1.0; bump versions deliberately. Beak's own variable machinery (registry, parser, built-in handlers) lives in `@beak/ui/src/features/variables/`, **not** in this package, for security/sandbox reasons.
- `@beak/state` — Redux Toolkit slices and shared store logic (`arbiter`, `assets`, `extensions`, `flight`, `git`, `preferences`, `project`, `schemas`, `sources`, `variableSets`). **Cannot import** `@beak/ui` or `@getbeak/extension-sdk`. Was `@beak/core` before the May 2026 reshuffle.
- `@beak/ui` — the renderer. May import everything below it.

Other notable packages: `@beak/runtime-shared` (was `@beak/common-host`; host-side helpers, exposes `Runtime` + `AssetStore` + `project` to both Electron and web hosts), `@beak/requester-node` (Node HTTP request execution), `@beak/design-system` (styled-components theming), `@beak/ksuid` (KSUID id generation), `@beak/squawk` (internal error/event helper). The extension-sdk replaces the older `@getbeak/types-variables` / `@getbeak/types-realtime-value` / `@beak/realtime-values` trio.

### State management

Redux Toolkit. Slices live in `@beak/state/src/<domain>/` (e.g. `flight-slice.ts`). The renderer wires them up in `packages/ui/src/store/`, which also hosts side-effect listeners (`store/effects/*.ts`) and the listener middleware (`store/listener.ts`). Async work (running a flight, syncing extensions, git ops) happens in `store/effects/` rather than inside slice reducers.

### Flight architecture

Flights are keyed by **`flightId`**, not requestId — multiple flights can be in flight at once (across different requests *and* the same request).

- `activeFlights: Record<flightId, FlightInProgress>` and `flightsByRequest: Record<requestId, flightId[]>` are the two indexes in `@beak/state/flight/flight-slice.ts`.
- `selectActiveFlight(requestId)` returns the most recent in-flight flight; `selectActiveFlightsForRequest(requestId)` returns all of them.
- The "Request already in flight" dialog was removed. Concurrency is the default; if you ever need a per-request cap, add a preference rather than a hard gate.

### Project file format (v0.5.0)

Each folder under `tree/` contains a `_collection.json` (`@beak/state/schemas`'s `collectionFileSchema`). It declares the request `source` (`manual` | `openapi` | `graphql`) and optional `defaults` (`baseUrl`, `verb`, `headers`, `query`, `body`, `options`).

Request files are sparse overrides when a collection declares non-empty defaults. The renderer reads via `mergeCollectionDefaults` and writes via `diffFromDefaults` (both in `@beak/state/schemas`), so routine API edits don't pollute the git diff tree. Empty defaults → byte-identical to the legacy fully-specified file.

The `0.4.0 → 0.5.0` migration in `@beak/runtime-shared/project/migrations/standard.ts` writes a manual-source collection file into every existing folder; sparse mode only kicks in once a user adds defaults.

### OpenAPI sync (end-to-end)

The sync chain is wired top to bottom; the user trigger is **File → Import OpenAPI spec…**.

- Converter: `@beak/state/sources/openapi` — `openapiToCollection(spec, options)` is pure (spec → `{ collection, requests, warnings }`). Resolves `#/components/parameters/*` $refs, falls back to verb-path operationIds with a warning, seeds parameters from `example`/`default`/`enum`.
- Writer: `@beak/runtime-shared` — `Runtime.openapi.syncToFolder(targetFolder, conversion)` persists the collection + per-request files. Filenames sanitised + de-duped; `_collection` is reserved.
- IPC: `@beak/common/ipc/openapi` — `IpcOpenApiServiceRenderer.syncFromSpec({ targetFolder, spec, specPath?, specUrl? })`. Both hosts (electron + web) implement the handler.
- Renderer: `@beak/ui/features/openapi-import` — `parseSpecSource` accepts JSON **and YAML** (`js-yaml`), `importOpenApi()` calls the IPC, `runOpenApiImportFlow` is the menu hook with success/error dialogs.

Deferred: external (network) $ref resolution; the UI for picking the target folder (today defaults to `tree/openapi`).

### Asset storage (end-to-end)

`@beak/runtime-shared`'s `Runtime.assets` (an `AssetStore`) writes binary blobs to `<projectRoot>/_assets/<sha256-prefix>/<sha256>` and addresses them via `AssetRef` (`{ sha256, size, contentType? }`). Identical bytes share storage. Writes are idempotent; missing-asset reads return `null` rather than throwing.

Around it:
- `Runtime.gc` (`AssetGc`) — `findReferencedShas(projectRoot)` walks `tree/` and harvests every sha appearing inside an `AssetRef`-shaped object; `findOrphans` returns stored − referenced; `delete(shas)` removes blobs in bulk (idempotent).
- IPC: `@beak/common/ipc/assets` — `IpcAssetsServiceRenderer.{write,read,exists}`. Renderer uses `ipcAssetsService` (in `@beak/ui/lib/ipc`).
- Renderer helper: `@beak/ui/features/asset-attachment` — `attachFile({ file })` (pure) + `pickAndAttachAsset(accept?)` (DOM picker → IPC).
- Schema: `RequestBodyFile.payload.assetRef?` lands the ref on a request body. Backward compatible — the legacy `fileReferenceId` field remains optional and works as before. `mergeCollectionDefaults` / `diffFromDefaults` round-trip the new shape.
- State introspection: `@beak/state/requests` — `extractAssetRefs(request)`, `countAssetRefs(request)`, `checkAssetIntegrity(request, availableShas)` for inline "missing asset" UI hints and a future `beak doctor` command.

Variables in the SDK can opt into binary by implementing the optional `getAssetRef?: (ctx, payload, depth) => Promise<AssetRef | null>` alongside their existing `getValue`. The renderer-side resolver lives in `@beak/ui/features/variables/binary.ts` (`resolveValuePartForBinary`, `parseValueSectionsForBinary`); it picks `getAssetRef` when present, falls back to `getValue` otherwise.

Deferred: the body-file editor UI button that calls `pickAndAttachAsset` and sets `assetRef` on the body; flight execution reading bytes back via `ipcAssetsService.read` and streaming them into the HTTP request.

### IPC channels (full list)

`@beak/common/ipc/`: `app`, `assets`, `beak-hub`, `context-menu`, `dialog`, `encryption`, `explorer`, `extensions`, `flight`, `fs`, `fs-watcher`, `nest`, `notification`, `openapi`, `preferences`, `project`, `window`. Each domain has paired `IpcServiceMain` (host) and `IpcServiceRenderer` (renderer) classes. Both Electron and Web hosts implement every channel that's relevant to them.

### Known infra issues

- **`pnpm build` fails on packages/ui** — two-layer problem:
  1. `vite-plugin-monaco-editor@1.1.0` calls
     `require.resolve(process.cwd() + '/node_modules/monaco-editor/esm/vs/language/json/json.worker')`,
     but pnpm hoists `monaco-editor` to the workspace root and doesn't symlink
     it into `packages/ui/node_modules`. This layer can be worked around by
     moving every worker into `customWorkers` with `../../../node_modules/...`
     entries (which we already do for graphql/scss/less/etc).
  2. Once the plugin's path resolver works, esbuild bundling
     `node_modules/monaco-graphql/dist/graphql.worker.js` fails on its
     transitive `import 'monaco-editor/esm/vs/editor/editor.worker'`. monaco-editor
     is ESM-only and its `exports` map doesn't expose internal subpaths to
     bare-specifier imports, so esbuild can't resolve them.
  Fixing both layers (not yet applied):
  1. Replace `vite-plugin-monaco-editor` with `vite-plugin-monaco-editor-esm`
     or `@guolao/vite-plugin-monaco-editor` (both handle pnpm + ESM).
  2. OR patch monaco-editor's `package.json` exports map via pnpm's
     `patchedDependencies` to expose `./esm/vs/**/*` paths.
  Dev server (`pnpm start:apps-host-web`) is unaffected — playwright e2e runs
  against the dev server, not the built bundle, so the suite stays green
  even with build broken.

### Tabs

`packages/ui/src/features/tabs/`. The `TabItem` discriminated union lives in `@beak/common/types/beak-project.d.ts`:
- `request` — opens a request editor.
- `variable_set_editor` — variable-sets editor.
- `new_project_intro` — first-run intro.
- `preferences` — settings as a tab inside a project window (replaces the standalone preferences window for the in-project use case; the standalone window remains the fallback when no project is focused).

### Runtime capabilities

The runtime (was `BeakHost`, now `Runtime`) carries an explicit `capabilities` matrix — `nativeContextMenus`, `extensions`, `multipleWindows`, `systemKeychain`, `fileSystemAccess: 'native' | 'sandboxed'`, `binaryStreaming`. Feature code gates on `runtime.capabilities.X` instead of branching on `if (electron)`.

## Code style

Biome enforces (see `biome.json`):

- **Tabs** for indentation (width 1), **single quotes** (including JSX), semicolons, trailing commas, arrow parens `asNeeded`, line width 120, LF endings.
- `useImportType` is an error — type-only imports must use `import type`.
- `noConsole` is an error; only `console.info`, `console.warn`, `console.error` are allowed.
- `noUnusedImports` / `noUnusedVariables` are errors. `ignoreRestSiblings` is on.
- `useNamingConvention` warns: variables `camelCase` | `PascalCase` | `CONSTANT_CASE`, types `PascalCase`. Test files (`*.test.ts(x)`, `__tests__/`) are exempted from naming + `noExplicitAny`.

## Path aliases

The root `tsconfig.json` defines `@beak/*` and `@getbeak/*` aliases pointing at source (not `dist`). When editing across packages locally, prefer alias imports — they pick up changes without a rebuild. Vite/electron-esbuild are configured to resolve the same aliases.

## Release flow

`docs/release-checklist.md` is the source of truth. In short: bump `apps-host/electron/package.json`, update the release-notes link in `apps-host/electron/src/updater.ts`, commit, tag `beak-app@x.x.x`, push, watch the `beak-host.yml` workflow for signing.

## TypeScript code intelligence (tslsp MCP)

In any TypeScript or JavaScript project that has a `tsconfig.json`, the
`tslsp` MCP is type-aware and MUST be used instead of the built-in text
tools for the operations below. The built-in tools see strings; tslsp
sees the program.

| Task                          | DO use                | DO NOT use      |
| ----------------------------- | --------------------- | --------------- |
| Find every usage of a symbol  | `tslsp:references`    | `Grep`, `Glob`  |
| Search for a symbol by name   | `tslsp:find_symbol`   | `Grep`          |
| Jump to a definition          | `tslsp:definition`    | `Grep` + `Read` |
| Rename a symbol               | `tslsp:rename`        | `Edit`, `MultiEdit`, find-and-replace |
| Get a symbol's type / JSDoc   | `tslsp:hover`         | `Read` |
| Outline a file before diving  | `tslsp:outline`       | `Read` on the whole file |
| Type errors after an edit     | `tslsp:diagnostics`   | `Bash` running `tsc` ad-hoc |

Hard rules:

1. NEVER rename a TypeScript identifier with `Edit` or `MultiEdit`. Use
   `tslsp:rename`. Pass `dry_run: true` first when the symbol has many
   call sites; review the preview, then apply.
2. NEVER `Grep` for a symbol name to find usages or definitions. Use
   `tslsp:references` or `tslsp:definition`. Grep matches strings in
   comments, in unrelated identifiers, in `.md` files - it lies.
3. Before reading a large file, call `tslsp:outline` first and use the
   line numbers to `Read` only the slices you need. Do not page through
   100s of lines hunting for a function.
4. After non-trivial edits to a TS file, call `tslsp:diagnostics` on it
   to confirm it still type-checks before claiming the change is done.

Locator ergonomics: every position-taking tool accepts
`{ symbol: "name" }` (workspace search), `{ file, line, symbol }` (line
scan), or full `{ file, line, character }`. Use the cheapest form you
have. Ambiguous name-only queries return the candidate list; pick by
file or line and re-call.

Fall back to the built-in text tools ONLY for: string literals,
comments, non-TS files (Markdown, YAML, configs), or projects without a
`tsconfig.json`.
