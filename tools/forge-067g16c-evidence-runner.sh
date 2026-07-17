#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_DIR="${FORGE_067G16C_EVIDENCE_DIR:-${TMPDIR:-/tmp}/forge-067g16c-evidence}"
LEDGER="$EVIDENCE_DIR/ledger.jsonl"
PUPPETEER_PACKAGE="/data/data/com.termux/files/home/.forge-tools/r14h-browser-harness/node_modules/puppeteer-core"
PUPPETEER_PATH="${FORGE_PUPPETEER_CORE_PATH:-$PUPPETEER_PACKAGE/lib/puppeteer/puppeteer-core.js}"
CHROMIUM_PATH="${FORGE_CHROMIUM_PATH:-/data/data/com.termux/files/usr/bin/chromium-browser}"
overall=0
mkdir -p "$EVIDENCE_DIR/stdout" "$EVIDENCE_DIR/stderr"
: > "$LEDGER"

record(){ local n="$1" s="$2" c="$3" a="$4" b="$5"; printf '{"name":"%s","required":true,"status":"%s","exit_code":%s,"started_at":"%s","ended_at":"%s","stdout":"stdout/%s.log","stderr":"stderr/%s.log"}\n' "$n" "$s" "$c" "$a" "$b" "$n" "$n" >> "$LEDGER"; [[ "$s" == PASS ]] || overall=1; }
run_case(){ local n="$1" command="$2" a b c s; a="$(date -u +%Y-%m-%dT%H:%M:%SZ)"; set +e; (cd "$ROOT_DIR" && bash -o pipefail -c "$command") >"$EVIDENCE_DIR/stdout/$n.log" 2>"$EVIDENCE_DIR/stderr/$n.log"; c=$?; set -e; b="$(date -u +%Y-%m-%dT%H:%M:%SZ)"; [[ $c -eq 0 ]] && s=PASS || s=FAIL; record "$n" "$s" "$c" "$a" "$b"; }
block_case(){ local n="$1" reason="$2" now; now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"; : >"$EVIDENCE_DIR/stdout/$n.log"; printf '%s\n' "$reason" >"$EVIDENCE_DIR/stderr/$n.log"; record "$n" BLOCKED 127 "$now" "$now"; }

if [[ "${1:-}" == --self-test ]]; then
  run_case self_exit_0 "exit 0"
  run_case self_exit_1 "exit 1"
  run_case self_assertion_error "node -e \"require('node:assert/strict').fail('intentional')\""
  run_case self_missing_screenshot "exit 1"
  run_case self_missing_viewport "exit 1"
  run_case self_geometry_collision "exit 1"
  block_case self_missing_browser "intentional missing browser dependency"
  grep -q '"name":"self_exit_0".*"status":"PASS"' "$LEDGER"
  for n in self_exit_1 self_assertion_error self_missing_screenshot self_missing_viewport self_geometry_collision; do grep -q "\"name\":\"$n\".*\"status\":\"FAIL\"" "$LEDGER"; done
  grep -q '"name":"self_missing_browser".*"status":"BLOCKED"' "$LEDGER"
  exit 0
fi

[[ -f "$PUPPETEER_PATH" ]] && run_case preflight_puppeteer "node -e \"console.log(require('$PUPPETEER_PACKAGE/package.json').version)\"" || block_case preflight_puppeteer "Puppeteer missing"
[[ -x "$CHROMIUM_PATH" ]] && run_case preflight_chromium "'$CHROMIUM_PATH' --version" || block_case preflight_chromium "Chromium missing"
run_case responsive_contract_067g16c "node tests/forge-067g16c-responsive-contract-test.mjs"
run_case runner_integrity_067g16c "node tests/forge-067g16c-runner-integrity-test.mjs"
run_case pipeline_renderer_067g10 "node tests/advisor-sales-pipeline-ui-067g10-test.js"
run_case pipeline_stage_registry_067g11 "node tests/sales-stage-registry-067g11-test.js"
run_case pipeline_stage_integration_067g12 "node tests/pipeline-ui-stage-integration-067g12-test.js"
run_case pipeline_dashboard_067g15 "node tests/advisor-dashboard-nba-consumer-067g15-test.mjs"
run_case pipeline_mount_067g16b "node tests/forge-alive-static-pipeline-mount-067g16a-test.mjs"
run_case publication_067g16c "node tests/forge-067g16b-pages-publication-test.mjs"
run_case pdf_non_regression "node tests/pdf-browser-parser-timeout-contract-test.mjs"
run_case route_non_regression "node tests/forge-alive-constant-time-route-fastpath-test.mjs"
run_case home_non_regression "node tests/forge-alive-home-restoration-r16c-test.mjs"
run_case quote_non_regression "node tests/quote-read-model-adapter-069c-test.js"
run_case relationship_non_regression "node relationship-timeline-master-test.js"
run_case mobile_navigation_non_regression "FORGE_PUPPETEER_CORE_PATH='$PUPPETEER_PATH' FORGE_CHROMIUM_PATH='$CHROMIUM_PATH' FORGE_067G16B_EVIDENCE_DIR='$EVIDENCE_DIR/067g16b-non-regression' node tests/forge-alive-static-pipeline-mount-067g16a-browser-test.mjs"
if [[ -f "$PUPPETEER_PATH" && -x "$CHROMIUM_PATH" ]]; then
  run_case responsive_chromium_067g16c "FORGE_PUPPETEER_CORE_PATH='$PUPPETEER_PATH' FORGE_CHROMIUM_PATH='$CHROMIUM_PATH' FORGE_067G16C_EVIDENCE_DIR='$EVIDENCE_DIR' node tests/forge-067g16c-responsive-browser-test.mjs"
else block_case responsive_chromium_067g16c "Browser dependencies unavailable"; fi
exit "$overall"
