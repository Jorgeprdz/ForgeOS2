# Forge Read Model Unification Scope 062B

Status: PASS

Date: 2026-07-05

Mode:
Scope/decision only

## Result

062B defines `forge.alive.workspace.read_model.v1` as the unified read model shape for Forge Alive after action contracts were scoped in 062A.

## Required Sections

- `workspace`
- `previewPolicy`
- `metrics`
- `riskSummary`
- `opportunities`
- `actionRegistry`
- `commandCatalog`
- `capabilities`
- `blockedReasons`
- `sourceEvidence`

## Action Registry Coverage

- `command.quick_actions`
- `report.prepare_preview`
- `opportunity.review`
- `client.follow_preview`
- `quote.prepare_preview`
- `record.open_preview`

## Baseline Blocked Reasons

- `preview_only_boundary`
- `missing_row_identity`
- `missing_read_model_source`
- `approval_required`
- `capability_disabled`
- `module_not_connected`

## Boundary

062B defines the source shape only. It does not change the UI, connect modules, or enable real effects.

## Decision

DECISION=PASS_062B_READ_MODEL_UNIFICATION_SCOPE

NEXT=062C_COMMAND_BAR_ACTION_CONTRACT_IMPLEMENTATION
