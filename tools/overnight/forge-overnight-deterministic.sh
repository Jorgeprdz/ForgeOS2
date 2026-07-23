#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${FORGE_OVERNIGHT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
QUEUE="${FORGE_OVERNIGHT_QUEUE:-tools/overnight/queue.json}"
STATE_DIR="${FORGE_OVERNIGHT_STATE_DIR:-.forge/overnight}"
ALLOW_DIRTY="${FORGE_OVERNIGHT_ALLOW_DIRTY:-0}"
PUSH="${FORGE_OVERNIGHT_PUSH:-1}"
MAX_JOBS="${FORGE_OVERNIGHT_MAX_JOBS:-999}"
RUN_ID="$(date +%Y%m%d-%H%M%S)"
LOG_DIR="$STATE_DIR/logs"
LOG_FILE="$LOG_DIR/run-$RUN_ID.log"
STATE_FILE="$STATE_DIR/state.json"
SUMMARY_FILE="$STATE_DIR/summary-$RUN_ID.txt"
LOCK_DIR="$STATE_DIR/lock"
CURRENT_JOB=""
CURRENT_STEP=""
START_EPOCH="$(date +%s)"

mkdir -p "$LOG_DIR"

exec > >(tee -a "$LOG_FILE") 2>&1

die() {
  printf '\nOVERNIGHT_STATUS=FAILED\n'
  printf 'FAIL_JOB=%s\n' "${CURRENT_JOB:-bootstrap}"
  printf 'FAIL_STEP=%s\n' "${CURRENT_STEP:-bootstrap}"
  printf 'FAIL_REASON=%s\n' "$1"
  exit "${2:-1}"
}

cleanup() {
  local code=$?
  rm -rf "$LOCK_DIR" 2>/dev/null || true
  if command -v termux-wake-unlock >/dev/null 2>&1; then
    termux-wake-unlock >/dev/null 2>&1 || true
  fi
  exit "$code"
}
trap cleanup EXIT
trap 'die "UNEXPECTED_ERROR_LINE_${LINENO}" $?' ERR
trap 'die "INTERRUPTED" 130' INT TERM

header() {
  printf '\n================================================================\n'
  printf '%s\n' "$1"
  printf '================================================================\n'
}

elapsed() {
  local now delta h m s
  now="$(date +%s)"
  delta=$((now - START_EPOCH))
  h=$((delta / 3600)); m=$(((delta % 3600) / 60)); s=$((delta % 60))
  printf '%02d:%02d:%02d' "$h" "$m" "$s"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "MISSING_COMMAND_$1"
}

write_state() {
  local status="$1" job="${2:-}" detail="${3:-}"
  STATUS="$status" JOB="$job" DETAIL="$detail" RUN_ID="$RUN_ID" \
  BRANCH="$(git branch --show-current)" HEAD="$(git rev-parse HEAD)" \
  node <<'NODE' > "$STATE_FILE.tmp"
const fs = require('fs');
const previousPath = process.env.STATE_FILE;
let previous = {};
try { previous = JSON.parse(fs.readFileSync(previousPath, 'utf8')); } catch {}
const completed = Array.isArray(previous.completed_jobs) ? previous.completed_jobs : [];
if (process.env.STATUS === 'PASS' && process.env.JOB && !completed.includes(process.env.JOB)) {
  completed.push(process.env.JOB);
}
const state = {
  schema_version: 1,
  run_id: process.env.RUN_ID,
  status: process.env.STATUS,
  current_job: process.env.JOB || null,
  detail: process.env.DETAIL || null,
  branch: process.env.BRANCH,
  head: process.env.HEAD,
  completed_jobs: completed,
  updated_at: new Date().toISOString()
};
process.stdout.write(JSON.stringify(state, null, 2) + '\n');
NODE
  mv "$STATE_FILE.tmp" "$STATE_FILE"
}

run_shell() {
  local label="$1" command="$2"
  CURRENT_STEP="$label"
  header "$label"
  printf 'COMMAND=%s\n' "$command"
  bash -lc "$command" </dev/null
  printf '%s=PASS\n' "$(printf '%s' "$label" | tr '[:lower:] -' '[:upper:]__')"
}

rollback_job() {
  header "ROLLBACK $CURRENT_JOB"
  git reset --hard HEAD
  git clean -fd -- \
    ':!.forge/overnight' \
    ':!tools/overnight/queue.json' \
    ':!tools/overnight/forge-overnight-deterministic.sh' \
    ':!tools/overnight/jobs'
}

job_field() {
  JOB_ID="$1" FIELD="$2" QUEUE="$QUEUE" node <<'NODE'
const fs = require('fs');
const q = JSON.parse(fs.readFileSync(process.env.QUEUE, 'utf8'));
const job = q.jobs.find(j => j.id === process.env.JOB_ID);
if (!job) process.exit(2);
const value = job[process.env.FIELD];
if (Array.isArray(value)) process.stdout.write(value.join('\n'));
else if (value === undefined || value === null) process.stdout.write('');
else process.stdout.write(String(value));
NODE
}

completed_has() {
  JOB_ID="$1" STATE_FILE="$STATE_FILE" node <<'NODE'
const fs = require('fs');
let s = {};
try { s = JSON.parse(fs.readFileSync(process.env.STATE_FILE, 'utf8')); } catch {}
process.exit(Array.isArray(s.completed_jobs) && s.completed_jobs.includes(process.env.JOB_ID) ? 0 : 1);
NODE
}

validate_queue() {
  QUEUE="$QUEUE" node <<'NODE'
const fs = require('fs');
const q = JSON.parse(fs.readFileSync(process.env.QUEUE, 'utf8'));
if (q.schema_version !== 1) throw new Error('QUEUE_SCHEMA_VERSION');
if (!Array.isArray(q.jobs)) throw new Error('QUEUE_JOBS_REQUIRED');
const seen = new Set();
for (const [i, j] of q.jobs.entries()) {
  if (!j || typeof j !== 'object') throw new Error(`JOB_OBJECT_${i}`);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(j.id || '')) throw new Error(`JOB_ID_${i}`);
  if (seen.has(j.id)) throw new Error(`JOB_DUPLICATE_${j.id}`);
  seen.add(j.id);
  if (!['READY','DISABLED'].includes(j.status)) throw new Error(`JOB_STATUS_${j.id}`);
  if (!Array.isArray(j.commands) || !j.commands.length) throw new Error(`JOB_COMMANDS_${j.id}`);
  if (!Array.isArray(j.verify) || !j.verify.length) throw new Error(`JOB_VERIFY_${j.id}`);
  if (!j.commit_message || typeof j.commit_message !== 'string') throw new Error(`JOB_COMMIT_${j.id}`);
  for (const dep of j.depends_on || []) if (!seen.has(dep)) throw new Error(`JOB_DEPENDENCY_ORDER_${j.id}_${dep}`);
}
console.log(`QUEUE_VALIDATE=PASS`);
console.log(`QUEUE_JOBS=${q.jobs.length}`);
NODE
}

list_jobs() {
  QUEUE="$QUEUE" node <<'NODE'
const fs = require('fs');
const q = JSON.parse(fs.readFileSync(process.env.QUEUE, 'utf8'));
for (const j of q.jobs) if (j.status === 'READY') console.log(j.id);
NODE
}

check_dependencies() {
  local job="$1"
  while IFS= read -r dep; do
    [[ -z "$dep" ]] && continue
    completed_has "$dep" || die "DEPENDENCY_NOT_COMPLETED_${job}_REQUIRES_${dep}"
  done < <(job_field "$job" depends_on)
}

run_repairs() {
  local job="$1" attempt="$2"
  local repairs
  repairs="$(job_field "$job" repairs)"
  [[ -n "$repairs" ]] || return 1
  header "SAFE REPAIR $job ATTEMPT $attempt"
  while IFS= read -r command; do
    [[ -z "$command" ]] && continue
    printf 'REPAIR_COMMAND=%s\n' "$command"
    bash -lc "$command" </dev/null
  done <<< "$repairs"
}

run_job() {
  local job="$1" title command verify commit_message retry_limit attempt changed
  CURRENT_JOB="$job"
  title="$(job_field "$job" title)"
  commit_message="$(job_field "$job" commit_message)"
  retry_limit="$(job_field "$job" retry_limit)"
  retry_limit="${retry_limit:-0}"

  check_dependencies "$job"

  header "JOB $job"
  printf 'TITLE=%s\n' "$title"
  printf 'ELAPSED=%s\n' "$(elapsed)"
  write_state "RUNNING" "$job" "$title"

  attempt=0
  while :; do
    attempt=$((attempt + 1))
    printf 'ATTEMPT=%s\n' "$attempt"

    set +e
    while IFS= read -r command; do
      [[ -z "$command" ]] && continue
      run_shell "JOB COMMAND $job" "$command" || { status=$?; break; }
      status=0
    done < <(job_field "$job" commands)
    set -e

    if [[ "${status:-0}" -eq 0 ]]; then
      break
    fi

    if (( attempt > retry_limit )); then
      rollback_job
      write_state "FAILED" "$job" "COMMAND_FAILED"
      die "JOB_COMMAND_FAILED_$job"
    fi

    run_repairs "$job" "$attempt" || {
      rollback_job
      write_state "FAILED" "$job" "NO_SAFE_REPAIR"
      die "NO_SAFE_REPAIR_$job"
    }
  done

  while IFS= read -r verify; do
    [[ -z "$verify" ]] && continue
    if ! run_shell "JOB VERIFY $job" "$verify"; then
      rollback_job
      write_state "FAILED" "$job" "VERIFY_FAILED"
      die "JOB_VERIFY_FAILED_$job"
    fi
  done < <(job_field "$job" verify)

  if [[ -z "$(git status --porcelain --untracked-files=all -- ':!.forge/overnight')" ]]; then
    printf 'JOB_RESULT=PASS_NO_CHANGES\n'
    write_state "PASS" "$job" "NO_CHANGES"
    return 0
  fi

  header "GLOBAL GATES $job"
  run_shell "NPM TEST" "npm test"
  run_shell "NPM LINT" "npm run lint"
  run_shell "SCAFFOLD VALIDATE" "npm run scaffold:validate"

  git add -A -- ':!.forge/overnight'

  changed="$(git diff --cached --name-only | wc -l | tr -d ' ')"
  [[ "$changed" -gt 0 ]] || die "STAGED_CHANGE_COUNT_ZERO_$job"

  header "COMMIT $job"
  git diff --cached --stat
  git commit -m "$commit_message"
  printf 'COMMIT_SHA=%s\n' "$(git rev-parse --short HEAD)"

  if [[ "$PUSH" = "1" ]]; then
    CURRENT_STEP="PUSH"
    git push origin "$(git branch --show-current)"
    printf 'PUSH=PASS\n'
  else
    printf 'PUSH=SKIPPED\n'
  fi

  [[ -z "$(git status --porcelain --untracked-files=all -- ':!.forge/overnight')" ]] \
    || die "DIRTY_AFTER_COMMIT_$job"

  write_state "PASS" "$job" "COMMITTED"
  printf 'JOB_RESULT=PASS\n'
}

cd "$ROOT"
STATE_FILE="$STATE_FILE" export STATE_FILE
require_cmd git
require_cmd node
require_cmd npm
require_cmd bash

[[ -f "$QUEUE" ]] || die "QUEUE_NOT_FOUND_$QUEUE"
[[ "$(git branch --show-current)" != "main" ]] || die "REFUSING_MAIN_BRANCH"
[[ -d .git ]] || die "NOT_GIT_REPOSITORY"

if [[ -e "$LOCK_DIR" ]]; then
  die "ANOTHER_OVERNIGHT_RUN_APPEARS_ACTIVE"
fi
mkdir -p "$LOCK_DIR"
printf '%s\n' "$$" > "$LOCK_DIR/pid"

if command -v termux-wake-lock >/dev/null 2>&1; then
  termux-wake-lock >/dev/null 2>&1 || true
fi

if [[ "$ALLOW_DIRTY" != "1" ]] && [[ -n "$(git status --porcelain --untracked-files=all -- ':!.forge/overnight')" ]]; then
  git status --short --untracked-files=all
  die "DIRTY_WORKTREE"
fi

header "FORGE DETERMINISTIC OVERNIGHT"
printf 'RUN_ID=%s\n' "$RUN_ID"
printf 'ROOT=%s\n' "$ROOT"
printf 'BRANCH=%s\n' "$(git branch --show-current)"
printf 'HEAD=%s\n' "$(git rev-parse --short HEAD)"
printf 'QUEUE=%s\n' "$QUEUE"
printf 'PUSH=%s\n' "$PUSH"
printf 'MAX_JOBS=%s\n' "$MAX_JOBS"
printf 'LOG_FILE=%s\n' "$LOG_FILE"

validate_queue
git fetch origin --prune

count=0
while IFS= read -r job; do
  [[ -z "$job" ]] && continue
  if completed_has "$job"; then
    printf 'JOB_SKIP_COMPLETED=%s\n' "$job"
    continue
  fi
  if (( count >= MAX_JOBS )); then
    printf 'MAX_JOBS_REACHED=%s\n' "$MAX_JOBS"
    break
  fi
  run_job "$job"
  count=$((count + 1))
done < <(list_jobs)

header "OVERNIGHT COMPLETE"
printf 'OVERNIGHT_STATUS=PASS\n'
printf 'JOBS_EXECUTED=%s\n' "$count"
printf 'HEAD=%s\n' "$(git rev-parse --short HEAD)"
printf 'ELAPSED=%s\n' "$(elapsed)"
write_state "COMPLETE" "" "ALL_READY_JOBS_PROCESSED"
