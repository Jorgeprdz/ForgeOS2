#!/usr/bin/env bash
set -euo pipefail

PHASE="060I_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION"
REPO="/storage/emulated/0/Forge OS"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_$(date +%Y%m%d_%H%M%S).md"

mkdir -p "$(dirname "$REPORT")"
exec > >(tee "$REPORT") 2>&1

CYAN="\033[1;36m"
GREEN="\033[1;38;5;46m"
YELLOW="\033[1;93m"
RED="\033[1;91m"
RESET="\033[0m"

say_stage() {
  printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"
}

pass() {
  printf "${GREEN}PASS:${RESET} %s\n" "$1"
}

warn() {
  printf "${YELLOW}WARN:${RESET} %s\n" "$1"
}

autocopy_report() {
  sync || true
  sleep 0.2 || true
  if command -v termux-clipboard-set >/dev/null 2>&1; then
    termux-clipboard-set < "$REPORT" && pass "autocopy_report -> clipboard" || warn "autocopy_report failed"
  else
    warn "termux-clipboard-set not available; report not auto-copied"
  fi
}

hold() {
  printf "${YELLOW}HOLD:${RESET} %s\n\n" "$1"
  say_stage "HOLD"
  echo "$1"
  echo "DECISION=HOLD_${PHASE}"
  echo "Reporte: $REPORT"
  autocopy_report
  exit 1
}

fail() {
  printf "${RED}NO PASS:${RESET} %s\n\n" "$1"
  say_stage "NO PASS"
  echo "$1"
  echo "DECISION=NO_PASS_${PHASE}"
  echo "Reporte: $REPORT"
  autocopy_report
  exit 1
}

run_cmd() {
  echo
  echo "========== RUN =========="
  printf '%q ' "$@"
  echo
  "$@"
}

phase_slug="060i-selected-local-read-model-source-adapter-implementation"
backup_dir=""
rollback_script=""

SELECTED_SOURCE="docs/evidence/forge-selected-engine-dry-run-audit-060e.json"
ADAPTER_JS="docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js"
CLOSURE_DOC="docs/architecture/source-truth/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_CLOSURE_060I.md"
EVIDENCE_DOC="docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_060I.md"
CERT_DOC="docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_CERTIFICATE_060I.md"
REPO_SCRIPT="tools/termux/forge_060i_selected_local_read_model_source_adapter_implementation.sh"

existing_required=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/shared/forge-report-read-model-dry-run-adapter-060d.js"
  "$SELECTED_SOURCE"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE_060H.md"
  "docs/design/forge-ui/FORGE_LOCAL_READ_MODEL_SOURCE_ADAPTER_CONTRACT_060H.md"
  "docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE_060H.md"
)

created_or_replaced=(
  "$ADAPTER_JS"
  "$CLOSURE_DOC"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$REPO_SCRIPT"
)

allowed_paths=(
  "docs/static-preview/forge-alive/index.html"
  "$ADAPTER_JS"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$CLOSURE_DOC"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$REPO_SCRIPT"
)

say_stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=scoped static preview local read-model source adapter implementation"
echo "BOUNDARY=static preview local source only; no CRM; no calendar; no send; no runtime/network/storage; no provider execution; no real engine execution"
echo "REPORT=$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "Cannot cd to repo: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [ -n "$(git diff --name-only)" ]; then
  hold "Tracked working diff exists before ${PHASE}; stopping to avoid mixing changes."
fi

if [ -n "$(git diff --cached --name-only)" ]; then
  hold "Staged files exist before ${PHASE}; stopping to avoid mixing changes."
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
for file in "${existing_required[@]}"; do
  if [ -f "$file" ]; then
    pass "$file"
  else
    hold "Missing required file: $file"
  fi
done

say_stage "STAGE 3 BACKUP"
backup_dir=".forge-backups/${phase_slug}-$(date +%Y%m%d_%H%M%S)"
rollback_script="$backup_dir/rollback-060i.sh"
mkdir -p "$backup_dir"

for file in "${existing_required[@]}" "${created_or_replaced[@]}"; do
  if [ -f "$file" ]; then
    mkdir -p "$backup_dir/$(dirname "$file")"
    cp "$file" "$backup_dir/$file"
    pass "backup $file"
  fi
done

cat > "$rollback_script" <<EOF_ROLLBACK
#!/usr/bin/env bash
set -euo pipefail
cd "$REPO"
restore_or_archive() {
  src="\$1"
  dst="\$2"
  if [ -f "\$src" ]; then
    mkdir -p "\$(dirname "\$dst")"
    cp "\$src" "\$dst"
  elif [ -e "\$dst" ]; then
    archive="\$dst.rollback-060i-removed-\$(date +%Y%m%d_%H%M%S)"
    mv "\$dst" "\$archive"
    echo "Archived rollback-created file: \$archive"
  fi
}
restore_or_archive "$backup_dir/docs/static-preview/forge-alive/index.html" "docs/static-preview/forge-alive/index.html"
restore_or_archive "$backup_dir/$ADAPTER_JS" "$ADAPTER_JS"
restore_or_archive "$backup_dir/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "$backup_dir/docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "$backup_dir/docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "$backup_dir/$CLOSURE_DOC" "$CLOSURE_DOC"
restore_or_archive "$backup_dir/$EVIDENCE_DOC" "$EVIDENCE_DOC"
restore_or_archive "$backup_dir/$CERT_DOC" "$CERT_DOC"
restore_or_archive "$backup_dir/$REPO_SCRIPT" "$REPO_SCRIPT"
echo "Rollback 060I complete."
EOF_ROLLBACK
chmod +x "$rollback_script"
pass "rollback script created: $rollback_script"

say_stage "STAGE 4 APPLY CHANGES"
mkdir -p docs/static-preview/forge-alive/shared docs/architecture/source-truth docs/evidence tools/termux
cp "$0" "$REPO_SCRIPT"
chmod +x "$REPO_SCRIPT"
pass "copied runner into tools/termux"

python3 - <<'PY'
import json
from pathlib import Path

source_path = "docs/evidence/forge-selected-engine-dry-run-audit-060e.json"
source = json.loads(Path(source_path).read_text())
snapshot = json.dumps(source, ensure_ascii=False, indent=2)

js = f'''/* FORGEOS:LOCAL_READ_MODEL_SOURCE_ADAPTER_060I:START */
(function () {{
  "use strict";

  var SOURCE_TYPE = "repo_local_read_model_source";
  var SOURCE_PATH = "{source_path}";
  var SOURCE_SNAPSHOT = {snapshot};

  function baseOutput(status) {{
    return {{
      readModelStatus: status,
      sourceType: SOURCE_TYPE,
      sourcePath: SOURCE_PATH,
      previewMode: true,
      requiresHumanApproval: true,
      executionAllowed: false,
      writesAllowed: false,
      sendAllowed: false,
      calendarAllowed: false,
      crmAllowed: false
    }};
  }}

  function refusal(reason, message) {{
    var output = baseOutput("LOCAL_READ_MODEL_REFUSED");
    output.refusal = {{
      reason: reason,
      message: message
    }};
    return output;
  }}

  function runLocalSource() {{
    var accepted = SOURCE_SNAPSHOT && SOURCE_SNAPSHOT.accepted;
    if (!accepted) {{
      return refusal("SOURCE_NOT_ACCEPTED", "Selected local source has no accepted dry-run path.");
    }}
    if (accepted.dryRunStatus !== "DRY_RUN_ACCEPTED") {{
      return refusal("SOURCE_NOT_ACCEPTED", "Selected local source is not accepted.");
    }}
    if (accepted.actionId !== "report.open.preview") {{
      return refusal("WRONG_ACTION_ID", "Selected local source is not for report.open.preview.");
    }}
    if (!accepted.reportPreview) {{
      return refusal("MISSING_REPORT_PREVIEW", "Selected local source has no report preview.");
    }}

    var output = baseOutput("LOCAL_READ_MODEL_READY");
    output.actionId = accepted.actionId;
    output.adapterCandidate = "local_read_model_source_adapter";
    output.selectedCandidate = accepted.selectedCandidate || "selected.report_read_model_preview";
    output.reportPreview = accepted.reportPreview;
    output.evidence = {{
      source: "060I static local read-model source adapter",
      sourceAuditPhase: SOURCE_SNAPSHOT.phase || "",
      decision: "local_source_ready_preview_only"
    }};
    return output;
  }}

  function handleReportDryRun(event) {{
    var detail = event && event.detail ? event.detail : null;
    if (!detail || detail.dryRunStatus !== "DRY_RUN_ACCEPTED") return;
    window.dispatchEvent(new CustomEvent("forge:local-read-model-source:060i", {{ detail: runLocalSource() }}));
  }}

  if (typeof window !== "undefined") {{
    window.__forgeRunLocalReadModelSourceAdapter060I = runLocalSource;
    window.addEventListener("forge:report-read-model-dry-run:060d", handleReportDryRun);
  }}
}})();
/* FORGEOS:LOCAL_READ_MODEL_SOURCE_ADAPTER_060I:END */
'''

Path("docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js").write_text(js)
PY
pass "wrote $ADAPTER_JS"

python3 - <<'PY'
from pathlib import Path

path = Path("docs/static-preview/forge-alive/index.html")
text = path.read_text()
new_line = '  <script src="./shared/forge-local-read-model-source-adapter-060i.js?v=060i" defer></script>'

if "forge-local-read-model-source-adapter-060i.js" not in text:
    anchor = '  <script src="./shared/forge-report-read-model-dry-run-adapter-060d.js?v=060d" defer></script>'
    if anchor not in text:
        raise SystemExit("Missing 060D script anchor in index.html")
    text = text.replace(anchor, anchor + "\n" + new_line)
    path.write_text(text)
PY
pass "patched index load order"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
python3 - <<'PY'
from pathlib import Path

Path("docs/architecture/source-truth/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_CLOSURE_060I.md").write_text("""# Forge Selected Local Read Model Source Adapter Implementation Closure 060I

Status: IMPLEMENTED

Decision token:
DECISION=PASS_060I_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION

Next:
NEXT=060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK

## Summary

060I implements a static local read-model source adapter using the selected committed JSON source from 060G.

The adapter exposes a local read-model preview and keeps all action permissions false.

## Implemented File

- `docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js`

## Boundary

No live provider, CRM write, calendar create, send action, browser persistence write, source-truth mutation, or real engine execution was introduced.

## Final Decision

DECISION=PASS_060I_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION

NEXT=060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK
""")

Path("docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_060I.md").write_text("""# Forge Selected Local Read Model Source Adapter Implementation 060I

Status: PASS

Decision token:
DECISION=PASS_060I_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION

Next:
NEXT=060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK

## Evidence

060I adds a static local read-model source adapter for the selected local source:

`docs/evidence/forge-selected-engine-dry-run-audit-060e.json`

Validation confirms:

- JS syntax passes;
- index load order includes 060I after 060D;
- local source output is `LOCAL_READ_MODEL_READY`;
- all action permissions remain false.

## Final Decision

DECISION=PASS_060I_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION

NEXT=060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK
""")

Path("docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_CERTIFICATE_060I.md").write_text("""# Forge Selected Local Read Model Source Adapter Implementation Certificate 060I

Certificate: PASS

060I implements the local read-model source adapter without connecting a live provider.

DECISION=PASS_060I_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION

NEXT=060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK
""")
PY
pass "wrote docs / evidence"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
python3 - <<'PY'
from pathlib import Path

block = """\n<!-- BEGIN FORGEOS:SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_060I -->\n## 060I Selected Local Read Model Source Adapter Implementation\n\nStatus: PASS\n\nImplemented static local source adapter:\n`docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js`\n\nSelected source:\n`docs/evidence/forge-selected-engine-dry-run-audit-060e.json`\n\nDECISION=PASS_060I_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION\n\nNEXT=060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK\n<!-- END FORGEOS:SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_060I -->\n"""

targets = [
    Path("FORGE_MASTER_BUILD_TREE.md"),
    Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"),
    Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md"),
]

start = "<!-- BEGIN FORGEOS:SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_060I -->"
end = "<!-- END FORGEOS:SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_060I -->"

for path in targets:
    text = path.read_text()
    if start in text and end in text:
        before = text.split(start)[0]
        after = text.split(end, 1)[1]
        text = before + block.lstrip("\n") + after
    else:
        text = text.rstrip() + "\n\n" + block.lstrip("\n")
    path.write_text(text)
PY
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
python3 - <<'PY'
from pathlib import Path
files = [
    "docs/static-preview/forge-alive/index.html",
    "docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js",
    "FORGE_MASTER_BUILD_TREE.md",
    "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
    "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
    "docs/architecture/source-truth/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_CLOSURE_060I.md",
    "docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_060I.md",
    "docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_CERTIFICATE_060I.md",
    "tools/termux/forge_060i_selected_local_read_model_source_adapter_implementation.sh",
]
for file in files:
    path = Path(file)
    text = path.read_text()
    normalized = "\n".join(line.rstrip() for line in text.splitlines()).rstrip() + "\n"
    path.write_text(normalized)
PY
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n "$REPO_SCRIPT"
run_cmd node --check "$ADAPTER_JS"
run_cmd node - <<'NODE'
const fs = require("fs");
const vm = require("vm");
const events = {};
const context = {
  window: {
    addEventListener(name, handler) { events[name] = handler; },
    dispatchEvent(event) { this.lastEvent = event; }
  },
  CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync("docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js", "utf8"), context);
const out = context.window.__forgeRunLocalReadModelSourceAdapter060I();
if (out.readModelStatus !== "LOCAL_READ_MODEL_READY") throw new Error("local source not ready");
if (out.executionAllowed !== false || out.sendAllowed !== false || out.crmAllowed !== false || out.calendarAllowed !== false) throw new Error("action flag unlocked");
console.log(JSON.stringify({ status: out.readModelStatus, sourceType: out.sourceType, actionId: out.actionId }, null, 2));
NODE
warn "No package test suite required for scoped static preview adapter"
run_cmd rg -n "FORGEOS:LOCAL_READ_MODEL_SOURCE_ADAPTER_060I|LOCAL_READ_MODEL_READY|LOCAL_READ_MODEL_REFUSED|repo_local_read_model_source|forge:local-read-model-source:060i|__forgeRunLocalReadModelSourceAdapter060I|executionAllowed" "$ADAPTER_JS"
run_cmd rg -n "forge-local-read-model-source-adapter-060i.js" docs/static-preview/forge-alive/index.html
run_cmd rg -n "DECISION=PASS_060I_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION|NEXT=060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK" "$CLOSURE_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "FORGE_MASTER_BUILD_TREE.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
run_cmd git diff --check

say_stage "STAGE 9 SAFETY SCAN"
scan_files=(
  "docs/static-preview/forge-alive/index.html"
  "$ADAPTER_JS"
  "$CLOSURE_DOC"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for token in \
  "localStorage" \
  "sessionStorage" \
  "fetch(" \
  "XMLHttpRequest" \
  "navigator.mediaDevices" \
  "SpeechRecognition" \
  "providerRuntimeEnabled: true" \
  "networkCallsAllowed: true" \
  "browserStorageEnabled: true" \
  "mayCreateTruth: true" \
  "maySendMessage: true" \
  "mayWriteCrm: true" \
  "mayCreateCalendarEvent: true"; do
  if rg -n --fixed-strings "$token" "${scan_files[@]}"; then
    hold "Forbidden token found: $token"
  fi
done
pass "safety scan clean"

say_stage "STAGE 10 OPTIONAL SCREENSHOT EVIDENCE"
TMPDIR="${TMPDIR:-/data/data/com.termux/files/usr/tmp}"
mkdir -p "$TMPDIR" || true
warn "No screenshot evidence required for 060I implementation; 060J will lock local-source audit evidence"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
git add "${allowed_paths[@]}"
run_cmd git diff --cached --name-only

staged_files="$(git diff --cached --name-only)"
while IFS= read -r staged; do
  [ -z "$staged" ] && continue
  allowed="no"
  for allowed_path in "${allowed_paths[@]}"; do
    if [ "$staged" = "$allowed_path" ]; then
      allowed="yes"
      break
    fi
  done
  if [ "$allowed" != "yes" ]; then
    hold "Unauthorized staged file: $staged"
  fi
done <<< "$staged_files"
pass "only authorized files staged"
run_cmd git diff --cached --check

say_stage "STAGE 12 COMMIT PUSH"
run_cmd git commit -m "feat: add local read model source adapter"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
echo "PASS_${PHASE}_COMMIT_PUSH_COMPLETE"
echo "NEXT=060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK"
echo "BACKUP=$backup_dir"
echo "ROLLBACK=$rollback_script"
echo "Reporte: $REPORT"
autocopy_report
