# 0001 — Local agent for the web host

- **Status:** Accepted
- **Date:** 2026-06-05
- **Deciders:** Alexander Forbes-Reed

## Context

Beak ships three shells with one renderer (`@beak/ui`). Two of them
fire HTTP requests fine:

- **`apps-host/electron`** — main process runs Node + `@beak/requester-node`.
  No CORS, no sandboxing.
- **`apps-host/web`** — Vite-built web shell. The requester at
  `apps-host/web/src/requester/index.ts` calls `window.fetch()`
  directly, so **every flight is subject to browser CORS**.

The web host's CORS situation is a non-starter for an API crafter:
most production APIs don't ship `Access-Control-Allow-Origin` for our
origin; intranet APIs and `localhost:*` are doubly unreachable; custom
headers trigger preflights the target doesn't expect; we can't set
the `Origin` header.

We need to execute the actual HTTP request **outside the browser
sandbox** for the web host, while keeping the renderer code path
identical to Electron's (same flight protocol, same heartbeats, same
UI). A Beak-operated server-side proxy is rejected — it would sit on
the request path of all user traffic (privacy, liability, intranet
unreachability, ops cost). A browser extension is rejected — per-
browser stores, scary install warnings, Safari's painful extension
story, doesn't help with intranet APIs.

## Decision

Ship **`@beak/apps-host-agent`**: a small cross-platform menu-bar
process that the web host pairs with and routes flights through.
Traffic stays on the user's machine; Beak operates no relay.

Six concrete sub-decisions follow, captured in one place because
they're tightly coupled and the feature is small enough not to
warrant six separate ADRs.

### 1. Runtime — Go

Go single-binary per arch (~10MB, <50ms cold-start). Stdlib
`net/http` for the loopback server; `getlantern/systray` for the
tray icon. Build matrix: `darwin/{arm64,amd64}`,
`windows/{amd64,arm64}`, `linux/{amd64,arm64}`.

Rejected: Node SEA/pkg (40–80MB, awkward tray story), Rust (zero
existing Rust expertise; longer compile times). Reusing
`@beak/requester-node` directly was tempting but loses the
single-binary win.

### 2. Wire contract — Zod source-of-truth → JSON Schema → Go structs

Schemas live in `packages/common/src/wire/agent/` as Zod files. A
build script (`pnpm wire-gen`) emits JSON Schema documents and Go
structs into checked-in generated files. CI runs `pnpm wire-gen
--check` and fails on drift. The renderer keeps using Zod for IPC
runtime validation (same pattern as today's `StartFlightSchema` in
`packages/common/src/ipc/flight.ts`).

Rejected: hand-maintained parallel types (silent drift inevitable),
Protobuf (overkill, breaks curl-debuggability), OpenAPI (awkward TS
client codegen), `tygo` (one-way; loses JSON Schema artefact).

### 3. Transport — `POST /flight` with `text/event-stream` response

The renderer POSTs the `FlightRequestPayload` as JSON; the agent
streams heartbeats back as SSE frames, one per heartbeat, with
`event:` carrying the discriminator (`fetch_response`,
`head_received`, `reading_body`, `sse_event`, `complete`, `failed`).
Binary body chunks are base64-encoded in `payload.buffer` (SSE is
line-oriented UTF-8). After the terminal event, the agent closes
the stream.

Cancellation: renderer closes the response stream; agent observes
`r.Context().Done()` and cancels the upstream request + flight
goroutine. No explicit cancel message.

Renderer parses with `fetch()` + a hand-rolled SSE parser
(`EventSource` doesn't allow custom headers, so we can't use it for
`Authorization`). The parser mirrors the existing
`@beak/common/helpers/sse-parser.ts`.

Rejected: WebSocket (overkill for unidirectional stream; awkward
auth on the URL), long-polling (poll-storm vs lag), WebTransport
(no Safari support).

Deferred: a sibling `GET /flight/<id>/body` raw-bytes endpoint for
gigabyte-scale downloads where base64's 33% tax bites; ship when
someone actually hits the wall.

### 4. Discovery — port-range scan with HMAC-keyed healthz

Agent binds the first available port in `47821..47840` and writes
its PID + port to a runtime-state file the renderer never reads
(used by `beak-agent status` and crash diagnostics).

Renderer scans the range with 200ms timeouts, accepting any
`GET /.beak/agent/healthz` response whose body has `{"agent":
"beak", ...}`. First match wins; URL is cached in `localStorage`
with a 24h TTL. Cache is invalidated on connection failure.

To defeat localhost impersonation **once a token is held**, healthz
becomes a token-keyed challenge: renderer sends `?nonce=<rand>` +
`Authorization: Bearer <token>`; agent returns
`signature = base64url(hmac_sha256(token, nonce))`; renderer
verifies. Pre-pairing there's nothing to challenge with, so the
worst an impostor can do is fail the pairing flow (PKCE protects
the token issuance).

The range `47821..47840` is chosen for being above the ephemeral
floor, outside common dev-tool defaults, and visually distinctive
in `lsof` output.

Rejected: fixed port (any conflict breaks us), mDNS (browsers can't
speak it), file-based registry (browsers can't read disk),
self-signed TLS on loopback (CA-install dance we wanted to avoid).

### 5. Authentication — PKCE pairing handshake, origin-bound tokens

OAuth 2.0 PKCE flow over loopback, browser-initiated:

1. Renderer generates `state`, `code_verifier`, `code_challenge =
   sha256(code_verifier)`. Opens `http://127.0.0.1:<port>/pair?
   origin=<self>&state=<...>&code_challenge=<...>&
   code_challenge_method=S256&return=<self>/pair/return`.
2. Agent validates origin params + Origin header, surfaces an
   HTML approval page (served by the agent on loopback) and a
   tray-icon badge. Default focus on Deny.
3. On Allow, agent stores a `pendingPairing { origin, state,
   codeChallenge, expiresAt: now+5min }`, redirects to
   `<return>?state=<...>&code=<...>`.
4. Renderer POSTs `{code, code_verifier}` to `/pair/token`. Agent
   verifies origin + `sha256(code_verifier) == codeChallenge`,
   mints a 32-byte opaque token, persists `{tokenId, origin,
   tokenHash: sha256(token), createdAt, lastUsedAt, label}` to
   `tokens.json` (OS-appropriate config dir). **Only the hash is
   stored**, never the raw token.
5. Renderer stores the raw token in `localStorage`.
6. Every subsequent request carries `Authorization: Bearer
   <token>`. Agent validates token hash + Origin header on each
   request.

Revocation: tray-menu "Paired clients" lists each origin with
`[Revoke]`. Revoke deletes the entry; next request returns 401;
renderer clears `localStorage` and surfaces re-pair UI.

Tokens are long-lived by default; rotation is forward-compatible
via `expires_in`/`refresh_token` additions when needed.

Rejected: no-auth + Origin allowlist (non-browser clients trivially
spoof Origin), token paste (poor UX), handshake without PKCE
(loopback code-interception race), mTLS on loopback (browsers don't
expose client-cert provisioning to JS).

### 6. Capability matrix + runtime state slice

Extend `RuntimeCapabilities` with **one** new field:

```ts
localAgent: 'unsupported' | 'optional' | 'required';
```

- Electron: `'unsupported'`
- Web: `'optional'`
- Share viewer: `'unsupported'`
- `'required'` reserved for future restricted shells.

Runtime state — discovery status, base URL, token ID, last-seen
timestamp, pairing error, routing preference — lives in a new
Redux slice `@beak/state/agent/` with statuses `idle | discovering
| unreachable | unpaired | pairing | paired | verifying |
impostor`. The slice is mounted in the store **only** when the
capability is not `'unsupported'`.

A single selector, `selectShouldRouteViaAgent(state)`, combines the
capability × runtime status × user routing preference
(`agent-when-available` | `agent-only` | `browser-only`). The web
host's `flight-service.ts` reads it to choose between
`AgentRequester` (new) and `BrowserFetchRequester` (the current
`apps-host/web/src/requester/index.ts` refactored behind an
interface).

The split is deliberate: **capabilities are static per-shell**
(does this shell have the machinery to talk to an agent?);
**slice is dynamic per-session** (is one paired and reachable?).
Mixing them produces sloppy renderer code.

## Consequences

- New deliverable: signed, notarised, auto-updating menu-bar app
  per OS. Distributed via Homebrew cask, winget, AppImage/.deb,
  signed direct downloads.
- The web host can fire arbitrary requests against any target the
  user's machine can reach — including intranet/VPN/localhost APIs,
  which were previously unreachable.
- Privacy story improves: Beak operates no relay; request bytes
  never leave the user's machine. A selling point.
- CI gains a Go build matrix and a `pnpm wire-gen --check` job.
- A second SSE parser implementation (Go) to keep in sync with
  `@beak/common/helpers/sse-parser.ts` — ported tests catch
  divergence.
- New UI surfaces in the web host: install CTA, pair CTA,
  disconnected banner, impostor warning. See
  [`../features/agent-lifecycle.feature`](../features/agent-lifecycle.feature).
- Long-lived tokens stored as `sha256(token)` on disk — exfil of
  `tokens.json` doesn't yield usable tokens.
- Renderer's flight code path is unchanged in shape; only the IPC
  implementation in the web host branches on
  `selectShouldRouteViaAgent`.

### Migration path

1. Add the capability with `localAgent: 'unsupported'` on every
   shell. No behavioural change.
2. Land the agent slice (mounted on capability ≠ `'unsupported'`),
   status stubbed to `'unreachable'`.
3. Land discovery + HMAC verification (status reaches
   `'unpaired'`).
4. Land pairing handshake (status reaches `'paired'`).
5. Land `AgentRequester` and the routing branch in
   `flight-service.ts`.
6. Flip `apps-host/web`'s capability to `'optional'`.

Each step is independently reviewable.

## Alternatives considered

Rolled into each sub-decision above to keep this ADR contained.
The headline rejected alternatives across the whole feature:

- **Server-side CORS proxy** — privacy/liability nightmare, ops
  cost, can't reach intranets. Might still ship later as an opt-in
  fallback for environments where the agent isn't an option.
- **Browser extension** — per-browser stores, scary permissions,
  Safari pain, doesn't help with intranet/localhost.
- **Tauri-wrapped web host** — that's just a worse Electron.

## References

- [RFC 7636 — PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [RFC 8252 — OAuth 2.0 for Native Apps](https://datatracker.ietf.org/doc/html/rfc8252)
  (loopback redirect pattern)
- [HTML Living Standard — Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- `packages/common/src/ipc/flight.ts` — current Zod-validated IPC.
- `packages/common/src/types/requester.ts` — heartbeat union; SSE
  events map 1:1.
- `packages/common/src/helpers/sse-parser.ts` — parser to mirror in
  Go.
- `packages/runtime-shared/src/base.ts` — capability matrix.
- `apps-host/web/src/requester/index.ts` — current browser-fetch
  implementation.
- All `.feature` files in [`../features/`](../features/).
