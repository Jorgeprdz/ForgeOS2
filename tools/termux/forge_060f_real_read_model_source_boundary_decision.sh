#!/usr/bin/env bash
set -euo pipefail

PHASE="060F_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION"
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

phase_slug="060f-real-read-model-source-boundary-decision"
backup_dir=""
rollback_script=""

SOURCE_DOC="docs/architecture/source-truth/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_060F.md"
DESIGN_DOC="docs/design/forge-ui/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_060F.md"
ROADMAP_DOC="docs/roadmap/FORGE_REAL_READ_MODEL_SOURCE_ROADMAP_060F.md"
EVIDENCE_DOC="docs/evidence/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_060F.md"
CERT_DOC="docs/evidence/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_CERTIFICATE_060F.md"
REPO_SCRIPT="tools/termux/forge_060f_real_read_model_source_boundary_decision.sh"

existing_required=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/static-preview/forge-alive/shared/forge-report-read-model-dry-run-adapter-060d.js"
  "docs/evidence/forge-selected-engine-dry-run-audit-060e.json"
  "docs/evidence/FORGE_SELECTED_ENGINE_DRY_RUN_EVIDENCE_LOCK_060E.md"
  "docs/architecture/source-truth/FORGE_SELECTED_ENGINE_DRY_RUN_EVIDENCE_LOCK_CLOSURE_060E.md"
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
echo "MODE=docs/source-truth real read-model source boundary decision only"
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
rollback_script="$backup_dir/rollback-060f.sh"
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
    archive="\$dst.rollback-060f-removed-\$(date +%Y%m%d_%H%M%S)"
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
echo "Rollback 060F complete."
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

Path("docs/architecture/source-truth/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_060F.md").write_text("""# Forge Real Read Model Source Boundary Decision 060F

Status: DECIDED

Decision token:
DECISION=PASS_060F_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION

Next:
NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION

## Human Summary

Forge has a safe report/read-model dry-run adapter. The next question is what can count as a real read-model source.

060F decides that the first real source must be local, read-only, auditable, and reversible. No live provider connection is approved yet.

## Boundary Decision

Allowed first-source category:

`repo_local_read_model_source`

This means a source already present in the repository, or a local fixture generated from committed source-truth, may be used for the next candidate inventory.

Forbidden first-source categories:

| Category | Reason |
| --- | --- |
| Live provider API | Needs a separate provider boundary. |
| CRM source | Too close to write-capable workflows. |
| Calendar source | Needs a separate calendar boundary. |
| Message source | Too close to send workflows. |
| Browser persistence | Not needed for first source. |

## Source Requirements

A candidate source for 060G must be:

- read-only;
- local to the repo or generated from committed docs;
- deterministic;
- auditable by file path;
- compatible with preview-only output;
- free of external calls;
- unable to write CRM, calendar, messages, or source-truth records.

## 060G Handoff

060G should inventory local report/read-model candidates and select one source path for a dry-run adapter integration.

## Final Decision

DECISION=PASS_060F_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION

NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION
""")

Path("docs/design/forge-ui/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_060F.md").write_text("""# Forge Real Read Model Source Boundary 060F

Status: BOUNDARY_LOCKED

Decision:
DECISION=FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_060F

Next:
NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION

## UI Meaning

The UI may say a report preview is based on a local read model only after a selected local source exists.

Until then, UI language must remain:

- Preview;
- Dry-run;
- Static;
- Requires human review.

## Allowed Future Labels

- Fuente local
- Lectura local
- Preview desde read model
- Datos de prueba auditables

## Forbidden Labels

- Conectado a CRM
- Sincronizado con calendario
- Enviado
- Ejecutado
- Fuente viva

## Final Decision

DECISION=FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_060F

NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION
""")

Path("docs/roadmap/FORGE_REAL_READ_MODEL_SOURCE_ROADMAP_060F.md").write_text("""# Forge Real Read Model Source Roadmap 060F

Status: ROADMAP

Decision:
DECISION=FORGE_REAL_READ_MODEL_SOURCE_ROADMAP_060F

Next:
NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION

## Sequence

1. 060F decides source boundary.
2. 060G inventories and selects local read-model source.
3. 060H scopes selected local source adapter.
4. 060I implements local source dry-run integration.
5. 060J locks evidence.

## Boundary

The first source path must stay local, read-only, deterministic, and preview-only.

## Final Decision

DECISION=FORGE_REAL_READ_MODEL_SOURCE_ROADMAP_060F

NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION
""")
PY
pass "wrote 060F boundary docs"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
python3 - <<'PY'
from pathlib import Path

Path("docs/evidence/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_060F.md").write_text("""# Forge Real Read Model Source Boundary Decision 060F

Status: PASS

Decision token:
DECISION=PASS_060F_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION

Next:
NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION

## Evidence

060F chooses the allowed first source category:

`repo_local_read_model_source`

This keeps the next step local, deterministic, and auditable.

## Boundary Preserved

No static preview files, CSS, JavaScript, provider runtime, CRM, calendar, send action, storage mutation, or real engine execution changed in 060F.

## Final Decision

DECISION=PASS_060F_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION

NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION
""")

Path("docs/evidence/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_CERTIFICATE_060F.md").write_text("""# Forge Real Read Model Source Boundary Decision Certificate 060F

Certificate: PASS

060F locks the first real read-model source boundary as repo-local and read-only.

DECISION=PASS_060F_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION

NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION
""")
PY
pass "wrote evidence docs"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
python3 - <<'PY'
from pathlib import Path

block = """\n<!-- BEGIN FORGEOS:REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_060F -->\n## 060F Real Read Model Source Boundary Decision\n\nStatus: PASS\n\nAllowed first-source category:\n`repo_local_read_model_source`\n\n060F does not connect a live provider. It limits the next source inventory to local, read-only, deterministic repo sources.\n\nDECISION=PASS_060F_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION\n\nNEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION\n<!-- END FORGEOS:REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_060F -->\n"""

targets = [
    Path("FORGE_MASTER_BUILD_TREE.md"),
    Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"),
    Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md"),
]

start = "<!-- BEGIN FORGEOS:REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_060F -->"
end = "<!-- END FORGEOS:REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_060F -->"

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
    "docs/architecture/source-truth/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_060F.md",
    "docs/design/forge-ui/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_060F.md",
    "docs/roadmap/FORGE_REAL_READ_MODEL_SOURCE_ROADMAP_060F.md",
    "docs/evidence/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_060F.md",
    "docs/evidence/FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION_CERTIFICATE_060F.md",
    "tools/termux/forge_060f_real_read_model_source_boundary_decision.sh",
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
warn "No package test suite required for docs-only 060F boundary"
run_cmd rg -n "DECISION=PASS_060F_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION|NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION|repo_local_read_model_source|read-only|deterministic" "$SOURCE_DOC" "$DESIGN_DOC" "$ROADMAP_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "FORGE_MASTER_BUILD_TREE.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
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
warn "No screenshot evidence required for docs-only 060F boundary"

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
run_cmd git commit -m "docs: decide real read model source boundary"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
echo "PASS_${PHASE}_COMMIT_PUSH_COMPLETE"
echo "NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION"
echo "BACKUP=$backup_dir"
echo "ROLLBACK=$rollback_script"
echo "Reporte: $REPORT"
autocopy_report
