# `/drive-code` — Local Agent for the Web Host

Audited on branch `worktree-domain-audit` against ADRs 0001–0006 (all *Proposed* except 0001 *Accepted*). No source edits were made. Output is advisory; human reviewer fixes after the parallel `/drive-feature` and `/drive-test` agents land.

## 1. Audited files

Feature surface (13 listed + 5 callers inspected for context, no Go code audited):

**Wire contracts** (`packages/common/src/wire/agent/`)
- `index.ts`, `pairing.ts`, `healthz.ts`, `flight.ts`, `README.md`

**State slice** (`packages/state/src/agent/`)
- `agent-slice.ts`, `routing.ts`, `types.ts`, `index.ts`
- (sibling test: `__tests__/routing.test.ts`)

**Renderer service** (`packages/ui/src/services/agent/`)
- `discovery.ts`, `pairing.ts`, `storage.ts`, `crypto.ts`, `index.ts`

**Store effect**
- `packages/ui/src/store/effects/agent.ts`

**Web host requester** (`apps-host/web/src/requester/`)
- `agent.ts`, `browser-fetch.ts`, `types.ts`, `index.ts`

**Callers inspected for ADR conformance** (not audited as core surface):
- `packages/ui/src/components/molecules/AgentStatusBanner.tsx`
- `packages/ui/src/containers/AgentPairReturn.tsx`
- `packages/ui/src/features/preferences/components/molecules/AgentPreferencesSection.tsx`
- `packages/ui/src/entrypoints/web.tsx`
- `apps-host/web/src/ipc/flight-service.ts`
- `apps-host/web/src/setup-web-host.ts`

**Total LOC** for the audited files: **1206** (per `wc -l`). The fattest single file is `apps-host/web/src/requester/agent.ts` at 189 LOC.

## 2. Per-file table

| File | LOC | Single-responsibility | Layer fit (ADR 0002) | Naming | Imports clean? | Anti-patterns | Recommendation |
|---|---|---|---|---|---|---|---|
| `common/wire/agent/index.ts` | 18 | Yes — barrel + protocol constants | Correct (`common/wire/<d>/`) | OK | Yes | `AGENT_PROTOCOL_VERSION` is **dead code** (no importers) | Drop the const, or wire it into the healthz handshake |
| `common/wire/agent/pairing.ts` | 31 | Yes — `/pair` schemas | Correct | snake_case keys flagged by Biome (`code_challenge`, `code_verifier`, `error_description`); intentional OAuth wire spelling but should be silenced with a `// biome-ignore lint/style/useNamingConvention` comment so the rule stays useful elsewhere | Yes | `pairCodeChallengeMethodSchema`, `pairInitQuerySchema`, `pairTokenRequestSchema`, `pairErrorResponseSchema` are exported but **not consumed by any TypeScript caller** (only the Go side mirrors them) | Keep them (Go counterpart relies on Zod-as-source-of-truth), but mark intent explicitly — they're "Go-mirror only" or add a `pnpm wire-gen` consumer |
| `common/wire/agent/healthz.ts` | 14 | Yes — healthz response schema | Correct | OK | Yes | None | Keep |
| `common/wire/agent/flight.ts` | 108 | Yes — `/flight` SSE event schemas | Correct, but every TS-side `safeParse` consumer is missing — see Anti-patterns §6 below | OK | Yes | `requestOverviewSchema` uses `.passthrough()` + `z.unknown()` (`url: z.array(z.unknown())`, `body: ...passthrough()`) — duplicates the `RequestOverview` type that already exists at `@getbeak/types/request`. Should be tightened with `import type` from there once codegen lands. Wire types **duplicate** `FlightHeartbeatPayload`, `FlightCompletePayload`, `FlightFailedPayload`, `SseEvent`, `ResponseStreamKind` in `packages/common/src/types/requester.ts` — direct ADR-0003 §4 violation | Pick one source of truth: either the hand-written interfaces become `z.infer` from these schemas (`type FlightHeartbeatPayload = z.infer<typeof flightHeartbeatSchema>`), or the wire schemas are derived from the interfaces |
| `common/wire/agent/README.md` | 39 | N/A — docs | Correct location | N/A | N/A | None | Keep |
| `state/agent/agent-slice.ts` | 100 | Yes — pure slice + selectors | Correct | OK | Yes | `AgentSliceState` is re-exported via `index.ts` (used by `packages/ui/src/store/index.ts` to declare `ApplicationState`). Per ADR 0005 §6 "the slice's internal `State` shape is **not** exported". The current pattern is consistent with the rest of `@beak/ui/store/index.ts` but reads counter to the new convention. Selectors locally declare `AgentRootState` instead of importing the shared `ApplicationState` — works fine but the duplication will rot | After ADR 0005 lands, hide `AgentSliceState` and have store/index reach the shape via the slice import |
| `state/agent/routing.ts` | 56 | Yes — pure decision function + selector | Correct (pure helper per ADR 0005 §4) | OK | Yes | `LocalAgentCapability` is declared **here** in `state/`, but it's a runtime capability — same `'unsupported' \| 'optional' \| 'required'` literal already lives in `runtime-shared/src/base.ts:40`. Two declarations of the same type. ADR 0006 says capabilities live in the runtime; this should `import type` from there | Replace the local `export type LocalAgentCapability` with `type LocalAgentCapability = RuntimeCapabilities['localAgent']` to point at the runtime declaration (`@beak/runtime-shared`) |
| `state/agent/types.ts` | 33 | Yes — slice State + literals | Correct (kept narrow per ADR 0003 §2) | OK | Yes | `AgentRoutingMode` is a wire-relevant concept (it shapes routing); consider whether it should live next to the wire schemas. Today it's slice-only so probably fine | Keep |
| `state/agent/index.ts` | 4 | Yes — barrel | Correct | OK | Re-exports `*` from `types`, exposing `AgentSliceState` to outside packages (see slice row) | Public surface is too wide | Switch to explicit re-exports; hide `AgentSliceState` |
| `ui/services/agent/discovery.ts` | 87 | Yes — single concern (probe + verify) | Correct (`services/<d>/`); imports only from `common/wire/agent` and sibling `./crypto` — clean | `Authorization` header key flagged by Biome (legitimately must be `Authorization` per HTTP spec; suppress) | Yes | `as unknown` casts at the fetch boundary (lines 43, 69) are normal pre-`safeParse`; fine. Sequential `for` loop over the port range (line 26) is intentionally serial — see footnote | Add a `// biome-ignore lint/style/useNamingConvention` over the `Authorization` literal. Consider parallelising with `Promise.any` for a faster cold scan, **but** preserving order may be a feature (cache-friendly) |
| `ui/services/agent/pairing.ts` | 99 | Yes — PKCE flow | Correct | `code_verifier` flagged by Biome (intentional OAuth wire key) | Yes | `JSON.parse(raw)` on line 72 has no schema validation; if a future schema change to `PendingPairing` rolls out, stale `sessionStorage` would silently pass through with extra/missing fields. Low-stakes (single browser tab, 5min expiry) | Validate the parsed `PendingPairing` against a small Zod schema or check field-by-field |
| `ui/services/agent/storage.ts` | 98 | Mixed — `localStorage` helpers AND the module-level `localAgentCapability` singleton | Marginal (`services/<d>/`) — but the static capability is **not a service concern**, it's a runtime fact. ADR 0004 §2 says the service owns side-effects (IPC, listeners). Hosting a process-wide singleton in a service file blurs the layer | OK | Yes | Module-level mutable singleton (`let localAgentCapability`) — get/set is a code smell when the value originates from a runtime. The web host's `setup-web-host.ts` calls `setLocalAgentCapability(getRuntime().capabilities.localAgent)`; this is plumbing that should not need a setter. The renderer should read `getRuntime().capabilities.localAgent` directly. **No locale separation** between renderer-vs-host code: `services/agent/storage` is imported by both `apps-host/web/src/ipc/flight-service.ts` and by renderer components. Works because both run in the same JS realm in the web shell, but reinforces the ADR 0006 finding that the agent client should be a *port* | Move `localAgentCapability` out — either a) read `runtime.capabilities.localAgent` at the call site each time (cheap), or b) expose it via the slice (capability is mounted into state at boot). Split `services/agent/storage.ts` into `services/agent/storage.ts` (localStorage) and somewhere host-shaped for the capability |
| `ui/services/agent/crypto.ts` | 58 | Yes — Web Crypto helpers | Correct (pure renderer-side crypto) | OK | Yes | `subtle()` getter throws but most callers don't catch (e.g. `randomBytes` calls `window.crypto.getRandomValues` without guarding). On insecure context the throw will surface as a generic error in the pairing flow. Minor | Keep, with optional friendlier error mapping in `services/agent/pairing.ts` |
| `ui/services/agent/index.ts` | 4 | Yes — barrel | Correct | OK | Re-exports everything via `export *` — pulls `localStorage` helpers, capability getter/setter, and crypto into one namespace | The wildcard barrel hides what's public. ADR 0002 §3 says the barrel **is** the public API — making it explicit reduces footguns | Replace wildcards with explicit re-exports; consider grouping (`{ token, baseUrlCache, capability, discovery, pairing }`) |
| `ui/store/effects/agent.ts` | 122 | **Borderline.** Three listeners + four action-creators is on the edge of what ADR 0004 §4 calls "thin plumbing." Discover listener (44 lines) includes the cache-first probe → discovery → token-verify pipeline — that's enough logic that the effect is doing service-shaped work | Mostly correct (effect lives in `store/effects/`) but exceeds the "~20 lines of plumbing" guideline in ADR 0004 §4 | OK | Imports `services/agent` (good), `@beak/state/agent` (good); calls `Date.now()` inside effects (good — wallclock in service, not reducer) | The discover effect orchestrates probe + cache + verify in one block; per ADR 0004 §4 that orchestration should live in a `services/agent/discovery.runDiscovery()` function and the effect should just call it. Also: `revokeAgentLocally` does `clearAgentToken()` then dispatches `tokenRevoked()` — that's a one-liner that should be a service function and shouldn't need an effect at all (ADR 0004 §4 last paragraph) | Extract `runDiscovery()` / `runRevoke()` into `services/agent/`. Effect file shrinks to ~30 LOC of slice→service plumbing |
| `apps-host/web/src/requester/agent.ts` | 189 | Mixed — three concerns: HTTP request, SSE parser, frame dispatcher | **Wrong directory per ADR 0006 §2.** Should be `apps-host/web/src/adapters/local-agent-client.ts`. The current `requester/` directory is a pre-ADR location; ADR 0006 §3 explicitly names `ports/requester.ts` and `ports/local-agent-client.ts` as targets | `Authorization`, `Accept` keys flagged (legitimately HTTP). Function names `nextLineEnd`, `processBuffer`, `consumeAgentSse`, `handleAgentFrame` are clear | Imports only `common/wire/agent` and `./types` — clean | (1) Re-implements an SSE parser locally (lines 63–139) instead of using the existing `@beak/common/helpers/sse-parser.ts` that `browser-fetch.ts` uses — **duplicated utility**. (2) `frame as never` casts on lines 154, 174 — bypasses the Zod schemas the wire layer already provides. (3) `handleAgentFrame` switches on the string event-type without ever calling `flightHeartbeatSchema.safeParse` / `flightCompleteSchema.safeParse` / `flightFailedSchema.safeParse`. The schemas exist for runtime validation at the trust boundary; not using them is the "untrusted boundary, no validator" anti-pattern. (4) Default `timestamp: Date.now()` on line 167 when the agent doesn't supply one — that's a wallclock fallback inside the requester, fine in this layer (not a reducer) but reveals the wire schema treats `timestamp` as required while the parser tolerates missing | Reuse `SseParser` (mirrors the browser-fetch path). Validate each frame with the wire schema and `.failed(...)` on parse error rather than `as never`. Move file to `apps-host/web/src/adapters/local-agent-client.ts` per ADR 0006 |
| `apps-host/web/src/requester/browser-fetch.ts` | 163 | Yes — fetch-based requester | Same directory question as `agent.ts` (`adapters/` per ADR 0006); not part of agent feature surface, but adjacent | OK | OK | `__hacky__binaryFileData!` non-null assertion + `as BlobPart as BodyInit` double-cast (line 133) flagged by Biome; pre-existing | Out of scope for this feature; flagged for completeness |
| `apps-host/web/src/requester/types.ts` | 19 | Yes — `Requester` port shape | This **is** the port. ADR 0006 §3 says move to `packages/runtime-shared/src/ports/requester.ts`; today it's host-local | OK | OK | None | Promote to `runtime-shared/ports/requester.ts` per ADR 0006 §3 |
| `apps-host/web/src/requester/index.ts` | 3 | Yes — barrel | OK | OK | OK | None | Keep |

## 3. Import graph

Renderer side (in-package, top-to-bottom respects ADR 0002):

```
entrypoints/web.tsx
 → store/effects/agent
   → @beak/state/agent (slice + actions + selectors)
   → services/agent (discovery, pairing, storage, crypto)
     → @beak/common/wire/agent

containers/AgentPairReturn.tsx
 → store/effects/agent (action creator)
 → services/agent (readPairingReturnQuery)
 → @beak/state/agent (selectors)

components/molecules/AgentStatusBanner.tsx
 → store/effects/agent (action creators)
 → services/agent (getLocalAgentCapability)
 → @beak/state/agent (selectors)

features/preferences/.../AgentPreferencesSection.tsx
 → store/effects/agent (revokeAgentLocally)
 → services/agent (getLocalAgentCapability)
 → @beak/state/agent (selectors, setRoutingMode)
```

Host (web) side:

```
apps-host/web/src/setup-web-host.ts
 → @beak/ui/services/agent (setLocalAgentCapability)
 → ./host (getRuntime)

apps-host/web/src/ipc/flight-service.ts
 → @beak/common/ipc/flight
 → @beak/common/types/requester (FlightRequestPayload)
 → @beak/state/agent (decideRouting, selectAgentBaseUrl)
 → @beak/ui/store (getAppStore)
 → @beak/ui/services/agent/storage (getAgentToken, clearAgentToken)    ← DEEP IMPORT
 → ./requester (browserFetchRequester, createAgentRequester)
```

The Wire/State/UI sides are clean. The web host's `flight-service.ts`:

1. Reaches into `@beak/ui/services/agent/storage` with a **deep import** (`@beak/ui/services/agent/storage`) instead of the public `@beak/ui/services/agent` barrel. ADR 0002 §3 forbids deep imports across domains; the host shell is "outside the domain" too. The barrel doesn't even need to be a different file — just hit `@beak/ui/services/agent`.
2. Mixes selector access (`selectAgentBaseUrl`) with raw shape access (`state.global.agent.status`, `state.global.agent.routingMode`) — ADR 0005 §3 violation in two places.

Wire and Go sides are mirrored explicitly by hand (see `wire/agent/README.md`); the audit accepts this until `pnpm wire-gen` lands.

## 4. ADR conformance

### ADR 0002 — Domain ownership and the rendering data path: **PARTIAL**

Conforms:
- IPC contract directory: matches (`packages/common/src/wire/agent/`, though ADR 0002 §1 names `common/src/ipc/<d>.ts` — the wire is functionally that for an HTTP API rather than Electron IPC; close enough; see deviation below).
- State directory: `packages/state/src/agent/` is correct.
- Renderer service: `packages/ui/src/services/agent/` is correct.

Deviations:
- ADR 0002 §1 lists `packages/common/src/ipc/<d>.ts` as the IPC contract home. The agent uses HTTP-over-loopback, so the contracts landed in `wire/agent/` instead. Not strictly a violation (the ADR predates the wire/agent shape), but the directory is unique to this domain. The Feature UI cell (`packages/ui/src/features/<d>/`) is unused — instead, agent UI is scattered across `components/molecules/AgentStatusBanner.tsx`, `containers/AgentPairReturn.tsx`, `features/preferences/.../AgentPreferencesSection.tsx`. ADR 0002 §1 says the domain owns `features/<d>/` and nothing else.
- Host adapter: `apps-host/web/src/requester/agent.ts` is in `requester/`, not `adapters/` (ADR 0002 §1 names `apps-host/web/src/adapters/<d>.ts`). The host port directory `packages/runtime-shared/src/ports/local-agent-client.ts` does not exist.
- One-way data path is mostly respected — components consume selectors via `useAppSelector`, dispatch action creators, never call `fetch`. **No hook layer** (`hooks/useAgent.ts`) exists; components dispatch action creators directly (`startAgentPairingRequested`, `discoverAgentRequested`, `completeAgentPairingRequested`, `revokeAgentLocally`). ADR 0002 §2 says "component → hook → service → slice + IPC → port → adapter"; this collapses to "component → effect-action → service" without the hook. Minor since the slice exposes named selectors and components consume them through `useAppSelector` (which is the ADR's allowed fallback).
- Deep imports across the domain boundary: `apps-host/web/src/ipc/flight-service.ts:6` hits `@beak/ui/services/agent/storage` (not `@beak/ui/services/agent`).

### ADR 0003 — Single home for schemas and IPC types: **FAIL**

Wire schemas (`common/wire/agent/flight.ts`) and the hand-written interfaces (`common/types/requester.ts`) **declare the same shapes twice**:
- `FlightRequestPayloadWire` vs `FlightRequestPayload`
- `FlightHeartbeatWire` (discriminated union of four variants) vs `FlightHeartbeatPayload` (matching variants)
- `FlightCompleteWire` vs `FlightCompletePayload`
- `FlightFailedWire` vs `FlightFailedPayload` (modulo `error: Error` vs `error: { message; code? }`)
- `SseEventWire` vs `SseEvent`
- `ResponseStreamKindWire` vs `ResponseStreamKind`

ADR 0003 §4 says "Zod is the source of truth, TypeScript is derived" — these should be `z.infer` of each other, not parallel declarations. The `Error` instance in `FlightFailedPayload` also matters per ADR 0005 §2 (reducers must not construct `Error` instances; payload should be `{ message, code? }`).

`LocalAgentCapability` is declared at `state/agent/routing.ts:3` AND at `runtime-shared/src/base.ts:40` — second duplication.

### ADR 0004 — Service layer in `@beak/ui`: **PARTIAL**

Conforms:
- `services/agent/` is the canonical service home (ADR 0004 §1).
- Components don't import `ipc*Service` (none of `discoverAgent`, pair flow, etc. cross an Electron IPC channel — by design).
- Renderer components are Chakra-shaped and dispatch action creators (no direct `fetch` from components).

Deviations:
- No hook layer (`use<Agent>`); ADR 0004 §3 makes hooks the only bridge. Components import action creators directly from `store/effects/agent` (`discoverAgentRequested`, etc.). Selectors are consumed via `useAppSelector` per the ADR's migration-period allowance.
- `store/effects/agent.ts` exceeds ADR 0004 §4's "~20 lines of plumbing" — the discover effect contains the cache-first / probe / verify pipeline (44 lines).
- `revokeAgentLocally` effect is one line of work after the dispatch — ADR 0004 §4 explicitly says collapse those into the service.
- Components import action creators from `store/effects/agent`; the ADR positions effects as "slice→service plumbing", not "the source of action creators components dispatch". The action creators are defined in `effects/agent.ts` (via `createAction` from RTK), which works but reads odd.

### ADR 0005 — State slice convention in `@beak/state`: **PARTIAL**

Conforms:
- Uses `createSlice` (ADR 0005 §1).
- Reducers are pure — no `Date.now()`, no `ksuid.generate()`, no `Error` instances stored in state. `lastSeenAt` timestamps are computed in `store/effects/agent.ts` and passed in via the payload (`Date.now()` in the effect, not the reducer). Good model.
- Named selectors exported (`selectAgentStatus`, etc.). ADR 0005 §3 satisfied.
- Pure helper alongside the slice (`routing.ts`'s `decideRouting`) with sibling test (`__tests__/routing.test.ts`). ADR 0005 §4 satisfied.

Deviations:
- `AgentSliceState` is exported (via `index.ts`'s `export * from './types'`). ADR 0005 §6 says "the slice's `State` shape is **not** exported." `packages/ui/src/store/index.ts` imports it to declare `ApplicationState`. (Slice-shape leak is the broader anti-pattern ADR 0005 highlights; agent isn't worse than the rest, but it's not the green-field example it could be.)
- Two consumers reach into the raw state shape rather than using named selectors: `apps-host/web/src/ipc/flight-service.ts:49–50` (`state.global.agent.status`, `state.global.agent.routingMode`). ADR 0005 §3 violation.
- `selectRoutingDecision` is defined but never used. Live callers reach `decideRouting({ capability, status: state.global.agent.status, ... })` ad-hoc.

### ADR 0006 — Host ports and adapters: **FAIL**

The local-agent feature is a textbook case for the new port/adapter shape (ADR 0006 §3 even names "`local-agent-client.ts`" as one of the new ports), but none of the infrastructure exists yet:

- No `packages/runtime-shared/src/ports/local-agent-client.ts`.
- No `packages/runtime-shared/src/ports/requester.ts` (today `apps-host/web/src/requester/types.ts`).
- `apps-host/web/src/adapters/` directory does not exist; `apps-host/web/src/requester/agent.ts` is the de facto adapter but it sits under `requester/`.
- The renderer service (`services/agent/`) does host-shaped work (`fetch` to `127.0.0.1:<port>`) instead of routing through a port. Because the web shell *is* the browser, this works today; it will fail to compile if the desktop shell ever needs to host the same code (e.g. share viewer).
- `apps-host/web/src/ipc/flight-service.ts` decides routing inline (`pickRequester()`) and selects between `browserFetchRequester` and `createAgentRequester(baseUrl, token)`. ADR 0006 §4 says the renderer never branches on the host; here the host branches on the slice and reaches into the renderer's `localStorage`. The decision belongs in a port adapter.

### ADR 0001 — Local agent for the web host (the feature ADR itself): **PASS**

The migration steps in ADR 0001 are mostly visible in the code:
1. Capability mounted (`localAgent: 'unsupported'` Electron, `'optional'` web). 
2. Agent slice with status machine. 
3. Discovery + HMAC verification. 
4. PKCE pairing handshake. 
5. `AgentRequester` and routing branch. 
6. Web shell's capability flipped to `'optional'`. 

`selectShouldRouteViaAgent` is named in ADR 0001 §6 but the implementation calls it `decideRouting` / `selectRoutingDecision`. Equivalent semantics.

## 5. Lint + format + tslsp diagnostics (verbatim summaries)

**Lint** (`pnpm lint`):
- Agent-specific findings (8 of 32 errors in the full repo touch agent files):
  - `apps-host/web/src/requester/agent.ts:28:7` — `useNamingConvention` on `Authorization` header (HTTP spec; needs a `// biome-ignore`).
  - `apps-host/web/src/requester/agent.ts:29:7` — `useNamingConvention` on `Accept` header (ditto).
  - `packages/common/src/wire/agent/pairing.ts:8:2,9:2,15:2,25:2` — `useNamingConvention` on `code_challenge`, `code_challenge_method`, `code_verifier`, `error_description` (OAuth wire keys; needs `// biome-ignore`).
  - `packages/ui/src/services/agent/discovery.ts:66:15` — `useNamingConvention` on `Authorization` header.
  - `packages/ui/src/services/agent/pairing.ts:83:44` — `useNamingConvention` on `code_verifier` (wire key).
- Full repo: 32 errors, 742 warnings, 9 infos (most are pre-existing, unrelated to the agent feature). No `noConsole`, `noUnusedImports`, `useImportType`, `noExplicitAny`, or `noNonNullAssertion` violations in the agent files.

**Format** (`pnpm exec biome format`, dry-run on agent paths only):
- 3 files would be reformatted:
  - `packages/state/src/agent/__tests__/routing.test.ts` — multi-line `expect(...).toBe(...)` calls collapse to single-line where they fit within 120 cols.
  - `packages/ui/src/services/agent/crypto.ts:37–45` — `importKey(...)` argument list collapses to one line + a multi-line `['sign']` array.
  - `packages/ui/src/store/effects/agent.ts:49–51` — three-line `cached && ? : await ...` ternary collapses to one line.
- Pure whitespace / line-folding; no semantic change.

**tslsp diagnostics** (on each agent file, batched):
- All clean. `no diagnostics` for every file in the wire/state/services/effect/requester surface. The feature type-checks against the rest of the tree.

## 6. Anti-patterns (consolidated)

(file:line citations; severity in brackets)

1. **Duplicated wire types** [P0] — `common/wire/agent/flight.ts:103-108` declares `FlightHeartbeatWire`, `FlightCompleteWire`, `FlightFailedWire`, `SseEventWire`, `ResponseStreamKindWire`, while `common/types/requester.ts:14-98` redeclares the same shapes by hand. Direct ADR 0003 §4 violation.
2. **`as never` casts at trust boundary** [P0] — `apps-host/web/src/requester/agent.ts:154`, `:174`. SSE frames arrive over an HTTP connection from an external process (the agent); they're untrusted input. The wire schemas exist precisely to validate at this boundary; the adapter bypasses them.
3. **Duplicated SSE parser** [P1] — `apps-host/web/src/requester/agent.ts:63-139` re-implements an SSE parser. `apps-host/web/src/requester/browser-fetch.ts` already uses `SseParser` from `@beak/common/helpers/sse-parser`. The agent path should reuse it.
4. **Deep cross-package import** [P1] — `apps-host/web/src/ipc/flight-service.ts:6` imports `from '@beak/ui/services/agent/storage'` instead of the barrel `from '@beak/ui/services/agent'`. ADR 0002 §3 violation.
5. **Raw state-shape access** [P1] — `apps-host/web/src/ipc/flight-service.ts:49-50` reads `state.global.agent.status` and `state.global.agent.routingMode` directly; the file two lines above imports `selectAgentBaseUrl`. ADR 0005 §3 says reach state via named selectors.
6. **Wrong directory for the adapter** [P1] — `apps-host/web/src/requester/agent.ts` should be `apps-host/web/src/adapters/local-agent-client.ts` per ADR 0006 §2/§3. `requester/types.ts` should be `runtime-shared/src/ports/requester.ts`.
7. **Module-level mutable singleton** [P1] — `packages/ui/src/services/agent/storage.ts:90` (`let localAgentCapability`) plus `setLocalAgentCapability` setter. The value comes from a runtime; the renderer should read `getRuntime().capabilities.localAgent` at call sites or mount the value into the slice once at boot.
8. **Effect file is doing service-shaped work** [P1] — `packages/ui/src/store/effects/agent.ts:41-81`: the discover listener orchestrates cache lookup → probe → discover → token-verify (44 lines of business logic). ADR 0004 §4 says effects are slice→service plumbing.
9. **No hook layer** [P2] — `packages/ui/src/features/preferences/.../AgentPreferencesSection.tsx`, `packages/ui/src/components/molecules/AgentStatusBanner.tsx`, `packages/ui/src/containers/AgentPairReturn.tsx` all dispatch action creators directly. ADR 0004 §3 says hooks are the only bridge.
10. **`LocalAgentCapability` declared twice** [P2] — `packages/state/src/agent/routing.ts:3` re-declares the literal already in `packages/runtime-shared/src/base.ts:40`.
11. **`AGENT_PROTOCOL_VERSION` is dead code** [P2] — `packages/common/src/wire/agent/index.ts:18` exports `'pkce-pair-v1'`; no importer in TS or Go (grep clean). Either wire it into the healthz response or drop it.
12. **`selectRoutingDecision` is dead code** [P2] — `packages/state/src/agent/routing.ts:49`. Callers use `decideRouting` directly.
13. **Naming-convention warnings on wire keys** [P2] — `packages/common/src/wire/agent/pairing.ts:8,9,15,25` and `services/agent/pairing.ts:83`, `services/agent/discovery.ts:66`, `requester/agent.ts:28,29`. The keys are HTTP/OAuth spec; suppress with `// biome-ignore lint/style/useNamingConvention` comments rather than leaving them as repeated warning noise.
14. **Wildcard barrel reexports** [P2] — `packages/ui/src/services/agent/index.ts` (`export * from './crypto'/'discovery'/'pairing'/'storage'`) and `packages/state/src/agent/index.ts` (`export * from ...`) — hides the public API surface. Switch to explicit re-exports so adding an internal helper doesn't accidentally publish it.
15. **Pending-pairing JSON parsed without schema** [P2] — `packages/ui/src/services/agent/pairing.ts:72`. `sessionStorage` payload is trusted-ish (same origin) but a schema would catch corrupted entries.
16. **`'agent_unauthorized'` magic string** [P2] — `apps-host/web/src/requester/agent.ts:39` and `apps-host/web/src/ipc/flight-service.ts:22`. The string is a contract between requester and flight-service; promote to an exported constant.
17. **String-typed errors throughout the pairing flow** [P2] — `services/agent/pairing.ts:65–77,87,91` use `throw new Error('pairing_state_mismatch')`-style. These are *codes*, not messages. A `{ code, message }` discriminated payload would be more honest and would round-trip cleanly through `pairingFailed({ error })`.
18. **`@beak/state` Biome rule does not yet encode ADR 0004 §5** — biome.json's `noRestrictedImports` blocks `@beak/state` from importing `@beak/ui`, but it does *not* yet block components from importing `ipc*Service` outside `services/`. ADR 0004 §5 calls for the rule; it's currently advisory only. (Doesn't bite the agent feature today.)

## 7. Refactor recommendations

### P0 — Land before merging the feature into master

**P0-1. Single home for flight wire/payload types.** Make `packages/common/types/requester.ts`'s interfaces `z.infer`-derived from `packages/common/wire/agent/flight.ts` (or vice-versa). The two-source state silently rots; the wire schemas exist precisely for validation and the renderer should use them. After this, `FlightFailedPayload`'s `error: Error` field becomes `error: { message: string; code?: string }` — a small but pleasing ADR 0005 §2 win (no `Error` instance in payload).

**P0-2. Validate every SSE frame at the trust boundary.** In `apps-host/web/src/requester/agent.ts:handleAgentFrame`, replace the `frame as never` casts with `flightHeartbeatSchema.safeParse`, `flightCompleteSchema.safeParse`, `flightFailedSchema.safeParse`. An impostor process that beat the HMAC check (extreme edge case) shouldn't be able to ship arbitrary shapes into the renderer.

### P1 — Schedule in the next ADR-0006 lift

**P1-1. Promote `Requester` to a port, move `agent.ts` to an adapter.** Move `apps-host/web/src/requester/types.ts` → `packages/runtime-shared/src/ports/requester.ts`. Move `apps-host/web/src/requester/agent.ts` → `apps-host/web/src/adapters/local-agent-client.ts`. Use `tslsp:rename_file` so imports follow. Electron grows a no-op adapter that returns `'unsupported'` from a `pickRequester()` port method. After the move, `apps-host/web/src/ipc/flight-service.ts:pickRequester` becomes "ask the runtime for the requester, given the routing decision."

**P1-2. Reuse the shared SSE parser.** `apps-host/web/src/requester/agent.ts:consumeAgentSse` currently re-implements a parser. Wire it through `@beak/common/helpers/sse-parser:SseParser`. The agent emits `event:` + `data:` frames where `data` is JSON; the shared parser already handles framing and the wire-schema validation handles the JSON.

**P1-3. Thin `store/effects/agent.ts`.** Extract the discover orchestration into `services/agent/discovery.ts:runDiscovery(api)` (or a new `services/agent/orchestration.ts`). The effect becomes ~30 LOC of "dispatch start, call service, dispatch finish." Collapse `revokeAgentLocally` into a `services/agent/storage.revoke()` function and remove the listener entirely (ADR 0004 §4).

**P1-4. Drop the `localAgentCapability` singleton.** Replace `setLocalAgentCapability` / `getLocalAgentCapability` with one of:
- Mount the capability into the agent slice at boot (`hydrateAgent({ capability })`); selectors expose it.
- Have UI components read `getRuntime().capabilities.localAgent` directly via a `useRuntime()` hook.
Either way, eliminates the module-level mutable state in `services/agent/storage.ts:90`.

**P1-5. Fix raw state access and deep imports.** In `apps-host/web/src/ipc/flight-service.ts`: replace `state.global.agent.status` and `state.global.agent.routingMode` with named selectors (add `selectAgentStatus` is already exported; add a `selectAgentRoutingMode` to the slice — it already exists). Change `from '@beak/ui/services/agent/storage'` to `from '@beak/ui/services/agent'`.

### P2 — Polish

**P2-1. Add a hook layer.** `packages/ui/src/hooks/useAgent.ts` exports `{ status, baseUrl, version, pair, rescan, revoke, setRoutingMode }`. Components import only this hook (ADR 0004 §3). Reduces churn when the action-creator names change.

**P2-2. Hide `AgentSliceState`.** Replace `packages/state/src/agent/index.ts`'s `export *` with explicit re-exports that omit `AgentSliceState`. Update `packages/ui/src/store/index.ts` to read the slice's state shape via `ReturnType<typeof agentSlice.reducer>` (or `ReturnType<typeof getInitialState>`). Aligns the agent slice with ADR 0005 §6 ahead of the rest of the slices.

**P2-3. Suppress noisy lint warnings on wire keys.** `// biome-ignore lint/style/useNamingConvention: HTTP/OAuth wire key` on each header/parameter literal so the rule stays useful elsewhere.

**P2-4. Dedupe `LocalAgentCapability`.** In `packages/state/src/agent/routing.ts:3`, replace the local declaration with `type LocalAgentCapability = RuntimeCapabilities['localAgent']` importing from `@beak/runtime-shared/base`.

**P2-5. Drop dead exports.** `AGENT_PROTOCOL_VERSION` (wire/agent/index.ts:18) and `selectRoutingDecision` (state/agent/routing.ts:49) have no callers.

**P2-6. Promote shared magic strings to constants.** `'agent_unauthorized'`, `'agent_required_but_not_paired'`, etc. Add a `wire/agent/errors.ts` (or a const set in `wire/agent/index.ts`) and import in both the requester and the IPC handler.

**P2-7. Schema-validate `PendingPairing` from sessionStorage.** Either a small `pendingPairingSchema` in `services/agent/pairing.ts` or field-by-field checks. Five-minute fix; saves a future foot-gun.

## 8. Strengths (preserve and use as a model)

- **Pure decision function with sibling tests.** `state/agent/routing.ts:decideRouting` is what ADR 0005 §4 calls for: pure, named, testable. The 7-case test suite in `__tests__/routing.test.ts` is the right level of granularity. This is the reference pattern for the workflows / project / cookies refactors.
- **Reducers stay pure.** `agent-slice.ts` has zero `Date.now()`, `ksuid.generate()`, or `Error` constructions. All wallclock values come in via `action.payload.lastSeenAt` — exactly the ADR 0005 §2 discipline.
- **The slice is one file and ~100 LOC.** Compare to `workflows/helpers.ts` (1496 LOC). The discriminated-union status machine + selectors fit comfortably and read top-to-bottom.
- **Wire schemas live in `@beak/common`.** Zod-first, Go-mirrored — the right shape for ADR 0003 §1. The `README.md` documenting the Go-mirror discipline is good.
- **The two-`Requester` design.** `apps-host/web/src/requester/types.ts:Requester` interface + the two implementations (`browserFetchRequester`, `createAgentRequester`) is the right shape for "two backends, one renderer contract" — this is exactly the port/adapter pattern ADR 0006 generalises.
- **Capability matrix gates the slice mount.** `runtime.capabilities.localAgent` is checked at the slice-mount layer (`store/index.ts` mounts the agent slice unconditionally, but `services/agent/storage.ts:getLocalAgentCapability()` gates UI). The UI components (`AgentStatusBanner`, `AgentPreferencesSection`) check capability and short-circuit; the renderer doesn't branch on `if (electron) {...}` anywhere.
- **PKCE flow is by-the-book.** `services/agent/pairing.ts` + `services/agent/crypto.ts` implement RFC 7636 cleanly: random `state` and `code_verifier`, SHA-256 challenge, code-for-token exchange. Base64url helpers are correct (`+→-`, `/→_`, padding stripped).
- **Constant-time string compare for HMAC signatures.** `services/agent/discovery.ts:constantTimeEquals` (line 82) does the right thing for the verification challenge. (Could be tightened further with `crypto.subtle.timingSafeEqual` if available, but the userland loop is acceptable.)
- **`AbortSignal.timeout(200)` per probe.** Cold discovery scan finishes in seconds even when 20 ports time out. Right primitive, right budget.
- **Documentation density.** Every file has a top-of-file comment explaining its role, with a back-reference to ADR 0001. Easy to onboard a parallel agent to.
