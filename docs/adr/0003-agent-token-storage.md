# 0003 — Agent token storage beyond `localStorage`

- **Status:** Proposed
- **Date:** 2026-06-08
- **Deciders:** Alexander Forbes-Reed

## Context

ADR 0001 specifies that the bearer token minted during PKCE pairing is
held in the renderer and presented on every `/flight` POST. The
current implementation stores the token in `localStorage` under
`beak.agent.token` (see `packages/ui/src/services/agent/storage.ts`).

The drive-security audit flagged this:

> **P0-2** Bearer token in `localStorage`, fully XSS-readable. Follow-up
> ADR before GA — service-worker token, short-lived rotation, or
> WebAuthn-gated storage.

XSS on `beak.web` is out of scope for the local-agent feature itself,
but if it ever lands (a malicious extension via the web shell, a third-
party script we add, a Beak-app vulnerability we ship), the agent
token is the most valuable thing the attacker can read: it lets them
fire arbitrary HTTP requests through the user's machine, against the
user's internal network, with the user's cookies and certificates.

`localStorage` was chosen because (1) it survives reload without
bloating Redux persistence, (2) the host's flight handler is outside
React and wants cheap synchronous access. Both reasons still hold; we
need a token storage strategy that defeats opportunistic XSS without
losing those properties.

## Decision

Adopt a **short-lived bearer + refresh** model backed by **non-XSS-
readable storage**. Two parts.

### 1. Token lifetime: ~15 minutes, refreshed via the agent

The agent issues a bearer with `exp = now + 900` and embeds a refresh
hook: a long-lived **refresh-token** (signed JWT-ish, persisted in
non-XSS-readable storage) that the renderer presents at
`/pair/refresh` to mint a new bearer.

- Bearer token: lives in memory (a JS variable, plus a clone in an
  unforgeable `WeakRef` held by the flight-service handler). NOT in
  `localStorage`. Re-minted on every page load by replaying the
  refresh-token. Lifespan 15 min; renewed at 12 min via a background
  timer the service owns.
- Refresh token: a signed JWT bearing `{tokenId, pairedAt}`. Stored as
  described in §2. ~30 day expiry; if the user doesn't open the web
  app for 30 days they re-pair.
- Renderer never persists the bearer to disk. The cost is a one-shot
  network request to `/pair/refresh` on every page load; the cost is
  on the local-loopback path, so it's free for the user.

### 2. Refresh-token storage: IndexedDB behind a service-worker proxy

The refresh-token is stored in **IndexedDB** inside an origin-isolated
**service worker**. The renderer never reads the refresh-token
directly; it asks the service worker via `postMessage`.

- IndexedDB is XSS-readable in the absence of a service worker. We
  install a service worker for the `beak.web` origin (also needed for
  the static-asset caching story) and have it own the
  `agent-refresh-token` IndexedDB key.
- The service-worker API surface is exactly two messages:
  - `{type: 'refresh-bearer'}` — service worker contacts the agent
    via its own `fetch()` (cross-origin, includes CORS) at
    `/pair/refresh`, returns the new bearer to the renderer.
  - `{type: 'forget'}` — drops the refresh-token; equivalent to
    "unpair".
- The renderer cannot extract the refresh-token. XSS sees only the
  short-lived bearer that's already in the request pipeline; the
  attacker has ~15 min before the bearer expires and at most a
  single refresh cycle before the user notices their session has
  diverged (no auto-refresh from a tab the attacker doesn't own).

### 3. Migration path

The renderer ships both:

- Legacy reader: if `localStorage['beak.agent.token']` is present and
  no refresh-token is in IndexedDB, run a one-time "upgrade" — call
  `/pair/refresh` with the legacy token; on success move the
  resulting refresh-token to IndexedDB and clear localStorage; on
  failure prompt the user to re-pair.
- After the upgrade flow lands and one minor release passes, the
  legacy reader is removed.

The agent ships `/pair/refresh` *before* the renderer changes land.
Both old and new renderers continue to work for the deprecation
window.

### 4. Host adapter shape

The web host's flight-service no longer reads
`window.localStorage.getItem('beak.agent.token')` directly. It calls
into a renderer-supplied `getCurrentBearer(): Promise<string | null>`
which is wired to the service worker. The agent adapter caches the
bearer between flights for the bearer's lifetime.

## Consequences

- One new service worker for `beak.web`. The bundle gains ~5 KB after
  the SW registration glue; the SW itself is ~200 lines of code.
- One new wire route on the agent (`POST /pair/refresh`). Agent code
  grows ~80 lines.
- Renderer adds a small synchronous-feeling token cache that's
  actually async behind the scenes. A bearer fetch on every page
  load is the only user-visible latency cost; ~1 ms on loopback.
- `drive-security` P0-2 is closed: an XSS attacker can read the
  short-lived bearer from a fetch interception but cannot persist
  access. Refresh-token compromise still gives long-term access; we
  accept that trade-off because the surface to exfiltrate the
  refresh-token is much smaller (service worker, postMessage gated).
- ADR [0002](0002-signed-challenge-identity-verification.md)'s
  per-pairing keypair extends naturally: the refresh request itself
  is signed-challenge-verified before the agent honours it. The two
  ADRs land together as one feature in code.
- The 15-minute bearer + service-worker dance is overkill if XSS on
  `beak.web` is impossible. We accept the cost because we don't know
  what we'll ship in 12 months; ratcheting the bound *down* later is
  cheap, ratcheting it *up* after an incident is painful.

## Alternatives considered

- **HttpOnly cookie.** Cookies can't cross origin (`beak.web` →
  `127.0.0.1:478xx`) without explicit CORS. Even with credentials
  mode and the agent reflecting Origin, browsers refuse to send
  cookies to literal-IP origins in many configurations. Rejected.
- **WebAuthn-gated `localStorage` unlock.** Requires a user
  interaction every page load. Rejected as too intrusive for an API
  crafter people leave open all day.
- **Browser extension that owns the token.** Defers the storage
  problem to the extension storage API (which is XSS-resistant from
  the page's perspective) but reintroduces a separate install,
  per-browser, with scary permission prompts. Rejected as inconsistent
  with ADR 0001's "no extensions" choice.
- **Server-side token broker.** A Beak-operated server that holds the
  refresh-token and hands out short-lived bearers. Rejected for the
  same privacy/ops reason ADR 0001 §Context rejected a server-side
  proxy.
- **Defer until post-GA.** The current `localStorage` model works for
  the alpha. We don't defer because we want to ship GA with the
  hardened story, not migrate live users.

## References

- `audit/drive-security-local-agent.md` §P0-2.
- [0001](0001-local-agent-for-web-host.md) — original local agent
  design.
- [0002](0002-signed-challenge-identity-verification.md) — companion
  ADR; the refresh request is verified using the same per-pairing
  keypair.
