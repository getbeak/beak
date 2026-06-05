# 0000 — Adopt MADR-style ADRs and Gherkin feature files

- **Status:** Accepted
- **Date:** 2026-06-05
- **Deciders:** Alexander Forbes-Reed

## Context

Beak has grown across three shells (electron host, web host, share
viewer) and ~17 workspaces. The reasoning behind load-bearing
decisions — package boundaries, the capabilities matrix, the
collection-defaults sparse-merge protocol, the OpenAPI sync chain —
lives in commit messages, squashed PRs, and a sprawling `CLAUDE.md`.
None of those age well:

- Commit messages are searched, not read.
- `CLAUDE.md` is descriptive ("here's how the code is shaped"), not
  rationale ("here's why we picked this shape over the obvious
  alternative"). It can't fit both roles without becoming a 5000-line
  document nobody reads.
- New significant features (the local agent for the web host, see
  [0001](0001-local-agent-for-web-host.md)) introduce decisions with
  consequences that span the codebase. We want the reasoning archived
  the moment we make it, not reconstructed from `git log` six months
  later.

We also want **executable-in-spirit acceptance criteria** for new
features. Today new feature work is described in PR descriptions and
ad-hoc commit notes. That's enough for reviewers but doesn't survive
the merge — a year later, "what's the agent supposed to do when the
token is revoked?" has no canonical answer.

## Decision

1. Adopt [MADR](https://adr.github.io/madr/) (Markdown Architectural
   Decision Records), lightly adapted, under `docs/adr/`. Conventions
   are in `docs/adr/README.md`. Sections per ADR:

   - **Context** — the problem and constraints.
   - **Decision** — what we picked.
   - **Consequences** — what it costs us, what it enables.
   - **Alternatives considered** — the ones we rejected, and why.
   - **References** — links to PRs, related ADRs, prior art.

2. Pair every feature-introducing ADR with one or more `.feature`
   files under `docs/features/` written in
   [Gherkin](https://cucumber.io/docs/gherkin/) (`Given / When / Then`).
   These define acceptance criteria.

   **One ADR per feature, not one per sub-decision.** A feature ships
   with multiple coupled choices (runtime, transport, auth, …);
   document them as sub-headings under Decision in a single ADR. Split
   into separate ADRs only when sub-decisions have genuinely
   independent lifecycles.

3. **Defer wiring a Gherkin runner.** Today the `.feature` files are
   human-readable specs and AI-test-generation prompts, not executable
   tests. We add a runner when we have enough scenarios to justify the
   tooling investment — likely once the agent ships and we want CI to
   gate against the agent-side scenarios in particular.

## Consequences

- Writing a new ADR costs ~15 minutes if the decision is already made;
  the writing often surfaces a constraint we hadn't considered, which
  is the point.
- Reviewers gain a "did you write the ADR?" question for non-trivial
  PRs. The bar is "spans multiple packages / introduces a wire
  contract / picks a new language" — not "renamed three files".
- `.feature` files duplicate some content that would otherwise live in
  the PR description. We accept the duplication: PR descriptions decay
  with the merge; feature files stay readable forever.
- ADRs are immutable once Accepted. Changing a decision means writing
  a new ADR that supersedes the old one. This keeps the historical
  record honest.

## Alternatives considered

- **No formal record; rely on commit messages.** Status quo. The
  reason this ADR exists is that the status quo isn't working.
- **Long-form design docs in a wiki.** We don't have a wiki. GitHub
  wikis don't appear in code review; Notion/Confluence drift from the
  repo. Markdown in the repo is reviewable in PRs, greppable, and
  versioned.
- **Inline rationale in `CLAUDE.md`.** Mixes descriptive and
  rationale-style content; both suffer. Better to keep `CLAUDE.md` as
  "how the code is shaped right now" and let ADRs hold the why.
- **Heavyweight RFC process (kubernetes-style KEPs, react RFCs).**
  Overkill for a small team. MADR is two pages and a structure; that's
  the right size.
- **Wire up Gherkin runner immediately.** Premature — we'd be writing
  tooling for two `.feature` files. Revisit once the agent lands.

## References

- [MADR](https://adr.github.io/madr/) — the format we're loosely
  following.
- [Michael Nygard's original ADR post](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) —
  the seminal piece.
- [`docs/features/README.md`](../features/README.md) — Gherkin
  conventions.
