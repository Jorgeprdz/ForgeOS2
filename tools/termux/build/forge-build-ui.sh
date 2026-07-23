#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LAUNCHER="$SCRIPT_DIR/forge-build-launch.sh"

fail() {
  printf 'FORGE_BUILD_UI_ERROR %s\n' "$*" >&2
  return 1 2>/dev/null || true
}

[ -f "$LAUNCHER" ] || { fail "LAUNCHER_NOT_FOUND:$LAUNCHER"; exit 1; }
command -v bash >/dev/null 2>&1 || { fail "MISSING_COMMAND:bash"; exit 1; }
command -v mkfifo >/dev/null 2>&1 || { fail "MISSING_COMMAND:mkfifo"; exit 1; }

FORGE_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null)" || { fail "NOT_IN_GIT_REPOSITORY"; exit 1; }
cd "$FORGE_ROOT"

command_name="${1:-status}"
argument="${2:-}"
case "$command_name" in
  -h|--help|help|status|next|inspect|resume|validate|test|start|advance|complete|restart) ;;
  *) fail "UNSUPPORTED_COMMAND:$command_name"; exit 1 ;;
esac

terminal_columns="${COLUMNS:-80}"
case "$terminal_columns" in ''|*[!0-9]*) terminal_columns=80 ;; esac
compact=0
[ "$terminal_columns" -lt 72 ] && compact=1
live=0
[ -t 1 ] && [ "${FORGE_BUILD_NO_ANSI:-0}" != "1" ] && live=1

lifecycle=(declared architecture_ready contracts_ready implementation_started implementation_complete tests_added tests_pass integration_pass committed pushed merged)
artifacts=(
  "scaffolds/manifest/build-order.json"
  "scaffolds/manifest/dependency-graph.json"
  "tools/termux/build/forge-build-launch.sh"
)

if [ -n "$argument" ] && [[ "$argument" != */* ]]; then
  while IFS= read -r candidate; do
    [ -n "$candidate" ] || continue
    artifacts+=("$candidate")
  done < <(grep -RIl --exclude-dir=.git --exclude='state.json' -- "$argument" scaffolds docs governance adr platform 2>/dev/null | head -5 || true)
fi

active_artifact="${artifacts[0]}"
module_state="unknown"
active_modules="?"
completed_modules="?"
start_seconds=$SECONDS
panel_lines=0

declare -A seen=()
seen["${artifacts[0]}"]=1

lifecycle_index() {
  local value="$1" i
  for i in "${!lifecycle[@]}"; do
    [ "${lifecycle[$i]}" = "$value" ] && { printf '%s' "$i"; return; }
  done
  printf '%s' 0
}

clear_panel() {
  [ "$live" -eq 1 ] || return 0
  local i
  for ((i=0; i<panel_lines; i++)); do printf '\033[1A\033[2K'; done
  panel_lines=0
}

render_panel() {
  local elapsed=$((SECONDS - start_seconds))
  local idx progress filled empty bar artifact shown=0 marker
  idx="$(lifecycle_index "$module_state")"
  progress=$(( (idx * 100) / (${#lifecycle[@]} - 1) ))
  filled=$((progress / 5)); empty=$((20 - filled))
  printf -v bar '%*s' "$filled" ''; bar=${bar// /█}
  printf -v marker '%*s' "$empty" ''; marker=${marker// /░}

  if [ "$compact" -eq 1 ]; then
    printf 'FORGE [%s%s] %s%% | %s/%s | %ss\n' "$bar" "$marker" "$progress" "$completed_modules" "$active_modules" "$elapsed"
    printf '▶ %s\n' "$active_artifact"
    panel_lines=2
    return
  fi

  printf '┌─ FORGE BUILD · PROCESANDO ARTEFACTOS ───────────────────────────────┐\n'
  printf '│ LIFECYCLE  [%-20s] %3s%%  %-27.27s │\n' "$bar$marker" "$progress" "$module_state"
  printf '│ MÓDULOS    %s/%s completados                 TIEMPO %4ss             │\n' "$completed_modules" "$active_modules" "$elapsed"
  printf '├─────────────────────────────────────────────────────────────────────┤\n'
  for artifact in "${artifacts[@]}"; do
    [ "$shown" -lt 8 ] || break
    if [ "$artifact" = "$active_artifact" ]; then
      printf '│ ▶ %-66.66s │\n' "$artifact"
    elif [ "${seen[$artifact]:-0}" = "1" ]; then
      printf '│ ✓ %-66.66s │\n' "$artifact"
    else
      printf '│ · %-66.66s │\n' "$artifact"
    fi
    shown=$((shown + 1))
  done
  while [ "$shown" -lt 3 ]; do printf '│   %-66s │\n' ''; shown=$((shown + 1)); done
  printf '├─────────────────────────────────────────────────────────────────────┤\n'
  printf '│ ARCHIVO ACTUAL: %-51.51s │\n' "$active_artifact"
  printf '└─────────────────────────────────────────────────────────────────────┘\n'
  panel_lines=$((shown + 7))
}

observe_line() {
  local line="$1" path state
  case "$line" in
    ACTIVE_MODULES=*) active_modules="${line#*=}" ;;
    COMPLETED_MODULES=*) completed_modules="${line#*=}" ;;
    MODULE_STATE=*)
      state="${line#*=}"
      state="${state#*:}"
      module_state="${state%%:*}"
      ;;
    RESUME_STATE=*) module_state="${line#*=}" ;;
  esac
  path="$(printf '%s\n' "$line" | grep -Eo '(scaffolds|tools|docs|governance|adr|platform)/([[:alnum:]_.@+ -]+/)*[[:alnum:]_.@+ -]+\.(json|mjs|js|sh|md|txt|sql|ts|tsx|jsx|yaml|yml)' | head -1 || true)"
  if [ -n "$path" ] && [ -e "$path" ]; then
    [ "$path" != "$active_artifact" ] && seen["$active_artifact"]=1
    active_artifact="$path"
    seen["$path"]=1
  fi
}

run_log_dir="${FORGE_BUILD_STATE_ROOT:-.forge/build}/logs"
[[ "$run_log_dir" = /* ]] || run_log_dir="$FORGE_ROOT/$run_log_dir"
mkdir -p "$run_log_dir"
run_log="$run_log_dir/run.log"
: > "$run_log"

fifo="$run_log_dir/.ui-output-$$.fifo"
rm -f "$fifo"
mkfifo "$fifo"
cleanup() { rm -f "$fifo"; }
trap cleanup EXIT INT TERM

render_panel
bash "$LAUNCHER" "$command_name" "$argument" >"$fifo" 2>&1 &
launcher_pid=$!

while IFS= read -r line || [ -n "$line" ]; do
  clear_panel
  printf '%s\n' "$line" | tee -a "$run_log"
  observe_line "$line"
  render_panel
done < "$fifo"

set +e
wait "$launcher_pid"
rc=$?
set -e
clear_panel
render_panel
printf '\n'

if [ "$rc" -eq 0 ]; then
  printf 'FORGE_BUILD_ARTIFACT_PANEL=PASS\n'
else
  printf 'FORGE_BUILD_ARTIFACT_PANEL=FAIL\n' >&2
fi
printf 'RUN_LOG=%s\n' "$run_log"
printf 'FORGE_BUILD_UI_EXIT_CODE=%s\n' "$rc"
exit "$rc"
