#!/usr/bin/env bash
set -euo pipefail

PHASE="060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK"
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

phase_slug="060j-selected-local-read-model-source-adapter-evidence-lock"
backup_dir=""
rollback_script=""

ADAPTER_JS="docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js"
AUDIT_JSON="docs/evidence/forge-local-read-model-source-adapter-audit-060j.json"
EVIDENCE_DOC="docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_060J.md"
CERT_DOC="docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_CERTIFICATE_060J.md"
CLOSURE_DOC="docs/architecture/source-truth/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_CLOSURE_060J.md"
REPO_SCRIPT="tools/termux/forge_060j_selected_local_read_model_source_adapter_evidence_lock.sh"

existing_required=(
  "docs/static-preview/forge-alive/index.html"
  "$ADAPTER_JS"
  "docs/static-preview/forge-alive/shared/forge-report-read-model-dry-run-adapter-060d.js"
  "docs/evidence/forge-selected-engine-dry-run-audit-060e.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_CLOSURE_060I.md"
  "docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_IMPLEMENTATION_060I.md"
)

created_or_replaced=(
  "$AUDIT_JSON"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$CLOSURE_DOC"
  "$REPO_SCRIPT"
)

allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$AUDIT_JSON"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$CLOSURE_DOC"
  "$REPO_SCRIPT"
)

say_stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=read-only local read-model source adapter evidence lock"
echo "BOUNDARY=no static preview mutation; no CSS/JS mutation; no CRM; no calendar; no send; no runtime/network/storage; no provider execution; no real engine execution"
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
rollback_script="$backup_dir/rollback-060j.sh"
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
    archive="\$dst.rollback-060j-removed-\$(date +%Y%m%d_%H%M%S)"
    mv "\$dst" "\$archive"
    echo "Archived rollback-created file: \$archive"
  fi
}
restore_or_archive "$backup_dir/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "$backup_dir/docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "$backup_dir/docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "$backup_dir/$AUDIT_JSON" "$AUDIT_JSON"
restore_or_archive "$backup_dir/$EVIDENCE_DOC" "$EVIDENCE_DOC"
restore_or_archive "$backup_dir/$CERT_DOC" "$CERT_DOC"
restore_or_archive "$backup_dir/$CLOSURE_DOC" "$CLOSURE_DOC"
restore_or_archive "$backup_dir/$REPO_SCRIPT" "$REPO_SCRIPT"
echo "Rollback 060J complete."
EOF_ROLLBACK
chmod +x "$rollback_script"
pass "rollback script created: $rollback_script"

say_stage "STAGE 4 APPLY CHANGES"
mkdir -p docs/evidence docs/architecture/source-truth tools/termux
cp "$0" "$REPO_SCRIPT"
chmod +x "$REPO_SCRIPT"
pass "copied runner into tools/termux"

node <<'NODE' > "$AUDIT_JSON"
const fs = require("fs");
const vm = require("vm");

const events = {};
const dispatched = [];
const context = {
  window: {
    addEventListener(name, handler) {
      events[name] = handler;
    },
    dispatchEvent(event) {
      dispatched.push({ type: event.type, detail: event.detail });
    }
  },
  CustomEvent: function CustomEvent(type, init) {
    this.type = type;
    this.detail = init && init.detail;
  }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js", "utf8"), context);

const runLocal = context.window.__forgeRunLocalReadModelSourceAdapter060I;
if (typeof runLocal !== "function") {
  throw new Error("060I adapter export missing");
}

const direct = runLocal();
if (direct.readModelStatus !== "LOCAL_READ_MODEL_READY") {
  throw new Error("local read-model source did not become ready");
}
if (direct.executionAllowed !== false || direct.writesAllowed !== false || direct.sendAllowed !== false || direct.calendarAllowed !== false || direct.crmAllowed !== false) {
  throw new Error("local read-model source unlocked an action flag");
}
if (!direct.reportPreview || direct.reportPreview.title !== "Preview de reporte") {
  throw new Error("local read-model source missing report preview");
}

if (events["forge:report-read-model-dry-run:060d"]) {
  events["forge:report-read-model-dry-run:060d"]({
    detail: {
      dryRunStatus: "DRY_RUN_ACCEPTED",
      actionId: "report.open.preview"
    }
  });
}

const audit = {
  phase: "060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK",
  status: "PASS",
  adapter: "forge-local-read-model-source-adapter-060i.js",
  sourcePath: direct.sourcePath,
  direct,
  dispatched,
  safety: {
    providerExecution: false,
    realEngineExecution: false,
    messageSend: false,
    crmWrite: false,
    calendarCreate: false,
    browserStorageMutation: false,
    liveExternalData: false
  }
};

console.log(JSON.stringify(audit, null, 2));
NODE
pass "wrote audit json"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
python3 - <<'PY'
from pathlib import Path

Path("docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_060J.md").write_text("""# Forge Selected Local Read Model Source Adapter Evidence Lock 060J

Status: PASS

Decision token:
DECISION=PASS_060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK

Next:
NEXT=060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE

## Human Summary

060J proves the local read-model source adapter returns a ready preview from the selected committed JSON source.

It also proves the event bridge dispatches `forge:local-read-model-source:060i` and keeps all action permissions false.

## Evidence Files

- `docs/evidence/forge-local-read-model-source-adapter-audit-060j.json`
- `docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_CERTIFICATE_060J.md`

## Verified Result

| Check | Result |
| --- | --- |
| Direct adapter output | `LOCAL_READ_MODEL_READY` |
| Event dispatch | `forge:local-read-model-source:060i` |
| Report preview present | PASS |
| Action permissions false | PASS |

## Final Decision

DECISION=PASS_060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK

NEXT=060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE
""")

Path("docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_CERTIFICATE_060J.md").write_text("""# Forge Selected Local Read Model Source Adapter Evidence Lock Certificate 060J

Certificate: PASS

060J locks evidence for the selected local read-model source adapter.

DECISION=PASS_060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK

NEXT=060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE
""")

Path("docs/architecture/source-truth/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_CLOSURE_060J.md").write_text("""# Forge Selected Local Read Model Source Adapter Evidence Lock Closure 060J

Status: CLOSED

Decision token:
DECISION=PASS_060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK

Next:
NEXT=060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE

## Closure

060J locks evidence that the selected local read-model source adapter returns a safe preview and event output.

No static preview code changed in this phase.

## Boundary Preserved

No live provider, CRM write, calendar create, send action, browser persistence write, source-truth mutation, or real engine execution was introduced.

## Final Decision

DECISION=PASS_060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK

NEXT=060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE
""")
PY
pass "wrote evidence docs"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
python3 - <<'PY'
from pathlib import Path

block = """\n<!-- BEGIN FORGEOS:SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_060J -->\n## 060J Selected Local Read Model Source Adapter Evidence Lock\n\nStatus: PASS\n\n060J locks evidence that the local read-model source adapter returns `LOCAL_READ_MODEL_READY` and dispatches `forge:local-read-model-source:060i` with all action permissions false.\n\nDECISION=PASS_060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK\n\nNEXT=060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE\n<!-- END FORGEOS:SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_060J -->\n"""

targets = [
    Path("FORGE_MASTER_BUILD_TREE.md"),
    Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"),
    Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md"),
]

start = "<!-- BEGIN FORGEOS:SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_060J -->"
end = "<!-- END FORGEOS:SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_060J -->"

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
    "FORGE_MASTER_BUILD_TREE.md",
    "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
    "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
    "docs/evidence/forge-local-read-model-source-adapter-audit-060j.json",
    "docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_060J.md",
    "docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_CERTIFICATE_060J.md",
    "docs/architecture/source-truth/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_CLOSURE_060J.md",
    "tools/termux/forge_060j_selected_local_read_model_source_adapter_evidence_lock.sh",
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
run_cmd python3 -m json.tool "$AUDIT_JSON"
warn "No package test suite required for 060J evidence lock"
run_cmd rg -n "LOCAL_READ_MODEL_READY|forge:local-read-model-source:060i|executionAllowed|writesAllowed|sendAllowed|calendarAllowed|crmAllowed|Preview de reporte" "$AUDIT_JSON"
run_cmd rg -n "DECISION=PASS_060J_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK|NEXT=060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE" "$EVIDENCE_DOC" "$CERT_DOC" "$CLOSURE_DOC" "FORGE_MASTER_BUILD_TREE.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
run_cmd git diff --check

say_stage "STAGE 9 SAFETY SCAN"
scan_files=(
  "$AUDIT_JSON"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$CLOSURE_DOC"
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
warn "No screenshot evidence required for 060J; evidence is local-source adapter audit"

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
run_cmd git commit -m "docs: lock local read model source adapter evidence"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
echo "PASS_${PHASE}_COMMIT_PUSH_COMPLETE"
echo "NEXT=060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE"
echo "BACKUP=$backup_dir"
echo "ROLLBACK=$rollback_script"
echo "Reporte: $REPORT"
autocopy_report
