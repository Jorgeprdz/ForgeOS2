// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-014/observable-behavior-signal-contract.artifact.json
// Artifact: ObservableBehaviorSignalContract
// Stage: SG-014
// Source SHA-256: 2ec2e0c651589f117f1ba8a1b6def785fedb6c3794cd846ee4020bce841a0b74

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "ObservableBehaviorSignalContract",
  "artifact_slug": "observable-behavior-signal-contract",
  "stage_id": "SG-014",
  "stage_name": "Mick Observable Behavior Contract",
  "dependency_layer": "INTELLIGENCE_BOUNDARY",
  "artifact_wave": 9,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:03:41.847152+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_VI"
  ],
  "capabilities": [
    "CAP-MICK-BEHAVIOR"
  ],
  "functional_requirements": [
    "REQ-MICK-OBSERVABLE-BEHAVIOR"
  ],
  "boundaries": [
    "BOUND-MICK-OBSERVABLE-BEHAVIOR",
    "BOUND-NO-HUMAN-WORTH"
  ],
  "adr": [
    "ADR-013",
    "ADR-014"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "MetricOwnershipRegistry",
    "ProductivityMetricContract",
    "SourceOfTruthRegistry",
    "ContextEnvelope",
    "EventReceiptContract"
  ],
  "acceptance_criteria": [
    "Mick Observable Behavior Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
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
    "path": "scaffolds/artifacts/SG-014/observable-behavior-signal-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "ObservableBehaviorSignalContract";
export const stageId = "SG-014";
export const sourceDigest = "2ec2e0c651589f117f1ba8a1b6def785fedb6c3794cd846ee4020bce841a0b74";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:ObservableBehaviorSignalContract'
    );
  }

  return true;
}
