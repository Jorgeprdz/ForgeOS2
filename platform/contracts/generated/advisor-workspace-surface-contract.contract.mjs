// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-028/advisor-workspace-surface-contract.artifact.json
// Artifact: AdvisorWorkspaceSurfaceContract
// Stage: SG-028
// Source SHA-256: 1e5bd7e71bfb39136c60c81f88864d1b18b42d28f73001651636c31ce3160845

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "AdvisorWorkspaceSurfaceContract",
  "artifact_slug": "advisor-workspace-surface-contract",
  "stage_id": "SG-028",
  "stage_name": "Advisor Workspace Surface Contract",
  "dependency_layer": "WORKSPACE_SURFACE",
  "artifact_wave": 12,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:17:50.819027+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_0",
    "CONSTITUTION_ARTICLE_IV"
  ],
  "capabilities": [
    "CAP-ADVISOR-EXPERIENCE",
    "CAP-ACTION-PLANNING"
  ],
  "functional_requirements": [
    "REQ-ADVISOR-EXPERIENCE-TRANSVERSAL",
    "REQ-ACTION-RECOMMENDATION-NOT-EXECUTION"
  ],
  "boundaries": [
    "BOUND-ADVISOR-EXPERIENCE-ANTI-DEPENDENCE",
    "BOUND-ACTION-NO-EXECUTION",
    "BOUND-HUMAN-AUTHORITY"
  ],
  "adr": [
    "ADR-003",
    "ADR-016"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "RelationshipContract",
    "NASHBoundaryContract",
    "PolicyOperationsContract",
    "AdvisorExperienceContract",
    "ContextEnvelope",
    "WorkspaceReadModel",
    "AllowedActionContract"
  ],
  "acceptance_criteria": [
    "Advisor Workspace Surface Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
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
    "path": "scaffolds/artifacts/SG-028/advisor-workspace-surface-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "AdvisorWorkspaceSurfaceContract";
export const stageId = "SG-028";
export const sourceDigest = "1e5bd7e71bfb39136c60c81f88864d1b18b42d28f73001651636c31ce3160845";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:AdvisorWorkspaceSurfaceContract'
    );
  }

  return true;
}
