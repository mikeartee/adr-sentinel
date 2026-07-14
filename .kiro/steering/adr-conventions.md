---
inclusion: always
---

# ADR conventions and the ADR Sentinel contract

This repository governs its architecture with Architectural Decision Records
(ADRs) and enforces them automatically with the **ADR Sentinel** hook. This
steering file is the single reference for where decision records live, the
format they follow, and the contract the hook applies on every save. It exists
so a new contributor (human or AI agent) can author records and understand the
hook's behavior without reverse-engineering it.

## Where decision records live

- All ADRs live under **`docs/adr/`**.
- Files are named **`NNNN-kebab-title.md`** — a zero-padded four-digit sequence
  number followed by a short, lowercase, hyphen-separated title
  (for example `docs/adr/0001-postgresql-primary-relational-datastore.md`).
- **`0000`** is reserved for the origin/meta record that precedes the numbered
  technical decisions. Numbered technical decisions start at **`0001`**.
- A new record always takes the **next integer after the highest existing
  number**. With `0000` and `0001` present, the next record is `0002`.
- Existing records are never renumbered and never overwritten.
- Supporting files in `docs/adr/`:
  - `template.md` — the MADR skeleton new records are drafted from.
  - `README.md` — the ADR index: the numbering scheme and status legend.

## The MADR format

Records follow **MADR** (Markdown Any Decision Records): YAML frontmatter
followed by a fixed set of Markdown sections.

Frontmatter fields:

```yaml
---
status: accepted            # proposed | accepted | rejected | deprecated | superseded
date: 2024-01-15            # ISO 8601 (YYYY-MM-DD)
decision-makers: [team]
consulted: []
informed: []
---
```

Sections, in order:

1. `# <title>` — the decision, phrased as the resolved problem.
2. `## Context and Problem Statement`
3. `## Decision Drivers`
4. `## Considered Options`
5. `## Decision Outcome` — the chosen option and its justification.
6. `## Consequences` — good and bad.
7. `## Confirmation` — the fitness function (see below).
8. `## Pros and Cons of the Options`
9. `## More Information`

**Status legend:** `proposed` (drafted, not yet agreed — automatically drafted
records always start here), `accepted` (agreed and in force — enforced by the
hook), `rejected` (considered and deliberately not adopted), `deprecated` (no
longer recommended, not yet replaced), `superseded` (replaced by a later ADR).

### The Confirmation section is the enforcement anchor

The `## Confirmation` section of an **accepted** ADR states the concrete changes
that would violate the decision. It is written so a check is **mechanical and
textual** — for dependency decisions it names the exact package-name tokens that
constitute a violation and lists the compliant alternatives, so no semantic
package resolution is required. This section is the anchor the ADR Sentinel
guard reads to detect conflicts.

Example (from ADR-0001, PostgreSQL as the primary relational datastore):
violation tokens are `mongodb` and `mysql2`; compliant alternatives are `pg`,
`postgres`, and `prisma` targeting PostgreSQL. A datastore-adjacent dependency
that is **not** a named token (for example `redis` used as a cache) is not a
conflict.

## The ADR Sentinel contract

ADR Sentinel is a workspace-level Kiro hook (`.kiro/hooks/adr-sentinel.kiro.hook`)
that fires when an architecturally-significant file is saved. On every save it
performs **exactly one** behavior, chosen by a short-circuiting precedence chain.
It is silence-first: quiet by default, loud only on a real conflict, and
low-noise (a single-line nudge) when it is unsure.

### The five behaviors

| Behavior | When it fires | Pinned output |
| --- | --- | --- |
| **Silence** | The change is clearly not architecturally significant (e.g. a trivial devDependency bump, formatting, metadata). | No output at all. |
| **Guard** | The change is an unambiguous conflict with an accepted ADR — a violation token named in that ADR's Confirmation section is present. | A structured conflict flag: the ADR number and title, the violated rule, the reason, and resolution options. |
| **Covered** | The change is significant, does not conflict, and is already governed by an existing ADR on the same topic. | A single line: `covered by ADR-N`. |
| **Capture** | The change is significant, does not conflict, and is not covered — a genuinely new decision. | A new Proposed ADR file `docs/adr/NNNN-*.md` (`status: proposed`) plus a short summary line. |
| **Soft nudge** | Significance, conflict, or newness is inconclusive or ambiguous at any decision point. | A single line: `ADR Sentinel: <one-line message>`. |

### Precedence (exactly one behavior per save)

The hook evaluates the chain top to bottom and stops at the first behavior that
applies, so precisely one behavior fires per save:

1. **Silence** — clearly not significant.
2. **Guard** — unambiguous conflict with an accepted ADR (loud; never downgraded
   to a soft nudge, never silenced).
3. **Covered** — significant, non-conflicting, already governed by an existing ADR.
4. **Capture** — significant, non-conflicting, not covered, a genuinely new decision.
5. **Soft nudge** — inconclusive or ambiguous, when none of the above can be
   determined (low-noise, non-destructive default).

Each save is evaluated independently with no state carried between saves, so a
sequence of saves may yield different behaviors.

### Error path

Once a change has been classified significant, if `docs/adr/` or any ADR file
under it cannot be read, the hook **halts and reports** rather than acting on
partial data:

```
ADR Sentinel: cannot access ADR records under docs/adr/ - halting without evaluating this change.
```

### Safety rails

- Automatically drafted records are always `status: proposed` — never `accepted`.
- Capture only ever writes a new next-numbered file; existing records are left
  byte-for-byte unchanged.
- The hook never fabricates a conflict or a decision: a guard flag requires an
  exact match against a named violation token, and a capture requires a clearly
  new significant decision. When unsure, it prefers silence or a single-line
  soft nudge.

## Authoring a record by hand

1. Copy `docs/adr/template.md` to `docs/adr/NNNN-kebab-title.md` using the next
   free number.
2. Fill in the frontmatter and every MADR section.
3. Set `status: proposed` while under discussion; change to `accepted` once agreed.
4. For an accepted decision you want enforced, write a `Confirmation` section
   that names the concrete violation tokens and the compliant alternatives.
