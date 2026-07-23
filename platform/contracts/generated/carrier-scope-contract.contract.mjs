// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-008/carrier-scope-contract.artifact.json
// Artifact: CarrierScopeContract
// Stage: SG-008
// Source SHA-256: e7fcbeea6ffe77d89539f7293e149596f62ec35ef24c4e8d21f01bb6edd44fcc

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "CarrierScopeContract",
  "artifact_slug": "carrier-scope-contract",
  "stage_id": "SG-008",
  "stage_name": "Carrier Scope Contract",
  "dependency_layer": "DOMAIN_BASE_PRODUCT_RULE_FOUNDATION",
  "artifact_wave": 8,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-22T23:59:32.698942+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_V"
  ],
  "capabilities": [
    "CAP-CARRIER-SCOPE"
  ],
  "functional_requirements": [
    "REQ-CARRIER-SCOPE-CONTRACT"
  ],
  "boundaries": [
    "BOUND-RULE-PACK-SEPARATION"
  ],
  "adr": [
    "ADR-005",
    "ADR-008"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "SourceOfTruthRegistry",
    "DomainEventTaxonomy"
  ],
  "acceptance_criteria": [
    "Carrier Scope Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
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
    "path": "scaffolds/artifacts/SG-008/carrier-scope-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "CarrierScopeContract";
export const stageId = "SG-008";
export const sourceDigest = "e7fcbeea6ffe77d89539f7293e149596f62ec35ef24c4e8d21f01bb6edd44fcc";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:CarrierScopeContract'
    );
  }

  return true;
}
