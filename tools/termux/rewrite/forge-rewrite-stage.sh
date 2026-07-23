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
  forge_stage_dependencies_satisfied "$stage" || forge_die "stage dependencies are not satisfied: $stage"

  generator="$SCRIPT_DIR/generators/${stage}.sh"
  forge_validate_bash_runner "$generator"

  if [ "$force" -ne 1 ]; then
    blocking_stage="$(forge_current_stage_marker_blocks || true)"
    [ -z "$blocking_stage" ] || forge_die "another stage appears active: $blocking_stage; use resume or rollback"
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

  produces_count="$(
    STAGE="$stage" MANIFEST="$FORGE_ROOT/scaffolds/manifest/rewrite-stages.json" node <<'NODE'
const fs = require('fs');

const manifestPath = process.env.MANIFEST;
const stageId = process.env.STAGE;
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const stages = Array.isArray(manifest) ? manifest : manifest.stages;

const stage = stages.find(item =>
  item.id === stageId ||
  item.stage_id === stageId ||
  item.stage === stageId
);

if (!stage) process.exit(2);
process.stdout.write(String((stage.produces || []).length));
NODE
  )"

  case "$produces_count" in
    ''|*[!0-9]*)
      forge_die "invalid produces count for stage: $stage"
      ;;
  esac

  if [ "$produces_count" -gt 0 ] && [ "${#material[@]}" -eq 0 ]; then
    forge_die "ARTIFACT_MATERIALIZATION_ERROR: stage=$stage produces=$produces_count material_files=0"
  fi

  allow_existing_outputs="$(
    STAGE="$stage" MANIFEST="$FORGE_ROOT/scaffolds/manifest/rewrite-stages.json" node <<'NODE'
const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync(process.env.MANIFEST, 'utf8'));
const stage = manifest.stages.find(item => item.id === process.env.STAGE);
process.stdout.write(stage?.allow_existing_outputs === true ? '1' : '0');
NODE
  )"

  for path in "${material[@]}"; do
    if [ -e "$path" ] && [ "$allow_existing_outputs" != "1" ]; then
      forge_die "refusing to overwrite existing output: $path"
    fi
  done

  printf '%s\n' "$stage" > "$FORGE_ROOT/.forge/rewrite/current-stage"

  FORGE_ROOT="$FORGE_ROOT" FORGE_STAGE="$stage" bash "$generator" 2>&1 | tee "$out"

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

const manifest = JSON.parse(
  fs.readFileSync('scaffolds/manifest/rewrite-stages.json', 'utf8')
);
const stages = Array.isArray(manifest) ? manifest : manifest.stages;
const stageManifest = stages.find(item =>
  item.id === stage ||
  item.stage_id === stage ||
  item.stage === stage
);

if (!stageManifest) {
  throw new Error(`RECEIPT_STAGE_NOT_FOUND stage=${stage}`);
}

const produces = Array.isArray(stageManifest.produces)
  ? stageManifest.produces
  : [];

if (produces.length !== material.length) {
  throw new Error(
    `RECEIPT_MAPPING_MISMATCH stage=${stage} ` +
    `produces=${produces.length} material=${material.length}`
  );
}

const receiptRoot = '.forge/rewrite/artifact-receipts';
fs.mkdirSync(receiptRoot, {recursive: true});

for (let index = 0; index < produces.length; index += 1) {
  const artifactId = produces[index];
  const materializedPath = material[index];

  const receipt = {
    artifact_id: artifactId,
    producer_stage: stage,
    materialized_path: materializedPath,
    sha256: sha256(materializedPath),
    evidence_path: evidencePath,
    validation_status: 'PASS',
    validated_at: evidence.generated_at
  };

  const receiptPath = `${receiptRoot}/${artifactId}.json`;
  const temporaryPath =
    `${receiptPath}.tmp-${process.pid}-${index}`;

  fs.writeFileSync(
    temporaryPath,
    JSON.stringify(receipt, null, 2) + '\n'
  );
  fs.renameSync(temporaryPath, receiptPath);
}

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
