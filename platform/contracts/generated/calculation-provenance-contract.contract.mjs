// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-011/calculation-provenance-contract.artifact.json
// Artifact: CalculationProvenanceContract
// Stage: SG-011
// Source SHA-256: c250b84df4a52362da0f644cda06de6c4e105e4919bdd87f81b4c832d508109d

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "CalculationProvenanceContract",
  "artifact_slug": "calculation-provenance-contract",
  "stage_id": "SG-011",
  "stage_name": "Calculation Contract",
  "dependency_layer": "DOMAIN_BASE_PRODUCT_RULE_FOUNDATION",
  "artifact_wave": 10,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-23T00:05:22.898396+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III"
  ],
  "capabilities": [
    "CAP-CALCULATION-CONTRACT"
  ],
  "functional_requirements": [
    "REQ-CALCULATION-CONTRACT"
  ],
  "boundaries": [
    "BOUND-ECONOMIC-EVIDENCE",
    "BOUND-FORECAST-NOT-FACT",
    "BOUND-RULE-PACK-SEPARATION"
  ],
  "adr": [
    "ADR-008",
    "ADR-017"
  ],
  "contracts": [
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "RulePackContract",
    "RuleSnapshotContract",
    "SourceOfTruthRegistry",
    "ProvenanceModel",
    "EventReceiptContract"
  ],
  "acceptance_criteria": [
    "Calculation Contract has explicit upstream dependencies, outputs, acceptance criteria and no consumer depends on a future stage."
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
    "path": "scaffolds/artifacts/SG-011/calculation-provenance-contract.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "CalculationProvenanceContract";
export const stageId = "SG-011";
export const sourceDigest = "c250b84df4a52362da0f644cda06de6c4e105e4919bdd87f81b4c832d508109d";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:CalculationProvenanceContract'
    );
  }

  return true;
}
