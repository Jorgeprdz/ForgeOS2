# SG-002 Instantiation Inventory
## Purpose
Inventory every documentary instance created by SG-002.
## Scope
Twelve domain, twelve existing-owner Source of Truth, twelve boundary and five control documents.
## Responsibilities
Provide exact counts, categories and statuses; detect omissions or additions against the Gate manifest.
## Authority
SG-002 Gate exact allowlist; Unified Constitution Articles II/III/IX.
## Boundaries
Inventory inclusion creates no domain, owner, truth, architecture or software authority.
## Dependencies
Filesystem manifest, SG-002 Gate, Git diff and [Traceability Matrix](SG002_INSTANCE_TRACEABILITY_MATRIX.md).
## Source of Truth
This document owns SG-002 artifact inventory; Git owns byte-level history; the Gate owns authorization.
## Related Documents
[Blocked Register](SG002_BLOCKED_CANDIDATE_REGISTER.md); [Changelog](SG002_CHANGELOG.md); [Governance Inventory](../../../../governance/scaffolds/SCAFFOLD_INVENTORY.md).
## Related ADRs
ADR-005–018 as routed; ADR-020.
## Constitutional References
Article 0 / Ley Zero; Articles II, III, VIII and IX.
## Status
`PASS / 41 OF 41 MANIFEST FILES INSTANTIATED`
## Version
`1.0.0` — `2026-07-21`.
## Traceability
Origin: governance traceability and documentary immutability. Historical preservation: explicit catalogs/inventories. Difference: only ratified-manifest artifacts are counted. Justification/evidence: 12 domain + 12 Source of Truth + 12 boundary + 5 control = 41. Implementation boundary: Markdown documentation only.

| Family | Count | Location | Result |
|---|---:|---|---|
| Domain Responsibility | 12 | `instances/domains/` | PASS |
| Existing-owner Source of Truth | 12 | `instances/source-truth/` | PASS |
| Architecture Boundary | 12 | `instances/boundaries/` | PASS |
| SG-002 controls | 5 | `sg-002/` | PASS |
