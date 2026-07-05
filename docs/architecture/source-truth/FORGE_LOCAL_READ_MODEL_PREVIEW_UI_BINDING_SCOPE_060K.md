# Forge Local Read Model Preview UI Binding Scope 060K

Status: SCOPED

Decision token:
DECISION=PASS_060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE

Next:
NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION

## Human Summary

Forge now has a local read-model preview source. 060K defines how the static preview UI may show that preview without creating actions.

This phase does not modify HTML, CSS, JavaScript, or the visible UI.

## Binding Target

The first UI binding target is the desktop command preview area.

The binding may listen for:

`forge:local-read-model-source:060i`

and render a preview-only report panel using:

- `reportPreview.title`;
- `reportPreview.summary`;
- `reportPreview.rows`;
- source type and source path as quiet evidence labels.

## Required UI Rules

The UI binding must:

- say `Preview local` or `Lectura auditada`;
- show human review requirement;
- keep action copy as review-only;
- avoid send, CRM, calendar, approval, sync, or execution language;
- preserve all existing desktop/mobile layer boundaries.

## Forbidden UI Behavior

060L must not:

- create send buttons;
- write CRM;
- create calendar events;
- add provider calls;
- write browser storage;
- mutate source-truth;
- execute a real engine;
- imply live sync.

## Mobile / Desktop Boundary

060L may target desktop static preview first.

Mobile must not be changed unless a separate mobile binding scope is approved.

## Final Decision

DECISION=PASS_060K_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_SCOPE

NEXT=060L_LOCAL_READ_MODEL_PREVIEW_UI_BINDING_IMPLEMENTATION
