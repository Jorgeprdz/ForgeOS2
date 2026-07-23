// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-013/manager-coaching-contract.artifact.json
// Artifact: ManagerCoachingContract
// Stage: SG-013
// Source SHA-256: 17833d1ed0ac191f4a4c792475a2f9db32d2852c6df92fdf45530dc3e8901e4a

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "ManagerCoachingContract",
  "artifact_slug": "manager-coaching-contract",
  "stage_id": "SG-013",
  "stage_name": "Manager Coaching Contract",
  "dependency_layer": "INTELLIGENCE_CONSUMER",
  "artifact_wave": 10,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:11:35.229501+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_IV",
    "CONSTITUTION_ARTICLE_VI"
  ],
  "capabilities": [
    "CAP-MANAGER-COACHING"
  ],
  "functional_requirements": [
    "REQ-MANAGER-COACHING-NO-CONSEQUENCES"
  ],
  "boundaries": [
    "BOUND-MANAGER-COACHING-ONLY",
    "BOUND-NO-HUMAN-CONSEQUENCE-AUTOMATION",
    "BOUND-HUMAN-AUTHORITY"
  ],
  "adr": [
    "ADR-015"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "ObservableBehaviorSignalContract",
    "HumanAuthorityContract",
    "ContextEnvelope"
  ],
  "acceptance_criteria": [
    "Manager Coaching Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
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
    "path": "scaffolds/artifacts/SG-013/manager-coaching-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "ManagerCoachingContract";
export const stageId = "SG-013";
export const sourceDigest = "17833d1ed0ac191f4a4c792475a2f9db32d2852c6df92fdf45530dc3e8901e4a";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:ManagerCoachingContract'
    );
  }

  return true;
}
