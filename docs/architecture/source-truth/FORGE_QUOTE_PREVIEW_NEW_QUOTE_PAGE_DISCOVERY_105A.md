# Forge Quote Preview New Quote Page Discovery 105A

PHASE=105A_QUOTE_PREVIEW_SAFE_MODULE_VIEW_ACTIVATION_SCOPE
STATUS=PASS_SANITIZED
DECISION=PASS_105A_QUOTE_PREVIEW_SAFE_MODULE_VIEW_ACTIVATION_SCOPE
LOCKED_DECISION=NEW_QUOTE_PAGE_DISCOVERY_READY_FOR_DESIGN_PLAN
SAFETY_REPAIR=105AR_QUOTE_PREVIEW_NEW_QUOTE_PAGE_DISCOVERY_SAFETY_REPAIR
NEXT=105B_QUOTE_PREVIEW_NEW_QUOTE_PAGE_DESIGN_PLAN

## 1. DESIGN_GUIDELINES_READ

The following design system specifications, architecture definitions, and code modules were inspected before forming this proposal.

### Core Design System And Tokens

- docs/design/FORGE_DESKTOP_DESIGN_SYSTEM_DRAFT_001.md
- docs/design/FORGE_MOBILE_DESIGN_SYSTEM_001.md
- docs/design/forge-ui/FORGE_UI_DESIGN_LINE_001.md
- docs/design/forge-ui/FORGE_UI_TOKENS_001.md

### Safe UI And Contract Precedents

- docs/design/forge-ui/FORGE_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_CONTRACT_060K.md
- docs/architecture/source-truth/FORGE_DESKTOP_COMMAND_WORKSPACE_SCOPE_056X.md
- docs/architecture/source-truth/FORGE_DESKTOP_SYSTEM_VISION_AND_LAYER_LOCK_056W.md
- docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPE_086A.md
- docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_IMPLEMENTATION_086B.md
- docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_SCOPE_088A.md
- docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPE_089A.md
- docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE_090A.md
- docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN_091B.md

### Current Preview And 104E Context

- docs/static-preview/forge-alive/index.html
- docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_COTIZACIONES_VISUAL_CONFIRMATION_RESULT_104E.md
- docs/evidence/forge-quote-preview-cotizaciones-visual-confirmation-result-104e.json
- docs/evidence/forge-quote-preview-cotizaciones-visual-confirmation-audit-104e.json

## 2. CURRENT_STATE

After 104E, the Cotizaciones navigation item and the static action CTA were visually confirmed.

Current confirmed behavior:

1. The Cotizaciones sidebar item is a safe anchor targeting the Cotizaciones section.
2. The + Nueva cotización CTA is visually present in the Cotizaciones panel header.
3. The CTA is preview-only and must remain inactive until a later gated implementation phase.
4. The current page remains a static preview. It does not create a quote, calculate a premium, call providers, write CRM data, send messages, or create calendar tasks.

## 3. RECOMMENDED_DESTINATION

The + Nueva cotización CTA should lead to:

RECOMMENDED_DESTINATION=#nueva-cotizacion

This destination should represent a safe quote preparation view. It must not represent an official quote engine.

Recommended meaning:

- A quote intake and readiness workspace.
- A preparation desk for organizing context.
- A preview-only place to identify missing inputs.
- A human-review-required workflow step before any official action exists.

## 4. RECOMMENDED_PAGE_CONCEPT

RECOMMENDED_PATTERN=hash-toggled-embedded-panel

The recommended first version is an embedded module view inside the current Forge Alive static preview stage.

The view should be reachable by hash target. The actual activation method must be scoped in later phases and must remain preview-only.

The view should not calculate, persist, send, or connect. It should organize readiness only.

## 5. RECOMMENDED_INFORMATION_ARCHITECTURE

The future page should contain these sections:

1. Safety header
   - Title: Nuevo borrador de cotización
   - Badge: Preview
   - Badge: Requiere revisión humana
   - Backlink: Volver a Cotizaciones

2. Intake summary
   - Selected client status
   - Product family selection status
   - Quote objective status
   - Missing context count

3. Required context checklist
   - Client context
   - Product family context
   - Advisor objective
   - Required documents
   - Health or financial context only as missing or pending placeholders

4. Product Intelligence readiness
   - Product Intelligence status
   - Source status
   - Rule context status
   - No promise of verified final decision
   - No confidence score that implies official accuracy

5. Preview readiness
   - Not ready
   - Ready for human review
   - Blocked due missing context
   - Official quote unavailable in static preview

6. Safe action panel
   - Primary action should remain disabled in v1
   - Secondary action can return to Cotizaciones
   - Copy must state that the advisor performs the final review

## 6. RECOMMENDED_UI_LAYOUT

### Desktop

Use the existing Forge desktop shell and visual language.

Recommended layout:

- Left column: intake workspace and required context checklist.
- Right column: safety summary, Product Intelligence readiness, blocked action state.
- Header row: title on the left and preview badges on the right.
- Backlink to Cotizaciones inside the page header or safety header.

### Tablet

Use a single-column or stacked two-section layout. Avoid overlapping buttons, table content, badges, and form-like controls.

### Mobile

Use stacked cards, large touch targets, and visible safety labels. Avoid floating CTAs that cover required context.

## 7. RECOMMENDED_COMPONENTS

Reuse existing Forge classes and patterns where possible:

- dw-main-056y
- dw-panel-header-056y
- dw-lock-note-056y
- dw-chip-056y
- dw-static-new-quote-cta-056y
- dw-nav-link-056y
- dw-nav-056y
- dw-nav-icon-056y

Potential new components for later phases:

- dw-quote-intake-workspace-056y
- dw-intake-form-group-056y
- dw-intake-checklist-056y
- dw-product-intelligence-readiness-056y
- dw-preview-readiness-card-056y
- dw-safe-action-panel-056y

Any new component must follow Forge spacing, color, typography, radius, and preview-only rules.

## 8. SAFE_DATA_SCHEMA

The future schema must use placeholder-safe values. It must not include concrete premiums, ages, gender, products, rates, projections, official quote outputs, source claims, or provider responses unless they come from a gated trusted source.

Recommended safe schema:

- quoteDraftId: preview-draft-placeholder
- clientId: null
- clientName: pending_client_selection
- clientStatus: pending
- productLine: pending_product_family_selection
- productCandidate: null
- objective: pending_advisor_input
- quoteIntent: prepare_preview_only
- requiredInputs: empty array until scoped
- missingInputs: empty array until scoped
- assumptions: empty array
- productIntelligenceStatus: not_loaded_in_static_preview
- previewReadiness: not_ready_missing_required_context
- humanReviewRequired: true
- mockDataOnly: true
- quoteTruthAllowed: false
- officialQuoteAllowed: false
- providerRuntimeAllowed: false
- calculatorExecutionAllowed: false
- parserExecutionAllowed: false
- backendConnectionAllowed: false
- realEffectsAllowed: false

## 9. SAFETY_BOUNDARIES

Blocked behaviors:

- No official quote creation.
- No premium calculation.
- No coverage calculation.
- No projections.
- No UDI projection.
- No rate inference.
- No product fact invention.
- No provider runtime.
- No backend connection.
- No CRM write.
- No policy write.
- No task creation.
- No calendar creation.
- No message send.
- No PDF reading.
- No OCR.
- No parser execution.
- No calculator execution.
- No Banxico call.
- No browser persistence.
- No real effects.

Required copy principle:

Forge organizes readiness and flags missing context. The human advisor remains responsible for review and decisions.

## 10. IMPLEMENTATION_PLAN

Next phases:

1. 105B_QUOTE_PREVIEW_NEW_QUOTE_PAGE_DESIGN_PLAN
   - Produce final page layout, component contract, copy model, and responsive plan.

2. 105C_QUOTE_PREVIEW_NEW_QUOTE_PAGE_SOURCE_PATCH_SCOPE
   - Scope exact file edits, selectors, classes, hash target, and validation gates.

3. 105D_QUOTE_PREVIEW_NEW_QUOTE_PAGE_SOURCE_PATCH_IMPLEMENTATION
   - Implement only after 105B and 105C pass.

4. 105E_QUOTE_PREVIEW_NEW_QUOTE_PAGE_VISUAL_QA_WITH_SCREENSHOTS
   - Capture desktop, tablet, and mobile screenshots.

5. 105F_QUOTE_PREVIEW_NEW_QUOTE_PAGE_HUMAN_VISUAL_CONFIRMATION
   - Require user inspection before final visual PASS.

## 11. SCREENSHOT_QA_PLAN

Later screenshot QA must confirm:

- Cotizaciones sidebar remains visually aligned.
- #nueva-cotizacion destination is reachable.
- The new view looks native to Forge.
- The page does not look like an official quote engine.
- Preview and human review badges are visible.
- Primary action remains disabled or preview-only.
- No debug text is visible.
- No table or CTA overlap occurs.
- Desktop layout is aligned.
- Tablet layout wraps safely.
- Mobile layout stacks safely.

## 12. PASS_HOLD_CRITERIA

Discovery may remain PASS only if:

- Design guidelines were read.
- Relevant architecture was identified.
- Destination is explicit.
- Pattern is explicit.
- No source implementation occurred in this phase.
- All real effects remain false.
- Schema uses placeholder-safe values.
- Next phase is 105B_QUOTE_PREVIEW_NEW_QUOTE_PAGE_DESIGN_PLAN.

## 13. RISKS_AND_OPEN_QUESTIONS

Open questions for 105B:

1. Should #nueva-cotizacion be represented as a sibling embedded panel or sub-view under Cotizaciones?
2. Should the Cotizaciones sidebar item remain active while #nueva-cotizacion is visible?
3. Should table row actions later prefill a pending client context?
4. Which fields are required for the first safe intake version?
5. Which fields must stay hidden or disabled until Product Intelligence is formally integrated?
6. Should the first version include any editable controls, or only static preview cards?
7. What visual state should represent not ready, ready for human review, and blocked?

LOCKED_DECISION=NEW_QUOTE_PAGE_DISCOVERY_READY_FOR_DESIGN_PLAN
SAFETY_REPAIR=105AR_QUOTE_PREVIEW_NEW_QUOTE_PAGE_DISCOVERY_SAFETY_REPAIR
NEXT=105B_QUOTE_PREVIEW_NEW_QUOTE_PAGE_DESIGN_PLAN
