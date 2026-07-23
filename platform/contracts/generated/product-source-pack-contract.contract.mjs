// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-007/product-source-pack-contract.artifact.json
// Artifact: ProductSourcePackContract
// Stage: SG-007
// Source SHA-256: 375e600d8e42bb8c3cda54eac30dee05c11f7a5fcc85b3a6f71a062ae2be4adb

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "ProductSourcePackContract",
  "artifact_slug": "product-source-pack-contract",
  "stage_id": "SG-007",
  "stage_name": "Product Source Pack Intake",
  "dependency_layer": "DOMAIN_BASE_PRODUCT_RULE_FOUNDATION",
  "artifact_wave": 10,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:06:13.790594+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III",
    "CONSTITUTION_ARTICLE_V"
  ],
  "capabilities": [
    "CAP-PRODUCT-SOURCE-PACK"
  ],
  "functional_requirements": [
    "REQ-PRODUCT-SOURCE-PACK-EVIDENCE"
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
    "ProductCatalogContract"
  ],
  "acceptance_criteria": [
    "Product Source Pack Intake has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
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
    "path": "scaffolds/artifacts/SG-007/product-source-pack-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "ProductSourcePackContract";
export const stageId = "SG-007";
export const sourceDigest = "375e600d8e42bb8c3cda54eac30dee05c11f7a5fcc85b3a6f71a062ae2be4adb";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:ProductSourcePackContract'
    );
  }

  return true;
}
