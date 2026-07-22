#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

ROOT="${1:-$PWD/ForgeDocumentationCompiler}"

mkdir -p "$ROOT"/templates "$ROOT"/rules "$ROOT"/components

cat > "$ROOT/templates/component.md.tpl" <<'EOF'
# {{name}}

## Propósito
{{purpose}}

## Cuándo usar

## Cuándo NO usar

## Anatomía

## Estados

## Accesibilidad

## Tokens

## Ejemplos
EOF

cat > "$ROOT/templates/pattern.md.tpl" <<'EOF'
# {{title}}

## Problema

## Solución

## Reglas

## Anti-patrones
EOF

cat > "$ROOT/rules/color.yaml" <<'EOF'
title: Color
rules:
  - Solo un color primario por pantalla.
  - El dorado indica acciones críticas o premium.
  - Nunca usar rojo como color de marca.
EOF

cat > "$ROOT/rules/typography.yaml" <<'EOF'
title: Typography
rules:
  - Máximo 5 niveles tipográficos.
  - Evitar texto centrado en pantallas operativas.
  - Priorizar legibilidad sobre decoración.
EOF

cat > "$ROOT/rules/motion.yaml" <<'EOF'
title: Motion
rules:
  - Duración 120-240 ms.
  - Toda animación comunica estado.
  - Respetar Reduce Motion.
EOF

cat > "$ROOT/rules/accessibility.yaml" <<'EOF'
title: Accessibility
rules:
  - Contraste mínimo WCAG AA.
  - Todos los controles navegables por teclado.
  - No depender solo del color.
EOF

cat > "$ROOT/components/Button.yaml" <<'EOF'
name: Button
purpose: Ejecutar una acción explícita.
variants:
  - Primary
  - Secondary
  - Ghost
EOF

cat > "$ROOT/components/AIRecommendation.yaml" <<'EOF'
name: AIRecommendation
purpose: Mostrar recomendaciones de Alfred.
behavior:
  - Explica el motivo.
  - Permite descartar.
  - Nunca ejecuta automáticamente.
EOF

python3 - <<'PY'
from pathlib import Path
root=Path(r""$ROOT"")
idx=root/"output/docs/TEMPLATES.md"
idx.parent.mkdir(parents=True,exist_ok=True)
idx.write_text("# Templates\n\n- component.md.tpl\n- pattern.md.tpl\n",encoding="utf-8")
print("Templates indexed")
PY

echo "Part 3 installed."
