#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/git.sh"
. "$SCRIPT_DIR/lib/evidence.sh"
usage(){ cat <<'EOF'
Usage: forge-rewrite-rollback.sh STAGE [--help]
Rolls back only uncommitted evidence/state for a stage. It never runs git reset.
EOF
}
[ "${1:-}" = "--help" ] && { usage; exit 0; }
[ "$#" -eq 1 ] || { usage; exit 1; }
stage="$1"
forge_cd_root
node "$FORGE_ROOT/scaffolds/validation/validate-final-readiness.mjs" >/dev/null
forge_require_not_main
evidence="$(forge_stage_evidence_path "$stage")"
[ -f "$evidence" ] && rm -f "$evidence"
[ -f "$FORGE_ROOT/.forge/rewrite/current-stage" ] && [ "$(cat "$FORGE_ROOT/.forge/rewrite/current-stage")" = "$stage" ] && rm -f "$FORGE_ROOT/.forge/rewrite/current-stage"
forge_write_evidence "$stage" "ROLLED_BACK"
printf 'ROLLBACK=PASS stage=%s\n' "$stage"
exit 0
