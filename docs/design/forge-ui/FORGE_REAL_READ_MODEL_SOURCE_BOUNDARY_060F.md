# Forge Real Read Model Source Boundary 060F

Status: BOUNDARY_LOCKED

Decision:
DECISION=FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_060F

Next:
NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION

## UI Meaning

The UI may say a report preview is based on a local read model only after a selected local source exists.

Until then, UI language must remain:

- Preview;
- Dry-run;
- Static;
- Requires human review.

## Allowed Future Labels

- Fuente local
- Lectura local
- Preview desde read model
- Datos de prueba auditables

## Forbidden Labels

- Conectado a CRM
- Sincronizado con calendario
- Enviado
- Ejecutado
- Fuente viva

## Final Decision

DECISION=FORGE_REAL_READ_MODEL_SOURCE_BOUNDARY_060F

NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION
