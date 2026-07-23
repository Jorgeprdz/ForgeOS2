// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-027/read-model-contract.artifact.json
// Artifact: ReadModelContract
// Stage: SG-027
// Source SHA-256: 88d9d3a699b9fdb8eca05d432a618563db44e28bf6160d3ae3d595dacbf3c3b3

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "ReadModelContract",
  "artifact_slug": "read-model-contract",
  "stage_id": "SG-027",
  "stage_name": "Read Model And Context Envelope Contracts",
  "dependency_layer": "READ_MODEL_AND_CONTEXT_ENVELOPE_CONTRACTS",
  "artifact_wave": 8,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-22T23:58:49.367184+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III",
    "CONSTITUTION_ARTICLE_V",
    "CONSTITUTION_ARTICLE_VI"
  ],
  "capabilities": [
    "CAP-READ-ONLY-ADAPTERS",
    "CAP-TRUTH-EVIDENCE"
  ],
  "functional_requirements": [
    "REQ-READ-ONLY-NO-WRITES",
    "REQ-TRUTH-OWNER-VALIDATION"
  ],
  "boundaries": [
    "BOUND-READ-ONLY",
    "BOUND-EVIDENCE-OWNERSHIP",
    "BOUND-ONE-METRIC-ONE-OWNER",
    "BOUND-NASH-NO-TRUTH"
  ],
  "adr": [
    "ADR-003",
    "ADR-010",
    "ADR-020"
  ],
  "contracts": [
    "scaffolds/contracts/scaffold-contract.schema.json",
    "scaffolds/contracts/evidence-contract.schema.json"
  ],
  "consumes": [
    "CanonicalIdentityContract",
    "SourceOfTruthRegistry",
    "OwnershipRegistry",
    "DomainEventTaxonomy",
    "EventReceiptContract",
    "ReadOnlyAdapterContractSkeleton",
    "AdvisorOwnerDecisionSet"
  ],
  "acceptance_criteria": [
    "Read models and context envelopes carry source owner, evidence, freshness, uncertainty, purpose limitation and no-write constraints before UI or intelligence consumers."
  ],
  "allowed_operations": [
    "plan",
    "record blocked evidence",
    "dry-run",
    "validate"
  ],
  "prohibited_operations": [
    "write production data",
    "call external services",
    "infer client intent"
  ],
  "fail_closed": true,
  "materialization": {
    "path": "scaffolds/artifacts/SG-027/read-model-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "ReadModelContract";
export const stageId = "SG-027";
export const sourceDigest = "88d9d3a699b9fdb8eca05d432a618563db44e28bf6160d3ae3d595dacbf3c3b3";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:ReadModelContract'
    );
  }

  return true;
}
