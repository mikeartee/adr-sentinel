# Architectural Decision Records

This directory holds the Architectural Decision Records (ADRs) for this
repository. Each ADR captures a single architectural decision in the
[MADR](https://adr.github.io/madr/) (Markdown Any Decision Records) format.

New records are drafted from [`template.md`](./template.md).

## Numbering scheme

ADR files are named `NNNN-kebab-title.md`, where:

- `NNNN` is a zero-padded, four-digit sequence number (`0000`, `0001`, `0002`, ...).
- `kebab-title` is a short, lowercase, hyphen-separated summary of the decision
  (for example `postgresql-primary-relational-datastore`).

`0000` is reserved for the **origin/meta record** — the founding decision that
precedes the numbered technical decisions. Numbered technical decisions start at
`0001`. A new record is always assigned the next integer after the highest
existing number (with `0000` and `0001` present, the next record is `0002`).

New records are never given a number that already exists, and existing records
are never renumbered.

## Status legend

Every ADR declares a `status` field in its frontmatter. The allowed values are:

| Status | Meaning |
| --- | --- |
| `proposed` | The decision is drafted and under consideration but not yet agreed. Automatically drafted records always start here. |
| `accepted` | The decision is agreed and in force. Accepted records govern the architecture and are enforced. |
| `rejected` | The decision was considered and deliberately not adopted. |
| `deprecated` | The decision was accepted at one time but is no longer recommended, though not yet replaced. |
| `superseded` | The decision has been replaced by a later ADR. The replacing ADR should be referenced in `More Information`. |

## How records are used

An accepted ADR's `Confirmation` section states the fitness function for the
decision — the concrete changes that would violate it. That section is the
machine-readable anchor that governance tooling reads to detect conflicts, so it
is written in terms that can be matched directly against manifest and
configuration text.
