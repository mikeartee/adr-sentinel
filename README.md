# ADR Sentinel

A self-contained, zero-setup demo of **ADR Sentinel**: a workspace-level Kiro
hook that closes the loop between architectural decisions made in code and the
Architectural Decision Records (ADRs) that are supposed to govern them.

Architectural decisions are frequently made in code, whether adding a
dependency, swapping a datastore, or choosing an infrastructure primitive, but
they are rarely written down, and existing decisions are silently violated.
Later, a teammate or an AI agent reverses a settled decision without
understanding why it was made, causing breakage and churn. ADR Sentinel watches
saves to architecturally-significant files and, on each save, performs
**exactly one** of five behaviors against the repository's ADRs.

Everything here is exercisable through single-line text edits, with **no API
keys, accounts, installs, or running services**. The whole "program" is a
prompt: the hook has no companion runtime or compiled code.

## What the hook does

On each save of a matching file, ADR Sentinel performs exactly one behavior:

| Behavior | When it fires | Pinned output |
| --- | --- | --- |
| **Silence** | Change is clearly not architecturally significant (trivial devDependency bump, formatting, metadata). | No output at all. |
| **Guard** | Change is an unambiguous conflict with an accepted ADR (a violation token named in its Confirmation section is present). | A structured conflict flag with the ADR reference, violated rule, reason, and resolution options. |
| **Covered** | Change is significant, non-conflicting, and already governed by an existing ADR. | `covered by ADR-N` |
| **Capture** | Change is significant, non-conflicting, and not covered, a genuinely new decision. | A new Proposed ADR `docs/adr/NNNN-*.md` plus a short summary line. |
| **Soft nudge** | Significance, conflict, or newness is inconclusive/ambiguous. | `ADR Sentinel: <one-line message>` |

It is **silence-first**: quiet by default, loud only on a real conflict, and
low-noise (a single-line nudge) when it cannot decide. It never fabricates a
conflict or a record.

## Decision flow

The hook's `askAgent` prompt encodes a numbered, short-circuiting decision flow.
Precedence runs top to bottom and stops at the first behavior that applies, so
**exactly one behavior fires per save**:

1. **Step 0: Significance gate.** Classify the change as clearly significant,
   clearly not significant, or inconclusive. Clearly-not-significant terminates
   in **silence**; inconclusive falls to a **soft nudge**; significant proceeds.
2. **Step 1: Read ADRs.** Read every `docs/adr/*.md`, parse each `status` and
   each `Confirmation` section, treating files as plain text. If the records
   cannot be read, **halt and report** (see Error path) rather than acting on
   partial data.
3. **Step 2: Guard / conflict check.** If the saved text contains an exact
   violation token named in an **accepted** ADR's Confirmation section, emit a
   **guard** flag. A clear conflict is never downgraded to a soft nudge.
4. **Step 3: Covered check.** If an existing ADR already governs the topic and
   the change is consistent with it, emit `covered by ADR-N`.
5. **Step 4: Capture.** Otherwise it is a new decision: draft the next-numbered
   Proposed MADR stub from the template and emit a summary. Existing records are
   never touched.
6. **Step 5: Emit.** Produce exactly one output in the pinned format for the
   selected behavior. If nothing above can be determined, emit a **soft nudge**.

The precedence order is: **silence, guard, covered, capture, soft nudge**.
Each save is evaluated independently, with no state carried between saves, so a
sequence of saves may yield different behaviors.

### Error path

Once a change is significant, if `docs/adr/` or any ADR file under it cannot be
read, the hook halts and reports instead of continuing:

```
ADR Sentinel: cannot access ADR records under docs/adr/ - halting without evaluating this change.
```

## Configuration

The hook is stored at **`.kiro/hooks/adr-sentinel.kiro.hook`**, a
workspace-level Kiro hook. It is a JSON document with a file-event `when`
trigger and a `then: askAgent` action whose `prompt` carries the entire
decision flow.

### Trigger patterns

`when.patterns` is a glob array covering the three significance categories. The
trigger casts a wide net; the significance gate (Step 0) then confirms whether a
matched save is actually significant.

- **Dependency manifests:** `**/package.json`, `**/requirements.txt`, `**/go.mod`,
  `**/Cargo.toml`, `**/pom.xml`, `**/Gemfile`, `**/composer.json`
- **Config / infrastructure:** `**/Dockerfile`, `.github/workflows/*.yml`,
  `**/tsconfig*.json`
- **Structural:** new top-level modules/directories, confirmed by the
  significance gate (a raw glob cannot express "new top-level dir" on its own).

### The `when.type` event string

`when.type` is set to the canonical Kiro file-save event string **`fileEdited`**.

This hook was created through the **Kiro Agent Hooks UI** ("On File Save") so the
event type matches the platform's canonical string rather than a hand-guessed
value. When adopting this hook in your own workspace, re-create or confirm it via
the Agent Hooks UI so `when.type` matches the exact string your Kiro version
produces.

### How the hook was created (Agent Hooks UI)

1. Open the **Agent Hooks** view in Kiro.
2. Create a new hook and choose the **On File Save** trigger.
3. Set the file patterns to the trigger globs listed above.
4. Set the action to **Ask agent** and paste the decision-flow prompt.
5. Save. Kiro writes the hook to `.kiro/hooks/adr-sentinel.kiro.hook` with the
   canonical `when.type` for file-save events.

## Repository layout

```
adr-sentinel/
├── .github/workflows/ci.yml     # GitHub Actions workflow (config/infra trigger)
├── .kiro/
│   ├── hooks/adr-sentinel.kiro.hook   # the hook (this README documents it)
│   └── steering/adr-conventions.md    # ADR location, MADR format, hook contract
├── docs/adr/
│   ├── README.md                # ADR index: numbering scheme + status legend
│   ├── template.md              # MADR template (all frontmatter + sections)
│   ├── 0000-adopt-adr-driven-governance.md          # Accepted origin/meta ADR
│   └── 0001-postgresql-primary-relational-datastore.md   # Accepted; Confirmation names mongodb, mysql2
├── src/
│   ├── db.js                    # pg-based data-access layer (governed by ADR-0001)
│   └── server.js                # minimal entry point
├── Dockerfile                   # base image + service (config/infra trigger)
├── package.json                 # primary dependency manifest (Scenarios A/B/C)
├── DEMO.md                      # shot-by-shot demo script, Scenarios A-D
└── README.md                    # this file
```

## Try it

See **[`DEMO.md`](./DEMO.md)** for the shot-by-shot script. In short, from the
seeded baseline:

- Add `"mongodb"` to `package.json` dependencies produces a **GUARD** flag citing ADR-0001.
- Add `"redis"` to `package.json` dependencies produces a **CAPTURE** of a Proposed ADR-0002.
- Bump the `prettier` devDependency version produces **SILENCE**.
- Change the `Dockerfile` base image produces **exactly one behavior** (capture expected).

For the ADR format and conventions, see
**[`.kiro/steering/adr-conventions.md`](./.kiro/steering/adr-conventions.md)** and
**[`docs/adr/README.md`](./docs/adr/README.md)**.
