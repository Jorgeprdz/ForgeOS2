// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-022/actor-authority-contract.artifact.json
// Artifact: ActorAuthorityContract
// Stage: SG-022
// Source SHA-256: 672fbfc907f79940ad9adc1cd4d6b4b69058856fa3e32bce85757e28e8d5125f

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "ActorAuthorityContract",
  "artifact_slug": "actor-authority-contract",
  "stage_id": "SG-022",
  "stage_name": "Canonical Identity And Actor Model",
  "dependency_layer": "CANONICAL_IDENTITY_AND_ACTOR_MODEL",
  "artifact_wave": 5,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-22T23:51:39.304421+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III",
    "CONSTITUTION_ARTICLE_IV"
  ],
  "capabilities": [
    "CAP-TRUTH-EVIDENCE"
  ],
  "functional_requirements": [
    "REQ-TRUTH-OWNER-VALIDATION"
  ],
  "boundaries": [
    "BOUND-EVIDENCE-OWNERSHIP",
    "BOUND-HUMAN-AUTHORITY",
    "BOUND-UNKNOWN-REMAINS-UNKNOWN"
  ],
  "adr": [
    "ADR-020"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "ProductSemanticsDecisionRecord",
    "DomainAuthorityDecisionRecord",
    "AdvisorOwnerDecisionSet"
  ],
  "acceptance_criteria": [
    "Person, User, Advisor, Candidate, Recruit, Agent, Leader and Manager identity semantics are defined before role or relationship consumers."
  ],
  "allowed_operations": [
    "plan",
    "record blocked evidence",
    "dry-run",
    "validate"
  ],
  "prohibited_operations": [
    "create identity runtime",
    "merge identities automatically"
  ],
  "fail_closed": true,
  "materialization": {
    "path": "scaffolds/artifacts/SG-022/actor-authority-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "ActorAuthorityContract";
export const stageId = "SG-022";
export const sourceDigest = "672fbfc907f79940ad9adc1cd4d6b4b69058856fa3e32bce85757e28e8d5125f";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:ActorAuthorityContract'
    );
  }

  return true;
}
