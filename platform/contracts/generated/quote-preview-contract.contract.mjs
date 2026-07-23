// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-012/quote-preview-contract.artifact.json
// Artifact: QuotePreviewContract
// Stage: SG-012
// Source SHA-256: 9285ec42494431066efa8d0a87b9e7b392a59b73ceb84cae22fd4d25696211c4

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "QuotePreviewContract",
  "artifact_slug": "quote-preview-contract",
  "stage_id": "SG-012",
  "stage_name": "Quote Preview Contract",
  "dependency_layer": "DOMAIN_CONSUMER_QUOTE",
  "artifact_wave": 11,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:16:10.746872+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III",
    "CONSTITUTION_ARTICLE_V"
  ],
  "capabilities": [
    "CAP-QUOTE-PREVIEW"
  ],
  "functional_requirements": [
    "REQ-QUOTE-PREVIEW-NON-BINDING"
  ],
  "boundaries": [
    "BOUND-PRODUCT-TRUTH",
    "BOUND-FORECAST-NOT-FACT",
    "BOUND-ACTION-NO-EXECUTION"
  ],
  "adr": [
    "ADR-005",
    "ADR-008",
    "ADR-017"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "ProductCatalogContract",
    "ProductSourcePackContract",
    "EligibilityContract",
    "CalculationContract"
  ],
  "acceptance_criteria": [
    "Quote Preview Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
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
    "path": "scaffolds/artifacts/SG-012/quote-preview-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "QuotePreviewContract";
export const stageId = "SG-012";
export const sourceDigest = "9285ec42494431066efa8d0a87b9e7b392a59b73ceb84cae22fd4d25696211c4";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:QuotePreviewContract'
    );
  }

  return true;
}
