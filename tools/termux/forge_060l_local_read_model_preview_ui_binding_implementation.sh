#!/usr/bin/env bash
set -euo pipefail

PHASE="060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION"
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
lines = text.splitlines()
path.write_text("\n".join(line.rstrip() for line in lines) + "\n")
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
  local rollback="$BACKUP_DIR/rollback-060l.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").060l.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "docs/static-preview/forge-alive/index.html"
restore_or_archive "docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.css"
restore_or_archive "docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.js"
restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_CLOSURE_060L.md"
restore_or_archive "docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L.md"
restore_or_archive "docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_CERTIFICATE_060L.md"
restore_or_archive "tools/termux/forge_060l_local_read_model_preview_ui_binding_implementation.sh"

echo "rollback 060L complete"
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
printf "MODE=scoped static preview desktop local read-model preview UI binding implementation\n"
printf "BOUNDARY=static preview UI binding only; desktop first; no CRM; no calendar; no send; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to mix 060L with unrelated edits"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js"
  "docs/evidence/forge-local-read-model-source-adapter-audit-060j.json"
  "docs/evidence/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_060J.md"
  "docs/architecture/source-truth/FORGE_SELECTED_LOCAL_READ_MODEL_SOURCE_ADAPTER_EVIDENCE_LOCK_CLOSURE_060J.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_060K.md"
  "docs/design/forge-ui/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_CONTRACT_060K.md"
  "docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE_060K.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/060l-local-read-model-preview-ui-binding-implementation-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for file in "${required_files[@]}"; do
  backup_file "$file"
done
write_rollback

say_stage "STAGE 4 APPLY CHANGES"
mkdir -p tools/termux
cp "/storage/emulated/0/Download/forge_060l_local_read_model_preview_ui_binding_implementation.sh" "tools/termux/forge_060l_local_read_model_preview_ui_binding_implementation.sh"
pass "copied runner into tools/termux"

mkdir -p docs/static-preview/forge-alive/desktop

cat > docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.css <<'CSS'
/* FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_060L:START */
@media (min-width: 901px) {
  .forge-local-read-model-preview-060l {
    margin: 18px 0 0;
    border: 1px solid rgba(41, 48, 64, 0.14);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 18px 40px rgba(20, 27, 40, 0.08);
    color: #172033;
    overflow: hidden;
  }

  .forge-local-read-model-preview-060l[hidden] {
    display: none !important;
  }

  .forge-local-read-model-preview-060l__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid rgba(41, 48, 64, 0.1);
  }

  .forge-local-read-model-preview-060l__eyebrow {
    margin: 0 0 6px;
    color: #667085;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .forge-local-read-model-preview-060l__title {
    margin: 0;
    font-size: 20px;
    line-height: 1.2;
    font-weight: 760;
  }

  .forge-local-read-model-preview-060l__summary {
    margin: 8px 0 0;
    max-width: 680px;
    color: #475467;
    font-size: 14px;
    line-height: 1.45;
  }

  .forge-local-read-model-preview-060l__status {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 7px 10px;
    background: #eef6ff;
    color: #175cd3;
    font-size: 12px;
    font-weight: 760;
    white-space: nowrap;
  }

  .forge-local-read-model-preview-060l__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    padding: 16px 20px 18px;
  }

  .forge-local-read-model-preview-060l__rows {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .forge-local-read-model-preview-060l__row {
    min-width: 0;
    border-radius: 14px;
    background: rgba(246, 248, 251, 0.92);
    padding: 12px;
  }

  .forge-local-read-model-preview-060l__label {
    margin: 0 0 4px;
    color: #667085;
    font-size: 12px;
    font-weight: 700;
  }

  .forge-local-read-model-preview-060l__value {
    margin: 0;
    color: #172033;
    font-size: 14px;
    font-weight: 720;
    line-height: 1.35;
  }

  .forge-local-read-model-preview-060l__guards {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .forge-local-read-model-preview-060l__guard {
    border-radius: 999px;
    padding: 7px 10px;
    background: #f7f7f8;
    color: #344054;
    font-size: 12px;
    font-weight: 720;
    white-space: nowrap;
  }

  .forge-local-read-model-preview-060l__evidence {
    padding: 12px 20px 16px;
    border-top: 1px solid rgba(41, 48, 64, 0.08);
    color: #667085;
    font-size: 12px;
    line-height: 1.4;
  }
}
/* FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_060L:END */
CSS
pass "wrote desktop CSS binding"

cat > docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.js <<'JS'
/* FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_060L:START */
(function () {
  "use strict";

  var EVENT_NAME = "forge:local-read-model-source:060i";
  var DESKTOP_QUERY = "(min-width: 901px)";
  var CARD_ID = "forge-local-read-model-preview-060l";

  function isDesktop() {
    return !window.matchMedia || window.matchMedia(DESKTOP_QUERY).matches;
  }

  function text(value, fallback) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    return fallback;
  }

  function cleanRows(rows) {
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .filter(function (row) {
        return row && (row.label || row.value);
      })
      .slice(0, 3)
      .map(function (row) {
        return {
          label: text(row.label, "Dato"),
          value: text(row.value, "Sin dato")
        };
      });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function findMount() {
    return (
      document.querySelector("[data-forge-command-preview]") ||
      document.querySelector(".forge-desktop-command-workspace-058e") ||
      document.querySelector(".forge-command-workspace-058e") ||
      document.querySelector(".forge-desktop-workspace-056y") ||
      document.querySelector("main") ||
      document.body
    );
  }

  function ensureCard() {
    var existing = document.getElementById(CARD_ID);
    if (existing) {
      return existing;
    }

    var card = document.createElement("section");
    card.id = CARD_ID;
    card.className = "forge-local-read-model-preview-060l";
    card.setAttribute("aria-label", "Preview local de reporte");
    card.hidden = true;

    var mount = findMount();
    if (mount.firstElementChild && mount !== document.body) {
      mount.appendChild(card);
    } else {
      mount.appendChild(card);
    }
    return card;
  }

  function render(detail) {
    if (!isDesktop() || !detail || detail.readModelStatus !== "LOCAL_READ_MODEL_READY") {
      return null;
    }

    var preview = detail.reportPreview || {};
    var rows = cleanRows(preview.rows);
    if (!rows.length) {
      rows = [
        { label: "Estado", value: "Preview sin ejecucion" },
        { label: "Motor", value: "Fuente local auditada" },
        { label: "Aprobacion", value: "Humana requerida" }
      ];
    }

    var rowHtml = rows.map(function (row) {
      return (
        '<div class="forge-local-read-model-preview-060l__row">' +
          '<p class="forge-local-read-model-preview-060l__label">' + escapeHtml(row.label) + '</p>' +
          '<p class="forge-local-read-model-preview-060l__value">' + escapeHtml(row.value) + '</p>' +
        '</div>'
      );
    }).join("");

    var sourcePath = text(detail.sourcePath, "docs/evidence/forge-selected-engine-dry-run-audit-060e.json");
    var card = ensureCard();
    card.innerHTML =
      '<div class="forge-local-read-model-preview-060l__header">' +
        '<div>' +
          '<p class="forge-local-read-model-preview-060l__eyebrow">Preview local</p>' +
          '<h2 class="forge-local-read-model-preview-060l__title">' + escapeHtml(text(preview.title, "Preview de reporte")) + '</h2>' +
          '<p class="forge-local-read-model-preview-060l__summary">' + escapeHtml(text(preview.summary, "Lectura auditada preparada para revision humana.")) + '</p>' +
        '</div>' +
        '<span class="forge-local-read-model-preview-060l__status">Requiere revision humana</span>' +
      '</div>' +
      '<div class="forge-local-read-model-preview-060l__body">' +
        '<div class="forge-local-read-model-preview-060l__rows">' + rowHtml + '</div>' +
        '<div class="forge-local-read-model-preview-060l__guards">' +
          '<span class="forge-local-read-model-preview-060l__guard">Sin envio</span>' +
          '<span class="forge-local-read-model-preview-060l__guard">Sin CRM</span>' +
          '<span class="forge-local-read-model-preview-060l__guard">Sin calendario</span>' +
        '</div>' +
      '</div>' +
      '<div class="forge-local-read-model-preview-060l__evidence">' +
        'Lectura auditada desde ' + escapeHtml(sourcePath) + '. No ejecuta motor real ni escribe datos.' +
      '</div>';
    card.hidden = false;
    return card;
  }

  function onLocalReadModel(event) {
    render(event && event.detail);
  }

  function boot() {
    window.addEventListener(EVENT_NAME, onLocalReadModel);
    window.__forgeRenderLocalReadModelPreview060L = render;

    if (typeof window.__forgeRunLocalReadModelSourceAdapter060I === "function") {
      render(window.__forgeRunLocalReadModelSourceAdapter060I());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
/* FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_060L:END */
JS
pass "wrote desktop JS binding"

python3 - <<'PY'
from pathlib import Path

path = Path("docs/static-preview/forge-alive/index.html")
text = path.read_text()

css_line = '  <link rel="stylesheet" href="./desktop/forge-local-read-model-preview-ui-binding-060l.css?v=060l" media="(min-width: 901px)">'
if "forge-local-read-model-preview-ui-binding-060l.css" not in text:
    anchors = [
        'forge-desktop-visual-polish-alfred-mark-lock-058g.css',
        'forge-desktop-table-kpi-graph-density-058f.css',
        'forge-desktop-command-workspace-upgrade-058e.css',
    ]
    for anchor in anchors:
        if anchor in text:
            lines = text.splitlines()
            for i, line in enumerate(lines):
                if anchor in line:
                    lines.insert(i + 1, css_line)
                    text = "\n".join(lines) + "\n"
                    break
            break
    else:
        text = text.replace("</head>", css_line + "\n</head>")

js_line = '  <script src="./desktop/forge-local-read-model-preview-ui-binding-060l.js?v=060l" defer></script>'
if "forge-local-read-model-preview-ui-binding-060l.js" not in text:
    anchor = 'forge-local-read-model-source-adapter-060i.js'
    if anchor in text:
        lines = text.splitlines()
        for i, line in enumerate(lines):
            if anchor in line:
                lines.insert(i + 1, js_line)
                text = "\n".join(lines) + "\n"
                break
    else:
        text = text.replace("</body>", js_line + "\n</body>")

path.write_text(text)
PY
pass "patched index load order"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_CLOSURE_060L.md <<'MD'
# Forge Local Read Model Preview UI Binding Implementation Closure 060L

DECISION=PASS_060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION

NEXT=060M_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_VISUAL_QA_LOCK

060L implements the scoped desktop static preview binding for the local read-model source event:

`forge:local-read-model-source:060i`

The binding renders a desktop-only preview card from the local read model, using the 060J audited source output as the source of truth.

## Implemented Files

- `docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.css`
- `docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.js`
- `docs/static-preview/forge-alive/index.html`

## UI Contract

The binding displays:

- `Preview local`;
- report preview title and summary;
- up to three read-model rows;
- review boundary label;
- no-send, no-CRM, and no-calendar guards;
- local evidence source path.

## Safety

The binding is display-only.

It does not connect provider runtime, execute a real engine, write CRM, create calendar events, send messages, mutate browser storage, or request live external data.

DECISION=PASS_060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION

NEXT=060M_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_VISUAL_QA_LOCK
MD

cat > docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L.md <<'MD'
# Forge Local Read Model Preview UI Binding Implementation Evidence 060L

DECISION=PASS_060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION

NEXT=060M_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_VISUAL_QA_LOCK

060L adds the desktop static preview UI binding for the local read-model source adapter.

Evidence source:

- `docs/evidence/forge-local-read-model-source-adapter-audit-060j.json`

Implemented binding:

- listens for `forge:local-read-model-source:060i`;
- renders `Preview local`;
- renders report title, summary, and rows;
- labels the preview as requiring human review;
- displays no-send, no-CRM, and no-calendar guards;
- remains static preview only.

Validation:

- runner shell syntax checked;
- new JavaScript syntax checked;
- existing local source adapter syntax checked;
- index load order checked;
- static markers checked;
- whitespace check passed;
- safety scan passed.

DECISION=PASS_060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION

NEXT=060M_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_VISUAL_QA_LOCK
MD

cat > docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_CERTIFICATE_060L.md <<'MD'
# Forge Local Read Model Preview UI Binding Implementation Certificate 060L

060L certifies that the local read-model preview is now bound to a desktop-only static preview UI card.

DECISION=PASS_060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION

NEXT=060M_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_VISUAL_QA_LOCK
MD
pass "wrote docs / evidence"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
sync_body="060L implements the desktop static preview UI binding for \`forge:local-read-model-source:060i\`.

Visible output:

- \`Preview local\`
- report read-model title, summary, and rows
- review-required label
- no-send / no-CRM / no-calendar guards
- local evidence source label

Boundary remains static preview UI binding only: no provider runtime, no CRM write, no calendar create, no send, no browser storage, no network calls, and no real engine execution.

DECISION=PASS_060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION

NEXT=060M_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_VISUAL_QA_LOCK"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L:START -->" "<!-- FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L:START -->" "<!-- FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L:START -->" "<!-- FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.css"
  "docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.js"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_CLOSURE_060L.md"
  "docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L.md"
  "docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_CERTIFICATE_060L.md"
  "tools/termux/forge_060l_local_read_model_preview_ui_binding_implementation.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_060l_local_read_model_preview_ui_binding_implementation.sh
run_cmd node --check docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.js
run_cmd node --check docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js
run_cmd rg -n "forge-local-read-model-preview-ui-binding-060l.css|forge-local-read-model-preview-ui-binding-060l.js" docs/static-preview/forge-alive/index.html
run_cmd rg -n "FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_060L|Preview local|Requiere revision humana|forge:local-read-model-source:060i|__forgeRenderLocalReadModelPreview060L|Sin CRM|Sin calendario" docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.css docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.js
run_cmd rg -n "DECISION=PASS_060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION|NEXT=060M_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_VISUAL_QA_LOCK" docs/architecture/source-truth/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_CLOSURE_060L.md docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L.md docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_CERTIFICATE_060L.md FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for scoped static preview UI binding"

say_stage "STAGE 9 SAFETY SCAN"
safety_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.css"
  "docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.js"
  "docs/architecture/source-truth/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_CLOSURE_060L.md"
  "docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L.md"
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
  if rg -n -F "$token" "${safety_files[@]}" >/tmp/forge_060l_safety_scan.txt 2>/dev/null; then
    cat /tmp/forge_060l_safety_scan.txt
    fail "safety scan found forbidden token: $token"
  fi
done
pass "safety scan clean"

say_stage "STAGE 10 OPTIONAL SCREENSHOT EVIDENCE"
warn "Screenshot evidence deferred to 060M visual QA lock"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_CLOSURE_060L.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L.md"
  "docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_CERTIFICATE_060L.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.css"
  "docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.js"
  "tools/termux/forge_060l_local_read_model_preview_ui_binding_implementation.sh"
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
run_cmd git commit -m "feat: bind local read model preview to desktop ui"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=060M_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_VISUAL_QA_LOCK\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-060l.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
