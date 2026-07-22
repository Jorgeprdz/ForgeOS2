#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/validation.sh"
usage(){ cat <<'EOF'
Usage: forge-rewrite-validate.sh [--help]
Runs scaffold manifest validation and records a local validation stamp.
EOF
}
[ "${1:-}" = "--help" ] && { usage; exit 0; }
forge_cd_root
forge_validate_all
forge_record_validation_stamp
printf 'FORGE_REWRITE_VALIDATE=PASS\n'
exit 0
