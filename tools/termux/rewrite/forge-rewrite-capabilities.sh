#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/product.sh"
usage(){ cat <<'EOF'
Usage: forge-rewrite-capabilities.sh [--help]
Lists product capabilities and classifications.
EOF
}
[ "${1:-}" = "--help" ] && { usage; exit 0; }
forge_cd_root
forge_validate_product_files
forge_print_capabilities
exit 0
