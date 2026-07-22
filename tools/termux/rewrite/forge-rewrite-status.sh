#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/manifest.sh"
usage(){ cat <<'EOF'
Usage: forge-rewrite-status.sh [--help]
Shows local rewrite state and declared stages.
EOF
}
[ "${1:-}" = "--help" ] && { usage; exit 0; }
forge_cd_root
if [ -f "$FORGE_ROOT/.forge/rewrite/state.json" ]; then cat "$FORGE_ROOT/.forge/rewrite/state.json"; else printf 'No local rewrite state.\n'; fi
forge_list_stages
exit 0
