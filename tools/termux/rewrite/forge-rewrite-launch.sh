#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/git.sh"
usage(){ cat <<'EOF'
Usage: forge-rewrite-launch.sh [--help] [--execute]
Defaults to dry-run. --execute records launch readiness evidence only; it does not execute rewrite stages.
EOF
}
mode="dry-run"
case "${1:-}" in
  --help) usage; exit 0 ;;
  --execute) mode="execute" ;;
  "") ;;
  *) forge_die "unknown argument: $1" ;;
esac
forge_cd_root
forge_require_cmd git
forge_require_cmd node
forge_require_not_main
forge_require_branch_prefix
forge_require_clean_tree
node "$FORGE_ROOT/scaffolds/validation/validate-dependency-graph.mjs" >/dev/null
node "$FORGE_ROOT/scaffolds/validation/validate-final-readiness.mjs" >/dev/null
node - "$mode" <<'NODE'
const fs = require('fs');
const mode = process.argv[2];
const freeze = JSON.parse(fs.readFileSync('scaffolds/manifest/architecture-freeze.json','utf8'));
const wave = JSON.parse(fs.readFileSync('scaffolds/manifest/first-execution-wave.json','utf8'));
const roadmap = JSON.parse(fs.readFileSync('scaffolds/manifest/final-rewrite-roadmap.json','utf8'));
const decisions = fs.existsSync('scaffolds/manifest/canonical-owner-decisions.json')
  ? JSON.parse(fs.readFileSync('scaffolds/manifest/canonical-owner-decisions.json','utf8'))
  : JSON.parse(fs.readFileSync('scaffolds/manifest/owner-decision-packet.json','utf8'));
const go = JSON.parse(fs.readFileSync('scaffolds/reports/rewrite-go-no-go.json','utf8'));
const graph = JSON.parse(fs.readFileSync('scaffolds/manifest/dependency-graph.json','utf8'));
const registry = JSON.parse(fs.readFileSync('scaffolds/manifest/forge-module-registry.json','utf8')).modules;
function fail(message){ console.error(`FORGE_REWRITE_LAUNCH_REFUSED ${message}`); process.exit(1); }
if (freeze.freeze_state !== 'FROZEN') fail(`architecture_not_frozen state=${freeze.freeze_state}`);
if (!wave.first_execution_wave_ready) fail('first_execution_wave_not_ready');
if (!registry.some(module => module.id === 'MOD-LEGACY-REINTRODUCTION-GUARD')) fail('legacy_guard_not_active');
if (graph.rejected_modules.some(id => graph.active_topological_order.includes(id))) fail('rejected_module_in_active_execution');
if (graph.deferred_modules.some(id => graph.active_topological_order.includes(id))) fail('deferred_module_in_active_execution');
for (const module of wave.modules) {
  if (!module.dependencies_satisfied || !module.contracts_satisfied || !module.decisions_satisfied || !module.evidence_satisfied) fail(`selected_module_not_ready module=${module.module_id}`);
}
console.log(`FORGE_REWRITE_LAUNCH_MODE=${mode}`);
console.log(`FINAL_DECISION=${go.final_decision}`);
console.log(`BRANCH=${freeze.source_branch}`);
console.log(`SOURCE_COMMIT=${freeze.source_commit}`);
console.log(`ARCHITECTURE_FREEZE_ID=${freeze.freeze_id}`);
console.log(`ARCHITECTURE_FREEZE_STATE=${freeze.freeze_state}`);
console.log(`ELIGIBLE_SCAFFOLD_MODULES=${roadmap.eligible_now.SCAFFOLD.join(',')}`);
console.log(`FIRST_EXECUTION_WAVE=${wave.modules.map(module => module.module_id).join(',')}`);
console.log(`BLOCKED_MODULES=${[...roadmap.waiting_for_decision, ...roadmap.waiting_for_evidence, ...roadmap.waiting_for_dependencies].join(',')}`);
console.log(`REQUIRED_DECISIONS=${decisions.decisions.length}`);
console.log(`REQUIRED_EVIDENCE=${roadmap.waiting_for_evidence.join(',') || 'none'}`);
console.log('REQUIRED_VALIDATIONS=npm test,npm run lint,npm run scaffold:validate,git diff --check');
console.log(`EXPECTED_COMMITS=${wave.modules.length}`);
console.log(`ROLLBACK_CHECKPOINTS=${wave.modules.map(module => module.rollback_checkpoint).join(',')}`);
if (mode === 'execute') {
  fs.mkdirSync('.forge/rewrite/evidence', { recursive: true });
  fs.writeFileSync('.forge/rewrite/evidence/launch-readiness.json', JSON.stringify({ recorded_at: new Date().toISOString(), source_commit: freeze.source_commit, first_wave: wave.modules.map(module => module.module_id), functional_rewrite_executed: false }, null, 2));
  console.log('FORGE_REWRITE_LAUNCH_EVIDENCE=RECORDED');
} else {
  console.log('FORGE_REWRITE_LAUNCH_DRY_RUN=PASS');
}
NODE
