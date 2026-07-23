#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
IFS=$'\n\t'

# Forge OS V2 — Rewrite Autopilot Overnight
# Ejecuta runners SG existentes, valida, hace commit/push por etapa
# y muestra progreso en vivo. No inventa arquitectura ni modifica
# etapas que no tengan runner materializado.

REPO_DEFAULT="/mnt/sdcard/Forge OS v2"
REPO="${FORGE_REPO:-$REPO_DEFAULT}"
MANIFEST="${FORGE_REWRITE_MANIFEST:-scaffolds/manifest/rewrite-stages.json}"
RUNNER_DIR="${FORGE_REWRITE_RUNNER_DIR:-tools/termux/rewrite/generators}"
LAUNCHER="${FORGE_REWRITE_LAUNCHER:-tools/termux/rewrite/forge-rewrite-launch.sh}"
REPORT_DIR="${FORGE_AUTOPILOT_REPORT_DIR:-scaffolds/reports}"
STATE_DIR="${FORGE_AUTOPILOT_STATE_DIR:-.forge/rewrite/autopilot}"
MAX_STAGES="${FORGE_AUTOPILOT_MAX_STAGES:-999}"
PUSH_REMOTE="${FORGE_AUTOPILOT_REMOTE:-origin}"
FULL_VALIDATION_EVERY="${FORGE_AUTOPILOT_FULL_VALIDATION_EVERY:-3}"
ALLOW_DIRTY_START="${FORGE_AUTOPILOT_ALLOW_DIRTY_START:-0}"
DRY_RUN="${FORGE_AUTOPILOT_DRY_RUN:-0}"

START_EPOCH="$(date +%s)"
RUN_ID="$(date +%Y%m%d-%H%M%S)"
LOG_FILE=""
SUMMARY_FILE=""
STATE_FILE=""
CURRENT_STAGE=""
CURRENT_STEP="bootstrap"
STAGES_COMPLETED=0
STAGES_SKIPPED=0
STAGES_FAILED=0

say() {
  printf '%s\n' "$*"
}

banner() {
  printf '\n'
  printf '================================================================\n'
  printf '%s\n' "$*"
  printf '================================================================\n'
}

die() {
  say "AUTOPILOT_STATUS=FAILED"
  say "FAIL_STEP=${CURRENT_STEP}"
  [[ -n "${CURRENT_STAGE}" ]] && say "FAIL_STAGE=${CURRENT_STAGE}"
  say "FAIL_REASON=$*"
  exit 1
}

elapsed() {
  local now seconds h m s
  now="$(date +%s)"
  seconds=$((now - START_EPOCH))
  h=$((seconds / 3600))
  m=$(((seconds % 3600) / 60))
  s=$((seconds % 60))
  printf '%02d:%02d:%02d' "$h" "$m" "$s"
}

on_error() {
  local rc=$?
  set +e
  printf '\n'
  say "AUTOPILOT_STATUS=FAILED"
  say "FAIL_STAGE=${CURRENT_STAGE:-NONE}"
  say "FAIL_STEP=${CURRENT_STEP:-UNKNOWN}"
  say "FAIL_EXIT_CODE=$rc"
  say "ELAPSED=$(elapsed)"
  say "WORKTREE_STATUS_BEGIN"
  git status --short --untracked-files=all 2>/dev/null || true
  say "WORKTREE_STATUS_END"
  write_state "FAILED" "$rc"
  exit "$rc"
}
trap on_error ERR
trap 'say ""; say "AUTOPILOT_INTERRUPTED=YES"; write_state "INTERRUPTED" 130; exit 130' INT TERM

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "MISSING_COMMAND:$1"
}

write_state() {
  local status="${1:-RUNNING}"
  local exit_code="${2:-0}"
  mkdir -p "$STATE_DIR"
  cat >"$STATE_FILE" <<EOF
{
  "run_id": "$RUN_ID",
  "status": "$status",
  "stage": "${CURRENT_STAGE}",
  "step": "${CURRENT_STEP}",
  "completed": $STAGES_COMPLETED,
  "skipped": $STAGES_SKIPPED,
  "failed": $STAGES_FAILED,
  "branch": "$(git branch --show-current 2>/dev/null || true)",
  "head": "$(git rev-parse --short HEAD 2>/dev/null || true)",
  "elapsed": "$(elapsed)",
  "exit_code": $exit_code,
  "updated_at": "$(date -Iseconds)"
}
EOF
}

show_progress() {
  local index="$1"
  local total="$2"
  local stage="$3"
  local width=30
  local filled=0
  local empty=0
  local percent=0

  if (( total > 0 )); then
    percent=$((index * 100 / total))
    filled=$((index * width / total))
  fi
  empty=$((width - filled))

  printf '\n[%s] ' "$stage"
  printf '%*s' "$filled" '' | tr ' ' '#'
  printf '%*s' "$empty" '' | tr ' ' '-'
  printf ' %3d%%  (%d/%d)  elapsed=%s\n' \
    "$percent" "$index" "$total" "$(elapsed)"
}

run_live() {
  local label="$1"
  shift
  CURRENT_STEP="$label"
  write_state "RUNNING" 0

  banner "$label"
  printf 'COMMAND='
  printf '%q ' "$@"
  printf '\n'

  if [[ "$DRY_RUN" == "1" ]]; then
    say "DRY_RUN=SKIPPED"
    return 0
  fi

  "$@"
  say "${label// /_}=PASS"
}

run_shell_live() {
  local label="$1"
  local command="$2"
  CURRENT_STEP="$label"
  write_state "RUNNING" 0

  banner "$label"
  say "COMMAND=$command"

  if [[ "$DRY_RUN" == "1" ]]; then
    say "DRY_RUN=SKIPPED"
    return 0
  fi

  bash -lc "$command"
  say "${label// /_}=PASS"
}

json_stage_plan() {
  node - "$MANIFEST" "$RUNNER_DIR" <<'NODE'
const fs = require('fs');
const path = require('path');

const manifestPath = process.argv[2];
const runnerDir = process.argv[3];
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const rawStages =
  Array.isArray(manifest) ? manifest :
  Array.isArray(manifest.stages) ? manifest.stages :
  Array.isArray(manifest.rewrite_stages) ? manifest.rewrite_stages :
  [];

if (!rawStages.length) {
  throw new Error('MANIFEST_HAS_NO_STAGES');
}

const terminalStatuses = new Set([
  'PASS', 'PASSED', 'COMPLETE', 'COMPLETED', 'DONE',
  'MATERIALIZED', 'VALIDATED', 'MERGED'
]);

let rewriteState = {};
try {
  rewriteState = JSON.parse(
    fs.readFileSync(
      '.forge/rewrite/state.json',
      'utf8'
    )
  );
} catch {
  rewriteState = {};
}

const completedStages = new Set(
  Array.isArray(rewriteState.completed_stages)
    ? rewriteState.completed_stages
    : []
);

const blockedStatuses = new Set([
  'BLOCKED', 'BLOCKED_REQUIRES_OWNER_DECISION',
  'BLOCKED_REQUIRES_PRODUCT_DEFINITION',
  'REQUIRES_OWNER_DECISION', 'CANCELLED', 'SKIPPED'
]);

function stageId(stage) {
  return String(
    stage.id ??
    stage.stage_id ??
    stage.stageId ??
    stage.stage ??
    ''
  ).trim();
}

function statusOf(stage) {
  return String(
    stage.status ??
    stage.state ??
    stage.materialization_status ??
    stage.validation_status ??
    ''
  ).trim().toUpperCase();
}

function explicitRunner(stage) {
  return (
    stage.runner ??
    stage.generator ??
    stage.script ??
    stage.runner_path ??
    stage.generator_path ??
    ''
  );
}

for (const stage of rawStages) {
  const id = stageId(stage);
  if (!/^SG-\d{3}$/.test(id)) continue;

  const status = statusOf(stage);
  const explicit = explicitRunner(stage);
  const candidates = [
    explicit,
    path.join(runnerDir, `${id}.sh`),
    path.join(runnerDir, `${id.toLowerCase()}.sh`),
    path.join(runnerDir, `${id.replace('-', '_')}.sh`)
  ].filter(Boolean);

  const runner = candidates.find(p => fs.existsSync(p)) || '';
  let disposition = 'PENDING';

  if (
    blockedStatuses.has(status) ||
    status.startsWith('BLOCKED')
  ) {
    disposition = 'BLOCKED';
  } else if (
    terminalStatuses.has(status) ||
    completedStages.has(id)
  ) {
    disposition = 'COMPLETE';
  } else if (!runner) {
    disposition = 'NO_RUNNER';
  }

  process.stdout.write(JSON.stringify({
    id,
    status,
    runner,
    disposition,
    title: stage.title ?? stage.name ?? stage.scope ?? ''
  }) + '\n');
}
NODE
}

stage_specific_validation() {
  local stage="$1"

  if [[ -x "$LAUNCHER" || -f "$LAUNCHER" ]]; then
    run_live "ORCHESTRATOR VALIDATE ${stage}" \
      bash "$LAUNCHER" validate
  fi

  if [[ -f "scaffolds/validation/validate-stage.mjs" ]]; then
    run_live "STAGE VALIDATE ${stage}" \
      node scaffolds/validation/validate-stage.mjs "$stage"
  fi

  if [[ -f "scaffolds/validation/audit-all-sg-readiness.mjs" ]]; then
    run_live "READINESS AUDIT ${stage}" \
      node scaffolds/validation/audit-all-sg-readiness.mjs
  fi
}

fast_validation() {
  local stage="$1"

  if [[ -f package.json ]]; then
    if node -e '
      const p=require("./package.json");
      process.exit(p.scripts?.lint ? 0 : 1)
    '; then
      run_live "LINT ${stage}" npm run lint
    fi

    if node -e '
      const p=require("./package.json");
      process.exit(p.scripts?.test ? 0 : 1)
    '; then
      run_live "TEST ${stage}" npm test
    fi
  fi
}

full_validation() {
  local stage="$1"

  if [[ -f package.json ]] && node -e '
    const p=require("./package.json");
    process.exit(p.scripts?.["scaffold:validate"] ? 0 : 1)
  '; then
    run_live "SCAFFOLD VALIDATE ${stage}" npm run scaffold:validate
  fi

  stage_specific_validation "$stage"
}

commit_stage() {
  local stage="$1"
  local title="$2"
  local branch

  CURRENT_STEP="commit ${stage}"
  branch="$(git branch --show-current)"
  [[ -n "$branch" ]] || die "DETACHED_HEAD"

  git add -A

  if git diff --cached --quiet; then
    say "STAGE_CHANGESET=${stage}:EMPTY"
    return 2
  fi

  banner "CHANGESET ${stage}"
  git diff --cached --stat

  if [[ "$DRY_RUN" == "1" ]]; then
    say "DRY_RUN_COMMIT=SKIPPED"
    git reset >/dev/null
    return 0
  fi

  git commit -m "feat(rewrite): materialize ${stage}${title:+ - $title}"
  git push "$PUSH_REMOTE" "$branch"

  say "STAGE_COMMIT=$(git rev-parse --short HEAD)"
  say "STAGE_PUSH=PASS"
}

ensure_clean_start() {
  local dirty
  dirty="$(git status --porcelain --untracked-files=all)"

  if [[ -n "$dirty" && "$ALLOW_DIRTY_START" != "1" ]]; then
    banner "DIRTY WORKTREE"
    printf '%s\n' "$dirty"
    die "DIRTY_WORKTREE_SET_FORGE_AUTOPILOT_ALLOW_DIRTY_START_1_TO_OVERRIDE"
  fi
}

main() {
  require_command bash
  require_command git
  require_command node
  require_command npm

  cd "$REPO"
  [[ -d .git ]] || die "NOT_A_GIT_REPOSITORY:$REPO"
  [[ -f "$MANIFEST" ]] || die "MANIFEST_NOT_FOUND:$MANIFEST"
  [[ -d "$RUNNER_DIR" ]] || die "RUNNER_DIR_NOT_FOUND:$RUNNER_DIR"

  mkdir -p "$STATE_DIR" "$REPORT_DIR"
  LOG_FILE="$STATE_DIR/autopilot-$RUN_ID.log"
  SUMMARY_FILE="$REPORT_DIR/rewrite-autopilot-$RUN_ID.txt"
  STATE_FILE="$STATE_DIR/current.json"

  exec > >(tee -a "$LOG_FILE") 2>&1

  banner "FORGE REWRITE AUTOPILOT OVERNIGHT"
  say "RUN_ID=$RUN_ID"
  say "REPO=$REPO"
  say "BRANCH=$(git branch --show-current)"
  say "HEAD=$(git rev-parse --short HEAD)"
  say "MANIFEST=$MANIFEST"
  say "RUNNER_DIR=$RUNNER_DIR"
  say "MAX_STAGES=$MAX_STAGES"
  say "FULL_VALIDATION_EVERY=$FULL_VALIDATION_EVERY"
  say "DRY_RUN=$DRY_RUN"
  say "LOG_FILE=$LOG_FILE"
  say "SUMMARY_FILE=$SUMMARY_FILE"
  say "LIVE_PROGRESS=YES"
  say "BACKGROUND_MODE=NO"

  ensure_clean_start

  CURRENT_STEP="sync remote"
  run_live "REMOTE FETCH" git fetch "$PUSH_REMOTE" --prune

  mapfile -t PLAN < <(json_stage_plan)

  local total_pending=0
  local item disposition
  for item in "${PLAN[@]}"; do
    disposition="$(node -e 'const x=JSON.parse(process.argv[1]);console.log(x.disposition)' "$item")"
    [[ "$disposition" == "PENDING" ]] && total_pending=$((total_pending + 1))
  done

  banner "AUTOPILOT PLAN"
  say "MANIFEST_STAGES=${#PLAN[@]}"
  say "PENDING_WITH_RUNNER=$total_pending"

  if (( total_pending == 0 )); then
    say "AUTOPILOT_STATUS=NOTHING_TO_RUN"
    write_state "COMPLETE" 0
    exit 0
  fi

  local pending_index=0
  local attempted=0
  local id status runner title

  for item in "${PLAN[@]}"; do
    id="$(node -e 'const x=JSON.parse(process.argv[1]);console.log(x.id)' "$item")"
    status="$(node -e 'const x=JSON.parse(process.argv[1]);console.log(x.status)' "$item")"
    runner="$(node -e 'const x=JSON.parse(process.argv[1]);console.log(x.runner)' "$item")"
    disposition="$(node -e 'const x=JSON.parse(process.argv[1]);console.log(x.disposition)' "$item")"
    title="$(node -e 'const x=JSON.parse(process.argv[1]);console.log(x.title)' "$item")"

    case "$disposition" in
      COMPLETE)
        say "SKIP_STAGE=$id reason=ALREADY_COMPLETE status=${status:-UNKNOWN}"
        STAGES_SKIPPED=$((STAGES_SKIPPED + 1))
        continue
        ;;
      BLOCKED)
        banner "OWNER BLOCKER DETECTED"
        say "BLOCKED_STAGE=$id"
        say "BLOCKED_STATUS=${status:-BLOCKED}"
        say "AUTOPILOT_POLICY=STOP_BEFORE_UNSAFE_IMPLEMENTATION"
        CURRENT_STAGE="$id"
        CURRENT_STEP="owner blocker"
        write_state "BLOCKED" 20
        exit 20
        ;;
      NO_RUNNER)
        say "SKIP_STAGE=$id reason=RUNNER_NOT_FOUND status=${status:-UNKNOWN}"
        STAGES_SKIPPED=$((STAGES_SKIPPED + 1))
        continue
        ;;
      PENDING)
        ;;
      *)
        die "UNKNOWN_DISPOSITION:$disposition"
        ;;
    esac

    if (( attempted >= MAX_STAGES )); then
      say "MAX_STAGES_REACHED=$MAX_STAGES"
      break
    fi

    attempted=$((attempted + 1))
    pending_index=$((pending_index + 1))
    CURRENT_STAGE="$id"

    show_progress "$pending_index" "$total_pending" "$id"

    banner "RUN ${id}"
    say "STAGE=$id"
    say "TITLE=$title"
    say "RUNNER=$runner"
    say "STATUS_BEFORE=${status:-UNKNOWN}"

    run_live "STAGE APPLY ${id}" \
      bash \
      tools/termux/rewrite/forge-rewrite-stage.sh \
      "$id" \
      --apply

    stage_specific_validation "$id"
    fast_validation "$id"

    if (( FULL_VALIDATION_EVERY > 0 )) &&
       (( pending_index % FULL_VALIDATION_EVERY == 0 )); then
      full_validation "$id"
    fi

    if commit_stage "$id" "$title"; then
      STAGES_COMPLETED=$((STAGES_COMPLETED + 1))
    else
      rc=$?
      if (( rc == 2 )); then
        say "STAGE_RESULT=$id:NO_CHANGES"
        STAGES_SKIPPED=$((STAGES_SKIPPED + 1))
      else
        return "$rc"
      fi
    fi

    write_state "RUNNING" 0

    if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
      git status --short --untracked-files=all
      die "DIRTY_WORKTREE_AFTER_STAGE:$id"
    fi

    say "STAGE_RESULT=$id:PASS"
  done

  CURRENT_STAGE="FINAL"
  CURRENT_STEP="final validation"
  full_validation "FINAL"

  if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
    banner "FINAL VALIDATION GENERATED CHANGES"
    git status --short --untracked-files=all
    git add -A

    if ! git diff --cached --quiet; then
      if [[ "$DRY_RUN" == "1" ]]; then
        git reset >/dev/null
      else
        git commit -m "chore(rewrite): refresh final validation evidence"
        git push "$PUSH_REMOTE" "$(git branch --show-current)"
      fi
    fi
  fi

  local local_head remote_head branch
  branch="$(git branch --show-current)"
  local_head="$(git rev-parse --short=8 HEAD)"
  remote_head="$(
    git ls-remote "$PUSH_REMOTE" "refs/heads/$branch" |
    awk '{print substr($1,1,8)}'
  )"

  {
    say "FORGE_REWRITE_AUTOPILOT_SUMMARY"
    say "RUN_ID=$RUN_ID"
    say "STATUS=PASS"
    say "COMPLETED=$STAGES_COMPLETED"
    say "SKIPPED=$STAGES_SKIPPED"
    say "FAILED=$STAGES_FAILED"
    say "BRANCH=$branch"
    say "LOCAL_HEAD=$local_head"
    say "REMOTE_HEAD=$remote_head"
    say "ELAPSED=$(elapsed)"
    say "LOG_FILE=$LOG_FILE"
  } | tee "$SUMMARY_FILE"

  [[ -z "$(git status --porcelain --untracked-files=all)" ]] ||
    die "FINAL_WORKTREE_DIRTY"

  [[ "$local_head" == "$remote_head" ]] ||
    die "REMOTE_HEAD_MISMATCH"

  CURRENT_STEP="complete"
  write_state "COMPLETE" 0

  banner "AUTOPILOT COMPLETE"
  say "AUTOPILOT_STATUS=PASS"
  say "STAGES_COMPLETED=$STAGES_COMPLETED"
  say "STAGES_SKIPPED=$STAGES_SKIPPED"
  say "WORKTREE=CLEAN"
  say "LOCAL_HEAD=$local_head"
  say "REMOTE_HEAD=$remote_head"
  say "ELAPSED=$(elapsed)"
  say "SESSION_REMAINS_OPEN=YES"
}

main "$@"
