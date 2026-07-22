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
