#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(
  CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd
)"
ROOT="$(
  CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd
)"

cd "$ROOT"

MAX_STAGES="${FORGE_AUTOPILOT_MAX_STAGES:-100}"
REMOTE="${FORGE_AUTOPILOT_REMOTE:-origin}"
PUSH_ENABLED="${FORGE_AUTOPILOT_PUSH:-1}"
STOP_FILE=".forge/rewrite/AUTOPILOT_STOP"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_DIR=".forge/rewrite/logs"
RUN_LOG="$LOG_DIR/autopilot-${RUN_ID}.log"

mkdir -p "$LOG_DIR"

exec > >(tee -a "$RUN_LOG") 2>&1

fail() {
  printf 'AUTOPILOT_RESULT=FAIL\n'
  printf 'AUTOPILOT_ERROR=%s\n' "$1"
  printf 'AUTOPILOT_LOG=%s\n' "$RUN_LOG"
  exit 1
}

stop_cleanly() {
  printf 'AUTOPILOT_RESULT=STOPPED\n'
  printf 'AUTOPILOT_REASON=%s\n' "$1"
  printf 'AUTOPILOT_STAGES_APPLIED=%s\n' "$completed"
  printf 'AUTOPILOT_LOG=%s\n' "$RUN_LOG"
  exit 0
}

branch="$(git branch --show-current)"

case "$branch" in
  rewrite/*|scaffold/constitution-first-termux-rewrite-*)
    ;;
  *)
    fail "INVALID_BRANCH:${branch}"
    ;;
esac

if [ -n "$(git status --porcelain)" ]; then
  fail "DIRTY_WORKTREE_BEFORE_START"
fi

case "$MAX_STAGES" in
  ''|*[!0-9]*)
    fail "INVALID_MAX_STAGES:${MAX_STAGES}"
    ;;
esac

if [ "$MAX_STAGES" -lt 1 ]; then
  fail "MAX_STAGES_MUST_BE_POSITIVE"
fi

printf 'AUTOPILOT_RUN_ID=%s\n' "$RUN_ID"
printf 'AUTOPILOT_BRANCH=%s\n' "$branch"
printf 'AUTOPILOT_REMOTE=%s\n' "$REMOTE"
printf 'AUTOPILOT_PUSH_ENABLED=%s\n' "$PUSH_ENABLED"
printf 'AUTOPILOT_MAX_STAGES=%s\n' "$MAX_STAGES"

bash "$SCRIPT_DIR/forge-rewrite-launch.sh" validate

completed=0

while [ "$completed" -lt "$MAX_STAGES" ]; do
  if [ -f "$STOP_FILE" ]; then
    stop_cleanly "OWNER_STOP_FILE_PRESENT"
  fi

  printf '\n=== AUTOPILOT ITERATION %s ===\n' "$((completed + 1))"

  next_output="$(
    bash "$SCRIPT_DIR/forge-rewrite-launch.sh" next 2>&1
  )" || {
    printf '%s\n' "$next_output"
    stop_cleanly "NEXT_STAGE_SELECTION_FAILED"
  }

  printf '%s\n' "$next_output"

  stage="$(
    printf '%s\n' "$next_output" |
      sed -n 's/^NEXT_STAGE=//p' |
      tail -n 1
  )"

  if [ -z "$stage" ] || [ "$stage" = "none" ]; then
    stop_cleanly "NO_NEXT_STAGE"
  fi

  case "$stage" in
    SG-[0-9][0-9][0-9])
      ;;
    *)
      fail "INVALID_NEXT_STAGE:${stage}"
      ;;
  esac

  printf 'AUTOPILOT_SELECTED_STAGE=%s\n' "$stage"

  explain_output="$(
    bash "$SCRIPT_DIR/forge-rewrite-launch.sh" explain "$stage" 2>&1
  )" || {
    printf '%s\n' "$explain_output"
    stop_cleanly "EXPLAIN_FAILED:${stage}"
  }

  printf '%s\n' "$explain_output"

  status="$(
    printf '%s\n' "$explain_output" |
      sed -n 's/^STATUS=//p' |
      tail -n 1
  )"

  if [ "$status" != "READY" ]; then
    stop_cleanly "STAGE_NOT_READY:${stage}:${status:-UNKNOWN}"
  fi

  printf '\n=== PLAN %s ===\n' "$stage"
  bash "$SCRIPT_DIR/forge-rewrite-stage.sh" \
    "$stage" \
    --plan

  printf '\n=== APPLY %s ===\n' "$stage"

  if ! bash "$SCRIPT_DIR/forge-rewrite-stage.sh" \
    "$stage" \
    --apply
  then
    printf 'AUTOPILOT_STAGE=%s\n' "$stage"
    stop_cleanly "STAGE_APPLY_FAILED:${stage}"
  fi

  printf '\n=== VALIDATE %s ===\n' "$stage"

  if ! bash "$SCRIPT_DIR/forge-rewrite-launch.sh" validate; then
    stop_cleanly "POST_STAGE_VALIDATION_FAILED:${stage}"
  fi

  if [ -z "$(git status --porcelain)" ]; then
    stop_cleanly "STAGE_PRODUCED_NO_GIT_CHANGES:${stage}"
  fi

  printf '\n=== COMMIT %s ===\n' "$stage"

  git add -A
  git diff --cached --check

  commit_message="feat(rewrite): apply ${stage}"

  if ! git commit -m "$commit_message"; then
    stop_cleanly "COMMIT_FAILED:${stage}"
  fi

  commit_sha="$(git rev-parse HEAD)"

  printf 'AUTOPILOT_COMMIT_STAGE=%s\n' "$stage"
  printf 'AUTOPILOT_COMMIT_SHA=%s\n' "$commit_sha"

  if [ "$PUSH_ENABLED" = "1" ]; then
    printf '\n=== PUSH %s ===\n' "$stage"

    if ! git push "$REMOTE" "$branch"; then
      fail "PUSH_FAILED:${stage}:${commit_sha}"
    fi

    printf 'AUTOPILOT_PUSH=PASS stage=%s commit=%s\n' \
      "$stage" \
      "$commit_sha"
  else
    printf 'AUTOPILOT_PUSH=SKIPPED stage=%s\n' "$stage"
  fi

  completed=$((completed + 1))

  if [ -n "$(git status --porcelain)" ]; then
    fail "DIRTY_WORKTREE_AFTER_STAGE:${stage}"
  fi

  printf 'AUTOPILOT_STAGE_RESULT=PASS stage=%s\n' "$stage"
done

printf '\nAUTOPILOT_RESULT=PASS\n'
printf 'AUTOPILOT_REASON=MAX_STAGES_REACHED\n'
printf 'AUTOPILOT_STAGES_APPLIED=%s\n' "$completed"
printf 'AUTOPILOT_LOG=%s\n' "$RUN_LOG"
