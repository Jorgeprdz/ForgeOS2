#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CLI="$SCRIPT_DIR/forge-build"
LAUNCHER="$SCRIPT_DIR/forge-build-launch.sh"
UI="$SCRIPT_DIR/forge-build-ui.mjs"

fail() {
  printf 'FORGE_BUILD_RUN_ERROR %s\n' "$*" >&2
  exit 1
}

[ -f "$CLI" ] || fail "MISSING_CLI:$CLI"
[ -f "$LAUNCHER" ] || fail "MISSING_LAUNCHER:$LAUNCHER"
[ -f "$UI" ] || fail "MISSING_UI:$UI"

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || fail "NOT_IN_GIT_REPOSITORY"
cd "$ROOT"

STATE_ROOT="${FORGE_BUILD_STATE_ROOT:-.forge/build}"
if [[ "$STATE_ROOT" = /* ]]; then
  RESOLVED_STATE_ROOT="$STATE_ROOT"
else
  RESOLVED_STATE_ROOT="$ROOT/$STATE_ROOT"
fi
STATE_FILE="$RESOLVED_STATE_ROOT/state.json"
LOG_DIR="$RESOLVED_STATE_ROOT/logs"
RUN_LOG="$LOG_DIR/run.log"
REQUESTED_MODULE="${1:-}"
mkdir -p "$LOG_DIR"
: >"$RUN_LOG"

read_state_field() {
  local field="$1"
  [ -f "$STATE_FILE" ] || return 0
  FIELD="$field" STATE_FILE="$STATE_FILE" node <<'NODE'
const fs = require('fs');
const state = JSON.parse(fs.readFileSync(process.env.STATE_FILE, 'utf8'));
const active = state.active_module || '';
if (process.env.FIELD === 'active') process.stdout.write(active);
if (process.env.FIELD === 'status') process.stdout.write(active ? (state.modules?.[active]?.status || 'declared') : '');
NODE
}

next_module() {
  bash "$LAUNCHER" next | sed -n 's/^NEXT_MODULE=//p' | head -n 1
}

render() {
  local module="${1:-resolving}"
  local state="${2:-declared}"
  local action="${3:-none}"
  local current="${4:-resolve}"
  local labels=(resolve doctor start validate architecture contracts implementation handoff)
  local names=("Resolver módulo" "Revisar entorno" "Iniciar módulo" "Validar contratos" "Preparar arquitectura" "Preparar contratos" "Implementar" "Entregar control")
  local steps=""
  local reached=0
  local index

  for index in "${!labels[@]}"; do
    local step_state="pending"
    if [ "${labels[$index]}" = "$current" ]; then
      step_state="running"
      reached=1
    elif [ "$reached" -eq 0 ]; then
      step_state="done"
    fi
    steps+="${step_state}:${names[$index]}|"
  done

  FORGE_BUILD_UI_MODULE="$module" \
  FORGE_BUILD_UI_STATE="$state" \
  FORGE_BUILD_UI_ACTION="$action" \
  FORGE_BUILD_UI_STEPS="${steps%|}" \
  node "$UI"
}

run_logged() {
  if [ -t 1 ] && [ "${FORGE_BUILD_UI_PLAIN:-0}" != "1" ]; then
    "$@" >>"$RUN_LOG" 2>&1
  else
    "$@" 2>&1 | tee -a "$RUN_LOG"
  fi
}

printf 'FORGE_BUILD_SYSTEM_COMMAND=run\n'
render "${REQUESTED_MODULE:-resolving}" "declared" "checking environment" doctor
run_logged bash "$CLI" doctor

active="$(read_state_field active)"
if [ -n "$REQUESTED_MODULE" ] && [ -n "$active" ] && [ "$REQUESTED_MODULE" != "$active" ]; then
  fail "ACTIVE_MODULE_CONFLICT:$active"
fi

if [ -z "$active" ]; then
  render "${REQUESTED_MODULE:-resolving}" "declared" "selecting module" resolve
  module="${REQUESTED_MODULE:-$(next_module)}"
  [ -n "$module" ] && [ "$module" != "none" ] || fail "NO_BUILDABLE_MODULE"
  render "$module" "declared" "starting module" start
  run_logged bash "$LAUNCHER" start "$module"
  active="$module"
fi

status="$(read_state_field status)"
printf 'RUN_MODULE=%s\n' "$active"
printf 'RUN_STATE=%s\n' "${status:-declared}"

case "${status:-declared}" in
  declared)
    render "$active" "declared" "validating" validate
    run_logged bash "$LAUNCHER" validate "$active"
    render "$active" "declared" "promoting architecture" architecture
    run_logged bash "$LAUNCHER" advance architecture_ready
    render "$active" "architecture_ready" "safe stop" contracts
    printf 'RUN_ADVANCED_TO=architecture_ready\n'
    ;;
  architecture_ready)
    render "$active" "architecture_ready" "validating" validate
    run_logged bash "$LAUNCHER" validate "$active"
    render "$active" "architecture_ready" "promoting contracts" contracts
    run_logged bash "$LAUNCHER" advance contracts_ready
    render "$active" "contracts_ready" "safe stop" implementation
    printf 'RUN_ADVANCED_TO=contracts_ready\n'
    ;;
  contracts_ready)
    render "$active" "contracts_ready" "opening implementation" implementation
    run_logged bash "$LAUNCHER" advance implementation_started
    render "$active" "implementation_started" "IMPLEMENT_MODULE" implementation
    printf 'RUN_ADVANCED_TO=implementation_started\n'
    printf 'ACTION_REQUIRED=IMPLEMENT_MODULE\n'
    ;;
  implementation_started)
    render "$active" "implementation_started" "IMPLEMENT_MODULE" implementation
    printf 'ACTION_REQUIRED=IMPLEMENT_MODULE\n'
    ;;
  implementation_complete)
    render "$active" "implementation_complete" "running tests" implementation
    run_logged bash "$LAUNCHER" advance tests_added
    run_logged bash "$LAUNCHER" test "$active"
    run_logged bash "$LAUNCHER" advance tests_pass
    run_logged bash "$LAUNCHER" validate "$active"
    run_logged bash "$LAUNCHER" advance integration_pass
    run_logged bash "$CLI" evidence "$active"
    render "$active" "integration_pass" "COMMIT" handoff
    printf 'RUN_ADVANCED_TO=integration_pass\n'
    printf 'ACTION_REQUIRED=COMMIT\n'
    ;;
  tests_added)
    render "$active" "tests_added" "running tests" implementation
    run_logged bash "$LAUNCHER" test "$active"
    run_logged bash "$LAUNCHER" advance tests_pass
    render "$active" "tests_pass" "safe stop" handoff
    printf 'RUN_ADVANCED_TO=tests_pass\n'
    ;;
  tests_pass)
    render "$active" "tests_pass" "integrating" handoff
    run_logged bash "$LAUNCHER" validate "$active"
    run_logged bash "$LAUNCHER" advance integration_pass
    run_logged bash "$CLI" evidence "$active"
    render "$active" "integration_pass" "COMMIT" handoff
    printf 'RUN_ADVANCED_TO=integration_pass\n'
    printf 'ACTION_REQUIRED=COMMIT\n'
    ;;
  integration_pass)
    run_logged bash "$CLI" evidence "$active"
    render "$active" "integration_pass" "COMMIT" handoff
    printf 'ACTION_REQUIRED=COMMIT\n'
    ;;
  committed)
    render "$active" "committed" "PUSH" handoff
    printf 'ACTION_REQUIRED=PUSH\n'
    ;;
  pushed)
    render "$active" "pushed" "MERGE" handoff
    printf 'ACTION_REQUIRED=MERGE\n'
    ;;
  merged)
    render "$active" "merged" "COMPLETE" handoff
    printf 'RUN_COMPLETE=YES\n'
    printf 'NEXT_MODULE=%s\n' "$(next_module)"
    ;;
  *)
    fail "UNSUPPORTED_STATE:$status"
    ;;
esac

printf 'RUN_LOG=%s\n' "$RUN_LOG"
printf 'FORGE_BUILD_RUN=PASS\n'
