# Forge GMM Source Validation Workflow

Status: DISCOVERY / KNOWLEDGE GOVERNANCE

## Purpose

Define how new GMM documents should enter Forge knowledge governance.

## Intake Sources

Documents may enter through:

- Uploaded PDF.
- Uploaded image.
- Manual file placement.
- Official portal download.
- Advisor-provided caratula.
- Client-provided document.
- Internal training material.
- Compliance bulletin.
- Product version update.

## Validation Stages

### Stage 1: Source Intake

Capture:

- File/document title.
- Uploader/source.
- Date received.
- File type.
- Product claimed.

Output:

- Pending source record.

### Stage 2: Source Classification

Classify:

- Authoritative.
- Operational.
- Reference.
- Educational.
- Historical.
- Deprecated.
- Rejected.

Output:

- Source class and allowed use.

### Stage 3: Product Assignment

Assign:

- GMM family.
- Product.
- Product version.
- Optional coverage if applicable.

Output:

- Product-scoped source.

### Stage 4: Version and Date Review

Capture:

- Publication date.
- Effective date.
- Expiration/replacement date.
- Policy/event applicability.

Output:

- Active/historical/unknown status.

### Stage 5: Authority Review

Determine:

- Where source sits in hierarchy.
- Whether stronger sources exist.
- Whether it conflicts with active sources.

Output:

- Authority level.
- Conflict status.

### Stage 6: Extraction

Extract:

- Sections.
- Clauses.
- Tables.
- Rule candidates.
- Catalog values or classifications if operational.

Output:

- Extracted source facts with locator.

### Stage 7: Human Review

Required for:

- New authoritative source.
- Source conflict.
- Ambiguous extraction.
- Product version changes.
- Optional coverage changes.
- Operational catalogs used for financial output.

Output:

- Reviewed / rejected / needs more evidence.

### Stage 8: Registry Activation

Activate only if:

- Product assigned.
- Version known.
- Effective period known or consciously marked unknown.
- Authority class known.
- Review status sufficient for intended use.

Output:

- Active registry source or limited-use source.

## Validation Failure Conditions

Reject or restrict source when:

- Product is unknown.
- File is corrupted.
- Version is missing and cannot be inferred.
- Source conflicts with stronger active source.
- Source belongs to another product.
- Source is commercial only but used as coverage authority.
- Human review not completed where required.

## Workflow Boundary

Validation workflow approves source use classification. It does not approve
engine implementation.
