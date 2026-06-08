# /drive-test — local agent for web host

Scope: every test that exercises code in the local-agent feature surface
(`packages/common/src/wire/agent/**`, `packages/state/src/agent/**`,
`packages/ui/src/services/agent/**`, `packages/ui/src/store/effects/agent.ts`,
`apps-host/web/src/requester/agent.ts`).

This is a **test-quality** audit. No source edits, no new test files,
no commits — recommendations only.

---

## 1. Test surface

### Search

Searched all `*.test.ts(x)` files in `packages/state`, `packages/ui`,
`packages/common`, `apps-host/electron`, `apps-host/web` for imports of
agent code and for the strings `pkce` / `pairing` / `discoveryProbe`
/ `agent-slice` / `routing` etc.

Result — **exactly one** test file exercises agent code:

- `packages/state/src/agent/__tests__/routing.test.ts`

(The hit on `packages/ui/src/services/flight/__tests__/prepare-request.test.ts`
is a false positive — it only references the `user-agent` HTTP header.)

No tests exist in `packages/common/src/wire/agent`,
`packages/ui/src/services/agent`, `packages/ui/src/store/effects/agent.ts`,
or `apps-host/web/src/requester/agent.ts`. The `apps-host/web` package
has **zero** test files at all — running `vitest run` there prints
"No test files found".

### Coverage table (existence-only)

| Production file | Test file | Notes |
|---|---|---|
| `packages/common/src/wire/agent/index.ts` | — | constants only; not test-worthy |
| `packages/common/src/wire/agent/pairing.ts` | — | Zod schemas, untested |
| `packages/common/src/wire/agent/healthz.ts` | — | Zod schema, untested |
| `packages/common/src/wire/agent/flight.ts` | — | discriminated-union Zod schemas, untested |
| `packages/state/src/agent/types.ts` | — | type-only file; not test-worthy |
| `packages/state/src/agent/routing.ts` | `__tests__/routing.test.ts` | covered for `decideRouting`; **`selectRoutingDecision` selector untested** |
| `packages/state/src/agent/agent-slice.ts` | — | 12 reducer cases, all untested |
| `packages/state/src/agent/index.ts` | — | re-export barrel; not test-worthy |
| `packages/ui/src/services/agent/discovery.ts` | — | `probe`, `discoverAgent`, `verifyAgentIdentity` untested |
| `packages/ui/src/services/agent/pairing.ts` | — | `startPairing`, `completePairing`, `readPairingReturnQuery` untested |
| `packages/ui/src/services/agent/storage.ts` | — | localStorage wrappers, TTL logic, module-level capability singleton untested |
| `packages/ui/src/services/agent/crypto.ts` | — | PKCE, HMAC, base64url helpers untested |
| `packages/ui/src/services/agent/index.ts` | — | barrel |
| `packages/ui/src/store/effects/agent.ts` | — | 4 listener effects untested |
| `apps-host/web/src/requester/agent.ts` | — | SSE parser + base64→bytes + HTTP error handling untested |

**Headline number: 1 of 11 testable production files have a test.**

The single test file covers the deepest of the pure functions (a 38-line
synchronous state-machine decision). All side-effect-bearing code
(`fetch`, `sessionStorage`, `localStorage`, `crypto.subtle`, SSE stream
parsing) is untested.

---

## 2. Per-test-file evaluation

### `packages/state/src/agent/__tests__/routing.test.ts`

Seven `it` blocks, 52 lines total. Imports the SUT (`decideRouting`)
directly with no mocks. Pure unit tests of a pure function.

| # | Line | Test | Level | Mock health | Assertion quality | Notes |
|---|---|---|---|---|---|---|
| 1 | 6 | `always routes via default on unsupported hosts` | unit | n/a | iterates 3×3 = 9 combos, asserts each → `'via-default'` | good — covers the early-return branch exhaustively |
| 2 | 14 | `returns force-fail when an agent is required but not paired` | unit | n/a | iterates 3 statuses, all expect `'force-fail'` | good |
| 3 | 22 | `routes via agent when required and paired` | unit | n/a | single assertion | good |
| 4 | 28 | `respects browser-only even when paired` | unit | n/a | single assertion | good |
| 5 | 34 | `force-fails agent-only when not paired` | unit | n/a | single assertion | uses only `'unreachable'`; doesn't cover `'unpaired'` / `'discovering'` / `'idle'` / `'pairing'` for `agent-only` |
| 6 | 40 | `falls back to default when agent-when-available and not paired` | unit | n/a | single assertion | only tests `'unreachable'`; same gap as #5 |
| 7 | 46 | `routes via agent on optional + paired + agent-when-available` | unit | n/a | single assertion | redundant — same combo (optional / paired / agent-when-available) is implicit elsewhere, but explicit is fine |

**Level.** Correctly unit-level — `decideRouting` is pure, takes a value
object, returns a string literal. No environment dependence, no async,
no IO.

**Mock health.** None needed. Importantly, the test does **not** mock
the function under test (no smell).

**Assertion quality.** Specific. `.toBe(literal)` against a tight union
type. Failures will be diagnosable.

**Edge cases.**
- Golden path: covered.
- "Required + non-paired" matrix: covered for `unreachable`, `unpaired`,
  `discovering`. Missing `idle`, `pairing`, `verifying`, `impostor` — the
  ADR §6 table lists all 8 statuses, but the test only iterates 3 in
  this matrix.
- "agent-only + non-paired": only `'unreachable'` is tested. `'unpaired'`,
  `'pairing'`, `'discovering'` would all flow through the same branch
  but aren't asserted.
- "browser-only + various statuses": only `'paired'` is tested. If a
  future change breaks browser-only routing in the `unpaired` case the
  test won't catch it.
- The `'impostor'` and `'verifying'` statuses are **never asserted in
  any test**. That's a real gap — `'impostor'` is the security-critical
  state and the routing-decision contract for it is implicit.

**Setup hygiene.** No setup/teardown, no shared mutable state. Safe.

**Async correctness.** All tests are synchronous; no `async`/`await`
risk.

**Smells.** None. This is a clean, narrow, fast pure-function test
suite. The only complaints are coverage breadth (above) and one
redundant case (#7 vs. the implicit coverage from #2/#3).

**One concrete suggestion** (not a finding, just a recommendation): a
single table-driven test enumerating all 3 × 8 × 3 = 72 combinations
against an inline truth table would be both more thorough than the 7
cases *and* shorter to maintain. Pattern:

```ts
const cases: Array<[LocalAgentCapability, AgentStatus, AgentRoutingMode, 'via-agent' | 'via-default' | 'force-fail']> = [
  ['unsupported', 'idle', 'agent-when-available', 'via-default'],
  // ...
];
it.each(cases)('%s + %s + %s → %s', (cap, status, mode, expected) => { ... });
```

This is **table-stakes for a state-machine decision function** and would
mechanically close the 'impostor'/'verifying'/'pairing'/'idle' gap.

---

## 3. Test run results

```text
$ pnpm --filter @beak/state exec vitest run src/agent

 RUN  v4.1.6 /Users/afr/Source/github.com/getbeak/beak/packages/state

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Duration  161ms
```

All 7 agent tests pass.

Sanity-check of the surrounding packages:

| Package | Files | Tests | Failed | Notes |
|---|---|---|---|---|
| `@beak/state` | 38 | 625 | 0 | green |
| `@beak/common` | 8 | 128 | 0 | green |
| `@beak/ui` | 21 | 186 | **1** | one failure, **unrelated to agent** |
| `@beak/apps-host-web` | 0 | 0 | n/a | **no test files exist** |

The single `@beak/ui` failure is in
`src/lib/beak-project/__tests__/request.test.ts > readRequestNode (collection defaults active) > merges the collection baseUrl into a sparse override` — a `_collection.json` schema/merge test. Not in the agent
surface; surfaced here only for context. Out of scope for this audit;
leave it for the `/drive-feature` agent on this branch or whoever owns
the collection-defaults work.

---

## 4. Coverage gaps + prioritised recommendations

Production code in the feature surface with no test, ranked by impact.
For each I list: what's untested, what a smoke-level test set would
look like, and why it matters. **These are recommendations — do not
treat them as a TODO list to execute now.**

### P0 — untrusted-input handling and persisted-state mutation

#### `apps-host/web/src/requester/agent.ts`  (190 lines, **highest risk**)

This file parses an SSE byte stream from a localhost service into
heartbeat callbacks the flight slice consumes. The agent is local but
the input is still **untrusted from the renderer's perspective** (the
ADR's "localhost impostor" threat model). Untested:

- `consumeAgentSse` — the entire SSE state machine. Multiline `data:`
  joins, CR / LF / CRLF line endings (`nextLineEnd`), comment lines
  (`:`), trailing fragment without newline, mid-chunk UTF-8 boundary
  (decoder stream mode).
- `handleAgentFrame` — discriminates on `eventType`; non-object data is
  silently dropped; `reading_body` base64 decode (`base64ToBytes`); the
  `failed` frame's `error.message` extraction.
- HTTP-status branches in `start`: 401 → `agent_unauthorized`,
  non-ok → message with status, `response.body === null` →
  `agent returned empty body`, fetch throw → `failed` callback.

Recommended test focuses:
- Golden: feed a hand-rolled SSE stream containing `head_received` +
  `reading_body` + `complete` and assert callbacks fire with the right
  payloads in order (especially that `reading_body.buffer` arrives as a
  `Uint8Array`, not the original base64 string).
- Edges: CRLF lines, comment line ignored, blank-line-only buffer
  doesn't dispatch, trailing fragment, invalid JSON in a `data:`
  block throws via `failed` callback (currently it `throw`s out of
  `dispatch` and is caught by the outer try/catch — verify this works).
- Unhappy: 401 → `agent_unauthorized`, fetch throws → `failed` once,
  null body → `failed` once, unknown event type → silently ignored
  (today's behaviour; assert it so we notice if it changes).

Mocks needed: a fake `fetch` returning a `Response` whose `body` is a
`ReadableStream` you can write to from the test. Vitest's
`vi.stubGlobal('fetch', ...)` + a manual `ReadableStream` is the right
shape. No real network.

#### `packages/ui/src/services/agent/storage.ts`

Token + tokenId + cached baseUrl persistence to `localStorage`. Mutates
persisted state; logic is small but has a real bug surface:

- `getCachedAgentBaseUrl` TTL check (`AGENT_BASE_URL_CACHE_TTL_MS`,
  24h) — boundary conditions (exactly at TTL, in the past, missing
  timestamp, malformed timestamp).
- `safeGet`/`safeSet`/`safeDelete` swallow exceptions silently — at
  least one test should confirm that a `localStorage.setItem` throw
  doesn't propagate (private-mode / quota scenarios).
- Module-level `localAgentCapability` singleton — set/get round-trip;
  ensure the default is `'unsupported'`.

Recommended: 10-15 unit tests, jsdom env (vitest UI package config
already provides this), `beforeEach` to reset `localStorage` and use
`vi.useFakeTimers()` + `vi.setSystemTime()` for the TTL boundary.

#### `packages/ui/src/services/agent/pairing.ts`

Implements PKCE token exchange:
- State-mismatch defence (`pairing_state_mismatch`) is security-relevant
  — must be tested.
- `completePairing` error branches: missing code/state, no pending,
  corrupt pending JSON, state mismatch, non-OK token-exchange response
  (with status + detail body), invalid token response shape, success.
- `startPairing` writes `sessionStorage` with the PKCE verifier and
  opens a window — assert the URL it would open contains the
  challenge / state / return URL / `S256` method, in jsdom (mock
  `window.open`, assert on call args).

The session-storage tests in particular are P0 because a regression
in the verifier handling can silently break pairing security or, worse,
weaken it.

### P1 — code paths the Gherkin specs in `docs/features/agent-*.feature` describe

#### `packages/state/src/agent/agent-slice.ts`

12 reducer cases. Every action defined here is the canonical mutation
for the agent state machine documented in ADR §6. The slice has two
subtle conditional branches that are easy to break and **not** covered
by `routing.test.ts`:

- `agentDiscovered` — sets `status` to `'verifying'` when a `tokenId`
  is already present, otherwise `'unpaired'`. This is the bridge into
  the impersonation defence; a regression would silently skip the
  HMAC verification.
- `tokenRevoked` — sets `status` to `'unpaired'` when a `baseUrl` is
  present, otherwise `'unreachable'`. Subtle and worth pinning down.
- `verifyImpostor` — clears the `baseUrl`. If it didn't, a future
  `discoverAgentRequested` cycle could short-circuit on the stale URL.

Recommended: one test per action, covering both branches of the
conditional ones. ~12 tests.

#### `packages/ui/src/store/effects/agent.ts`

The four listener effects (`discoverAgentRequested`,
`startAgentPairingRequested`, `completeAgentPairingRequested`,
`revokeAgentLocally`) wire services to slice mutations. Worth at
least integration-level tests against a real store (Redux Toolkit's
`createListenerMiddleware` plays nicely in tests) with services
mocked:
- "discover with cached URL that probes ok → no full scan, dispatches
  `agentDiscovered`".
- "discover with cached URL that no longer probes → falls through to
  `discoverAgent`".
- "discover with token + ok verify → `verifyOk`".
- "discover with token + impostor → `verifyImpostor` + cache cleared".
- "startPairing without baseUrl → `pairingFailed('agent_unreachable')`".
- "completePairing success → token stored + cached + `pairingSucceeded`".
- "completePairing failure → `pairingFailed` with the error message".

This is the single highest-leverage test investment in the feature
surface — one file's worth of tests would protect most of the
end-to-end flow.

#### `packages/ui/src/services/agent/discovery.ts`

- `probe` golden + 4xx + 5xx + invalid JSON + fingerprint mismatch +
  timeout (use `AbortSignal.timeout` with `vi.useFakeTimers()`).
- `discoverAgent` — sequential scan; assert it returns the *first*
  responding port, not just *a* responding port. Use a counter in
  the `fetch` mock that returns null for ports 47821-47830 and ok
  for 47831.
- `verifyAgentIdentity` — golden + signature mismatch + nonce echo
  mismatch + missing signature + non-ok status. The HMAC verification
  is the security guarantee for the discovery step; not testing it is
  a smell.

### P2 — schema and pure-helper coverage

#### `packages/common/src/wire/agent/{flight,healthz,pairing}.ts`

Zod schemas at the trust boundary. A handful of `safeParse` tests per
schema (one valid case, one rejection per required field) would
document expected shape and catch silent regressions. Discriminated
union on `flightHeartbeatSchema` is the highest-value one — a
mis-shaped frame could otherwise pass `parse` and break a downstream
consumer.

#### `packages/ui/src/services/agent/crypto.ts`

The PKCE/HMAC primitives are thin wrappers over Web Crypto, but the
base64url encoding (`bytesToBase64Url` — strips `=`, swaps `+`/`/`) is
easy to break and used as the wire format. A handful of round-trip
tests with known vectors would suffice. Standard PKCE test vectors
from RFC 7636 §4.4 are public.

`selectRoutingDecision` (the curried selector in `routing.ts`) is
trivial enough to test with a fake root state; one test would close
the gap.

---

## 5. Test smells found

In the **single** existing test file:

- No smells in the conventional sense. The biggest is **incompleteness**
  rather than rot: the routing matrix is not exhausted (see Phase 2
  edge-case analysis above). `routing.test.ts:34` and `:40` each cover
  one of multiple equivalent statuses; `'impostor'`, `'verifying'`,
  `'pairing'`, `'idle'` are absent from the suite.

In the **feature surface overall**:

- **Single-file coverage** for a 13-file, multi-process, security-sensitive
  feature is itself a structural smell. The Gherkin specs in
  `docs/features/agent-*.feature` are not validated by any test —
  every scenario in those files relies on manual verification.
- **`apps-host/web` has zero tests.** `pnpm --filter @beak/apps-host-web run test:run`
  prints "No test files found". The host's flight-service IPC adapter
  (which decides whether to route via the agent or via browser fetch)
  and the agent requester are both there, both untested.

No "mocking the unit under test", no snapshot churn, no
tautological assertions, no missing `await`, no flaky time/randomness
in the file that does exist — because the file that exists is small,
pure, and disciplined. The shape is good; the **volume** is the problem.

---

## 6. Strengths to copy when filling the gaps

The one test file demonstrates patterns worth replicating:

1. **No mocks for pure functions.** `decideRouting` is imported directly.
   Future tests for `selectRoutingDecision`, `agent-slice` reducers,
   `base64ToBytes`, `bytesToBase64Url`, `processBuffer`/`nextLineEnd`
   (`apps-host/web/src/requester/agent.ts`) should be the same shape:
   direct import, exact-value assertions, no mocks.
2. **Combinatorial enumeration** (lines 7-11 nest two loops over the
   status / routing-mode tuple) is the right idea — it should be the
   default pattern for state-machine code. Extending to `it.each`
   would let the test names describe the case.
3. **Exact-string assertions** against a union type catch typos and
   regressions cheaply. The slice-reducer tests should follow the same
   pattern (`expect(state.status).toBe('verifying')`, not
   `.toBeDefined()`).
4. **Co-located in `__tests__/`** (rather than `*.test.ts` next to
   source). The state package consistently uses this — new agent
   tests should too, to match the rest of the package.
5. **Cold start time.** 161 ms for the file. The agent suite should
   stay in this range — none of the recommended tests need a slow
   environment (jsdom + fake timers + manual streams are all fast).
