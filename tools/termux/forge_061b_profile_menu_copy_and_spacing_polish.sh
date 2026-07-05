#!/usr/bin/env bash
set -euo pipefail

PHASE="061B_PROFILE_MENU_COPY_AND_SPACING_POLISH_IMPLEMENTATION"
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
  local rollback="$BACKUP_DIR/rollback-061b.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").061b.$(date +%Y%m%d_%H%M%S)"
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
restore_or_archive "docs/architecture/source-truth/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_CLOSURE_061B.md"
restore_or_archive "docs/evidence/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_061B.md"
restore_or_archive "docs/evidence/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_CERTIFICATE_061B.md"
restore_or_archive "tools/termux/forge_061b_profile_menu_copy_and_spacing_polish.sh"

echo "rollback 061B complete"
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
printf "MODE=scoped static preview profile menu copy and spacing polish implementation\n"
printf "BOUNDARY=static preview visual polish only; no auth; no CRM; no calendar; no send; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to mix 061B with unrelated edits"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_TOPBAR_PROFILE_ICON_CLEANUP_VISUAL_QA_LOCK_CLOSURE_061A.md"
  "docs/evidence/FORGE_TOPBAR_PROFILE_ICON_CLEANUP_VISUAL_QA_LOCK_061A.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/061b-profile-menu-copy-and-spacing-polish-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for file in "${required_files[@]}"; do
  backup_file "$file"
done
write_rollback

say_stage "STAGE 4 APPLY CHANGES"
mkdir -p tools/termux
SCRIPT_SOURCE="$0"
if [[ -n "${BASH_SOURCE+x}" && -n "${BASH_SOURCE[0]:-}" ]]; then
  SCRIPT_SOURCE="${BASH_SOURCE[0]}"
fi
if [[ ! -f "$SCRIPT_SOURCE" ]]; then
  fail "runner source not found: $SCRIPT_SOURCE"
fi
cp "$SCRIPT_SOURCE" "tools/termux/forge_061b_profile_menu_copy_and_spacing_polish.sh"
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
start = "/* FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:START */"
end = "/* FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:END */"
css_block = """/* FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:START */
@media (min-width: 901px) {
  .forge-profile-menu-060y {
    top: calc(var(--forge-profile-menu-top-060y, 86px) + 8px) !important;
    border-color: rgba(139, 232, 255, 0.26) !important;
    background: linear-gradient(180deg, rgba(10, 22, 36, 0.97), rgba(5, 13, 23, 0.95)) !important;
    box-shadow:
      0 30px 86px rgba(0, 0, 0, 0.54),
      0 0 0 1px rgba(139, 232, 255, 0.07),
      inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  }

  .forge-profile-menu-060y::before {
    content: "";
    position: absolute;
    top: -7px;
    right: 22px;
    width: 12px;
    height: 12px;
    transform: rotate(45deg);
    border-left: 1px solid rgba(139, 232, 255, 0.22);
    border-top: 1px solid rgba(139, 232, 255, 0.22);
    background: rgba(10, 22, 36, 0.97);
  }

  .forge-profile-menu-060y__head {
    padding-bottom: 13px !important;
  }

  .forge-profile-menu-060y__actions {
    gap: 7px !important;
  }

  .forge-profile-menu-060y__action {
    padding: 11px 12px !important;
  }
}
/* FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:END */"""
css_path.write_text(replace_block(css, start, end, css_block))

js = js_path.read_text()
js = js.replace("Cerrar sesion", "Cerrar sesión")
js = js.replace("Cerrar sesión", "Cerrar sesión")
js = js.replace("autenticacion", "autenticación")
js = js.replace("Vista estatica segura", "Vista estática segura")
js = js.replace("var top = Math.round(rect.bottom + 12);", "var top = Math.round(rect.bottom + 18);")

start_js = "/* FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:START */"
end_js = "/* FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:END */"
js_block = """/* FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:START */
(function () {
  "use strict";

  function polishProfileMenuCopy() {
    var menu = document.getElementById("forge-profile-menu-060y");
    if (!menu) {
      return;
    }
    menu.querySelectorAll("button, div, span").forEach(function (node) {
      if (node.textContent === "Cerrar sesion") {
        node.textContent = "Cerrar sesión";
      }
      if (node.textContent === "Vista estatica segura") {
        node.textContent = "Vista estática segura";
      }
    });
    document.documentElement.setAttribute("data-forge-profile-menu-polished-061b", "true");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", polishProfileMenuCopy, { once: true });
  } else {
    polishProfileMenuCopy();
  }
  window.addEventListener("load", polishProfileMenuCopy);
  window.__forgePolishProfileMenuCopyAndSpacing061B = polishProfileMenuCopy;
})();
/* FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:END */"""
js_path.write_text(replace_block(js, start_js, end_js, js_block))

index = index_path.read_text()
index = index.replace("forge-public-preview-interaction-visual-repair-060m.css?v=060z", "forge-public-preview-interaction-visual-repair-060m.css?v=061b")
index = index.replace("forge-public-preview-interaction-visual-repair-060m.js?v=060z", "forge-public-preview-interaction-visual-repair-060m.js?v=061b")
index_path.write_text(index)
PY
pass "patched profile menu copy, spacing polish, and 061b cache"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_CLOSURE_061B.md <<'MD'
# Forge Profile Menu Copy And Spacing Polish Closure 061B

DECISION=PASS_061B_PROFILE_MENU_COPY_AND_SPACING_POLISH_IMPLEMENTATION

NEXT=061C_PROFILE_MENU_COPY_AND_SPACING_VISUAL_QA_LOCK

061B polishes the profile menu after the 061A visual QA lock. It fixes the Spanish copy for `Cerrar sesión`, improves menu separation from the top-right avatar, and strengthens the menu surface contrast.

No real auth, logout, theme persistence, provider execution, CRM, calendar, send, network, or browser persistence is enabled.

## Public URL

`https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=061b`

DECISION=PASS_061B_PROFILE_MENU_COPY_AND_SPACING_POLISH_IMPLEMENTATION

NEXT=061C_PROFILE_MENU_COPY_AND_SPACING_VISUAL_QA_LOCK
MD

cat > docs/evidence/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_061B.md <<'MD'
# Forge Profile Menu Copy And Spacing Polish 061B

DECISION=PASS_061B_PROFILE_MENU_COPY_AND_SPACING_POLISH_IMPLEMENTATION

NEXT=061C_PROFILE_MENU_COPY_AND_SPACING_VISUAL_QA_LOCK

061B addresses the remaining 061A notes:
- `Cerrar sesion` becomes `Cerrar sesión`;
- profile menu opens with more breathing room from the avatar;
- menu shadow, border, and surface contrast are strengthened for clearer visual separation.

Expected behavior:
- top-right `J` remains the only account/profile entry point;
- profile menu remains preview-safe;
- no real account action is executed.

DECISION=PASS_061B_PROFILE_MENU_COPY_AND_SPACING_POLISH_IMPLEMENTATION

NEXT=061C_PROFILE_MENU_COPY_AND_SPACING_VISUAL_QA_LOCK
MD

cat > docs/evidence/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_CERTIFICATE_061B.md <<'MD'
# Forge Profile Menu Copy And Spacing Polish Certificate 061B

DECISION=PASS_061B_PROFILE_MENU_COPY_AND_SPACING_POLISH_IMPLEMENTATION

NEXT=061C_PROFILE_MENU_COPY_AND_SPACING_VISUAL_QA_LOCK

061B is scoped static preview visual polish. It does not enable account, auth, provider, CRM, calendar, send, network, browser persistence, or real engine behavior.
MD
pass "wrote docs / evidence"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
sync_body="061B polishes the profile menu copy and spacing after 061A visual QA. It fixes \`Cerrar sesión\` and improves menu separation/contrast.

Public cache:
\`061b\`

DECISION=PASS_061B_PROFILE_MENU_COPY_AND_SPACING_POLISH_IMPLEMENTATION

NEXT=061C_PROFILE_MENU_COPY_AND_SPACING_VISUAL_QA_LOCK"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:START -->" "<!-- FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:START -->" "<!-- FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:START -->" "<!-- FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_CLOSURE_061B.md"
  "docs/evidence/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_061B.md"
  "docs/evidence/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_CERTIFICATE_061B.md"
  "tools/termux/forge_061b_profile_menu_copy_and_spacing_polish.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_061b_profile_menu_copy_and_spacing_polish.sh
run_cmd node --check docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "061b|forge-public-preview-interaction-visual-repair-060m.css|forge-public-preview-interaction-visual-repair-060m.js" docs/static-preview/forge-alive/index.html
run_cmd rg -n "FORGEOS:PROFILE_MENU_COPY_AND_SPACING_POLISH_061B|Cerrar sesión|Vista estática segura|__forgePolishProfileMenuCopyAndSpacing061B|data-forge-profile-menu-polished-061b" docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "DECISION=PASS_061B_PROFILE_MENU_COPY_AND_SPACING_POLISH_IMPLEMENTATION|NEXT=061C_PROFILE_MENU_COPY_AND_SPACING_VISUAL_QA_LOCK" docs/architecture/source-truth/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_CLOSURE_061B.md docs/evidence/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_061B.md docs/evidence/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_CERTIFICATE_061B.md FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for scoped profile menu polish"

say_stage "STAGE 9 SAFETY SCAN"
safety_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_CLOSURE_061B.md"
  "docs/evidence/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_061B.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
safety_scan_file="$BACKUP_DIR/safety-scan-061b.txt"

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
warn "Screenshot evidence should be captured after 061B deploys"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_CLOSURE_061B.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/evidence/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_061B.md"
  "docs/evidence/FORGE_PROFILE_MENU_COPY_AND_SPACING_POLISH_CERTIFICATE_061B.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "tools/termux/forge_061b_profile_menu_copy_and_spacing_polish.sh"
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
run_cmd git commit -m "fix: polish profile menu copy and spacing"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_061B_PROFILE_MENU_COPY_AND_SPACING_POLISH_IMPLEMENTATION_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=061C_PROFILE_MENU_COPY_AND_SPACING_VISUAL_QA_LOCK\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-061b.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
