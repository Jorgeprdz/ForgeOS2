# Forge Read Model Unification Scope 062B

Status: SCOPED

Date: 2026-07-05

Phase:
`062B_READ_MODEL_UNIFICATION_SCOPE`

Base:
`062A_ACTION_CONTRACTS_SCOPE`

## Purpose

062B defines the unified read model needed to feed Forge Alive's dashboard, command bar, opportunity table, risk surfaces, and preview-safe action contracts from a single coherent source.

This phase is documentation and scope only. It does not connect live modules, change the static preview, execute actions, or create provider behavior.

## Read Model Name

`forge.alive.workspace.read_model.v1`

## Design Goals

- One source shape feeds metrics, opportunities, risk, command results, and action availability.
- Action contracts from 062A are exposed through stable identifiers.
- UI labels and command-bar suggestions derive from the same available action list.
- Blocked states explain missing permissions, missing source data, or preview-only boundaries.
- The model can be produced by local dry-run data before any live module connection.
- The model can later be backed by real modules without changing UI contracts.

## Top-Level Shape

Required top-level sections:

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

## `workspace`

Purpose:

Identifies the current command workspace context.

Required fields:

- `workspaceId`
- `workspaceName`
- `surface`
- `mode`
- `ownerDisplayName`
- `lastPreparedAt`

Allowed mode values:

- `static_preview`
- `dry_run`
- `connected_preview`

062B only scopes `static_preview` and `dry_run`.

## `previewPolicy`

Purpose:

Declares global preview boundaries for every action.

Required fields:

- `requiresHumanApproval`
- `externalEffectsAllowed`
- `recordMutationAllowed`
- `scheduleMutationAllowed`
- `messageDeliveryAllowed`
- `providerExecutionAllowed`

062B expected values:

- approval required;
- external effects disabled;
- record mutation disabled;
- schedule mutation disabled;
- message delivery disabled;
- provider execution disabled.

## `metrics`

Purpose:

Feeds KPI cards and dashboard summaries.

Required fields:

- `monthlyGoalProbability`
- `expectedProduction`
- `gapToGoal`
- `followupRiskCount`
- `currency`
- `asOf`

Rules:

- Numeric values must be display-ready and machine-readable.
- Currency formatting must not be hardcoded in command contracts.
- `asOf` must indicate the source snapshot date or dry-run fixture date.

## `riskSummary`

Purpose:

Feeds the primary decision card and Alfred recommendation surfaces.

Required fields:

- `riskId`
- `severity`
- `headline`
- `summary`
- `recommendedActionId`
- `affectedOpportunityIds`
- `approvalRequired`

Allowed severity values:

- `low`
- `medium`
- `high`
- `blocked`

## `opportunities`

Purpose:

Feeds the table and row-level action contracts.

Required row fields:

- `opportunityId`
- `clientId`
- `clientName`
- `lineOfBusiness`
- `stage`
- `probability`
- `lastContactLabel`
- `lastContactDate`
- `nextActionLabel`
- `nextActionDate`
- `riskTags`
- `availableActionIds`

Rules:

- Every row action button must reference `availableActionIds`.
- Every command result targeting a row must reference `opportunityId` or `clientId`.
- Missing row identity must produce `blocked`.

## `actionRegistry`

Purpose:

Defines the canonical action contracts available to UI buttons and command results.

Required fields per action:

- `actionId`
- `label`
- `aliases`
- `contractStatus`
- `sourceModule`
- `requiresRow`
- `requiresHumanApproval`
- `previewOnly`
- `blockedReasonIds`

Action ids scoped from 062A:

- `command.quick_actions`
- `report.prepare_preview`
- `opportunity.review`
- `client.follow_preview`
- `quote.prepare_preview`
- `record.open_preview`

Allowed `contractStatus` values:

- `idle`
- `preview_only`
- `prepared`
- `needs_approval`
- `blocked`
- `failed`

## `commandCatalog`

Purpose:

Feeds command-bar search results without reading static UI text as data.

Required fields per result:

- `commandId`
- `actionId`
- `title`
- `subtitle`
- `tokens`
- `targetType`
- `targetId`
- `previewPayloadShape`

Rules:

- `/quick actions` lists available preview-safe commands.
- Free text must resolve to known `tokens` before showing a contract result.
- A command result cannot bypass action registry constraints.

## `capabilities`

Purpose:

Explains what the current user/session can preview.

Required fields:

- `canPreviewReport`
- `canReviewOpportunity`
- `canPrepareFollow`
- `canPrepareQuote`
- `canOpenRecord`
- `canRequestRealAction`

062B expected value for `canRequestRealAction`:

`false`

## `blockedReasons`

Purpose:

Provides reusable explanations for blocked action states.

Required fields per reason:

- `reasonId`
- `label`
- `message`
- `recoverable`
- `requiredScope`

Expected baseline reason ids:

- `preview_only_boundary`
- `missing_row_identity`
- `missing_read_model_source`
- `approval_required`
- `capability_disabled`
- `module_not_connected`

## `sourceEvidence`

Purpose:

Tracks what produced the read model.

Required fields:

- `sourceType`
- `sourcePath`
- `sourceCommit`
- `fixtureVersion`
- `generatedAt`

Allowed source types for this stage:

- `repo_fixture`
- `dry_run_audit`
- `static_preview_fixture`

## Acceptance Criteria For 062C

062C can proceed only if the implementation uses or simulates this unified read model shape to:

- render command-bar results from `commandCatalog`;
- resolve action ids through `actionRegistry`;
- preserve preview-only policy from `previewPolicy`;
- map row buttons to `availableActionIds`;
- return `blocked` with a known reason when data is missing;
- keep all real effects disabled.

## Explicit Non-Scope

062B does not authorize:

- Static preview UI mutation.
- CSS, JavaScript, or HTML mutation.
- Live module connection.
- Record mutation.
- Schedule mutation.
- Message delivery.
- Authentication behavior.
- Provider/runtime activation.
- Browser persistence.
- Browser requests.
- Real engine execution.

## Final Decision

062B approves the unified read model scope needed before command-bar action contract implementation.

DECISION=PASS_062B_READ_MODEL_UNIFICATION_SCOPE

NEXT=062C_COMMAND_BAR_ACTION_CONTRACT_IMPLEMENTATION
