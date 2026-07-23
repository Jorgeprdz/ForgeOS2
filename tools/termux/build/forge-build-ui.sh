#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LAUNCHER="$SCRIPT_DIR/forge-build-launch.sh"

fail() {
  printf 'FORGE_BUILD_UI_ERROR %s\n' "$*" >&2
  exit 1
}

[ -f "$LAUNCHER" ] || fail "LAUNCHER_NOT_FOUND:$LAUNCHER"
command -v bash >/dev/null 2>&1 || fail "MISSING_COMMAND:bash"
command -v awk >/dev/null 2>&1 || fail "MISSING_COMMAND:awk"

FORGE_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null)" || fail "NOT_IN_GIT_REPOSITORY"
cd "$FORGE_ROOT"

command_name="${1:-status}"
argument="${2:-}"

case "$command_name" in
  -h|--help|help|status|next|inspect|resume|validate|test|start|advance|complete|restart) ;;
  *) fail "UNSUPPORTED_COMMAND:$command_name" ;;
esac

terminal_columns="${COLUMNS:-80}"
case "$terminal_columns" in
  ''|*[!0-9]*) terminal_columns=80 ;;
esac

compact=0
if [ "$terminal_columns" -lt 72 ]; then
  compact=1
fi

artifact_candidates=(
  "scaffolds/manifest/build-order.json"
  "scaffolds/manifest/dependency-graph.json"
  "tools/termux/build/forge-build-launch.sh"
  "scaffolds/validation/test-build-orchestrator.mjs"
  "package.json"
)

if [ -n "$argument" ] && [[ "$argument" != */* ]]; then
  while IFS= read -r candidate; do
    [ -n "$candidate" ] || continue
    artifact_candidates+=("$candidate")
  done < <(
    grep -RIl --exclude-dir=.git --exclude='state.json' -- "$argument" \
      scaffolds docs governance adr platform 2>/dev/null | head -3 || true
  )
fi

print_panel() {
  local active="${1:-scaffolds/manifest/build-order.json}"
  local index=0
  local artifact

  if [ "$compact" -eq 1 ]; then
    printf '▶ %s\n' "$active"
    return
  fi

  printf '\n┌─ PROCESANDO ARTEFACTOS ─────────────────────────────────────────────┐\n'
  for artifact in "${artifact_candidates[@]}"; do
    [ "$index" -lt 8 ] || break
    if [ "$artifact" = "$active" ]; then
      printf '│ ▶ %-66.66s │\n' "$artifact"
    elif [ -e "$artifact" ]; then
      printf '│ ✓ %-66.66s │\n' "$artifact"
    else
      printf '│ · %-66.66s │\n' "$artifact"
    fi
    index=$((index + 1))
  done
  while [ "$index" -lt 5 ]; do
    printf '│   %-66s │\n' ''
    index=$((index + 1))
  done
  printf '├─────────────────────────────────────────────────────────────────────┤\n'
  printf '│ ARCHIVO ACTUAL: %-51.51s │\n' "$active"
  printf '└─────────────────────────────────────────────────────────────────────┘\n\n'
}

initial_artifact="${artifact_candidates[0]}"
print_panel "$initial_artifact"

run_log_dir="${FORGE_BUILD_STATE_ROOT:-.forge/build}/logs"
if [[ "$run_log_dir" != /* ]]; then
  run_log_dir="$FORGE_ROOT/$run_log_dir"
fi
mkdir -p "$run_log_dir"
run_log="$run_log_dir/run.log"

set +e
bash "$LAUNCHER" "$command_name" "$argument" 2>&1 | awk -v compact="$compact" '
  {
    print
    line = $0
    if (match(line, /(scaffolds|tools|docs|governance|adr|platform)\/([[:alnum:]_.@+ -]+\/)*[[:alnum:]_.@+ -]+\.(json|mjs|js|sh|md|txt|sql|ts|tsx|jsx|yaml|yml)/)) {
      path = substr(line, RSTART, RLENGTH)
      if (path != last) {
        if (compact == 1) {
          printf "▶ %s\n", path
        } else {
          printf "ARCHIVO ACTUAL: %s\n", path
        }
        last = path
      }
    }
  }
' | tee "$run_log"
rc=${PIPESTATUS[0]}
set -e

if [ "$rc" -eq 0 ]; then
  final_artifact="${artifact_candidates[$((${#artifact_candidates[@]} - 1))]}"
  print_panel "$final_artifact"
  printf 'FORGE_BUILD_ARTIFACT_PANEL=PASS\n'
else
  printf 'FORGE_BUILD_ARTIFACT_PANEL=FAIL\n' >&2
fi
printf 'RUN_LOG=%s\n' "$run_log"
exit "$rc"
