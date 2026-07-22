#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/manifest.sh"
usage(){ cat <<'EOF'
Usage: forge-rewrite-plan.sh [STAGE] [--help]
Prints all stages or one stage plan.
EOF
}
[ "${1:-}" = "--help" ] && { usage; exit 0; }
forge_cd_root
if [ "$#" -eq 0 ]; then forge_list_stages; else forge_stage_exists "$1" || forge_die "unknown stage: $1"; forge_print_stage_plan "$1"; fi
exit 0
