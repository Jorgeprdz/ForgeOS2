# Forge Opportunity Pipeline Read Model Normalization Implementation 067D

Status: IMPLEMENTED

Phase:
`067D_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_IMPLEMENTATION`

Decision:
`PASS_067D_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_IMPLEMENTATION`

Locked decision:
`OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_IMPLEMENTED`

Next:
`067E_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_QA_LOCK`

## Robocop Gate

- Applicable Constitution: Article 0, Decision Clarity First, Advisor-first, no invented truth, forecasts are not facts, Forge decides and AI explains.
- Applicable ADRs: 066D, 067A, 067B, 067C continuity for Opportunity Pipeline read-only boundaries.
- Build Tree area: Opportunity Pipeline / Read Model Normalization / Candidate-only implementation.
- Discovery status: 067C scoped candidate-only normalization.
- Implementation readiness: Ready for local/static implementation only.
- Miranda approval: PASS for bounded local/static no-effect implementation.
- Board approval status: Bounded to preview/candidate-only normalizer.
- Scope boundary: Implement local/static candidate-only normalizer and tests.
- Prohibited surfaces: UI mutation, backend real, CRM write, pipeline write, task creation, calendar creation, message send, auth, provider execution, secret access, browser persistence, real engine execution, canonical opportunity truth.
- Validation expectation: node syntax checks, focused test, JSON audit, required markers, diff checks, safety scan, exact staged boundary.

## Implemented Files

- `platform/adapters/opportunity-pipeline/opportunity-pipeline-read-model-normalizer-067d.js`
- `tests/opportunity-pipeline-read-model-normalization-067d-test.js`

## Normalizer

Normalizer id:
`forge.opportunity_pipeline.read_model.normalizer.v1`

Normalizer type:
`local_static_candidate_normalizer`

Normalizer mode:
`read_only`

Route class:
`read_only`

Domain:
`opportunity_pipeline`

Schema:
`forge.backend.read_model.v1`

Freshness:
`preview_static`

Safe error:
`OPPORTUNITY_PIPELINE_NORMALIZATION_NOT_MODELED`

## Exported API

- `getNormalizerManifest()`
- `normalizeRelationshipOpportunitySignals(input)`
- `getPreviewRelationshipOpportunitySignalsFixture()`

## Behavior

The normalizer maps relationship opportunity signal envelopes into candidate-only Opportunity Pipeline read model rows.

It does not create real opportunities.

It does not claim canonical opportunity truth.

It preserves the 066B temporary local/static/read-only shim.

It returns a safe empty state and safe error when input is empty, malformed, missing evidence, missing freshness, or unsafe.

## Safety

All safety flags remain false:

- `crmWrite`
- `pipelineWrite`
- `taskCreate`
- `calendarCreate`
- `messageSend`
- `authReal`
- `providerRuntime`
- `secretAccess`
- `browserPersistence`
- `realEngineExecution`
- `realEffectsAllowed`
- `realEffectsEnabled`
- `backendConnection`

## Final

DECISION=PASS_067D_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_IMPLEMENTATION

LOCKED_DECISION=OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_IMPLEMENTED

NEXT=067E_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_QA_LOCK
