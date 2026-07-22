forge_validate_constitution() {
  test -f "$FORGE_ROOT/governance/constitution/CONSTITUTION_UNIFIED.md" || forge_die "missing active Unified Constitution"
  test -f "$FORGE_ROOT/scaffolds/manifest/constitutional-boundaries.json" || forge_die "missing constitutional boundary manifest"
  node "$FORGE_ROOT/scaffolds/validation/validate-boundaries.mjs"
}
