// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-029/manager-workspace-surface-contract.artifact.json
// Artifact: ManagerWorkspaceSurfaceContract
// Stage: SG-029
// Source SHA-256: 2e554af6b5f3e7b785ef20f4ca60219e9eccdb90f71b518c6b7dc6baa5b9e94b

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "ManagerWorkspaceSurfaceContract",
  "artifact_slug": "manager-workspace-surface-contract",
  "stage_id": "SG-029",
  "stage_name": "Manager Workspace Surface Contract",
  "dependency_layer": "WORKSPACE_SURFACE",
  "artifact_wave": 11,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:16:57.206963+00:00",
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
    "BOUND-NO-HUMAN-CONSEQUENCE-AUTOMATION"
  ],
  "adr": [
    "ADR-015"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "ManagerCoachingContract",
    "HumanReviewBoundary",
    "WorkspaceReadModel"
  ],
  "acceptance_criteria": [
    "Manager Workspace Surface Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
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
    "path": "scaffolds/artifacts/SG-029/manager-workspace-surface-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "ManagerWorkspaceSurfaceContract";
export const stageId = "SG-029";
export const sourceDigest = "2e554af6b5f3e7b785ef20f4ca60219e9eccdb90f71b518c6b7dc6baa5b9e94b";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:ManagerWorkspaceSurfaceContract'
    );
  }

  return true;
}
