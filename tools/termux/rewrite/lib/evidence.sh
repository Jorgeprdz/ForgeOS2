forge_stage_evidence_path() {
  printf '%s/scaffolds/reports/%s-evidence.json' "$FORGE_ROOT" "$1"
}

forge_write_evidence() {
  local stage="$1"
  local status="$2"
  local path
  path="$(forge_stage_evidence_path "$stage")"
  forge_ensure_state_dirs
  node - "$stage" "$status" "$path" <<'NODE'
const fs = require('fs');
const [stage, status, path] = process.argv.slice(2);
const evidence = {
  stage,
  generated_at: new Date().toISOString(),
  operator: process.env.USER || 'termux',
  inputs: [
    'docs/product/FORGE_PRODUCT_SPEC.md',
    'scaffolds/manifest/rewrite-stages.json'
  ],
  outputs: [path.replace(process.cwd() + '/', '')],
  hashes: {},
  validations: ['scaffold:validate'],
  status
};
fs.writeFileSync(path, JSON.stringify(evidence, null, 2) + '\n');
NODE
  printf 'Evidence: %s\n' "$path"
}
