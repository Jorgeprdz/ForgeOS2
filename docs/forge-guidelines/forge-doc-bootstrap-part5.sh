#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

DOWNLOADS="/storage/emulated/0/Download"
ROOT="${1:-$DOWNLOADS/ForgeDocumentationCompiler}"

if [ ! -d "$ROOT" ]; then
    echo "Proyecto no encontrado:"
    echo "  $ROOT"
    exit 1
fi

mkdir -p \
    "$ROOT/tools" \
    "$ROOT/output/reports"

###############################################################################
# AUDITORÍA
###############################################################################

cat > "$ROOT/tools/audit.sh" <<'AUDIT'
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
AUDIT

chmod +x "$ROOT/tools/audit.sh"

###############################################################################
# INSTALADOR
###############################################################################

cat > "$ROOT/tools/install.sh" <<'INSTALL'
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
INSTALL

chmod +x "$ROOT/tools/install.sh"

###############################################################################
# RUN ALL
###############################################################################

cat > "$ROOT/RUN_ALL.sh" <<'RUNALL'
#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

DOWNLOADS="/storage/emulated/0/Download"

cd "$DOWNLOADS"

chmod +x forge-doc-bootstrap-part*.sh

for PART in \
    forge-doc-bootstrap-part1.sh \
    forge-doc-bootstrap-part2.sh \
    forge-doc-bootstrap-part3.sh \
    forge-doc-bootstrap-part4.sh \
    forge-doc-bootstrap-part5.sh
do
    echo
    echo "=============================="
    echo "Ejecutando $PART"
    echo "=============================="

    "./$PART" "$DOWNLOADS/ForgeDocumentationCompiler"
done

export PATH="$DOWNLOADS/ForgeDocumentationCompiler/bin:$PATH"

echo
echo "=============================="
echo "Compilando..."
echo "=============================="

forge-doc build

echo
echo "=============================="
echo "Generando..."
echo "=============================="

forge-doc generate

echo
echo "=============================="
echo "Auditoría..."
echo "=============================="

"$DOWNLOADS/ForgeDocumentationCompiler/tools/audit.sh"

echo
echo "========================================"
echo "Forge Documentation Compiler COMPLETO"
echo "========================================"
RUNALL

chmod +x "$ROOT/RUN_ALL.sh"

echo
echo "====================================="
echo "Parte 5 instalada correctamente"
echo "====================================="

echo
echo "Para instalar TODO desde Download ejecuta:"

echo
echo "  /storage/emulated/0/Download/ForgeDocumentationCompiler/RUN_ALL.sh"
