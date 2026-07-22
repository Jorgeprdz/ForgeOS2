#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/evidence.sh"
usage(){ cat <<'EOF'
Usage: forge-rewrite-evidence.sh STAGE [--help]
Writes blocked/pass evidence for a stage without implementing Forge OS 2.
EOF
}
[ "${1:-}" = "--help" ] && { usage; exit 0; }
[ "$#" -eq 1 ] || { usage; exit 1; }
forge_cd_root
forge_write_evidence "$1" "BLOCKED"
exit 0
