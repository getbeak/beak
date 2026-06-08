# 0008 — Realtime values v1: the original variable system (retrofit)

- **Status:** Superseded by [0007](0007-realtime-values-redesign.md). Captures a pre-ADR-process decision retroactively.
  Kept as the frozen description of the system 0007 replaced.
- **Date:** 2026-06-08 (decision dates back to Beak's initial release)
- **Deciders:** Alexander Forbes-Reed

## Context

Beak crafts HTTP requests. Every editable field on a request —
URL, query, headers, body fields, GraphQL variables — needs to
accept both literal text **and** computed expressions (UUIDs,
timestamps, environment lookups, signatures, response references
from prior flights). A static string field is not enough.

The original RTV (realtime-value) system was built in the project's
first months — long before the ADR process existed (see ADR
[0000](0000-adr-process.md), 2026-06-05). The decisions baked into
it were never written up. ADR [0007](0007-realtime-values-redesign.md)
proposes a redesign and ships ahead of this retrofit; capturing the
v1 system in writing now means the rationale we're trading off in
0002 is on the record, not reconstructed from `git log` after the
fact.

Forcing functions for v1 (reconstructed):

- Renderer-side compute had to be sandboxable enough to host
  user-installed extensions without filesystem or network access.
- The expression mechanism had to round-trip through saved request
  files (JSON on disk) — so it had to be a serialisable data
  structure, not closures or eval'd source.
- A single field could mix literal text and computed parts (e.g.,
  `Authorization: Bearer {token}-{nonce}`), so the representation
  had to be a sequence rather than a single value.

## Decision

The v1 realtime-value system is built on four core choices:

### 1. ValueSections — sequences of literals and variable references

Every editable field on a request stores a `ValueSections` array:
`(string | { type: string; payload: unknown })[]`. Literal strings
sit inline; each typed object is a "blob" pointing at a registered
variable by string `type`, with a payload schema owned by that
variable.

```ts
// packages/types/values.d.ts
export type ValueSections = ValueSection[];
export type ValueSection = string | { type: string; payload: unknown };
```

The renderer's variable-input editor (`packages/ui/src/features/variable-input/`)
treats the array as a flat document — literals are editable text,
blobs render as contenteditable=false pills. The serialised array
is what's persisted in request files and variable-set values.

### 2. v1 SDK contract — `getValue` plus optional `getAssetRef`

Extensions register variables that implement two callbacks:

```ts
// packages/extension-sdk/src/index.ts
export interface VariableDefinition<TPayload, TEditorState = TPayload> {
  id: string;
  name: string;
  description: string;
  createDefaultPayload: (ext, vctx) => Promise<TPayload>;
  getValue: (ext, vctx, payload, depth) => Promise<string>;
  getAssetRef?: (ext, vctx, payload, depth) => Promise<AssetRef | null>;
  editor?: VariableEditor<TPayload, TEditorState>;
}
```

`getValue` always returns a string. `getAssetRef` was added later
(when the content-addressed `_assets/` store landed) and was
intended to let variables produce binary content — but as of
ADR-0007 it is plumbed all the way through IPC and the isolated-vm
bootstrap, **and called from nowhere in production**. The
parallel-API surface didn't generalise; that's the seam ADR-0007
addresses.

Beak's own built-in variables (in
`packages/ui/src/features/variables/values/`) use an internal
sibling shape: `Variable<TPayload>` / `EditableVariable<TPayload>`,
identical to the public SDK but without the
`ExtensionContext` argument (built-ins talk to the host directly).

### 3. The renderer-side string collapse — `parseValueSections`

Resolution flows through one entry point:

```ts
// packages/ui/src/features/variables/parser.ts
async function parseValueSections(
  ctx: Context,
  parts: ValueSections,
  depth = 0,
  sensitiveMode = false,
): Promise<string>
```

It walks parts in order, looks each blob's variable up in
`VariableManager`, races each `getValue` call against a 600ms
timeout, concatenates the results, and returns a single string.
Recursion is capped at depth 5; sensitive variables short-circuit
to `[Sensitive mode enabled]` when the caller opts in. Errors are
logged and turn into empty strings — no diagnostic surface to the
UI.

Every consumer — URL builder, header flattener, JSON body
emitter, GraphQL variable composer, preview pane, basic-table
editor — calls `parseValueSections`. The function's
string-only return shape is the seam that prevents the variable
system from carrying anything else.

### 4. The file body — a parallel surface

Binary uploads were the awkward case. Rather than route them
through the variable system, v1 introduced a separate
`RequestBodyFile` variant on the `RequestBody` union:

```ts
// packages/types/request.d.ts
export interface RequestBodyFile {
  type: 'file';
  payload: {
    fileReferenceId?: string;        // legacy session-scoped handle
    contentType?: string;
    __hacky__binaryFileData?: Uint8Array;
    assetRef?: { sha256; size; contentType? };  // newer content-addressed pointer
  };
}
```

`fileReferenceId` is the original path-based reference. `assetRef`
was added when `_assets/` landed; it points into the project's
content-addressed store and survives across sessions. Flight prep
reads the bytes synchronously and shoves them into
`__hacky__binaryFileData` (the field name documents the smell),
which `@beak/requester-node` reads and passes to `node-fetch` as
a `Buffer`. The renderer is the bytes' choke point.

This works for the "a request body is one file" case. It does not
generalise to multipart/form-data, to binary content inside
JSON/headers, or to streaming uploads.

### 5. Sandboxing — `isolated-vm` per extension package

Extensions run in `isolated-vm` (V8 contexts with a 64MB memory
limit per package, 2-second boot timeout). The bootstrap script in
`apps-host/electron/src/lib/extension/index.ts:buildBootScript`
wraps the extension's bundled `main` in a CommonJS shim, injects an
`ExtensionContext` (logger + recursive `parseValueSections` callback),
validates each variable's metadata, and copies callable handles back
to the host. Extensions have no filesystem, no network, no `process`,
no `require`. The only host-provided functionality is what arrives on
`ExtensionContext`.

The renderer-side `VariableManager` registers built-ins by static
import; extension-contributed variables are registered by the
electron / web host through `ipcExtensionsService.registerExtension`.

### 6. Variable sets — text-keyed environments

Variable sets are Beak's environment mechanism. Each set is a
named map from items (e.g. `{User}.{name}`, `{Environment}.{host}`)
to values, where each item resolves through the special-cased
`variable_set_item` RTV. The value is always a string —
`VariableSetItem` has no kind discriminator.

This was right for environments-as-config-strings. It does not
support binary environment values (cert/key pairs, image fixtures),
which the ADR-0007 redesign addresses.

## Consequences

**What v1 gives us today.**

- Variables compose: a header value can contain a hash of a UUID
  joined with a literal — `parseValueSections` recurses to depth 5
  to support that.
- Extensions can ship without unbounded host access — the sandbox
  is real.
- Request files round-trip cleanly through `git diff` — value
  sections are JSON arrays.
- The variable-input editor renders the same `ValueSections` in
  every field (URL, headers, JSON properties, GraphQL variables)
  with one component.
- Sensitive values respect a `sensitiveMode` flag, so the
  preview pane and copy-as-curl can mask them.

**What v1 closes off.**

- **Everything collapses to a string.** Binary, blobs, and
  streams have no place in the resolver contract.
- **File bodies are not RTVs.** The parallel surface
  (`RequestBodyFile` + `__hacky__binaryFileData`) duplicates the
  variable system's substitution model with its own state, IPC,
  and UI affordances.
- **`getAssetRef` is dead scaffolding.** Added in good faith;
  never wired up to a real consumer. Documents the limit of
  parallel-API additions.
- **No multipart/form-data.** Users wanting it construct the
  multipart body by hand inside a `text` body.
- **No streaming uploads.** The whole request body materialises
  into renderer memory before IPC.
- **Variable-set items are text-only.** Binary environment values
  are impossible.
- **Diagnostics are mute.** Resolver errors log to console and
  surface as empty strings. The user has no signal that a
  variable failed.

**What this ADR doesn't change.**

This is a retrofit. The code is what it is. The point of writing
it down is so that ADR-0007 (in flight) reads as a deliberate
redesign of a documented system, not a rewrite of folklore.

## Alternatives considered

The decisions baked into v1 happened before any ADR process. The
alternatives below are reconstructed from commit history, tickets,
and conversation — not exhaustive.

- **A typed expression DSL** (Handlebars-style `{{uuid}}` /
  jinja-style `{{ now() }}` / `expr` language). Rejected: a DSL
  needs a parser, a lexer, an editor with syntax highlighting,
  and error recovery. A typed-array of literals + blobs sidesteps
  all that — the editor is a flat-document text input that lets
  pills be inserted by a picker.
- **A render-then-edit text representation** (template strings
  with sigil-delimited variable references, like
  `${variableId:payloadJSON}$`). Rejected: round-trip fidelity is
  brittle (what if a literal contains the sigil?), and parsing the
  serialised form back into pills on every editor mount is needless
  work compared to storing the structured array directly.
- **Render variables to JavaScript closures, persist as source.**
  Rejected: not serialisable through `git diff`; security
  nightmare; impossible to share across the renderer / host
  boundary.
- **Run extensions in a worker thread instead of `isolated-vm`.**
  Rejected: workers share the renderer's memory address space and
  global APIs (fetch, IndexedDB, structured clone). `isolated-vm`
  gives a true V8 isolate per package with no shared globals — the
  only way to keep extensions from leaking the host's state.
- **Make file bodies RTVs from day one.** Was not considered at the
  time. The split feels obvious in hindsight; in practice the
  file-body editor's UI affordances (preview, drag-drop, file
  picker) were easier to bolt onto a dedicated body type than to
  thread through the variable picker.

## References

- `packages/extension-sdk/src/index.ts` — public SDK contract.
- `packages/ui/src/features/variables/parser.ts` — the string
  collapse point.
- `packages/ui/src/features/variables/index.ts` — `VariableManager`
  registry; built-in vs external bookkeeping.
- `packages/ui/src/features/variables/values/` — the 20 built-in
  RTVs (digest, uuid, secure, timestamp, request-header, etc).
- `packages/ui/src/features/variable-input/components/VariableInput.tsx`
  — the editor that renders `ValueSections`.
- `packages/types/values.d.ts` — `ValueSections`, `ValueSection`,
  `Context` (the per-call resolution argument bag).
- `packages/types/request.d.ts` — `RequestBody` union including
  `RequestBodyFile` with `assetRef` / `fileReferenceId` /
  `__hacky__binaryFileData`.
- `packages/common/src/ipc/extensions.ts` — IPC contract for
  extension variable runtime (createDefaultPayload, getValue,
  getAssetRef, editor) and the recursive `parseValueSections`
  callback.
- `apps-host/electron/src/lib/extension/index.ts` —
  `isolated-vm` sandbox + bootstrap shim that materialises the
  `ExtensionContext` and wraps user callbacks.
- `packages/runtime-shared/src/assets/index.ts` — `AssetStore`
  content-addressed blob storage that backs `assetRef`.
- ADR [0007](0007-realtime-values-redesign.md) — the in-flight
  redesign that supersedes v1. The "What v1 closes off" list maps
  directly to 0002's "Where the rigidity bites" list.
- [`../features/realtime-values-v1.feature`](../features/realtime-values-v1.feature)
  — Gherkin acceptance criteria pinning down v1's observable
  behaviour.
