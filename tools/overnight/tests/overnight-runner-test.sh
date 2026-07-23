#!/usr/bin/env bash
set -Eeuo pipefail

TEST_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
OVERNIGHT_DIR="$(CDPATH= cd -- "$TEST_DIR/.." && pwd)"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/forge-overnight-test.XXXXXX")"
PASS_COUNT=0
FAIL_COUNT=0
CURRENT_TEST=""

cleanup() { rm -rf -- "$TMP_ROOT"; }
trap cleanup EXIT

pass() { PASS_COUNT=$((PASS_COUNT + 1)); printf 'TEST=PASS NAME=%s\n' "$CURRENT_TEST"; }
fail() { FAIL_COUNT=$((FAIL_COUNT + 1)); printf 'TEST=FAIL NAME=%s REASON=%s\n' "$CURRENT_TEST" "$1" >&2; }
assert() { "$@" || { fail "assertion:$*"; return 1; }; }

make_repo() {
  local name="$1" scenario="${2:-success}" repo bare
  repo="$TMP_ROOT/$name"
  bare="$TMP_ROOT/$name.git"
  mkdir -p "$repo/tools/overnight/tests"
  cp "$OVERNIGHT_DIR/forge-overnight-deterministic.sh" "$OVERNIGHT_DIR/runner.mjs" \
    "$OVERNIGHT_DIR/validate-queue.mjs" "$repo/tools/overnight/"
  cp "$TEST_DIR/fixture-builder.mjs" "$repo/tools/overnight/tests/"
  node "$repo/tools/overnight/tests/fixture-builder.mjs" "$repo" "$scenario"
  printf '{"private":true,"scripts":{"test":"printf \\"test\\\\n\\" >> gate.log","lint":"printf \\"lint\\\\n\\" >> gate.log","scaffold:validate":"printf \\"scaffold\\\\n\\" >> gate.log"}}\n' > "$repo/package.json"
  printf 'original\n' > "$repo/allowed.txt"
  printf '.forge/\n' > "$repo/.gitignore"
  git -C "$repo" init -q -b test/overnight
  git -C "$repo" config user.name 'Overnight Test'
  git -C "$repo" config user.email overnight@example.invalid
  git -C "$repo" add .
  git -C "$repo" commit -qm 'test: fixture'
  git init -q --bare "$bare"
  git -C "$repo" remote add origin "$bare"
  git -C "$repo" push -qu origin test/overnight
  printf '%s\n' "$repo"
}

run_runner() {
  local repo="$1"; shift
  FORGE_OVERNIGHT_SKIP_FETCH=1 FORGE_OVERNIGHT_PLATFORM="${FORGE_TEST_PLATFORM:-arch}" \
    bash "$repo/tools/overnight/forge-overnight-deterministic.sh" \
      --repo "$repo" --queue "$repo/queue.json" --no-push --restart "$@"
}

test_validator_mutation() {
  local name="$1" expression="$2" expected="$3" repo
  CURRENT_TEST="$name"; repo="$(make_repo "$name")"
  node - "$repo/queue.json" "$expression" <<'NODE'
const fs=require('fs'); const [file, expression]=process.argv.slice(2);
const q=JSON.parse(fs.readFileSync(file)); Function('q', expression)(q);
fs.writeFileSync(file, JSON.stringify(q));
NODE
  if node "$repo/tools/overnight/validate-queue.mjs" "$repo/queue.json" >"$repo/result" 2>&1; then
    fail "validator accepted invalid queue"; return
  fi
  assert grep -q "$expected" "$repo/result" && pass
}

test_valid_queue() {
  CURRENT_TEST=valid_queue; local repo; repo="$(make_repo valid)"
  assert node "$repo/tools/overnight/validate-queue.mjs" "$repo/queue.json" >/dev/null && pass
}

test_success() {
  CURRENT_TEST=command_success; local repo; repo="$(make_repo success)"
  assert run_runner "$repo" >/dev/null && assert grep -q '"result": "PASS"' "$repo/.forge/overnight/state.json" && pass
}

test_expected_failure() {
  local name="$1" scenario="$2" reason="$3" repo output
  CURRENT_TEST="$name"; repo="$(make_repo "$name" "$scenario")"
  output="$TMP_ROOT/$name.output"
  if run_runner "$repo" >"$output" 2>&1; then fail "runner unexpectedly passed"; return; fi
  assert grep -q "$reason" "$output" && pass
}

test_no_changes() {
  CURRENT_TEST=job_without_changes; local repo before after; repo="$(make_repo no_changes)"
  before="$(git -C "$repo" rev-parse HEAD)"; assert run_runner "$repo" >/dev/null
  after="$(git -C "$repo" rev-parse HEAD)"
  assert test "$before" = "$after" && assert grep -q PASS_NO_CHANGES "$repo/.forge/overnight/state.json" && pass
}

test_change_commit_gates() {
  CURRENT_TEST=allowed_change_commit_and_three_gates; local repo before after
  repo="$(make_repo change change)"; before="$(git -C "$repo" rev-parse HEAD)"
  assert run_runner "$repo" >/dev/null; after="$(git -C "$repo" rev-parse HEAD)"
  assert test "$before" != "$after"
  assert test "$(git -C "$repo" show HEAD:gate.log | wc -l)" -eq 3
  assert grep -qx test <(git -C "$repo" show HEAD:gate.log)
  assert grep -qx lint <(git -C "$repo" show HEAD:gate.log)
  assert grep -qx scaffold <(git -C "$repo" show HEAD:gate.log)
  pass
}

test_stdin() {
  CURRENT_TEST=stdin_isolation_and_no_omissions; local repo; repo="$(make_repo stdin stdin)"
  assert run_runner "$repo" >/dev/null
  assert test "$(git -C "$repo" show HEAD:execution.log | wc -l)" -eq 3
  assert grep -qx stdin <(git -C "$repo" show HEAD:execution.log)
  assert grep -qx after-one <(git -C "$repo" show HEAD:execution.log)
  assert grep -qx after-two <(git -C "$repo" show HEAD:execution.log)
  pass
}

test_multi() {
  local scenario="$1" expected="$2"; CURRENT_TEST="$scenario"; local repo
  repo="$(make_repo "$scenario" "$scenario")"; assert run_runner "$repo" >/dev/null
  assert test "$(git -C "$repo" show HEAD:execution.log | wc -l)" -eq "$expected" && pass
}

test_repair() {
  CURRENT_TEST=repair_success; local repo; repo="$(make_repo repair repair)"
  assert run_runner "$repo" >/dev/null && assert git -C "$repo" show HEAD:repaired.flag >/dev/null && pass
}

test_main() {
  CURRENT_TEST=refuse_main; local repo output; repo="$(make_repo main)"; output="$TMP_ROOT/main.output"
  git -C "$repo" branch -m main
  if run_runner "$repo" >"$output" 2>&1; then fail "main accepted"; return; fi
  assert grep -q MAIN_BRANCH_REFUSED "$output" && pass
}

test_lock() {
  local mode="$1"; CURRENT_TEST="lock_$mode"; local repo output; repo="$(make_repo "lock_$mode")"; output="$TMP_ROOT/lock_$mode.output"
  mkdir -p "$repo/.forge/overnight/lock"
  if [[ "$mode" == active ]]; then
    printf '{"pid":%s,"run_id":"active"}\n' "$$" > "$repo/.forge/overnight/lock/owner.json"
    if run_runner "$repo" >"$output" 2>&1; then fail "active lock accepted"; return; fi
    assert grep -q ACTIVE_LOCK "$output" && pass
  else
    printf '{"pid":99999999,"run_id":"stale"}\n' > "$repo/.forge/overnight/lock/owner.json"
    assert run_runner "$repo" >/dev/null && assert compgen -G "$repo/.forge/overnight/lock.stale-*" >/dev/null && pass
  fi
}

test_resume() {
  CURRENT_TEST=resume; local repo; repo="$(make_repo resume)"
  assert run_runner "$repo" >/dev/null
  local head; head="$(git -C "$repo" rev-parse HEAD)"
  FORGE_OVERNIGHT_SKIP_FETCH=1 FORGE_OVERNIGHT_PLATFORM=arch \
    bash "$repo/tools/overnight/forge-overnight-deterministic.sh" --repo "$repo" --queue "$repo/queue.json" --no-push --resume >/dev/null
  assert test "$head" = "$(git -C "$repo" rev-parse HEAD)" && pass
}

test_platform() {
  local platform="$1"; CURRENT_TEST="platform_$platform"; local repo output
  repo="$(make_repo "platform_$platform")"
  output="$(FORGE_TEST_PLATFORM="$platform" run_runner "$repo")"
  assert grep -q "\"platform\":\"$platform\"" "$repo/.forge/overnight/logs/"*/run.log
  if [[ "$platform" == arch ]] && grep -R -q '/data/data/com.termux\\|termux-wake' "$repo/.forge/overnight/logs"; then
    fail "Termux-specific invocation or path found in Arch log"
    return
  fi
  pass
}

test_dry_run() {
  CURRENT_TEST=dry_run; local repo before; repo="$(make_repo dry_run change)"
  before="$(git -C "$repo" rev-parse HEAD)"
  FORGE_OVERNIGHT_PLATFORM=arch bash "$repo/tools/overnight/forge-overnight-deterministic.sh" \
    --repo "$repo" --queue "$repo/queue.json" --dry-run >"$repo/dry"
  assert grep -q DRY_RUN=PASS "$repo/dry"
  assert test "$before" = "$(git -C "$repo" rev-parse HEAD)"
  assert test ! -e "$repo/.forge/overnight/state.json" && pass
}

test_push_disabled() {
  CURRENT_TEST=push_disabled; local repo; repo="$(make_repo push_disabled change)"
  assert run_runner "$repo" >/dev/null
  assert test "$(git --git-dir="$TMP_ROOT/push_disabled.git" rev-parse test/overnight)" != "$(git -C "$repo" rev-parse HEAD)" && pass
}

test_push_failed() {
  CURRENT_TEST=push_failed_preserves_commit; local repo before output; repo="$(make_repo push_failed change)"; output="$TMP_ROOT/push_failed.output"
  before="$(git -C "$repo" rev-parse HEAD)"
  git -C "$repo" remote set-url --push origin "$TMP_ROOT/missing/remote.git"
  node - "$repo/queue.json" <<'NODE'
const fs=require('fs'), f=process.argv[2], q=JSON.parse(fs.readFileSync(f)); q.jobs[0].push=true; fs.writeFileSync(f,JSON.stringify(q));
NODE
  git -C "$repo" add queue.json && git -C "$repo" commit -qm 'test: enable push failure'
  before="$(git -C "$repo" rev-parse HEAD)"
  if FORGE_OVERNIGHT_SKIP_FETCH=1 FORGE_OVERNIGHT_PLATFORM=arch \
    bash "$repo/tools/overnight/forge-overnight-deterministic.sh" --repo "$repo" --queue "$repo/queue.json" --push --restart >"$output" 2>&1; then
    fail "push unexpectedly passed"; return
  fi
  assert test "$before" != "$(git -C "$repo" rev-parse HEAD)"
  assert grep -q PASS_COMMIT_PUSH_FAILED "$repo/.forge/overnight/state.json" && pass
}

test_rollback_preserves_prior() {
  CURRENT_TEST=rollback_preserves_preexisting_file; local repo; repo="$(make_repo rollback fail-verify)"
  printf 'prior\n' > "$repo/allowed.txt"; git -C "$repo" add allowed.txt; git -C "$repo" commit -qm 'test: prior file'
  if run_runner "$repo" >/dev/null 2>&1; then fail "failure expected"; return; fi
  assert grep -qx prior "$repo/allowed.txt" && pass
}

test_failed_gate_prevents_commit() {
  CURRENT_TEST=failed_global_gate_prevents_commit
  local repo before
  repo="$(make_repo gate_failure change)"
  node - "$repo/package.json" <<'NODE'
const fs=require('fs'), f=process.argv[2], p=JSON.parse(fs.readFileSync(f));
p.scripts.lint='exit 23'; fs.writeFileSync(f, JSON.stringify(p));
NODE
  git -C "$repo" add package.json
  git -C "$repo" commit -qm 'test: failing lint gate'
  before="$(git -C "$repo" rev-parse HEAD)"
  if run_runner "$repo" >/dev/null 2>&1; then fail "failing gate accepted"; return; fi
  assert test "$before" = "$(git -C "$repo" rev-parse HEAD)"
  assert grep -q GLOBAL_GATE_FAILED "$repo/.forge/overnight/state.json"
  pass
}

test_signal() {
  CURRENT_TEST=signal_interruption
  local repo pid
  repo="$(make_repo signal timeout)"
  node - "$repo/queue.json" <<'NODE'
const fs=require('fs'), f=process.argv[2], q=JSON.parse(fs.readFileSync(f));
q.jobs[0].commands=[{command:'sleep 60',timeout_seconds:120}];
q.jobs[0].timeout_seconds=120; fs.writeFileSync(f,JSON.stringify(q));
NODE
  git -C "$repo" add queue.json
  git -C "$repo" commit -qm 'test: signal command'
  FORGE_OVERNIGHT_SKIP_FETCH=1 FORGE_OVERNIGHT_PLATFORM=arch \
    bash "$repo/tools/overnight/forge-overnight-deterministic.sh" \
      --repo "$repo" --queue "$repo/queue.json" --no-push --restart >"$TMP_ROOT/signal.output" 2>&1 &
  pid=$!
  for _ in $(seq 1 100); do
    [[ -f "$repo/.forge/overnight/state.json" ]] && grep -q '"status": "RUNNING"' "$repo/.forge/overnight/state.json" && break
    sleep 0.05
  done
  kill -TERM "$pid"
  if wait "$pid"; then fail "signal returned success"; return; fi
  assert grep -q '"result": "INTERRUPTED"' "$repo/.forge/overnight/state.json"
  assert test ! -d "$repo/.forge/overnight/lock"
  pass
}

test_validator_mutation invalid_schema 'q.schema_version=99' QUEUE_SCHEMA_VERSION
test_validator_mutation duplicate_ids 'q.jobs.push({...q.jobs[0]})' JOB_DUPLICATE_ID
test_validator_mutation missing_dependency 'q.jobs[0].depends_on=["missing"]' JOB_DEPENDENCY_MISSING
test_validator_mutation later_dependency 'q.jobs.push({...q.jobs[0],id:"job-two"});q.jobs[0].depends_on=["job-two"]' JOB_DEPENDENCY_NOT_PRIOR
test_validator_mutation cyclic_dependency 'q.jobs.push({...q.jobs[0],id:"job-two",depends_on:["job-one"]});q.jobs[0].depends_on=["job-two"]' JOB_DEPENDENCY_NOT_PRIOR
test_validator_mutation empty_commands 'q.jobs[0].commands=[]' JOB_COMMANDS
test_validator_mutation empty_verify 'q.jobs[0].verify=[]' JOB_VERIFY
test_validator_mutation unsafe_path 'q.jobs[0].allowed_changed_paths=["../escape"]' JOB_ALLOWED_PATHS
test_validator_mutation empty_commit 'q.jobs[0].commit_message=" "' JOB_COMMIT_MESSAGE
test_validator_mutation bad_retry 'q.jobs[0].retry_limit=-1' JOB_RETRY_LIMIT
test_validator_mutation bad_timeout 'q.jobs[0].timeout_seconds=0' JOB_TIMEOUT
test_valid_queue
test_success
test_expected_failure command_failure fail-command COMMAND_FAILED
test_expected_failure verification_failure fail-verify VERIFY_FAILED
test_expected_failure timeout timeout COMMAND_TIMEOUT
test_repair
test_expected_failure repair_failure repair-fail COMMAND_FAILED
test_no_changes
test_change_commit_gates
test_expected_failure outside_scope outside OUTSIDE_ALLOWED_PATHS
test_expected_failure forbidden_scope forbidden FORBIDDEN_CHANGED_PATHS
test_push_disabled
test_push_failed
test_resume
test_lock active
test_lock stale
test_stdin
test_multi multi 3
test_multi multi-verify 3
test_rollback_preserves_prior
test_failed_gate_prevents_commit
test_signal
test_main
test_platform termux
test_platform arch
test_dry_run

printf 'TESTS_TOTAL=%s\nTESTS_PASSED=%s\nTESTS_FAILED=%s\n' "$((PASS_COUNT + FAIL_COUNT))" "$PASS_COUNT" "$FAIL_COUNT"
(( FAIL_COUNT == 0 ))
