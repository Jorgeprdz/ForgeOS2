#!/usr/bin/env bash
set -euo pipefail

PHASE="060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE"
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

phase_slug="060k-local-read-model-preview-ui-binding-scope"
backup_dir=""
rollback_script=""

SOURCE_DOC="docs/architecture/source-truth/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_060K.md"
DESIGN_DOC="docs/design/forge-ui/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_CONTRACT_060K.md"
ROADMAP_DOC="docs/roadmap/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_ROADMAP_060K.md"
EVIDENCE_DOC="docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_060K.md"
CERT_DOC="docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_CERTIFICATE_060K.md"
REPO_SCRIPT="tools/termux/forge_060k_local_read_model_preview_ui_binding_scope.sh"

existing_required=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js"
  "docs/evidence/forge-local-read-model-source-adapter-audit-060j.json"
  "docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_060J.md"
  "docs/architecture/source-truth/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_CLOSURE_060J.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

created_or_replaced=(
  "$SOURCE_DOC"
  "$DESIGN_DOC"
  "$ROADMAP_DOC"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$REPO_SCRIPT"
)

allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$SOURCE_DOC"
  "$DESIGN_DOC"
  "$ROADMAP_DOC"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$REPO_SCRIPT"
)

say_stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=docs/source-truth local read-model preview UI binding scope only"
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
rollback_script="$backup_dir/rollback-060k.sh"
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
    archive="\$dst.rollback-060k-removed-\$(date +%Y%m%d_%H%M%S)"
    mv "\$dst" "\$archive"
    echo "Archived rollback-created file: \$archive"
  fi
}
restore_or_archive "$backup_dir/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "$backup_dir/docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "$backup_dir/docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "$backup_dir/$SOURCE_DOC" "$SOURCE_DOC"
restore_or_archive "$backup_dir/$DESIGN_DOC" "$DESIGN_DOC"
restore_or_archive "$backup_dir/$ROADMAP_DOC" "$ROADMAP_DOC"
restore_or_archive "$backup_dir/$EVIDENCE_DOC" "$EVIDENCE_DOC"
restore_or_archive "$backup_dir/$CERT_DOC" "$CERT_DOC"
restore_or_archive "$backup_dir/$REPO_SCRIPT" "$REPO_SCRIPT"
echo "Rollback 060K complete."
EOF_ROLLBACK
chmod +x "$rollback_script"
pass "rollback script created: $rollback_script"

say_stage "STAGE 4 APPLY CHANGES"
mkdir -p docs/architecture/source-truth docs/design/forge-ui docs/roadmap docs/evidence tools/termux
cp "$0" "$REPO_SCRIPT"
chmod +x "$REPO_SCRIPT"
pass "copied runner into tools/termux"

python3 - <<'PY'
from pathlib import Path

Path("docs/architecture/source-truth/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_060K.md").write_text("""# Forge Local Read Model Preview UI Binding Scope 060K

Status: SCOPED

Decision token:
DECISION=PASS_060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE

Next:
NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION

## Human Summary

Forge now has a local read-model preview source. 060K defines how the static preview UI may show that preview without creating actions.

This phase does not modify HTML, CSS, JavaScript, or the visible UI.

## Binding Target

The first UI binding target is the desktop command preview area.

The binding may listen for:

`forge:local-read-model-source:060i`

and render a preview-only report panel using:

- `reportPreview.title`;
- `reportPreview.summary`;
- `reportPreview.rows`;
- source type and source path as quiet evidence labels.

## Required UI Rules

The UI binding must:

- say `Preview local` or `Lectura auditada`;
- show human review requirement;
- keep action copy as review-only;
- avoid send, CRM, calendar, approval, sync, or execution language;
- preserve all existing desktop/mobile layer boundaries.

## Forbidden UI Behavior

060L must not:

- create send buttons;
- write CRM;
- create calendar events;
- add provider calls;
- write browser storage;
- mutate source-truth;
- execute a real engine;
- imply live sync.

## Mobile / Desktop Boundary

060L may target desktop static preview first.

Mobile must not be changed unless a separate mobile binding scope is approved.

## Final Decision

DECISION=PASS_060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE

NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION
""")

Path("docs/design/forge-ui/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_CONTRACT_060K.md").write_text("""# Forge Local Read Model Preview UI Binding Contract 060K

Status: CONTRACT_SCOPED

Decision:
DECISION=FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_CONTRACT_060K

Next:
NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION

## Input Event

`forge:local-read-model-source:060i`

## Allowed Display Fields

| Source field | UI role |
| --- | --- |
| `reportPreview.title` | panel title |
| `reportPreview.summary` | panel summary |
| `reportPreview.rows` | compact evidence list |
| `sourceType` | quiet provenance chip |
| `sourcePath` | evidence label |

## Required Labels

- Preview local
- Requiere revisión humana
- Sin envío
- Sin CRM
- Sin calendario

## Forbidden Labels

- Enviar
- Guardar en CRM
- Crear evento
- Ejecutar
- Sincronizado
- Fuente viva

## Final Decision

DECISION=FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_CONTRACT_060K

NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION
""")

Path("docs/roadmap/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_ROADMAP_060K.md").write_text("""# Forge Local Read Model Preview UI Binding Roadmap 060K

Status: ROADMAP

Decision:
DECISION=FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_ROADMAP_060K

Next:
NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION

## Sequence

1. 060K scopes UI binding.
2. 060L implements desktop preview-only binding.
3. 060M locks visual/evidence QA.
4. 060N may decide whether mobile gets the same binding.

## Boundary

060L remains static preview only and must not add live provider or write-capable behavior.

## Final Decision

DECISION=FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_ROADMAP_060K

NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION
""")
PY
pass "wrote 060K binding scope docs"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
python3 - <<'PY'
from pathlib import Path

Path("docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_060K.md").write_text("""# Forge Local Read Model Preview UI Binding Scope 060K

Status: PASS

Decision token:
DECISION=PASS_060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE

Next:
NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION

## Evidence

060K scopes a UI binding for the local read-model preview event:

`forge:local-read-model-source:060i`

The phase is docs-only. It does not modify static preview HTML, CSS, or JS.

## Final Decision

DECISION=PASS_060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE

NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION
""")

Path("docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_CERTIFICATE_060K.md").write_text("""# Forge Local Read Model Preview UI Binding Scope Certificate 060K

Certificate: PASS

060K scopes preview-only UI binding for the local read-model output.

DECISION=PASS_060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE

NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION
""")
PY
pass "wrote evidence docs"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
python3 - <<'PY'
from pathlib import Path

block = """\n<!-- BEGIN FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_060K -->\n## 060K Local Read Model Preview UI Binding Scope\n\nStatus: PASS\n\n060K scopes preview-only UI binding for `forge:local-read-model-source:060i`. No static preview code is changed in this phase.\n\nDECISION=PASS_060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE\n\nNEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION\n<!-- END FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_060K -->\n"""

targets = [
    Path("FORGE_MASTER_BUILD_TREE.md"),
    Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"),
    Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md"),
]

start = "<!-- BEGIN FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_060K -->"
end = "<!-- END FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_060K -->"

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
    "docs/architecture/source-truth/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_060K.md",
    "docs/design/forge-ui/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_CONTRACT_060K.md",
    "docs/roadmap/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_ROADMAP_060K.md",
    "docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_060K.md",
    "docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_CERTIFICATE_060K.md",
    "tools/termux/forge_060k_local_read_model_preview_ui_binding_scope.sh",
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
run_cmd python3 -m json.tool docs/evidence/forge-local-read-model-source-adapter-audit-060j.json
warn "No JS files touched; node --check not required"
warn "No package test suite required for docs-only 060K scope"
run_cmd rg -n "DECISION=PASS_060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE|NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION|forge:local-read-model-source:060i|Preview local|Requiere revisión humana" "$SOURCE_DOC" "$DESIGN_DOC" "$ROADMAP_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "FORGE_MASTER_BUILD_TREE.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
run_cmd git diff --check

say_stage "STAGE 9 SAFETY SCAN"
scan_files=(
  "$SOURCE_DOC"
  "$DESIGN_DOC"
  "$ROADMAP_DOC"
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
warn "No screenshot evidence required for docs-only 060K scope"

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
run_cmd git commit -m "docs: scope local read model preview ui binding"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
echo "PASS_${PHASE}_COMMIT_PUSH_COMPLETE"
echo "NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION"
echo "BACKUP=$backup_dir"
echo "ROLLBACK=$rollback_script"
echo "Reporte: $REPORT"
autocopy_report
