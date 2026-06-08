# `/drive-security` — Local agent for the web host

Audited on branch `worktree-domain-audit` against the local-agent feature
surface plus the whole monorepo for dependency vulnerabilities.

**No source edits. No git commits. No secret rotation.** Recommendations
only.

---

## 1. Tools run

Detected (per `Phase 1` probe):

| Tool | Available | Used |
|---|---|---|
| `pnpm` | yes | yes — full repo dependency scan |
| `npm` | yes | not needed (pnpm covers the lockfile) |
| `yarn` | yes | not needed |
| `cargo` | yes | not needed (no Rust crates) |
| `go` | yes | yes — `go list -m all` to enumerate deps |
| `jq` | yes | yes — JSON post-processing |
| `rg` | yes | yes — secret regex + cross-file search |
| `biome` | yes | already run by `/drive-code` |
| `pip-audit`, `safety` | missing | n/a (no Python) |
| `govulncheck` | **missing** | Go-binary CVE scan skipped — see §4 watch items |
| `gitleaks`, `trufflehog` | missing | manual regex backstop used instead |
| `semgrep` | missing | manual per-file review used instead |
| `osv-scanner` | missing | overlapping pnpm coverage |

`govulncheck` is the notable gap — it's not installed locally, so the
Go-side dependency review is **import inspection only** (see §4). The
agent's runtime deps (`golang.org/x/sys`, `getlantern/systray`,
`pkg/browser`) have no in-scope CVEs known to me as of cutoff, but a
clean `govulncheck` pass is recommended before any GA release.

---

## 2. Threat model

The local agent listens on loopback (`127.0.0.1:47821..47840`) and
serves a small HTTP API to the web app (`beak.web` in prod, `localhost`
in dev). The relevant attackers:

1. **Malicious page in another tab.** Any origin in the user's browser
   can fetch the agent's loopback address — the CORS layer is the only
   thing keeping `evil.com` from issuing flights against the user's
   paired agent. (`evil.com` cannot read responses without a matching
   `Access-Control-Allow-Origin`, but it can *fire side-effecting
   requests* if the agent doesn't gate before executing.)
2. **Local impostor process.** Another local process can bind one of
   the agent's ports if it wins the bind race. The HMAC-keyed healthz
   challenge is the defence; an impostor without the paired token can
   answer `/healthz` but cannot produce the signature.
3. **Compromised npm dependency or transitive Go module.** Standard
   supply-chain risk.
4. **XSS on `beak.web`.** Out of scope for this feature, but the
   localStorage token is fully readable from `document` JS — any XSS
   on the web origin reads the agent token and runs flights as the
   user until revoke.

MITM is **not** part of the threat model because loopback never leaves
the host. TLS on `127.0.0.1` would be theatre.

---

## 3. Findings, severity-ordered

### P0 — fix before merging

#### P0-1. SSE frames are dispatched to slice without schema validation

`apps-host/web/src/requester/agent.ts:141-182` (`handleAgentFrame`):
the JSON parsed from each `data:` line is cast as `Record<string, unknown>`,
then handed to the heartbeat / complete / failed callbacks via `as never`
(lines 154, 174). The Zod schemas `flightHeartbeatSchema`,
`flightCompleteSchema`, `flightFailedSchema` exist in
`packages/common/src/wire/agent/flight.ts` *precisely* for this trust
boundary — they're not used.

Trust-model reasoning: the agent **is** local, but its output is
attacker-controlled if any of the following happens — (a) the
impostor branch in §discovery isn't caught (see P1-3), (b) a local
malware process replaces the binary, (c) a future feature lets the
agent fan out to remote upstreams whose response body somehow
round-trips back via the SSE channel. The schemas are cheap; the
casts hide the lack of validation.

Recommended action:
```ts
const result = flightHeartbeatSchema.safeParse({ ...frame, flightId });
if (!result.success) {
    callbacks.failed({ flightId, error: new Error('agent_invalid_frame') });
    return;
}
callbacks.heartbeat(result.data);
```

Also flagged by `/drive-code` as anti-pattern #2 (`as never` at trust
boundary). Repeated here for the security framing: the renderer treats
arbitrary objects as conforming to `FlightHeartbeatPayload` despite
the wire schema being declared two files over.

#### P0-2. Bearer token persists in `localStorage` — XSS-readable

`packages/ui/src/services/agent/storage.ts:15,45-51`. The raw bearer
token is stored at `localStorage['beak.agent.token']`. Any XSS payload
on the web origin (`beak.web`) reads the token via
`localStorage.getItem` and authenticates against the user's paired
agent for the full token lifetime (until manual revoke from the tray).

The choice is acknowledged by ADR-0001 §5 as "the cheapest path." For
a tool that brokers HTTP requests to arbitrary upstreams — including
internal APIs at the user's company — this is not just a token, it's
"act as the user against any URL the user can reach." Worth a real
threat-model conversation before GA, not a code-only fix.

Mitigations to consider:
- **Service-worker-scoped token** — store the bearer in a service worker
  registered for `beak.web`; never expose to page JS. Service-worker
  reach into `localStorage` is mediated; XSS in the page can't read it.
- **WebAuthn / passkey-based ceremonial unlock** — token is encrypted
  in `localStorage` under a key gated by a platform-auth ceremony at
  session start.
- **Short-lived tokens with refresh** — agent issues 15-minute tokens,
  renderer re-pairs silently. Reduces the XSS window from "until
  manual revoke" to "until next rotation."
- **Origin-bound token in an `HttpOnly` cookie** — would require the
  agent to set cookies for the renderer's origin, which is not
  possible cross-origin without a same-site bridge. Not viable on
  loopback.

Recommended action: surface this as a **follow-up ADR** before the
feature goes to GA. Today's behaviour is acceptable for the dev
preview but should not ship to a stable channel without a token-
hardening pass.

#### P0-3. `/pair/decision` accepts cross-origin POSTs (no Origin check)

`apps-host/agent/internal/server/pair.go:62-110` (`handlePairDecision`).
The endpoint accepts a POST containing only `state` (in the URL) and
`decision` (in the form). It **does not check the `Origin` header**.

Attack scenario:
1. User visits `evil.com` while paired with the agent. (Or: user is
   in the middle of a legitimate pair flow.)
2. `evil.com` knows the pairing port range and probes for the right
   port (the user's machine), discovers the agent via the open `*`
   CORS healthz.
3. The legitimate `/pair` page is rendered (the user is staring at
   it). `evil.com` does **not** know the state nonce — but a phishing
   variant could trick the user into pasting it, or a `targets="_blank"`
   redirect could intercept the legitimate flow before the user clicks
   Allow.

Today this is bounded by:
- The state nonce is unguessable (`crypto/rand` 16 bytes,
  base64url'd).
- The state nonce is only known to the renderer that initiated
  pairing and the user staring at the approval page.
- The window is 5 minutes (`PendingTTL`).

But the spec explicitly says (`agent-control-plane.feature`) "Origin
spoofing on /pair is rejected" — and the spec's wording was meant to
cover the whole pair flow, not just GET `/pair`. The `/pair/decision`
hole is acceptable today only because the state nonce is secret;
losing the nonce by any means (URL leak in browser history,
referrer header to a redirect, screen-recording malware) bypasses
the only remaining check.

Recommended action: enforce that `/pair/decision` requires the
`Origin` header to match what was passed to `/pair` (or be empty,
allowing `<form>` POST from the agent's own HTML page — which is the
*intended* caller). Better: rotate the state nonce on each request
and use a same-site session cookie that the approval HTML reads.

Also flagged by `/drive-feature` §4 (last bullet) — repeated here
with the security framing.

#### P0-4. Token-keyed nonce challenge sends the bearer token over the wire on every probe

`packages/ui/src/services/agent/discovery.ts:62-67`. When the
renderer verifies a cached/discovered agent against the impostor
threat (`verifyAgentIdentity`), it sends `Authorization: Bearer
<token>` to **whatever process answered `/healthz`** on that port,
including the impostor.

The defence (HMAC over the nonce, recomputed client-side) does
detect the impostor — but only **after** the token has already
crossed the wire to the impostor. An impostor that wins the bind
race for the agent's port now holds the user's token; the renderer
will mark it as impostor and refuse to route flights via it, but the
token is *valid* against the real agent. The impostor can replay
the token against the real agent on its real port (if it can find
it) until manual revoke.

This is a fundamental tension: to verify identity via HMAC the
renderer must prove possession of the token, but proving possession
without a challenge-response in the **opposite** direction means the
token leaks. The RFC-style fix is signed-nonce auth (renderer signs
with a per-pair private key; agent verifies with the pair's public
key) instead of bearer-style.

Recommended action: rework `verifyAgentIdentity` so the **renderer**
proves possession via a signature, not by sending the token. Options:
- Renderer holds a per-pair private key; pairing returns the public
  key; verification = sign(nonce) round-trip with public-key verify
  on the agent.
- Two-step: probe `/healthz` with no auth, get a fingerprint, and
  only call the authenticated endpoint after `/healthz` returns an
  expected fingerprint payload. Doesn't fully fix the issue (the
  impostor can echo back the renderer's expectations) but reduces
  the surface.

Hard to fix without an ADR; mark as security-debt.

---

### P1 — fix this sprint

#### P1-1. `/.beak/agent/healthz` CORS is `Access-Control-Allow-Origin: *`

`apps-host/agent/internal/server/cors.go:8-14`. The discovery
endpoint advertises:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Authorization, Content-Type
```

This is **deliberate** (the comment says "Discovery must work
pre-pairing, so we can't restrict origin here") and consistent with
the discovery design. The consequence: *any* origin can fingerprint
the user's agent via `fetch('http://127.0.0.1:47821/.beak/agent/healthz')`.
The response leaks:

- `agent: "beak"` — confirms the user has Beak installed.
- `version: "0.1.0"` — exact agent version, useful for CVE targeting.
- `supports: ["sse", "pkce-pair-v1"]` — feature-flag enumeration.

Combined with the wide port range (20 ports), any web page can
fingerprint Beak in <100ms. This is "browser-fingerprinting at the
local-agent level."

Recommended action:
- Trim the healthz response to **just** `{ agent: "beak" }`
  (drop version and supports unless the caller carries a bearer).
- Better: require an `Origin` header on healthz and reject if it's
  not in an allowlist published in the agent's config (e.g.
  `https://beak.web`, `http://localhost:*`). The list grows when
  the user pairs; pre-pair, only the known web-app hosts can
  fingerprint.
- Best (orthogonal): rate-limit `/healthz` per remote address. A
  malicious page that probes 20 ports × 200ms = 4s of fetches will
  trip the limit.

Also flagged by `/drive-feature` (scope-creep) — `AGENT_PROTOCOL_VERSION`
is advertised but never consumed; it's pure metadata leak today.

#### P1-2. `/healthz` 401-free token validation on impostor's wire (compounded with P0-4)

`apps-host/agent/internal/server/healthz.go:34-46`. When the renderer
sends `?nonce=…` + Authorization, the agent looks up the token in
the store and, if found, computes the HMAC signature. **An impostor
on the same port simply ignores the Authorization header** — it
doesn't reject the request, so the renderer sees a 200 OK with no
`signature` field and the verification fails. Good defence.

But: if the impostor returns a *random* signature (not knowing the
key), the renderer's constant-time compare correctly says "mismatch."
Slight risk: a sophisticated impostor that **records** the agent's
historical signatures (over multiple cold-start sessions if the
agent reuses HMAC key material) could replay. The agent uses the
token text as the HMAC key, which rotates per-pair, so cross-session
replay is bounded. **Acceptable.**

Recommended action: add a per-request agent nonce so even a
recorded signature can't replay. Cheap; current shape is acceptable.

#### P1-3. Impostor path does not resume scanning

`packages/ui/src/store/effects/agent.ts:71-79`. When verification
fails (impostor detected), the slice transitions to `'impostor'`,
the cached base URL is cleared, and **the renderer stops**. The
real agent on a higher port is never found.

Security framing: this turns a single hostile process binding port
47821 into a permanent DoS of the agent integration for the user,
even though the real agent is happily running on 47822.

Already flagged by `/drive-feature` §3 (impostor row). Repeated here
because the **fix matters for security** — without resumption, an
attacker who can land on port 47821 once silences the agent path
forever.

Recommended action: after `verifyImpostor`, re-trigger discovery
from `failedPort + 1` (requires plumbing a start port into
`discoverAgent`). Already cheap.

#### P1-4. Pending PKCE verifier in sessionStorage not cleared on failure

`packages/ui/src/services/agent/pairing.ts:64-94`. The failure branches
(`pairing_error`, `pairing_missing_code_or_state`, `pairing_no_pending`,
`pairing_corrupt_pending`, `pairing_state_mismatch`,
`pairing_token_exchange_failed_*`, `pairing_invalid_token_response`)
all throw without calling `clearPending()`. `clearPending` is only
called on the success path (line 93).

Consequence: the `codeVerifier` lingers in sessionStorage. A second
pair flow in the same tab inherits the stale verifier, fails with
`pairing_state_mismatch`, and the verifier *still* doesn't clear.
The window is per-tab and self-resets on tab close, but:
- A retried pair flow needs an extra round-trip to escape the
  stale state.
- Any concurrent XSS on the page that survives the failed flow can
  exfiltrate the stale verifier (XSS-on-sessionStorage is the same
  reach as XSS-on-localStorage; the verifier alone is harmless, but
  combined with a known `code` it could complete the pair).

Recommended action: wrap the body in `try { ... } finally { clearPending(); }`,
or call `clearPending` in every throw branch. Trivial.

Also flagged by `/drive-feature` §7.P2 ("stale `PendingPairing` in
sessionStorage on failed exchange") — repeated for security framing.

#### P1-5. `agent_unauthorized` does not transition slice state

`apps-host/web/src/ipc/flight-service.ts:21-24`. When the agent
returns 401, the host clears the token from `localStorage` but
**does not dispatch any slice action**. The slice stays in
`'paired'`; subsequent flights compute `decideRouting → 'via-agent'`,
`pickRequester` finds no token, and silently falls back to
`browserFetchRequester`.

Security framing: this is "fail open." The user's flights go out
via the browser (which the agent was meant to replace for CORS-blocked
upstreams) without any indication. If the user was relying on the
agent for **authentication** (e.g., a corporate API only reachable
from the agent's network position), the silent fallback could leak
the request to a different network path.

Already flagged by `/drive-feature` §7.P1. Repeated here because
the security framing is "silent degradation = bad."

Recommended action: dispatch `tokenRevoked()` in the 401 branch.
The slice transitions to `'unpaired'`, the banner re-renders the
Pair CTA, and future flights either fail fast (`'force-fail'`) or
route via browser explicitly per the user's `routingMode`.

#### P1-6. Verifier signature audit — `verifyPKCE` is OK; `code_verifier` in token body

`apps-host/agent/internal/pairing/pairing.go:86-90`. SHA-256(verifier)
compared with base64url challenge via `subtle.ConstantTimeCompare`.
Constant-time. **Pass.**

But: `code_verifier` is sent in the **POST body** to `/pair/token`
(`packages/ui/src/services/agent/pairing.ts:83`). Bodies don't
appear in browser referrer or in URL logs, which is correct per
RFC 7636. **Pass.** Flagged here for the file.

#### P1-7. `/pair` GET parameters include `code_challenge` and `state` in the URL

`packages/ui/src/services/agent/pairing.ts:28-34`. The pair URL
(opened in a new tab via `window.open`) contains:
- `origin` — the renderer's origin (`https://beak.web`).
- `state` — 16-byte random base64url.
- `code_challenge` — SHA-256 of the verifier, base64url.
- `code_challenge_method=S256`.
- `return` — return URL.

`code_challenge` is safe in a URL (it's a hash, not the verifier).
`state` is single-use; not particularly sensitive after expiry. The
URL ends up in browser history. Acceptable per RFC 7636.

`window.open(..., '_blank', 'noopener')` is set — the spawned tab
can't `window.opener.postMessage`-attack back. **Pass.**

But: `noreferrer` is **not** set. The default `Referrer-Policy`
will send the renderer's full URL (including its query string, if
any) to the agent at `http://127.0.0.1:<port>/pair?...`. The agent
is on loopback, so the referrer leak is "to the user's own
machine" — low-risk, but worth `'noopener,noreferrer'` for
defence-in-depth.

Recommended action: change `window.open(pairUrl.toString(), '_blank', 'noopener')`
to `window.open(pairUrl.toString(), '_blank', 'noopener,noreferrer')`.
Trivial.

#### P1-8. No upper bound on `/flight` POST body or upstream response

`apps-host/agent/internal/server/flight.go:42-50`. The agent calls
`json.NewDecoder(r.Body).Decode(&payload)` with no `MaxBytesReader`
wrapping `r.Body`. A renderer (or an XSS'd renderer) can POST
unboundedly large bodies; the agent decodes the entire stream
into memory.

Similarly the upstream response is streamed via `resp.Body.Read(buf)`
with a 64KB buffer but no overall size cap. A malicious upstream
that streams forever (or a renderer that points the agent at a
slow-loris) will hold the agent's goroutine open.

Today the impact is local: a malicious page on `evil.com` can't
authenticate to the agent (no token), so this is a same-origin
issue (the paired origin can DoS *itself*). Worth fixing for
defence-in-depth.

Recommended action:
- Wrap `r.Body` with `http.MaxBytesReader(w, r.Body, MaxFlightBodyBytes)`
  before decoding. Pick a generous limit (e.g. 10 MB).
- Honour `options.timeoutMs` from the wire envelope to cap the
  upstream call (already noted as P0 gap by `/drive-feature`; this
  fix doubles as a DoS mitigation).

Also flagged by `/drive-feature` (timeout gap, agent-flight feature).

---

### P2 — polish / hardening

#### P2-1. Agent server has no `WriteTimeout` / `IdleTimeout`

`apps-host/agent/internal/server/server.go:92-95`. The `http.Server`
sets only `ReadHeaderTimeout: 10s`. No `WriteTimeout`, no
`IdleTimeout`. Slow clients holding the response open can pin the
goroutine pool. Loopback-only, but cheap to fix.

Recommended action: set sensible defaults (`WriteTimeout: 0` for the
SSE handler is intentional; can set a per-route timeout via middleware,
or wrap non-SSE routes in their own `http.Server` middleware that
applies a write timeout).

#### P2-2. `tokens.json` written with `0o600` — good. Parent dir `0o700` — good.

`apps-host/agent/internal/pairing/tokens.go:78` and
`apps-host/agent/internal/config/paths.go:22`. Both correct.

The token file contains the **hash** of the raw token only
(`tokens.go:101`). Compromising `tokens.json` alone does not
recover any raw token. **Pass.**

#### P2-3. `runtime.json` (PID + port) written with `0o600` — good

`apps-host/agent/internal/config/runtime.go:37`. Other local
processes running as the same user can read it (file mode is per-user,
not per-process), which means any local malware running as the user
can read the port immediately. Not a fix — it's the threat-model
boundary. Worth a comment that says "any local code running as the
user is already a fail."

#### P2-4. Constant-time string compare in the renderer is bytewise XOR

`packages/ui/src/services/agent/discovery.ts:82-87`. The check loops
over `charCodeAt` and bitwise-ORs the XOR diff. JS doesn't expose a
built-in constant-time compare, and this user-land loop is the right
shape — but JS engines may optimize bail-out on `diff === 0` after
the loop, which is acceptable.

The first-line `a.length !== b.length` bails non-constant-time on
length mismatch, which is fine because the signature length is
fixed and known (43 chars for HMAC-SHA-256 base64url no-pad).

Recommended action: keep. If the Web Crypto API gains a constant-
time-compare primitive, switch.

#### P2-5. `console.error('[flight] requester crashed', error)` may log token

`apps-host/web/src/ipc/flight-service.ts:38`. The error is the raw
`Error` instance; today it's never built from a string containing
the token. But future refactors that wrap the token into an error
message (e.g., "request to http://127.0.0.1:47821/flight with
Authorization=Bearer …") would leak. Pin the log shape now:
`console.error('[flight] requester crashed', { message: error.message })`.

#### P2-6. Token cache TTL on **read** is correct; write doesn't check.

`packages/ui/src/services/agent/storage.ts:60-79`. Token itself has
no TTL — relies on the agent revoking when it disappears. Base URL
has 24h TTL. The asymmetry is correct: tokens don't expire
client-side; only the discovery cache does. **Pass.**

#### P2-7. Approval HTML uses double-quote in `replaceAll` substitution

`apps-host/agent/internal/server/pair.go:38-40`. `htmlEscape` escapes
`&<>"'` — covers reflected XSS via the `{{Origin}}` placeholder.
Same for `{{State}}` and `{{ActionPath}}`. **Pass.**

But: the `state` and `actionPath` are CSP-safe in the HTML attribute
context (`action="..."?state=..."`). The current escape is sufficient
for HTML-attribute context. **Pass.**

#### P2-8. CSPRNG usage in the renderer

`packages/ui/src/services/agent/crypto.ts:14-18`. `randomBytes` uses
`window.crypto.getRandomValues` (CSPRNG). `newState` (`newPkcePair`)
both consume it. No `Math.random` anywhere on the security path.
**Pass.**

`apps-host/agent/internal/server/pair.go:213-219` (`generateRandomToken`)
uses `crypto/rand`. **Pass.**

`apps-host/agent/internal/pairing/tokens.go:85-96` uses `crypto/rand`
for the token and tokenId. **Pass.**

#### P2-9. AES / cipher choices

No AES anywhere in this feature — the threat model assumes loopback
+ origin-scoped tokens, not encryption at rest of the renderer-side
token. **N/A.**

#### P2-10. `code_verifier` length is 32 random bytes → 43-char base64url

`packages/ui/src/services/agent/crypto.ts:51`. RFC 7636 §4.1 mandates
a code verifier between 43 and 128 chars. 32 bytes base64url = 43
chars. **At the minimum.** Recommended to bump to 48 bytes (64
chars) for headroom; current value passes RFC.

#### P2-11. `state` length is 16 random bytes → 22-char base64url

`packages/ui/src/services/agent/crypto.ts:56`. ~128 bits of entropy.
Sufficient for CSRF defence in a 5-minute window. **Pass.**

---

## 4. Dependency vulnerabilities

### JavaScript (pnpm audit) — full repo

36 advisories total. Reachability commentary inline.

| Severity | Package | Advisory | Direct/Transitive | Reachable from agent? |
|---|---|---|---|---|
| **critical** | `sanitize-html@2.17.3` | XSS via `xmp` raw-text passthrough (GHSA-rpr9-rxv7-x643) | direct in `packages/ui` | **No** — agent feature does not call `sanitize-html` on agent-controlled content. Used elsewhere in `@beak/ui`. **Fix anyway** (bump to >=2.17.4). |
| high | `tar` (multiple, 6 advisories) | hardlink/symlink traversal, race condition | transitive via `electron-builder` | **No** — build-time only. |
| high | `electron` (4 advisories) | use-after-free in offscreen, WebContents, PowerMonitor; renderer cmdline switch injection | direct (electron host) | **No** to the web-host agent path; **Yes** to the electron desktop app generally. Bump electron at next planned upgrade. |
| high | `devalue` | DoS via sparse array deserialization | transitive via `@astrojs/react` (marketing site) | **No** — agent feature unaffected; marketing site is separate. |
| high | `tmp` | path traversal via prefix/postfix | transitive via electron-builder | **No** — build-time. |
| moderate | `yaml` | stack overflow on deeply nested | transitive via `@astrojs/check` | **No** — marketing site. |
| moderate | `dompurify` (8 advisories) | XSS bypasses, prototype pollution | transitive via `monaco-editor` | **No to agent path**; renderer uses Monaco for code editing, not for agent-controlled data. Worth bumping at next monaco-editor refresh. |
| moderate | `electron` (8 advisories) | AppleScript injection, sw spoofing, origin-pass | direct (electron) | **No** to web-host agent path. |
| moderate | `qs` | DoS via `qs.stringify` | transitive via `crpc>json-client` | **No** to agent path — agent's wire payload is JSON via `JSON.stringify`, not `qs`. |
| low | `electron` (4 advisories) | Unquoted path, USB selection, UAF in shared texture, clipboard crash | direct (electron) | **No** to web-host agent path. |

**Summary: no advisory reachable on the local-agent feature surface.**
The `sanitize-html` critical is direct in `@beak/ui` but unrelated to
the agent code paths. The electron advisories don't touch the web host
where the agent ships today.

Recommended actions (full-repo, not feature-blocking):
- Bump `sanitize-html` → `>=2.17.4` (P1-critical, easy fix).
- Bump `electron` to the latest patched line at the next desktop
  release-cadence pass.
- Update `monaco-editor` to a build that pulls a newer `dompurify`.
- The transitive `tar`/`tmp`/`devalue`/`yaml`/`qs` advisories are all
  in build- or marketing-side deps and not exploitable from the
  product runtime.

### Go (govulncheck) — skipped

`govulncheck` is not installed on this machine; running it requires
`go install golang.org/x/vuln/cmd/govulncheck@latest`. The agent's
direct deps are:

| Module | Version | Notes |
|---|---|---|
| `github.com/getlantern/systray` | v1.2.2 | Tray icon. Last release 2022; community-maintained. No CVEs as of cutoff. |
| `github.com/pkg/browser` | v0.0.0-20240102 | Opens URLs in the default browser. Tiny package. No CVEs. |
| `golang.org/x/sys` | v0.1.0 | **Stale** — current is `v0.30.x`. Bump strongly recommended. No specific CVE pinned to v0.1.0 in this surface, but stay current. |

Indirect deps via `getlantern/*` are 2019-vintage; the `errors`,
`context`, `golog`, `hidden`, `hex`, `ops` packages are simple
utility modules with no network surface. The dependency tree is
small (12 modules total). Manual review found no obvious red flags.

**Recommended action: install and run `govulncheck` in CI before GA.**

---

## 5. Secret-scan results

Both manual regex scans of the feature surface (renderer + host + Go
binary):

- `(api[_-]?key|secret|token|password|passwd|pwd|client[_-]?secret)\s*[:=]\s*["\047][^"\047\s]{8,}` — **0 hits.**
- `eyJ…\.eyJ…\.[…]|AKIA…|ghp_…|sk_(live|test)_…|-----BEGIN` — **0 hits.**

**Clean.** No real-looking secrets in the agent feature surface or the
Go binary. The string literals that look secret-adjacent are all keys
into storage (`'beak.agent.token'`, `'beak.agent.tokenId'`,
`'beak.agent.baseUrl'`, `'beak.agent.pairing.pending'`) — these are
the *names* of the storage slots, not their values. Confirmed by
inspection.

The `pairTokenResponseSchema` test fixture in any future test file
should use the wire format directly (no live-token).

---

## 6. Cross-references to other audits

| Finding (here) | Already flagged elsewhere | Where |
|---|---|---|
| P0-1 (SSE schema validation) | `/drive-code` §6 anti-pattern #2; §7 P0-2 | `audit/drive-code-local-agent.md:212-213, 236` |
| P0-2 (localStorage token / XSS) | `/drive-feature` §8 spec-silence ("Is localStorage the right place for the raw token?") | `audit/drive-feature-local-agent.md:400-402` |
| P0-3 (`/pair/decision` CSRF) | `/drive-feature` §4 last bullet ("`/pair/decision` lacks CSRF protection beyond the state nonce") | `audit/drive-feature-local-agent.md:150` |
| P1-3 (impostor no scan resume) | `/drive-feature` §3 (control-plane row) | `audit/drive-feature-local-agent.md:91` |
| P1-4 (stale PKCE pending) | `/drive-feature` §7 P2 ("stale `PendingPairing` in sessionStorage on failed exchange") | `audit/drive-feature-local-agent.md:347-348` |
| P1-5 (`agent_unauthorized` no transition) | `/drive-feature` §7 P1 ("`agent_unauthorized` does not transition the slice") | `audit/drive-feature-local-agent.md:284-296` |
| P1-8 (no body size cap / timeoutMs) | `/drive-feature` §3 ("Upstream timeout becomes a failed event"); §7 P0-2 | `audit/drive-feature-local-agent.md:128, 256-267` |
| Schema validation missing → tests | `/drive-test` §4 P0 (`agent.ts` SSE state machine untested) | `audit/drive-test-local-agent.md:174-208` |

The other audits flagged these as code / feature / test concerns.
This audit re-frames them as **security** concerns and adds:
- P0-2 (token in localStorage — threat-model framing).
- P0-4 (token leak to impostor on verification probe — new finding).
- P1-1 (healthz fingerprinting via `*` CORS — new finding).
- P1-7 (window.open missing `noreferrer` — new finding).
- P1-8 (no MaxBytesReader / agent DoS — new finding).
- P2-1 / P2-3 / P2-5 (server timeouts, runtime.json visibility, log-leak hardening — new findings).

---

## 7. Watch items

Tracked, not actionable today:

1. **govulncheck in CI.** Wire `govulncheck ./...` into the `beak-agent`
   build job. Until that happens, Go-side CVE coverage is import-list
   review only.
2. **`localStorage` token — ADR follow-up.** P0-2 is a real security
   conversation: service-worker token? Passkey-gated unlock? Refresh
   tokens? Pick a direction before GA.
3. **DNS rebinding on `127.0.0.1`.** A clever attacker can use DNS
   rebinding to make `evil.com` resolve to `127.0.0.1` and bypass
   Same-Origin Policy. The CORS layer is the only defence; the
   `Origin` check on `/flight` and `/pair/token` covers the well-
   behaved-browser case. A non-browser DNS-rebinder doesn't send the
   right `Origin` and is rejected. Worth a follow-up note.
4. **Token rotation.** Tokens are issued once, valid until tray-side
   revoke. No periodic rotation. For a tool that brokers HTTP, a
   90-day rotation cycle is industry standard.
5. **`tokens.json` corruption recovery.** If the file is truncated or
   corrupted between writes, `OpenTokenStore` returns an error and the
   agent fails to start. No recovery (rename to `.bad`, start with
   empty store). Worth a note for stability, not security.
6. **Audit trail.** The agent persists `lastUsedAt` per token but does
   not log which origin issued how many flights. A `journal.log`
   (append-only, per-token, per-flight) would help post-incident
   review. Not security-blocking.
7. **Tray UI confirmation for revoke.** The tray's revoke path
   (`tokens.Revoke`) doesn't surface a "Are you sure?" beat — out of
   audit scope, but worth tracking for UX/security crossover.
8. **`AGENT_PROTOCOL_VERSION` is metadata leak (P1-1) and dead code
   (`/drive-code` P2).** Two reasons to drop it from the healthz
   response.

---

## 8. Strengths to preserve

- **PKCE-S256 by the book.** RFC 7636 compliant; the only weakness is
  the per-step bearer leak at verification time (P0-4), not the PKCE
  itself.
- **Tokens stored as hash on disk.** `tokens.json` cannot be exfiltrated
  to compromise the user; only the hash is persisted (P2-2).
- **CSPRNG everywhere on the security path.** No `Math.random` in
  pairing or HMAC code (P2-8).
- **Constant-time comparisons in both places.** `subtle.ConstantTimeCompare`
  on the Go side; userland-but-correct XOR loop on the renderer (P2-4).
- **`Origin` check on the authenticated endpoints.** `/flight` and
  `/pair/token` both gate on origin against the paired set
  (`flight.go:14-34`, `pair.go:149-151`). The hole is `/pair/decision`
  (P0-3), not `/flight`.
- **Tight file permissions.** `0o600` on `tokens.json` and `runtime.json`;
  `0o700` on the config dir.
- **HTML-escape on the approval template.** Reflected XSS via `{{Origin}}`
  closed (P2-7).
- **`window.open` with `noopener`.** Tab-nabbing closed; `noreferrer`
  would be defence-in-depth (P1-7).
- **No `Math.random`, no weak crypto modes, no plaintext token on disk.**
