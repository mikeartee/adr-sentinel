# Requirements Document

## Introduction

ADR Sentinel is a workspace-level Kiro hook that watches saves to architecturally-significant files in a demo repository and closes the loop on architectural decision records (ADRs). Architectural decisions are frequently made in code (adding a dependency, swapping a datastore, choosing an infrastructure primitive) but rarely written down, and existing decisions are silently violated. Later, a teammate or an AI agent reverses a decision without understanding why it was made, causing breakage and churn.

The hook performs exactly one behavior per change, drawn from the following set, gated by a significance filter so that it stays quiet by default:

- **Silence** when the change is not architecturally significant.
- **Guard** when the change conflicts with an accepted ADR (loud, structured conflict flag).
- **Covered** when the change is already governed by an existing ADR (single-line note).
- **Capture** when a genuinely new architectural decision is made (draft a new proposed MADR stub).
- **Soft nudge** when the change is inconclusive or ambiguous with respect to significance or conflict (a single-line, low-noise hint).

Decision records follow the MADR (Markdown Any Decision Records) format. The hook and its conventions are delivered inside a self-contained, zero-setup demo repository so the behavior can be exercised entirely through single-line text edits, without API keys, accounts, installs, or running services.

This document formalizes previously-settled product decisions into structured requirements. Decisions that were previously open have been resolved and are recorded in the "Resolved Decisions" section at the end.

## Glossary

- **ADR_Sentinel**: The workspace-level Kiro hook that monitors file saves in the Demo_Repository and performs exactly one of the silence, guard, covered, capture, or soft nudge behaviors per change.
- **ADR (Architectural Decision Record)**: A dated, status-bearing Markdown document that records a single architectural decision using the MADR format.
- **MADR**: The Markdown Any Decision Records format. Its sections are: frontmatter (status, date, decision-makers, consulted, informed), Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome, Consequences, Confirmation, Pros and Cons of the Options, and More Information.
- **MADR_Template**: The reusable Markdown skeleton that lists all MADR sections, stored in the Demo_Repository.
- **Confirmation Section**: The optional MADR section that declares the fitness function and names the concrete changes that would violate the decision. It is the anchor the guard behavior reads to detect conflicts.
- **Accepted ADR**: An ADR whose frontmatter status field equals "accepted".
- **Proposed ADR**: An ADR whose frontmatter status field equals "proposed".
- **Significance_Gate**: The reasoning step that classifies a saved change as either architecturally significant or not architecturally significant.
- **Guard**: The ADR_Sentinel behavior that emits a structured conflict flag when a change conflicts with an accepted ADR.
- **Capture**: The ADR_Sentinel behavior that drafts a new proposed MADR stub when a genuinely new architectural decision is detected.
- **Architecturally Significant Change**: A change to a dependency manifest, a key configuration or infrastructure file, or a broader structural change such as a new top-level module or directory.
- **Dependency Manifest**: A file that declares project dependencies, such as package.json, requirements.txt, go.mod, Cargo.toml, pom.xml, Gemfile, or composer.json.
- **Demo_Repository**: The self-contained, shareable repository located at `c:\Dev\kiro-birthday-week-challenges\hook-challenge\adr-sentinel-demo` that contains the ADR_Sentinel hook, the ADR conventions, and the sample files that triggers act on.
- **ADR_Index**: The README in `docs/adr/` that documents the ADR numbering scheme and the status legend.
- **Kiro_Hooks_UI**: The Kiro Agent Hooks user interface used to create file-event hooks ("On File Save" / "On File Create").

## Requirements

### Requirement 1: Trigger scope and hook placement

**User Story:** As a developer, I want the ADR Sentinel hook to activate on saves to architecturally-significant files, so that architectural changes are examined at the moment they are introduced.

#### Acceptance Criteria

1. WHEN a Dependency Manifest is saved, THE ADR_Sentinel SHALL begin evaluation of the saved change.
2. WHEN a key configuration or infrastructure file (Dockerfile, a GitHub Actions workflow file under `.github/workflows/` such as `.github/workflows/*.yml`, or tsconfig) is saved, THE ADR_Sentinel SHALL begin evaluation of the saved change.
3. WHEN a new top-level module or directory is added, THE ADR_Sentinel SHALL begin evaluation of the structural change.
4. THE ADR_Sentinel SHALL be stored as a workspace-level Kiro hook in the Demo_Repository at `.kiro/hooks/`.
5. THE ADR_Sentinel SHALL declare a file-event trigger whose patterns glob array covers Dependency Manifests, key configuration and infrastructure files, and new top-level modules.
6. WHERE the Kiro_Hooks_UI generates the file-event trigger, THE ADR_Sentinel configuration SHALL use the exact file-event type string produced by the Kiro_Hooks_UI.

### Requirement 2: Significance gate (silence-first)

**User Story:** As a developer, I want changes that are not architecturally significant to produce no output, so that the hook stays quiet and does not generate noise.

#### Acceptance Criteria

1. WHEN a monitored file is saved, THE Significance_Gate SHALL classify the saved change as either architecturally significant or not architecturally significant.
2. IF a saved change is classified as clearly not architecturally significant, THEN THE ADR_Sentinel SHALL produce no output, so that output is produced only for architecturally significant changes.
3. IF the significance of a saved change is inconclusive (significance can neither be confirmed nor ruled out), THEN THE ADR_Sentinel SHALL emit a minimal single-line soft nudge indicating that the analysis was inconclusive, using the pinned soft-nudge format defined in Requirement 8.
4. WHEN a saved change is classified as architecturally significant, THE ADR_Sentinel SHALL proceed to read the existing ADR records.

### Requirement 3: Reading ADR records

**User Story:** As a developer, I want the hook to read the existing decision records before acting, so that its judgments reflect the current accepted architecture.

#### Acceptance Criteria

1. WHEN a saved change is classified as architecturally significant, THE ADR_Sentinel SHALL read all ADR files matching `docs/adr/*.md`.
2. WHEN the ADR_Sentinel reads an ADR file, THE ADR_Sentinel SHALL parse the frontmatter status field of that ADR.
3. WHERE an ADR file contains a Confirmation Section, THE ADR_Sentinel SHALL parse the Confirmation Section content of that ADR.
4. THE ADR_Sentinel SHALL treat the saved file content as text and reason about the dependency and configuration names contained in the text.
5. IF the `docs/adr/` directory or its ADR files cannot be read, THEN THE ADR_Sentinel SHALL halt processing and report an error indicating the ADR records could not be accessed.

### Requirement 4: Guard behavior (conflict detection)

**User Story:** As a developer, I want changes that conflict with an accepted ADR to be flagged loudly, so that accidental reversals of settled decisions are caught immediately.

#### Acceptance Criteria

1. WHEN an architecturally significant change matches a concrete violation named in the Confirmation Section of an Accepted ADR, THE Guard SHALL emit a structured conflict flag for that detected violation AND SHALL NOT suppress or omit the flag for any detected violation.
2. WHEN the Guard emits a conflict flag, THE Guard SHALL identify the conflicting ADR by number and title.
3. WHEN the Guard emits a conflict flag, THE Guard SHALL state the rule or fitness function that the change violates.
4. WHEN the Guard emits a conflict flag, THE Guard SHALL explain the reason the change conflicts with the Accepted ADR.
5. WHEN the Guard emits a conflict flag, THE Guard SHALL present resolution options to the developer.

### Requirement 5: Covered-by-existing-ADR note

**User Story:** As a developer, I want changes already governed by an existing ADR to receive a brief acknowledgment, so that I know the decision is documented without extra noise.

#### Acceptance Criteria

1. WHEN an architecturally significant change does not conflict with any Accepted ADR AND is already covered by an existing ADR, THE ADR_Sentinel SHALL emit a single-line note that references the covering ADR by number.
2. WHEN the ADR_Sentinel emits a covered note, THE ADR_Sentinel SHALL format the note as "covered by ADR-N", where N is the covering ADR number.

### Requirement 6: Capture behavior (draft proposed MADR)

**User Story:** As a developer, I want genuinely new architectural decisions to be captured as draft records, so that decisions get written down without manual bookkeeping.

#### Acceptance Criteria

1. WHEN an architecturally significant change neither conflicts with an Accepted ADR nor is covered by an existing ADR, THE Capture SHALL create a new MADR stub file in `docs/adr/`.
2. WHEN the Capture creates a new MADR stub, THE Capture SHALL set the frontmatter status field of the stub to "proposed".
3. WHEN the Capture creates a new MADR stub, THE Capture SHALL assign the file the next sequential ADR number after the highest existing ADR number (for example, with ADR-0000 and ADR-0001 present, the next captured ADR is numbered 0002).
4. WHEN the Capture creates a new MADR stub, THE Capture SHALL populate the MADR sections defined by the MADR_Template.
5. WHEN the Capture creates a new MADR stub, THE ADR_Sentinel SHALL emit a short summary of the drafted record.

### Requirement 7: Decision-flow precedence (exactly one behavior per change)

**User Story:** As a developer, I want exactly one behavior to fire per change, so that the hook's output is unambiguous.

#### Acceptance Criteria

1. WHEN a single file save is evaluated, THE ADR_Sentinel SHALL execute exactly one of the following behaviors: silence, guard, covered note, capture, or soft nudge.
2. THE ADR_Sentinel SHALL apply behavior precedence in the following order: silence (clearly not significant), then guard (conflict with an Accepted ADR), then covered note (governed by an existing ADR), then capture (new decision), then soft nudge (inconclusive or ambiguous, when none of the preceding behaviors can be determined).
3. WHEN multiple file saves occur in sequence, THE ADR_Sentinel SHALL evaluate each save independently, SHALL produce at most one behavior per save, AND different saves in the sequence MAY result in different behaviors (for example, one save silenced while another produces a capture).

### Requirement 8: Output contract

**User Story:** As a viewer of the demo, I want each behavior to have a pinned, recognizable output format, so that the hook's actions are clear in a recorded demo.

#### Acceptance Criteria

1. WHERE the selected behavior is silence, THE ADR_Sentinel SHALL produce no output.
2. WHERE the selected behavior is guard, THE ADR_Sentinel SHALL produce a structured conflict flag that contains the ADR reference, the violated rule, the reason, and the resolution options.
3. WHERE the selected behavior is covered, THE ADR_Sentinel SHALL produce a single-line note in the format "covered by ADR-N".
4. WHERE the selected behavior is capture, THE ADR_Sentinel SHALL produce a new Proposed ADR file and a short textual summary of the drafted record.
5. WHERE the selected behavior is a soft nudge, THE ADR_Sentinel SHALL produce a single line in the format `ADR Sentinel: <one-line message>`.

### Requirement 9: Safety rails

**User Story:** As a developer, I want the hook to avoid fabricating or destroying decisions, so that the decision log stays trustworthy.

#### Acceptance Criteria

1. THE Capture SHALL set the status field of every automatically drafted ADR to "proposed".
2. WHEN the Capture creates a new ADR file, THE Capture SHALL write to a new file bearing the next sequence number and SHALL leave all existing ADR files unchanged.
3. IF a saved change is ambiguous with respect to significance or conflict, THEN THE ADR_Sentinel SHALL emit a single-line soft nudge instead of a conflict flag or a drafted record.
4. THE ADR_Sentinel SHALL prefer a low-noise, non-destructive response (silence for clearly not-significant changes, otherwise a single-line soft nudge) over fabricating a conflict flag or a drafted record when the appropriate behavior cannot be determined.
5. WHERE a change is not ambiguous, THE ADR_Sentinel MAY emit a soft nudge, but SHALL default to silence for changes classified as not architecturally significant (governed by Requirement 2.2).
6. WHEN a conflict with an Accepted ADR is unambiguous, THE Guard SHALL emit a conflict flag as defined in Requirements 4 and 8 AND SHALL NOT downgrade the conflict to a soft nudge.

### Requirement 10: Demo repository scaffolding and ADR conventions

**User Story:** As a developer evaluating the hook, I want a zero-setup demo repository, so that I can exercise the scenarios with only single-line text edits.

#### Acceptance Criteria

1. THE Demo_Repository SHALL be a self-contained repository located at `c:\Dev\kiro-birthday-week-challenges\hook-challenge\adr-sentinel-demo`.
2. THE Demo_Repository SHALL enable every demo scenario to be exercised through single-line text edits to manifest files, without API keys, accounts, installations, or running services.
3. THE Demo_Repository SHALL contain a `docs/adr/` directory that holds the MADR_Template and the ADR_Index.
4. THE ADR_Index SHALL document the ADR numbering scheme and a status legend.
5. THE Demo_Repository SHALL contain a `package.json` as the primary Dependency Manifest, a Dockerfile, a GitHub Actions workflow file at `.github/workflows/ci.yml`, and at least two source files.
6. THE MADR_Template SHALL include the frontmatter fields (status, date, decision-makers, consulted, informed) and the MADR sections (Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome, Consequences, Confirmation, Pros and Cons of the Options, and More Information).
7. WHEN the ADR_Sentinel reasons about a saved manifest, THE ADR_Sentinel SHALL treat version strings as text that need not resolve to real package versions.

### Requirement 11: Seeded accepted ADR-0001 (primary relational datastore)

**User Story:** As a developer, I want a seeded accepted ADR governing the primary relational datastore, so that the guard behavior has a concrete accepted decision to enforce.

#### Acceptance Criteria

1. THE Demo_Repository SHALL contain an ADR numbered 0001 whose frontmatter status field equals "accepted".
2. ADR-0001 SHALL record the decision to use PostgreSQL as the primary relational datastore.
3. ADR-0001 SHALL contain a Confirmation Section that names "mongodb" and "mysql2" as concrete violations.
4. THE Confirmation Section of ADR-0001 SHALL express violations in terms the ADR_Sentinel can match against Dependency Manifest text.

### Requirement 12: Dogfooding origin ADR

**User Story:** As a maintainer of the ADR Sentinel project, I want the project's own repository to record its adoption of ADR-driven governance, so that the tool demonstrates its own practice.

#### Acceptance Criteria

1. THE Demo_Repository SHALL contain an Accepted ADR that records the decision to adopt ADR-driven governance and to build the ADR_Sentinel.
2. THE dogfooding origin ADR SHALL be numbered 0000 as an origin/meta record that precedes the numbered technical decisions.
3. THE dogfooding origin ADR SHALL describe the origin story of the ADR_Sentinel project as a founding decision record.

### Requirement 13: Demo scenario acceptance (keyless, text-edit only)

**User Story:** As a presenter, I want four concrete demo scenarios to each produce a specific single behavior, so that the hook's value is demonstrable in a recorded demo without any setup.

#### Acceptance Criteria

1. WHEN "mongodb" is added as a dependency in package.json, THE ADR_Sentinel SHALL emit a guard conflict flag that cites ADR-0001. (Scenario A)
2. WHEN "redis" is added as a dependency in package.json, THE ADR_Sentinel SHALL draft a Proposed ADR stub AND SHALL treat the change as not conflicting with the primary-relational-datastore ADR. (Scenario B)
3. WHEN a trivial devDependency version (for example prettier or eslint) is bumped in package.json, THE ADR_Sentinel SHALL produce no output. (Scenario C)
4. WHEN the Dockerfile base image is changed or a service is added to the Dockerfile, THE ADR_Sentinel SHALL evaluate the change through the Significance_Gate AND SHALL produce exactly one behavior. (Scenario D)

### Requirement 14: Documentation and steering deliverables

**User Story:** As a developer adopting the hook, I want steering, a hook README, and a demo script, so that the ADR conventions and hook contract are documented and the demo is reproducible.

#### Acceptance Criteria

1. THE Demo_Repository SHALL contain a steering file that documents the ADR location, the MADR format, and the ADR_Sentinel contract.
2. THE Demo_Repository SHALL contain a hook README that describes the ADR_Sentinel behavior and configuration.
3. THE Demo_Repository SHALL contain a shot-by-shot video demo script that covers Scenario A through Scenario D.

## Resolved Decisions

The items that were previously open are now resolved and folded into the requirements above.

1. **ADR numbering for the dogfooding origin record (Requirement 11 vs Requirement 12).** Resolved: the dogfooding origin ADR is numbered 0000 (an origin/meta record that precedes numbered technical decisions), and ADR-0001 remains the Accepted PostgreSQL primary-relational-datastore decision. With ADR-0000 and ADR-0001 present, the next captured ADR is numbered 0002 (Requirements 6.3, 11.1, 12.2).
2. **Exact file-event trigger type string (Requirement 1.6).** Resolved: the file-save event type string is confirmed at hook-creation time via the Kiro Agent Hooks UI, and the ADR_Sentinel configuration uses the exact string the UI produces (Requirement 1.6).
3. **CI configuration file target (Requirements 1.2, 10.5).** Resolved: the demo repository uses GitHub Actions. The trigger references workflow files under `.github/workflows/` (for example `.github/workflows/*.yml`), and the scaffolding includes a workflow file at `.github/workflows/ci.yml`.
4. **Soft-nudge output format (Requirements 8.5, 2.3, 9.3).** Resolved: the soft nudge is pinned as a single line in the format `ADR Sentinel: <one-line message>`, standardized alongside the other output formats in Requirement 8.
