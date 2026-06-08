# 0003 — Unified Worker-based extension sandbox

- **Status:** Accepted
- **Date:** 2026-06-08
- **Deciders:** Alexander Forbes-Reed

## Context

Beak runs untrusted extension code (currently variable contributions:
`createDefaultPayload`, `getValue`, `getAssetRef`, `editor.*`) inside two
different sandboxes today:

- **Electron host** — `isolated-vm` (`apps-host/electron/src/lib/extension/index.ts`).
  Each loaded extension runs in its own V8 isolate via the `ivm.Isolate`
  + `ivm.Context` API. Native module rebuilt against electron's Node ABI
  via `electron-rebuild -f -w isolated-vm` in the apps-host/electron
  postinstall.
- **Web host** — Web Worker (`apps-host/web/src/lib/extension/manager.ts` +
  `worker-source.ts`). One Worker per loaded extension; `init` /
  `call` / `parse-value-sections` message protocol.

The two implementations have identical public surfaces (same method
names on `ExtensionManager`, same IPC channel, same SDK contract) but
duplicate the bootstrap, validation, error mapping, and lifecycle code.
More importantly, `isolated-vm` is the sole reason the Electron build
needs:

- `electron-rebuild` (postinstall, slow on cold install; needs Python +
  C++ toolchain on the user's machine for source builds).
- `pnpm.patchedDependencies` consideration for native ABI compat across
  electron releases.
- `app.asar.unpacked` carrying unsigned `.node` binaries +
  `isolated-vm-X.Y.Z.tgz` + the `prebuilds/` tree → macOS notarization
  rejection on PR #672's CI.
- A per-release `afterPack` script to strip those artefacts before
  signing.

The web host already proved Workers are sufficient: same isolation
guarantees we actually use (separate V8 heap, separate event loop, no
shared mutable state, structured-clone-only IPC), same observable
behaviour for the SDK, no native code.

## Decision

Drop `isolated-vm`. Both hosts run extensions in Workers — Web Workers
in the browser, `node:worker_threads` in Electron — driven by **one
shared manager + worker source** in `@beak/runtime-shared/extensions/`.

Per-host code shrinks to a thin adapter: spawn the host's Worker
primitive with the shared source, route the worker's
`parse-value-sections` callbacks through the host's IPC layer, and
forward log messages.

### 1. One worker source, two transports

`packages/runtime-shared/src/extensions/worker-source.ts` exports
`WORKER_SOURCE` — the existing Web-Worker-style string (`self.addEventListener('message', …)`,
top-level `postMessage`, `new Function('module', 'exports', userSource)`).

- **Web host** loads it via `new Worker(URL.createObjectURL(blob))` —
  unchanged from today.
- **Electron host** prepends a 6-line shim that aliases
  `self`/`postMessage`/`addEventListener` onto Node's `parentPort`,
  then runs it via `new Worker(prefixedSource, { eval: true })` from
  `node:worker_threads`.

The shim:

```js
const { parentPort } = require('node:worker_threads');
globalThis.self = globalThis;
globalThis.postMessage = parentPort.postMessage.bind(parentPort);
globalThis.addEventListener = (type, fn) => {
  if (type === 'message') parentPort.on('message', data => fn({ data }));
};
```

The user's extension code itself remains identical — same
`defineExtension({...})` shape, same `extCtx` API, same SDK.

### 2. Unified `WorkerExtensionManager` in runtime-shared

The host-side manager (everything in `WebExtensionManager` today —
load / unload / call routing / parse-value-sections bridging / error
serialisation) moves to
`packages/runtime-shared/src/extensions/worker-manager.ts`,
parameterised on two collaborators:

```ts
interface WorkerProvider {
  /** Spawn a worker that evaluates WORKER_SOURCE. */
  spawn(name: string): UnifiedWorker;
}

interface UnifiedWorker {
  postMessage(msg: unknown): void;
  onMessage(fn: (msg: unknown) => void): () => void; // unsubscribe
  onError(fn: (err: unknown) => void): () => void;
  terminate(): void | Promise<unknown>;
}

interface ManagerCallbacks {
  /** Recursive value-section parse — host owns the IPC roundtrip. */
  parseValueSections(
    callerCtx: unknown,        // host-specific (webContents for electron, null for web)
    varCtx: VariableContext,
    parts: ValueSections,
    recursiveDepth: number,
  ): Promise<string>;

  /** Worker log sink — `(packageName, level, message)`. */
  log(packageName: string, level: string, message: string): void;
}
```

The host passes a `callerCtx` through each variable-invocation method
so the manager can hand it back on the parseValueSections callback —
that's how Electron picks the right `webContents` per recursive call.

### 3. Trust model — unchanged, made explicit

Extensions are installed by the user (manifest validated by
`@beak/runtime-shared`'s `ExtensionManifests.parse`). The sandbox
exists to:

- Stop one extension's bug or memory leak from crashing the host.
- Prevent direct DOM / file-system / shared-state access from
  extension code.
- Enforce timeouts (`extension_init_timeout` 5s,
  `extension_call_timeout` 30s).

It does **not** position against actively malicious code. Both
Workers (Web and Node) provide V8-isolate-level memory separation —
identical to `isolated-vm`'s memory-isolation guarantee. Node
`worker_threads` does expose `globalThis.Buffer` / `globalThis.process`
to the worker's main scope, and dynamic `import()` resolves Node
built-ins. We accept this for now — extensions are installed
explicitly via the project's `extensions/` folder, not arbitrary
internet payloads. If a tighter sandbox is needed later, wrap the
`userSource` evaluation in `vm.runInContext` with a stripped global —
that's an internal change to `WORKER_SOURCE`, no SDK impact.

### 4. SDK contract — frozen at apiVersion: 1

`@getbeak/extension-sdk` doesn't change. Extensions written against
the current `defineExtension({...})` keep working. The Worker harness
validates the same shape the isolated-vm harness validated.

## Consequences

**Wins:**

- `isolated-vm` removed from `apps-host/electron/package.json`
  (one less native dep, no electron-rebuild for it, faster cold installs).
- `app.asar.unpacked` no longer contains unsigned prebuilds → macOS
  notarization stops failing on the existing `.node` binaries.
- Single source of truth for the extension execution model. New
  variable contract additions (`getAssetRef`, future binary helpers)
  ship as one edit to `worker-source.ts` instead of two.
- The Electron extension manager drops from 467 lines (`isolated-vm`
  glue, `ivm.Reference.apply` plumbing, `ExternalCopy` ceremony) to
  ~60 lines (host-specific IPC bridge + WorkerProvider).

**Costs / risks:**

- `worker_threads` is a slightly heavier per-extension footprint than
  `isolated-vm` — full Node runtime per worker, ~10-20MB RSS each
  vs. ~3-5MB. Acceptable: a typical project loads 0–3 extensions, the
  delta is invisible.
- Workers spawn slower than isolates (50-200ms cold vs. ~10ms). Init
  is async and already timed-out at 5s; no user-observable change.
- Sandbox is meaningfully weaker against adversarial code (see
  Decision §3). Trust model already assumed installed-by-user
  extensions, so this matches reality.

**Migration:**

1. Land `WORKER_SOURCE` + `WorkerExtensionManager` in `runtime-shared`.
2. Switch web host to import them (delete `apps-host/web/src/lib/extension/`).
3. Add Electron WorkerProvider via `node:worker_threads`; delete
   `apps-host/electron/src/lib/extension/index.ts`'s isolated-vm code.
4. Remove `isolated-vm` from `apps-host/electron/package.json` deps +
   the `electron-rebuild -f -w isolated-vm` postinstall script.
5. Remove any afterPack pruning that was added as a stopgap.
6. Verify: existing extension tests pass on both hosts; `pnpm package`
   completes notarization on macOS CI.

No data migration. Extensions on disk are unchanged.
