#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

: "${FORGE_ROOT:?FORGE_ROOT is required}"
: "${FORGE_STAGE:?FORGE_STAGE is required}"

[ "$FORGE_STAGE" = "SG-006" ] || {
  printf 'GENERATOR_STAGE_MISMATCH expected=SG-006 actual=%s\n' "$FORGE_STAGE" >&2
  exit 1
}

mkdir -p "$FORGE_ROOT/scaffolds/reports"
