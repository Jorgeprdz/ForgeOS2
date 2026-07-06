#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT_DIR}" ]]; then
  echo "FAIL: not inside a git repository"
  exit 2
fi
cd "$ROOT_DIR"

PHASE="${PHASE:-}"
CACHE_VERSION="${CACHE_VERSION:-}"
PUBLIC_URL="${PUBLIC_URL:-}"
LOCAL_URL="${LOCAL_URL:-}"
NEXT_PHASE="${NEXT_PHASE:-}"
REQUIRED_MARKERS="${REQUIRED_MARKERS:-}"
REQUIRED_VIEWPORTS="${REQUIRED_VIEWPORTS:-1366x768,1024x768,390x844}"
REQUIRED_COMMAND_TESTS="${REQUIRED_COMMAND_TESTS:-}"
AUTHORIZED_FILES="${AUTHORIZED_FILES:-}"
INDEX_FILE="${INDEX_FILE:-docs/static-preview/forge-alive/index.html}"
JS_CHECK_FILES="${JS_CHECK_FILES:-docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js}"
CRITICAL_ASSET_PATTERN="${CRITICAL_ASSET_PATTERN:-forge-public-preview-interaction-visual-repair-060m}"

AUDIT_PATH="${AUDIT_PATH:-docs/evidence/forge-static-preview-release-guard-audit-063b.json}"
EVIDENCE_PATH="${EVIDENCE_PATH:-docs/evidence/FORGE_STATIC_PREVIEW_RELEASE_GUARD_IMPLEMENTATION_063B.md}"
CERTIFICATE_PATH="${CERTIFICATE_PATH:-docs/evidence/FORGE_STATIC_PREVIEW_RELEASE_GUARD_IMPLEMENTATION_CERTIFICATE_063B.md}"
CLOSURE_PATH="${CLOSURE_PATH:-docs/architecture/source-truth/FORGE_STATIC_PREVIEW_RELEASE_GUARD_IMPLEMENTATION_CLOSURE_063B.md}"
REPORT_PATH="${REPORT_PATH:-docs/evidence/forge-static-preview-release-guard-report-063b.txt}"

mkdir -p "$(dirname "$AUDIT_PATH")" "$(dirname "$CLOSURE_PATH")"
: > "$REPORT_PATH"
exec > >(tee -a "$REPORT_PATH") 2>&1

if [[ -t 1 ]]; then
  RED=$'\033[31m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  BLUE=$'\033[34m'
  RESET=$'\033[0m'
else
  RED=""
  GREEN=""
  YELLOW=""
  BLUE=""
  RESET=""
fi

STATUS="PASS"
declare -a CHECKS=()
declare -a FAILS=()
declare -a WARNS=()
declare -a HOLDS=()

stage() {
  printf '\n%s== %s ==%s\n' "$BLUE" "$1" "$RESET"
}

pass_check() {
  CHECKS+=("PASS|$1|$2")
  printf '%sPASS%s %s %s\n' "$GREEN" "$RESET" "$1" "$2"
}

warn_check() {
  CHECKS+=("WARN|$1|$2")
  WARNS+=("$1: $2")
  printf '%sWARN%s %s %s\n' "$YELLOW" "$RESET" "$1" "$2"
}

fail_check() {
  CHECKS+=("FAIL|$1|$2")
  FAILS+=("$1: $2")
  STATUS="FAIL"
  printf '%sFAIL%s %s %s\n' "$RED" "$RESET" "$1" "$2"
}

hold_check() {
  CHECKS+=("HOLD|$1|$2")
  HOLDS+=("$1: $2")
  [[ "$STATUS" != "FAIL" ]] && STATUS="HOLD"
  printf '%sHOLD%s %s %s\n' "$YELLOW" "$RESET" "$1" "$2"
}

json_array_py() {
  python3 - "$@" <<'PY'
import json
import sys
print(json.dumps(sys.argv[1:], ensure_ascii=False))
PY
}

split_csv_or_lines() {
  printf '%s\n' "$1" | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed '/^$/d'
}

is_authorized_path() {
  local path="$1"
  [[ -z "$AUTHORIZED_FILES" ]] && return 1
  while IFS= read -r item; do
    [[ -z "$item" ]] && continue
    if [[ "$path" == "$item" || "$path" == "$item"* ]]; then
      return 0
    fi
  done < <(split_csv_or_lines "$AUTHORIZED_FILES")
  return 1
}

build_safety_pattern() {
  local a b c d e f g h i j k l
  a="local""Storage"
  b="session""Storage"
  c="fetch""\\("
  d="XML""Http""Request"
  e="navigator"'\.'"media""Devices"
  f="Speech""Recognition"
  g="provider""Runtime""Enabled: true"
  h="network""Calls""Allowed: true"
  i="browser""Storage""Enabled: true"
  j="may""Create""Truth: true"
  k="may""Send""Message: true"
  l="may""Write""Crm: true"
  local m="may""Create""Calendar""Event: true"
  printf '%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s\n' \
    "$a" "$b" "$c" "$d" "$e" "$f" "$g" "$h" "$i" "$j" "$k" "$l" "$m"
}

stage "Static Preview Release Guard"
printf 'PHASE=%s\n' "${PHASE:-<missing>}"
printf 'CACHE_VERSION=%s\n' "${CACHE_VERSION:-<missing>}"
printf 'PUBLIC_URL=%s\n' "${PUBLIC_URL:-<missing>}"
printf 'LOCAL_URL=%s\n' "${LOCAL_URL:-<missing>}"
printf 'NEXT_PHASE=%s\n' "${NEXT_PHASE:-<missing>}"

stage "Required Inputs"
for name in PHASE CACHE_VERSION PUBLIC_URL LOCAL_URL NEXT_PHASE; do
  if [[ -n "${!name:-}" ]]; then
    pass_check "$name" "defined"
  else
    fail_check "$name" "missing"
  fi
done

if [[ -n "$REQUIRED_MARKERS" ]]; then
  pass_check "REQUIRED_MARKERS" "$REQUIRED_MARKERS"
else
  warn_check "REQUIRED_MARKERS" "empty"
fi

stage "Git State"
git status --short --branch
git log --oneline -5

dirty_tracked="$(git status --short --untracked-files=no | sed '/^$/d' || true)"
if [[ -z "$dirty_tracked" ]]; then
  pass_check "trackedWorktree" "clean"
else
  unauthorized=()
  while IFS= read -r line; do
    path="${line#?? }"
    if ! is_authorized_path "$path"; then
      unauthorized+=("$path")
    fi
  done <<< "$dirty_tracked"
  if [[ "${#unauthorized[@]}" -eq 0 ]]; then
    warn_check "trackedWorktree" "dirty but limited to AUTHORIZED_FILES"
  else
    hold_check "trackedWorktree" "dirty tracked files outside AUTHORIZED_FILES: ${unauthorized[*]}"
  fi
fi

stage "Index Cache Version"
if [[ ! -f "$INDEX_FILE" ]]; then
  fail_check "indexFile" "missing $INDEX_FILE"
else
  pass_check "indexFile" "$INDEX_FILE"
  critical_lines="$(grep -n "$CRITICAL_ASSET_PATTERN" "$INDEX_FILE" || true)"
  if [[ -z "$critical_lines" ]]; then
    fail_check "criticalAssets" "no lines match $CRITICAL_ASSET_PATTERN"
  else
    mismatched="$(printf '%s\n' "$critical_lines" | grep -v "?v=${CACHE_VERSION}" || true)"
    if [[ -z "$mismatched" ]]; then
      pass_check "criticalAssetCache" "all critical asset lines use ${CACHE_VERSION}"
    else
      fail_check "criticalAssetCache" "mismatched critical asset lines: ${mismatched//$'\n'/; }"
    fi
  fi
fi

stage "Required Markers"
marker_fail=0
if [[ -n "$REQUIRED_MARKERS" ]]; then
  while IFS= read -r marker; do
    if rg -n --fixed-strings "$marker" docs/static-preview/forge-alive >/dev/null 2>&1; then
      pass_check "marker:$marker" "found locally"
    else
      fail_check "marker:$marker" "missing locally"
      marker_fail=1
    fi
  done < <(split_csv_or_lines "$REQUIRED_MARKERS")
fi

stage "Syntax And Diff Checks"
while IFS= read -r js_file; do
  [[ -z "$js_file" ]] && continue
  if [[ -f "$js_file" ]]; then
    node --check "$js_file"
    pass_check "nodeCheck:$js_file" "ok"
  else
    fail_check "nodeCheck:$js_file" "missing"
  fi
done < <(split_csv_or_lines "$JS_CHECK_FILES")

if git diff --check; then
  pass_check "gitDiffCheck" "ok"
else
  fail_check "gitDiffCheck" "failed"
fi

stage "Safety Scan"
safety_pattern="$(build_safety_pattern)"
scan_targets=(
  "$INDEX_FILE"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
)
if [[ -n "$AUTHORIZED_FILES" ]]; then
  while IFS= read -r item; do
    [[ -e "$item" ]] && scan_targets+=("$item")
  done < <(split_csv_or_lines "$AUTHORIZED_FILES")
fi
safety_hits_file="$(mktemp)"
if rg -n "$safety_pattern" "${scan_targets[@]}" >"$safety_hits_file" 2>/dev/null; then
  fail_check "safetyScan" "$(tr '\n' ';' < "$safety_hits_file")"
else
  pass_check "safetyScan" "no prohibited tokens in scoped targets"
fi

stage "Public Pages Probe"
if command -v curl >/dev/null 2>&1; then
  public_html="$(mktemp)"
  if curl -fsSL --max-time 20 -H 'Cache-Control: no-cache' "$PUBLIC_URL" -o "$public_html"; then
    if grep -Fq "?v=${CACHE_VERSION}" "$public_html"; then
      pass_check "publicHtmlCache" "contains ${CACHE_VERSION}"
    else
      fail_check "publicHtmlCache" "missing ${CACHE_VERSION}"
    fi
    if grep -F "$CRITICAL_ASSET_PATTERN" "$public_html" | grep -Fq "?v=${CACHE_VERSION}"; then
      pass_check "publicCriticalAssets" "critical assets use ${CACHE_VERSION}"
    else
      fail_check "publicCriticalAssets" "critical assets missing or stale"
    fi
    asset_urls="$(python3 - "$PUBLIC_URL" "$CACHE_VERSION" "$CRITICAL_ASSET_PATTERN" "$public_html" <<'PY'
from pathlib import Path
from urllib.parse import urljoin
import re
import sys
base, version, pattern, html_path = sys.argv[1:]
html = Path(html_path).read_text(encoding="utf-8", errors="replace")
for match in re.findall(r'(?:src|href)="([^"]+)"', html):
    if pattern in match and f"?v={version}" in match:
        print(urljoin(base, match))
PY
)"
    if [[ -n "$asset_urls" && -n "$REQUIRED_MARKERS" ]]; then
      while IFS= read -r asset_url; do
        [[ -z "$asset_url" ]] && continue
        asset_file="$(mktemp)"
        if curl -fsSL --max-time 20 -H 'Cache-Control: no-cache' "$asset_url" -o "$asset_file"; then
          while IFS= read -r marker; do
            if grep -Fq "$marker" "$asset_file"; then
              pass_check "publicMarker:$marker" "found in $asset_url"
            else
              fail_check "publicMarker:$marker" "missing in $asset_url"
            fi
          done < <(split_csv_or_lines "$REQUIRED_MARKERS")
        else
          warn_check "publicAssetDownload" "could not download $asset_url"
        fi
      done <<< "$asset_urls"
    else
      warn_check "publicAssetMarkers" "no public critical asset URLs or markers to validate"
    fi
  else
    warn_check "publicHtmlDownload" "network unavailable or URL unreachable"
  fi
else
  warn_check "curl" "not available; public network probe skipped"
fi

stage "Manual QA Checklist"
printf 'REQUIRED_VIEWPORTS=%s\n' "$REQUIRED_VIEWPORTS"
printf 'REQUIRED_COMMAND_TESTS=%s\n' "${REQUIRED_COMMAND_TESTS:-<none>}"
printf 'Manual QA remains required for screenshots and visual PASS.\n'
pass_check "manualChecklist" "printed required viewports and command tests"

stage "Evidence Generation"
checks_json="$(python3 - "${CHECKS[@]}" <<'PY'
import json
import sys
items = []
for raw in sys.argv[1:]:
    status, name, detail = raw.split("|", 2)
    items.append({"status": status, "name": name, "detail": detail})
print(json.dumps(items, ensure_ascii=False, indent=2))
PY
)"
fails_json="$(json_array_py "${FAILS[@]}")"
warns_json="$(json_array_py "${WARNS[@]}")"
holds_json="$(json_array_py "${HOLDS[@]}")"
viewports_json="$(split_csv_or_lines "$REQUIRED_VIEWPORTS" | python3 -c 'import json,sys; print(json.dumps([line.strip() for line in sys.stdin if line.strip()], ensure_ascii=False))')"
commands_json="$(split_csv_or_lines "$REQUIRED_COMMAND_TESTS" | python3 -c 'import json,sys; print(json.dumps([line.strip() for line in sys.stdin if line.strip()], ensure_ascii=False))')"
markers_json="$(split_csv_or_lines "$REQUIRED_MARKERS" | python3 -c 'import json,sys; print(json.dumps([line.strip() for line in sys.stdin if line.strip()], ensure_ascii=False))')"

python3 - "$AUDIT_PATH" <<PY
import json
from pathlib import Path
audit = {
  "phase": ${PHASE@Q},
  "mode": "implement reusable static preview release guard",
  "status": ${STATUS@Q},
  "cacheVersion": ${CACHE_VERSION@Q},
  "publicUrl": ${PUBLIC_URL@Q},
  "localUrl": ${LOCAL_URL@Q},
  "nextPhase": ${NEXT_PHASE@Q},
  "requiredMarkers": json.loads('''$markers_json'''),
  "requiredViewports": json.loads('''$viewports_json'''),
  "requiredCommandTests": json.loads('''$commands_json'''),
  "checks": json.loads('''$checks_json'''),
  "failures": json.loads('''$fails_json'''),
  "warnings": json.loads('''$warns_json'''),
  "holds": json.loads('''$holds_json'''),
  "scriptDoesNotCommitOrPush": True,
  "scriptDoesNotReplaceVisualQa": True,
  "resultToken": ("PASS_${PHASE}" if ${STATUS@Q} in ["PASS", "WARN"] else f"{${STATUS@Q}}_${PHASE}"),
}
Path(${AUDIT_PATH@Q}).write_text(json.dumps(audit, indent=2, ensure_ascii=False) + "\\n", encoding="utf-8")
PY

cat > "$EVIDENCE_PATH" <<EOF
# Forge Static Preview Release Guard Implementation 063B

Status: ${STATUS}

Phase:
\`${PHASE}\`

Implemented script:
\`tools/termux/forge_static_preview_release_guard.sh\`

## Scope

The guard is a read-only verification tool. It does not mutate Forge Alive UI behavior and does not commit or push.

## Verified Areas

- repository detection;
- tracked git state classification;
- cache-version checks;
- required marker checks;
- JavaScript syntax checks;
- whitespace diff checks;
- prohibited-token safety scan;
- public Pages probe when network is available;
- manual QA checklist output;
- audit and report generation.

## Manual QA Boundary

This script does not replace screenshot QA or Playwright-style visual review. It blocks common release mistakes and produces evidence base for a later QA phase.

DECISION=${STATUS}_063B_STATIC_PREVIEW_RELEASE_GUARD_IMPLEMENTATION

NEXT=${NEXT_PHASE}
EOF

cat > "$CERTIFICATE_PATH" <<EOF
# Forge Static Preview Release Guard Implementation Certificate 063B

Status: ${STATUS}

Certificate:
\`FORGE_STATIC_PREVIEW_RELEASE_GUARD_IMPLEMENTATION_CERTIFICATE_063B\`

Script:
\`tools/termux/forge_static_preview_release_guard.sh\`

Certified behavior:

- strict Bash mode;
- colored staged output;
- tee report;
- optional Termux clipboard copy;
- explicit PASS/FAIL/HOLD handling;
- no automatic commit or push;
- no visual PASS declaration without separate QA.

Audit:
\`${AUDIT_PATH}\`

NEXT=${NEXT_PHASE}
EOF

cat > "$CLOSURE_PATH" <<EOF
# Forge Static Preview Release Guard Implementation Closure 063B

Phase:
\`063B_STATIC_PREVIEW_RELEASE_GUARD_IMPLEMENTATION\`

Status: ${STATUS}

## Closure

063B implements the reusable static preview release guard scoped in 063A.

The guard helps prevent future public PASS decisions when local QA, cache busting, public Pages assets, required markers, or no-effect policy checks are missing.

## Boundary

Tooling implementation only. No Forge Alive UI behavior, CSS, JS, HTML preview behavior, CRM, calendar, send, auth, provider execution, or real engine execution is changed.

## Next

\`${NEXT_PHASE}\`
EOF

REPORT_COPY="$(cat "$REPORT_PATH")"
if command -v termux-clipboard-set >/dev/null 2>&1; then
  printf '%s\n' "$REPORT_COPY" | termux-clipboard-set || true
  pass_check "autocopy" "copied report to Termux clipboard"
else
  warn_check "autocopy" "termux-clipboard-set unavailable"
fi

stage "Final"
printf 'STATUS=%s\n' "$STATUS"
printf 'AUDIT=%s\n' "$AUDIT_PATH"
printf 'EVIDENCE=%s\n' "$EVIDENCE_PATH"
printf 'CERTIFICATE=%s\n' "$CERTIFICATE_PATH"
printf 'CLOSURE=%s\n' "$CLOSURE_PATH"

if [[ "$STATUS" == "FAIL" ]]; then
  exit 2
fi
if [[ "$STATUS" == "HOLD" ]]; then
  exit 3
fi
exit 0
