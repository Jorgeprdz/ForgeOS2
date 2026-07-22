#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

: "${FORGE_ROOT:?FORGE_ROOT is required}"
: "${FORGE_STAGE:?FORGE_STAGE is required}"

[ "$FORGE_STAGE" = "SG-029" ] || {
  printf 'GENERATOR_STAGE_MISMATCH expected=SG-029 actual=%s\\n' "$FORGE_STAGE" >&2
  exit 1
}

exec python "$FORGE_ROOT/tools/termux/rewrite/materialize-stage.py"
