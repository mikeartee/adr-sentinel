---
# Status of this decision.
# One of: proposed | accepted | rejected | deprecated | superseded
status: accepted
# ISO 8601 date the decision was made (YYYY-MM-DD).
date: 2024-01-10
# Who made the decision.
decision-makers: [team]
# Who was consulted (subject-matter experts whose opinions were sought).
consulted: [engineering, architecture]
# Who was informed (kept up to date on progress).
informed: [all-contributors]
---

# Adopt ADR-driven governance and build the ADR Sentinel

## Context and Problem Statement

Architectural decisions on this project are frequently made in code — adding a
dependency, swapping a datastore, choosing an infrastructure primitive — but are
rarely written down, and existing decisions are silently violated over time. How
do we make architectural decisions durable and self-enforcing so that a
teammate, or an AI agent, cannot quietly reverse a settled decision without
understanding why it was made?

This is the founding, origin record for the project: it precedes the numbered
technical decisions (ADR-0001 onward) and establishes the practice those records
live within.

## Decision Drivers

- Architectural decisions must be captured at the moment they are made, not
  reconstructed after the fact.
- Settled decisions must be defended automatically so accidental reversals are
  caught immediately rather than in review or in production.
- The governance mechanism must be low-noise: silent when a change is not
  architecturally significant, loud only when a real conflict occurs.
- The project should demonstrate its own practice (dogfooding) so the tool is
  credible to the developers it asks to adopt it.
- Zero setup: the whole approach must be exercisable through plain text edits,
  without API keys, accounts, installs, or running services.

## Considered Options

- Adopt ADR-driven governance and build the ADR Sentinel hook to enforce it.
- Keep architectural decisions in a wiki or design docs, reviewed manually.
- Rely on pull-request review and tribal knowledge with no formal record.

## Decision Outcome

Chosen option: "Adopt ADR-driven governance and build the ADR Sentinel hook",
because it is the only option that both records decisions in a durable,
version-controlled format (MADR under `docs/adr/`) and enforces them
automatically at save time, closing the loop between decisions made in code and
the records that govern them. This record is authored as ADR-0000 so the project
visibly practices the governance it provides.

## Consequences

- Good, because every architectural decision now has a single, dated,
  status-bearing home in `docs/adr/`, discoverable by both humans and tooling.
- Good, because accepted decisions are enforced automatically via each ADR's
  Confirmation section, so reversals are flagged the instant they are saved.
- Good, because the project dogfoods its own tool, making the practice credible
  and the demo self-contained.
- Bad, because contributors must learn the MADR format and the ADR numbering
  convention before authoring records by hand.
- Bad, because the enforcement is only as good as the Confirmation sections that
  accepted ADRs declare — a decision with a vague fitness function cannot be
  guarded precisely.

## Confirmation

Compliance with this founding decision is confirmed structurally rather than by
matching manifest tokens:

- The repository contains a `docs/adr/` directory holding the MADR template, an
  ADR index (README), and the decision records themselves.
- Architectural decisions are recorded as MADR files following the numbering
  scheme documented in the ADR index, with `0000` reserved for this origin
  record.
- The ADR Sentinel hook is present and enabled so that saves to
  architecturally-significant files are evaluated against the accepted records.

Abandoning ADR-driven governance — for example removing `docs/adr/` or disabling
the ADR Sentinel hook — would violate this decision. Because this is a meta/
process record rather than a dependency decision, it declares no manifest-level
token violations; the concrete, machine-matchable fitness functions live in the
numbered technical ADRs (starting with ADR-0001).

## Pros and Cons of the Options

### Adopt ADR-driven governance and build the ADR Sentinel

- Good, because decisions are captured in a durable, version-controlled format.
- Good, because accepted decisions are enforced automatically at save time.
- Good, because the project dogfoods its own tool.
- Neutral, because it introduces a lightweight authoring convention (MADR).
- Bad, because enforcement precision depends on well-written Confirmation
  sections.

### Keep decisions in a wiki or design docs, reviewed manually

- Good, because it requires no new tooling.
- Neutral, because documents can still capture rationale.
- Bad, because records drift out of sync with the code and are enforced only by
  human vigilance.

### Rely on PR review and tribal knowledge

- Good, because it adds no process overhead up front.
- Bad, because decisions are never written down and are silently reversed as
  people and context change.

## More Information

This record establishes the governance practice that ADR-0001 (PostgreSQL as the
primary relational datastore) and all subsequent numbered ADRs operate within.
See `docs/adr/README.md` for the numbering scheme and status legend, and the
repository's hook README for the ADR Sentinel behavior and configuration. This
decision should be revisited if the project moves to a different decision-record
format or a different enforcement mechanism.
