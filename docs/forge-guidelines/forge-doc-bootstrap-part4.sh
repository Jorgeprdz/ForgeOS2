#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

ROOT="${1:-$PWD/ForgeDocumentationCompiler}"

mkdir -p "$ROOT/components" "$ROOT/patterns" "$ROOT/output/docs/components"

make_component () {
  local name="$1"
  local purpose="$2"
  cat > "$ROOT/components/${name}.yaml" <<EOF
name: ${name}
status: draft
purpose: ${purpose}
states:
  - default
  - hover
  - focus
  - disabled
accessibility:
  contrast: WCAG-AA
EOF

  cat > "$ROOT/output/docs/components/${name}.md" <<EOF
# ${name}

## Propósito
${purpose}

## Reglas
- Una responsabilidad principal.
- Estados documentados.
- Tokens obligatorios.
- Accesibilidad AA.
- Motion consistente.

## Checklist
- [ ] Tokens
- [ ] Estados
- [ ] Responsive
- [ ] Reduce Motion
EOF
}

make_component Card "Contenedor principal"
make_component MetricCard "Resumen de indicadores"
make_component DashboardHero "Zona principal de decisión"
make_component CommandBar "Barra de comandos"
make_component SearchBox "Búsqueda global"
make_component NavigationRail "Navegación lateral"
make_component DataTable "Tabla operacional"
make_component EmptyState "Estado vacío"
make_component LoadingState "Carga"
make_component ErrorState "Errores"
make_component Dialog "Diálogos"
make_component Snackbar "Notificaciones"
make_component KPI "Indicador"
make_component Timeline "Cronología"
make_component ActivityFeed "Actividad"
make_component UserAvatar "Avatar"
make_component SectionHeader "Encabezado"
make_component FAB "Acción flotante"

cat > "$ROOT/patterns/dashboard.yaml" <<EOF
title: Dashboard
rules:
  - Un Hero por pantalla.
  - Máximo tres prioridades visuales.
  - La IA recomienda, el usuario decide.
EOF

cat > "$ROOT/patterns/forms.yaml" <<EOF
title: Forms
rules:
  - Validación inmediata.
  - Errores junto al campo.
  - No bloquear escritura.
EOF

cat > "$ROOT/patterns/navigation.yaml" <<EOF
title: Navigation
rules:
  - Siempre saber dónde estoy.
  - Máximo dos niveles visibles.
EOF

echo "Part 4 installed."
echo "Generated component docs: $(ls "$ROOT/output/docs/components" | wc -l)"
