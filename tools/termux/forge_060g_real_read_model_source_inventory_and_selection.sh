#!/usr/bin/env bash
set -euo pipefail

PHASE="060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION"
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

phase_slug="060g-real-read-model-source-inventory-and-selection"
backup_dir=""
rollback_script=""

SELECTED_SOURCE="docs/evidence/forge-selected-engine-dry-run-audit-060e.json"
SOURCE_DOC="docs/architecture/source-truth/FORGE_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION_060G.md"
DESIGN_DOC="docs/design/forge-ui/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_060G.md"
ROADMAP_DOC="docs/roadmap/FORGE_LOCAL_READ_MODEL_SOURCE_ADAPTER_ROADMAP_060G.md"
EVIDENCE_DOC="docs/evidence/FORGE_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION_060G.md"
INVENTORY_DOC="docs/evidence/forge-real-read-model-source-inventory-060g.md"
REPO_SCRIPT="tools/termux/forge_060g_real_read_model_source_inventory_and_selection.sh"

existing_required=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_060F.md"
  "docs/design/forge-ui/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_060F.md"
  "docs/evidence/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_060F.md"
  "$SELECTED_SOURCE"
)

created_or_replaced=(
  "$SOURCE_DOC"
  "$DESIGN_DOC"
  "$ROADMAP_DOC"
  "$EVIDENCE_DOC"
  "$INVENTORY_DOC"
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
  "$INVENTORY_DOC"
  "$REPO_SCRIPT"
)

say_stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=docs/source-truth local read-model source inventory and selection"
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
rollback_script="$backup_dir/rollback-060g.sh"
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
    archive="\$dst.rollback-060g-removed-\$(date +%Y%m%d_%H%M%S)"
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
restore_or_archive "$backup_dir/$INVENTORY_DOC" "$INVENTORY_DOC"
restore_or_archive "$backup_dir/$REPO_SCRIPT" "$REPO_SCRIPT"
echo "Rollback 060G complete."
EOF_ROLLBACK
chmod +x "$rollback_script"
pass "rollback script created: $rollback_script"

say_stage "STAGE 4 APPLY CHANGES"
mkdir -p docs/architecture/source-truth docs/design/forge-ui docs/roadmap docs/evidence tools/termux
cp "$0" "$REPO_SCRIPT"
chmod +x "$REPO_SCRIPT"
pass "copied runner into tools/termux"

{
  echo "# Forge Real Read Model Source Inventory 060G"
  echo
  echo "Generated: $(date)"
  echo
  echo "Selected source: \`$SELECTED_SOURCE\`"
  echo
  echo "## JSON Candidates"
  echo
  find docs -type f \( -name "*read*model*.json" -o -name "*dry-run*audit*.json" -o -name "*report*.json" \) | sort || true
  echo
  echo "## Read Model / Report Mentions"
  echo
  rg -n --ignore-case "read model|read-model|reportPreview|report preview|dry-run audit|repo_local_read_model_source|report.open.preview" docs/architecture/source-truth docs/design docs/evidence docs/roadmap FORGE_MASTER_BUILD_TREE.md 2>/dev/null || true
} > "$INVENTORY_DOC"
pass "wrote inventory doc"

python3 - <<'PY'
from pathlib import Path

selected = "docs/evidence/forge-selected-engine-dry-run-audit-060e.json"

Path("docs/architecture/source-truth/FORGE_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION_060G.md").write_text(f"""# Forge Real Read Model Source Inventory And Selection 060G

Status: SELECTED

Decision token:
DECISION=PASS_060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION

Next:
NEXT=060H_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE

## Human Summary

Forge inspected the repo-local options for the first read-model source.

The selected source is local, structured, committed, auditable, and already proves a report preview path.

## Selected Source

`{selected}`

## Selected Source Type

`repo_local_read_model_source`

## Why This Source Wins

| Criterion | Result |
| --- | --- |
| Local to repo | PASS |
| Structured JSON | PASS |
| Deterministic | PASS |
| Read-only use | PASS |
| Preview-compatible | PASS |
| Already audited | PASS |
| External calls required | NO |

## Source Usage Boundary

060H may scope an adapter that reads this committed JSON as a local source.

060H must not:

- create a live provider connection;
- mutate the JSON source;
- write browser storage;
- write CRM;
- create calendar events;
- send messages;
- execute a real engine.

## Final Decision

DECISION=PASS_060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION

NEXT=060H_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE
""")

Path("docs/design/forge-ui/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_060G.md").write_text(f"""# Forge Selected Local Read Model Source 060G

Status: SELECTED

Decision:
DECISION=FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_060G

Next:
NEXT=060H_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE

## Selected Source

`{selected}`

## UI Meaning

The UI may eventually describe this as a local preview source, not a live provider.

Allowed wording:

- Fuente local
- Preview local
- Lectura auditada
- Datos locales de prueba

Forbidden wording:

- Fuente viva
- Sincronizado
- Conectado a CRM
- Ejecutado

## Final Decision

DECISION=FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_060G

NEXT=060H_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE
""")

Path("docs/roadmap/FORGE_LOCAL_READ_MODEL_SOURCE_ADAPTER_ROADMAP_060G.md").write_text(f"""# Forge Local Read Model Source Adapter Roadmap 060G

Status: ROADMAP

Decision:
DECISION=FORGE_LOCAL_READ_MODEL_SOURCE_ADAPTER_ROADMAP_060G

Next:
NEXT=060H_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE

## Selected Source

`{selected}`

## Sequence

1. 060G selects local source.
2. 060H scopes local source adapter.
3. 060I implements local source adapter.
4. 060J locks evidence.

## Boundary

The sequence remains local, read-only, deterministic, and preview-only.

## Final Decision

DECISION=FORGE_LOCAL_READ_MODEL_SOURCE_ADAPTER_ROADMAP_060G

NEXT=060H_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE
""")
PY
pass "wrote 060G selection docs"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
python3 - <<'PY'
from pathlib import Path

selected = "docs/evidence/forge-selected-engine-dry-run-audit-060e.json"

Path("docs/evidence/FORGE_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION_060G.md").write_text(f"""# Forge Real Read Model Source Inventory And Selection 060G

Status: PASS

Decision token:
DECISION=PASS_060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION

Next:
NEXT=060H_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE

## Evidence

Selected local read-model source:

`{selected}`

The selected source is committed JSON evidence from 060E and can be read without external calls.

## Boundary Preserved

No static preview files, CSS, JavaScript, provider runtime, CRM, calendar, send action, storage mutation, or real engine execution changed in 060G.

## Final Decision

DECISION=PASS_060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION

NEXT=060H_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE
""")
PY
pass "wrote evidence doc"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
python3 - <<'PY'
from pathlib import Path

block = """\n<!-- BEGIN FORGEOS:REAL_READ_MODEL_SOURCE_INVENTORY_SELECTION_060G -->\n## 060G Real Read Model Source Inventory And Selection\n\nStatus: PASS\n\nSelected local source:\n`docs/evidence/forge-selected-engine-dry-run-audit-060e.json`\n\n060G selects a committed local JSON source for the first read-model source adapter. No live provider is connected.\n\nDECISION=PASS_060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION\n\nNEXT=060H_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE\n<!-- END FORGEOS:REAL_READ_MODEL_SOURCE_INVENTORY_SELECTION_060G -->\n"""

targets = [
    Path("FORGE_MASTER_BUILD_TREE.md"),
    Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"),
    Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md"),
]

start = "<!-- BEGIN FORGEOS:REAL_READ_MODEL_SOURCE_INVENTORY_SELECTION_060G -->"
end = "<!-- END FORGEOS:REAL_READ_MODEL_SOURCE_INVENTORY_SELECTION_060G -->"

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
    "docs/architecture/source-truth/FORGE_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION_060G.md",
    "docs/design/forge-ui/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_060G.md",
    "docs/roadmap/FORGE_LOCAL_READ_MODEL_SOURCE_ADAPTER_ROADMAP_060G.md",
    "docs/evidence/FORGE_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION_060G.md",
    "docs/evidence/forge-real-read-model-source-inventory-060g.md",
    "tools/termux/forge_060g_real_read_model_source_inventory_and_selection.sh",
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
run_cmd python3 -m json.tool "$SELECTED_SOURCE"
warn "No JS files touched; node --check not required"
warn "No package test suite required for docs-only 060G selection"
run_cmd rg -n "DECISION=PASS_060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION|NEXT=060H_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE|forge-selected-engine-dry-run-audit-060e.json|repo_local_read_model_source" "$SOURCE_DOC" "$DESIGN_DOC" "$ROADMAP_DOC" "$EVIDENCE_DOC" "FORGE_MASTER_BUILD_TREE.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
run_cmd git diff --check

say_stage "STAGE 9 SAFETY SCAN"
scan_files=(
  "$SOURCE_DOC"
  "$DESIGN_DOC"
  "$ROADMAP_DOC"
  "$EVIDENCE_DOC"
  "$INVENTORY_DOC"
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
warn "No screenshot evidence required for docs-only 060G selection"

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
run_cmd git commit -m "docs: select local read model source"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
echo "PASS_${PHASE}_COMMIT_PUSH_COMPLETE"
echo "NEXT=060H_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_SCOPE"
echo "BACKUP=$backup_dir"
echo "ROLLBACK=$rollback_script"
echo "Reporte: $REPORT"
autocopy_report
