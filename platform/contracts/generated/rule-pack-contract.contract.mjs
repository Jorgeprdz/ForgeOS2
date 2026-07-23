// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-009/rule-pack-contract.artifact.json
// Artifact: RulePackContract
// Stage: SG-009
// Source SHA-256: 2229881bee2de8ad1716e96b8cbcc5d09fd20bb05dfff9170e9374d963e1d826

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "RulePackContract",
  "artifact_slug": "rule-pack-contract",
  "stage_id": "SG-009",
  "stage_name": "Rule Pack Contract",
  "dependency_layer": "DOMAIN_BASE_PRODUCT_RULE_FOUNDATION",
  "artifact_wave": 9,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:00:23.003304+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_V"
  ],
  "capabilities": [
    "CAP-RULE-PACK-CONTRACT"
  ],
  "functional_requirements": [
    "REQ-RULE-PACK-CONTRACT"
  ],
  "boundaries": [
    "BOUND-RULE-PACK-SEPARATION"
  ],
  "adr": [
    "ADR-008",
    "ADR-017",
    "ADR-018"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "CarrierScopeContract",
    "SourceOfTruthRegistry",
    "EventReceiptContract"
  ],
  "acceptance_criteria": [
    "Rule Pack Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
  ],
  "allowed_operations": [
    "plan",
    "record blocked evidence",
    "dry-run",
    "validate"
  ],
  "prohibited_operations": [
    "apply product code",
    "copy legacy runtime",
    "write production data",
    "external side effects"
  ],
  "fail_closed": true,
  "materialization": {
    "path": "scaffolds/artifacts/SG-009/rule-pack-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "RulePackContract";
export const stageId = "SG-009";
export const sourceDigest = "2229881bee2de8ad1716e96b8cbcc5d09fd20bb05dfff9170e9374d963e1d826";
export const implementationStatus = "CONTRACT_RUNTIME_ONLY";

export function getContract() {
  return contract;
}

export function validateContractShape(candidate) {
  const errors = [];

  if (!candidate || typeof candidate !== 'object') {
    errors.push('CONTRACT_MUST_BE_OBJECT');
    return { valid: false, errors };
  }

  if (candidate.artifact_id !== artifactId) {
    errors.push('ARTIFACT_ID_MISMATCH');
  }

  if (candidate.stage_id !== stageId) {
    errors.push('STAGE_ID_MISMATCH');
  }

  if (!Array.isArray(candidate.consumes)) {
    errors.push('CONSUMES_MUST_BE_ARRAY');
  }

  if (!Array.isArray(candidate.boundaries)) {
    errors.push('BOUNDARIES_MUST_BE_ARRAY');
  }

  if (candidate.fail_closed !== true) {
    errors.push('FAIL_CLOSED_REQUIRED');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function assertFunctionalImplementationAllowed() {
  if (implementationStatus !== 'FUNCTIONAL_IMPLEMENTATION_ALLOWED') {
    throw new Error(
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:RulePackContract'
    );
  }

  return true;
}
