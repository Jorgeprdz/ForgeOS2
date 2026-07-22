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
for (const stage of stages) console.log(`${stage.id}\t${stage.status}\t${stage.name}`);
NODE
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
console.log(`PURPOSE=${stage.purpose}`);
console.log(`CAPABILITIES=${stage.capabilities.join(',')}`);
console.log(`AUTHORITY=${stage.constitutional_authority.join(',')}`);
console.log(`BOUNDARIES=${stage.boundaries.join(',')}`);
console.log(`FILES=${stage.files_to_generate.length ? stage.files_to_generate.join(',') : 'none'}`);
console.log(`OPERATIONS=${stage.allowed_operations.join(',')}`);
console.log(`PROHIBITED=${stage.prohibited_operations.join(',')}`);
console.log(`VALIDATIONS=${stage.validations.join(',')}`);
console.log(`EVIDENCE=${stage.evidence.join(',')}`);
NODE
}
