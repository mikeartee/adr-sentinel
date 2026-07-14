---
# Status of this decision.
# One of: proposed | accepted | rejected | deprecated | superseded
status: accepted
# ISO 8601 date the decision was made (YYYY-MM-DD).
date: 2024-01-15
# Who made the decision.
decision-makers: [team]
# Who was consulted (subject-matter experts whose opinions were sought).
consulted: [data-platform, backend]
# Who was informed (kept up to date on progress).
informed: [all-contributors]
---

# PostgreSQL as the primary relational datastore

## Context and Problem Statement

The demo application needs a single, authoritative store for its relational data
(users, records, and their relationships). Allowing multiple competing primary
datastores would fragment the data model, split operational knowledge, and make
transactions and integrity guarantees ambiguous. Which datastore should be the
one primary relational store that all persistent relational data flows through?

## Decision Drivers

- A single source of truth for relational data with strong transactional
  guarantees (ACID).
- Mature, well-understood SQL tooling and a stable, widely-available client
  ecosystem for Node.js.
- Avoiding fragmentation across multiple competing primary datastores.
- Operational familiarity and a low barrier to running the store locally for the
  zero-setup demo.

## Considered Options

- PostgreSQL (relational, via the `pg` client)
- MySQL / MariaDB (relational, via the `mysql2` client)
- MongoDB (document store, via the `mongodb` client)

## Decision Outcome

Chosen option: "PostgreSQL", because it delivers the strong relational and
transactional guarantees the data model needs, has a mature Node.js client
(`pg`), and gives the project a single, unambiguous primary relational datastore.
The application's data-access layer (`src/db.js`) uses the `pg` client
accordingly. This decision does not forbid non-relational stores adopted for a
genuinely different purpose (for example a cache) — it forbids introducing a
competing *primary relational* datastore.

## Consequences

- Good, because all relational data has one authoritative home with ACID
  transactions and mature SQL tooling.
- Good, because the `pg` client is stable and widely supported, keeping the demo
  zero-setup and easy to run.
- Good, because a single datastore concentrates operational knowledge instead of
  splitting it across engines.
- Bad, because workloads that would suit a document or alternative relational
  engine must either adapt to PostgreSQL or go through a new, superseding ADR.
- Bad, because the team must maintain PostgreSQL expertise rather than spreading
  across several datastore technologies.

## Confirmation

This decision is violated if a dependency manifest introduces a competing
primary datastore driver. The check is mechanical and textual: scan the raw
dependency-manifest text (for example `package.json`) for the exact package name
tokens below. No semantic package resolution is required — a literal match of a
listed token in a manifest constitutes a violation.

Violation tokens (presence of any of these package names in a dependency
manifest is a conflict):

- `mongodb` — document store competing with the relational primary.
- `mysql2` — alternative relational engine bypassing PostgreSQL.

Compliant alternatives (these satisfy the decision and are NOT violations):

- `pg` — the PostgreSQL client used by this project.
- `postgres` — an alternative PostgreSQL client.
- `prisma` when configured to target PostgreSQL.

A datastore-adjacent dependency that is not one of the named violation tokens
(for example `redis` used as a cache) is not a conflict under this ADR and
should be evaluated on its own merits.

## Pros and Cons of the Options

### PostgreSQL (via `pg`)

- Good, because it provides strong ACID transactional guarantees for relational
  data.
- Good, because the `pg` client is mature, stable, and widely used in Node.js.
- Neutral, because it requires SQL/relational modeling discipline.
- Bad, because document-shaped workloads must be modeled relationally or via
  JSONB.

### MySQL / MariaDB (via `mysql2`)

- Good, because it is also a mature relational engine with broad adoption.
- Neutral, because it overlaps heavily with PostgreSQL in capability.
- Bad, because adopting it as a second primary relational store fragments the
  data model and duplicates operational knowledge.

### MongoDB (via `mongodb`)

- Good, because it is flexible for schema-less, document-shaped data.
- Neutral, because it can complement a relational store for specific use cases.
- Bad, because as a primary relational datastore it abandons ACID relational
  guarantees and competes with the chosen PostgreSQL primary.

## More Information

This decision operates within the ADR-driven governance established by ADR-0000.
The Confirmation section above is the machine-readable anchor the ADR Sentinel
guard reads to detect conflicts against `package.json` and other dependency
manifests. To deliberately change the primary relational datastore, supersede
this ADR with a new record documenting the shift rather than editing this one.
See `src/db.js` for the `pg`-based data-access layer this decision governs.
