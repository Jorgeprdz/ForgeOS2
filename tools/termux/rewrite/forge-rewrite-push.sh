#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/git.sh"
usage(){ cat <<'EOF'
Usage: forge-rewrite-push.sh [--help]
Pushes the current non-main rewrite branch when clean.
EOF
}
[ "${1:-}" = "--help" ] && { usage; exit 0; }
forge_cd_root
forge_require_not_main
forge_require_branch_prefix
forge_require_clean_tree
git push -u origin "$(forge_current_branch)"
exit 0
