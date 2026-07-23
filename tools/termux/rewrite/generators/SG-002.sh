#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

: "${FORGE_ROOT:?FORGE_ROOT is required}"
: "${FORGE_STAGE:?FORGE_STAGE is required}"

[ "$FORGE_STAGE" = "SG-002" ] || {
  printf 'GENERATOR_STAGE_MISMATCH expected=SG-002 actual=%s\n' \
    "$FORGE_STAGE" >&2
  exit 1
}

mkdir -p \
  "$FORGE_ROOT/platform/core/generated" \
  "$FORGE_ROOT/platform/actions/generated" \
  "$FORGE_ROOT/platform/read-models/generated" \
  "$FORGE_ROOT/scaffolds/artifacts/SG-002"

write_stub() {
  local target="$1"
  local export_name="$2"

  [ ! -e "$target" ] || {
    printf 'PRESERVED_EXISTING_FILE=%s\n' \
      "${target#"$FORGE_ROOT/"}"
    return 0
  }

  cat > "$target" <<EOF
export function ${export_name}() {
  const error = new Error('FORGE_SCAFFOLD_NOT_IMPLEMENTED');
  error.code = 'FORGE_SCAFFOLD_NOT_IMPLEMENTED';
  throw error;
}
EOF
}

write_artifact() {
  local target="$1"
  local artifact_id="$2"
  local artifact_slug="$3"
  local purpose="$4"

  [ ! -e "$target" ] || {
    printf 'PRESERVED_EXISTING_FILE=%s\n' \
      "${target#"$FORGE_ROOT/"}"
    return 0
  }

  cat > "$target" <<EOF
{
  "\$schema": "https://json-schema.org/draft/2020-12/schema",
  "artifact_id": "${artifact_id}",
  "artifact_slug": "${artifact_slug}",
  "stage_id": "SG-002",
  "stage_name": "Evidence, Claim, Provenance And Core Contract Skeletons",
  "dependency_layer": "EVIDENCE_CLAIM_PROVENANCE_AND_CORE_CONTRACTS",
  "artifact_wave": 2,
  "version": "1.0.0",
  "status": "NOT_IMPLEMENTED",
  "generated_by": "forge-rewrite-materializer",
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_III",
    "CONSTITUTION_ARTICLE_IV",
    "CONSTITUTION_ARTICLE_V"
  ],
  "capabilities": [
    "CAP-DECISION-CORE",
    "CAP-ACTION-PLANNING",
    "CAP-READ-ONLY-ADAPTERS",
    "CAP-TRUTH-EVIDENCE"
  ],
  "functional_requirements": [
    "REQ-DECISION-EVIDENCE-ACTION",
    "REQ-ACTION-RECOMMENDATION-NOT-EXECUTION",
    "REQ-READ-ONLY-NO-WRITES",
    "REQ-TRUTH-OWNER-VALIDATION"
  ],
  "boundaries": [
    "BOUND-EVIDENCE-OWNERSHIP",
    "BOUND-ACTION-NO-EXECUTION",
    "BOUND-READ-ONLY",
    "BOUND-ONE-METRIC-ONE-OWNER",
    "BOUND-UNKNOWN-REMAINS-UNKNOWN"
  ],
  "consumes": [
    "ConstitutionalRuntimeConstraints",
    "RobocopGateContract",
    "BlockedStatePolicy"
  ],
  "purpose": "${purpose}",
  "implementation_behavior": "FORGE_SCAFFOLD_NOT_IMPLEMENTED",
  "fail_closed": true,
  "manual_execution_authority": false,
  "materialization": {
    "path": "${target#"$FORGE_ROOT/"}",
    "source_manifest": "scaffolds/manifest/rewrite-stages.json",
    "semantic_authority": "stage manifest"
  }
}
EOF
}

write_stub \
  "$FORGE_ROOT/platform/core/generated/decision-contract.mjs" \
  "forgeDecisionContract"

write_stub \
  "$FORGE_ROOT/platform/actions/generated/action-contract.mjs" \
  "forgeActionContract"

write_stub \
  "$FORGE_ROOT/platform/read-models/generated/read-only-adapter-contract.mjs" \
  "forgeReadOnlyAdapterContract"

write_artifact \
  "$FORGE_ROOT/scaffolds/artifacts/SG-002/evidence-envelope.artifact.json" \
  "EvidenceEnvelope" \
  "evidence-envelope" \
  "Defines the fail-closed envelope required to carry evidence without inventing or silently ratifying truth."

write_artifact \
  "$FORGE_ROOT/scaffolds/artifacts/SG-002/claim-contract.artifact.json" \
  "ClaimContract" \
  "claim-contract" \
  "Defines the minimum declarative contract for claims, ownership and validation state."

write_artifact \
  "$FORGE_ROOT/scaffolds/artifacts/SG-002/provenance-model.artifact.json" \
  "ProvenanceModel" \
  "provenance-model" \
  "Defines the declarative provenance boundary for source attribution and traceability."

write_artifact \
  "$FORGE_ROOT/scaffolds/artifacts/SG-002/unknown-state-policy.artifact.json" \
  "UnknownStatePolicy" \
  "unknown-state-policy" \
  "Requires unknown states to remain explicitly unknown until supported by owned evidence."

printf 'GENERATOR=PASS stage=SG-002 generated_or_preserved=7\n'
