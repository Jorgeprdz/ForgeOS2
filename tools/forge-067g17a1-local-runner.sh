#!/usr/bin/env sh
set -eu

for dependency in node sh grep; do
  if ! command -v "$dependency" >/dev/null 2>&1; then
    printf '067G17A1 LOCAL RUNNER: BLOCKED missing dependency %s\n' "$dependency" >&2
    exit 2
  fi
done

if [ -n "${FORGE_067G17A1_EVIDENCE_DIR:-}" ]; then
  evidence_dir="$FORGE_067G17A1_EVIDENCE_DIR"
else
  tmp_root="$(node -p "require('node:os').tmpdir()")"
  evidence_dir="$tmp_root/forge-067g17a1-local-evidence-$$"
fi

ledger="$evidence_dir/ledger.jsonl"
if ! mkdir -p "$evidence_dir" 2>/dev/null; then
  printf '067G17A1 LOCAL RUNNER: BLOCKED evidence directory unavailable\n' >&2
  exit 2
fi
: > "$ledger"

record() {
  name="$1"
  status="$2"
  exit_code="$3"
  printf '{"name":"%s","status":"%s","exitCode":%s}\n' "$name" "$status" "$exit_code" >> "$ledger"
}

run_check() {
  name="$1"
  shift
  log="$evidence_dir/$name.log"
  if "$@" > "$log" 2>&1; then
    record "$name" PASS 0
  else
    exit_code=$?
    record "$name" FAIL "$exit_code"
    return "$exit_code"
  fi
}

run_required() {
  name="$1"
  command_name="$2"
  shift 2
  if ! command -v "$command_name" >/dev/null 2>&1; then
    record "$name" BLOCKED 2
    return 2
  fi
  run_check "$name" "$command_name" "$@"
}

run_cleanup() {
  name="$1"
  shift
  log="$evidence_dir/$name.log"
  if "$@" > "$log" 2>&1; then
    record "$name" CLEANUP_PASS 0
  else
    exit_code=$?
    record "$name" CLEANUP_FAIL "$exit_code"
    return "$exit_code"
  fi
}

require_project_ref() {
  actual="$1"
  expected="rmlxigxysujsuwzgoimv"
  [ "$actual" = "$expected" ]
}

if [ "${1:-}" = "--self-test" ]; then
  run_check self_exit_0 sh -c 'exit 0'
  if run_check self_exit_7 sh -c 'exit 7'; then exit 1; fi
  if run_required self_missing_dependency forge_067g17a1_command_that_does_not_exist; then exit 1; fi
  if run_cleanup self_cleanup_failure sh -c 'exit 9'; then exit 1; fi
  if run_check self_project_ref_mismatch require_project_ref rgcolnioakzrdtsxwscp; then exit 1; fi
  record self_remote_not_run SKIPPED 3
  grep -q '"self_exit_0","status":"PASS","exitCode":0' "$ledger"
  grep -q '"self_exit_7","status":"FAIL","exitCode":7' "$ledger"
  grep -q '"self_missing_dependency","status":"BLOCKED","exitCode":2' "$ledger"
  grep -q '"self_cleanup_failure","status":"CLEANUP_FAIL","exitCode":9' "$ledger"
  grep -q '"self_project_ref_mismatch","status":"FAIL"' "$ledger"
  grep -q '"self_remote_not_run","status":"SKIPPED","exitCode":3' "$ledger"
  printf '%s\n' '067G17A1 LOCAL RUNNER SELF-TEST: PASS'
  exit 0
fi

run_required public_config node tests/forge-067g17a1-public-config-test.mjs
run_required migration_security node tests/forge-067g17a1-migration-security-test.mjs
run_required runner_integrity node tests/forge-067g17a1-runner-integrity-test.mjs
run_required legacy_rls_foundation node tests/supabase-rls-foundation-test.js

printf '%s\n' '067G17A1 LOCAL SECURITY RUNNER: PASS'
