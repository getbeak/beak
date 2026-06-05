# Agent wire contract

Source-of-truth schemas for the local-agent HTTP API
(`docs/adr/0001-local-agent-for-web-host.md`). Each schema is a Zod
object; the renderer uses it as a runtime validator at the IPC
boundary, and Zod's `z.infer` exposes a TypeScript type for static
checks.

## Files

- [`flight.ts`](flight.ts) — `POST /flight` request envelope, the SSE
  heartbeat discriminated union (`fetch_response | head_received |
  reading_body | sse_event`), terminal `complete`/`failed` events.
- [`healthz.ts`](healthz.ts) — `GET /.beak/agent/healthz` response
  (`agent`, `version`, optional HMAC `signature` of a renderer-supplied
  `nonce`).
- [`pairing.ts`](pairing.ts) — `/pair` query, `/pair/token` request +
  response + error.
- [`index.ts`](index.ts) — re-exports plus constants
  (`AGENT_PORT_RANGE_START/END`, `AGENT_HEALTHZ_PATH`, etc.).

## Future: codegen to Go

The plan (`docs/adr/0001-local-agent-for-web-host.md`, Decision §2) is
to add `pnpm wire-gen` that:

1. Runs every schema in this directory through
   [`zod-to-json-schema`](https://www.npmjs.com/package/zod-to-json-schema)
   and writes `generated/*.schema.json`.
2. Runs [`go-jsonschema`](https://github.com/atombender/go-jsonschema)
   against the JSON Schemas to emit
   `apps-host/agent/internal/wire/wire.gen.go`.
3. CI runs `pnpm wire-gen --check` and fails on drift.

For the initial agent ship the Go structs in
`apps-host/agent/internal/wire/wire.go` are **hand-written** to match
these Zod schemas. Drift detection is by convention until the
codegen script lands. Treat any change to these Zod files as a
contract change that needs a matching Go edit.
