#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/manifest.sh"
usage(){ cat <<'EOF'
Usage: forge-rewrite-resume.sh [--help]
Inspects interrupted stage state and validates final readiness. It does not modify product files.
EOF
}
[ "${1:-}" = "--help" ] && { usage; exit 0; }
forge_cd_root
node "$FORGE_ROOT/scaffolds/validation/validate-final-readiness.mjs" >/dev/null
if [ ! -f "$FORGE_ROOT/.forge/rewrite/state.json" ]; then
  printf 'RESUME=NO_STATE\n'
  exit 0
fi
cat "$FORGE_ROOT/.forge/rewrite/state.json"
if [ -f "$FORGE_ROOT/.forge/rewrite/current-stage" ]; then
  stage="$(cat "$FORGE_ROOT/.forge/rewrite/current-stage")"
  printf 'CURRENT_STAGE=%s\n' "$stage"
  forge_print_stage_plan "$stage"
fi
exit 0
