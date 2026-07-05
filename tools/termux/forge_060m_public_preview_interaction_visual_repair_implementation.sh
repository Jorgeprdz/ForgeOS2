#!/usr/bin/env bash
set -euo pipefail

PHASE="060M_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION"
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
  local rollback="$BACKUP_DIR/rollback-060m.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").060m.$(date +%Y%m%d_%H%M%S)"
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
restore_or_archive "docs/architecture/source-truth/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_CLOSURE_060M.md"
restore_or_archive "docs/evidence/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_060M.md"
restore_or_archive "docs/evidence/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_CERTIFICATE_060M.md"
restore_or_archive "tools/termux/forge_060m_public_preview_interaction_visual_repair_implementation.sh"

echo "rollback 060M complete"
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
printf "MODE=scoped static preview public interaction visual repair implementation\n"
printf "BOUNDARY=static preview visual repair only; no CRM; no calendar; no send; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; let Codex visual cleanup commit or stash before running 060M"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.css"
  "docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.js"
  "docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js"
  "docs/evidence/forge-local-read-model-source-adapter-audit-060j.json"
  "docs/architecture/source-truth/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_CLOSURE_060L.md"
  "docs/evidence/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION_060L.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/060m-public-preview-interaction-visual-repair-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for file in "${required_files[@]}"; do
  backup_file "$file"
done
write_rollback

say_stage "STAGE 4 APPLY CHANGES"
mkdir -p tools/termux
cp "/storage/emulated/0/Download/forge_060m_public_preview_interaction_visual_repair_implementation.sh" "tools/termux/forge_060m_public_preview_interaction_visual_repair_implementation.sh"
pass "copied runner into tools/termux"

mkdir -p docs/static-preview/forge-alive/desktop

cat > docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css <<'CSS'
/* FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_060M:START */
@media (min-width: 901px) {
  [data-forge-command-static-060m="true"],
  [data-forge-command-static-060m="true"]:focus,
  [data-forge-command-static-060m="true"]:focus-visible {
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    outline: 0 !important;
  }

  [data-forge-command-static-wrap-060m="true"] {
    box-shadow: none !important;
  }

  .forge-visual-repair-060m-quote-card {
    min-height: 86px !important;
    display: grid !important;
    align-content: start !important;
    gap: 8px !important;
    overflow: hidden !important;
  }

  .forge-visual-repair-060m-quote-card * {
    min-width: 0 !important;
    line-height: 1.22 !important;
    overflow-wrap: anywhere !important;
  }

  .forge-local-read-model-preview-060l {
    width: auto !important;
    max-width: 100% !important;
    margin: 18px 16px 0 !important;
    border-color: rgba(126, 211, 255, 0.2) !important;
    background: linear-gradient(180deg, rgba(13, 28, 43, 0.96), rgba(7, 17, 28, 0.96)) !important;
    color: #f8fafc !important;
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22) !important;
  }

  .forge-local-read-model-preview-060l__title,
  .forge-local-read-model-preview-060l__value {
    color: #f8fafc !important;
  }

  .forge-local-read-model-preview-060l__summary,
  .forge-local-read-model-preview-060l__label,
  .forge-local-read-model-preview-060l__evidence {
    color: rgba(226, 232, 240, 0.78) !important;
  }

  .forge-local-read-model-preview-060l__header,
  .forge-local-read-model-preview-060l__evidence {
    border-color: rgba(148, 163, 184, 0.16) !important;
  }

  .forge-local-read-model-preview-060l__row,
  .forge-local-read-model-preview-060l__guard {
    background: rgba(15, 36, 52, 0.86) !important;
    color: rgba(248, 250, 252, 0.9) !important;
  }

  .forge-local-read-model-preview-060l__status {
    background: rgba(126, 211, 255, 0.14) !important;
    color: #a7e7ff !important;
  }
}
/* FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_060M:END */
CSS
pass "wrote repair CSS"

cat > docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js <<'JS'
/* FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_060M:START */
(function () {
  "use strict";

  var DESKTOP_QUERY = "(min-width: 901px)";
  var PREVIEW_CARD_ID = "forge-local-read-model-preview-060l";

  function isDesktop() {
    return !window.matchMedia || window.matchMedia(DESKTOP_QUERY).matches;
  }

  function textOf(node) {
    if (!node) {
      return "";
    }
    return String(node.value || node.textContent || node.getAttribute("aria-label") || "").trim();
  }

  function visibleRect(node) {
    if (!node || typeof node.getBoundingClientRect !== "function") {
      return null;
    }
    var rect = node.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    return rect;
  }

  function markStaticCommandInputs() {
    var candidates = Array.prototype.slice.call(
      document.querySelectorAll("input, textarea, [contenteditable='true'], [role='textbox']")
    );

    candidates.forEach(function (node) {
      var content = textOf(node).toLowerCase();
      var parentText = textOf(node.parentElement).toLowerCase();
      var looksCommand = content.indexOf("/cotizar") !== -1 ||
        parentText.indexOf("preparar preview") !== -1 ||
        parentText.indexOf("preview seguro") !== -1;

      if (!looksCommand) {
        return;
      }

      node.setAttribute("data-forge-command-static-060m", "true");
      node.setAttribute("inputmode", "none");
      node.setAttribute("autocomplete", "off");
      node.setAttribute("aria-readonly", "true");
      node.setAttribute("tabindex", "-1");
      if ("readOnly" in node) {
        node.readOnly = true;
      }
      if (node.getAttribute("contenteditable") === "true") {
        node.setAttribute("contenteditable", "false");
      }

      if (node.parentElement) {
        node.parentElement.setAttribute("data-forge-command-static-wrap-060m", "true");
      }

      node.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        node.blur();
      });
      node.addEventListener("focus", function () {
        window.setTimeout(function () {
          node.blur();
        }, 0);
      });
    });
  }

  function markQuoteCards() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("div, article, section, li, button"));
    nodes.forEach(function (node) {
      var rect = visibleRect(node);
      if (!rect || rect.width < 120 || rect.height < 36 || rect.height > 180) {
        return;
      }

      var content = textOf(node).toLowerCase();
      if (content.indexOf("cotizar") !== -1 && content.indexOf("/cotizar") !== -1) {
        node.classList.add("forge-visual-repair-060m-quote-card");
      }
    });
  }

  function findCommandSurface() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll("button, [role='button']"));
    var prepare = buttons.filter(function (node) {
      return textOf(node).toLowerCase().indexOf("preparar preview") !== -1;
    })[0];

    var node = prepare;
    while (node && node !== document.body) {
      var rect = visibleRect(node);
      if (rect && rect.width >= 620 && rect.height >= 120 && rect.height <= 360) {
        return node;
      }
      node = node.parentElement;
    }

    return null;
  }

  function findWideContentMount() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("main, section, div"));
    var options = nodes.map(function (node) {
      return { node: node, rect: visibleRect(node) };
    }).filter(function (entry) {
      return entry.rect &&
        entry.rect.width >= 640 &&
        entry.rect.height >= 240 &&
        entry.rect.left >= 220 &&
        entry.node !== document.body &&
        entry.node !== document.documentElement;
    }).sort(function (a, b) {
      return (b.rect.width * b.rect.height) - (a.rect.width * a.rect.height);
    });

    return options.length ? options[0].node : null;
  }

  function repairPreviewCardMount() {
    var card = document.getElementById(PREVIEW_CARD_ID);
    if (!card) {
      return;
    }

    var commandSurface = findCommandSurface();
    if (commandSurface && commandSurface.parentElement) {
      commandSurface.insertAdjacentElement("afterend", card);
      return;
    }

    var mount = findWideContentMount();
    if (mount) {
      mount.appendChild(card);
    }
  }

  function runRepair() {
    if (!isDesktop()) {
      return;
    }
    markStaticCommandInputs();
    markQuoteCards();
    repairPreviewCardMount();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runRepair, { once: true });
  } else {
    runRepair();
  }

  window.addEventListener("load", runRepair);
  window.addEventListener("forge:local-read-model-source:060i", function () {
    window.setTimeout(runRepair, 0);
  });
  window.__forgeRunPublicPreviewInteractionVisualRepair060M = runRepair;
})();
/* FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_060M:END */
JS
pass "wrote repair JS"

python3 - <<'PY'
from pathlib import Path

path = Path("docs/static-preview/forge-alive/index.html")
text = path.read_text()

css_line = '  <link rel="stylesheet" href="./desktop/forge-public-preview-interaction-visual-repair-060m.css?v=060m" media="(min-width: 901px)">'
if "forge-public-preview-interaction-visual-repair-060m.css" not in text:
    if "forge-local-read-model-preview-ui-binding-060l.css" in text:
        lines = text.splitlines()
        for i, line in enumerate(lines):
            if "forge-local-read-model-preview-ui-binding-060l.css" in line:
                lines.insert(i + 1, css_line)
                text = "\n".join(lines) + "\n"
                break
    else:
        text = text.replace("</head>", css_line + "\n</head>")

js_line = '  <script src="./desktop/forge-public-preview-interaction-visual-repair-060m.js?v=060m" defer></script>'
if "forge-public-preview-interaction-visual-repair-060m.js" not in text:
    if "forge-local-read-model-preview-ui-binding-060l.js" in text:
        lines = text.splitlines()
        for i, line in enumerate(lines):
            if "forge-local-read-model-preview-ui-binding-060l.js" in line:
                lines.insert(i + 1, js_line)
                text = "\n".join(lines) + "\n"
                break
    else:
        text = text.replace("</body>", js_line + "\n</body>")

path.write_text(text)
PY
pass "patched index load order"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_CLOSURE_060M.md <<'MD'
# Forge Public Preview Interaction Visual Repair Implementation Closure 060M

DECISION=PASS_060M_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION

NEXT=060N_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_QA_LOCK

060M implements targeted static preview visual repairs from public page review:

- command bar focus must not expose a textbox frame or mobile keyboard/autofill surface;
- quote preview card text must not overlap `Cotizar` and `/cotizar`;
- the local read-model preview card must not appear as a misplaced white block.

Implemented files:

- `docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css`
- `docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js`
- `docs/static-preview/forge-alive/index.html`

The repair is static preview presentation only. It does not connect provider runtime, execute a real engine, write CRM, create calendar events, send messages, mutate browser storage, or request live external data.

DECISION=PASS_060M_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION

NEXT=060N_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_QA_LOCK
MD

cat > docs/evidence/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_060M.md <<'MD'
# Forge Public Preview Interaction Visual Repair Implementation 060M

DECISION=PASS_060M_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION

NEXT=060N_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_QA_LOCK

060M addresses three public preview defects reported from browser screenshots:

- visible command bar text frame on click;
- overlap between `Cotizar`, `Cotización`, and `/cotizar`;
- misplaced white local preview block.

Repair behavior:

- command-like text fields are made static/read-only for the preview surface;
- focus is blurred to avoid exposing the browser text UI;
- quote cards are marked for non-overlapping layout;
- the 060L local preview card is relocated to the wide command surface when available;
- the 060L card is restyled to match the dark Forge desktop surface.

Validation:

- runner shell syntax checked;
- new repair JavaScript syntax checked;
- existing 060L and 060I JavaScript syntax checked;
- index load order checked;
- repair markers checked;
- whitespace check passed;
- safety scan passed.

DECISION=PASS_060M_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION

NEXT=060N_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_QA_LOCK
MD

cat > docs/evidence/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_CERTIFICATE_060M.md <<'MD'
# Forge Public Preview Interaction Visual Repair Implementation Certificate 060M

060M certifies targeted public preview interaction visual repair for command focus, quote card overlap, and local preview card placement/style.

DECISION=PASS_060M_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION

NEXT=060N_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_QA_LOCK
MD
pass "wrote docs / evidence"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
sync_body="060M implements targeted public preview interaction visual repair after browser screenshots showed:

- command bar click exposed a textbox frame and browser input surface
- quote preview labels overlapped
- the 060L local preview card appeared as a misplaced white block

Repair files:

- \`docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css\`
- \`docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js\`

Boundary remains static preview visual repair only: no provider runtime, no CRM write, no calendar create, no send, no browser storage, no network calls, and no real engine execution.

DECISION=PASS_060M_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION

NEXT=060N_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_QA_LOCK"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_060M:START -->" "<!-- FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_060M:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_060M:START -->" "<!-- FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_060M:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_060M:START -->" "<!-- FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_060M:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_CLOSURE_060M.md"
  "docs/evidence/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_060M.md"
  "docs/evidence/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_CERTIFICATE_060M.md"
  "tools/termux/forge_060m_public_preview_interaction_visual_repair_implementation.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_060m_public_preview_interaction_visual_repair_implementation.sh
run_cmd node --check docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd node --check docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.js
run_cmd node --check docs/static-preview/forge-alive/shared/forge-local-read-model-source-adapter-060i.js
run_cmd python3 -m json.tool docs/evidence/forge-local-read-model-source-adapter-audit-060j.json
run_cmd rg -n "forge-public-preview-interaction-visual-repair-060m.css|forge-public-preview-interaction-visual-repair-060m.js" docs/static-preview/forge-alive/index.html
run_cmd rg -n "FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_060M|data-forge-command-static-060m|forge-visual-repair-060m-quote-card|__forgeRunPublicPreviewInteractionVisualRepair060M|forge-local-read-model-preview-060l" docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "DECISION=PASS_060M_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION|NEXT=060N_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_QA_LOCK" docs/architecture/source-truth/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_CLOSURE_060M.md docs/evidence/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_060M.md docs/evidence/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_CERTIFICATE_060M.md FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for scoped static preview visual repair"

say_stage "STAGE 9 SAFETY SCAN"
safety_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.css"
  "docs/static-preview/forge-alive/desktop/forge-local-read-model-preview-ui-binding-060l.js"
  "docs/architecture/source-truth/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_CLOSURE_060M.md"
  "docs/evidence/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_060M.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
safety_scan_file="$BACKUP_DIR/safety-scan-060m.txt"

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
warn "Screenshot evidence to be captured in 060N QA lock after public preview repair deploys"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_CLOSURE_060M.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/evidence/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_060M.md"
  "docs/evidence/FORGE_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_CERTIFICATE_060M.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "tools/termux/forge_060m_public_preview_interaction_visual_repair_implementation.sh"
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
run_cmd git commit -m "fix: repair public preview interaction visuals"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_060M_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=060N_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_QA_LOCK\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-060m.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
