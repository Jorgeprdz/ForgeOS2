#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPORT="$ROOT/output/reports/audit.txt"

mkdir -p "$ROOT/output/reports"

{
echo "========================================"
echo "Forge Documentation Compiler Audit"
echo "========================================"
echo
echo "Fecha:"
date
echo

echo "REGLAS"
find "$ROOT/rules" -type f -name "*.yaml" | sort

echo
echo "COMPONENTES"
find "$ROOT/components" -type f -name "*.yaml" | sort

echo
echo "PATRONES"
find "$ROOT/patterns" -type f -name "*.yaml" | sort

echo
echo "RESUMEN"

echo "Rules:      $(find "$ROOT/rules" -name '*.yaml' | wc -l)"
echo "Components: $(find "$ROOT/components" -name '*.yaml' | wc -l)"
echo "Patterns:   $(find "$ROOT/patterns" -name '*.yaml' | wc -l)"
echo "Templates:  $(find "$ROOT/templates" -type f | wc -l)"

} > "$REPORT"

echo
echo "✔ Auditoría completada"
echo "Reporte:"
echo "  $REPORT"
