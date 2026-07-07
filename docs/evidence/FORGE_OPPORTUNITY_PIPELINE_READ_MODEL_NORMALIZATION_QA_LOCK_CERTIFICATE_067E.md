# Forge Opportunity Pipeline Read Model Normalization QA Certificate 067E

Certificate status: ISSUED

Phase:
`067E_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_QA_LOCK`

Certified decision:
`PASS_067E_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_QA_LOCK`

Locked decision:
`OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_QA_LOCKED`

## Certification

067E certifies that the 067D Opportunity Pipeline read model normalizer passed QA for local/static/candidate-only behavior.

The certified normalizer:

- is read-only;
- uses `forge.backend.read_model.v1`;
- preserves the 066B temporary local/static shim;
- returns candidate-only opportunity rows;
- requires evidence and freshness for non-empty candidates;
- uses `OPPORTUNITY_PIPELINE_NORMALIZATION_NOT_MODELED` for safe unmodeled input;
- blocks real effects;
- keeps all safety flags false.

## Exclusions

This certificate does not approve backend connection, CRM writes, pipeline writes, task/calendar/message actions, provider runtime, secret access, browser persistence, real engine execution, money/premium/forecast truth, stage mutation, or canonical opportunity truth.

## Next

`067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK`
