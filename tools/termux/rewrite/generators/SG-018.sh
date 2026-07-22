#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

: "${FORGE_ROOT:?FORGE_ROOT is required}"
: "${FORGE_STAGE:?FORGE_STAGE is required}"

[ "$FORGE_STAGE" = "SG-018" ] || {
  printf 'GENERATOR_STAGE_MISMATCH expected=SG-018 actual=%s\n' "$FORGE_STAGE" >&2
  exit 1
}

policy_dir="$FORGE_ROOT/scaffolds/policies"
report_dir="$FORGE_ROOT/scaffolds/reports"

mkdir -p "$policy_dir" "$report_dir"

cat > "$policy_dir/legacy-reintroduction-denylist.json" <<'JSON'
{
  "artifact_id": "LegacyReintroductionDenylist",
  "stage_id": "SG-018",
  "version": "1.0.0",
  "status": "ACTIVE",
  "purpose": "Prevent historical Forge OS implementation files, runtime entrypoints and copied legacy code from entering the Forge OS 2 rewrite.",
  "denied_paths": [
    "legacy/",
    "temporary-governance-rewrite-pack/",
    "app.js",
    "index.html"
  ],
  "denied_path_patterns": [
    "**/legacy/**",
    "**/temporary-governance-rewrite-pack/**",
    "**/app.js",
    "**/index.html"
  ],
  "denied_behaviors": [
    "COPY_LEGACY_IMPLEMENTATION",
    "RESTORE_REMOVED_RUNTIME_ENTRYPOINT",
    "IMPORT_FROM_PROHIBITED_PATH",
    "REINTRODUCE_DEPRECATED_MODULE",
    "USE_HISTORICAL_CODE_AS_NEW_IMPLEMENTATION"
  ],
  "historical_evidence_policy": {
    "reading_allowed": true,
    "analysis_allowed": true,
    "copying_implementation_prohibited": true,
    "runtime_dependency_prohibited": true
  },
  "fail_closed": true
}
JSON

cat > "$policy_dir/legacy-absence-validation-policy.json" <<'JSON'
{
  "artifact_id": "LegacyAbsenceValidationPolicy",
  "stage_id": "SG-018",
  "version": "1.0.0",
  "status": "ACTIVE",
  "purpose": "Define deterministic checks proving that prohibited legacy material remains absent from generated and maintained Forge OS 2 surfaces.",
  "validation_scope": [
    "tracked_files",
    "generated_files",
    "runtime_entrypoints",
    "imports_and_references"
  ],
  "required_checks": [
    {
      "id": "LAV-001",
      "type": "PATH_ABSENCE",
      "source": "LegacyReintroductionDenylist.denied_paths"
    },
    {
      "id": "LAV-002",
      "type": "PATTERN_ABSENCE",
      "source": "LegacyReintroductionDenylist.denied_path_patterns"
    },
    {
      "id": "LAV-003",
      "type": "REFERENCE_ABSENCE",
      "requirement": "Generated runtime files must not import or reference prohibited legacy paths."
    },
    {
      "id": "LAV-004",
      "type": "FAIL_CLOSED",
      "requirement": "Unreadable paths, incomplete scans or ambiguous matches must fail validation."
    }
  ],
  "allowed_outcomes": [
    "PASS",
    "FAIL"
  ],
  "default_outcome": "FAIL",
  "evidence_requirements": {
    "stage_id_required": true,
    "checked_paths_required": true,
    "validation_timestamp_required": true,
    "result_required": true,
    "hashes_required_for_generated_artifacts": true
  },
  "fail_closed": true
}
JSON

printf 'GENERATOR=PASS stage=SG-018 generated=2\n'
