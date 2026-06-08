# 0002 — Signed-challenge identity verification for the local agent

- **Status:** Proposed
- **Date:** 2026-06-08
- **Deciders:** Alexander Forbes-Reed

## Context

ADR 0001 §5 specifies a bearer-token model for the local agent: the
renderer holds an opaque token minted during the PKCE pairing flow and
sends it as `Authorization: Bearer …` on every request. The same
header is used both for routine flights and for the
`verifyAgentIdentity` probe (see
`packages/ui/src/services/agent/discovery.ts`) that runs after each
discovery to confirm the loopback endpoint is actually our agent and
not an impostor squatting on the port.

The drive-security audit identified a real attack on this:

> `services/agent/discovery.ts:62-67` sends the bearer token to whoever
> answered `/healthz` *before* the impostor check completes. An attacker
> process that wins the port-bind race against the real agent captures
> the token before its HMAC mismatch is detected.

The race is small but reachable. On startup the renderer reads the
cached agent URL from localStorage and immediately fires
`verifyAgentIdentity(baseUrl, token)`. If a malicious local process
(another user account, sandboxed app, or a developer's `nc -l`) is
listening on the same port at that moment, it receives the
`Authorization: Bearer …` header and can replay it against the real
agent the next time it's bound to that port.

Adding HMAC verification *after* sending the token doesn't help — the
secret is already out. The bearer model assumes the channel is
authenticated; with port reuse on `127.0.0.1` it isn't.

## Decision

Replace bearer-style identity verification with a **signed-challenge**
exchange. The renderer never reveals the token to an unverified party.

### 1. Per-pairing keypair

The agent generates an Ed25519 keypair at pair-completion time and
hands the public key to the renderer alongside the bearer token. The
private key never leaves the agent process.

`PairTokenResponse` (wire schema
`packages/common/src/wire/agent/pairing.ts`) gains a
`publicKey: string` field (base64-url, 32 bytes). Existing
`token` + `tokenId` fields stay. The agent persists `(tokenId, public-
key, private-key)` in its existing token store.

### 2. Identity probe is a challenge

`verifyAgentIdentity` no longer sends `Authorization: Bearer …`. It:

1. Generates a 16-byte random nonce.
2. POSTs the nonce + the `tokenId` to a new `/.beak/agent/verify`
   endpoint. No bearer token.
3. The agent looks up `(tokenId → private-key)` and returns a
   signature over `nonce || tokenId || agent-version` plus the bound
   public-key fingerprint.
4. The renderer verifies the signature with its stored public key. On
   success the agent is the one that paired; on failure the renderer
   discards the cached `baseUrl`, resets the localStorage entry, and
   continues port scanning.

The token itself is only sent on `/flight` POSTs (real requests) after
the agent's identity is confirmed for the session.

### 3. The bearer remains for transport, not identity

Once a session has verified the agent's identity once, subsequent
`/flight` requests still send `Authorization: Bearer …` — but the
trust model has shifted. The bearer no longer asserts *who* the
agent is; the public-key fingerprint stored client-side does. The
bearer is the per-request auth token that the agent uses to bind the
flight to a paired session.

### 4. Pairing flow updates

The pairing response handler (`services/agent/pairing.ts`) gains a
`publicKey` field in its stored payload (alongside `token` and
`tokenId`). The verify probe reads it from the same storage record.
Token rotation rotates the keypair too.

### 5. Backwards compatibility

The renderer ships a fallback: if the paired record has no
`publicKey` (legacy pairing), it falls back to the current
bearer-style verify and surfaces a one-time banner asking the user to
re-pair. After a deprecation window (one minor release) the fallback
is removed.

The agent ships a `/.beak/agent/verify` endpoint immediately; older
renderers don't call it, so deploying the agent first is safe.

## Consequences

- One new wire schema (`pairVerifyChallenge` + `pairVerifyResponse`)
  in `packages/common/src/wire/agent/`. One new HTTP route in the
  agent. ~150 lines of code added; nothing renamed.
- The impostor branch in `services/agent/discovery.ts` becomes
  meaningful — it never leaks the token, so it can resume scanning
  safely (closing the `audit/drive-feature-local-agent.md` P1 too).
- Public keys in localStorage are not secrets; their exposure to XSS
  (drive-security P0-2) is a non-event. Only the bearer token remains
  XSS-sensitive — that's the subject of [0003](0003-agent-token-storage.md).
- The pairing UX gains nothing the user sees; the change is internal.
- Renderer adds a small Ed25519 verify (Web Crypto `subtle.verify` with
  `Ed25519` is now in Safari ≥ 17 and Chromium ≥ 113; the renderer
  ships polyfilled fallback via `@noble/ed25519` if needed).

## Alternatives considered

- **mTLS on loopback.** Browsers do not expose client certificates on
  `127.0.0.1:*` from a public origin; requires platform-specific
  certificate trust dance. Rejected.
- **Token-prefix-with-fingerprint.** Hash the token with a per-agent
  random salt and have the renderer check the hash before the full
  token is sent. Reduces leak but doesn't eliminate it (the hash
  prefix is still a useful token-recovery surface). Rejected as a
  half-measure.
- **HMAC-based mutual auth** (current healthz nonce model, extended).
  Requires a pre-shared symmetric secret that both sides hold; the
  renderer can hold one only in localStorage, which is exactly the
  surface we're trying to avoid leaking from. Rejected.
- **Defer until GA.** The race window is small; in practice port
  collisions on `127.0.0.1` are rare for the band 47821-47840. We
  reject deferral because the audit was specifically about pre-GA
  hardening and the cost of doing this now is small.

## References

- `audit/drive-security-local-agent.md` §P0-4.
- `audit/drive-feature-local-agent.md` P1 #5 (impostor branch).
- [0001](0001-local-agent-for-web-host.md) — original local agent
  design.
- [0003](0003-agent-token-storage.md) — token storage strategy
  (companion ADR).
