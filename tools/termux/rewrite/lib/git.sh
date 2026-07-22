forge_current_branch() {
  git branch --show-current
}

forge_require_clean_tree() {
  if [ "${FORGE_REWRITE_ALLOW_DIRTY_FOR_TESTS:-0}" = "1" ]; then
    return 0
  fi
  git diff --quiet || forge_die "working tree has unstaged changes"
  git diff --cached --quiet || forge_die "working tree has staged changes"
  test -z "$(git ls-files --others --exclude-standard)" || forge_die "working tree has untracked files"
}

forge_require_not_main() {
  local branch
  branch="$(forge_current_branch)"
  [ "$branch" != "main" ] || forge_die "refusing to operate on main"
}

forge_require_branch_prefix() {
  local branch
  branch="$(forge_current_branch)"
  case "$branch" in
    scaffold/constitution-first-termux-rewrite-*|rewrite/*) ;;
    *) forge_die "unexpected branch for rewrite operation: $branch" ;;
  esac
}

forge_require_origin_main_aligned() {
  git fetch origin
  local local_sha origin_sha
  local_sha="$(git rev-parse main)"
  origin_sha="$(git rev-parse origin/main)"
  [ "$local_sha" = "$origin_sha" ] || forge_die "main is not aligned with origin/main"
}
