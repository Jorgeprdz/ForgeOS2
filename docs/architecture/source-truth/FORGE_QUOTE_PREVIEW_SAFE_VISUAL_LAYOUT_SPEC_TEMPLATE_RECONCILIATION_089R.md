# Forge Quote Preview Safe Visual Layout Spec Template Reconciliation 089R

PHASE=089R_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION

STATUS=PASS

DECISION=PASS_089R_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION

LOCKED_DECISION=QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_RECONCILED_WITH_DESIGN_TEMPLATES

NEXT=090A_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE

## Purpose

089R reconciles the existing 089A-D safe visual layout spec with canonical Forge mobile and desktop design templates.

089A-D already existed in this checkout. This phase does not replace 089. It adds source-of-truth design template refs and clarifies the layout interpretation before 090A.

## Source Refs Added

### design_template_source_refs

```json
[
  "docs/design/forge-ui/FORGE_UI_DESIGN_LINE_001.md",
  "docs/design/forge-ui/FORGE_UI_TOKENS_001.md",
  "docs/design/forge-ui/FORGE_INTERACTION_RULES_001.md"
]
```

### desktop_template_source_refs

```json
[
  "docs/design/FORGE_DESKTOP_DESIGN_SYSTEM_DRAFT_001.md",
  "docs/design/FORGE_DESKTOP_COMMAND_WORKSPACE_BLUEPRINT_001.md",
  "docs/design/forge-ui/FORGE_DESKTOP_TEMPLATE_SYSTEM_058I.md",
  "docs/design/forge-ui/FORGE_DESKTOP_WORKSPACE_COMPOSITION_CONTRACT_058C.md",
  "docs/design/forge-ui/FORGE_DESKTOP_COMPONENT_SYSTEM_001.md",
  "docs/design/forge-ui/FORGE_DESKTOP_MODULE_TEMPLATE_MAPPING_058J.md",
  "docs/design/forge-ui/FORGE_DESKTOP_TEMPLATE_IMPLEMENTATION_CHECKLIST_058J.md"
]
```

### mobile_template_source_refs

```json
[
  "docs/design/FORGE_MOBILE_DESIGN_SYSTEM_001.md",
  "docs/static-preview/templates/forge-mobile/TEMPLATE_SOURCE_OF_TRUTH.md",
  "docs/design/forge-ui/FORGE_MOBILE_COMPONENT_SYSTEM_001.md",
  "docs/design/forge-ui/FORGE_MOBILE_NAVIGATION_AND_SMART_WIDGET_PATTERN_057C.md",
  "docs/design/forge-ui/FORGE_MOBILE_WIDGET_GRID_SYSTEM_057I.md"
]
```

### layout_contract_source_refs

```json
[
  "docs/design/forge-ui/FORGE_DESKTOP_MOBILE_LAYER_BOUNDARY_CONTRACT_058A.md",
  "docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_DECISION_LOCK_086D.md",
  "docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_UX_COMPONENT_CONTRACT_DECISION_LOCK_087D.md",
  "docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_DECISION_LOCK_088D.md"
]
```

## Reconciled Decisions

- Desktop hero/risk area is a compact Alfred decision strip/card, not an oversized hero.
- Desktop metrics are compact KPI strip/cards, not decorative widget grid.
- Desktop operational table remains primary workspace.
- Mobile remains single-column card stack with smart widgets, not raw table as primary flow.
- Mobile keeps persistent bottom navigation.
- Command bar remains above-fold and preview-safe.
- Safety copy must preserve: Preview, Solo lectura, Revisión humana, No cotización oficial, Sin envío, Sin CRM, Sin calendario.
- Desktop and mobile patterns must not contaminate each other.

## Boundaries

- no screen rendering;
- no component rendering;
- no UI mutation;
- no CSS injection;
- no DOM writes;
- no quote truth;
- no execution;
- no writes.

## Final Decision

DECISION=PASS_089R_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION

LOCKED_DECISION=QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_RECONCILED_WITH_DESIGN_TEMPLATES

NEXT=090A_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE
