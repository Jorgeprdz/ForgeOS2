#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

: "${FORGE_ROOT:?FORGE_ROOT is required}"
: "${FORGE_STAGE:?FORGE_STAGE is required}"

[ "$FORGE_STAGE" = "SG-002" ] || {
  printf 'GENERATOR_STAGE_MISMATCH expected=SG-002 actual=%s\n' "$FORGE_STAGE" >&2
  exit 1
}

mkdir -p "$FORGE_ROOT/platform/core/generated" "$FORGE_ROOT/platform/actions/generated" "$FORGE_ROOT/platform/read-models/generated"

write_stub() {
  local target="$1"
  local export_name="$2"
  [ ! -e "$target" ] || return 0
  cat > "$target" <<EOF
export function ${export_name}() {
  const error = new Error('FORGE_SCAFFOLD_NOT_IMPLEMENTED');
  error.code = 'FORGE_SCAFFOLD_NOT_IMPLEMENTED';
  throw error;
}
EOF
}

write_stub "$FORGE_ROOT/platform/core/generated/decision-contract.mjs" "forgeDecisionContract"
write_stub "$FORGE_ROOT/platform/actions/generated/action-contract.mjs" "forgeActionContract"
write_stub "$FORGE_ROOT/platform/read-models/generated/read-only-adapter-contract.mjs" "forgeReadOnlyAdapterContract"
