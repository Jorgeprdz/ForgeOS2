# Forge Quote Preview Safe Visual Layout Spec Scope 089A

PHASE=089A_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPE

STATUS=PASS

DECISION=PASS_089A_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPE

LOCKED_DECISION=QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPED

NEXT=089B_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_IMPLEMENTATION

## Purpose

089A scopes safe visual layout specs for Quote Preview.

This phase follows 088D, where safe screen composition was locked as local/static/read-only reference registry.

## Important Boundary

089A does not render screens, render components, mutate UI, inject CSS, write DOM, create quote truth, issue quotes, send quotes, connect backend, write CRM/policy/pipeline/quote records, read PDFs, run parsers, run calculators, call Banxico, or execute real tests.

089A only scopes visual layout specs for future implementation.

## Visual Direction Captured

- midnight navy / dark premium interface;
- fixed sidebar on desktop;
- command bar near the top;
- hero risk card;
- metric card grid;
- operational opportunity table;
- mobile single-column card stack;
- bottom navigation on mobile;
- warm gold CTA;
- muted cyan safety badges;
- preview / no-quote labels always visible.

## Scoped Layout Specs

- `desktop_safe_visual_layout`
- `tablet_safe_visual_layout`
- `mobile_safe_visual_layout`

## Required 089B Shape

089B must implement a local/static/read-only safe visual layout spec registry.

## Final Decision

DECISION=PASS_089A_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPE

LOCKED_DECISION=QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPED

NEXT=089B_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_IMPLEMENTATION

<!-- FORGE:089R_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION:START -->
## 089R Safe Visual Layout Spec Template Reconciliation

089R reconciles the 089 safe visual layout spec with canonical Forge mobile and desktop design templates.

Decision:
`QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_RECONCILED_WITH_DESIGN_TEMPLATES`

Source refs added:

- design template refs;
- desktop template refs;
- mobile template refs;
- desktop/mobile layer contract refs;
- 086D / 087D / 088D layout lineage refs.

Reconciled visual rules:

- desktop risk area is compact Alfred decision strip/card, not oversized hero;
- desktop metrics are compact KPI strip/cards, not decorative grid;
- desktop operational table remains primary workspace;
- mobile uses single-column card stack and smart widgets, not raw table as primary flow;
- mobile keeps persistent bottom navigation;
- command bar remains above-fold and preview-safe;
- safety copy preserves Preview, Solo lectura, Revisión humana, No cotización oficial, Sin envío, Sin CRM, Sin calendario.

No rendering, UI mutation, CSS injection, DOM write, quote truth, execution, or write is authorized.

DECISION=PASS_089R_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION

LOCKED_DECISION=QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_RECONCILED_WITH_DESIGN_TEMPLATES

NEXT=090A_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE
<!-- FORGE:089R_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION:END -->
