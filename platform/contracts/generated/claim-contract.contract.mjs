// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-002/claim-contract.artifact.json
// Artifact: ClaimContract
// Stage: SG-002
// Source SHA-256: 4c8f105950d746cb19e5e26cd7fc3070c3bd66960fd5ae910a283a46772b42b9

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "ClaimContract",
  "artifact_slug": "claim-contract",
  "stage_id": "SG-002",
  "stage_name": "Evidence, Claim, Provenance And Core Contract Skeletons",
  "dependency_layer": "EVIDENCE_CLAIM_PROVENANCE_AND_CORE_CONTRACTS",
  "artifact_wave": 2,
  "version": "1.0.0",
  "status": "NOT_IMPLEMENTED",
  "generated_by": "forge-rewrite-materializer",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III",
    "CONSTITUTION_ARTICLE_IV",
    "CONSTITUTION_ARTICLE_V"
  ],
  "capabilities": [
    "CAP-DECISION-CORE",
    "CAP-ACTION-PLANNING",
    "CAP-READ-ONLY-ADAPTERS",
    "CAP-TRUTH-EVIDENCE"
  ],
  "functional_requirements": [
    "REQ-DECISION-EVIDENCE-ACTION",
    "REQ-ACTION-RECOMMENDATION-NOT-EXECUTION",
    "REQ-READ-ONLY-NO-WRITES",
    "REQ-TRUTH-OWNER-VALIDATION"
  ],
  "boundaries": [
    "BOUND-EVIDENCE-OWNERSHIP",
    "BOUND-ACTION-NO-EXECUTION",
    "BOUND-READ-ONLY",
    "BOUND-ONE-METRIC-ONE-OWNER",
    "BOUND-UNKNOWN-REMAINS-UNKNOWN"
  ],
  "consumes": [
    "ConstitutionalRuntimeConstraints",
    "RobocopGateContract",
    "BlockedStatePolicy"
  ],
  "purpose": "Defines the minimum declarative contract for claims, ownership and validation state.",
  "implementation_behavior": "FORGE_SCAFFOLD_NOT_IMPLEMENTED",
  "fail_closed": true,
  "manual_execution_authority": false,
  "materialization": {
    "path": "scaffolds/artifacts/SG-002/claim-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest"
  }
});

export const artifactId = "ClaimContract";
export const stageId = "SG-002";
export const sourceDigest = "4c8f105950d746cb19e5e26cd7fc3070c3bd66960fd5ae910a283a46772b42b9";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:ClaimContract'
    );
  }

  return true;
}
