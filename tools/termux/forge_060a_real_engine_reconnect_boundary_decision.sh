#!/usr/bin/env bash
set -euo pipefail

PHASE="060A_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION"
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

phase_slug="060a-real-engine-reconnect-boundary-decision"
backup_dir=""
rollback_script=""

BOUNDARY_DOC="docs/architecture/source-truth/FORGE_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION_060A.md"
UI_BOUNDARY_DOC="docs/design/forge-ui/FORGE_UI_TO_REAL_ENGINE_BOUNDARY_060A.md"
ROADMAP_DOC="docs/roadmap/FORGE_REAL_ENGINE_RECONNECT_ROADMAP_060A.md"
EVIDENCE_DOC="docs/evidence/FORGE_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION_060A.md"
REPO_SCRIPT="tools/termux/forge_060a_real_engine_reconnect_boundary_decision.sh"

existing_required=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_UI_ACTION_CONTRACT_SCOPE_059A.md"
  "docs/evidence/FORGE_STATIC_ACTION_PACKET_BRIDGE_059B.md"
  "docs/architecture/source-truth/FORGE_ENGINE_ADAPTER_RECONNECT_SCOPE_059C.md"
  "docs/architecture/source-truth/FORGE_ENGINE_ADAPTER_RECONNECT_DRY_RUN_CONTRACT_059D.md"
  "docs/evidence/FORGE_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION_059E.md"
  "docs/evidence/FORGE_ENGINE_RECONNECT_VISUAL_QA_AND_AUDIT_LOCK_059F.md"
  "docs/evidence/forge-engine-reconnect-audit-059f.json"
)

created_or_replaced=(
  "$BOUNDARY_DOC"
  "$UI_BOUNDARY_DOC"
  "$ROADMAP_DOC"
  "$EVIDENCE_DOC"
  "$REPO_SCRIPT"
)

allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$BOUNDARY_DOC"
  "$UI_BOUNDARY_DOC"
  "$ROADMAP_DOC"
  "$EVIDENCE_DOC"
  "$REPO_SCRIPT"
)

say_stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=docs/source-truth real engine reconnect boundary decision only"
echo "BOUNDARY=no static preview mutation; no CSS/JS mutation; no CRM; no calendar; no send; no runtime/network/storage; no real engine execution"
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
rollback_script="$backup_dir/rollback-060a.sh"
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
restore_or_remove "$backup_dir/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
restore_or_remove "$backup_dir/docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_remove "$backup_dir/docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_remove "$backup_dir/$BOUNDARY_DOC" "$BOUNDARY_DOC"
restore_or_remove "$backup_dir/$UI_BOUNDARY_DOC" "$UI_BOUNDARY_DOC"
restore_or_remove "$backup_dir/$ROADMAP_DOC" "$ROADMAP_DOC"
restore_or_remove "$backup_dir/$EVIDENCE_DOC" "$EVIDENCE_DOC"
restore_or_remove "$backup_dir/$REPO_SCRIPT" "$REPO_SCRIPT"
echo "Rollback 060A complete."
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

Path("docs/architecture/source-truth/FORGE_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION_060A.md").write_text("""# Forge Real Engine Reconnect Boundary Decision 060A

Status: DECIDED

Decision token:
DECISION=PASS_060A_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION

Next:
NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION

## Human Summary

Forge is allowed to move from simulated motors toward real engine candidates, but only through a controlled inventory and selection stage.

060A does not connect any real engine. It decides the safety boundary for the next phase.

## Decision

The next move is not direct integration.

The next move is:

`060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION`

060B must inspect existing engines/adapters and choose the safest first reconnect target.

## Why

The UI now has:

- action contracts;
- static action packets;
- a dry-run adapter;
- evidence that accepted/refused preview outputs work.

That is enough to start evaluating real engine candidates, but not enough to execute real actions.

## Boundary For 060B

060B may:

- inventory existing engines;
- identify candidate adapters;
- compare risk by module;
- select one first reconnect target;
- define the next implementation boundary.

060B must not:

- connect providers;
- execute engines;
- send messages;
- write CRM;
- create calendar events;
- create production/compensation truth;
- mutate browser storage;
- fetch live external data.

## Candidate Selection Criteria

The first real engine candidate should be:

1. read-only or preview-only;
2. already documented in source truth;
3. compatible with human approval;
4. low blast radius;
5. auditable;
6. reversible;
7. useful to the current Forge UI.

## Recommended Candidate Order

| Priority | Candidate class | Reason |
| --- | --- | --- |
| 1 | Read-model / report preview engine | Lowest operational risk. |
| 2 | Client search/read adapter | Useful but must avoid hidden provider reads. |
| 3 | Follow-up draft adapter | Commercially useful, still no send. |
| 4 | Quote preview adapter | Useful but product assumptions require care. |
| 5 | Message draft adapter | Must remain draft-only and approval-gated. |
| 6 | CRM/calendar adapters | Higher risk; later only. |

## Final Decision

DECISION=PASS_060A_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION

NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION
""")

Path("docs/design/forge-ui/FORGE_UI_TO_REAL_ENGINE_BOUNDARY_060A.md").write_text("""# Forge UI To Real Engine Boundary 060A

Status: BOUNDARY DECIDED

Decision token:
DECISION=FORGE_UI_TO_REAL_ENGINE_BOUNDARY_060A

Next:
NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION

## UI Rule

The UI may continue to emit action packets.

The UI must not imply that a real action has happened until a later source-truth document authorizes a real adapter.

## Copy Rule

Allowed labels:

- Preparar preview
- Revisar
- Abrir preview
- Simular
- Preparar borrador

Forbidden labels until later approval:

- Enviar
- Crear en CRM
- Agendar
- Guardar como verdad
- Ejecutar

## Engine Boundary

The UI-to-engine bridge must remain:

- preview-first;
- approval-first;
- refusal-capable;
- auditable;
- reversible.

## Final Decision

DECISION=FORGE_UI_TO_REAL_ENGINE_BOUNDARY_060A

NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION
""")

Path("docs/roadmap/FORGE_REAL_ENGINE_RECONNECT_ROADMAP_060A.md").write_text("""# Forge Real Engine Reconnect Roadmap 060A

Status: ROADMAP

Decision token:
DECISION=FORGE_REAL_ENGINE_RECONNECT_ROADMAP_060A

Next:
NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION

## Sequence

### 060A_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION

Decide that Forge may approach real engine candidates only through inventory and selection.

### 060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION

Inventory existing engines/adapters and select the safest first reconnect target.

### 060C_SELECTED_ENGINE_DRY_RUN_ADAPTER_SCOPE

Scope a dry-run adapter around the selected candidate.

### 060D_SELECTED_ENGINE_DRY_RUN_IMPLEMENTATION

Implement selected engine dry-run without live provider execution.

### 060E_SELECTED_ENGINE_DRY_RUN_QA_LOCK

Lock evidence before any future live adapter decision.

## Final Decision

DECISION=FORGE_REAL_ENGINE_RECONNECT_ROADMAP_060A

NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION
""")
PY
pass "wrote 060A boundary docs"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > "$EVIDENCE_DOC" <<'EOF_EVIDENCE'
# Forge Real Engine Reconnect Boundary Decision 060A Evidence

Status: DOCUMENTED

Decision token:
DECISION=PASS_060A_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION

Next:
NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION

## Human Summary

Forge is not connecting real motors yet.

Forge is now ready to inspect which real motor should be considered first, using a conservative inventory and selection process.

## Files

- `docs/architecture/source-truth/FORGE_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION_060A.md`
- `docs/design/forge-ui/FORGE_UI_TO_REAL_ENGINE_BOUNDARY_060A.md`
- `docs/roadmap/FORGE_REAL_ENGINE_RECONNECT_ROADMAP_060A.md`
- `docs/evidence/FORGE_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION_060A.md`
- `tools/termux/forge_060a_real_engine_reconnect_boundary_decision.sh`

## Final Decision

DECISION=PASS_060A_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION

NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION
EOF_EVIDENCE
pass "wrote evidence doc"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
python3 - <<'PY'
from pathlib import Path

block = """
<!-- BEGIN FORGEOS:REAL_ENGINE_RECONNECT_BOUNDARY_DECISION_060A -->

## 060A Real Engine Reconnect Boundary Decision

Status: DECIDED

Current lane:

- `059F_ENGINE_RECONNECT_VISUAL_QA_AND_AUDIT_LOCK`: COMPLETE
- `060A_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION`: COMPLETE
- `060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION`: NEXT

Decision:

DECISION=PASS_060A_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION

NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION

<!-- END FORGEOS:REAL_ENGINE_RECONNECT_BOUNDARY_DECISION_060A -->
"""

for name in [
    "FORGE_MASTER_BUILD_TREE.md",
    "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
    "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
]:
    path = Path(name)
    text = path.read_text()
    if "FORGEOS:REAL_ENGINE_RECONNECT_BOUNDARY_DECISION_060A" not in text:
        text = text.rstrip() + "\n" + block
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
    "docs/architecture/source-truth/FORGE_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION_060A.md",
    "docs/design/forge-ui/FORGE_UI_TO_REAL_ENGINE_BOUNDARY_060A.md",
    "docs/roadmap/FORGE_REAL_ENGINE_RECONNECT_ROADMAP_060A.md",
    "docs/evidence/FORGE_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION_060A.md",
    "tools/termux/forge_060a_real_engine_reconnect_boundary_decision.sh",
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
warn "No JS files touched; node --check not required"
warn "No package test suite required for docs-only 060A boundary decision"
run_cmd rg -n "DECISION=PASS_060A_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION|NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION|read-only|preview-only|approval" "$BOUNDARY_DOC" "$UI_BOUNDARY_DOC" "$ROADMAP_DOC" "$EVIDENCE_DOC" "FORGE_MASTER_BUILD_TREE.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
run_cmd git diff --check

say_stage "STAGE 9 SAFETY SCAN"
scan_files=(
  "$BOUNDARY_DOC"
  "$UI_BOUNDARY_DOC"
  "$ROADMAP_DOC"
  "$EVIDENCE_DOC"
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
warn "No screenshot evidence required for docs-only 060A boundary decision"

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
run_cmd git commit -m "docs: decide real engine reconnect boundary"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
echo "PASS_${PHASE}_COMMIT_PUSH_COMPLETE"
echo "NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION"
echo "BACKUP=$backup_dir"
echo "ROLLBACK=$rollback_script"
echo "Reporte: $REPORT"
autocopy_report
