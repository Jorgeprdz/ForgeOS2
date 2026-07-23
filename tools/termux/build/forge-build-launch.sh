#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
GATE="$SCRIPT_DIR/forge-build-gate.mjs"

fail() {
  printf 'FORGE_BUILD_ERROR %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage:
  bash tools/termux/build/forge-build-launch.sh <command> [module|state]

Read-only commands:
  status                  Show build state summary.
  next                    Select the next buildable module deterministically.
  inspect <module>        Show architecture/build metadata for a module.
  resume                  Show the safe continuation point.
  validate [module]       Run repository validation without mutating state.
  test [module]           Run repository tests without mutating state.

State-changing commands:
  start <module>          Start a module and create persistent build state.
  advance <state>         Move the active module to the next valid state.
  complete <module>       Mark the active module complete after validation.
  restart <module>        Reset only the selected module build state.

Lifecycle:
  declared -> architecture_ready -> contracts_ready -> implementation_started
  -> implementation_complete -> tests_added -> tests_pass -> integration_pass
  -> committed -> pushed -> merged

Environment:
  FORGE_BUILD_STATE_ROOT  Override .forge/build (primarily for tests).
  FORGE_BUILD_ENABLE_BRANCH_OVERRIDE_FOR_TESTS=1
  FORGE_BUILD_TEST_BRANCH_OVERRIDE=build/test-fixture
  FORGE_BUILD_ALLOW_DIRTY_FOR_TESTS=1
EOF
}

repo_root() {
  if git rev-parse --show-toplevel >/dev/null 2>&1; then
    git rev-parse --show-toplevel
    return
  fi
  local fallback
  fallback="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
  [ -d "$fallback/.git" ] || fail "NOT_IN_GIT_REPOSITORY"
  printf '%s\n' "$fallback"
}

current_branch() {
  if [ "${FORGE_BUILD_ENABLE_BRANCH_OVERRIDE_FOR_TESTS:-0}" = "1" ]; then
    [ -n "${FORGE_BUILD_TEST_BRANCH_OVERRIDE:-}" ] || fail "TEST_BRANCH_OVERRIDE_EMPTY"
    printf '%s\n' "$FORGE_BUILD_TEST_BRANCH_OVERRIDE"
    return
  fi
  git branch --show-current
}

require_build_branch() {
  local branch
  branch="$(current_branch)"
  [ -n "$branch" ] || fail "DETACHED_HEAD"
  [ "$branch" != "main" ] || fail "MAIN_BRANCH_MUTATION_REFUSED"
  case "$branch" in
    build/*|feat/*|fix/*|rewrite/*|test/*) ;;
    *) fail "UNAUTHORIZED_BRANCH_PREFIX:$branch" ;;
  esac
}

require_clean_tree() {
  if [ "${FORGE_BUILD_ALLOW_DIRTY_FOR_TESTS:-0}" = "1" ]; then
    return
  fi
  [ -z "$(git status --porcelain)" ] || fail "DIRTY_REPOSITORY"
}

command_name="${1:-status}"
argument="${2:-}"

case "$command_name" in
  -h|--help|help) usage; exit 0 ;;
  status|next|inspect|resume|validate|test|start|advance|complete|restart) ;;
  *) fail "UNSUPPORTED_COMMAND:$command_name" ;;
esac

FORGE_ROOT="$(repo_root)"
export FORGE_ROOT
cd "$FORGE_ROOT"

command -v git >/dev/null 2>&1 || fail "MISSING_COMMAND:git"
command -v node >/dev/null 2>&1 || fail "MISSING_COMMAND:node"
command -v npm >/dev/null 2>&1 || fail "MISSING_COMMAND:npm"
[ -f "$GATE" ] || fail "MISSING_GATE:$GATE"

STATE_ROOT="${FORGE_BUILD_STATE_ROOT:-.forge/build}"
if [[ "$STATE_ROOT" = /* ]]; then
  RESOLVED_STATE_ROOT="$STATE_ROOT"
else
  RESOLVED_STATE_ROOT="$FORGE_ROOT/$STATE_ROOT"
fi
STATE_FILE="$RESOLVED_STATE_ROOT/state.json"

case "$command_name" in
  start|advance|complete|restart)
    require_build_branch
    require_clean_tree
    ;;
esac

if [ "$command_name" = "validate" ]; then
  printf 'FORGE_BUILD_COMMAND=validate\n'
  [ -z "$argument" ] || printf 'MODULE=%s\n' "$argument"
  npm run lint
  npm run scaffold:validate

  if [ -n "$argument" ]; then
    VALIDATION_DIR="$RESOLVED_STATE_ROOT/validation"
    VALIDATION_FILE="$VALIDATION_DIR/${argument//\//_}.json"
    mkdir -p "$VALIDATION_DIR"

    MODULE="$argument" VALIDATION_FILE="$VALIDATION_FILE" node <<'NODE'
const fs = require('fs');
const cp = require('child_process');

const git = (args) => cp.execFileSync('git', args, {
  encoding: 'utf8'
}).trim();

const payload = {
  schema_version: 1,
  module_id: process.env.MODULE,
  status: 'PASS',
  branch: git(['branch', '--show-current']),
  head: git(['rev-parse', 'HEAD']),
  generated_at: new Date().toISOString()
};

const file = process.env.VALIDATION_FILE;
const temporary = `${file}.tmp-${process.pid}`;

fs.writeFileSync(
  temporary,
  `${JSON.stringify(payload, null, 2)}\n`,
  { mode: 0o600 }
);

fs.renameSync(temporary, file);
NODE

    printf 'VALIDATION_RECEIPT=%s\n' "$VALIDATION_FILE"
  fi

  printf 'FORGE_BUILD_VALIDATE=PASS\n'
  exit 0
fi

if [ "$command_name" = "test" ]; then
  printf 'FORGE_BUILD_COMMAND=test\n'
  [ -z "$argument" ] || printf 'MODULE=%s\n' "$argument"
  npm test
  printf 'FORGE_BUILD_TEST=PASS\n'
  exit 0
fi

mkdir -p "$RESOLVED_STATE_ROOT"

if [ "$command_name" = "advance" ]; then
  case "$argument" in
    implementation_started|integration_pass)
      [ -f "$STATE_FILE" ] || fail "STATE_FILE_MISSING:$STATE_FILE"

      active_module="$(
        STATE_FILE="$STATE_FILE" node <<'NODE'
const fs = require('fs');
const state = JSON.parse(
  fs.readFileSync(process.env.STATE_FILE, 'utf8')
);
process.stdout.write(state.active_module || '');
NODE
      )"

      [ -n "$active_module" ] || fail "NO_ACTIVE_MODULE"
      node "$GATE" "$active_module" "$argument"
      ;;
  esac
fi

FORGE_BUILD_STATE_FILE="$STATE_FILE" node - "$command_name" "$argument" <<'NODE'
const fs = require('fs');
const path = require('path');

const command = process.argv[2];
const argument = process.argv[3] || '';
const root = process.cwd();
const stateFile = process.env.FORGE_BUILD_STATE_FILE;
const buildOrderPath = path.join(root, 'scaffolds/manifest/build-order.json');
const dependencyGraphPath = path.join(root, 'scaffolds/manifest/dependency-graph.json');
const rewriteStagesPath = path.join(root, 'scaffolds/manifest/rewrite-stages.json');
const rewriteStateRoot = process.env.FORGE_REWRITE_STATE_ROOT || path.join(root, '.forge/rewrite');
const rewriteStateFile = path.join(rewriteStateRoot, 'state.json');

function die(message, code = 1) {
  console.error(`FORGE_BUILD_ERROR ${message}`);
  process.exit(code);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadState() {
  if (!fs.existsSync(stateFile)) {
    return {
      schema_version: 1,
      active_module: null,
      modules: {},
      history: []
    };
  }
  try {
    const parsed = readJson(stateFile);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid root');
    parsed.modules ||= {};
    parsed.history ||= [];
    parsed.active_module ??= null;
    return parsed;
  } catch (error) {
    die(`STATE_CORRUPT:${error.message}`);
  }
}

function writeState(state) {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  const tmp = `${stateFile}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, stateFile);
}

const lifecycle = [
  'declared',
  'architecture_ready',
  'contracts_ready',
  'implementation_started',
  'implementation_complete',
  'tests_added',
  'tests_pass',
  'integration_pass',
  'committed',
  'pushed',
  'merged'
];

const buildOrder = readJson(buildOrderPath);
const dependencyGraph = fs.existsSync(dependencyGraphPath) ? readJson(dependencyGraphPath) : {};
const rewriteStages = fs.existsSync(rewriteStagesPath) ? readJson(rewriteStagesPath).stages || [] : [];
const rewriteStageById = new Map(rewriteStages.map(item => [item.id, item]));
const rewriteState = fs.existsSync(rewriteStateFile) ? readJson(rewriteStateFile) : {};
const completedStages = new Set(Array.isArray(rewriteState.completed_stages) ? rewriteState.completed_stages : []);
const activeOrder = Array.isArray(buildOrder.active_topological_order)
  ? buildOrder.active_topological_order
  : [];
const moduleRecords = Array.isArray(buildOrder.modules) ? buildOrder.modules : [];
const moduleById = new Map(moduleRecords.map(item => [item.module_id, item]));
const activeSet = new Set(activeOrder);
const implementable = new Set(buildOrder.eligible_now?.IMPLEMENT || []);
const rejected = new Set(buildOrder.rejected_modules || []);
const deferred = new Set(buildOrder.deferred_modules || []);
const state = loadState();

function requireKnownModule(id) {
  if (!id) die('MODULE_REQUIRED');
  if (!activeSet.has(id) && !moduleById.has(id)) die(`MODULE_NOT_FOUND:${id}`);
  return id;
}

function moduleState(id) {
  return state.modules[id] || { status: 'declared', completed: false };
}

function isComplete(id) {
  const item = moduleState(id);
  return item.completed === true || item.status === 'merged';
}

function dependenciesOf(id) {
  const record = moduleById.get(id) || {};
  for (const key of ['dependencies', 'depends_on', 'hard_dependencies', 'required_modules']) {
    if (Array.isArray(record[key])) return record[key];
  }
  const edges = Array.isArray(dependencyGraph.edges) ? dependencyGraph.edges : [];
  return edges
    .filter(edge => (edge.from === id || edge.module_id === id || edge.consumer === id))
    .map(edge => edge.to || edge.depends_on || edge.provider)
    .filter(Boolean);
}

function stageForModule(id) {
  const stageId = moduleById.get(id)?.stage_id;
  return stageId ? rewriteStageById.get(stageId) || null : null;
}

function stageIsResolved(stageId) {
  if (completedStages.has(stageId) && rewriteState.validation_status === 'PASS') return true;
  const status = String(rewriteStageById.get(stageId)?.status || '').toUpperCase();
  return status === 'COMPLETED' || status === 'RATIFIED';
}

function stageDependenciesOf(id) {
  const stage = stageForModule(id);
  return Array.isArray(stage?.derived_depends_on_stages) ? stage.derived_depends_on_stages : [];
}

function allDependenciesOf(id) {
  return [...new Set([...dependenciesOf(id), ...stageDependenciesOf(id)])];
}

function stageAllowsImplementation(id) {
  const stage = stageForModule(id);
  if (!stage) return true;
  return (stage.allowed_operations || []).some(operation => /\b(?:apply|implement|materialize)\b/i.test(operation));
}

function prerequisiteIsResolved(prerequisite) {
  const referencedStages = prerequisite.match(/SG-\d{3}/g) || [];
  if (referencedStages.length > 0) return referencedStages.every(stageIsResolved);
  const normalized = prerequisite.trim().toLowerCase();

  const ratifiedDecisionMatches = rewriteStages.some(stage =>
    (stage.owner_decisions || []).some(decision =>
      String(decision.status || '').toUpperCase() === 'RATIFIED'
      && String(decision.unlock_criteria || '').trim().toLowerCase() === normalized
    )
  );

  if (ratifiedDecisionMatches) return true;

  if (normalized === 'clean working tree') {
    return process.env.FORGE_BUILD_ALLOW_DIRTY_FOR_TESTS === '1'
      || require('child_process').spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout.trim() === '';
  }
  if (normalized === 'product spec exists') {
    return fs.existsSync(path.join(root, 'docs/product/FORGE_PRODUCT_SPEC.md'));
  }
  return false;
}

function unresolvedPrerequisitesOf(id) {
  const stage = stageForModule(id);
  if (!stage) return [];
  return (stage.prerequisites || []).filter(prerequisite => !prerequisiteIsResolved(prerequisite));
}

function semanticBlockers(id) {
  const stage = stageForModule(id);
  if (!stage || isComplete(id)) return [];
  const result = [];
  if (!stageAllowsImplementation(id)) result.push('IMPLEMENT_OPERATION_NOT_ALLOWED');
  for (const dependency of stageDependenciesOf(id)) {
    if (!stageIsResolved(dependency)) result.push(`STAGE_DEPENDENCY_PENDING:${dependency}`);
  }
  for (const prerequisite of unresolvedPrerequisitesOf(id)) {
    result.push(`PREREQUISITE_UNRESOLVED:${prerequisite}`);
  }
  return result;
}

function implementationEligible(id) {
  if (isComplete(id)) return implementable.has(id);
  return implementable.has(id) && stageAllowsImplementation(id) && semanticBlockers(id).length === 0;
}

function blockers(id) {
  const result = [];
  if (rejected.has(id)) result.push('REJECTED');
  if (deferred.has(id)) result.push('DEFERRED');
  if (!implementable.has(id)) result.push('NOT_IMPLEMENT_ELIGIBLE');
  for (const dependency of dependenciesOf(id)) {
    if (activeSet.has(dependency) && !isComplete(dependency)) result.push(`DEPENDENCY_PENDING:${dependency}`);
  }
  result.push(...semanticBlockers(id));
  return [...new Set(result)];
}

function printSemanticStatus(id) {
  const stage = stageForModule(id);
  console.log(`IMPLEMENT_ELIGIBLE=${implementationEligible(id) ? 'YES' : 'NO'}`);
  console.log(`DEPENDENCIES=${allDependenciesOf(id).join(',') || 'none'}`);
  console.log(`PREREQUISITES=${stage?.prerequisites?.join(' | ') || 'none'}`);
  console.log(`UNRESOLVED_PREREQUISITES=${unresolvedPrerequisitesOf(id).join(' | ') || 'none'}`);
  console.log(`ALLOWED_OPERATIONS=${stage?.allowed_operations?.join(',') || 'none'}`);
  console.log(`PROHIBITED_OPERATIONS=${stage?.prohibited_operations?.join(',') || 'none'}`);
  console.log(`BLOCKERS=${blockers(id).join(',') || 'none'}`);
}

function nextModule() {
  return activeOrder.find(id => !isComplete(id) && blockers(id).length === 0) || null;
}

function record(event, moduleId, details = {}) {
  state.history.push({
    at: new Date().toISOString(),
    event,
    module_id: moduleId,
    ...details
  });
}

function printBase() {
  console.log(`FORGE_BUILD_COMMAND=${command}`);
  console.log(`STATE_FILE=${stateFile}`);
  console.log(`ACTIVE_MODULE=${state.active_module || 'none'}`);
  console.log(`ACTIVE_MODULES=${activeOrder.length}`);
  console.log(`COMPLETED_MODULES=${activeOrder.filter(isComplete).length}`);
}

printBase();

if (command === 'status') {
  console.log(`NEXT_MODULE=${nextModule() || 'none'}`);
  if (state.active_module) printSemanticStatus(state.active_module);
  for (const id of activeOrder) {
    const item = moduleState(id);
    if (item.status !== 'declared' || item.completed) {
      console.log(`MODULE_STATE=${id}:${item.status}:completed=${item.completed ? 'YES' : 'NO'}`);
    }
  }
} else if (command === 'next') {
  const next = nextModule();
  console.log(`NEXT_MODULE=${next || 'none'}`);
  if (next) {
    console.log(`BUILD_INDEX=${activeOrder.indexOf(next)}`);
    console.log(`BLOCKERS=none`);
  }
} else if (command === 'inspect') {
  const id = requireKnownModule(argument);
  const item = moduleState(id);
  console.log(`MODULE=${id}`);
  console.log(`STATUS=${item.status}`);
  console.log(`COMPLETED=${item.completed ? 'YES' : 'NO'}`);
  console.log(`ACTIVE=${activeSet.has(id) ? 'YES' : 'NO'}`);
  console.log(`TOPOLOGICAL_INDEX=${activeOrder.indexOf(id)}`);
  printSemanticStatus(id);
} else if (command === 'resume') {
  const active = state.active_module;
  console.log(`RESUME_MODULE=${active || nextModule() || 'none'}`);
  if (active) console.log(`RESUME_STATE=${moduleState(active).status}`);
  console.log('RESUME_MUTATED=NO');
} else if (command === 'start') {
  const id = requireKnownModule(argument);
  if (state.active_module && state.active_module !== id) die(`ACTIVE_MODULE_CONFLICT:${state.active_module}`);
  const pending = blockers(id);
  if (pending.length) die(`MODULE_BLOCKED:${id}:${pending.join(',')}`);
  const current = moduleState(id);
  if (current.completed) die(`MODULE_ALREADY_COMPLETE:${id}`);
  state.active_module = id;
  state.modules[id] = {
    ...current,
    status: current.status || 'declared',
    completed: false,
    started_at: current.started_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  record('start', id, { status: state.modules[id].status });
  writeState(state);
  console.log(`STARTED_MODULE=${id}`);
  console.log(`MODULE_STATE=${state.modules[id].status}`);
} else if (command === 'advance') {
  const id = state.active_module;
  if (!id) die('NO_ACTIVE_MODULE');
  if (!lifecycle.includes(argument)) die(`INVALID_STATE:${argument}`);
  const current = moduleState(id);
  const currentIndex = lifecycle.indexOf(current.status);
  const targetIndex = lifecycle.indexOf(argument);
  if (targetIndex !== currentIndex + 1) {
    die(`INVALID_TRANSITION:${current.status}->${argument}:expected=${lifecycle[currentIndex + 1] || 'none'}`);
  }
  state.modules[id] = {
    ...current,
    status: argument,
    completed: argument === 'merged',
    updated_at: new Date().toISOString()
  };
  if (argument === 'merged') state.active_module = null;
  record('advance', id, { from: current.status, to: argument });
  writeState(state);
  console.log(`ADVANCED_MODULE=${id}`);
  console.log(`MODULE_STATE=${argument}`);
} else if (command === 'complete') {
  const id = requireKnownModule(argument);
  if (state.active_module !== id) die(`MODULE_NOT_ACTIVE:${id}`);
  const current = moduleState(id);
  if (current.status !== 'integration_pass') {
    die(`COMPLETE_REQUIRES_INTEGRATION_PASS:current=${current.status}`);
  }
  state.modules[id] = {
    ...current,
    status: 'integration_pass',
    completed: true,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  state.active_module = null;
  record('complete', id, { status: 'integration_pass' });
  writeState(state);
  console.log(`COMPLETED_MODULE=${id}`);
  console.log('NEXT_REQUIRED=commit,push,merge lifecycle may be recorded with advance when repository automation is enabled');
} else if (command === 'restart') {
  const id = requireKnownModule(argument);
  delete state.modules[id];
  if (state.active_module === id) state.active_module = null;
  record('restart', id, { reset_to: 'declared' });
  writeState(state);
  console.log(`RESTARTED_MODULE=${id}`);
  console.log('MODULE_STATE=declared');
}
NODE
