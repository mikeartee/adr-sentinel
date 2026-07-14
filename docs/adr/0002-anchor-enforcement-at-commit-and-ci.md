---
# Status of this decision.
# One of: proposed | accepted | rejected | deprecated | superseded
status: accepted
# ISO 8601 date the decision was made (YYYY-MM-DD).
date: 2026-07-14
# Who made the decision.
decision-makers: [team]
# Who was consulted (subject-matter experts whose opinions were sought).
consulted: []
# Who was informed (kept up to date on progress).
informed: []
---

# Anchor ADR Sentinel enforcement at commit and CI, not file save

## Context and Problem Statement

ADR Sentinel was originally implemented as a single Kiro agent hook that fired
on file save (`when.type: fileEdited`) and, through an `askAgent` action, ran the
full decision flow (silence, guard, covered, capture, soft nudge) on every save.

Live testing exposed a structural flaw. With editor autosave enabled, a "save"
happens on nearly every keystroke pause, so the hook fired continuously and each
firing spawned a fresh agent session. Worse, because the significance gate runs
_inside_ that session, the gate can quiet the output but cannot prevent the
session from opening. When a person edits code directly (not through the chat),
a per-keystroke agent hook can interrupt them with half-formed, mid-typing
suggestions. That is a correctness problem, not a noise preference.

Two facts make this unfixable at the hook layer: the hook schema exposes no
debounce or delay, and even a save-specific trigger would still fire on every
autosave because autosave produces genuine save events. The behavior the project
most needs to be reliable, the guard against reversing an accepted decision, was
therefore riding on an LLM judgment call inside an editor session that only
existed while the file was open in Kiro. How should enforcement be anchored so it
is durable, deterministic for the must-not-miss case, and never interrupts direct
editing?

## Decision Drivers

- Enforcement must not depend on a contributor's editor, autosave setting, or
  whether Kiro is even open.
- The guard (blocking a change that reverses an accepted ADR) must be
  deterministic and must never be missed.
- Governance must run at an intentional, coalesced moment, not per keystroke.
- The judgment-heavy behaviors (is this significant? already covered? draft a
  record) should stay where judgment is available.
- The check should run server-side where it cannot be silently bypassed.

## Considered Options

- Option A: Keep the save-triggered agent hook and tell each user to disable or
  soften autosave.
- Option B: Add a debounce to the hook so bursts of saves coalesce into one run.
- Option C: Re-anchor enforcement. Run a deterministic guard at commit
  (pre-commit) and in CI, and move the agent decision flow to a manual,
  on-demand trigger.
- Option D: Move everything into CI only and drop the in-editor experience
  entirely.

## Decision Outcome

Chosen option: "Option C, re-anchor enforcement", split into two tiers.

Tier 1, the guard, becomes deterministic and textual. `scripts/adr-guard.js`
(zero dependencies, no LLM) reads every `docs/adr/*.md`, keeps the records whose
status is accepted, extracts the package-name tokens each such record's
Confirmation section forbids, and scans the repository's dependency manifests for
a literal occurrence of any of them. A match exits non-zero. It runs in a
pre-commit hook (fast local feedback) and as a required CI job on push and pull
request (the backbone that has to hold).

Tier 2, capture / covered / soft nudge, stays with the agent because it needs
judgment, but it now fires only on a manual trigger (`when.type: userTriggered`),
reviewed on demand over the current working-tree changes. It never fires on save.

With enforcement anchored to the commit and to CI, autosave becomes irrelevant
and direct code editing is never interrupted.

## Consequences

- Good, because the guard is deterministic, runs for every contributor, and runs
  server-side in CI where it cannot be bypassed.
- Good, because nothing fires while a person types; the agent runs only when
  asked.
- Good, because the guard no longer depends on an LLM or on Kiro being open.
- Bad, because the project is no longer prompt-only: Tier 1 introduces a small
  runtime script. This is a deliberate trade for a durable guarantee.
- Bad, because the deterministic guard is textual and does not exercise judgment;
  the nuanced behaviors now require the on-demand agent run or code review.
- Neutral, because the pre-commit hook is opt-in per clone (`npm run
hooks:install`); CI enforces regardless.

## Confirmation

This decision is confirmed by three mechanical checks, all textual and requiring
no judgment:

1. `scripts/adr-guard.js` exists and, run from the repository root, exits zero on
   a clean tree and non-zero when a dependency manifest introduces a package
   token that an accepted ADR's Confirmation section forbids.
2. `.github/workflows/ci.yml` defines a job that runs `node scripts/adr-guard.js`
   on both `push` and `pull_request`, so the guard cannot be bypassed on the
   server side.
3. The agent hook at `.kiro/hooks/adr-sentinel.kiro.hook` is not bound to a
   file-save or file-edit event (its `when.type` is a manual trigger), so it can
   never fire on save.

Reverting any of these (deleting the guard script, removing the CI job, or
re-binding the hook to `fileEdited`) reverses this decision and should be done by
superseding this ADR with a new record rather than editing it.

## Pros and Cons of the Options

### Option A: keep save-trigger, tune autosave

- Good, because it needs no new code.
- Neutral, because it can quieten the symptom on one machine.
- Bad, because it is a per-user editor preference, not committed, and does not
  protect anyone who clones the repository or edits with autosave on.

### Option B: debounce the hook

- Good, because it would be the ideal in-hook fix if it existed.
- Bad, because neither hook schema supports a debounce or delay field.
- Bad, because it still would not run in CI or protect non-Kiro contributors.

### Option C: re-anchor at commit and CI (chosen)

- Good, because it is durable, deterministic for the guard, and runs where it
  cannot be bypassed.
- Good, because it removes all mid-typing interruptions.
- Bad, because it adds a small runtime script, departing from the prompt-only
  design.

### Option D: CI only

- Good, because it is the simplest durable enforcement.
- Bad, because it drops the fast local feedback and the on-demand in-editor
  capture that make the tool pleasant to use day to day.

## More Information

This decision operates within the ADR-driven governance established by ADR-0000.
It does not change ADR-0001; the deterministic guard reads ADR-0001's
Confirmation section as its source of forbidden datastore tokens, so ADR-0001
remains the machine-readable anchor it always was. The relevant artifacts are
`scripts/adr-guard.js` (the guard), `.github/workflows/ci.yml` (the CI job),
`.githooks/pre-commit` (local fast feedback), and
`.kiro/hooks/adr-sentinel.kiro.hook` (the on-demand agent review). The general
principle that editor hooks are advisory and that CI is the boundary that has to
hold is well established in the Kiro community.
