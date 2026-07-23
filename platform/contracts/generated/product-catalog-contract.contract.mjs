// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-006/product-catalog-contract.artifact.json
// Artifact: ProductCatalogContract
// Stage: SG-006
// Source SHA-256: 0618066793629a369919c2bea10b5ade15f87ff65a74bf41174f023b90d078e7

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "ProductCatalogContract",
  "artifact_slug": "product-catalog-contract",
  "stage_id": "SG-006",
  "stage_name": "Product Catalog Contract",
  "dependency_layer": "DOMAIN_BASE_PRODUCT_RULE_FOUNDATION",
  "artifact_wave": 9,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:02:50.399639+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III",
    "CONSTITUTION_ARTICLE_V"
  ],
  "capabilities": [
    "CAP-PRODUCT-CATALOG"
  ],
  "functional_requirements": [
    "REQ-PRODUCT-CATALOG-CONTRACT"
  ],
  "boundaries": [
    "BOUND-PRODUCT-TRUTH",
    "BOUND-UNKNOWN-REMAINS-UNKNOWN"
  ],
  "adr": [
    "ADR-005"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "CarrierScopeContract",
    "SourceOfTruthRegistry",
    "ContextEnvelope"
  ],
  "acceptance_criteria": [
    "Product Catalog Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
  ],
  "allowed_operations": [
    "plan",
    "dry-run",
    "apply contract evidence",
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
    "path": "scaffolds/artifacts/SG-006/product-catalog-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "ProductCatalogContract";
export const stageId = "SG-006";
export const sourceDigest = "0618066793629a369919c2bea10b5ade15f87ff65a74bf41174f023b90d078e7";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:ProductCatalogContract'
    );
  }

  return true;
}
