#!/usr/bin/env bash
set -euo pipefail

PHASE="059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION"
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

phase_slug="059e-static-engine-adapter-dry-run-implementation"
backup_dir=""
rollback_script=""

INDEX_FILE="docs/static-preview/forge-alive/index.html"
DRY_RUN_JS="docs/static-preview/forge-alive/shared/forge-static-engine-adapter-dry-run-059e.js"
EVIDENCE_DOC="docs/evidence/FORGE_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION_059E.md"
CLOSURE_DOC="docs/architecture/source-truth/FORGE_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION_CLOSURE_059E.md"
CERTIFICATE_DOC="docs/evidence/FORGE_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION_CERTIFICATE_059E.md"
REPO_SCRIPT="tools/termux/forge_059e_static_engine_adapter_dry_run_implementation.sh"

existing_required=(
  "$INDEX_FILE"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_UI_ACTION_CONTRACT_SCOPE_059A.md"
  "docs/design/forge-ui/FORGE_UI_ACTION_PACKET_CONTRACT_059A.md"
  "docs/evidence/FORGE_STATIC_ACTION_PACKET_BRIDGE_059B.md"
  "docs/static-preview/forge-alive/shared/forge-static-action-packet-bridge-059b.js"
  "docs/architecture/source-truth/FORGE_ENGINE_ADAPTER_RECONNECT_SCOPE_059C.md"
  "docs/design/forge-ui/FORGE_ENGINE_ADAPTER_MAPPING_059C.md"
  "docs/architecture/source-truth/FORGE_ENGINE_ADAPTER_RECONNECT_DRY_RUN_CONTRACT_059D.md"
  "docs/design/forge-ui/FORGE_ENGINE_DRY_RUN_PACKET_CONTRACT_059D.md"
)

created_or_replaced=(
  "$DRY_RUN_JS"
  "$EVIDENCE_DOC"
  "$CLOSURE_DOC"
  "$CERTIFICATE_DOC"
  "$REPO_SCRIPT"
)

allowed_paths=(
  "$INDEX_FILE"
  "$DRY_RUN_JS"
  "$EVIDENCE_DOC"
  "$CLOSURE_DOC"
  "$CERTIFICATE_DOC"
  "$REPO_SCRIPT"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

say_stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=scoped static preview dry-run adapter implementation"
echo "BOUNDARY=static preview dry-run only; no CRM; no calendar; no send; no runtime/network/storage; no provider execution"
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
rollback_script="$backup_dir/rollback-059e.sh"
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
restore_or_remove() {
  src="\$1"
  dst="\$2"
  if [ -f "\$src" ]; then
    mkdir -p "\$(dirname "\$dst")"
    cp "\$src" "\$dst"
  else
    rm -f "\$dst"
  fi
}
restore_or_remove "$backup_dir/$INDEX_FILE" "$INDEX_FILE"
restore_or_remove "$backup_dir/$DRY_RUN_JS" "$DRY_RUN_JS"
restore_or_remove "$backup_dir/$EVIDENCE_DOC" "$EVIDENCE_DOC"
restore_or_remove "$backup_dir/$CLOSURE_DOC" "$CLOSURE_DOC"
restore_or_remove "$backup_dir/$CERTIFICATE_DOC" "$CERTIFICATE_DOC"
restore_or_remove "$backup_dir/$REPO_SCRIPT" "$REPO_SCRIPT"
restore_or_remove "$backup_dir/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
restore_or_remove "$backup_dir/docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_remove "$backup_dir/docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
echo "Rollback 059E complete."
EOF_ROLLBACK
chmod +x "$rollback_script"
pass "rollback script created: $rollback_script"

say_stage "STAGE 4 APPLY CHANGES"
mkdir -p docs/static-preview/forge-alive/shared docs/architecture/source-truth docs/evidence tools/termux
cp "$0" "$REPO_SCRIPT"
chmod +x "$REPO_SCRIPT"
pass "copied runner into tools/termux"

cat > "$DRY_RUN_JS" <<'EOF_JS'
/* FORGEOS:STATIC_ENGINE_ADAPTER_DRY_RUN_059E:START */
(function () {
  "use strict";

  var outputs = [];
  var sequence = 0;

  var adapters = {
    "quote.create.preview": "static.quote_preview",
    "policy.upload.preview": "static.document_intake",
    "client.follow.preview": "static.follow_up_draft",
    "client.call.preview": "static.call_prep",
    "client.message.preview": "static.message_draft",
    "client.search.preview": "static.client_read",
    "policy.open.preview": "static.policy_read",
    "report.open.preview": "static.report_read",
    "pipeline.review.preview": "static.pipeline_review",
    "day.review.preview": "static.daily_review"
  };

  var knownSurfaces = {
    "desktop.command_workspace": true,
    "desktop.table_row": true,
    "desktop.decision_strip": true,
    "desktop.right_rail": true,
    "mobile.command_card": true,
    "mobile.widget_grid": true,
    "mobile.bottom_nav": true
  };

  function baseOutput(packet, status) {
    sequence += 1;
    return {
      dryRunVersion: "059E.static.preview",
      dryRunId: "forge-dry-run-" + String(sequence).padStart(4, "0"),
      dryRunStatus: status,
      actionId: packet && packet.actionId ? packet.actionId : "unknown",
      packetId: packet && packet.packetId ? packet.packetId : "missing",
      adapterCandidate: "none",
      previewMode: true,
      requiresHumanApproval: true,
      executionAllowed: false,
      writesAllowed: false,
      sendAllowed: false,
      calendarAllowed: false,
      crmAllowed: false,
      auditTrace: {
        source: "059B_STATIC_ACTION_PACKET_BRIDGE",
        contract: "059D_ENGINE_ADAPTER_RECONNECT_DRY_RUN_CONTRACT",
        implementation: "059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION",
        decision: status === "DRY_RUN_ACCEPTED" ? "accepted_preview_only" : "refused"
      }
    };
  }

  function refusal(packet, reason, message) {
    var output = baseOutput(packet || {}, "DRY_RUN_REFUSED");
    output.refusal = {
      reason: reason,
      message: message
    };
    return output;
  }

  function validate(packet) {
    if (!packet || typeof packet !== "object") return refusal(packet, "MISSING_REQUIRED_FIELD", "Packet is missing.");
    if (!packet.packetVersion || String(packet.packetVersion).indexOf("059B.") !== 0) return refusal(packet, "MISSING_REQUIRED_FIELD", "packetVersion must start with 059B.");
    if (!packet.packetId) return refusal(packet, "MISSING_REQUIRED_FIELD", "packetId is required.");
    if (!packet.actionId) return refusal(packet, "MISSING_REQUIRED_FIELD", "actionId is required.");
    if (!adapters[packet.actionId]) return refusal(packet, "UNKNOWN_ACTION_ID", "Action id is not allowlisted.");
    if (!packet.sourceSurface || !knownSurfaces[packet.sourceSurface]) return refusal(packet, "UNSUPPORTED_SURFACE", "Source surface is unknown.");
    if (packet.previewMode !== true) return refusal(packet, "PREVIEW_MODE_REQUIRED", "Packet must be preview-only.");
    if (packet.requiresHumanApproval !== true) return refusal(packet, "HUMAN_APPROVAL_REQUIRED", "Human approval is required.");
    if (!packet.safeIntent) return refusal(packet, "MISSING_REQUIRED_FIELD", "safeIntent is required.");
    return null;
  }

  function accept(packet) {
    var output = baseOutput(packet, "DRY_RUN_ACCEPTED");
    output.adapterCandidate = adapters[packet.actionId];
    output.previewPayload = {
      title: packet.previewPayload && packet.previewPayload.title ? packet.previewPayload.title : "Preparar preview",
      body: packet.previewPayload && packet.previewPayload.body ? packet.previewPayload.body : packet.safeIntent,
      safety: "Sin envio, sin CRM, sin calendario.",
      nextStep: "Revisar preview y conservar aprobacion humana."
    };
    return output;
  }

  function publish(output) {
    outputs.push(output);
    window.__forgeStaticEngineDryRuns059E = outputs.slice();
    document.documentElement.setAttribute("data-forge-dry-run-059e", output.dryRunStatus);
    document.documentElement.setAttribute("data-forge-dry-run-count-059e", String(outputs.length));
    window.dispatchEvent(new CustomEvent("forge:static-engine-dry-run:059e", { detail: output }));
  }

  function runDry(packet) {
    var refused = validate(packet);
    var output = refused || accept(packet);
    publish(output);
    return output;
  }

  function init() {
    if (window.__forgeStaticEngineDryRun059EReady) return;
    window.__forgeStaticEngineDryRun059EReady = true;
    window.__forgeStaticEngineDryRuns059E = outputs;
    window.__forgeRunStaticEngineDryRun059E = runDry;
    window.addEventListener("forge:static-action-packet:059b", function (event) {
      runDry(event.detail);
    });
    document.documentElement.setAttribute("data-forge-engine-dry-run-059e", "ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
/* FORGEOS:STATIC_ENGINE_ADAPTER_DRY_RUN_059E:END */
EOF_JS
pass "wrote $DRY_RUN_JS"

python3 - <<'PY'
from pathlib import Path
path = Path("docs/static-preview/forge-alive/index.html")
text = path.read_text()
line = '  <script src="./shared/forge-static-engine-adapter-dry-run-059e.js?v=059e" defer></script>\n'
if "forge-static-engine-adapter-dry-run-059e.js" not in text:
    anchor = '  <script src="./shared/forge-static-action-packet-bridge-059b.js?v=059b" defer></script>\n'
    if anchor in text:
        text = text.replace(anchor, anchor + line, 1)
    else:
        text = text.replace("</body>", line + "</body>", 1)
path.write_text(text)
PY
pass "patched index load order"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > "$EVIDENCE_DOC" <<'EOF_EVIDENCE'
# Forge Static Engine Adapter Dry Run Implementation 059E

Status: IMPLEMENTED

Decision token:
DECISION=PASS_059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION

Next:
NEXT=059F_ENGINE_RECONNECT_VISUAL_QA_AND_AUDIT_LOCK

## Scope

059E implements a static preview-only dry-run adapter.

It listens for `forge:static-action-packet:059b` events and emits local in-memory
dry-run outputs with either `DRY_RUN_ACCEPTED` or `DRY_RUN_REFUSED`.

## Files

- `docs/static-preview/forge-alive/shared/forge-static-engine-adapter-dry-run-059e.js`
- `docs/static-preview/forge-alive/index.html`
- `tools/termux/forge_059e_static_engine_adapter_dry_run_implementation.sh`

## Safety

Every dry-run output keeps:

- `previewMode: true`;
- `requiresHumanApproval: true`;
- `executionAllowed: false`;
- `writesAllowed: false`;
- `sendAllowed: false`;
- `calendarAllowed: false`;
- `crmAllowed: false`.

## Final Decision

DECISION=PASS_059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION

NEXT=059F_ENGINE_RECONNECT_VISUAL_QA_AND_AUDIT_LOCK
EOF_EVIDENCE

cat > "$CLOSURE_DOC" <<'EOF_CLOSURE'
# Forge Static Engine Adapter Dry Run Implementation Closure 059E

Status: CLOSED

Decision token:
DECISION=PASS_059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION

Next:
NEXT=059F_ENGINE_RECONNECT_VISUAL_QA_AND_AUDIT_LOCK

## Closure

059E closes the first UI packet to adapter dry-run connection.

This is not live engine execution. The implementation is local, static, preview-only,
and approval-gated by default.

## Final Decision

DECISION=PASS_059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION

NEXT=059F_ENGINE_RECONNECT_VISUAL_QA_AND_AUDIT_LOCK
EOF_CLOSURE

cat > "$CERTIFICATE_DOC" <<'EOF_CERTIFICATE'
# Forge Static Engine Adapter Dry Run Implementation Certificate 059E

Status: CERTIFIED

Certified boundary:

- no provider execution;
- no message send;
- no CRM write;
- no calendar creation;
- no browser storage mutation;
- no live external data access;
- preview-only dry-run output.

DECISION=PASS_059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION

NEXT=059F_ENGINE_RECONNECT_VISUAL_QA_AND_AUDIT_LOCK
EOF_CERTIFICATE
pass "wrote docs / evidence"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
python3 - <<'PY'
from pathlib import Path

block = """
<!-- BEGIN FORGEOS:STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION_059E -->

## 059E Static Engine Adapter Dry Run Implementation

Status: IMPLEMENTED

Current lane:

- `059A_UI_ACTION_CONTRACT_SCOPE`: COMPLETE
- `059B_STATIC_ACTION_PACKET_BRIDGE`: COMPLETE
- `059C_ENGINE_ADAPTER_RECONNECT_SCOPE`: COMPLETE
- `059D_ENGINE_ADAPTER_RECONNECT_DRY_RUN_CONTRACT`: COMPLETE
- `059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION`: COMPLETE
- `059F_ENGINE_RECONNECT_VISUAL_QA_AND_AUDIT_LOCK`: NEXT

Decision:

DECISION=PASS_059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION

NEXT=059F_ENGINE_RECONNECT_VISUAL_QA_AND_AUDIT_LOCK

<!-- END FORGEOS:STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION_059E -->
"""

for name in [
    "FORGE_MASTER_BUILD_TREE.md",
    "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
    "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
]:
    path = Path(name)
    text = path.read_text()
    if "FORGEOS:STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION_059E" not in text:
        text = text.rstrip() + "\n" + block
        path.write_text(text)
PY
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
python3 - <<'PY'
from pathlib import Path
files = [
    "docs/static-preview/forge-alive/index.html",
    "docs/static-preview/forge-alive/shared/forge-static-engine-adapter-dry-run-059e.js",
    "docs/evidence/FORGE_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION_059E.md",
    "docs/architecture/source-truth/FORGE_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION_CLOSURE_059E.md",
    "docs/evidence/FORGE_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION_CERTIFICATE_059E.md",
    "tools/termux/forge_059e_static_engine_adapter_dry_run_implementation.sh",
    "FORGE_MASTER_BUILD_TREE.md",
    "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
    "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
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
run_cmd node --check "$DRY_RUN_JS"
warn "No package test suite required for scoped static preview dry-run bridge"
run_cmd rg -n "FORGEOS:STATIC_ENGINE_ADAPTER_DRY_RUN_059E|DRY_RUN_ACCEPTED|DRY_RUN_REFUSED|executionAllowed|forge:static-engine-dry-run:059e|__forgeRunStaticEngineDryRun059E" "$DRY_RUN_JS"
run_cmd rg -n "forge-static-engine-adapter-dry-run-059e.js" "$INDEX_FILE"
run_cmd git diff --check

say_stage "STAGE 9 SAFETY SCAN"
scan_files=(
  "$INDEX_FILE"
  "$DRY_RUN_JS"
  "$EVIDENCE_DOC"
  "$CLOSURE_DOC"
  "$CERTIFICATE_DOC"
  "$REPO_SCRIPT"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

tokens=(
  "local""Storage"
  "session""Storage"
  "fetch""("
  "XML""HttpRequest"
  "navigator"".mediaDevices"
  "Speech""Recognition"
  "providerRuntimeEnabled"": true"
  "networkCallsAllowed"": true"
  "browserStorageEnabled"": true"
  "mayCreateTruth"": true"
  "maySendMessage"": true"
  "mayWriteCrm"": true"
  "mayCreateCalendarEvent"": true"
)

for token in "${tokens[@]}"; do
  if rg -n --fixed-strings "$token" "${scan_files[@]}"; then
    hold "Forbidden token found: $token"
  fi
done
pass "safety scan clean"

say_stage "STAGE 10 OPTIONAL SCREENSHOT EVIDENCE"
TMPDIR="${TMPDIR:-/data/data/com.termux/files/usr/tmp}"
mkdir -p "$TMPDIR" || true
warn "No screenshot evidence required for 059E implementation; 059F will lock visual/audit evidence"

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
run_cmd git commit -m "feat: add static engine adapter dry run"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
echo "PASS_${PHASE}_COMMIT_PUSH_COMPLETE"
echo "NEXT=059F_ENGINE_RECONNECT_VISUAL_QA_AND_AUDIT_LOCK"
echo "BACKUP=$backup_dir"
echo "ROLLBACK=$rollback_script"
echo "Reporte: $REPORT"
autocopy_report
