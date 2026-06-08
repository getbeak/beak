# See docs/adr/0008-realtime-values-v1-retrofit.md — retroactive ADR for
# the v1 RTV system, now superseded by 0007. This
# file is the frozen description of the legacy behaviour;
# the companion spec (realtime-values.feature) covers the new system.

Feature: Realtime values v1 — the original variable system

  As a Beak user composing requests with computed values
  I want fields to mix literal text with variable references
  So that headers, URLs, and bodies can splice in UUIDs, timestamps,
  environment lookups, and prior-flight response data without leaving
  the editor

  Background:
    Given the renderer is on apiVersion 1 of the extension SDK
    And the VariableManager has the 20 built-in variables registered

  # ---------- ValueSections — the persisted shape ----------

  Scenario: A literal-only ValueSections array round-trips through the request file
    Given a header value of `["Bearer abc123"]`
    When the request file is saved and reopened
    Then the header value loads as `["Bearer abc123"]` byte-identical

  Scenario: A blob in ValueSections persists its type and payload as JSON
    Given a header value of `["Bearer ", { "type": "uuid", "payload": { "version": "v4" } }]`
    When the request file is saved
    Then `git diff` shows the blob as a JSON object with `type` and `payload`
    And reopening the file rehydrates the same array

  Scenario: An unknown variable type persists across sessions even when the extension is missing
    Given a value-sections array contains a blob with `type: "external:some-pkg/foo"`
    And the contributing extension is not installed
    When the request file is reopened
    Then the unknown blob renders as a "⚠ extension missing" pill in the editor
    And the array is preserved exactly when saved again (the pill is not stripped)

  # ---------- parseValueSections — the string collapse ----------

  Scenario: Literal strings concatenate without any RTV calls
    When the renderer calls `parseValueSections(ctx, ["a", "b", "c"])`
    Then the result is `"abc"`
    And no variable resolver is invoked

  Scenario: A typed blob's getValue result is spliced into the string
    Given the variable `uuid` is registered and returns `"a-uuid"`
    When the renderer calls `parseValueSections(ctx, ["prefix-", { type: "uuid", payload: {} }])`
    Then the result is `"prefix-a-uuid"`

  Scenario: A missing variable resolves to an empty string
    Given no variable is registered for type `"ghost"`
    When the renderer calls `parseValueSections(ctx, [{ type: "ghost", payload: {} }])`
    Then the result is `""`
    And no error is raised to the UI

  Scenario: An RTV throwing collapses to an empty string and logs to console
    Given the variable `boom` is registered and `getValue` throws
    When the renderer calls `parseValueSections(ctx, [{ type: "boom", payload: {} }])`
    Then the result is `""`
    And the console has an error line containing `"Failed to get value from boom"`

  Scenario: Recursion stops at depth 5
    Given a chain of variables nested 6 deep
    When the renderer calls `parseValueSections` on the outermost part
    Then resolution stops at depth 5
    And the result for the truncated branch is the literal text `"[Recursion detected]"`

  Scenario: An RTV exceeding the 600 ms per-call budget resolves to an empty string
    Given the variable `slowpoke` is registered and `getValue` takes 700 ms
    When the renderer calls `parseValueSections(ctx, [{ type: "slowpoke", payload: {} }])`
    Then the result is `""`
    And the console has an error line containing `"exceeded 600ms"`

  Scenario: Sensitive variables short-circuit when sensitiveMode is enabled
    Given the variable `apiKey` is registered with `sensitive: true` and `getValue` returns `"super-secret"`
    When the renderer calls `parseValueSections(ctx, [{ type: "apiKey", payload: {} }], 0, true)`
    Then the result is `"[Sensitive mode enabled]"`
    And `getValue` is not invoked

  Scenario: Sensitive variables resolve normally when sensitiveMode is disabled
    Given the variable `apiKey` is registered with `sensitive: true` and `getValue` returns `"super-secret"`
    When the renderer calls `parseValueSections(ctx, [{ type: "apiKey", payload: {} }], 0, false)`
    Then the result is `"super-secret"`

  # ---------- v1 SDK contract — getValue + getAssetRef ----------

  Scenario: A v1 extension with getValue loads into an isolated-vm sandbox
    Given an extension declares `apiVersion: 1` in `package.json`
    And the extension exports a variable with `id`, `name`, `description`, `createDefaultPayload`, and `getValue`
    When Beak loads the extension
    Then a new `ivm.Isolate` is allocated for the package (memory limit 64 MB)
    And the extension's variables are registered under `external:<package-name>/<id>`
    And the variables appear in the variable picker

  Scenario: An extension declaring `apiVersion` other than 1 fails to load
    Given an extension declares `apiVersion: 99` in its exported definition
    When Beak attempts to load it
    Then the load throws "Extension declared an unsupported apiVersion: 99"
    And no isolate retains the extension

  Scenario: An extension whose default export is missing or non-object fails to load
    Given an extension's `module.exports` is `undefined`
    When Beak attempts to load it
    Then the load throws a "did you forget to export default defineExtension(...)?" error

  Scenario: A v1 extension with getAssetRef declares itself binary-capable in metadata
    Given an extension's variable defines `getAssetRef` alongside `getValue`
    When Beak loads the extension
    Then the loaded variable metadata's `binary` flag is `true`
    And the IPC wires `variableGetAssetRef` for that variable type

  Scenario: getAssetRef is plumbed end-to-end but unused by production callers
    Given a v1 variable exposes `getAssetRef`
    When any production code path resolves a value-section containing that variable
    Then `getValue` is called (never `getAssetRef`)
    And the binary content path remains dormant scaffolding until ADR-0007 lands

  Scenario: Extensions cannot reach Node, the filesystem, or the network
    Given a v1 extension's bundled source tries to `require('fs')`
    When the isolated-vm boot script runs
    Then the require resolves to `undefined` (the CommonJS shim provides no real module loader)
    And the extension's variable still loads if `require('fs')` was guarded behind a try/catch

  Scenario: Extension callbacks receive ExtensionContext as the first argument
    Given a v1 extension's `getValue(extCtx, varCtx, payload, depth)` callback
    When the renderer requests a value
    Then the host passes a host-provided `extCtx` carrying `log` and `parseValueSections`
    And the host passes the `varCtx` from the renderer (project tree, variable sets, flight history)

  # ---------- File body — the parallel surface ----------

  Scenario: A file body with an assetRef reads bytes from the content-addressed store
    Given a request has body `{ type: "file", payload: { assetRef: { sha256, size } } }`
    When the flight prepares
    Then `ipcAssetsService.read({ ref })` returns the bytes
    And `FlightRequest.body.payload.__hacky__binaryFileData` carries those bytes

  Scenario: A file body with only a fileReferenceId uses the legacy session-scoped handle
    Given a request has body `{ type: "file", payload: { fileReferenceId: "abc" } }`
    When the flight prepares
    Then `ipcFsService.readReferencedFile("abc")` returns the bytes
    And `FlightRequest.body.payload.__hacky__binaryFileData` carries those bytes

  Scenario: A file body with no asset or file pointer prepares with an empty text body
    Given a request has body `{ type: "file", payload: {} }`
    When the flight prepares
    Then `FlightRequest.body` is `{ type: "text", payload: "" }`
    And no upload payload is sent on the wire

  Scenario: Missing asset surfaces an error to the console and degrades to empty text
    Given a request has body `{ type: "file", payload: { assetRef: { sha256: <missing>, size } } }`
    When the flight prepares
    Then the console logs "asset missing from project store <sha256>"
    And `FlightRequest.body` is `{ type: "text", payload: "" }`

  Scenario: The file body is not a variable
    Given a request body has type "file"
    When the renderer composes the request
    Then `parseValueSections` is not invoked for the body
    And the body bytes never flow through the VariableManager

  # ---------- Variable sets — text-only items ----------

  Scenario: A variable-set item holds a string-typed `ValueSections`
    Given a variable set "Environment" defines an item `host` with value `["api.example.com"]`
    When `parseValueSections(ctx, [{ type: "variable_set_item", payload: { itemId: "host" } }])` runs
    Then the result is `"api.example.com"`

  Scenario: A variable-set item with a nested RTV recurses
    Given a variable set "User" defines `bearer` as `["Bearer ", { type: "uuid", payload: {} }]`
    When `parseValueSections(ctx, [{ type: "variable_set_item", payload: { itemId: "bearer" } }])` runs
    Then the result is `"Bearer <a-uuid>"`
    And the recursive call increments depth by one

  Scenario: A variable-set item cannot hold binary content
    Given the user wishes to bind `Environment.tlsClientCert` to a file
    When the user opens the variable-set editor
    Then no "binary" or "file" toggle exists on the item row
    And the only persistable value is a `ValueSections` array of strings

  # ---------- Variable-input editor — blob/text composition ----------

  Scenario: The user types literal text into a value-input field
    Given the value-input is mounted with an empty value
    When the user types "hello"
    Then the persisted `ValueSections` is `["hello"]`

  Scenario: The user inserts a variable from the picker between two literals
    Given the value-input contains `["before-", "after"]`
    When the user opens the picker, selects "UUID v4", and confirms
    Then the persisted `ValueSections` is `["before-", { type: "uuid", payload: { version: "v4" } }, "after"]`
    And the rendered editor shows two text segments with a pill between them

  Scenario: An external extension blob renders with the extension category
    Given the value-input contains a blob with `type: "external:pkg/foo"`
    When the editor renders the pill
    Then the pill's `data-category` attribute is "extension"

  Scenario: An internal RTV blob renders with the builtin category
    Given the value-input contains a blob with `type: "uuid"`
    When the editor renders the pill
    Then the pill's `data-category` attribute is "builtin"

  Scenario: A variable_set_item blob renders with the env category
    Given the value-input contains a blob with `type: "variable_set_item"`
    When the editor renders the pill
    Then the pill's `data-category` attribute is "env"
    And the pill label resolves the item name via the active selected set

  Scenario: An empty span emits a zero-width caret anchor
    Given the editor renders a `ValueSections` of `["", { type: "uuid", payload: {} }, ""]`
    When the renderer emits HTML
    Then a zero-width space anchor sits before and after the pill
    And the saved `ValueSections` round-trips with the anchor stripped

  # ---------- Cross-cutting — what v1 does not do ----------

  Scenario: The resolver has no Sink-aware path
    Given any consumer (header, URL, body, multipart)
    When the consumer resolves a `ValueSections`
    Then the same `parseValueSections(...)` is called
    And the return type is `Promise<string>` regardless of where the value is going

  Scenario: There is no multipart body type
    Given a user inspects the body-type picker on a request
    Then the available options are: text, json, json_raw, url_encoded_form, file, graphql, grpc
    And no "multipart" option is offered

  Scenario: There is no streaming upload path
    Given a request body resolves to bytes
    When the flight prepares
    Then the entire payload is materialised as a `Uint8Array` in the renderer
    And the `Uint8Array` is structured-cloned across IPC to the requester
    And the requester re-materialises it as a `Buffer` and hands it to `node-fetch`

  Scenario: There is no diagnostic surface for resolver errors
    Given any RTV failure (missing variable, thrown getValue, timeout)
    When the resolver collapses the failure to an empty string
    Then no field-level indicator appears in the UI
    And no notification is shown to the user
