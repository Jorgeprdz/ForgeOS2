// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-003/relationship-next-action-contract.artifact.json
// Artifact: RelationshipNextActionContract
// Stage: SG-003
// Source SHA-256: d3d9729d5f8e86424d207a066fa264d732d2dd3c3b3eba0a2c731d76f241504e

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "RelationshipNextActionContract",
  "artifact_slug": "relationship-next-action-contract",
  "stage_id": "SG-003",
  "stage_name": "Relationship Intelligence Contract",
  "dependency_layer": "DOMAIN_BASE_RELATIONSHIP",
  "artifact_wave": 9,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:01:12.852268+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III",
    "CONSTITUTION_ARTICLE_IV",
    "CONSTITUTION_ARTICLE_VI"
  ],
  "capabilities": [
    "CAP-RELATIONSHIP-INTELLIGENCE"
  ],
  "functional_requirements": [
    "REQ-RELATIONSHIP-NON-MANIPULATION"
  ],
  "boundaries": [
    "BOUND-RELATIONSHIP-NON-MANIPULATION",
    "BOUND-HUMAN-AUTHORITY",
    "BOUND-EVIDENCE-OWNERSHIP"
  ],
  "adr": [
    "ADR-011",
    "ADR-020"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "CanonicalIdentityContract",
    "AdvisorRoleModel",
    "OwnershipRegistry",
    "SourceOfTruthRegistry",
    "HumanAuthorityContract",
    "DomainEventTaxonomy",
    "EventReceiptContract",
    "ContextEnvelope",
    "ForbiddenInferenceContract"
  ],
  "acceptance_criteria": [
    "Relationship Intelligence Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
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
    "path": "scaffolds/artifacts/SG-003/relationship-next-action-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "RelationshipNextActionContract";
export const stageId = "SG-003";
export const sourceDigest = "d3d9729d5f8e86424d207a066fa264d732d2dd3c3b3eba0a2c731d76f241504e";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:RelationshipNextActionContract'
    );
  }

  return true;
}
