#!/usr/bin/env node
"use strict";

/*
 * ADR Sentinel deterministic guard (Tier 1).
 *
 * This is the durable enforcement backbone. It runs at commit time
 * (.githooks/pre-commit) and in CI (.github/workflows/ci.yml), where it cannot
 * be bypassed and does not depend on an editor, autosave setting, or an LLM.
 *
 * It implements ONLY the GUARD behavior, which is purely mechanical and textual:
 *   - read every docs/adr/*.md,
 *   - keep the records whose frontmatter status is `accepted`,
 *   - extract the exact violation tokens named in each accepted ADR's
 *     `## Confirmation` section (the tokens listed after a "Violation tokens"
 *     label), and
 *   - scan the repository's dependency manifests for a literal occurrence of
 *     any of those tokens.
 *
 * A match is an unambiguous conflict: the script reports it and exits non-zero.
 * The judgment-heavy behaviors (capture / covered / soft nudge) are NOT done
 * here; they live in the on-demand agent hook (see ADR-0002).
 *
 * Zero dependencies, pure Node. Run from the repository root:
 *   node scripts/adr-guard.js
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = process.cwd();
const ADR_DIR = path.join(REPO_ROOT, "docs", "adr");

// Dependency-manifest filenames the guard scans. Markdown/ADR files are never
// scanned, so a token mentioned in prose (docs, README) is not a violation.
const MANIFEST_NAMES = new Set([
  "package.json",
  "requirements.txt",
  "go.mod",
  "Cargo.toml",
  "pom.xml",
  "Gemfile",
  "composer.json",
]);

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
]);

function fail(message) {
  process.stderr.write(message + "\n");
  process.exit(1);
}

// Recursively collect dependency-manifest paths, skipping ignored directories.
function findManifests(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) findManifests(full, out);
    } else if (MANIFEST_NAMES.has(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// Extract the YAML frontmatter block (between the first two `---` fences).
function frontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : "";
}

function statusOf(content) {
  const fm = frontmatter(content);
  const m = fm.match(/^status:\s*([A-Za-z]+)/m);
  return m ? m[1].toLowerCase() : null;
}

function titleOf(content) {
  // Search the body AFTER the frontmatter block so `#` comment lines inside the
  // frontmatter (e.g. "# Status of this decision.") are not mistaken for the
  // title heading.
  const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const m = body.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : "(untitled)";
}

// Pull the `## Confirmation` section text (up to the next `## ` heading).
function confirmationSection(content) {
  const start = content.search(/^##\s+Confirmation\s*$/m);
  if (start === -1) return "";
  const rest = content.slice(start);
  const next = rest.search(/^##\s+(?!Confirmation)/m);
  return next === -1 ? rest : rest.slice(0, next);
}

// Extract violation tokens: backtick-quoted identifiers that appear AFTER a
// line containing "violation token" and BEFORE any "compliant" marker. This
// keeps the parse scoped so ADRs without that labelled list (e.g. process
// ADRs) contribute no tokens.
function violationTokens(confirmation) {
  const lower = confirmation.toLowerCase();
  const startIdx = lower.indexOf("violation token");
  if (startIdx === -1) return [];
  let zone = confirmation.slice(startIdx);
  const compliantIdx = zone.toLowerCase().indexOf("compliant");
  if (compliantIdx !== -1) zone = zone.slice(0, compliantIdx);
  const tokens = new Set();
  const re = /`([^`\r\n]+)`/g;
  let m;
  while ((m = re.exec(zone)) !== null) {
    const tok = m[1].trim();
    if (tok) tokens.add(tok);
  }
  return [...tokens];
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Literal token match with identifier-style boundaries so `mongodb` does not
// match inside a longer package name.
function containsToken(text, token) {
  const re = new RegExp("(?<![\\w-])" + escapeRegExp(token) + "(?![\\w-])");
  return re.test(text);
}

function main() {
  // Error path (parity with the hook's STEP 1): if the ADR records cannot be
  // read, halt and report rather than acting on partial data.
  let adrFiles;
  try {
    adrFiles = fs
      .readdirSync(ADR_DIR)
      .filter((f) => /^\d{4}-.*\.md$/.test(f))
      .sort();
  } catch {
    fail(
      "ADR Sentinel: cannot access ADR records under docs/adr/ - halting without evaluating this change.",
    );
    return;
  }

  const accepted = [];
  for (const file of adrFiles) {
    const full = path.join(ADR_DIR, file);
    let content;
    try {
      content = fs.readFileSync(full, "utf8");
    } catch {
      fail(
        "ADR Sentinel: cannot access ADR records under docs/adr/ - halting without evaluating this change.",
      );
      return;
    }
    if (statusOf(content) !== "accepted") continue;
    const tokens = violationTokens(confirmationSection(content));
    if (tokens.length === 0) continue;
    const num = file.slice(0, 4);
    accepted.push({ num, title: titleOf(content), tokens });
  }

  const manifests = findManifests(REPO_ROOT, []);

  const violations = [];
  for (const manifest of manifests) {
    let text;
    try {
      text = fs.readFileSync(manifest, "utf8");
    } catch {
      continue;
    }
    const rel = path.relative(REPO_ROOT, manifest).split(path.sep).join("/");
    for (const adr of accepted) {
      for (const token of adr.tokens) {
        if (containsToken(text, token)) {
          violations.push({ adr, token, manifest: rel });
        }
      }
    }
  }

  if (violations.length === 0) {
    process.stdout.write(
      `ADR Sentinel guard: OK - scanned ${manifests.length} manifest(s) against ` +
        `${accepted.length} accepted ADR(s) with violation tokens; no conflicts.\n`,
    );
    process.exit(0);
  }

  const lines = [];
  for (const v of violations) {
    lines.push(
      `ADR CONFLICT - ADR-${v.adr.num}: ${v.adr.title}`,
      `  Manifest: ${v.manifest}`,
      `  Violated rule: contains the forbidden token \`${v.token}\` named in ADR-${v.adr.num}'s Confirmation section.`,
      `  Reason: ADR-${v.adr.num} is accepted and names \`${v.token}\` as a violation; its presence reverses that decision.`,
      `  Resolution:`,
      `    1. Remove \`${v.token}\` and use the compliant alternative from ADR-${v.adr.num}.`,
      `    2. If this is deliberate, supersede ADR-${v.adr.num} with a new ADR documenting the shift.`,
      "",
    );
  }
  fail(lines.join("\n").trimEnd());
}

main();
