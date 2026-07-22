forge_validate_all() {
  node "$FORGE_ROOT/scaffolds/validation/validate-product-spec.mjs"
  node "$FORGE_ROOT/scaffolds/validation/validate-boundaries.mjs"
  node "$FORGE_ROOT/scaffolds/validation/validate-traceability.mjs"
  node "$FORGE_ROOT/scaffolds/validation/validate-manifest.mjs"
  node "$FORGE_ROOT/scaffolds/validation/validate-scaffold.mjs"
  node "$FORGE_ROOT/scaffolds/validation/validate-paths.mjs"
  node "$FORGE_ROOT/scaffolds/validation/validate-evidence.mjs"
  node "$FORGE_ROOT/scaffolds/validation/validate-stage.mjs"
  node "$FORGE_ROOT/scaffolds/validation/validate-product-surfaces.mjs"
  node "$FORGE_ROOT/scaffolds/validation/validate-dependency-graph.mjs"
  node "$FORGE_ROOT/scaffolds/validation/validate-final-readiness.mjs"
}

forge_record_validation_stamp() {
  forge_ensure_state_dirs
  printf '{"validated_at":"%s","status":"PASS"}\n' "$(forge_now)" > "$FORGE_ROOT/.forge/rewrite/last-validation.json"
}
