# 107Z7R2 — ADR-0027 source alignment evidence

Status: **HOLD**

## Candidate ranking

### `docs/02-adr-candidates/ADR-0027_COMPENSATION_RULE_PACK_BOUNDARY.md`

- Score: `22`
- Reasons: `["adr_0027_filename", "explicit_input_or_identity"]`
- Exact rule title: `false`
- Hidden/latest evidence: `false`
- Explicit contract evidence: `true`

- L1: `# ADR-0027: Compensation Rule Pack Boundary`
- L36: `- Rule packs JSON translate official evidence into executable structured rules.`
- L38: `- Tests prove that engines obey rule packs.`
- L43: `Forge OS will establish a Compensation Rule Pack Boundary.`
- L45: `Any business rule that can change by official document, carrier, year, contract, product, role, compensation manual, commission statement policy or governance decision must live in versioned JSON rule packs.`
- L47: `JavaScript engines must not own variable business rules. Engines must operate as deterministic interpreters that consume rule packs, raw facts and evidence, then produce structured outputs.`
- L65: `## The Rule Pack Boundary`
- L67: `### What belongs in JSON rule packs`
- L69: `Rule packs may contain the executable translation of official evidence.`
- L71: `Rule packs may define:`
- L75: `- rulePackId`
- L76: `- rulePackVersion`
- L87: `- rule pack hash once official`
- L132: `Rule packs may define official financial buckets used by engines, such as:`
- L150: `Rule packs may define required evidence for:`
- L163: `- Validate rule pack shape`
- L164: `- Resolve aliases using rule packs`
- L168: `- Split amounts according to rule pack instructions`
- L169: `- Move through months according to rule pack anchors`
- L174: `- Preserve hidden_by_scope`
- L179: `- Attach rulePackId, rulePackVersion and rulePackHash to outputs`
- L189: `But engines must not decide which business concept uses which handler. That mapping must come from the rule pack.`
- L214: `Those decisions belong in the active rule pack.`
- L218: `Rule packs must not contain executable code.`
- L220: `Forge OS must never evaluate rule pack strings as code.`
- L230: `Rule packs may reference only approved deterministic strategy identifiers.`
- L242: `The strategy implementation lives in JS as stable deterministic code. The rule pack only selects the strategy and provides parameters.`
- L246: `Every calculation output that depends on a rule pack must include rule pack identity metadata.`
- L250: `- rulePackId`
- L251: `- rulePackVersion`
- L252: `- rulePackHash`
- L253: `- rulePackEffectiveDate`
- L256: `The rulePackHash must be generated and sealed during the build pipeline, publication process or official rule pack promotion step. Engines must not recompute the official rulePackHash on every runtime execution as a substitute for artifact governance.`
- L267: `If a rule pack changes later, previously generated outputs must remain auditable against the exact rule pack version and hash used at calculation time.`
- L269: `Rule pack mutation after official approval is not allowed. Corrections must create a new version.`
- L278: `- Hidden by scope is not zero.`
- L285: `Engines must never silently coerce unknown, blocked, not_modeled, hidden_by_scope or missing evidence into zero.`
- L287: `## Rule Pack Governance`
- L289: `Rule packs must be:`
- L297: `- loaded explicitly by engines or adapters`

## Required ADR fragment presence

```json
{
  "rule_title": true,
  "explicit_identity": true,
  "implicit_latest": true,
  "failure_clause": true
}
```

## Diagnosis

```json
{
  "OUTCOME": "CANONICAL_ADR_0027_SOURCE_NOT_PROVEN",
  "FAILED_CHECK_ID": "ADR_0027_RULE_ALIGNED",
  "CANONICAL_ADR_0027_SOURCE_PATH": "",
  "CANONICAL_SOURCE_PROVEN": false,
  "CANONICAL_SOURCE_AMBIGUOUS": false,
  "ADR_ALREADY_CONTAINS_REQUIRED_RULE": true,
  "REVIEW_SOURCE_RESOLUTION_FALSE_NEGATIVE": false,
  "SECOND_REVISION_APPLIED": false,
  "MISSING_CANONICAL_ADR_0027_SOURCE": true,
  "FRAGMENT_PRESENCE": {
    "rule_title": true,
    "explicit_identity": true,
    "implicit_latest": true,
    "failure_clause": true
  },
  "NEXT_GATE": "107Z8S_TARGETED_CANONICAL_ADR_0027_SOURCE_DISCOVERY_GATE",
  "HOLD_REASON": "canonical ADR-0027 source is missing or ambiguous; the ADR must not be patched again without source proof"
}
```

## Safety receipt

```json
{
  "NEW_ENGINE_CREATED": false,
  "NEW_CACHE_CREATED": false,
  "DUPLICATE_BRIDGE_CREATED": false,
  "PDF_READ_EXECUTED": false,
  "PARSER_EXECUTED": false,
  "OCR_EXECUTED": false,
  "SOURCE_UI_CHANGED": false,
  "QUOTE_TRUTH_ALLOWED": false,
  "REAL_ENGINE_EXECUTION": false,
  "BACKEND_CONNECTION": false,
  "TEST_EXECUTION": false
}
```
