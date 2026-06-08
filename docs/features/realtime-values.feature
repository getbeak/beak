# See docs/adr/0007-realtime-values-redesign.md — the realtime-values
# redesign these scenarios pin down. Companion to
# docs/features/realtime-values-v1.feature, which captures the legacy
# system this supersedes.

Feature: Realtime values — binary, blobs, streams, multipart

  As a Beak user with non-string-shaped values to send
  I want realtime values to carry text, bytes, assets, and streams
  So that file uploads, multipart bodies, large transfers, and
  variable-set binaries all just work

  Background:
    Given the extension SDK is on apiVersion 2
    And the project has the `_assets/` store initialised

  # ---------- ResolvedValue + Sink coercion ----------

  Scenario Outline: Sink coercion routes producer kinds to consumer kinds
    Given a variable whose resolver returns "<producer>"
    And a consumer sink "<sink>"
    When the renderer resolves the value
    Then the consumer receives "<received>"

    Examples:
      | producer | sink   | received                                  |
      | text     | text   | the text identity                          |
      | text     | binary | UTF-8 encoded bytes                        |
      | text     | stream | a one-chunk stream of UTF-8 bytes          |
      | bytes    | text   | UTF-8 decoded text + a "binary in text" warning |
      | bytes    | binary | the bytes identity                         |
      | bytes    | stream | a one-chunk stream of the bytes            |
      | asset    | text   | UTF-8 decoded asset text + a warning       |
      | asset    | binary | the asset's bytes (read from `_assets/`)    |
      | asset    | stream | a chunked stream from `_assets/`           |
      | stream   | text   | drained UTF-8 text + a warning             |
      | stream   | binary | drained bytes                              |
      | stream   | stream | the stream identity                        |

  Scenario: A text sink that receives binary content marks the field invalid for flight
    Given a header field bound to an RTV that resolves to "bytes"
    When the renderer composes the request
    Then the field renders a "binary value in text context" diagnostic
    And the flight button is disabled with reason "field_value_invalid"
    And the UTF-8 decoded preview still renders for copy/inspection

  Scenario: Recursion depth is enforced uniformly across all sinks
    Given a chain of RTVs nested 6 deep
    When any sink resolves the outermost part
    Then resolution stops at depth 5
    And the field renders a "recursion limit reached" diagnostic

  # ---------- Multipart body ----------

  Scenario: Multipart body emits text and binary parts in order
    Given a request body of type "multipart"
    And the body has parts: [text("name", "Alice"), binary("avatar", asset:0xabc)]
    When the flight fires
    Then the outgoing request has Content-Type "multipart/form-data; boundary=<b>"
    And the wire bytes contain one part with name="name" and body "Alice"
    And the wire bytes contain one part with name="avatar", filename derived from the asset, and the asset's bytes
    And both parts use the same boundary

  Scenario: Multipart binary part streams from disk without materialising in renderer memory
    Given a multipart body with a 1 GB binary part backed by an asset
    When the flight fires
    Then the renderer does not allocate a 1 GB Uint8Array
    And the requester reads the asset via `AssetStore.readStream`
    And the bytes are piped into the outgoing request body chunk by chunk

  Scenario: Multipart boundary collisions are avoided
    Given the multipart body has no explicit boundary
    When the flight prepares
    Then a fresh ksuid-derived boundary is generated for this flight
    And the boundary does not appear anywhere in any part's bytes

  Scenario: Editor lets the user add and reorder multipart parts
    Given the request body type is set to "multipart"
    When the user clicks "Add text part"
    Then a new text part appears at the end of the list
    When the user clicks "Add file part"
    Then a new binary part appears at the end of the list
    When the user drags a part to a new position
    Then the parts are reordered and the request file is updated

  # ---------- Streaming uploads ----------

  Scenario: Asset-backed file body uses the asset shortcut on the wire
    Given a request with body type "file" and an attached assetRef
    When the flight fires
    Then the FlightRequest body carries a ValueProducerHandle of kind "asset"
    And no body bytes are sent over IPC
    And the requester opens a read stream from `_assets/<sha>/<sha>` directly

  Scenario: Inline bytes under 64 KiB pass through IPC inline
    Given a request body resolves to bytes of size 12 KiB
    When the FlightRequest is built
    Then the ValueProducerHandle is of kind "inline"
    And the bytes are carried in the structured-clone IPC payload

  Scenario: Stream producer registers, pulls with backpressure, and tears down
    Given an RTV resolves to a stream of 4096-byte chunks
    When the flight prepares
    Then the renderer registers the stream in StreamRegistry under a fresh streamId
    And the FlightRequest body carries a ValueProducerHandle of kind "stream"
    When the requester pulls from `IpcStreamService.pull(streamId, 4096)`
    Then it receives one chunk per call
    And the final call returns `{ done: true }`
    And the registry releases the stream

  Scenario: Renderer-initiated flight cancellation tears down a streaming upload
    Given a streaming upload is in flight
    When the renderer aborts the flight
    Then `IpcStreamService.cancel(streamId)` is invoked
    And the requester closes the outgoing request body
    And the StreamRegistry releases the stream
    And no further `pull` calls succeed for that streamId

  # ---------- Variable-set blobs ----------

  Scenario: Variable-set item can hold an asset
    Given the user toggles a variable-set item from "Text" to "File"
    And attaches an image
    When the user references `{Environment}.{tlsClientCert}` from a header
    Then a "binary in text context" diagnostic appears on the header
    When the user references the same value from a multipart binary part
    Then the resolver returns `{ kind: 'asset', ref }` and the wire emission uses the asset shortcut

  Scenario: Variable-set assets travel with the project
    Given an asset is attached to a variable-set item
    When the project is opened on a second machine after a clone
    Then the asset bytes are present under `_assets/<sha>/<sha>`
    And the variable resolves the same as on the original machine

  # ---------- Streaming responses as RTV input ----------

  Scenario: `{response_body_stream}` yields chunks as they arrive
    Given a flight F1 is in flight against an SSE upstream
    And the renderer subscribes to `binaryStore.subscribe(F1.binaryStoreKey)`
    When a chunk lands on F1
    Then the subscriber yields that chunk
    And buffered prior chunks are replayed on subscribe

  Scenario: A consumer pins its source flight against eviction
    Given F1 has completed and would normally be evicted from history
    And a follow-up RTV is still reading F1's stream
    When history eviction runs
    Then F1 is retained (refcount > 0)
    And eviction reclaims F1 only after the consumer finishes

  # ---------- SDK + extension loading ----------

  Scenario: A legacy v1 extension fails to load with a clear error
    Given an extension declares `apiVersion: 1` in its package.json
    When Beak attempts to load it
    Then the load fails with Squawk "extension_unsupported_api_version"
    And no isolate is created

  Scenario: An extension contributes a binary-producing variable
    Given an extension's variable's `resolve` returns `{ kind: 'bytes', bytes, contentType: 'application/x-protobuf' }`
    When the user inserts that variable into a multipart binary part
    And fires the request
    Then the wire emission carries those bytes with that contentType

  Scenario: `resolve` is the only required method
    Given an extension's variable defines `resolve` but no other lifecycle method
    When Beak loads it
    Then the load succeeds
    And the variable is registered against its fully-qualified type

  Scenario: A variable with `editor` still works as editable
    Given a variable defines a `resolve` and an `editor`
    When the user double-clicks the inserted blob
    Then the editor sheet renders the declared UISections
    And `load`/`save` round-trip the payload as before

  # ---------- Migration safety nets ----------

  Scenario: Existing projects without multipart bodies load unchanged
    Given a project file uses body types `text`, `json`, `json_raw`, `url_encoded_form`, `file`, `graphql`, `grpc`
    When the project opens against the redesigned RTV system
    Then all bodies parse against `bodySchemaSchema` unchanged
    And no field is silently rewritten

  Scenario: Asset-backed file bodies migrate cleanly to ValueProducerHandle
    Given a request file has `body.payload.assetRef` set and no `fileReferenceId`
    When the flight prepares
    Then `__hacky__binaryFileData` is not present on the FlightRequest
    And the body carries a ValueProducerHandle of kind "asset" with the same sha256

  Scenario: Legacy `fileReferenceId`-only bodies still fire
    Given a request file has `body.payload.fileReferenceId` and no `assetRef`
    When the flight prepares
    Then the legacy `readReferencedFile` path is used
    And the wire result matches the pre-redesign behaviour
