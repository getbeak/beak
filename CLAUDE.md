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

- `@beak/common` — pure cross-process types & IPC schemas. **Cannot import** `@beak/ui`, `@beak/core`, `@beak/realtime-values`.
- `@beak/realtime-values` — extension-author SDK only (type contracts + a couple of helpers). **Cannot import** `@beak/ui`, `@beak/core`, `@beak/common`. Beak's own realtime-value machinery (registry, parser, built-in handlers) lives in `@beak/ui/src/features/realtime-values/`, **not** in this package, for security/sandbox reasons.
- `@beak/core` — Redux Toolkit slices and shared store logic (`arbiter`, `extensions`, `flight`, `git`, `preferences`, `project`, `schemas`, `variableGroups`). **Cannot import** `@beak/ui` or `@beak/realtime-values`.
- `@beak/ui` — the renderer. May import everything below it.

Other notable packages: `@beak/common-host` (host-side helpers, used by both Electron and web hosts), `@beak/requester-node` (Node HTTP request execution), `@beak/design-system` (styled-components theming), `@beak/ksuid` (KSUID id generation), `@beak/squawk` (internal error/event helper). `@getbeak/types*` packages under `packages/types*` are **published to npm** and form the public contract for extension authors — bump versions deliberately.

### State management

Redux Toolkit. Slices live in `@beak/core/src/<domain>/` (e.g. `flight-slice.ts`). The renderer wires them up in `packages/ui/src/store/`, which also hosts side-effect listeners (`store/effects/*.ts`) and the listener middleware (`store/listener.ts`). Async work (running a flight, syncing extensions, git ops) happens in `store/effects/` rather than inside slice reducers.

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
