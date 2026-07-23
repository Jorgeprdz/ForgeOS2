// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-015/advisor-experience-contract.artifact.json
// Artifact: AdvisorExperienceContract
// Stage: SG-015
// Source SHA-256: 1dd24d3a6fe0655cffff4d927b78d4605ee43c1911fd9a29d654a0626c4fa1b5

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "AdvisorExperienceContract",
  "artifact_slug": "advisor-experience-contract",
  "stage_id": "SG-015",
  "stage_name": "Advisor Experience Transversal Contract",
  "dependency_layer": "TRANSVERSAL_EXPERIENCE",
  "artifact_wave": 11,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:14:01.442292+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_0"
  ],
  "capabilities": [
    "CAP-ADVISOR-EXPERIENCE"
  ],
  "functional_requirements": [
    "REQ-ADVISOR-EXPERIENCE-TRANSVERSAL"
  ],
  "boundaries": [
    "BOUND-ADVISOR-EXPERIENCE-ANTI-DEPENDENCE",
    "BOUND-CAPTURE-ONCE"
  ],
  "adr": [
    "ADR-016"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "AdvisorRoleModel",
    "OwnershipRegistry",
    "HumanReviewBoundary",
    "ContextEnvelope",
    "ConversationGuidanceContract",
    "ObservableBehaviorSignalContract",
    "PolicyOperationsContract"
  ],
  "acceptance_criteria": [
    "Advisor Experience Transversal Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
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
    "path": "scaffolds/artifacts/SG-015/advisor-experience-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "AdvisorExperienceContract";
export const stageId = "SG-015";
export const sourceDigest = "1dd24d3a6fe0655cffff4d927b78d4605ee43c1911fd9a29d654a0626c4fa1b5";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:AdvisorExperienceContract'
    );
  }

  return true;
}
