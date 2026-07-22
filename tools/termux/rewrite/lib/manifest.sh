forge_stage_exists() {
  node - "$1" <<'NODE'
const fs = require('fs');
const stageId = process.argv[2];
const stages = JSON.parse(fs.readFileSync('scaffolds/manifest/rewrite-stages.json', 'utf8')).stages;
process.exit(stages.some(stage => stage.id === stageId) ? 0 : 1);
NODE
}

forge_stage_status() {
  node - "$1" <<'NODE'
const fs = require('fs');
const stageId = process.argv[2];
const stage = JSON.parse(fs.readFileSync('scaffolds/manifest/rewrite-stages.json', 'utf8')).stages.find(item => item.id === stageId);
if (!stage) process.exit(1);
console.log(stage.status);
NODE
}

forge_list_stages() {
  node - <<'NODE'
const fs = require('fs');
const stages = JSON.parse(fs.readFileSync('scaffolds/manifest/rewrite-stages.json', 'utf8')).stages;
for (const stage of [...stages].sort((a, b) => (a.canonical_order || 999) - (b.canonical_order || 999) || a.id.localeCompare(b.id))) {
  console.log(`${stage.id}\torder=${stage.canonical_order || 'NA'}\t${stage.status}\t${stage.name}`);
}
NODE
}

forge_stage_completed() {
  node - "$1" <<'NODE'
const fs = require('fs');
const stageId = process.argv[2];
const statePath = '.forge/rewrite/state.json';
if (!fs.existsSync(statePath)) process.exit(1);
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
process.exit(Array.isArray(state.completed_stages) && state.completed_stages.includes(stageId) && state.validation_status === 'PASS' ? 0 : 1);
NODE
}

forge_stage_dependencies_satisfied() {
  node - "$1" <<'NODE'
const fs = require('fs');
const stageId = process.argv[2];
const sequence = JSON.parse(fs.readFileSync('scaffolds/manifest/canonical-rewrite-sequence.json', 'utf8')).sequence;
const graph = JSON.parse(fs.readFileSync('scaffolds/manifest/rewrite-artifact-graph.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('scaffolds/manifest/rewrite-stages.json', 'utf8'));
const stage = sequence.find(item => item.stage_id === stageId);
if (!stage) {
  console.error(`STAGE_SEQUENCE_NOT_FOUND:${stageId}`);
  process.exit(2);
}
const statePath = '.forge/rewrite/state.json';
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {};
const completed = new Set(Array.isArray(state.completed_stages) ? state.completed_stages : []);
const stages = new Map(manifest.stages.map(item => [item.id, item]));
const historicalCompatibilityPass = dep => (graph.historical_compatibility || []).some(item => item.stage_id === dep && item.status === 'PASS');
const materialPaths = dep => (stages.get(dep)?.files_to_generate || []).filter(file => !/^scaffolds\/reports\/.+-evidence\.json$/.test(file));
const stageSatisfied = dep => {
  if (!completed.has(dep) || state.validation_status !== 'PASS') return false;
  if (historicalCompatibilityPass(dep)) return true;
  if (!fs.existsSync(`scaffolds/reports/${dep}-evidence.json`)) return false;
  return materialPaths(dep).every(file => fs.existsSync(file));
};
const artifactProducer = new Map(graph.artifacts.map(artifact => [artifact.artifact, artifact.producer_stage]));
const missing = [];
for (const artifact of stage.consumes) {
  const producer = artifactProducer.get(artifact);
  if (!producer) {
    missing.push(`${artifact}:NO_PRODUCER`);
  } else if (!stageSatisfied(producer)) {
    missing.push(`${artifact}:producer=${producer}`);
  }
}
if (missing.length > 0) {
  console.error(`STAGE_ARTIFACTS_NOT_SATISFIED:${stageId}:${missing.join(',')}`);
  process.exit(1);
}
process.exit(0);
NODE
}

forge_current_stage_marker_blocks() {
  local marker="$FORGE_ROOT/.forge/rewrite/current-stage"
  [ -f "$marker" ] || return 1
  local active
  active="$(sed -n '1p' "$marker")"
  [ -n "$active" ] || return 1
  if forge_stage_completed "$active"; then
    return 1
  fi
  printf '%s\n' "$active"
  return 0
}

forge_print_stage_plan() {
  node - "$1" <<'NODE'
const fs = require('fs');
const stageId = process.argv[2];
const stage = JSON.parse(fs.readFileSync('scaffolds/manifest/rewrite-stages.json', 'utf8')).stages.find(item => item.id === stageId);
if (!stage) {
  console.error(`Unknown stage ${stageId}`);
  process.exit(1);
}
console.log(`STAGE=${stage.id}`);
console.log(`STATUS=${stage.status}`);
console.log(`NAME=${stage.name}`);
console.log(`CANONICAL_ORDER=${stage.canonical_order ?? 'NA'}`);
console.log(`DEPENDENCY_LAYER=${stage.dependency_layer ?? 'NA'}`);
console.log(`PURPOSE=${stage.purpose}`);
console.log(`CAPABILITIES=${stage.capabilities.join(',')}`);
console.log(`AUTHORITY=${stage.constitutional_authority.join(',')}`);
console.log(`BOUNDARIES=${stage.boundaries.join(',')}`);
console.log(`DERIVED_DEPENDS_ON_STAGES=${(stage.derived_depends_on_stages || []).join(',') || 'none'}`);
console.log(`PRODUCES=${(stage.produces || []).join(',') || 'none'}`);
console.log(`CONSUMES=${(stage.consumes || []).join(',') || 'none'}`);
console.log(`OWNER_DECISIONS=${(stage.owner_decisions || []).map(item => `${item.id}:${item.status}`).join(',') || 'none'}`);
console.log(`FILES=${stage.files_to_generate.length ? stage.files_to_generate.join(',') : 'none'}`);
console.log(`OPERATIONS=${stage.allowed_operations.join(',')}`);
console.log(`PROHIBITED=${stage.prohibited_operations.join(',')}`);
console.log(`VALIDATIONS=${stage.validations.join(',')}`);
console.log(`EVIDENCE=${stage.evidence.join(',')}`);
NODE
}
