#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/git.sh"
. "$SCRIPT_DIR/lib/validation.sh"
usage(){ cat <<'EOF'
Usage: forge-rewrite-commit.sh STAGE "message" [--help]
Commits only after validation and evidence exist. Refuses main.
EOF
}
[ "${1:-}" = "--help" ] && { usage; exit 0; }
[ "$#" -eq 2 ] || { usage; exit 1; }
stage="$1"; message="$2"
forge_cd_root
forge_require_not_main
forge_require_branch_prefix
test -f "$FORGE_ROOT/scaffolds/reports/${stage}-evidence.json" || forge_die "missing evidence for $stage"
forge_validate_all
test -n "$(git status --short)" || forge_die "nothing to commit"
git add docs/product docs/rewrite scaffolds tools/termux/rewrite .gitignore package.json package-lock.json
git commit -m "$message"
exit 0
