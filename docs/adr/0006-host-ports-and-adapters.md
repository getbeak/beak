# 0006 — Host ports and adapters

- **Status:** Proposed
- **Date:** 2026-06-08
- **Deciders:** Alexander Forbes-Reed

## Context

Three host-side concerns already live behind clean abstractions that
both shells subclass:

- `CredentialsProviderBase` — Electron uses keytar; web uses an
  in-memory stub.
- `AesProviderBase` — Electron uses Node `crypto`; web uses
  SubtleCrypto.
- `StorageProviderBase` — Electron uses `electron-store`; web uses
  IndexedDB.

Plus `registerGitBindings()`, which both hosts call with the same
interface, and the `Requester` interface that the web host
introduced to switch between `browserFetchRequester` and the
local-agent requester at runtime.

The audit found that everything else with two host implementations
does the same shape in two places **without** a shared contract:

- Project lifecycle (`apps-host/electron/src/host/project.ts` is
  dialog-coupled; web improvises).
- Extension runtime (`ExtensionManager` carries
  `IpcMainInvokeEvent` directly; web cannot reuse it).
- Project secrets (encrypt/decrypt handlers reimplemented inline in
  both shells).
- Preferences persistence and broadcast.
- Dialog rendering (web uses `alert()`).
- Local agent client (discovery + PKCE + SSE smeared across
  `state/agent`, `ui/services/agent`, `web/host/`).

Each missing port is also a duplication site: when the contract
isn't named, the two shells drift.

Naming is also inconsistent: today the existing abstractions live in
`packages/runtime-shared/src/providers/`, the hosts call their
implementations "providers" too, but the audit synthesis settled on
"ports" + "adapters" as the target vocabulary.

## Decision

### 1. `@beak/runtime-shared` owns ports

A **port** is an interface (or abstract base class) describing a
capability the renderer needs from the host. Ports live at:

```
packages/runtime-shared/src/ports/<domain>.ts
```

Each port file exports:

- The interface (or abstract base).
- Any shared types the interface references (re-exported from
  `@beak/common/types/<d>` per
  [0003](0003-schemas-and-ipc-types-home.md)).
- A no-op or in-memory default implementation, **if and only if**
  the port is optional (an "unsupported" capability some shells
  declare).

The existing `packages/runtime-shared/src/providers/` directory
renames to `ports/`. The base classes inside (`AesProviderBase`,
`CredentialsProviderBase`, `StorageProviderBase`) keep their names
— "port" is the directory, the class can remain `…ProviderBase`
for backward compatibility.

### 2. Each host has an `adapters/` directory

An **adapter** is the concrete implementation of a port for a given
shell. Adapters live at:

```
apps-host/electron/src/adapters/<domain>.ts
apps-host/web/src/adapters/<domain>.ts
```

`apps-host/electron/src/host/providers/` and the equivalent under
web's `host/` move into `adapters/`. The `host/` directory keeps
non-adapter setup code (Runtime singleton wiring,
`tryOpenProjectFolder` until it migrates).

### 3. Initial port inventory

Five ports already exist, lifted into `ports/`:

- `ports/credentials.ts` (formerly `providers/credentials.ts`)
- `ports/aes.ts` (formerly `providers/encryption-aes.ts`)
- `ports/storage.ts` (formerly `providers/storage.ts`)
- `ports/asset-store.ts` (today inline in `runtime-shared`)
- `ports/git-bindings.ts` (today `registerGitBindings`)
- `ports/requester.ts` (formerly `apps-host/web/src/requester/types.ts`,
  promoted; Electron grows an adapter that wraps
  `@beak/requester-node`)

Seven new ports follow, in priority order (matches the audit's
action list):

- `ports/project-opener.ts` — opens / picks / promotes a project.
- `ports/extension-runtime.ts` — load/unload/invoke extensions,
  decoupled from `IpcMainInvokeEvent`.
- `ports/project-secrets.ts` — per-project encryption surface that
  was inlined in both hosts' encryption handlers.
- `ports/preferences-store.ts` — read/write + multicast preferences
  changes.
- `ports/dialog.ts` — modal prompts (file picker, message box,
  confirm). Web's first real implementation lands as part of this.
- `ports/local-agent-client.ts` — discovery, pairing, request
  routing. Web has an adapter; Electron's adapter is a no-op
  (`unsupported`).
- `ports/notification.ts` — native notification + beep.

`ports/window-manager.ts` is left optional. Web has no equivalent;
introducing the port is acceptable when we either need the renderer
to know which window is active or when the Electron globals become
a real maintenance problem.

### 4. The capability matrix gates ports, not features

The renderer reads `runtime.capabilities` at startup to know what's
available (`fileSystemAccess`, `systemKeychain`, `multipleWindows`,
`extensions`, `localAgent: 'unsupported' | 'optional' | 'required'`).
A port whose backing capability is `unsupported` MUST still exist
as a typed no-op so the renderer's service can call it without
branching.

That means: a service in `@beak/ui` never branches `if (electron)
{...} else {...}`. It calls the port; if the host adapter is a
no-op, the result is a documented `null` / `'unsupported'` value,
and the service maps that into UI state.

### 5. Adding a port

Adding a port is itself an ADR if it crosses both shells. The ADR
captures:

- The interface signature.
- Each shell's adapter strategy (Node API, browser API, no-op).
- The capability flag (if a shell can't implement it).
- The wire format (if the port introduces new IPC).

Renaming or extending an existing port is a normal PR, not an ADR.

## Consequences

- The directory rename (`providers/` → `ports/`,
  `host/providers/` → `adapters/`) is mechanical, done with
  `tslsp:rename_file`. No behaviour change.
- Electron's `ExtensionManager` currently takes
  `IpcMainInvokeEvent`; the new `ExtensionRuntime` port takes an
  abstract `Sender` instead, and the Electron adapter wraps
  `IpcMainInvokeEvent.sender` to match.
- The audit's local-agent finding — discovery and pairing scattered
  across `state/agent`, `ui/services/agent`, `web/host/` —
  collapses into one `local-agent-client` port + a web adapter + a
  no-op Electron adapter.
- New ports take ~half a day each: write the interface, port one
  shell, port the other, swap call sites.

## Alternatives considered

- **Skip the rename; keep `providers/`.** Rejected — the audit
  synthesis chose `ports` / `adapters` as the vocabulary, and we
  want the directory names to match. The cost is one rename PR.
- **One port per IPC channel.** Rejected — that ties the port to
  the wire protocol. A port is a *capability*; the IPC channel is
  one transport for it. The same port could (in principle) be
  served in-process for tests, or by a different transport later.
- **Adapters in `@beak/runtime-shared`, parameterised by
  capability.** Rejected — adapters need access to host-specific
  APIs (`electron.dialog`, `lightning-fs`, `keytar`, etc.) that
  `@beak/runtime-shared` cannot depend on without dragging in
  those modules at install time. Ports in shared code, adapters
  in host code.
- **Generate adapters from the port interface.** Rejected —
  interfaces are small and adapters are non-trivial (they
  sandbox, validate, retry); generation would only save trivial
  glue and obscure the interesting parts.

## References

- [`docs/audit/`](../audit/) — discovery reports.
- [0002](0002-domain-ownership-and-rendering-data-path.md) — the
  paths in §1 reference these locations.
