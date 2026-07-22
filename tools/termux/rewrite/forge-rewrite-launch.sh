#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/git.sh"

usage() {
  cat <<'EOF'
Usage:
  bash tools/termux/rewrite/forge-rewrite-launch.sh <command> [argument]

Commands:
  validate   Validate manifests, DAG, sequence, compatibility and readiness.
  graph      Show artifact graph summary and edges.
  waves      Show topological execution waves.
  next       Select exactly one next stage deterministically.
  explain    Explain global selection, a stage ID, or an artifact ID.
  pending    Show pending artifacts, stages, decisions and compatibility debt.
  blocked    Group blockers by cause.
  completed  Show materialized outputs only.
  status     Show operational state summary.
  resume     Explain safe resume point without mutating state.
  restart    Explain scoped restart policy without mutating state.
  dry-run    Simulate the next unit.
  run        Execute only the next valid stage. Refuses dirty worktree.

Compatibility aliases:
  --validate --graph --waves --next --explain --pending --blocked --completed
  --status --resume --restart --dry-run --execute

State root:
  FORGE_REWRITE_STATE_ROOT may point to a temporary state root for tests.
EOF
}

command_name="${1:-dry-run}"
argument="${2:-}"
case "$command_name" in
  --help|-h|help) usage; exit 0 ;;
  --validate) command_name="validate" ;;
  --graph) command_name="graph" ;;
  --waves) command_name="waves" ;;
  --next) command_name="next" ;;
  --explain) command_name="explain" ;;
  --pending) command_name="pending" ;;
  --blocked) command_name="blocked" ;;
  --completed) command_name="completed" ;;
  --status) command_name="status" ;;
  --resume) command_name="resume" ;;
  --restart) command_name="restart" ;;
  --dry-run) command_name="dry-run" ;;
  --execute) command_name="run" ;;
esac

case "$command_name" in
  validate|graph|waves|next|explain|pending|blocked|completed|status|resume|restart|dry-run|run) ;;
  *) forge_die "UNSUPPORTED_COMMAND:$command_name" ;;
esac

forge_cd_root
forge_require_cmd git
forge_require_cmd node
forge_require_cmd bash
forge_require_not_main
forge_require_branch_prefix

if [ "$command_name" = "run" ]; then
  forge_require_clean_tree
elif [ "${FORGE_REWRITE_ALLOW_DIRTY_FOR_TESTS:-0}" = "1" ]; then
  printf 'FORGE_REWRITE_WARNING DIRTY_REPOSITORY_OVERRIDE_FOR_TESTS=1\n'
fi

node "$FORGE_ROOT/scaffolds/validation/validate-rewrite-artifact-graph.mjs" >/dev/null
node "$FORGE_ROOT/scaffolds/validation/validate-rewrite-sequence.mjs" >/dev/null

report="$(FORGE_REWRITE_STATE_ROOT="${FORGE_REWRITE_STATE_ROOT:-.forge/rewrite}" node - "$command_name" "$argument" <<'NODE'
const fs = require('fs');
const path = require('path');
const command = process.argv[2];
const argument = process.argv[3] || '';
const stateRoot = process.env.FORGE_REWRITE_STATE_ROOT || '.forge/rewrite';
const root = process.cwd();
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const exists = file => fs.existsSync(path.join(root, file));
const resolvedStateRoot = path.isAbsolute(stateRoot) ? stateRoot : path.join(root, stateRoot);
const graph = readJson('scaffolds/manifest/rewrite-artifact-graph.json');
const sequence = readJson('scaffolds/manifest/canonical-rewrite-sequence.json').sequence;
const stages = readJson('scaffolds/manifest/rewrite-stages.json').stages;
const go = readJson('scaffolds/reports/rewrite-go-no-go.json');
const freeze = readJson('scaffolds/manifest/architecture-freeze.json');
const decisions = readJson('scaffolds/manifest/canonical-owner-decisions.json');
const stageById = new Map(sequence.map(stage => [stage.stage_id, stage]));
const manifestStageById = new Map(stages.map(stage => [stage.id, stage]));
const artifactById = new Map(graph.artifacts.map(artifact => [artifact.artifact_id, artifact]));
const producerByArtifact = new Map(graph.artifacts.map(artifact => [artifact.artifact_id, artifact.producer_stage]));
const statePath = path.join(resolvedStateRoot, 'state.json');
let state = {};
try {
  if (fs.existsSync(statePath)) state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
} catch {
  state = { corrupt: true };
}
const completedStages = new Set(Array.isArray(state.completed_stages) ? state.completed_stages : []);

function stageEvidencePath(stageId) {
  return `scaffolds/reports/${stageId}-evidence.json`;
}

function historicalCompatibilityPass(stageId) {
  return graph.historical_compatibility.some(item => item.stage_id === stageId && item.status === 'PASS');
}

function declaredMaterialPaths(stageId) {
  const stage = manifestStageById.get(stageId);
  return (stage?.files_to_generate || []).filter(file => !/^scaffolds\/reports\/.+-evidence\.json$/.test(file));
}

function stageCompleted(stageId) {
  if (!completedStages.has(stageId) || state.validation_status !== 'PASS') return false;
  if (historicalCompatibilityPass(stageId)) return true;
  if (!exists(stageEvidencePath(stageId))) return false;
  return declaredMaterialPaths(stageId).every(file => exists(file));
}

function receiptPath(artifactId) {
  return path.join(resolvedStateRoot, 'artifact-receipts', `${artifactId}.json`);
}

function receiptValid(artifactId) {
  const file = receiptPath(artifactId);
  if (!fs.existsSync(file)) return false;
  try {
    const receipt = JSON.parse(fs.readFileSync(file, 'utf8'));
    return receipt.artifact_id === artifactId && receipt.validation_status === 'PASS';
  } catch {
    return false;
  }
}

function pendingDecisionRefs(artifact) {
  const stage = stages.find(item => item.id === artifact.producer_stage);
  const decisions = stage?.owner_decisions || [];
  return decisions
    .filter(decision => decision.status === 'PENDING')
    .filter(decision => !Array.isArray(decision.affected_artifacts) || decision.affected_artifacts.includes(artifact.artifact_id))
    .map(decision => decision.id);
}

function artifactMaterialized(artifactId) {
  const artifact = artifactById.get(artifactId);
  if (!artifact) return { ok: false, cause: 'NO_PRODUCER' };
  const pending = pendingDecisionRefs(artifact);
  if (pending.length) return { ok: false, cause: 'DECISION_PENDING', pending_decisions: pending };
  if (receiptValid(artifactId)) return { ok: true, via: 'receipt' };
  if (artifact.status === 'historical_compatibility') {
    const compatibility = graph.historical_compatibility.find(item => item.stage_id === artifact.producer_stage);
    if (stageCompleted(artifact.producer_stage) && compatibility?.status === 'PASS') return { ok: true, via: 'historical_compatibility' };
  }
  if (stageCompleted(artifact.producer_stage) && exists(stageEvidencePath(artifact.producer_stage))) return { ok: true, via: 'stage_evidence' };
  return { ok: false, cause: 'ARTIFACT_MISSING', producer: artifact.producer_stage };
}

function missingConsumes(stage) {
  return stage.consumes
    .map(artifact => ({ artifact, producer: producerByArtifact.get(artifact) || 'NO_PRODUCER', state: artifactMaterialized(artifact) }))
    .filter(item => !item.state.ok);
}

function stageReady(stage) {
  return stage.status === 'READY' && !stageCompleted(stage.stage_id) && missingConsumes(stage).length === 0;
}

function downstreamUnblockCount(stageId) {
  return graph.edges.filter(edge => edge.from_stage === stageId).length;
}

function selectableStages() {
  return sequence
    .filter(stageReady)
    .sort((a, b) => {
      const aCritical = Number(Boolean(a.critical_path_priority));
      const bCritical = Number(Boolean(b.critical_path_priority));
      return bCritical - aCritical
        || downstreamUnblockCount(b.stage_id) - downstreamUnblockCount(a.stage_id)
        || a.artifact_wave - b.artifact_wave
        || a.stage_id.localeCompare(b.stage_id);
    });
}

function printBase() {
  console.log(`FORGE_REWRITE_COMMAND=${command}`);
  console.log(`FINAL_DECISION=${go.final_decision}`);
  console.log(`BRANCH=${freeze.source_branch}`);
  console.log(`SOURCE_COMMIT=${freeze.source_commit}`);
  console.log(`ARCHITECTURE_FREEZE_STATE=${freeze.freeze_state}`);
  console.log(`STATE_ROOT=${stateRoot}`);
  console.log(`STATE_CORRUPT=${state.corrupt ? 'YES' : 'NO'}`);
  console.log(`ARTIFACTS=${graph.artifacts.length}`);
  console.log(`EDGES=${graph.edges.length}`);
  console.log(`WAVES=${graph.waves.length}`);
  console.log(`CYCLES=${graph.cycles.length}`);
  console.log(`COMPATIBILITY_STATUS=${graph.compatibility_status}`);
}

function explainStage(id) {
  const stage = stageById.get(id);
  if (!stage) {
    console.log(`EXPLAIN_ERROR=STAGE_NOT_FOUND:${id}`);
    return;
  }
  console.log(`EXPLAIN_STAGE=${id}`);
  console.log(`STATUS=${stage.status}`);
  console.log(`CANONICAL_ORDER=${stage.canonical_order}`);
  console.log(`ARTIFACT_WAVE=${stage.artifact_wave}`);
  for (const item of missingConsumes(stage)) {
    console.log(`MISSING_CONSUME=${item.artifact}:producer=${item.producer}:cause=${item.state.cause}${item.state.pending_decisions ? `:decisions=${item.state.pending_decisions.join(',')}` : ''}`);
  }
  if (missingConsumes(stage).length === 0) console.log('MISSING_CONSUME=none');
  console.log(`PRODUCES=${stage.produces.join(',') || 'none'}`);
}

function explainArtifact(id) {
  const artifact = artifactById.get(id);
  if (!artifact) {
    console.log(`EXPLAIN_ERROR=ARTIFACT_NOT_FOUND:${id}`);
    return;
  }
  const state = artifactMaterialized(id);
  console.log(`EXPLAIN_ARTIFACT=${id}`);
  console.log(`PRODUCER=${artifact.producer_stage}`);
  console.log(`CONSUMERS=${artifact.consumer_stages.join(',') || 'none'}`);
  console.log(`MATERIALIZATION_KIND=${artifact.materialization.kind}`);
  console.log(`MATERIALIZED=${state.ok ? 'YES' : 'NO'}`);
  console.log(`MATERIALIZATION_CAUSE=${state.via || state.cause}`);
}

printBase();

if (command === 'validate') {
  if (graph.cycles.length) process.exit(2);
  if (graph.compatibility_status !== 'PASS') process.exit(2);
  console.log('ORCHESTRATOR_VALIDATE=PASS');
} else if (command === 'graph') {
  for (const edge of graph.edges) console.log(`ARTIFACT_EDGE=${edge.from_stage}->${edge.to_stage}:${edge.artifact}`);
} else if (command === 'waves') {
  for (const wave of graph.waves) console.log(`WAVE=${wave.wave}:${wave.stages.join(',')}`);
  console.log('PARALLELISM_NOTE=logical_only_no_automatic_concurrency');
} else if (command === 'next') {
  const ready = selectableStages();
  const next = ready[0];
  if (!next) {
    console.log('NEXT_STAGE=none');
  } else {
    console.log(`NEXT_STAGE=${next.stage_id}`);
    console.log(`SELECTION_REASON=unblocked_by_artifact_receipts_then_downstream_unblock_count_then_wave_then_stage_id`);
    console.log(`CONSUMES=${next.consumes.join(',') || 'none'}`);
    console.log(`PRODUCES=${next.produces.join(',') || 'none'}`);
    console.log(`ALTERNATIVES=${ready.slice(1).map(stage => stage.stage_id).join(',') || 'none'}`);
    console.log(`UNLOCKS=${graph.edges.filter(edge => edge.from_stage === next.stage_id).map(edge => edge.to_stage).join(',') || 'none'}`);
  }
} else if (command === 'explain') {
  if (argument && stageById.has(argument)) explainStage(argument);
  else if (argument && artifactById.has(argument)) explainArtifact(argument);
  else if (argument) {
    console.log(`EXPLAIN_ERROR=TARGET_NOT_FOUND:${argument}`);
  }
  else {
    const next = selectableStages()[0];
    console.log(`GLOBAL_NEXT=${next?.stage_id || 'none'}`);
    if (next) explainStage(next.stage_id);
  }
} else if (command === 'pending') {
  for (const artifact of graph.artifacts) {
    const state = artifactMaterialized(artifact.artifact_id);
    if (!state.ok) console.log(`PENDING_ARTIFACT=${artifact.artifact_id}:producer=${artifact.producer_stage}:cause=${state.cause}${state.pending_decisions ? `:decisions=${state.pending_decisions.join(',')}` : ''}`);
  }
  for (const decision of decisions.decisions) console.log(`PENDING_DECISION=${decision.decision_id}:scope=${decision.blocking_scope}`);
} else if (command === 'blocked') {
  const groups = new Map();
  for (const stage of sequence) {
    const missing = missingConsumes(stage);
    if (!missing.length && stage.status === 'READY') continue;
    const causes = missing.length ? missing.map(item => item.state.cause) : [stage.status];
    for (const cause of causes) {
      if (!groups.has(cause)) groups.set(cause, []);
      groups.get(cause).push(stage.stage_id);
    }
  }
  for (const [cause, ids] of [...groups.entries()].sort()) console.log(`BLOCKED_CAUSE=${cause}:${[...new Set(ids)].join(',')}`);
} else if (command === 'completed') {
  for (const artifact of graph.artifacts) {
    const state = artifactMaterialized(artifact.artifact_id);
    if (state.ok) console.log(`COMPLETED_ARTIFACT=${artifact.artifact_id}:stage=${artifact.producer_stage}:via=${state.via}`);
  }
} else if (command === 'status') {
  const ready = selectableStages();
  console.log(`CURRENT_STAGE=${state.current_stage || 'none'}`);
  console.log(`COMPLETED_STAGES=${[...completedStages].join(',') || 'none'}`);
  console.log(`NEXT_STAGE=${ready[0]?.stage_id || 'none'}`);
  console.log(`READY_STAGES=${ready.map(stage => stage.stage_id).join(',') || 'none'}`);
  console.log(`VALIDATION_STATUS=${state.validation_status || 'UNKNOWN'}`);
} else if (command === 'resume') {
  const ready = selectableStages();
  console.log(`RESUME_STATE=${state.corrupt ? 'STATE_CORRUPT' : 'SAFE_READ_ONLY'}`);
  console.log(`RESUME_NEXT_STAGE=${ready[0]?.stage_id || 'none'}`);
  console.log('RESUME_MUTATION=NO');
} else if (command === 'restart') {
  console.log('RESTART_POLICY=scope_required_for_real_execution');
  console.log('RESTART_SUPPORTED_SCOPES=stage,artifact,temporary_test_state');
  console.log('RESTART_MUTATION=NO');
} else if (command === 'dry-run') {
  const next = selectableStages()[0];
  console.log(`DRY_RUN_NEXT_STAGE=${next?.stage_id || 'none'}`);
  console.log(`DRY_RUN_OUTPUTS=${next?.produces.join(',') || 'none'}`);
  console.log('DRY_RUN_MUTATION=NO');
} else if (command === 'run') {
  const next = selectableStages()[0];
  if (!next) {
    console.error('FORGE_REWRITE_LAUNCH_REFUSED GRAPH_ERROR:no_dependency_eligible_ready_stage');
    process.exit(2);
  }
  console.log(`RUN_STAGE=${next.stage_id}`);
}
NODE
)"

printf '%s\n' "$report"

if [ "$command_name" = "run" ]; then
  execute_stage="$(printf '%s\n' "$report" | sed -n 's/^RUN_STAGE=//p' | sed -n '1p')"
  [ -n "$execute_stage" ] || forge_die "GRAPH_ERROR:no executable stage selected"
  runner="$FORGE_ROOT/tools/termux/rewrite/forge-rewrite-stage.sh"
  forge_validate_bash_runner "$runner"
  bash "$runner" "$execute_stage" --apply
  printf 'FORGE_REWRITE_RUN=STOPPED_AT_COMMIT_BOUNDARY stage=%s\n' "$execute_stage"
fi
