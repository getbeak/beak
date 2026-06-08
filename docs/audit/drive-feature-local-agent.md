# /drive-feature audit — Local agent for the web host

Audit of the `local agent for the web host` feature against its spec.
Logic + completeness focus, not code style.

## 1. Spec source

- ADR: `docs/adr/0001-local-agent-for-web-host.md` (six sub-decisions:
  runtime/Go, wire contract, transport, discovery, PKCE auth, capability +
  slice).
- Gherkin:
  - `docs/features/agent-control-plane.feature` (discovery, pairing,
    revocation, lifecycle UI states, auto-update, process exit).
  - `docs/features/agent-flight.feature` (routing decision, GET/POST/SSE/
    binary, timeout, auth failure, concurrency, cancellation).
- Companion: `docs/features/README.md` (intent only; no normative
  requirements).

## 2. Feature surface walked

Wire contracts (`@beak/common`):
- `packages/common/src/wire/agent/index.ts` — port range, paths,
  fingerprint, protocol version.
- `packages/common/src/wire/agent/pairing.ts` — PKCE Zod schemas.
- `packages/common/src/wire/agent/healthz.ts` — healthz Zod (with optional
  HMAC).
- `packages/common/src/wire/agent/flight.ts` — flight envelope + heartbeat
  union + terminal events.

State slice (`@beak/state`):
- `packages/state/src/agent/types.ts` — `AgentStatus`,
  `AgentRoutingMode`, `AgentSliceState`.
- `packages/state/src/agent/agent-slice.ts` — reducers + selectors.
- `packages/state/src/agent/routing.ts` — `decideRouting` decision table
  + `selectRoutingDecision` factory.
- `packages/state/src/agent/__tests__/routing.test.ts` — 7 cases.

Renderer service (`@beak/ui`):
- `packages/ui/src/services/agent/discovery.ts` — port scan + HMAC verify.
- `packages/ui/src/services/agent/pairing.ts` — PKCE init + completion.
- `packages/ui/src/services/agent/storage.ts` — localStorage + module
  capability handle.
- `packages/ui/src/services/agent/crypto.ts` — Web Crypto helpers.
- `packages/ui/src/store/effects/agent.ts` — listener-middleware effects.
- `packages/ui/src/components/molecules/AgentStatusBanner.tsx` — banner UI.
- `packages/ui/src/containers/AgentPairReturn.tsx` — `/agent/pair/return`
  landing page.
- `packages/ui/src/features/preferences/components/molecules/AgentPreferencesSection.tsx`
  — routing mode segmented control + "Forget on this device".
- `packages/ui/src/entrypoints/web.tsx` — `discoverAgentRequested` on
  boot.
- `packages/ui/src/store/index.ts` — slice mount; mounted on **all**
  hosts (see scope creep below).

Requester adapter (web host):
- `apps-host/web/src/requester/agent.ts` — `createAgentRequester`,
  SSE parser.
- `apps-host/web/src/requester/browser-fetch.ts` — fallback.
- `apps-host/web/src/requester/types.ts`, `index.ts`.
- `apps-host/web/src/ipc/flight-service.ts` — picks requester per
  `decideRouting`.
- `apps-host/web/src/setup-web-host.ts` — publishes
  `localAgent: 'optional'` capability.
- `apps-host/web/src/host/index.ts:82` — sets capability.
- `apps-host/electron/src/host/index.ts:26` — sets capability
  `unsupported`.
- `packages/runtime-shared/src/base.ts:40` — capability matrix.

Go binary (skim only, per skill rules):
- `apps-host/agent/cmd/beak-agent/main.go`,
  `apps-host/agent/internal/{server,pairing,requester,wire,config,tray}/*.go`
  — confirms wire shape matches the Zod schemas (Go structs are
  hand-written per `wire/README.md`).

## 3. Spec-to-code grid

Status legend: pass / partial / gap.

### `agent-control-plane.feature`

| Spec line | Code location | Status |
| --- | --- | --- |
| Cold discovery: probes 47821, expects `{agent: "beak"}` | `services/agent/discovery.ts:25-32, 35-51` | pass |
| Cold discovery: caches base URL with 24h TTL | `services/agent/storage.ts:20, 60-75` | pass |
| Cold discovery: slice becomes `unpaired` | `store/effects/agent.ts:59-67`, `agent-slice.ts:23-31` | pass |
| Port conflict shifts up the range | `services/agent/discovery.ts:25-32` (linear scan, first match) | pass |
| All ports unreachable → status `unreachable` | `store/effects/agent.ts:53-57`, `agent-slice.ts:32-35` | pass |
| All ports unreachable → UI shows install/start CTA | `components/molecules/AgentStatusBanner.tsx:153-161` ("Install or start the Beak agent") | pass |
| Cached URL stale after restart → evict + rescan | `store/effects/agent.ts:46-58` (cache probed first; falls through to scan on failure) | partial — falls back to full scan, but `clearCachedAgentBaseUrl` only runs when **the rescan also fails**; if the restart moved the agent up the range, the stale URL is silently overwritten by `setCachedAgentBaseUrl` on success, which is correct. The "evict the cache" wording in the spec is harmless drift. |
| HMAC-keyed healthz challenge — wrong signature is rejected | `services/agent/discovery.ts:59-87` (constant-time compare) | pass |
| Impostor → slice "briefly enters `impostor` before settling" — and continues scanning | `store/effects/agent.ts:71-79`, `agent-slice.ts:54-57` | **gap (P1)** — impostor path clears the cached URL and sets status `impostor`, then **stops**. The renderer never restarts discovery to find the real agent further up the range. Spec line `discards 47821 and continues scanning` is unimplemented. |
| First-time pairing happy path: pair URL with origin/state/challenge/method/return | `services/agent/pairing.ts:20-36` | pass |
| Pairing: new tab opened | `services/agent/pairing.ts:35` (`window.open(..., '_blank', 'noopener')`) | pass |
| Pairing: tray badge / approval surface | `apps-host/agent/internal/server/pair.go:42-56`, `internal/pairing/approval.go` | pass (Go side) |
| Pairing: approval page shows requesting origin | `apps-host/agent/internal/server/pair.go:38` (`{{Origin}}` substitution) | pass |
| Pairing: default focused button is Deny | `internal/server/pair_html.go` (skim only — confirmed embedded template; not deeply reviewed per audit scope) | partial — verified existence; default-focus behaviour relies on the HTML template. **Recommend a small Go-side test or visual proof; out of scope here.** |
| Pairing: agent verifies `sha256(code_verifier) == code_challenge` | `apps-host/agent/internal/pairing/pairing.go:86-90` (constant-time) | pass |
| Pairing: persists `{tokenId, origin, tokenHash, createdAt, lastUsedAt, label}` | `apps-host/agent/internal/pairing/tokens.go:84-117` | pass |
| Pairing: agent does **not** persist raw token | `tokens.go:106-110` (record only has hash; raw stays in `rawByID` in-memory) | pass |
| Pairing: renderer stores raw token in localStorage | `store/effects/agent.ts:104-108`, `services/agent/storage.ts:48-50` | pass |
| Pairing: slice becomes `paired` | `agent-slice.ts:40-45` | pass |
| User denies pairing → access_denied redirect | `apps-host/agent/internal/server/pair.go:90-93` | pass |
| User denies → web host shows "Pairing cancelled" with Retry | `containers/AgentPairReturn.tsx:52-57` (renders raw `error` string) + `AgentStatusBanner.tsx:162-172` (Pair-agent CTA) | **partial (P2)** — no explicit "Pairing cancelled" copy or Retry button. The error string `pairing_access_denied` shows; the user has to click "Pair agent" again from the banner. Spec wording is unmet. |
| PKCE defeats code interception | `internal/pairing/pairing.go:65-69` | pass (Go) |
| Origin spoofing on /pair rejected | `apps-host/agent/internal/server/pair.go:183-185` (only when `Origin` header is present) | partial — if a non-browser client omits `Origin`, validation skips the mismatch check. Mitigated by the post-pairing origin lock and the `Origin` requirement on `/pair/token` and `/flight`, but the literal spec wording "rejects before showing the approval page" assumes header is checked. **Acceptable for a loopback-only attacker model; flag for spec to reflect.** |
| Pending code expires after 5 minutes | `internal/pairing/pairing.go:24, 51-71` | pass |
| Pairing code is single-use | `internal/pairing/pairing.go:62-70` (`p.Consumed`/delete-on-consume) | pass |
| Revoke → next flight returns 401 | `internal/pairing/tokens.go:142-159` + `internal/server/flight.go:36-40` | pass |
| Revoke → renderer clears localStorage and shows Pair UI | `store/effects/agent.ts:115-121`, `flight-service.ts:21-24` clears token on 401 | **partial (P1)** — `agent_unauthorized` triggers `clearAgentToken()` but does **NOT** dispatch `tokenRevoked` (or any slice action). The slice status stays `paired`, so `AgentStatusBanner` keeps rendering nothing. The next flight will still try `via-agent` (decideRouting + `paired` → `via-agent`), then degrade to browser-fetch via the `if (!baseUrl !! !token)` fallback in `pickRequester` — silently. User never sees the Pair CTA until a manual rescan. |
| UI surfaces match `<state>` table | `components/molecules/AgentStatusBanner.tsx:138-200` | partial — covers `unreachable`/`unpaired`/`pairing`/`impostor`/`paired`; "revoked" state is folded into `unpaired` once `tokenRevoked` fires; "installed-not-running" and "not installed" both render as `unreachable` (no per-OS download links). |
| Auto-update preserves token | `internal/pairing/tokens.go:60-71` reloads from disk on start | pass |
| Process exit → next flight `connection refused`, status → `unreachable`, in-flight streams close with `agent_disconnected` reason | `requester/agent.ts:33-36` (`callbacks.failed` on fetch throw) + `services/flight-service.ts:21-24` (no status transition) + no `agent_disconnected` reason emitted anywhere | **gap (P1)** — fetch error becomes a generic `Error.message` (browser-supplied), not the spec's named `agent_disconnected` reason. Also no slice action transitions status back to `unreachable`; the renderer keeps treating the agent as available until the next manual rescan or page reload. |

### `agent-flight.feature`

| Spec line | Code location | Status |
| --- | --- | --- |
| Routing decision per `pref × status` table | `state/agent/routing.ts:21-38`, tested in `__tests__/routing.test.ts` | pass |
| Routing wired into pick path | `apps-host/web/src/ipc/flight-service.ts:43-69` | pass |
| GET happy path → `POST /flight` with `Authorization`/`Origin` | `requester/agent.ts:22-32` (Origin is set by the browser automatically; explicit `Authorization: Bearer` is in headers) | pass |
| SSE `fetch_response` event | `agent/internal/requester/client.go:47` + parsed by `requester/agent.ts:151` | pass |
| `head_received` with status + headers | `agent/internal/requester/client.go:86-95` + `requester/agent.ts:151` | pass |
| `reading_body` events with base64-decoded buffer | `agent/internal/requester/client.go:103-119` + `requester/agent.ts:156-171` (decodes base64 to Uint8Array) | pass |
| Terminal `complete` with `hasBody=true` | `client.go:97, 144-154` + `requester/agent.ts:173` | pass |
| Agent closes SSE stream | `flight.go:62-69` (handler returns; chunked stream closes naturally) | pass |
| POST with JSON body produces upstream Content-Type | `agent/internal/requester/client.go:166-173` (body bytes) — but **does NOT set `Content-Type: application/json`** automatically when `body.type === 'json_raw'` | **partial (P1)** — Go agent reads the body string but never sets `Content-Type` based on body type the way `browser-fetch.ts:140-147` does. Relies on the renderer-supplied headers carrying it. For most flights that's fine because `requestBodyContentType` is consulted client-side before the wire envelope is built, BUT the agent requester runs **after** the renderer's prepare-request, so the header gets included; double-check via integration test. Not a strict gap — wire contract delegates header construction to the renderer. **Flag as spec silence**: the spec says "the agent issues POST … with Content-Type 'application/json'" which the agent doesn't enforce; it trusts the wire payload. |
| SSE upstream → interleaved `sse_event` + `reading_body` | `client.go:113-119` (emits both per chunk) | pass |
| Upstream timeout becomes `failed` with "timeout" message | `client.go:55-63` (http.Client.Timeout=0) + `buildRequest` does not honour `payload.request.options.timeoutMs` | **gap (P0)** — `options.timeoutMs` from the wire payload is never read. There is no per-request timeout. Spec scenario "Upstream timeout becomes a failed event" fails: the request runs forever (or until the upstream gives up). |
| Binary body bytes base64 on the wire | `client.go:108-112` (raw → base64) + `requester/agent.ts:162-170` (decode) | pass |
| Renderer reconstructs original bytes from concatenated chunks | `store/effects/flight.ts:198` (`binaryStore.append`) | pass |
| Auth failure → 401 immediately, no SSE stream | `internal/server/flight.go:36-40` (`http.Error 401` before SSE headers) + `requester/agent.ts:38-41` | pass |
| Auth failure → renderer marks flight failed with reason `agent_unauthorized` | `requester/agent.ts:39` | pass |
| Auth failure → web host clears localStorage and surfaces Pair-agent UI | `flight-service.ts:21-24` clears token | **partial (P1)** — clears token but does not transition slice status (see control-plane row above). |
| Multiple flights run in parallel | Go agent: each request handled by its own goroutine (`http.Server`'s default per-connection). Renderer: `pickRequester()` is called per-flight; AbortController is per-flight. | pass |
| Streaming flight does not stall siblings | Same. No shared state in `createAgentRequester` between calls. | pass |
| Renderer-initiated cancellation tears down only the target flight | `requester/agent.ts:20` (local `controller = new AbortController()`) — **never returned to caller** | **gap (P0)** — the renderer has no path to abort a single flight. The flight slice's `requestFlight`/`beginFlightRequest` (`store/effects/flight.ts`) does not expose a cancellation action, and `IpcFlightServiceRenderer.startFlight` is fire-and-forget. The `AbortController` in `agent.ts:20` is dead code. ADR §3 explicitly says "Cancellation: renderer closes the response stream; agent observes `r.Context().Done()` and cancels the upstream request" — the closing-the-stream side is unimplemented. |
| Agent restart during in-flight → each flight fails with `agent_disconnected`, status → `unreachable` | See control-plane row for `agent_disconnected` | **gap (P1)** — same root cause; no named reason, no slice transition. |

## 4. Edge cases NOT handled

- `discoverAgent()` iterates ports **sequentially with `await`**, not in parallel. With 20 ports × 200ms timeout, a fully-cold scan against a host where the agent is missing takes ~4 seconds, blocking the listener thunk and any user-initiated re-pair. (`services/agent/discovery.ts:26-31`). Spec says "every port times out or refuses connection **within 200ms**" — the test reading would expect total scan ≈ 200ms, not 4s. **No documented circuit breaker on probes per session either.**
- `verifyAgentIdentity` does **not** check `parsed.data.agent === AGENT_FINGERPRINT_NAME` before trusting the response — wait, it does at line 72. Disregard. ✓
- `verifyAgentIdentity` fires only **on the cached URL** (or the freshly-discovered URL), not on every healthz probe in the scan loop. An impostor on a low port that loses to the cached real agent never gets challenged, which is fine. An impostor on the cached port that the real agent has since moved away from is correctly caught (status → `impostor`) but as noted, **scan does not resume**.
- `services/agent/pairing.ts:44-51` (`readPairingReturnQuery`) reads `window.location.search` but never decodes URL-encoded `error` codes or values. RFC-compliant agent responses with `+` for spaces or percent-encoded params survive `URLSearchParams.get`, so this is OK.
- `services/agent/pairing.ts:68-76` — if a user opens two tabs and starts pairing in each, the second `sessionStorage.setItem` **overwrites the first**. The first tab's completion will see the second tab's `pending.state` and throw `pairing_state_mismatch`. Acceptable per the comment ("opening Beak in two tabs at once produces two independent pairings, which is correct"), but the comment is **wrong**: `sessionStorage` is per-tab so each tab has its own storage. The collision case is actually impossible — but only because of sessionStorage's per-tab scope, not by design. Worth noting in a code comment.
- `store/effects/agent.ts:48-52` — when `cached && cachedHealthz` is non-null, we still don't run `verifyAgentIdentity` until after the slice has already dispatched `agentDiscovered(...)`. There's a window where `status === 'verifying'` ↔ `status === 'paired'`/`'impostor'`. The flight routing during that window: `decideRouting` returns `via-default` when status is `verifying` (because `'paired'` is the only `via-agent` trigger in the table) — but that means **flights fired during the verifying window degrade to browser-fetch silently** even though the agent might be perfectly fine. **Minor UX nit.**
- `apps-host/web/src/ipc/flight-service.ts:60-66` — the "state says paired but baseUrl/token missing" branch returns `browserFetchRequester` silently. Logging would help diagnose; otherwise the agent capability appears broken to the user with no signal.
- `apps-host/web/src/requester/agent.ts:42-48` — on 4xx/5xx non-401 responses, the error is `agent flight failed with status N`. No body parsing — if the agent returns a structured error (e.g., per `wire/agent/pairing.ts:pairErrorResponseSchema`-style), the renderer never surfaces the description.
- `apps-host/agent/internal/server/server.go:148-157` — `bindInRange` walks the range, but if every port in `47821..47840` is taken, the agent exits with an error. No fallback to ephemeral; no telemetry. Per ADR this is fine.
- `apps-host/agent/internal/server/pair.go:62-110` (`handlePairDecision`) does not require an `Origin` header — anyone who can hit `/pair/decision?state=X&decision=allow` from any context (curl, second-tab CSRF) can complete the pairing. The state nonce is unguessable and short-lived (5 min), but the spec's `Origin spoofing on /pair is rejected` scenario doesn't mention `/pair/decision`. **Worth a P2 note**: CSRF token or per-state Origin pin would close it.

## 5. Side effects review

### localStorage writes

- `setCachedAgentBaseUrl` writes URL + timestamp as **two separate keys**
  (`storage.ts:73-75`). If the tab crashes between the two writes, `cachedAt`
  may be unset and `getCachedAgentBaseUrl` will treat the URL as stale
  (correct degrade). However, the opposite race — timestamp set, URL not
  yet set — leaves a stale timestamp pointing at `null`, which
  `getCachedAgentBaseUrl` reads as no cache (also correct degrade). Both
  races are benign.
- `setAgentToken` writes token + tokenId as two keys (`storage.ts:48-51`).
  Same atomicity concern; same benign outcome (Lookup falls back to a
  rescan + re-pair). 
- `clearAgentToken` only clears token + tokenId, not the cached baseUrl
  (`storage.ts:55-58`). After revoke, the cached URL is still valid (the
  agent is still running), which is correct.

### Slice dispatches: state-machine transitions

- `discoverAgentRequested` always dispatches `startDiscovery` even when a
  cached URL is present. So the visible status sequence is
  `paired` → `discovering` → `paired`/`verifying`/`unpaired` on every
  page load. If `decideRouting` is queried during the brief `discovering`
  window it returns `via-default`, **routing the flight through the browser
  with CORS**. Window is short (~50ms) but real.
- `agentDiscovered` resolves to `verifying` only when `state.tokenId` is
  set; but `state.tokenId` is hydrated from… nowhere. The slice ships
  `tokenId` only via `pairingSucceeded` (in-session) or `hydrateAgent`
  (never called). After a page reload the slice initialState has
  `tokenId === undefined` — even though the raw token sits in
  localStorage. So `agentDiscovered` will jump straight to `'unpaired'`
  on every reload, even when the user is paired. The flight path will
  still work because `pickRequester` reads `getAgentToken()` from
  localStorage directly, but the banner will incorrectly show
  "Pair this browser with the agent". **(P0 UX bug.)**

### SSE subscriptions teardown

- `consumeAgentSse` in `requester/agent.ts:63-116` reads to EOF and
  releases the reader implicitly when the function returns. On a
  network drop (TCP RST), `reader.read()` throws → caught by the
  outer `try/catch` (line 56) → `callbacks.failed(...)`. OK.
- On renderer reload / unmount, no teardown is wired — the only
  cancellation primitive (the dead `AbortController`) is never tripped.
  The browser will likely abort the fetch when the page unloads, but
  long-lived flights triggered through e.g. preferences tab navigation
  could leak.
- No `useEffect` cleanup chain for SSE flights — the listener
  middleware effect (`store/effects/flight.ts:195-218`) keeps the
  `pendingFlights` map entry alive until complete/failed fires.
  Combined with the missing cancellation path, **an unresponsive agent
  can pin a flight in the map indefinitely**.

### PKCE code_verifier handling

- Stored in `sessionStorage` (`services/agent/pairing.ts:26-27`),
  scoped to the tab. Cleared on successful exchange (`clearPending()`).
- On error, **not cleared** (lines 65-77 throw before `clearPending`).
  A retried pair flow with the same tab will hit `pairing_no_pending`
  the next time only if the user has navigated away; otherwise the
  stale `PendingPairing` lingers and the next `completePairing` could
  reuse a stale `codeVerifier` against a freshly-generated server
  challenge → `pairing_state_mismatch`. Minor; auto-recovery works
  after one retry.
- Opening a second tab while pairing: each tab's sessionStorage is
  isolated, so no collision. Code comment at `pairing.ts:19-21` is
  misleading (says "opening in two tabs produces two independent
  pairings" — true, but for sessionStorage reasons, not by design).

### Discovery port scans / circuit breaker

- No upper bound on probes per session. `discoverAgentRequested` can be
  re-fired from the banner's "Re-scan" button arbitrarily often. Each
  fire is a sequential 20-port × 200ms scan = ~4s of CPU + fetch
  thrash. **No debounce, no in-flight guard.** A user who clicks
  Re-scan three times in a row gets three overlapping scans, each
  dispatching `startDiscovery`, with the **last** result winning the
  slice but **all three** racing to `setCachedAgentBaseUrl`.

## 6. Inline fixes applied

**None.** I attempted one (dispatch `tokenRevoked()` after
`agent_unauthorized` in `apps-host/web/src/ipc/flight-service.ts:21-24`),
but the change was reverted before I could finish the edit cycle.
Treating the missing dispatch as a P1 gap below instead.

## 7. Gaps surfaced for human decision

### P0 — feature-breaking

- **No cancellation path from renderer to agent.**
  - Spec quote (`agent-flight.feature`): "Given F1, F2, F3 are all in
    flight … When the renderer aborts the AbortController for F2 …
    Then the underlying TCP connection for F2 closes … the agent
    observes ctx.Done() on F2 within 100ms".
  - Current behaviour: `apps-host/web/src/requester/agent.ts:20`
    creates an `AbortController` and never returns it. The flight
    slice does not expose a cancellation action. ADR Decision §3
    relies on this path.
  - Recommended action: thread a `cancel(flightId)` action from the
    flight slice through `IpcFlightServiceRenderer` and back to the
    requester, then call `controller.abort()`.

- **Upstream timeout (`options.timeoutMs`) is ignored.**
  - Spec quote (`agent-flight.feature`, "Upstream timeout becomes a
    failed event"): "Given the flight options include
    `timeoutMs=2000` … Then the agent cancels the upstream request
    And emits a 'failed' event whose error message contains
    'timeout'".
  - Current behaviour: `apps-host/agent/internal/requester/client.go:55-63`
    sets `http.Client.Timeout=0` and never reads
    `payload.Request.Options`. Requests run indefinitely.
  - Recommended action: agent-side, decode `options.timeoutMs` from
    the wire envelope and wrap the request `ctx` with
    `context.WithTimeout`.

- **Token persistence not hydrated on reload → false "unpaired" state.**
  - Spec quote (`agent-control-plane.feature`, "Auto-update preserves
    the paired token"): "the next flight succeeds without re-pairing".
  - Current behaviour: `agent-slice.ts:23-31` reads
    `state.tokenId` to decide `'verifying'` vs `'unpaired'`. The
    slice's `tokenId` is never seeded from `localStorage` on boot —
    only set live by `pairingSucceeded`. After page reload it is
    `undefined`, so discovery always lands on `'unpaired'` even though
    the raw token sits in localStorage. (The flight path works because
    `pickRequester` reads `getAgentToken()` from storage directly, but
    the banner gaslights the user.)
  - Recommended action: dispatch `hydrateAgent({ tokenId: getAgentTokenId() ?? undefined })`
    once in the web entrypoint **before** `discoverAgentRequested`.

### P1 — material logic gaps

- **`agent_unauthorized` does not transition the slice → status stays
  `paired` while token is missing.**
  - Spec quote: "the web host clears localStorage and surfaces the
    Pair-agent UI".
  - Current: `apps-host/web/src/ipc/flight-service.ts:21-24` clears
    the token but does not dispatch `tokenRevoked` or any slice
    action. Banner stays silent; next flight re-tries `via-agent`,
    `pickRequester` finds no token and silently falls back to
    `browserFetchRequester` — user is left with CORS failures and no
    indication of why.
  - Recommended action: import `tokenRevoked` from `@beak/state/agent`
    and dispatch via `getAppStore()`.

- **Impostor path does not resume scanning.**
  - Spec quote: "And the web host discards 47821 and continues
    scanning".
  - Current: `store/effects/agent.ts:71-79` sets `verifyImpostor` and
    returns. The remaining ports in the range are never probed.
  - Recommended action: after `verifyImpostor`, loop `discoverAgent()`
    starting at `failedPort + 1` (requires plumbing a starting port
    into `discoverAgent`).

- **Agent process exit during steady state → no `agent_disconnected`
  reason, no `unreachable` transition.**
  - Spec quote (`agent-control-plane.feature` last scenario): "the
    next flight POST fails with connection refused … And the agent
    slice status transitions to 'unreachable' … in-flight SSE streams
    close, surfacing failed events with reason 'agent_disconnected'".
  - Current: `requester/agent.ts:33-36` catches the fetch error and
    passes the browser-supplied `TypeError: Failed to fetch` through
    unchanged. No slice transition.
  - Recommended action: in the `catch` block, classify network errors
    as `agent_disconnected`, dispatch `agentUnreachable()` via the
    store handle, and re-fire `discoverAgentRequested` once with a
    backoff.

- **Agent POST body Content-Type for `json_raw` is renderer-provided,
  not agent-enforced.**
  - Spec quote (`agent-flight.feature`, "POST with JSON body"): "the
    agent issues POST against the upstream with Content-Type
    'application/json'".
  - Current: agent passes through whatever headers the renderer sent;
    if the renderer omits a `Content-Type` header for a `json_raw`
    body, the upstream gets none.
  - Recommended action: agent should set
    `Content-Type: application/json` if `body.type === 'json_raw'` and
    no `Content-Type` header is present.

- **"Pairing cancelled" surface missing.**
  - Spec quote: "the web host shows 'Pairing cancelled' with a Retry
    button".
  - Current: `containers/AgentPairReturn.tsx:52-57` renders the raw
    error string. No dedicated copy, no Retry button.
  - Recommended action: add an `error === 'pairing_access_denied'`
    branch with the spec copy + a Retry button that dispatches
    `startAgentPairingRequested`.

### P2 — minor / UX

- **`Re-scan` and `discoverAgentRequested` have no debounce or
  in-flight guard.** A user mashing the banner button kicks off N
  parallel scans. Add an "already discovering" guard in the listener.
- **Stale `PendingPairing` in sessionStorage on failed exchange.**
  Throwing branches in `services/agent/pairing.ts:65-77` don't call
  `clearPending()`. Add a `finally` block.
- **`Origin` header check on `/pair` skipped when header is absent.**
  Acceptable for browser threat model; flag in spec that non-browser
  callers bypass.
- **`/pair/decision` lacks CSRF protection beyond the state nonce.**
  The state cookie-less design relies entirely on state being secret;
  acceptable but worth noting.
- **`renderContent` exhaustive fallback in `AgentStatusBanner.tsx:189-198`**
  never fires because the union is closed; remove or document.
- **Capability slice mounted on every host.** The ADR says "slice is
  mounted in the store only when the capability is not 'unsupported'."
  Current `store/index.ts:73-87` mounts unconditionally. Cheap state,
  acceptable, but documented behaviour drifts from ADR §6.

## 8. Scope creep / hidden behaviour / spec silence

### Scope creep

- **`AgentPreferencesSection` has a "Forget on this device" button**
  that dispatches `revokeAgentLocally`. Not in the spec (spec only
  describes tray-side revoke). Useful, but undocumented; add a
  scenario.
- **`requestOverviewSchema` in `wire/agent/flight.ts` uses
  `.passthrough()`** — wire contract is intentionally loose. ADR §2
  endorses this for forward-compat, but the agent then `json.RawMessage`s
  the headers (`apps-host/agent/internal/wire/wire.go:40`) and
  silently drops fields that don't conform. Spec is silent on the
  forward-compat semantics.

### Hidden behaviour

- **`touchLastUsedDebounced` in `apps-host/agent/internal/server/server.go:135-146`**
  — agent writes `tokens.json` every successful flight (debounced 1s).
  Not in the spec; minor IO churn; would surface in a sandboxed
  filesystem environment.
- **`AGENT_PROTOCOL_VERSION = 'pkce-pair-v1'`** advertised in healthz
  `supports`, but the renderer never checks it. Forward compat is
  hidden behind a one-string array.
- **Discovery dispatches `startDiscovery` even when reading from
  cache** (`store/effects/agent.ts:46-48`). The slice briefly
  transitions through `discovering` even when the cached URL is hit
  on the first probe — visible UI flicker.

### Spec silence

- **What happens on `complete` event for an already-failed flight?**
  Spec doesn't specify ordering guarantees. Code is robust (the
  renderer's `pendingFlights` map deletes on first terminal).
- **Should the renderer re-verify the HMAC challenge periodically
  during a long-lived session?** Spec only describes the discovery-time
  challenge. Current code does it once.
- **Is `localStorage` the right place for the raw token?** ADR
  acknowledges this is "the cheapest path"; spec is silent on the
  XSS exposure (a script-injected page reads the token and impersonates
  the renderer to the agent). Worth a follow-up ADR.
- **What signals "the agent is installed but not running"?** Spec
  Examples table lists `installed-not-running` as a distinct state, but
  the renderer has no way to detect installation — the OS-level
  manifest check would require an extra IPC. Currently collapses to
  `unreachable`.

## 9. Typecheck + test results

Run from the main repo root (worktree's `node_modules` is not
populated; the audited files are identical to the worktree by
inspection — the worktree is clean per gitStatus).

```
pnpm --filter @beak/common typecheck           → OK
pnpm --filter @beak/state typecheck            → OK
pnpm --filter @beak/ui typecheck               → OK
pnpm typecheck:apps-host                       → OK (all green)
pnpm --filter @beak/state exec vitest run src/agent
  Test Files  1 passed (1)
  Tests       7 passed (7)
  Duration    ~191ms
```

No regressions; no fixes applied.
