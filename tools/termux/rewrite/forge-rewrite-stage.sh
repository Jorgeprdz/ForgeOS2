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

  generator="$SCRIPT_DIR/generators/${stage}.sh"
  [ -f "$generator" ] || forge_die "missing stage generator: $generator"
  bash -n "$generator"

  if [ "$force" -ne 1 ] && [ -f "$FORGE_ROOT/.forge/rewrite/current-stage" ]; then
    forge_die "another stage appears active; use resume or rollback"
  fi

  mapfile -t outputs < <(node - "$stage" <<'NODE'
const fs = require('fs');
const stageId = process.argv[2];
const manifest = JSON.parse(fs.readFileSync('scaffolds/manifest/rewrite-stages.json', 'utf8'));
function find(v){
  if(Array.isArray(v)){ for(const x of v){ const r=find(x); if(r) return r; } }
  else if(v && typeof v === 'object'){
    if(v.id===stageId || v.stage===stageId || v.stage_id===stageId) return v;
    for(const x of Object.values(v)){ const r=find(x); if(r) return r; }
  }
  return null;
}
const stage=find(manifest);
if(!stage) process.exit(2);
for(const p of stage.files_to_generate || []) console.log(p);
NODE
  )

  [ "${#outputs[@]}" -gt 0 ] || forge_die "stage declares no files_to_generate"

  material=()
  evidence=""
  for path in "${outputs[@]}"; do
    case "$path" in
      scaffolds/reports/*-evidence.json) evidence="$path" ;;
      *) material+=("$path") ;;
    esac
  done

  [ -n "$evidence" ] || forge_die "stage declares no evidence output"

  for path in "${material[@]}"; do
    [ ! -e "$path" ] || forge_die "refusing to overwrite existing output: $path"
  done

  printf '%s\n' "$stage" > "$FORGE_ROOT/.forge/rewrite/current-stage"

  FORGE_ROOT="$FORGE_ROOT" FORGE_STAGE="$stage" "$generator" 2>&1 | tee "$out"

  for path in "${material[@]}"; do
    [ -f "$path" ] || forge_die "missing generated output: $path"
  done

  forge_write_evidence "$stage" "PASS"

  STAGE="$stage" EVIDENCE="$evidence" OUTPUTS="$(printf '%s\n' "${outputs[@]}")" MATERIAL="$(printf '%s\n' "${material[@]}")" node <<'NODE'
const crypto = require('crypto');
const fs = require('fs');
const stage = process.env.STAGE;
const evidencePath = process.env.EVIDENCE;
const outputs = process.env.OUTPUTS.split('\n').filter(Boolean);
const material = process.env.MATERIAL.split('\n').filter(Boolean);
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
evidence.outputs = outputs;
evidence.hashes = Object.fromEntries(material.map(p => [p, sha256(p)]));
evidence.status = 'PASS';
fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + '\n');
const statePath = '.forge/rewrite/state.json';
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {completed_stages: [], applied_files: [], validation_status: 'NONE'};
state.current_stage = stage;
state.validation_status = 'PASS';
state.applied_files = material;
if (!state.completed_stages.includes(stage)) state.completed_stages.push(stage);
fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
NODE

  forge_validate_all
  forge_record_validation_stamp
  rm -f "$FORGE_ROOT/.forge/rewrite/current-stage"
  printf 'APPLY=PASS stage=%s generated=%s\n' "$stage" "${#material[@]}" | tee -a "$out"
fi
[ "$copy" -eq 1 ] && forge_copy_result < "$out"
[ "$export_android" -eq 1 ] && forge_export_android
exit 0
