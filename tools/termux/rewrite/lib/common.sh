forge_on_error() {
  local code=$?
  printf 'FORGE_REWRITE_ERROR command_failed code=%s line=%s\n' "$code" "${BASH_LINENO[0]:-unknown}" >&2
  exit "$code"
}
trap forge_on_error ERR

forge_die() {
  printf 'FORGE_REWRITE_ERROR %s\n' "$*" >&2
  exit 1
}

forge_repo_root() {
  local root
  if root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    printf '%s\n' "$root"
    return 0
  fi
  local common_dir fallback
  common_dir="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
  fallback="$(CDPATH= cd -- "$common_dir/../../../.." && pwd)"
  if [ -d "$fallback/.git" ]; then
    printf '%s\n' "$fallback"
    return 0
  fi
  forge_die "CONFIG_ERROR:not inside a Git repository and script fallback root is invalid"
}

forge_cd_root() {
  FORGE_ROOT="$(forge_repo_root)"
  export FORGE_ROOT
  cd "$FORGE_ROOT"
}

forge_require_cmd() {
  command -v "$1" >/dev/null 2>&1 || forge_die "missing required command: $1"
}

forge_validate_bash_runner() {
  local runner="$1"
  [ -f "$runner" ] || forge_die "RUNNER_NOT_FOUND:$runner"
  [ -r "$runner" ] || forge_die "RUNNER_NOT_READABLE:$runner"
  forge_require_cmd bash
  bash -n "$runner" || forge_die "RUNNER_SYNTAX_INVALID:$runner"
}

forge_now() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

forge_ensure_state_dirs() {
  mkdir -p \
    "$FORGE_ROOT/.forge/rewrite/logs" \
    "$FORGE_ROOT/.forge/rewrite/locks" \
    "$FORGE_ROOT/.forge/rewrite/evidence" \
    "$FORGE_ROOT/.forge/rewrite/artifact-receipts" \
    "$FORGE_ROOT/scaffolds/reports"
}

forge_log() {
  forge_ensure_state_dirs
  printf '%s %s\n' "$(forge_now)" "$*" >> "$FORGE_ROOT/.forge/rewrite/logs/rewrite.log"
}

forge_print_help_common() {
  cat <<'EOF'
Common modes:
  --help            Show help.
  --plan            Print the authorized plan without writing files.
  --dry-run         Simulate work without writing files.
  --apply           Apply the explicitly authorized operation.
  --force           Allow overwrite only when stage state and hashes permit it.
  --copy-result     Copy output to the Android clipboard using Termux:API.
  --export-android  Export reports/evidence to /storage/emulated/0/ForgeGemini.
EOF
}

forge_copy_result() {
  forge_require_cmd termux-clipboard-set
  termux-clipboard-set
}

forge_export_android() {
  local target="/storage/emulated/0/ForgeGemini"
  mkdir -p "$target"
  cp -R "$FORGE_ROOT/scaffolds/reports" "$target/forge-rewrite-reports"
  if [ -d "$FORGE_ROOT/.forge/rewrite/evidence" ]; then
    cp -R "$FORGE_ROOT/.forge/rewrite/evidence" "$target/forge-rewrite-runtime-evidence"
  fi
  printf 'Exported reports to %s\n' "$target"
}
