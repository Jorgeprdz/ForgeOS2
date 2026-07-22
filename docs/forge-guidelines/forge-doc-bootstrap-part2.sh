#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

ROOT="${1:-/storage/emulated/0/Download/ForgeDocumentationCompiler}"

mkdir -p \
    "$ROOT/generators" \
    "$ROOT/output/docs" \
    "$ROOT/output/tokens" \
    "$ROOT/output/code" \
    "$ROOT/output/figma"

###############################################################################
# MARKDOWN GENERATOR
###############################################################################

cat > "$ROOT/generators/markdown.py" <<'PY'
from pathlib import Path

root = Path(__file__).resolve().parent.parent
docs = root / "output" / "docs"
docs.mkdir(parents=True, exist_ok=True)

index = docs / "INDEX.md"

index.write_text("""# Forge Design System

Generated automatically.

## Output

- Tokens
- Components
- Rules
- Patterns

""", encoding="utf-8")

print("Markdown generated.")
PY

###############################################################################
# TOKEN GENERATOR
###############################################################################

cat > "$ROOT/generators/tokens.py" <<'PY'
from pathlib import Path
import json

root = Path(__file__).resolve().parent.parent

tokens = {
    "color": {
        "primary": "#0B1F3A",
        "accent": "#D4AF37",
        "surface": "#111827",
        "text": "#FFFFFF"
    },
    "spacing": {
        "xs":4,
        "sm":8,
        "md":16,
        "lg":24,
        "xl":32
    },
    "radius":{
        "sm":8,
        "md":12,
        "lg":20
    }
}

(root/"output/tokens").mkdir(parents=True,exist_ok=True)
(root/"output/code").mkdir(parents=True,exist_ok=True)
(root/"output/figma").mkdir(parents=True,exist_ok=True)

(root/"output/tokens/tokens.json").write_text(
    json.dumps(tokens,indent=2),
    encoding="utf-8"
)

(root/"output/tokens/tokens.css").write_text(""":root{
--color-primary:#0B1F3A;
--color-accent:#D4AF37;
--color-surface:#111827;
--color-text:#FFFFFF;

--space-xs:4px;
--space-sm:8px;
--space-md:16px;
--space-lg:24px;
--space-xl:32px;

--radius-sm:8px;
--radius-md:12px;
--radius-lg:20px;
}
""",encoding="utf-8")

(root/"output/tokens/tailwind.extend.js").write_text("""
module.exports={
 theme:{
  extend:{
   colors:{
    primary:'#0B1F3A',
    accent:'#D4AF37'
   }
  }
 }
}
""",encoding="utf-8")

(root/"output/code/forge_theme.dart").write_text("""
class ForgeTheme{

static const primary=0xFF0B1F3A;
static const accent=0xFFD4AF37;

}
""",encoding="utf-8")

(root/"output/figma/variables.json").write_text(
    json.dumps(tokens,indent=2),
    encoding="utf-8"
)

print("Tokens generated.")
PY

###############################################################################
# PATCH CLI
###############################################################################

if ! grep -q "forge-doc generate" "$ROOT/bin/forge-doc" 2>/dev/null; then

cat >> "$ROOT/bin/forge-doc" <<'BASH'

if [ "${1:-}" = "generate" ]; then
    python3 "$ROOT/generators/markdown.py"
    python3 "$ROOT/generators/tokens.py"
    exit 0
fi
BASH

fi

echo
echo "================================="
echo "Forge Part 2 installed"
echo "================================="
echo
echo "Run:"
echo
echo "forge-doc generate"
