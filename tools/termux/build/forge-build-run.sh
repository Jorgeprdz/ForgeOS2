#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CLI="$SCRIPT_DIR/forge-build"
LAUNCHER="$SCRIPT_DIR/forge-build-launch.sh"

fail() {
  printf 'FORGE_BUILD_RUN_ERROR %s\n' "$*" >&2
  exit 1
}

[ -f "$CLI" ] || fail "MISSING_CLI:$CLI"
[ -f "$LAUNCHER" ] || fail "MISSING_LAUNCHER:$LAUNCHER"

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || fail "NOT_IN_GIT_REPOSITORY"
cd "$ROOT"

STATE_ROOT="${FORGE_BUILD_STATE_ROOT:-.forge/build}"
if [[ "$STATE_ROOT" = /* ]]; then
  RESOLVED_STATE_ROOT="$STATE_ROOT"
else
  RESOLVED_STATE_ROOT="$ROOT/$STATE_ROOT"
fi
STATE_FILE="$RESOLVED_STATE_ROOT/state.json"
REQUESTED_MODULE="${1:-}"

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

printf 'FORGE_BUILD_SYSTEM_COMMAND=run\n'
bash "$CLI" doctor

active="$(read_state_field active)"
if [ -n "$REQUESTED_MODULE" ] && [ -n "$active" ] && [ "$REQUESTED_MODULE" != "$active" ]; then
  fail "ACTIVE_MODULE_CONFLICT:$active"
fi

if [ -z "$active" ]; then
  module="${REQUESTED_MODULE:-$(next_module)}"
  [ -n "$module" ] && [ "$module" != "none" ] || fail "NO_BUILDABLE_MODULE"
  bash "$LAUNCHER" start "$module"
  active="$module"
fi

status="$(read_state_field status)"
printf 'RUN_MODULE=%s\n' "$active"
printf 'RUN_STATE=%s\n' "${status:-declared}"

case "${status:-declared}" in
  declared)
    bash "$LAUNCHER" validate "$active"
    bash "$LAUNCHER" advance architecture_ready
    printf 'RUN_ADVANCED_TO=architecture_ready\n'
    ;;
  architecture_ready)
    bash "$LAUNCHER" validate "$active"
    bash "$LAUNCHER" advance contracts_ready
    printf 'RUN_ADVANCED_TO=contracts_ready\n'
    ;;
  contracts_ready)
    bash "$LAUNCHER" advance implementation_started
    printf 'RUN_ADVANCED_TO=implementation_started\n'
    printf 'ACTION_REQUIRED=IMPLEMENT_MODULE\n'
    ;;
  implementation_started)
    printf 'ACTION_REQUIRED=IMPLEMENT_MODULE\n'
    ;;
  implementation_complete)
    bash "$LAUNCHER" advance tests_added
    bash "$LAUNCHER" test "$active"
    bash "$LAUNCHER" advance tests_pass
    bash "$LAUNCHER" validate "$active"
    bash "$LAUNCHER" advance integration_pass
    bash "$CLI" evidence "$active"
    printf 'RUN_ADVANCED_TO=integration_pass\n'
    printf 'ACTION_REQUIRED=COMMIT\n'
    ;;
  tests_added)
    bash "$LAUNCHER" test "$active"
    bash "$LAUNCHER" advance tests_pass
    printf 'RUN_ADVANCED_TO=tests_pass\n'
    ;;
  tests_pass)
    bash "$LAUNCHER" validate "$active"
    bash "$LAUNCHER" advance integration_pass
    bash "$CLI" evidence "$active"
    printf 'RUN_ADVANCED_TO=integration_pass\n'
    printf 'ACTION_REQUIRED=COMMIT\n'
    ;;
  integration_pass)
    bash "$CLI" evidence "$active"
    printf 'ACTION_REQUIRED=COMMIT\n'
    ;;
  committed)
    printf 'ACTION_REQUIRED=PUSH\n'
    ;;
  pushed)
    printf 'ACTION_REQUIRED=MERGE\n'
    ;;
  merged)
    printf 'RUN_COMPLETE=YES\n'
    printf 'NEXT_MODULE=%s\n' "$(next_module)"
    ;;
  *)
    fail "UNSUPPORTED_STATE:$status"
    ;;
esac

printf 'FORGE_BUILD_RUN=PASS\n'
