#!/usr/bin/env bash
set -Eeuo pipefail

FORGE_ROOT="${FORGE_ROOT:-/mnt/sdcard/Forge OS v2}"
EXPORT_ROOT="${EXPORT_ROOT:-/mnt/sdcard/ForgeGemini}"
SESSION_NAME="${SESSION_NAME:-forge-autopilot}"

cd "$FORGE_ROOT"

mkdir -p "$EXPORT_ROOT"

timestamp="$(date '+%Y%m%d-%H%M%S')"
log_file="$EXPORT_ROOT/forge-rewrite-autopilot-${timestamp}.log"
status_file="$EXPORT_ROOT/forge-rewrite-autopilot-status.txt"
iteration=0

log() {
  printf '%s\n' "$*" | tee -a "$log_file"
}

write_status() {
  {
    printf 'UPDATED_AT=%s\n' "$(date --iso-8601=seconds)"
    printf 'STATUS=%s\n' "$1"
    printf 'BRANCH=%s\n' "$(git branch --show-current)"
    printf 'HEAD=%s\n' "$(git rev-parse --short HEAD)"
    printf 'ITERATION=%s\n' "$iteration"
    printf 'LOG=%s\n' "$log_file"
    [[ $# -ge 2 ]] && printf 'DETAIL=%s\n' "$2"
  } > "$status_file"
}

stop_with_error() {
  local reason="$1"
  local code="${2:-1}"

  log ""
  log "AUTOPILOT_RESULT=STOPPED"
  log "STOP_REASON=$reason"
  log "EXIT_CODE=$code"
  log "SESSION_REMAINS_OPEN=YES"

  write_status "STOPPED" "$reason"
  return "$code"
}

trap 'rc=$?; log "AUTOPILOT_UNEXPECTED_ERROR code=$rc line=$LINENO"; write_status "CRASHED" "code=$rc line=$LINENO"' ERR

log "=== FORGE REWRITE OVERNIGHT AUTOPILOT ==="
log "STARTED_AT=$(date --iso-8601=seconds)"
log "FORGE_ROOT=$FORGE_ROOT"
log "BRANCH=$(git branch --show-current)"
log "HEAD=$(git rev-parse --short HEAD)"
log "LOG=$log_file"

write_status "STARTING" "initial validation"

if [[ -n "$(git status --porcelain)" ]]; then
  git status --short | tee -a "$log_file"
  stop_with_error "DIRTY_WORKTREE_BEFORE_START" 10
  exit $?
fi

log ""
log "=== INITIAL ORCHESTRATOR VALIDATION ==="

set +e
bash tools/termux/rewrite/forge-rewrite-launch.sh validate \
  2>&1 | tee -a "$log_file"
validate_rc="${PIPESTATUS[0]}"
set -e

log "INITIAL_VALIDATE_EXIT_CODE=$validate_rc"

if [[ "$validate_rc" -ne 0 ]]; then
  stop_with_error "INITIAL_VALIDATION_FAILED" "$validate_rc"
  exit $?
fi

while true; do
  iteration=$((iteration + 1))
  iteration_output="$(mktemp)"
  branch="$(git branch --show-current)"

  log ""
  log "=================================================="
  log "AUTOPILOT_ITERATION=$iteration"
  log "ITERATION_STARTED_AT=$(date --iso-8601=seconds)"
  log "BRANCH=$branch"
  log "HEAD=$(git rev-parse --short HEAD)"
  log "=================================================="

  write_status "RUNNING" "iteration=$iteration"

  if [[ -n "$(git status --porcelain)" ]]; then
    git status --short | tee -a "$log_file"
    rm -f "$iteration_output"
    stop_with_error \
      "DIRTY_WORKTREE_BEFORE_ITERATION iteration=$iteration" \
      11
    exit $?
  fi

  set +e
  bash tools/termux/rewrite/forge-rewrite-launch.sh run \
    2>&1 | tee "$iteration_output" | tee -a "$log_file"
  run_rc="${PIPESTATUS[0]}"

  if [[ "$run_rc" -ne 0 ]] && \
     grep -q 'another stage appears active: .*; use resume or rollback' \
       "$iteration_output"
  then
    active_stage="$(
      sed -n \
        's/.*another stage appears active: \([^;]*\); use resume or rollback.*/\1/p' \
        "$iteration_output" |
      tail -n 1
    )"

    log ""
    log "ACTIVE_STAGE_DETECTED=${active_stage:-unknown}"
    log "AUTOPILOT_ACTION=RESUME"

    : > "$iteration_output"

    bash tools/termux/rewrite/forge-rewrite-launch.sh resume \
      2>&1 | tee "$iteration_output" | tee -a "$log_file"
    run_rc="${PIPESTATUS[0]}"

    log "RESUME_EXIT_CODE=$run_rc"
  fi

  set -e

  log ""
  log "RUN_EXIT_CODE=$run_rc"

  if grep -q '^FORGE_REWRITE_RUN=COMPLETE$' "$iteration_output"; then
    rm -f "$iteration_output"

    log ""
    log "=== FINAL VALIDATION ==="

    set +e
    bash tools/termux/rewrite/forge-rewrite-launch.sh validate \
      2>&1 | tee -a "$log_file"
    final_validate_rc="${PIPESTATUS[0]}"
    set -e

    log "FINAL_VALIDATE_EXIT_CODE=$final_validate_rc"

    if [[ "$final_validate_rc" -ne 0 ]]; then
      stop_with_error \
        "FINAL_VALIDATION_FAILED" \
        "$final_validate_rc"
      exit $?
    fi

    log ""
    log "AUTOPILOT_RESULT=COMPLETE"
    log "COMPLETED_AT=$(date --iso-8601=seconds)"
    log "ITERATIONS=$iteration"
    log "FINAL_HEAD=$(git rev-parse --short HEAD)"
    log "FINAL_BRANCH=$(git branch --show-current)"
    log "SESSION_REMAINS_OPEN=YES"

    write_status "COMPLETE" "iterations=$iteration"
    break
  fi

  if [[ "$run_rc" -ne 0 ]]; then
    failure_stage="$(
      sed -n 's/^RUN_STAGE=//p' "$iteration_output" |
      tail -n 1
    )"

    rm -f "$iteration_output"

    stop_with_error \
      "STAGE_RUN_FAILED stage=${failure_stage:-unknown}" \
      "$run_rc"
    exit $?
  fi

  if ! grep -q \
    '^FORGE_REWRITE_RUN=STOPPED_AT_COMMIT_BOUNDARY stage=' \
    "$iteration_output"
  then
    rm -f "$iteration_output"

    stop_with_error \
      "UNKNOWN_RUN_TERMINATION iteration=$iteration" \
      12
    exit $?
  fi

  stage="$(
    sed -n \
      's/^FORGE_REWRITE_RUN=STOPPED_AT_COMMIT_BOUNDARY stage=//p' \
      "$iteration_output" |
    tail -n 1
  )"

  rm -f "$iteration_output"

  if [[ -z "$stage" ]]; then
    stop_with_error "COMMIT_BOUNDARY_WITHOUT_STAGE" 13
    exit $?
  fi

  log ""
  log "=== COMMIT BOUNDARY ==="
  log "COMPLETED_STAGE=$stage"

  if [[ -z "$(git status --porcelain)" ]]; then
    stop_with_error \
      "NO_CHANGES_AT_COMMIT_BOUNDARY stage=$stage" \
      14
    exit $?
  fi

  git status --short | tee -a "$log_file"
  git diff --stat | tee -a "$log_file"

  git add -A

  set +e
  git commit -m "feat(rewrite): materialize ${stage}" \
    2>&1 | tee -a "$log_file"
  commit_rc="${PIPESTATUS[0]}"
  set -e

  log "COMMIT_EXIT_CODE=$commit_rc"

  if [[ "$commit_rc" -ne 0 ]]; then
    stop_with_error \
      "COMMIT_FAILED stage=$stage" \
      "$commit_rc"
    exit $?
  fi

  set +e
  git push origin "$branch" \
    2>&1 | tee -a "$log_file"
  push_rc="${PIPESTATUS[0]}"
  set -e

  log "PUSH_EXIT_CODE=$push_rc"

  if [[ "$push_rc" -ne 0 ]]; then
    stop_with_error \
      "PUSH_FAILED stage=$stage branch=$branch" \
      "$push_rc"
    exit $?
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    git status --short | tee -a "$log_file"

    stop_with_error \
      "DIRTY_WORKTREE_AFTER_PUSH stage=$stage" \
      15
    exit $?
  fi

  log "STAGE_COMMIT_PUSH=PASS stage=$stage"
  log "NEW_HEAD=$(git rev-parse --short HEAD)"
  write_status "STAGE_PUSHED" "stage=$stage"

  sleep 2
done
