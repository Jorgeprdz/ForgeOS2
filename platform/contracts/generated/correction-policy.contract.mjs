// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-025/correction-policy.artifact.json
// Artifact: CorrectionPolicy
// Stage: SG-025
// Source SHA-256: 76f3c02897fe452ccc37148d56b408213404dc81f7db2cde03e1cccaa6feeb01

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "CorrectionPolicy",
  "artifact_slug": "correction-policy",
  "stage_id": "SG-025",
  "stage_name": "Lifecycle State And Transition Framework",
  "dependency_layer": "LIFECYCLE_STATE_AND_TRANSITION_FRAMEWORK",
  "artifact_wave": 6,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-22T23:57:21.079140+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III",
    "CONSTITUTION_ARTICLE_IV"
  ],
  "capabilities": [
    "CAP-TRUTH-EVIDENCE",
    "CAP-GOVERNANCE-GATE"
  ],
  "functional_requirements": [
    "REQ-TRUTH-OWNER-VALIDATION",
    "REQ-ROBOCOP-GATE"
  ],
  "boundaries": [
    "BOUND-EVIDENCE-OWNERSHIP",
    "BOUND-HUMAN-AUTHORITY",
    "BOUND-NO-HUMAN-CONSEQUENCE-AUTOMATION",
    "BOUND-UNKNOWN-REMAINS-UNKNOWN"
  ],
  "adr": [
    "ADR-020"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json",
    "scaffolds/contracts/evidence-contract.schema.json"
  ],
  "consumes": [
    "CanonicalIdentityContract",
    "AdvisorRoleModel",
    "HumanAuthorityContract",
    "AdvisorOwnerDecisionSet"
  ],
  "acceptance_criteria": [
    "Lifecycle state vocabulary, transition authority, correction and receipt semantics exist before Advisor/Relationship/Workspace consumers."
  ],
  "allowed_operations": [
    "plan",
    "record blocked evidence",
    "dry-run",
    "validate"
  ],
  "prohibited_operations": [
    "create lifecycle runtime",
    "write production data",
    "auto-transition people"
  ],
  "fail_closed": true,
  "materialization": {
    "path": "scaffolds/artifacts/SG-025/correction-policy.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "CorrectionPolicy";
export const stageId = "SG-025";
export const sourceDigest = "76f3c02897fe452ccc37148d56b408213404dc81f7db2cde03e1cccaa6feeb01";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:CorrectionPolicy'
    );
  }

  return true;
}
