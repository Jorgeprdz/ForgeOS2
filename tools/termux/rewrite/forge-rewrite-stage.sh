#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/git.sh"
. "$SCRIPT_DIR/lib/validation.sh"
. "$SCRIPT_DIR/lib/evidence.sh"
. "$SCRIPT_DIR/lib/manifest.sh"

usage(){ cat <<'EOF'
Usage: forge-rewrite-stage.sh STAGE (--plan|--dry-run|--apply) [--force] [--copy-result] [--export-android]

Plans, simulates or applies one authorized scaffold stage. It never selects the next stage automatically.
EOF
forge_print_help_common
}

[ "${1:-}" = "--help" ] && { usage; exit 0; }
[ "$#" -ge 2 ] || { usage; exit 1; }
stage="$1"; shift
mode=""; force=0; copy=0; export_android=0
for arg in "$@"; do
  case "$arg" in
    --plan|--dry-run|--apply) [ -z "$mode" ] || forge_die "only one mode is allowed"; mode="$arg" ;;
    --force) force=1 ;;
    --copy-result) copy=1 ;;
    --export-android) export_android=1 ;;
    --help) usage; exit 0 ;;
    *) forge_die "unknown option: $arg" ;;
  esac
done
[ -n "$mode" ] || forge_die "missing mode"

forge_cd_root
forge_stage_exists "$stage" || forge_die "unknown stage: $stage"
forge_validate_all
status="$(forge_stage_status "$stage")"
out="$FORGE_ROOT/.forge/rewrite/logs/${stage}-${mode#--}.out"
forge_ensure_state_dirs

if [ "$mode" = "--plan" ]; then
  forge_print_stage_plan "$stage" | tee "$out"
elif [ "$mode" = "--dry-run" ]; then
  forge_print_stage_plan "$stage" | tee "$out"
  printf 'DRY_RUN=YES\n' | tee -a "$out"
elif [ "$mode" = "--apply" ]; then
  forge_require_branch_prefix
  forge_require_clean_tree
  [ "$status" = "READY" ] || forge_die "stage $stage is not READY: $status"
  if [ "$force" -ne 1 ] && [ -f "$FORGE_ROOT/.forge/rewrite/current-stage" ]; then
    forge_die "another stage appears active; use resume or rollback"
  fi
  printf '%s\n' "$stage" > "$FORGE_ROOT/.forge/rewrite/current-stage"
  forge_write_evidence "$stage" "PASS"
  node - "$stage" <<'NODE'
const fs = require('fs');
const stage = process.argv[2];
const statePath = '.forge/rewrite/state.json';
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {completed_stages: [], applied_files: [], validation_status: 'NONE'};
state.current_stage = stage;
state.validation_status = 'PASS';
if (!state.completed_stages.includes(stage)) state.completed_stages.push(stage);
fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
NODE
  forge_record_validation_stamp
  printf 'APPLY=PASS stage=%s generated=evidence-only\n' "$stage" | tee "$out"
fi
[ "$copy" -eq 1 ] && forge_copy_result < "$out"
[ "$export_android" -eq 1 ] && forge_export_android
exit 0
