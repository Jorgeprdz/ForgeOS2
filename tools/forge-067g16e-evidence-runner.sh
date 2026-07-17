#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_DIR="${FORGE_067G16E_EVIDENCE_DIR:?FORGE_067G16E_EVIDENCE_DIR is required}"
LEDGER="$EVIDENCE_DIR/ledger.jsonl"
PUPPETEER_PATH="${FORGE_PUPPETEER_CORE_PATH:?FORGE_PUPPETEER_CORE_PATH is required}"
CHROMIUM_PATH="${FORGE_CHROMIUM_PATH:?FORGE_CHROMIUM_PATH is required}"
overall=0
mkdir -p "$EVIDENCE_DIR/stdout" "$EVIDENCE_DIR/stderr" "$EVIDENCE_DIR/browser"
: > "$LEDGER"

record() {
  local name="$1" status="$2" code="$3" started="$4" ended="$5"
  printf '{"name":"%s","required":true,"status":"%s","exit_code":%s,"started_at":"%s","ended_at":"%s"}\n' "$name" "$status" "$code" "$started" "$ended" >> "$LEDGER"
  [[ "$status" == PASS ]] || overall=1
}

run_case() {
  local name="$1"; shift
  local started ended code status
  started="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  set +e
  (cd "$ROOT_DIR" && "$@") >"$EVIDENCE_DIR/stdout/$name.log" 2>"$EVIDENCE_DIR/stderr/$name.log"
  code=$?
  set -e
  ended="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  [[ $code -eq 0 ]] && status=PASS || status=FAIL
  record "$name" "$status" "$code" "$started" "$ended"
}

if [[ "${1:-}" == --self-test ]]; then
  run_case self_exit_0 bash -c 'exit 0'
  run_case self_exit_9 bash -c 'exit 9'
  grep -q '"self_exit_0".*"status":"PASS"' "$LEDGER"
  grep -q '"self_exit_9".*"status":"FAIL".*"exit_code":9' "$LEDGER"
  exit 0
fi

run_case layout_contract node tests/forge-067g16e-layout-contract-test.mjs
run_case responsive_contract node tests/forge-067g16c-responsive-contract-test.mjs
run_case canonical_renderer node tests/advisor-sales-pipeline-ui-067g10-test.js
run_case stage_integration node tests/pipeline-ui-stage-integration-067g12-test.js
run_case direct_link_contract node tests/forge-alive-static-pipeline-mount-067g16a-test.mjs
run_case home_restoration node tests/forge-alive-home-restoration-r16c-test.mjs
run_case pages_publication node tests/forge-067g16b-pages-publication-test.mjs
run_case route_performance node tests/forge-alive-constant-time-route-fastpath-test.mjs
run_case pdf_non_regression node tests/pdf-browser-parser-timeout-contract-test.mjs
run_case prior_runner_integrity node tests/forge-067g16c-runner-integrity-test.mjs
run_case geometry_browser env \
  FORGE_PUPPETEER_CORE_PATH="$PUPPETEER_PATH" \
  FORGE_CHROMIUM_PATH="$CHROMIUM_PATH" \
  FORGE_067G16E_EVIDENCE_DIR="$EVIDENCE_DIR/browser" \
  node tests/forge-067g16e-geometry-browser-test.mjs

exit "$overall"
