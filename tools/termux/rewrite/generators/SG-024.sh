#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

: "${FORGE_ROOT:?FORGE_ROOT is required}"
: "${FORGE_STAGE:?FORGE_STAGE is required}"

[ "$FORGE_STAGE" = "SG-024" ] || {
  printf 'GENERATOR_STAGE_MISMATCH expected=SG-024 actual=%s\n' "$FORGE_STAGE" >&2
  exit 1
}

output_dir="$FORGE_ROOT/docs/architecture/contracts/sg-024"
mkdir -p "$output_dir" "$FORGE_ROOT/scaffolds/reports"

cat > "$output_dir/human-authority.contract.json" <<'JSON'
{
  "artifact_id": "HumanAuthorityContract",
  "stage_id": "SG-024",
  "version": "1.0.0",
  "status": "ACTIVE",
  "purpose": "Reserve decisions with human consequence, authority or accountability to an identified human actor.",
  "rules": [
    {
      "id": "HA-001",
      "requirement": "A human authority must be identified before an action with human consequence may proceed."
    },
    {
      "id": "HA-002",
      "requirement": "Automated systems may recommend, prepare or validate but may not impersonate human authority."
    },
    {
      "id": "HA-003",
      "requirement": "Absence of identified authority produces a blocked state, never implicit approval."
    }
  ],
  "constitutional_authority": [
    "CONSTITUTION_ARTICLE_0",
    "CONSTITUTION_ARTICLE_IV",
    "CONSTITUTION_ARTICLE_VI"
  ],
  "fail_closed": true
}
JSON

cat > "$output_dir/approval.contract.json" <<'JSON'
{
  "artifact_id": "ApprovalContract",
  "stage_id": "SG-024",
  "version": "1.0.0",
  "status": "ACTIVE",
  "purpose": "Define explicit, attributable and artifact-bound human approval.",
  "approval_requirements": {
    "approver_identity_required": true,
    "approval_scope_required": true,
    "artifact_hash_required": true,
    "timestamp_required": true,
    "expiry_or_revocation_supported": true,
    "implicit_approval_prohibited": true
  },
  "valid_states": [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "REVOKED",
    "EXPIRED"
  ],
  "default_state": "PENDING",
  "fail_closed": true
}
JSON

cat > "$output_dir/allowed-action.contract.json" <<'JSON'
{
  "artifact_id": "AllowedActionContract",
  "stage_id": "SG-024",
  "version": "1.0.0",
  "status": "ACTIVE",
  "purpose": "Separate recommendation and preparation from execution.",
  "allowed_without_execution_authority": [
    "READ",
    "ANALYZE",
    "RECOMMEND",
    "DRAFT",
    "PREVIEW",
    "VALIDATE",
    "REQUEST_APPROVAL"
  ],
  "requires_explicit_human_approval": [
    "SEND",
    "PUBLISH",
    "COMMIT_EXTERNAL_EFFECT",
    "CHANGE_LIFECYCLE_STATE",
    "APPLY_HUMAN_CONSEQUENCE"
  ],
  "prohibited_autonomous_actions": [
    "IMPERSONATE_HUMAN",
    "ASSUME_APPROVAL",
    "BYPASS_ROBOCOP_GATE",
    "EXECUTE_WITHOUT_AUTHORITY"
  ],
  "fail_closed": true
}
JSON

cat > "$output_dir/human-review-boundary.contract.json" <<'JSON'
{
  "artifact_id": "HumanReviewBoundary",
  "stage_id": "SG-024",
  "version": "1.0.0",
  "status": "ACTIVE",
  "purpose": "Require review of the exact artifact that will produce an external or human consequence.",
  "review_requirements": {
    "exact_artifact_required": true,
    "artifact_hash_required": true,
    "material_changes_invalidate_prior_review": true,
    "reviewer_identity_required": true,
    "decision_receipt_required": true
  },
  "review_outcomes": [
    "APPROVE",
    "REJECT",
    "REQUEST_CHANGES"
  ],
  "default_outcome": "REQUEST_CHANGES",
  "fail_closed": true
}
JSON

printf 'GENERATOR=PASS stage=SG-024 generated=4\n'
