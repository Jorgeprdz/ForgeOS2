#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

export PATH="$ROOT/bin:$PATH"

echo
echo "========== BUILD =========="

forge-doc build

echo
echo "======== GENERATE ========="

forge-doc generate

echo
echo "========= AUDIT =========="

"$ROOT/tools/audit.sh"

echo
echo "======================================"
echo "Forge Documentation Compiler instalado"
echo "======================================"

echo
echo "Proyecto:"
echo "  $ROOT"

echo
echo "Docs:"
echo "  $ROOT/output/docs"

echo
echo "Tokens:"
echo "  $ROOT/output/tokens"

echo
echo "Reportes:"
echo "  $ROOT/output/reports"

echo
echo "Listo."
