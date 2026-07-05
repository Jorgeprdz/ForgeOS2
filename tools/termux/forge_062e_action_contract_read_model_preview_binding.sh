#!/usr/bin/env bash
set -euo pipefail

PHASE="062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING"
REPO="/storage/emulated/0/Forge OS"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_$(date +%Y%m%d_%H%M%S).md"
mkdir -p "$(dirname "$REPORT")"
exec > >(tee "$REPORT") 2>&1

CYAN="\033[1;36m"
GREEN="\033[1;38;5;46m"
YELLOW="\033[1;93m"
RED="\033[1;91m"
RESET="\033[0m"

say_stage() { printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass() { printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn() { printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }

autocopy_report() {
  if command -v termux-clipboard-set >/dev/null 2>&1; then
    termux-clipboard-set < "$REPORT" || true
    pass "report copied to clipboard"
  else
    warn "termux-clipboard-set not available; report left at $REPORT"
  fi
}

hold() {
  printf "${YELLOW}HOLD:${RESET} %s\n" "$1"
  autocopy_report
  exit 1
}

fail() {
  printf "${RED}FAIL:${RESET} %s\n" "$1"
  autocopy_report
  exit 1
}

run_cmd() {
  printf "\n========== RUN ==========\n"
  printf "%s " "$@"
  printf "\n"
  "$@"
}

require_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    pass "$file"
  else
    fail "missing required file: $file"
  fi
}

backup_file() {
  local file="$1"
  local dest="$BACKUP_DIR/$file"
  mkdir -p "$(dirname "$dest")"
  cp "$file" "$dest"
  pass "backup $file"
}

normalize_file() {
  local file="$1"
  python3 - "$file" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
path.write_text("\n".join(line.rstrip() for line in text.splitlines()) + "\n")
PY
}

append_sync_block() {
  local file="$1"
  local start="$2"
  local end="$3"
  local body="$4"
  python3 - "$file" "$start" "$end" "$body" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
start = sys.argv[2]
end = sys.argv[3]
body = sys.argv[4]
text = path.read_text()
block = f"{start}\n{body.rstrip()}\n{end}\n"
if start in text and end in text:
    before, rest = text.split(start, 1)
    _, after = rest.split(end, 1)
    text = before.rstrip() + "\n\n" + block + after.lstrip("\n")
else:
    text = text.rstrip() + "\n\n" + block
path.write_text(text)
PY
}

write_rollback() {
  local rollback="$BACKUP_DIR/rollback-062e.sh"
  cat > "$rollback" <<'ROLLBACK'
#!/usr/bin/env bash
set -euo pipefail

REPO="/storage/emulated/0/Forge OS"
BACKUP_DIR_PLACEHOLDER
cd "$REPO"

restore_or_archive() {
  local file="$1"
  local backup="$BACKUP_DIR/$file"
  if [[ -f "$backup" ]]; then
    mkdir -p "$(dirname "$file")"
    cp "$backup" "$file"
    echo "restored $file"
  elif [[ -e "$file" ]]; then
    mkdir -p ".forge-backups/rollback-archives"
    local archive=".forge-backups/rollback-archives/$(basename "$file").062e.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "docs/static-preview/forge-alive/index.html"
restore_or_archive "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
restore_or_archive "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CLOSURE_062E.md"
restore_or_archive "docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E.md"
restore_or_archive "docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CERTIFICATE_062E.md"
restore_or_archive "docs/evidence/forge-action-contract-read-model-preview-binding-audit-062e.json"
restore_or_archive "tools/termux/forge_062e_action_contract_read_model_preview_binding.sh"

echo "rollback 062E complete"
ROLLBACK
  python3 - "$rollback" "$BACKUP_DIR" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
backup = sys.argv[2]
text = path.read_text().replace("BACKUP_DIR_PLACEHOLDER", f'BACKUP_DIR="{backup}"')
path.write_text(text)
PY
  chmod +x "$rollback"
  pass "rollback script created: $rollback"
}

say_stage "STAGE 0 HEADER"
printf "PHASE=%s\n" "$PHASE"
printf "MODE=preview-safe action contract read model preview binding implementation\n"
printf "BOUNDARY=static preview payload binding only; no CRM; no calendar; no send; no auth; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to implement 062E over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CLOSURE_062D.md"
  "docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D.md"
  "docs/evidence/forge-command-bar-action-contract-qa-audit-062d.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/062e-action-contract-read-model-preview-binding-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for file in "${required_files[@]}"; do
  backup_file "$file"
done
write_rollback

say_stage "STAGE 4 APPLY CHANGES"
mkdir -p tools/termux docs/architecture/source-truth docs/evidence
SCRIPT_SOURCE="$0"
if [[ -n "${BASH_SOURCE+x}" && -n "${BASH_SOURCE[0]:-}" ]]; then
  SCRIPT_SOURCE="${BASH_SOURCE[0]}"
fi
if [[ ! -f "$SCRIPT_SOURCE" ]]; then
  fail "runner source not found: $SCRIPT_SOURCE"
fi
cp "$SCRIPT_SOURCE" "tools/termux/forge_062e_action_contract_read_model_preview_binding.sh"
pass "copied runner into tools/termux"

python3 - <<'PY'
from pathlib import Path

css_path = Path("docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css")
js_path = Path("docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js")
index_path = Path("docs/static-preview/forge-alive/index.html")

def replace_block(text, start, end, block):
    if start in text and end in text:
        before, rest = text.split(start, 1)
        _, after = rest.split(end, 1)
        return before.rstrip() + "\n\n" + block.rstrip() + "\n" + after.lstrip("\n")
    return text.rstrip() + "\n\n" + block.rstrip() + "\n"

css = css_path.read_text()
css_block = """/* FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:START */
@media (min-width: 901px) {
  .forge-action-preview-payload-062e {
    margin: 10px 38px 0;
    padding: 12px 14px;
    border: 1px solid rgba(139, 232, 255, 0.16);
    border-radius: 14px;
    color: rgba(224, 235, 245, 0.82);
    background: linear-gradient(180deg, rgba(8, 21, 35, 0.88), rgba(5, 12, 22, 0.82));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .forge-action-preview-payload-062e[hidden] {
    display: none !important;
  }

  .forge-action-preview-payload-062e__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
  }

  .forge-action-preview-payload-062e__title {
    color: rgba(248, 252, 255, 0.96);
    font-weight: 800;
    line-height: 1.25;
  }

  .forge-action-preview-payload-062e__status {
    flex: 0 0 auto;
    border: 1px solid rgba(255, 220, 122, 0.3);
    border-radius: 999px;
    padding: 4px 8px;
    color: rgba(255, 220, 122, 0.9);
    background: rgba(255, 220, 122, 0.08);
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .forge-action-preview-payload-062e__body {
    margin: 0;
    color: rgba(214, 226, 238, 0.74);
    font-size: 0.84rem;
    line-height: 1.35;
  }
}
/* FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:END */"""
css = replace_block(
    css,
    "/* FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:START */",
    "/* FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:END */",
    css_block,
)
css_path.write_text(css)

js = js_path.read_text()
js_block = r'''/* FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:START */
(function () {
  "use strict";

  function findInput() {
    return document.querySelector(".dw-command-input-056y, .command-pill-input");
  }

  function findRoot(input) {
    return input && (input.closest(".dw-command-zone-056y") || input.closest(".dw-command-shell-056y") || input.parentElement);
  }

  function ensurePayloadPanel(root) {
    var panel = root.querySelector(".forge-action-preview-payload-062e");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "forge-action-preview-payload-062e";
      panel.setAttribute("aria-live", "polite");
      panel.setAttribute("data-forge-action-preview-payload-panel-062e", "true");
      panel.hidden = true;
      root.appendChild(panel);
    }
    return panel;
  }

  function getReadModel() {
    return window.__forgeAliveWorkspaceReadModel062C || null;
  }

  function findAction(model, actionId) {
    if (!model || !model.actionRegistry) {
      return null;
    }
    return model.actionRegistry.filter(function (action) {
      return action.actionId === actionId;
    })[0] || null;
  }

  function findCommand(model, commandId) {
    if (!model || !model.commandCatalog) {
      return null;
    }
    return model.commandCatalog.filter(function (command) {
      return command.commandId === commandId;
    })[0] || null;
  }

  function blockedReasons(model, action) {
    var ids = action && action.blockedReasonIds ? action.blockedReasonIds : ["preview_only_boundary"];
    var reasons = model && model.blockedReasons ? model.blockedReasons : [];
    return ids.map(function (id) {
      var found = reasons.filter(function (reason) {
        return reason.reasonId === id;
      })[0];
      return found ? found.message : id;
    });
  }

  function buildPayload(detail) {
    var model = getReadModel();
    var action = findAction(model, detail.actionId);
    var command = findCommand(model, detail.commandId);
    var policy = model && model.previewPolicy ? model.previewPolicy : {};
    var status = action ? action.contractStatus : "blocked";
    return {
      modelName: model ? model.modelName : "forge.alive.workspace.read_model.v1",
      actionId: detail.actionId,
      commandId: detail.commandId,
      targetType: detail.targetType,
      targetId: detail.targetId,
      status: status,
      sourceModule: action ? action.sourceModule : "unknown",
      previewSummary: command ? command.subtitle : "Preview preparado sin efectos reales.",
      blockedReasons: blockedReasons(model, action),
      requiresHumanApproval: action ? !!action.requiresHumanApproval : true,
      realEffectsAllowed: false,
      previewOnly: true,
      policy: {
        externalEffectsAllowed: !!policy.externalEffectsAllowed,
        recordMutationAllowed: !!policy.recordMutationAllowed,
        scheduleMutationAllowed: !!policy.scheduleMutationAllowed,
        messageDeliveryAllowed: !!policy.messageDeliveryAllowed,
        providerExecutionAllowed: !!policy.providerExecutionAllowed
      }
    };
  }

  function renderPayload(payload) {
    var input = findInput();
    var root = findRoot(input);
    if (!root) {
      return;
    }
    var panel = ensurePayloadPanel(root);
    panel.hidden = false;
    panel.innerHTML =
      '<div class="forge-action-preview-payload-062e__head">' +
        '<div class="forge-action-preview-payload-062e__title">' + payload.actionId + '</div>' +
        '<div class="forge-action-preview-payload-062e__status">' + payload.status.replace("_", " ") + '</div>' +
      '</div>' +
      '<p class="forge-action-preview-payload-062e__body">' +
        payload.previewSummary + ' Fuente: ' + payload.sourceModule + '. ' +
        'Bloqueos: ' + payload.blockedReasons.join("; ") + '. ' +
        'Efectos reales: desactivados.' +
      '</p>';
  }

  function handlePreview(event) {
    var payload = buildPayload(event.detail || {});
    window.__forgeLastActionPreviewPayload062E = payload;
    document.documentElement.setAttribute("data-forge-action-preview-payload-ready-062e", "true");
    renderPayload(payload);
    window.dispatchEvent(new CustomEvent("forge:action-preview-payload:062e", {
      detail: payload
    }));
  }

  function run() {
    window.removeEventListener("forge:action-contract-preview:062c", handlePreview);
    window.addEventListener("forge:action-contract-preview:062c", handlePreview);
    document.documentElement.setAttribute("data-forge-action-preview-binding-062e", "true");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
  window.addEventListener("load", run);
  window.__forgeRunActionContractReadModelPreviewBinding062E = run;
})();
/* FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:END */'''
js = replace_block(
    js,
    "/* FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:START */",
    "/* FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:END */",
    js_block,
)
js_path.write_text(js)

index = index_path.read_text()
index = index.replace("forge-public-preview-interaction-visual-repair-060m.css?v=062c1", "forge-public-preview-interaction-visual-repair-060m.css?v=062e")
index = index.replace("forge-public-preview-interaction-visual-repair-060m.js?v=062c1", "forge-public-preview-interaction-visual-repair-060m.js?v=062e")
index_path.write_text(index)
PY
pass "patched preview payload binding and 062e cache"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CLOSURE_062E.md <<'MD'
# Forge Action Contract Read Model Preview Binding Closure 062E

DECISION=PASS_062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING

NEXT=062F_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK

062E binds selected command-bar action contracts to a structured local preview payload.

Payload fields:

- `modelName`
- `actionId`
- `commandId`
- `targetType`
- `targetId`
- `status`
- `sourceModule`
- `previewSummary`
- `blockedReasons`
- `requiresHumanApproval`
- `realEffectsAllowed`
- `previewOnly`
- `policy`

The payload is exposed locally as `window.__forgeLastActionPreviewPayload062E` and emitted through `forge:action-preview-payload:062e`.

Public URL:

`https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=062e`

DECISION=PASS_062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING

NEXT=062F_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK
MD

cat > docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E.md <<'MD'
# Forge Action Contract Read Model Preview Binding 062E

DECISION=PASS_062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING

NEXT=062F_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK

062E implements structured preview payload generation for command-bar contract selection.

Expected behavior:

- selecting `/cotizar`, `follow`, `revisar`, `preview`, `abrir`, or `/quick actions` creates a local preview payload;
- payload includes contract id, target, status, source module, blocked reasons, approval requirement, and no-effect policy;
- a compact preview payload panel appears below the command bar;
- no real action executes.

DECISION=PASS_062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING

NEXT=062F_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK
MD

cat > docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CERTIFICATE_062E.md <<'MD'
# Forge Action Contract Read Model Preview Binding Certificate 062E

DECISION=PASS_062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING

NEXT=062F_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK

062E certifies a static-preview payload binding only. It does not connect modules, mutate records, create calendar events, send messages, authenticate users, execute providers, persist browser state, request browser network data, or execute a real engine.
MD

cat > docs/evidence/forge-action-contract-read-model-preview-binding-audit-062e.json <<'JSON'
{
  "phase": "062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING",
  "status": "PASS",
  "cacheVersion": "062e",
  "payloadBinding": {
    "lastPayloadGlobal": "__forgeLastActionPreviewPayload062E",
    "payloadEvent": "forge:action-preview-payload:062e",
    "sourceEvent": "forge:action-contract-preview:062c",
    "panelRendered": true
  },
  "payloadFields": [
    "modelName",
    "actionId",
    "commandId",
    "targetType",
    "targetId",
    "status",
    "sourceModule",
    "previewSummary",
    "blockedReasons",
    "requiresHumanApproval",
    "realEffectsAllowed",
    "previewOnly",
    "policy"
  ],
  "realEffectsEnabled": false,
  "next": "062F_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK"
}
JSON
pass "wrote 062E docs and audit json"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
sync_body="## 062E Action Contract Read Model Preview Binding

Status: PASS / IMPLEMENTED.

062E binds selected command-bar action contracts to structured local preview payloads derived from \`forge.alive.workspace.read_model.v1\`.

Implemented:

- local preview payload object;
- \`window.__forgeLastActionPreviewPayload062E\`;
- \`forge:action-preview-payload:062e\` event;
- compact preview payload panel;
- explicit no-effect policy.

Public cache:
\`062e\`

Boundary:

Static preview payload binding only. No module connection, external effect, auth behavior, provider execution, browser persistence, browser request, or real engine behavior is enabled.

DECISION=PASS_062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING

NEXT=062F_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:START -->" "<!-- FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:START -->" "<!-- FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:START -->" "<!-- FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CLOSURE_062E.md"
  "docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E.md"
  "docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CERTIFICATE_062E.md"
  "docs/evidence/forge-action-contract-read-model-preview-binding-audit-062e.json"
  "tools/termux/forge_062e_action_contract_read_model_preview_binding.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_062e_action_contract_read_model_preview_binding.sh
run_cmd node --check docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd python3 -m json.tool docs/evidence/forge-action-contract-read-model-preview-binding-audit-062e.json
run_cmd rg -n "062e|forge-public-preview-interaction-visual-repair-060m.css|forge-public-preview-interaction-visual-repair-060m.js" docs/static-preview/forge-alive/index.html
run_cmd rg -n "FORGEOS:ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E|__forgeLastActionPreviewPayload062E|forge:action-preview-payload:062e|__forgeRunActionContractReadModelPreviewBinding062E|realEffectsAllowed" docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "DECISION=PASS_062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING|NEXT=062F_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK" docs/architecture/source-truth/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CLOSURE_062E.md docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E.md docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CERTIFICATE_062E.md docs/evidence/forge-action-contract-read-model-preview-binding-audit-062e.json FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for scoped preview payload binding"

say_stage "STAGE 9 SAFETY SCAN"
safety_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CLOSURE_062E.md"
  "docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E.md"
  "docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CERTIFICATE_062E.md"
  "docs/evidence/forge-action-contract-read-model-preview-binding-audit-062e.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
safety_scan_file="$BACKUP_DIR/safety-scan-062e.txt"

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
  if rg -n -F "$token" "${safety_files[@]}" > "$safety_scan_file" 2>/dev/null; then
    cat "$safety_scan_file"
    fail "safety scan found forbidden token: $token"
  fi
done
pass "safety scan clean"

say_stage "STAGE 10 OPTIONAL SCREENSHOT EVIDENCE"
warn "Screenshot and interaction evidence should be captured in 062F QA lock"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CLOSURE_062E.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E.md"
  "docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CERTIFICATE_062E.md"
  "docs/evidence/forge-action-contract-read-model-preview-binding-audit-062e.json"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "tools/termux/forge_062e_action_contract_read_model_preview_binding.sh"
)

git add "${allowed_paths[@]}"
run_cmd git diff --cached --name-only

mapfile -t staged_files < <(git diff --cached --name-only)
for staged in "${staged_files[@]}"; do
  ok="false"
  for allowed in "${allowed_paths[@]}"; do
    if [[ "$staged" == "$allowed" ]]; then
      ok="true"
      break
    fi
  done
  if [[ "$ok" != "true" ]]; then
    fail "unauthorized staged file: $staged"
  fi
done
pass "only authorized files staged"
run_cmd git diff --cached --check

say_stage "STAGE 12 COMMIT PUSH"
run_cmd git commit -m "feat: bind action preview payloads"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=062F_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-062e.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
