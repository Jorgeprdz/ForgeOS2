// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-004/conversation-guidance-contract.artifact.json
// Artifact: ConversationGuidanceContract
// Stage: SG-004
// Source SHA-256: b0f2620e57eb44eb4873c4713b24c46f8ac617f326ef1fb626dff2b5cc2eb86a

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "ConversationGuidanceContract",
  "artifact_slug": "conversation-guidance-contract",
  "stage_id": "SG-004",
  "stage_name": "Conversation Intelligence Contract",
  "dependency_layer": "INTELLIGENCE_BOUNDARY",
  "artifact_wave": 10,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:04:32.346932+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_VI"
  ],
  "capabilities": [
    "CAP-CONVERSATION-INTELLIGENCE"
  ],
  "functional_requirements": [
    "REQ-NASH-DRAFTS-NOT-TRUTH"
  ],
  "boundaries": [
    "BOUND-NASH-NO-TRUTH",
    "BOUND-AI-EXPLAINS-FORGE-DECIDES",
    "BOUND-ACTION-NO-EXECUTION",
    "BOUND-HUMAN-AUTHORITY"
  ],
  "adr": [
    "ADR-010",
    "ADR-020"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "HumanReviewBoundary",
    "ContextEnvelope",
    "PurposeLimitationPolicy",
    "ForbiddenInferenceContract",
    "RelationshipContract"
  ],
  "acceptance_criteria": [
    "Conversation Intelligence Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
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
    "path": "scaffolds/artifacts/SG-004/conversation-guidance-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "ConversationGuidanceContract";
export const stageId = "SG-004";
export const sourceDigest = "b0f2620e57eb44eb4873c4713b24c46f8ac617f326ef1fb626dff2b5cc2eb86a";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:ConversationGuidanceContract'
    );
  }

  return true;
}
