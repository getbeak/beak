# Feature specifications (`.feature` files)

Gherkin-syntax acceptance criteria for user-observable behaviour. Each
file describes one cohesive feature in `Given / When / Then` scenarios.

## Why these exist

ADRs explain **why** we picked an approach. `.feature` files explain
**what** the resulting system does — in plain English, scenario by
scenario. They serve three audiences:

1. **Reviewers.** Reading a PR against the spec is faster than reading
   the diff.
2. **Future engineers.** "What's the agent supposed to do when the
   token is revoked?" is a one-grep answer.
3. **Test generation.** The scenarios are written to be unambiguous
   enough that an AI agent (or a human) can translate them into vitest
   / Go tests / Playwright flows.

## What they are not (yet)

We are **not running a Gherkin runner**. There is no `cucumber-js` or
`godog` integration. The files are acceptance criteria, not green-bar
tests.

When we do wire a runner, the most likely move is:

- Renderer-side scenarios → vitest + a tiny Gherkin loader.
- Agent-side scenarios → `godog` against the agent binary in CI.
- End-to-end scenarios → Playwright orchestrating both.

The decision to defer the runner is captured in
[`../adr/0000-adr-process.md`](../adr/0000-adr-process.md).

## Index

- [`agent-control-plane.feature`](agent-control-plane.feature) —
  discovering the agent on loopback, the PKCE pairing handshake,
  revocation, and the UI states the web host surfaces for every
  agent condition.
- [`agent-flight.feature`](agent-flight.feature) — routing decisions,
  request execution against the agent (GET, POST, SSE upstream,
  timeout, binary), concurrency, and cancellation.

Grouping mirrors the [ADR convention](../adr/README.md): one feature,
one ADR; one feature, at most a couple of `.feature` files split along
clear seams (control plane vs data plane), not one file per scenario
cluster.

## Style notes

- Use plain present-tense English. No "should" verbs in the `Then` —
  prefer "the agent returns 401", not "the agent should return 401".
- One scenario, one trigger. If a scenario has two `When` steps without
  an intervening `And`, it's probably two scenarios.
- Anything platform-specific (macOS keychain, Windows tray) gets a tag
  like `@platform:darwin` for filtering later.
- `Background:` is used freely. `Scenario Outline:` only when the table
  truly is the same logic over data.
