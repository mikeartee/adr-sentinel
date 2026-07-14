# Implementation Plan: ADR Sentinel

## Overview

Convert the design into a series of tasks that will build each component in a test-driven manner following agile best practices. Each task must result in a working, demoable increment of functionality. Prioritize best practices, incremental progress, and early testing, ensuring no big jumps in complexity at any stage. Make sure that each task builds on the previous tasks, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous task.

The deliverables are (a) the self-contained, zero-setup demo repository at `c:\Dev\kiro-birthday-week-challenges\hook-challenge\adr-sentinel-demo` and (b) the single Kiro hook file `.kiro/hooks/adr-sentinel.kiro.hook`. Almost every artifact here is Markdown or JSON (ADRs, the MADR template, the hook's `askAgent` prompt, steering, README, demo script) rather than executable code, so the tasks are framed around authoring, seeding, and verifying those artifacts. The "tests" are the behavioral demo scenarios A–D plus the design's supporting checks (seed integrity, trigger coverage, error path).

The sequence is silence-first, matching the design's incremental strategy: scaffold and seed the conventions, then land the significance gate (silence), then guard, then capture, then covered + soft nudge with full precedence, and finally wire in the docs and the end-to-end run-through. Each behavior is demoable the moment it lands.

## Tasks

- [x] 1. Scaffold the demo repository and ADR conventions
  - Create the self-contained demo repository at `c:\Dev\kiro-birthday-week-challenges\hook-challenge\adr-sentinel-demo` with the directory layout from the design (Component 3): `docs/adr/`, `src/`, `.github/workflows/`, and repo root files.
  - Author `docs/adr/template.md` (the MADR_Template) containing the frontmatter fields (status, date, decision-makers, consulted, informed) and every MADR section in order: Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome, Consequences, Confirmation, Pros and Cons of the Options, More Information.
  - Author `docs/adr/README.md` (the ADR_Index) documenting the `NNNN-kebab-title.md` numbering scheme, that ADR-0000 is the origin/meta record preceding numbered technical decisions, and a status legend (proposed / accepted / rejected / deprecated / superseded).
  - Add the sample app files exercised by later scenarios: `package.json` (primary dependency manifest, including at least one trivial devDependency such as `prettier` so Scenario C is a version bump), `Dockerfile` (base image + service line), `.github/workflows/ci.yml`, and two source files (`src/db.js`, `src/server.js`).
  - Validation: confirm the repository requires no API keys, accounts, installs, or running services, and that every scenario can be driven by single-line text edits to the seeded files (design Testing Strategy — zero-setup precondition). Confirm the MADR_Template lists all required frontmatter fields and all MADR sections (seed integrity check).
  - Demo: open the freshly scaffolded `adr-sentinel-demo` repo and show the `docs/adr/` conventions plus the sample `package.json`, `Dockerfile`, and workflow — a browsable, zero-setup starting point.
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 2. Seed the two Accepted ADRs (dogfooding origin + PostgreSQL)
  - Author `docs/adr/0000-adopt-adr-driven-governance.md` as the Accepted dogfooding origin record: `status: accepted`, describing the decision to adopt ADR-driven governance and build ADR Sentinel, framed as the founding/origin story that precedes numbered technical decisions.
  - Author `docs/adr/0001-postgresql-primary-relational-datastore.md` as an Accepted ADR: `status: accepted`, recording PostgreSQL as the primary relational datastore.
  - Write ADR-0001's Confirmation section as the machine-readable fitness-function anchor: name `mongodb` and `mysql2` as concrete manifest-level violations expressed as exact tokens the hook can match against raw dependency-manifest text (no semantic package resolution), and list compliant alternatives (e.g. `pg`, `postgres`).
  - Validation (seed integrity, per design Testing Strategy): confirm ADR-0000 and ADR-0001 both exist with `status: accepted`, that ADR-0001's Confirmation section names both `mongodb` and `mysql2` in matchable terms, and that the highest existing ADR number is 0001 (so the next captured number will be 0002).
  - Demo: show the two seeded Accepted ADRs and read ADR-0001's Confirmation section aloud — the concrete rule the guard will later enforce.
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 10.6_

- [x] 3. Write the behavioral scenario spec (DEMO.md)
  - Author `DEMO.md` defining Scenarios A–D, each as an exact single-line edit paired with the exact expected single output, per the design Testing Strategy.
  - Scenario A: add `"mongodb": "^6.0.0"` to `dependencies` in `package.json` → GUARD conflict flag citing ADR-0001. Scenario B: add `"redis": "^4.6.0"` → CAPTURE a Proposed `docs/adr/0002-*.md`, treated as non-conflicting. Scenario C: bump a trivial devDependency (e.g. `prettier`) → SILENCE (no output). Scenario D: change the Dockerfile base image or add a service → exactly one behavior via the significance gate.
  - State the "exactly one behavior per save" assertion (Requirement 7) explicitly for each scenario so the spec doubles as the behavioral acceptance test suite for the hook prompt.
  - Validation: confirm every scenario references only seeded files from Tasks 1–2 and needs no setup beyond a single-line edit; confirm each scenario names its expected single output verbatim so it is assertable during later run-throughs.
  - Demo: walk through DEMO.md as the acceptance checklist — four edits, four expected single outputs — before any hook behavior is built.
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.3_

- [x] 4. Create the hook file and author the significance gate (silence-first)
  - Create the hook via the Kiro Agent Hooks UI ("On File Save") so the `when.type` string is the exact platform-produced value rather than hand-authored, then confirm the stored file lives at `.kiro/hooks/adr-sentinel.kiro.hook` inside the demo repo.
  - Pin the `when.patterns` glob array to cover the three significance categories: dependency manifests (`**/package.json`, `**/requirements.txt`, `**/go.mod`, `**/Cargo.toml`, `**/pom.xml`, `**/Gemfile`, `**/composer.json`), config/infra (`**/Dockerfile`, `.github/workflows/*.yml`, `**/tsconfig*.json`), and cast a wide net for structural changes to be confirmed by the gate.
  - Author only Step 0 of the `askAgent` prompt at this stage: the Significance_Gate that classifies a saved change as clearly significant, clearly not significant, or inconclusive, and terminates a clearly-not-significant change in silence (no output). Leave downstream steps as explicit TODO placeholders so the increment is self-contained.
  - Validation: run Scenario C (bump a trivial devDependency) and confirm silence — no output. Run the trigger-coverage supporting check: confirm the `patterns` array matches each enumerated manifest/config file and that the stored `when.type` equals the UI-produced string.
  - Demo: bump `prettier` in `package.json`, save, and show the hook fires but stays completely silent — the silence-first foundation working end to end.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 7.1, 8.1_

- [x] 5. Add the Guard behavior (conflict detection against Accepted ADRs)
  - Extend the `askAgent` prompt with Step 1 (read ADRs) and Step 2 (conflict check): for a significant change, read every `docs/adr/*.md`, parse each frontmatter `status`, and parse the Confirmation section where present, treating saved-file content as plain text.
  - Implement the guard rule: on an unambiguous match of a change against a concrete violation token named in an Accepted ADR's Confirmation section, emit a structured conflict flag containing the ADR reference (number + title), the violated rule/fitness function, the reason, and resolution options.
  - Enforce the safety rail that a clear, unambiguous conflict is never downgraded to a soft nudge (loud on clear conflict).
  - Validation: run Scenario A (add `mongodb` to `package.json`) and confirm a single guard conflict flag citing ADR-0001 with the violated rule, reason, and resolution options, and nothing else fires.
  - Demo: add `"mongodb"` to `package.json`, save, and show the loud, structured conflict flag pointing back at ADR-0001 — a settled decision being defended in real time.
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 8.2, 9.6, 11.3_

- [x] 6. Add the Capture behavior (draft a Proposed MADR stub)
  - Extend the `askAgent` prompt with Step 4 (capture): when a significant change does not conflict with any Accepted ADR and is not covered by an existing one, draft a new MADR stub in `docs/adr/` numbered as the next integer after the highest existing ADR (0002 given 0000 and 0001), with `status: proposed`, populating the MADR sections from the template.
  - Bake in the non-destructive safety rails: every drafted ADR is `proposed` only, writes go to a new next-numbered file, and existing ADR files are never modified or overwritten.
  - Emit a short textual summary of the drafted record alongside the new file.
  - Validation: run Scenario B (add `redis` to `package.json`) and confirm a new Proposed `docs/adr/0002-*.md` is drafted with a summary, that `redis` is explicitly treated as NOT conflicting with the primary-relational-datastore ADR (no false guard), and that ADR-0000 and ADR-0001 remain byte-for-byte unchanged.
  - Demo: add `"redis"` to `package.json`, save, and show a fresh Proposed ADR-0002 stub appear with a one-line summary — a new decision captured automatically, no existing records touched.
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.4, 9.1, 9.2_

- [x] 7. Add Covered + Soft nudge and wire full precedence and the error path
  - Extend the `askAgent` prompt with Step 3 (covered): when a significant, non-conflicting change is already governed by an existing ADR on the same topic, emit the single line `covered by ADR-N`.
  - Add the soft-nudge behavior for inconclusive/ambiguous outcomes at any decision point (significance, conflict, or newness that cannot be determined), emitted as a single line in the format `ADR Sentinel: <one-line message>`, preferring low-noise non-destructive output over fabricating a flag or a record.
  - Add Step 1's ADR-read error path: once a change is classified significant, if `docs/adr/` or any ADR file cannot be read, halt and report that the ADR records could not be accessed rather than falling through to guard/covered/capture on partial data.
  - Wire Steps 0–5 into the full precedence chain (silence → guard → covered → capture → soft nudge) so exactly one behavior fires per save, and evaluate each save independently with no cross-save state.
  - Validation: run Scenario D (change the Dockerfile base image or add a service) and confirm exactly one behavior fires consistent with the flow. Run Scenarios A–D back-to-back and confirm each produces its expected single output with different saves yielding different behaviors. Run the error-path supporting check: make `docs/adr/` unreadable, save a significant change, and confirm the flow halts and reports instead of proceeding.
  - Demo: run all four scenarios in one sitting — silence, guard, capture, and a Dockerfile change — showing exactly one behavior per save and the graceful halt when ADRs can't be read.
  - _Requirements: 3.5, 5.1, 5.2, 7.1, 7.2, 7.3, 8.3, 8.5, 9.3, 9.4, 9.5, 13.4_

- [x] 8. Add steering and hook README, finalize DEMO.md, and end-to-end run-through
  - Author `.kiro/steering/adr-conventions.md` documenting the ADR location (`docs/adr/`), the MADR format, and the ADR_Sentinel contract (the five behaviors and their precedence).
  - Author the repo-root hook `README.md` describing the ADR_Sentinel behavior and configuration (trigger patterns, the decision flow, and how the hook was created via the Agent Hooks UI).
  - Finalize `DEMO.md` as the shot-by-shot video demo script covering Scenario A through Scenario D, aligning each shot with the now-implemented behaviors and pinned output formats.
  - Validation: perform a full end-to-end run-through following DEMO.md against the completed hook and seeded repo — confirm Scenarios A–D each produce exactly their expected single output and that the steering, README, and demo script accurately describe the shipped behavior.
  - Demo: record (or dry-run) the shot-by-shot demo end to end, then show the steering file and README that let a new developer adopt the hook and reproduce the demo unaided.
  - _Requirements: 14.1, 14.2, 14.3_

## Notes

- The design has no Correctness Properties section: the ADR Sentinel artifact is an LLM-driven hook prompt plus Markdown/JSON files, not a pure function over a large input space, so property-based testing does not apply. The validation for every task is example-based — the four canonical demo scenarios (A–D) plus the design's supporting checks (seed integrity, trigger coverage, error path).
- Silence-first ordering: the significance gate (Task 4) lands before guard (Task 5), capture (Task 6), and covered + soft nudge (Task 7), so each behavior is independently demoable as it arrives and the hook is never noisier than the behavior currently implemented.
- The `when.type` file-event string is confirmed at hook-creation time via the Kiro Agent Hooks UI (Task 4) rather than hand-authored, so the stored hook matches the platform's canonical string.
- No orphaned artifacts: the MADR template and ADR_Index (Task 1) are consumed by the seeded ADRs (Task 2) and by capture (Task 6); the seeded ADRs are read by guard (Task 5) and covered (Task 7); DEMO.md (Task 3) is exercised by Tasks 4–7 and finalized as the video script (Task 8). The sequence ends by wiring the full decision flow (Task 7) and the steering/README/demo docs (Task 8) together.
- Each task references specific requirement sub-clauses for traceability and ends in a working, demoable increment.
