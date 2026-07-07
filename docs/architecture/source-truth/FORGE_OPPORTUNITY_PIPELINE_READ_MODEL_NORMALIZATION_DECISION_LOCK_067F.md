# Forge Opportunity Pipeline Read Model Normalization Decision Lock 067F

Phase: `067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK`

Decision: `OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_LOCKED_AS_CANDIDATE_ONLY_PREVIEW_NORMALIZER`

067F formally locks the 067D Opportunity Pipeline read model normalizer after 067E QA.

## Locked Meaning

- The 067D normalizer is accepted only as a local/static/read-only candidate normalizer.
- It does not claim canonical opportunity truth.
- It does not create, mutate, merge, or delete opportunities.
- Relationship opportunity signals remain candidate inputs, not facts.
- Every non-empty candidate field requires source evidence and freshness metadata.
- `066B` remains the temporary local/static/read-only shim until canonical mapping and ownership are implemented.
- Safe error remains `OPPORTUNITY_PIPELINE_NORMALIZATION_NOT_MODELED`.
- The implementation is preview-safe and no-effect.

## Authorized Use

- Normalize modeled relationship opportunity signals into candidate-only Opportunity Pipeline read model envelopes.
- Support preview/static QA and future adapter boundary planning.
- Preserve audit, freshness, evidence, blocked effects, and disabled safety flags.

## Not Authorized

- Backend connection.
- CRM write.
- Pipeline write.
- Stage mutation.
- Task/calendar/message creation.
- Provider/runtime execution.
- Secret access.
- Browser persistence.
- Real engine execution.
- Money, premium, or forecast as fact.
- Canonical opportunity truth.

## Final Tokens

DECISION=PASS_067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK

LOCKED_DECISION=OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_LOCKED_AS_CANDIDATE_ONLY_PREVIEW_NORMALIZER

NEXT=068A_POLICY_READ_MODEL_SCOPE
