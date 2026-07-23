// AUTO-GENERATED. DO NOT EDIT.
// Source: scaffolds/artifacts/SG-026/domain-event-taxonomy.artifact.json
// Artifact: DomainEventTaxonomy
// Stage: SG-026
// Source SHA-256: ec386cdae175bb70a61c734f7e90db7906d7f797639b333c31b89d48209f7f0a

const contract = Object.freeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "DomainEventTaxonomy",
  "artifact_slug": "domain-event-taxonomy",
  "stage_id": "SG-026",
  "stage_name": "Domain Event And Receipt Contracts",
  "dependency_layer": "DOMAIN_EVENT_AND_RECEIPT_CONTRACTS",
  "artifact_wave": 7,
  "version": "1.0.0",
  "status": "ACTIVE",
  "generated_by": "forge-rewrite-materializer",
  "generated_at": "2026-07-22T23:58:05.104864+00:00",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III",
    "CONSTITUTION_ARTICLE_IV",
    "CONSTITUTION_ARTICLE_V"
  ],
  "capabilities": [
    "CAP-TRUTH-EVIDENCE",
    "CAP-ACTION-PLANNING"
  ],
  "functional_requirements": [
    "REQ-TRUTH-OWNER-VALIDATION",
    "REQ-ACTION-RECOMMENDATION-NOT-EXECUTION"
  ],
  "boundaries": [
    "BOUND-EVIDENCE-OWNERSHIP",
    "BOUND-ACTION-NO-EXECUTION",
    "BOUND-HUMAN-AUTHORITY"
  ],
  "adr": [
    "ADR-003",
    "ADR-020"
  ],
  "contracts": [
    "scaffolds/contracts/evidence-contract.schema.json",
    "scaffolds/contracts/stage-contract.schema.json"
  ],
  "consumes": [
    "OwnershipRegistry",
    "SourceOfTruthRegistry",
    "HumanAuthorityContract",
    "LifecycleFramework"
  ],
  "acceptance_criteria": [
    "Domain event names, receipt requirements and rollback checkpoints exist before domains publish or consume events."
  ],
  "allowed_operations": [
    "plan",
    "record blocked evidence",
    "dry-run",
    "validate"
  ],
  "prohibited_operations": [
    "emit runtime events",
    "write production data"
  ],
  "fail_closed": true,
  "materialization": {
    "path": "scaffolds/artifacts/SG-026/domain-event-taxonomy.artifact.json",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest",
    "manual_execution_authority": false
  }
});

export const artifactId = "DomainEventTaxonomy";
export const stageId = "SG-026";
export const sourceDigest = "ec386cdae175bb70a61c734f7e90db7906d7f797639b333c31b89d48209f7f0a";
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
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:DomainEventTaxonomy'
    );
  }

  return true;
}
