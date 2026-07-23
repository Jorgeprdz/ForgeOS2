// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-027/forbidden-inference-contract.artifact.json
// Artifact: ForbiddenInferenceContract
// Stage: SG-027
// Source SHA-256: f3b62d85157d3b1b5f5881d5a45e859163b18278935b8e8c61abf9dbff6af170

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "ForbiddenInferenceContract",
  "artifact_slug": "forbidden-inference-contract",
  "stage_id": "SG-027",
  "stage_name": "Read Model And Context Envelope Contracts",
  "dependency_layer": "READ_MODEL_AND_CONTEXT_ENVELOPE_CONTRACTS",
  "artifact_wave": 8,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-22T23:58:49.375338+00:00",
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
    "path": "scaffolds/artifacts/SG-027/forbidden-inference-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "ForbiddenInferenceContract";
export const stageId = "SG-027";
export const sourceDigest = "f3b62d85157d3b1b5f5881d5a45e859163b18278935b8e8c61abf9dbff6af170";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:ForbiddenInferenceContract'
    );
  }

  return true;
}
