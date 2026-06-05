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

Other notable packages: `@beak/runtime-shared` (was `@beak/common-host`; host-side helpers, exposes `Runtime` + `AssetStore` + `project` to both Electron and web hosts), `@beak/requester-node` (Node HTTP request execution), `@beak/design-system` (Chakra v3 theme + provider — see "Design system" below), `@beak/ksuid` (KSUID id generation), `@beak/squawk` (internal error/event helper). The extension-sdk replaces the older `@getbeak/types-variables` / `@getbeak/types-realtime-value` / `@beak/realtime-values` trio.

### Design system (Chakra UI v3)

The renderer is built on **Chakra UI v3** with a custom theme defined in `packages/design-system/src/theme.ts`. The previous styled-components-only design-system was migrated in a multi-phase sweep (commits prefixed `chakra-phase-*` on `chore/improve-flight-architecture`).

Key bits:

- **Colour scales** (`theme.ts`) — numbered 50 → 950 ramps (Tailwind/Radix style) per family: `gray`, `pink`, `teal`, `indigo`, `red`, `green`, `yellow`, `orange`, `blue`. The 500 step is the "core" colour, lower = lighter, higher = darker. Resolve as `var(--beak-colors-pink-500)`, `var(--beak-colors-gray-700)`, etc. Brand aliases (`brand.pink`, `brand.teal`, `brand.indigo`, `brand.alert`, `brand.success`, `brand.warning`) point at the appropriate 500-step.
- **Other tokens** — compressed spacing scale (1=4px → 6=24px) for desktop density, system font stack on `fonts.body`, monospace stack on `fonts.mono`, font sizes xs→4xl (11px → 30px).
- **Semantic tokens** — `bg.canvas` / `.alt`, `bg.surface` / `.alt` / `.emphasized`, `bg.subtle`, 4-level foreground (`fg.default`, `fg.muted`, `fg.subtle`, `fg.disabled`) macOS-style, `fg.onAccent` for text on filled buttons, `border.subtle` / `.default` / `.emphasized`, plus `accent.{pink|teal|indigo|alert|success|warning|info}` + matching `.muted` low-contrast variants. Each resolves light vs dark via Chakra's `_dark` selector — the gray scale drives the entire neutral palette in both modes.
- **Provider** (`packages/design-system/src/provider.tsx`) — `BeakChakraProvider` composes `next-themes` (drives `class="light"` / `class="dark"` on `<html>`) → Chakra v3 `ChakraProvider` → a styled-components `ThemeProvider` (compat shim for any unmigrated `styled.X` that doesn't read the theme; will be removed when styled-components is uninstalled).
- **Colour usage in styled-components** — every theme-aware style uses `var(--beak-colors-<token>)` (e.g., `var(--beak-colors-accent-pink)`). Alpha shades are spelled `color-mix(in srgb, var(--beak-colors-<X>) <pct>%, transparent)` rather than the old `toHexAlpha(theme.X, A)` helper.
- **Mesh-gradient backdrop** — `packages/ui/src/components/molecules/MeshGradient.tsx` composes layered radial gradients from the brand palette, animated via framer-motion on a 30s loop (honours `prefers-reduced-motion`). The welcome screen uses it (`<MeshGradient tone='welcome' />`) — same component is reusable for loading splashes, alerts, etc.
- **Mode override** — the user preference (system/light/dark) is read from IPC preferences and fed to `BeakChakraProvider` via the resolved `themeKey` prop, same plumbing as before.

When writing new components in `@beak/ui`, prefer Chakra primitives (`Box`, `Flex`, `Stack`, `Grid`, `HStack`, `VStack`, `Button`, `Input`, `Tabs.*`, `Dialog.*`, `Tooltip`). For desktop chrome use `size='xs'` or `size='sm'`. Reach for `var(--beak-colors-…)` directly only when you need to colour a non-Chakra element (e.g., FontAwesome icon `color` prop, Monaco editor token).

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

### Untitled projects (cold-start UX)

The electron host's `createOrFocusDefaultWindow` picks a landing window in this order:

1. **Window-presence restore** — if the previous session saved a presence map, reload those windows verbatim.
2. **Most-recent project** — pick the top of `BeakRecents.listProjects()` and `tryOpenProjectFolder` it; the user lands on their last work.
3. **Untitled scratch project** — `openUntitledProject()` (in `apps-host/electron/src/host/extensions/project.ts`) creates a fresh project under `userData/untitled-projects/<ksuid>/` with `untitled: true` in `project.json`, opens it directly. Untitled projects are NOT added to recents.
4. **Welcome window** — fallback only if untitled creation throws (e.g., read-only userData).

Untitled projects can be promoted to a real location via `ipcProjectService.promoteUntitled({})` — exposed in the renderer as the **File → Save Project As…** menu item (CmdOrCtrl+Shift+S) and a banner above the project's sidebar (`packages/ui/src/components/molecules/UntitledBanner.tsx`). The runtime helper `BeakProject.promoteUntitled(currentFolder, targetFolder, newName?)` renames the folder, clears the `untitled` flag, and adds the new location to recents. The web host returns null from this IPC for now — OPFS / File System Access Save-As is a follow-up.

### OpenAPI sync (end-to-end)

The sync chain is wired top to bottom; the user trigger is **File → Import OpenAPI spec…**.

- Converter: `@beak/state/sources/openapi` — `openapiToCollection(spec, options)` is pure (spec → `{ collection, requests, warnings }`). Resolves `#/components/parameters/*` $refs, falls back to verb-path operationIds with a warning, seeds parameters from `example`/`default`/`enum`.
- Writer: `@beak/runtime-shared` — `Runtime.openapi.syncToFolder(targetFolder, conversion)` persists the collection + per-request files. Filenames sanitised + de-duped; `_collection` is reserved.
- IPC: `@beak/common/ipc/openapi` — `IpcOpenApiServiceRenderer.syncFromSpec({ targetFolder, spec, specPath?, specUrl? })`. Both hosts (electron + web) implement the handler.
- Renderer: `@beak/ui/features/openapi-import` — `parseSpecSource` accepts JSON **and YAML** (`js-yaml`), `importOpenApi()` calls the IPC, slice + `<OpenApiImportDialog>` drive the menu flow (file pick → folder pick → import → result).
- UI: `<OpenApiImportDialog>` (mounted in `ProjectMain`) walks the user through a folder picker before invoking `importOpenApi()`. The slice (`features/openapi-import/store`) holds the phase state machine (`idle | picking-file | picking-folder | importing | result`).

Deferred: external (network) $ref resolution.

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

### Monaco bundling notes

Both Monaco-related fixes live in `patches/` and are tracked via
`pnpm.patchedDependencies`:

1. `patches/vite-plugin-monaco-editor.patch` — adds 4 resolution
   candidates (cwd-rooted ± `.js`, bare ± `.js`) so pnpm's hoisting
   doesn't break the plugin's `require.resolve` lookups. Also swaps a
   Node 22+ incompatible `rmdirSync({recursive})` for `rmSync(...)`.

2. `patches/monaco-editor@0.55.1.patch` — extends the `exports` map so
   bare-specifier imports under `./esm/*` synthesize a `.js` extension.
   `monaco-graphql/dist/graphql.worker.js` does
   `require('monaco-editor/esm/vs/editor/editor.worker')` (no
   extension), and Node/esbuild won't fall back to `.js` on their own.
   The pattern order (`./esm/*.js` first, then `./esm/*`, then `./*`)
   means already-extensioned paths skip the synthesis.

If `pnpm build` breaks again on a monaco/monaco-graphql resolution
error, check that both patches still applied after `pnpm install` and
that monaco-editor is still at 0.55.1 (the patch is version-pinned).

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

## Local artefacts

Screenshots, PDFs, traces, and any other transient capture artefacts go in
`screenshots/` at the repo root (gitignored). NEVER write a PNG/PDF to the
repo root or to a package directory — strays show up in `git status` and
get committed by accident. When invoking `playwright-cli screenshot`,
always pass `--filename=screenshots/<name>.png`; the default writes to the
cwd, which is wrong.

## Path aliases

The root `tsconfig.json` defines `@beak/*` and `@getbeak/*` aliases pointing at source (not `dist`). When editing across packages locally, prefer alias imports — they pick up changes without a rebuild. Vite/electron-esbuild are configured to resolve the same aliases.

## Release flow

`docs/release-checklist.md` is the source of truth. In short: bump `apps-host/electron/package.json`, update the release-notes link in `apps-host/electron/src/updater.ts`, commit, tag `beak-app@x.x.x`, push, watch the `beak-host.yml` workflow for signing.

## TypeScript code intelligence (tslsp)

In any TS/JS project with a `tsconfig.json`, the `tslsp` tools are type-aware
and MUST be used instead of the built-in text tools for the operations below.
Text tools see strings; tslsp sees the program.

Names below are the MCP shape (`tslsp:foo`). With the CLI, replace `tslsp:foo`
with `tslsp foo` — same arguments, same output.

| Task                            | DO use                   | DO NOT use                              |
| ------------------------------- | ------------------------ | --------------------------------------- |
| Find every usage of a symbol    | `tslsp:references`       | `Grep`, `Glob`                          |
| Search for a symbol by name     | `tslsp:find_symbol`      | `Grep`                                  |
| Jump to a definition            | `tslsp:definition`       | `Grep` + `Read`                         |
| Jump to a value's *type*        | `tslsp:type_definition`  | `Grep` + `Read`                         |
| Find concrete implementations   | `tslsp:implementation`   | `Grep`                                  |
| Rename a symbol                 | `tslsp:rename`           | `Edit`, `MultiEdit`, find-and-replace   |
| Rename/move a file or folder    | `tslsp:rename_file`      | `mv` / `git mv` (won't update imports)  |
| Type / JSDoc for a symbol       | `tslsp:hover`            | `Read`                                  |
| Outline a file before reading   | `tslsp:outline`          | `Read` on the whole file                |
| Type errors after an edit       | `tslsp:diagnostics`      | `Bash` running `tsc` ad-hoc             |
| Trace callers / callees         | `tslsp:call_hierarchy`   | repeated `references` calls             |
| Organize imports / quick-fix    | `tslsp:code_action`      | manual edit                             |

Hard rules:

1. NEVER rename a TypeScript identifier with `Edit` or `MultiEdit`. Use
   `tslsp:rename`. Pass `dry_run: true` first when the symbol has many call
   sites; review the preview, then apply. This applies to every identifier —
   slice keys (`features.fooUi`), property names, enum members, the lot. If
   you find yourself string-editing a symbol "just for a couple of files"
   you have already failed the rule. For bulk renames (e.g. renaming a whole
   feature), enumerate symbols via `tslsp:outline` on each file in the folder
   first, then call `tslsp:rename` once per symbol — cheaper in tokens than
   grep+Read+Edit and safer (no false positives in comments / strings /
   unrelated identifiers).
2. NEVER `mv` or `git mv` a TypeScript file or folder. Use `tslsp:rename_file`
   — it walks every import that references the file and rewrites them. After
   the move you can still use `tslsp:rename` for any identifier inside.
3. NEVER `Grep` for a symbol name to find usages or definitions. Use
   `tslsp:references` or `tslsp:definition`. Grep matches strings in
   comments, in unrelated identifiers, in `.md` files — it lies.
4. Before reading a large file, call `tslsp:outline` first and use the line
   numbers to `Read` only the slices you need.
5. After non-trivial edits to a TS file, call `tslsp:diagnostics` on it to
   confirm it still type-checks before claiming the change is done.

Locator ergonomics: every position-taking tool accepts `{ symbol: "name" }`
(workspace search), `{ file, line, symbol }` (line scan), or full
`{ file, line, character }`. Use the cheapest form you have. Ambiguous
name-only queries return the candidate list; pick by file or line and re-call.

Batch: most read-only tools accept `symbols: ["a","b","c"]` (or `files: [...]`).
tslsp fans the requests out in parallel and labels each block with
`=== name ===`. One call beats N round-trips.

Fall back to the built-in text tools only for: string literals, comments,
non-TS files (Markdown, YAML, configs), or projects without a `tsconfig.json`.
