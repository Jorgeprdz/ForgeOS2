// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-005/policy-operations-contract.artifact.json
// Artifact: PolicyOperationsContract
// Stage: SG-005
// Source SHA-256: d4b2cc4011bcfc2d5c688be889c3ef2616c23904e28dbead03f37a76928d4206

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "PolicyOperationsContract",
  "artifact_slug": "policy-operations-contract",
  "stage_id": "SG-005",
  "stage_name": "Policy Operations Contract",
  "dependency_layer": "DOMAIN_BASE_OPERATIONS",
  "artifact_wave": 9,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:01:59.813301+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III",
    "CONSTITUTION_ARTICLE_V"
  ],
  "capabilities": [
    "CAP-POLICY-OPERATIONS"
  ],
  "functional_requirements": [
    "REQ-POLICY-TRUTH-SEPARATION"
  ],
  "boundaries": [
    "BOUND-POLICY-TRUTH",
    "BOUND-EVIDENCE-OWNERSHIP",
    "BOUND-CAPTURE-ONCE"
  ],
  "adr": [
    "ADR-006"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "SourceOfTruthRegistry",
    "EventReceiptContract",
    "ContextEnvelope"
  ],
  "acceptance_criteria": [
    "Policy Operations Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
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
    "path": "scaffolds/artifacts/SG-005/policy-operations-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "PolicyOperationsContract";
export const stageId = "SG-005";
export const sourceDigest = "d4b2cc4011bcfc2d5c688be889c3ef2616c23904e28dbead03f37a76928d4206";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:PolicyOperationsContract'
    );
  }

  return true;
}
