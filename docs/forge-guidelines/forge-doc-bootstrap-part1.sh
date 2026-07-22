#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

ROOT="${1:-$PWD/ForgeDocumentationCompiler}"

mkdir -p "$ROOT"/{bin,generators,templates,rules,components,patterns,output/{docs,tokens,code,figma},tests}

cat > "$ROOT/config.yaml" <<'YAML'
name: Forge Documentation Compiler
version: 0.1.0
template_dir: templates
rules_dir: rules
output_dir: output/docs
YAML

cat > "$ROOT/bin/forge-doc" <<'BASH'
#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "${1:-}" in
 build)
   echo "[ForgeDoc] Building..."
   mkdir -p "$ROOT/output/docs"
   {
     echo "# Forge Design System"
     echo
     echo "Generated: $(date)"
     echo
     echo "## Rules"
     for f in "$ROOT"/rules/*.yaml; do
       [ -e "$f" ] || continue
       echo "- $(basename "$f")"
     done
     echo
     echo "## Components"
     for f in "$ROOT"/components/*.yaml; do
       [ -e "$f" ] || continue
       echo "- $(basename "$f")"
     done
   } > "$ROOT/output/docs/README.md"
   echo "Done."
 ;;
 init)
   echo "Project already initialized."
 ;;
 new)
   kind="${2:-component}"
   name="${3:-NewItem}"
   mkdir -p "$ROOT/${kind}s"
   cat > "$ROOT/${kind}s/${name}.yaml" <<EOF
name: ${name}
status: draft
description: ""
EOF
   echo "Created ${kind}: ${name}"
 ;;
 clean)
   rm -rf "$ROOT/output"
   mkdir -p "$ROOT/output/docs"
   echo "Cleaned."
 ;;
 *)
   echo "Usage: forge-doc {build|init|new|clean}"
   exit 1
 ;;
esac
BASH
chmod +x "$ROOT/bin/forge-doc"

cat > "$ROOT/rules/philosophy.yaml" <<'EOF'
title: Forge Philosophy
principles:
  - Decision first
  - One primary action
  - AI explains, never surprises
EOF

cat > "$ROOT/components/HeroDecision.yaml" <<'EOF'
name: HeroDecision
status: draft
purpose: Primary decision surface
EOF

echo
echo "Installed in:"
echo "  $ROOT"
echo
echo "Next:"
echo "  export PATH=\"$ROOT/bin:\$PATH\""
echo "  forge-doc build"
