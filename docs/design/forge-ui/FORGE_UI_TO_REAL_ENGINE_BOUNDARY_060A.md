# Forge UI To Real Engine Boundary 060A

Status: BOUNDARY DECIDED

Decision token:
DECISION=FORGE_UI_TO_REAL_ENGINE_BOUNDARY_060A

Next:
NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION

## UI Rule

The UI may continue to emit action packets.

The UI must not imply that a real action has happened until a later source-truth document authorizes a real adapter.

## Copy Rule

Allowed labels:

- Preparar preview
- Revisar
- Abrir preview
- Simular
- Preparar borrador

Forbidden labels until later approval:

- Enviar
- Crear en CRM
- Agendar
- Guardar como verdad
- Ejecutar

## Engine Boundary

The UI-to-engine bridge must remain:

- preview-first;
- approval-first;
- refusal-capable;
- auditable;
- reversible.

## Final Decision

DECISION=FORGE_UI_TO_REAL_ENGINE_BOUNDARY_060A

NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION
