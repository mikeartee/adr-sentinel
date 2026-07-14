# ADR Sentinel — shot-by-shot demo script (Scenarios A–D)

This is the **recording script** for the ADR Sentinel demo. It is also the
**behavioral acceptance suite** for the hook: each scenario is a single-line edit
to a seeded file paired with the **exact expected single output**. Recording a
scenario means: make the edit, save, and confirm the hook produces exactly the
one named behavior and nothing else.

Read each `Shot` as a beat in the video: what to show on screen, the edit to
type, the save, and the output the viewer should see. The four scenarios run
back-to-back demonstrate all five behaviors (silence, guard, covered, capture,
soft nudge) — four via the scenarios, plus the safety-rail behaviors described in
the closing shots.

## Preconditions (zero setup)

- No API keys, accounts, installations, or running services are required. Every
  scenario is driven by a single-line text edit to a file that already exists in
  this repository (Requirement 10.2).
- The ADR Sentinel hook (`.kiro/hooks/adr-sentinel.kiro.hook`) is enabled. If you
  are recording in a fresh workspace, confirm the hook via the Kiro Agent Hooks
  UI ("On File Save") first — see the repo `README.md`.
- Seeded baseline state (from Tasks 1–2):
  - `package.json` — `dependencies`: `express` (`^4.19.2`), `pg` (`^8.11.5`);
    `devDependencies`: `prettier` (`^3.2.0`).
  - `Dockerfile` — `FROM node:20-alpine`, `EXPOSE 3000`.
  - `docs/adr/0000-adopt-adr-driven-governance.md` — `status: accepted` (governance origin).
  - `docs/adr/0001-postgresql-primary-relational-datastore.md` — `status: accepted`;
    its Confirmation section names `mongodb` and `mysql2` as violation tokens and lists
    `pg` / `postgres` / `prisma` as compliant (redis is explicitly NOT a violation).
  - Highest existing ADR number is **0001**, so the next captured ADR is numbered **0002**.
- **Record each scenario from this clean baseline.** Revert the previous edit
  before starting the next scenario so state (and capture numbering) stays
  deterministic. If the four scenarios are instead run back-to-back without
  reverting, each capture takes the next free number in sequence (Requirement 7.3
  — each save is evaluated independently).

## Pinned output contract (Requirement 8)

Every behavior emits exactly one output in its pinned format. These are what the
demo viewer sees and what each scenario asserts on:

| Behavior | Pinned output |
| --- | --- |
| Silence | No output at all. |
| Guard | A structured conflict block: ADR reference (number + title), violated rule, reason, resolution options. |
| Covered | A single line: `covered by ADR-N`. |
| Capture | A new Proposed ADR file `docs/adr/NNNN-*.md` (`status: proposed`) plus a short textual summary. |
| Soft nudge | A single line: `ADR Sentinel: <one-line message>`. |

**Exactly one behavior per save (Requirement 7.1):** for every scenario below,
precisely one of the five behaviors fires. Any additional output is a failure of
the scenario.

---

## Shot 0 — Setup (the zero-setup starting point)

**On screen:** open `adr-sentinel` in Kiro. Briefly pan across the tree:
`docs/adr/` (the two accepted records, the template, the index), `package.json`,
`Dockerfile`, and `.kiro/hooks/adr-sentinel.kiro.hook`.

**Say:** "This repo governs its architecture with ADRs and enforces them with one
Kiro hook. No services, no keys — every scenario is a single-line edit. Watch the
hook fire on save and do exactly one thing each time."

**Show:** open `docs/adr/0001-postgresql-primary-relational-datastore.md` and read
its `## Confirmation` section aloud — `mongodb` and `mysql2` are the violation
tokens; `pg` / `postgres` / `prisma` are compliant. "This is the rule the guard
will defend."

---

## Shot A — add `mongodb` → GUARD (conflict with ADR-0001)

**Validates: Requirements 13.1, 4, 8.2, 9.6, 11.3**

**File:** `package.json` (seeded — no setup needed)

**On screen:** open `package.json`. Type one line into `dependencies` so the block reads:

```json
"dependencies": {
  "express": "^4.19.2",
  "pg": "^8.11.5",
  "mongodb": "^6.0.0"
}
```

**Save.** The hook fires and emits exactly this **GUARD** flag (verbatim shape):

```
⚠️ ADR CONFLICT — ADR-0001: PostgreSQL as the primary relational datastore
Violated rule: ADR-0001's Confirmation forbids introducing the `mongodb` driver in a dependency manifest.
Reason: Adding `mongodb` to package.json introduces a competing primary datastore, reversing the accepted relational-datastore decision.
Resolution options:
  1. Remove `mongodb` and use the PostgreSQL client (`pg`) instead.
  2. If this is a deliberate change, supersede ADR-0001 with a new ADR documenting the shift.
```

**Say:** "A settled decision, defended in real time. `mongodb` is a named
violation token in ADR-0001's Confirmation, so the guard fires — loud and
structured — naming the ADR, the rule, the reason, and how to resolve it."

**Exactly-one-behavior assertion (Requirement 7):** exactly one behavior fires —
**GUARD**. No capture, no covered note, no soft nudge, no silence. The clear
conflict is never downgraded to a soft nudge (Requirement 9.6). The flag names
ADR-0001 by number and title, states the violated rule, gives the reason, and
presents resolution options (Requirements 4.2–4.5).

**Reset:** remove the `mongodb` line to return `package.json` to baseline.

---

## Shot B — add `redis` → CAPTURE (new Proposed ADR, no false conflict)

**Validates: Requirements 13.2, 6, 8.4, 9.1**

**File:** `package.json` (seeded — no setup needed)

**On screen:** in `package.json`, add one line to `dependencies` so the block reads:

```json
"dependencies": {
  "express": "^4.19.2",
  "pg": "^8.11.5",
  "redis": "^4.6.0"
}
```

**Save.** The hook fires and produces exactly this **CAPTURE** result:

- A new file **`docs/adr/0002-<kebab-title>.md`** is created (for example
  `docs/adr/0002-adopt-redis-caching-layer.md`) with frontmatter **`status: proposed`**,
  populated from the MADR template sections.
- A short summary line, in this pinned format:

  ```
  ADR Sentinel: drafted Proposed ADR-0002 (Redis caching layer) — review and accept/reject.
  ```

- `redis` is **explicitly treated as NOT conflicting** with ADR-0001: `redis` is
  not a named violation token (it is a cache, not a competing primary relational
  datastore), so the guard does not fire.
- Existing ADRs (`0000`, `0001`) remain **byte-for-byte unchanged** (Requirement 9.2).

**On screen:** open the freshly created `docs/adr/0002-*.md` and scroll it — show
`status: proposed` and the filled MADR sections. "A new decision, captured
automatically as a draft. Nothing existing was touched, and it is proposed, not
accepted — a human still reviews it."

**Exactly-one-behavior assertion (Requirement 7):** exactly one behavior fires —
**CAPTURE**. No guard flag (redis is not a Confirmation violation token), no
covered note, no soft nudge, no silence. Exactly one new Proposed ADR file is
written at the next sequential number (0002 from the clean baseline) and no
existing record is modified.

**Reset:** remove the `redis` line and delete the drafted `docs/adr/0002-*.md` to
return to baseline.

---

## Shot C — bump a trivial devDependency → SILENCE

**Validates: Requirements 13.3, 2.2, 8.1**

**File:** `package.json` (seeded — no setup needed)

**On screen:** in `package.json`, bump the `prettier` devDependency so the block reads:

```json
"devDependencies": {
  "prettier": "^3.2.5"
}
```

(from `"prettier": "^3.2.0"` to `"prettier": "^3.2.5"`)

**Save.** The hook fires — and produces **nothing at all**. No output, no file
written.

**Say:** "The hook fired on the save, but a trivial formatter version bump is not
architecturally significant, so it stays completely silent. This is the
silence-first default — no noise unless something actually matters."

**Exactly-one-behavior assertion (Requirement 7):** exactly one behavior fires —
**SILENCE**. No guard, no capture, no covered note, no soft nudge. The
significance gate classifies the bump as not architecturally significant
(Requirement 2.2).

**Reset:** restore `"prettier": "^3.2.0"` to return `package.json` to baseline.

---

## Shot D — change the Dockerfile base image → exactly one behavior via the significance gate

**Validates: Requirements 13.4, 2.1, 7**

**File:** `Dockerfile` (seeded — no setup needed)

**On screen:** open the `Dockerfile` and change the base-image line so it reads:

```dockerfile
FROM node:22-alpine
```

(from `FROM node:20-alpine` to `FROM node:22-alpine`; alternatively add a service
line such as a second `EXPOSE` port — either edit exercises the same
significance-gate path.)

**Save.** A base-image major-version change is a config/infrastructure change, so
it **passes the significance gate** (it is not silenced) and it matches **no**
datastore violation token (so the guard does not fire). With no existing ADR
governing the container runtime, the expected single output is **CAPTURE**:

- A new file **`docs/adr/0002-<kebab-title>.md`** (for example
  `docs/adr/0002-node-22-alpine-base-image.md`) with `status: proposed`, plus a
  short summary line:

  ```
  ADR Sentinel: drafted Proposed ADR-0002 (Node 22 Alpine base image) — review and accept/reject.
  ```

**Say:** "A different kind of file, a different kind of change — but the same
discipline. The base-image change is significant, conflicts with nothing, and
isn't yet governed, so it's captured as a fresh Proposed ADR. Still exactly one
behavior."

**Exactly-one-behavior assertion (Requirement 7):** the primary assertion for
Scenario D is that **precisely one behavior fires** and it is **consistent with
the decision flow** (Requirement 13.4). Concretely:

- It is **never SILENCE** — a base-image change passes the significance gate
  (Requirement 2.1).
- It is **never GUARD** — no datastore violation token from any accepted ADR's
  Confirmation section is present.
- It resolves to exactly one of **CAPTURE** (a genuinely new significant
  decision — the expected/recommended demo outcome above), **COVERED**
  (`covered by ADR-N` if a future ADR governs the runtime), or **SOFT NUDGE**
  (`ADR Sentinel: <one-line message>` if significance is inconclusive) — and only
  one.

**Reset:** restore `FROM node:20-alpine` and delete any drafted `docs/adr/0002-*.md`
to return to baseline.

---

## Shot E (optional) — the safety-rail behaviors (covered, soft nudge, error path)

These are not part of the four canonical scenarios but round out the five
behaviors on camera if time allows:

- **Covered:** re-save `package.json` after bumping the already-present `pg`
  client version (e.g. `^8.11.5` → `^8.11.6`). Because ADR-0001 already governs
  PostgreSQL and `pg` is its compliant client, the hook emits a single line:
  `covered by ADR-0001`.
- **Soft nudge:** add an unfamiliar dependency whose architectural role is
  unclear. Significance is inconclusive, so the hook emits one low-noise line,
  e.g. `ADR Sentinel: unfamiliar dependency \`foobar\` added - unclear whether this is an architectural decision; review manually.`
- **Error path:** if `docs/adr/` is made unreadable, a significant save halts with
  `ADR Sentinel: cannot access ADR records under docs/adr/ - halting without evaluating this change.`

---

## Closing shot — adopt it yourself

**On screen:** open `.kiro/steering/adr-conventions.md`, then the repo-root
`README.md`.

**Say:** "Everything a new contributor needs is here. The steering file documents
where ADRs live, the MADR format, and the hook's five-behavior contract. The
README documents the trigger patterns, the decision flow, and how the hook was
created through the Agent Hooks UI. Copy the `docs/adr/` conventions, the steering
file, and the hook into your own repo and you have the same governance —
reproducible from this script, unaided."

---

## Acceptance checklist — four edits, four expected single outputs

| Scenario | File (seeded) | Single-line edit | Expected single output | Requirements |
| --- | --- | --- | --- | --- |
| A | `package.json` | add `"mongodb": "^6.0.0"` to `dependencies` | GUARD conflict flag citing ADR-0001 | 13.1, 4, 8.2, 9.6, 11.3 |
| B | `package.json` | add `"redis": "^4.6.0"` to `dependencies` | CAPTURE Proposed `docs/adr/0002-*.md` + summary; no false conflict | 13.2, 6, 8.4, 9.1 |
| C | `package.json` | bump `prettier` `^3.2.0` → `^3.2.5` | SILENCE (no output) | 13.3, 2.2, 8.1 |
| D | `Dockerfile` | `FROM node:20-alpine` → `FROM node:22-alpine` | Exactly one behavior (CAPTURE expected); never silence, never guard | 13.4, 2.1, 7 |

## Validation notes

- **Only seeded files are touched.** Every scenario edits a file created in
  Tasks 1–2 (`package.json` or `Dockerfile`) and references only seeded ADRs
  (`docs/adr/0001-*.md`). Captures create `docs/adr/0002-*.md`, which does not yet
  exist — correct, since 0001 is the highest seeded number.
- **No setup beyond a single-line edit.** No scenario requires installs,
  credentials, accounts, or running services (Requirement 10.2). Each is a
  one-line text change plus a save.
- **Each expected output is named verbatim** against the pinned output contract
  (Requirement 8), so every scenario is directly assertable while recording.
- **Exactly one behavior per save** is asserted explicitly for all four scenarios
  (Requirement 7.1), so this script doubles as the behavioral acceptance suite for
  the hook prompt.
- **Outputs match the shipped hook.** The Guard block in Shot A and the Capture
  summary lines in Shots B and D are reproduced from the hook's own pinned formats
  in `.kiro/hooks/adr-sentinel.kiro.hook`, so what the script promises is what the
  hook emits.
