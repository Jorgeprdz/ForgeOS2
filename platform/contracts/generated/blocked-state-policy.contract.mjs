// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-001/blocked-state-policy.artifact.json
// Artifact: BlockedStatePolicy
// Stage: SG-001
// Source SHA-256: 329b171d4cf545f204924da9935874851960944033be0e21f443f6dad5b44829

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "BlockedStatePolicy",
  "artifact_slug": "blocked-state-policy",
  "stage_id": "SG-001",
  "stage_name": "Constitutional Runtime Constraints",
  "dependency_layer": "CONSTITUTIONAL_RUNTIME_CONSTRAINTS",
  "artifact_wave": 1,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T03:34:38.218830+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_0",
    "CONSTITUTION_ARTICLE_VIII"
  ],
  "capabilities": [
    "CAP-GOVERNANCE-GATE",
    "CAP-TRUTH-EVIDENCE"
  ],
  "functional_requirements": [
    "REQ-ROBOCOP-GATE",
    "REQ-TRUTH-OWNER-VALIDATION"
  ],
  "boundaries": [
    "BOUND-ROBOCOP-GATE",
    "BOUND-NO-SILENT-RATIFICATION",
    "BOUND-EVIDENCE-OWNERSHIP"
  ],
  "adr": [
    "ADR-020"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json",
    "scaffolds/contracts/evidence-contract.schema.json"
  ],
  "consumes": [],
  "acceptance_criteria": [
    "Constitutional runtime constraints, governance gates and blocked-state semantics are available before any consumer stage."
  ],
  "allowed_operations": [
    "plan",
    "dry-run",
    "apply bootstrap evidence",
    "validate"
  ],
  "prohibited_operations": [
    "product behavior",
    "legacy runtime",
    "external effects"
  ],
  "fail_closed": true,
  "materialization": {
    "path": "scaffolds/artifacts/SG-001/blocked-state-policy.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "BlockedStatePolicy";
export const stageId = "SG-001";
export const sourceDigest = "329b171d4cf545f204924da9935874851960944033be0e21f443f6dad5b44829";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:BlockedStatePolicy'
    );
  }

  return true;
}
