forge_validate_product_files() {
  test -f "$FORGE_ROOT/docs/product/FORGE_PRODUCT_SPEC.md" || forge_die "missing docs/product/FORGE_PRODUCT_SPEC.md"
  test -f "$FORGE_ROOT/scaffolds/manifest/forge-product-capabilities.json" || forge_die "missing product capabilities manifest"
  node "$FORGE_ROOT/scaffolds/validation/validate-product-spec.mjs"
}

forge_print_capabilities() {
  node - <<'NODE'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scaffolds/manifest/forge-product-capabilities.json', 'utf8'));
for (const cap of data.capabilities) {
  console.log(`${cap.id}\t${cap.classification}\t${cap.name}`);
}
NODE
}
