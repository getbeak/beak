# Architecture Decision Records

This directory records significant architectural decisions for the Beak
codebase using the [MADR](https://adr.github.io/madr/) format (lightly
adapted).

An ADR captures **why** we made a choice, not what the code looks like.
Code rots; commit messages get squashed; CLAUDE.md drifts. ADRs sit here
as the durable answer to "why on earth did we do it this way?" — read
top-to-bottom by the next engineer who has to extend or unwind the
decision.

## When to write one

Write an ADR when:

- A decision affects more than one package or shell.
- A decision constrains future work (introduces a wire contract, fixes a
  port range, picks a new language).
- We picked something non-obvious where a reader six months from now
  would reasonably ask "why didn't they just…?".

Do **not** write an ADR for:

- File-layout choices inside a single package.
- Renames, refactors, or formatting sweeps.
- Bug fixes (commit message is enough).
- Library upgrades that don't change behaviour.

## Conventions

- Files are numbered `NNNN-short-kebab-title.md`, monotonically.
- Status is one of `Proposed`, `Accepted`, `Deprecated`, `Superseded by NNNN`.
- An ADR is **immutable once Accepted**. To change a decision, supersede
  it with a new ADR and update the old one's Status to `Superseded by NNNN`.
- Each ADR has the same five sections: Context, Decision, Consequences,
  Alternatives considered, References. Skip any that are genuinely empty
  — don't write `N/A` filler.
- Keep ADRs short. ~1 page is the target; 3 pages is the ceiling. If you
  need more, you probably need two ADRs.

## Index

| #    | Status   | Title                                                                  |
| ---- | -------- | ---------------------------------------------------------------------- |
| 0000 | Accepted | [Adopt MADR-style ADRs and Gherkin feature files](0000-adr-process.md) |
| 0001 | Accepted | [Local agent for the web host](0001-local-agent-for-web-host.md)       |

## Granularity guideline

Prefer **one ADR per feature**, not one per sub-decision. A feature
typically packs several tightly-coupled choices (runtime, transport,
auth, …); splitting them into separate ADRs duplicates context and
inflates the docs tree. Each ADR can use sub-headings under Decision
to itemise the pieces. Split only when sub-decisions have genuinely
independent lifecycles (e.g. an ADR is likely to be superseded on its
own).

## Companion features

Every ADR that introduces user-observable behaviour ships with at least
one `.feature` file in [`../features/`](../features/). The Gherkin file
defines acceptance criteria in plain English — readable by humans and
usable as a prompt for AI-driven test generation. Today the features are
**not wired to a Gherkin runner**; they are the source of truth for what
"working" means, not yet executable tests. See `0000-adr-process.md` for
the rationale.
