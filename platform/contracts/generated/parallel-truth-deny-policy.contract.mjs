// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-023/parallel-truth-deny-policy.artifact.json
// Artifact: ParallelTruthDenyPolicy
// Stage: SG-023
// Source SHA-256: 1814c5374fa19c13a1a5e7024ff65fcba1e40ffea987f443913cb9933e84a1f0

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "ParallelTruthDenyPolicy",
  "artifact_slug": "parallel-truth-deny-policy",
  "stage_id": "SG-023",
  "stage_name": "Ownership And Source-Of-Truth Registry",
  "dependency_layer": "OWNERSHIP_AND_SOURCE_OF_TRUTH_REGISTRY",
  "artifact_wave": 5,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-22T23:50:15.504601+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III",
    "CONSTITUTION_ARTICLE_VII"
  ],
  "capabilities": [
    "CAP-TRUTH-EVIDENCE"
  ],
  "functional_requirements": [
    "REQ-TRUTH-OWNER-VALIDATION"
  ],
  "boundaries": [
    "BOUND-EVIDENCE-OWNERSHIP",
    "BOUND-ONE-METRIC-ONE-OWNER",
    "BOUND-UNKNOWN-REMAINS-UNKNOWN"
  ],
  "adr": [
    "ADR-001",
    "ADR-002",
    "ADR-014",
    "ADR-020"
  ],
  "contracts": [
    "scaffolds/contracts/traceability.schema.json"
  ],
  "consumes": [
    "ProductSemanticsDecisionRecord",
    "DomainAuthorityDecisionRecord",
    "ClaimContract",
    "ProvenanceModel"
  ],
  "acceptance_criteria": [
    "Every source truth and metric consumed by later domains has a single owner or blocks as UNKNOWN."
  ],
  "allowed_operations": [
    "plan",
    "record blocked evidence",
    "dry-run",
    "validate"
  ],
  "prohibited_operations": [
    "create metric formulas",
    "create product behavior"
  ],
  "fail_closed": true,
  "materialization": {
    "path": "scaffolds/artifacts/SG-023/parallel-truth-deny-policy.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "ParallelTruthDenyPolicy";
export const stageId = "SG-023";
export const sourceDigest = "1814c5374fa19c13a1a5e7024ff65fcba1e40ffea987f443913cb9933e84a1f0";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:ParallelTruthDenyPolicy'
    );
  }

  return true;
}
