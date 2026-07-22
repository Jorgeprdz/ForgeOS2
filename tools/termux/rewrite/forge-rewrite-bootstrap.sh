#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/git.sh"
. "$SCRIPT_DIR/lib/product.sh"
. "$SCRIPT_DIR/lib/constitution.sh"
. "$SCRIPT_DIR/lib/validation.sh"
. "$SCRIPT_DIR/lib/manifest.sh"

usage() {
  cat <<'EOF'
Usage: forge-rewrite-bootstrap.sh [--copy-result] [--export-android] [--help]

Prepares local Termux rewrite state. It does not apply any rewrite stage.
EOF
  forge_print_help_common
}

copy=0
export_android=0
for arg in "$@"; do
  case "$arg" in
    --help) usage; exit 0 ;;
    --copy-result) copy=1 ;;
    --export-android) export_android=1 ;;
    *) forge_die "unknown option: $arg" ;;
  esac
done

forge_cd_root
forge_require_cmd git
forge_require_cmd node
forge_require_cmd npm
forge_require_clean_tree
forge_require_origin_main_aligned
forge_validate_product_files
forge_validate_constitution
forge_validate_all
forge_ensure_state_dirs
test -f "$FORGE_ROOT/.forge/rewrite/state.json" || printf '{"current_stage":null,"completed_stages":[],"applied_files":[],"validation_status":"PASS"}\n' > "$FORGE_ROOT/.forge/rewrite/state.json"
forge_record_validation_stamp
{
  printf 'FORGE_REWRITE_BOOTSTRAP=PASS\n'
  printf 'ROOT=%s\n' "$FORGE_ROOT"
  printf 'BRANCH=%s\n' "$(forge_current_branch)"
  printf 'STAGES:\n'
  forge_list_stages
  printf 'NEXT_COMMAND=bash "%s/tools/termux/rewrite/forge-rewrite-stage.sh" SG-001 --plan\n' "$FORGE_ROOT"
} | tee "$FORGE_ROOT/.forge/rewrite/logs/bootstrap.out"
[ "$copy" -eq 1 ] && forge_copy_result < "$FORGE_ROOT/.forge/rewrite/logs/bootstrap.out"
[ "$export_android" -eq 1 ] && forge_export_android
exit 0
