# 0007 — Realtime-values redesign: binary, blobs, streams, multipart

- **Status:** Accepted
- **Date:** 2026-06-08
- **Deciders:** Alexander Forbes-Reed

## Context

Realtime values (RTVs) are Beak's expression mechanism — every editable
field on a request stores a `ValueSections` array (`(string | { type,
payload })[]`) and the variable manager resolves it to a final wire
value at flight time. Two years of additions later the pipeline was
calcified:

1. **Everything collapsed to a string.**
   `parseValueSections(ctx, parts) → Promise<string>` was the only
   resolver. The SDK contract (`VariableDefinition.getValue → Promise<string>`)
   matched. Headers, URL parts, JSON properties, form fields, GraphQL
   variables — all paths ran through the same string-only collapse.

2. **Binary was wedged in as a parallel surface.**
   `Variable.getAssetRef → Promise<AssetRef | null>` was added when
   the content-addressed `_assets/` store landed. The renderer-side
   resolver (`packages/ui/src/features/variables/binary.ts`) existed,
   had tests, **and was called from nowhere in production**. The shape
   "first AssetRef wins, anything after is discarded" was a hack that
   didn't generalise.

3. **File bodies weren't RTVs.**
   `RequestBodyFile` was a separate `RequestBody` variant carrying
   either a legacy session-scoped `fileReferenceId` or an `assetRef`.
   Flight prep read the bytes synchronously and shoved them into
   `__hacky__binaryFileData: Uint8Array`. The field name documented
   the smell.

4. **There was no multipart body type.**
   Users hit a wall when an endpoint wanted `multipart/form-data` with
   mixed text + file parts. The only escape hatch was constructing
   a multipart blob by hand in a `text` body and praying the boundary
   was right.

5. **Request bodies didn't stream.**
   The whole body was materialised into a `Uint8Array` in renderer
   memory, structured-cloned across IPC, then re-materialised in
   `@beak/requester-node` and handed to `node-fetch` as a `Buffer`.
   Response streaming existed (chunked heartbeats + SSE parser) but
   the produced bytes couldn't be piped back into a subsequent RTV.

6. **Variable-set items were text-only.**
   You couldn't bind `{Environment}.{tlsClientCert}` to a file or
   `{User}.{avatar}` to an image. Either the value was a string or
   the variable didn't exist.

7. **Extensions couldn't compute binary.**
   The isolated-vm sandbox forbids fs/network. An extension that
   wanted to emit, say, a freshly-encoded protobuf or a derived
   ECDSA signature blob, had to round-trip those bytes through the
   host's asset writer first — a hop with no story.

The user-facing capabilities we need:

- **Files** as first-class RTV outputs — `{getFromS3}` returns an
  asset; `{userAvatar}` lives on a variable set; multipart parts pull
  from either.
- **Binary data** as a value kind that isn't a file on disk — a
  computed digest blob, a generated certificate, an encoded protobuf.
- **Blobs** in environments — variable sets carrying binary values
  (cert/key pairs, image fixtures, fixture archives).
- **Streaming** request bodies for large uploads and streaming
  *responses* that downstream RTVs can iterate over (so SSE / ndjson
  / gRPC streams can feed into chained requests).

The legacy v1 system this ADR supersedes is documented for the record
in [0008](0008-realtime-values-v1-retrofit.md).

This ADR sits on top of the architectural set
[0002](0002-domain-ownership-and-rendering-data-path.md)–[0006](0006-host-ports-and-adapters.md):
every cell it touches (state slice, common types, renderer service,
host port, host adapter) is one of the domain paths declared in
[0002 §1](0002-domain-ownership-and-rendering-data-path.md).

## Decision

Redesign the RTV pipeline around a typed `ResolvedValue` discriminated
union, introduce a `multipart` body type that carries value-sections
parts natively, and stream binary end-to-end from renderer to wire.

This is a **breaking change** to the extension SDK contract. Beak has
no third-party extensions in the wild yet, so the new contract ships
without a coexistence story — extensions declaring the legacy
`apiVersion: 1` fail to load. The SDK and the bootstrap script flip to
`apiVersion: 2` in the same change.

### 1. The `ResolvedValue` union and `Sink` matching

Per [0003 §1](0003-schemas-and-ipc-types-home.md), the public type
contracts ship from `@getbeak/extension-sdk` and are re-exported from
`@beak/common` for internal use:

```ts
// packages/extension-sdk/src/index.ts
export type ResolvedValue =
  | { kind: 'text'; text: string; contentType?: string }
  | { kind: 'bytes'; bytes: Uint8Array; contentType?: string }
  | { kind: 'asset'; ref: AssetRef }
  | { kind: 'stream'; stream: ReadableStream<Uint8Array>; size?: number; contentType?: string };

export type Sink =
  | { kind: 'text' }     // headers, url, query, form fields, JSON, GraphQL vars
  | { kind: 'binary' }   // file body, multipart binary part
  | { kind: 'stream' };  // streaming upload, response-as-input

export interface ResolveContext {
  variableContext: VariableContext;
  sink: Sink;
  depth: number;
}

export interface VariableDefinition<TPayload, TEditorState = TPayload> {
  id: string;
  name: string;
  description: string;
  sensitive?: boolean;
  keywords?: string[];
  attributes?: VariableAttributes;
  createDefaultPayload: (ext: ExtensionContext, vctx: VariableContext) => Promise<TPayload> | TPayload;
  resolve: (ext: ExtensionContext, rctx: ResolveContext, payload: TPayload) => Promise<ResolvedValue>;
  getContextAwareName?: (payload: TPayload) => string;
  editor?: VariableEditor<TPayload, TEditorState>;
}
```

The legacy `getValue` and optional `getAssetRef` are removed. Every
variable, internal or extension-contributed, implements `resolve`.

The renderer-side resolver (replacing `parseValueSections` +
`parseValueSectionsForBinary`) walks `ValueSections`, calls each
part's `resolve` with the consumer's `Sink`, then coerces between
representations using a closed table:

| Producer → | text                   | bytes              | asset              | stream                |
| ---------- | ---------------------- | ------------------ | ------------------ | --------------------- |
| → text     | identity               | UTF-8 decode¹      | sha prefix¹        | drain + UTF-8¹        |
| → binary   | UTF-8 encode           | identity           | identity           | drain to bytes        |
| → stream   | one-chunk stream       | one-chunk stream   | open asset stream  | identity              |

¹ UTF-8 decode of a binary asset for a text sink is a *user error*,
not a silent coercion. We surface a "binary value in text context"
diagnostic on the field; we still produce a result (so a curl preview
doesn't crash) but mark the field invalid for flight.

`Sink: 'text'` is the default for backwards compatibility — every
existing call-site that resolves to a string keeps working with no
change beyond the SDK contract update.

The renderer service that owns this resolution lives at
`packages/ui/src/features/variables/` per
[0004 §1](0004-service-layer-in-ui.md). Built-in RTVs continue to
live as domain-internal helpers under `features/variables/values/`.

### 2. Multipart as a first-class body type

```ts
// packages/common/src/types/beak-project.d.ts (or domain-equivalent)
export interface RequestBodyMultipart {
  type: 'multipart';
  payload: {
    /** Optional explicit boundary; defaults to a fresh ksuid at flight time. */
    boundary?: string;
    parts: MultipartPart[];
  };
}

export type MultipartPart =
  | {
      kind: 'text';
      name: ValueSections;
      value: ValueSections;
      contentType?: string;
    }
  | {
      kind: 'binary';
      name: ValueSections;
      filename?: ValueSections;
      value: ValueSections;          // resolves via Sink: 'binary' or 'stream'
      contentType?: ValueSections;
    };
```

The editor renders a vertically-stacked list of parts with an
add-part dropdown (text / file). Each part's `value` is a
`ValueSections` — the existing variable-input component is reused
unchanged.

Wire emission happens in the requester (Electron and agent). The
boundary is materialised, each part headers + value emitted, value
streams threaded through. The renderer never builds the multipart
bytes — that's the requester's job, identical on both shells.

`RequestBodyFile` stays, narrowed to "a request whose *entire* body
is one binary value" — the common upload-a-file case.

### 3. Streaming end-to-end

Streaming has two halves: producer (RTV returning `{ kind: 'stream' }`)
and consumer (wire layer accepting `ReadableStream<Uint8Array>`).

**Producer side (renderer):** A variable can return a stream. Built-in
example: the new `{response_body_stream}` RTV pipes a flight's live
response chunks into the next request. The asset store grows a
`readStream(ref): ReadableStream<Uint8Array>` method that the host
implements as `fs.createReadStream` (Electron) or an `lightning-fs`
chunked read (web). The asset-store port is one of those declared in
[0006 §3](0006-host-ports-and-adapters.md).

**Wire side — Electron host:** The IPC payload no longer carries
`__hacky__binaryFileData`. Instead, a `FlightRequest` body that is
binary/stream carries a `ValueProducerHandle`:

```ts
// packages/common/src/types/value-producers.ts
export type ValueProducerHandle =
  | { kind: 'asset'; ref: AssetRef }                        // requester reads from disk
  | { kind: 'inline'; bytes: Uint8Array }                   // small (<64KB) inline pass-through
  | { kind: 'stream'; streamId: string; contentType?: string };  // producer registry handle
```

Streams are registered on the renderer in a per-flight `StreamRegistry`
keyed by `streamId`. The requester (main process) requests chunks via
a new `IpcStreamServiceMain` with backpressure (`pull(streamId, n) →
{ chunk: Uint8Array; done: boolean }`). The requester writes chunks
into the outgoing `node-fetch` request body using a
`ReadableStream<Uint8Array>` wrapper.

**Wire side — agent host:** The agent already accepts `POST /flight`
with the flight payload as JSON. We add `POST /flight` with
`Content-Type: multipart/form-data` where the form has two fields:
`payload` (the flight metadata) and `bodyStream` (the raw bytes,
streamed). The renderer's `fetch()` call uses a `ReadableStream` body;
the agent pipes the form field directly to the upstream request body.

**Asset shortcut:** When the body resolves to an asset (the common
case — a user attached a file), the renderer passes `{ kind: 'asset',
ref }` and the requester reads directly from disk. **No bytes cross
IPC.**

### 4. Variable-set items can hold any `ResolvedValue` kind

```ts
// packages/common/src/types/variable-sets.ts (canonical home per ADR 0003)
export interface VariableSetItem {
  kind: 'text' | 'asset';      // 'asset' is new
  text?: string;               // when kind === 'text'
  ref?: AssetRef;              // when kind === 'asset'
}
```

The Variable Set editor grows a per-row type toggle (Text / File). The
"File" toggle reuses the existing `pickAndAttachAsset` flow. The
`variable_set_item` RTV returns `{ kind: 'asset', ref }` when the
underlying item is a file — and the `Sink` coercion handles the rest.

### 5. Streaming responses as RTV input

`response_body_stream` is a new built-in RTV. Its `Sink: 'stream'`
resolver returns a stream backed by the in-progress flight's
heartbeats — the existing `binaryStore` grows a `subscribe(key)`
method that yields chunks as they arrive (and replays buffered chunks
on subscribe).

Cross-request streaming has subtle lifetime concerns: the producing
flight might complete or be evicted from history before the consumer
finishes reading. We resolve those at the registry layer (refcount
+ pin) rather than in the RTV itself — pinning the source flight for
the duration of any consumer's read.

### 6. Bootstrap script + IPC

`apps-host/electron/src/lib/extension/index.ts:buildBootScript`
validates `apiVersion === 2` and requires the variable definition to
expose a `resolve` callback. The IPC contract on
`packages/common/src/ipc/extensions.ts` retires
`VariableGetValue` / `VariableGetAssetRef` in favour of a single
`VariableResolve` message; the runtime port
(`packages/runtime-shared/src/ports/extension-runtime.ts`) follows
the same shape with `variableResolve`.

## Consequences

- **What we gain.**
  - Files, binary, blobs, and streaming become first-class — the four
    capabilities the original ask names.
  - Multipart/form-data works without users writing the wire format
    by hand.
  - 1GB uploads no longer trip on renderer memory; the wire path is
    `disk → node-fetch` with no Uint8Array hops.
  - Variable sets can hold binary environment values.
  - Streaming responses feed forward into chained requests.
  - The extension SDK gets a coherent single-resolver story; the
    `getValue`/`getAssetRef` parallel API is gone.

- **What it costs.**
  - Every built-in RTV (20 files in `values/`) is rewritten.
  - The isolated-vm bootstrap script changes; one round of careful
    re-validation needed (it's a vector for sandbox escapes).
  - Both hosts (Electron + agent) grow new IPC / HTTP handling for
    streaming producers. The agent's wire contract gains a multipart
    upload mode.
  - A new `StreamRegistry` + `IpcStreamService` lifecycle to maintain
    (eviction, error propagation, cancellation).
  - **v1 extensions stop working.** No third-party extension has
    shipped publicly yet, so the blast radius is internal.

- **What we punt.**
  - **Chained / multi-stage requests.** Streaming a response into a
    follow-up request needs request-chaining infrastructure we
    don't have yet. The plumbing for `response_body_stream` lands
    here; the UX for chaining is a separate ADR.
  - **Binary in JSON properties.** A `bytes`-kind value flowing into
    a JSON value sink could plausibly base64-encode itself. We
    deliberately don't auto-encode — that's surprising magic. Users
    who want base64 wrap with `{base64Encode}` explicitly.
  - **gRPC streaming method invocation.** gRPC server-streaming
    responses already work; bidi-streaming method bodies are a
    separate problem that hooks into the same `Sink: 'stream'`
    machinery when we get there.

## Alternatives considered

- **Keep v1, additive only — add `resolve` next to `getValue` and
  `getAssetRef`.** Rejected. The API surface bloats; the
  `Sink`-based coercion table doesn't have a clean home next to two
  parallel methods; adding a `'stream'` kind would be a *third*
  parallel method.
- **Multipart as an internal RTV that yields a giant bytes value.**
  Rejected. The Content-Type still needs to be `multipart/form-data;
  boundary=...` set by the body, which means special-casing the
  resolver anyway. And streaming a 1GB part through a "render to
  bytes" RTV defeats the streaming goal.
- **Chunked heartbeats for upload.** Rejected as the streaming
  transport. True streaming over IPC is marginally harder to build
  but the only path that doesn't double the bytes-in-memory ceiling.
- **Single `Value` type — drop the discriminator, use a `Blob`-like
  shape.** Rejected. We *want* the producer/consumer to negotiate
  via Sink; collapsing to one type forces all consumers to handle
  all kinds, which is exactly the rigidity we're fleeing.
- **Coexistence period: ship both v1 and v2 in parallel until
  third-party extensions migrate.** Rejected — no third-party
  extensions exist yet. The cleanest moment to break the contract
  is now.

## References

- [0002](0002-domain-ownership-and-rendering-data-path.md) — RTVs
  span every cell of the domain layout this ADR's pieces fill in.
- [0003](0003-schemas-and-ipc-types-home.md) — where
  `ResolvedValue`, `Sink`, `ValueProducerHandle`, `MultipartPart`,
  and the variable-set item shape canonically live.
- [0004](0004-service-layer-in-ui.md) — defines the renderer-side
  home for the resolver and the built-in RTVs.
- [0006](0006-host-ports-and-adapters.md) — the asset-store and
  stream-host ports this ADR adds adapters for.
- [0008](0008-realtime-values-v1-retrofit.md) — the v1 system this
  redesign supersedes.
- `packages/extension-sdk/src/index.ts` — new SDK surface.
- `packages/ui/src/features/variables/resolver.ts` — new
  `resolveValueSections` entry point.
- `packages/ui/src/features/variables/parser.ts` — thin text-sink
  wrapper kept for the existing ~30 call sites; removed when those
  callers spell `resolveValueSections` directly.
- `packages/common/src/ipc/extensions.ts` — `VariableResolve`
  replaces `VariableGetValue` + `VariableGetAssetRef`.
- `apps-host/electron/src/lib/extension/index.ts` — bootstrap
  validates `apiVersion === 2` and requires `resolve`.
- ADR [0001](0001-local-agent-for-web-host.md) — the agent's wire
  contract; this ADR extends it with a multipart upload mode.
- [`../features/realtime-values.feature`](../features/realtime-values.feature) —
  acceptance scenarios for the new system.
- [`../features/realtime-values-v1.feature`](../features/realtime-values-v1.feature) —
  frozen description of the legacy v1 behaviour superseded by this ADR.
