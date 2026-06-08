/*
|--------------------------------------------------------------------------
| MODULE: source-ownership-registry.js
|--------------------------------------------------------------------------
|
| VERSION:
| v0.1.0
|
|--------------------------------------------------------------------------
|
| Conceptual ownership registry for Forge source and claim boundaries.
| Ownership is not validity.
|
|--------------------------------------------------------------------------
*/

export const OWNER_LABELS = {
  EVIDENCE: 'Evidence Ownership',
  METRIC: 'Metric Truth',
  PRODUCT: 'Product Truth',
  POLICY: 'Policy Truth',
  FORECAST: 'Forecast Truth',
  ECONOMIC: 'Economic Evidence',
  NBA: 'NBA',
  NASH: 'NASH Conversation Intelligence',
  RELATIONSHIP: 'Relationship Intelligence',
  BUSINESS_PLANNING: 'Business Planning',
  MICK: 'Mick Behavior Intelligence',
  PRODUCTIVITY: 'Productivity',
  MANAGER: 'Manager Intelligence',
  ADVISOR_EXPERIENCE: 'Advisor Experience',
  BENVENU: 'Benvenù',
  COMPENSATION: 'Compensation Intelligence',
  ECONOMIC_MOTIVATION: 'Economic Motivation'
};

const ALL_CONSUMERS = Object.values(OWNER_LABELS);

const COMMON_PROHIBITIONS = [
  'invent_truth',
  'treat_ownership_as_validity',
  'silently_resolve_conflict',
  'hide_unknown',
  'ignore_staleness'
];

const SOURCE_OWNERSHIP = {
  official_policy_document: {
    conceptualOwner: OWNER_LABELS.POLICY,
    governingADR: 'ADR-006',
    allowedConsumers: [
      OWNER_LABELS.EVIDENCE,
      OWNER_LABELS.POLICY,
      OWNER_LABELS.PRODUCT,
      OWNER_LABELS.FORECAST,
      OWNER_LABELS.ECONOMIC,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'quote_as_policy',
      'policy_as_product_recommendation',
      'policy_state_as_client_intent',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Policy facts require policy evidence, period and context.']
  },
  product_manual: {
    conceptualOwner: OWNER_LABELS.PRODUCT,
    governingADR: 'ADR-005',
    allowedConsumers: [
      OWNER_LABELS.EVIDENCE,
      OWNER_LABELS.PRODUCT,
      OWNER_LABELS.POLICY,
      OWNER_LABELS.NASH,
      OWNER_LABELS.NBA,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'product_rule_as_policy_state',
      'product_rule_as_suitability',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Product Truth owns product rules and limits.']
  },
  product_rule_pack: {
    conceptualOwner: OWNER_LABELS.PRODUCT,
    governingADR: 'ADR-005',
    allowedConsumers: [
      OWNER_LABELS.PRODUCT,
      OWNER_LABELS.POLICY,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.NBA,
      OWNER_LABELS.NASH,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'product_rule_as_policy_state',
      'product_rule_as_compensation_rule',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Product rule packs do not create policy facts.']
  },
  raw_quote_illustration_document: {
    conceptualOwner: OWNER_LABELS.EVIDENCE,
    governingADR: 'ADR-001',
    allowedConsumers: [
      OWNER_LABELS.EVIDENCE,
      OWNER_LABELS.ECONOMIC,
      OWNER_LABELS.PRODUCT,
      OWNER_LABELS.FORECAST,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'quote_as_policy',
      'quote_as_payment',
      'quote_as_issued_policy',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Raw quote documents are candidate evidence, not policy truth.']
  },
  quoted_premium: {
    conceptualOwner: OWNER_LABELS.ECONOMIC,
    governingADR: 'ADR-008',
    allowedConsumers: [
      OWNER_LABELS.ECONOMIC,
      OWNER_LABELS.FORECAST,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'quote_as_payment',
      'quoted_value_as_paid_value',
      'economic_value_as_suitability',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Quoted premium is an economic value, not payment evidence.']
  },
  quoted_sum_insured: {
    conceptualOwner: OWNER_LABELS.ECONOMIC,
    governingADR: 'ADR-008',
    allowedConsumers: [
      OWNER_LABELS.ECONOMIC,
      OWNER_LABELS.PRODUCT,
      OWNER_LABELS.POLICY,
      OWNER_LABELS.FORECAST,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'quoted_value_as_policy_value',
      'economic_value_as_suitability',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Quoted sum insured must preserve quote context and limits.']
  },
  projection_derived_from_quote: {
    conceptualOwner: OWNER_LABELS.FORECAST,
    governingADR: 'ADR-007',
    allowedConsumers: [
      OWNER_LABELS.FORECAST,
      OWNER_LABELS.ECONOMIC,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'forecast_as_fact',
      'projection_as_payment',
      'scenario_as_guarantee',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Projection from quote remains forecast-bound.']
  },
  ocr_extract: {
    conceptualOwner: OWNER_LABELS.EVIDENCE,
    governingADR: 'ADR-001',
    allowedConsumers: ALL_CONSUMERS,
    prohibitedReinterpretations: [
      'ocr_as_confirmed_truth',
      'ocr_as_policy_without_validation',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['OCR extracts require validation before strong output.']
  },
  crm_record: {
    conceptualOwner: OWNER_LABELS.EVIDENCE,
    governingADR: 'ADR-001',
    allowedConsumers: ALL_CONSUMERS,
    prohibitedReinterpretations: [
      'crm_as_official_source_without_validation',
      'crm_as_client_intent',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['CRM records can be stale or incomplete.']
  },
  advisor_confirmed_context: {
    conceptualOwner: OWNER_LABELS.EVIDENCE,
    governingADR: 'ADR-001',
    allowedConsumers: ALL_CONSUMERS,
    prohibitedReinterpretations: [
      'advisor_context_as_documentary_truth',
      'advisor_context_as_client_intent',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Advisor confirmation is context, not universal source truth.']
  },
  manager_confirmed_context: {
    conceptualOwner: OWNER_LABELS.EVIDENCE,
    governingADR: 'ADR-001',
    allowedConsumers: [
      OWNER_LABELS.EVIDENCE,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.PRODUCTIVITY,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'manager_pressure_as_evidence',
      'manager_signal_as_enforcement',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Manager context cannot become enforcement.']
  },
  client_confirmed_context: {
    conceptualOwner: OWNER_LABELS.EVIDENCE,
    governingADR: 'ADR-001',
    allowedConsumers: ALL_CONSUMERS,
    prohibitedReinterpretations: [
      'client_context_as_blanket_permission',
      'client_context_as_product_suitability',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Client confirmation must preserve scope and context.']
  },
  official_production_record: {
    conceptualOwner: OWNER_LABELS.METRIC,
    governingADR: 'ADR-002',
    allowedConsumers: [
      OWNER_LABELS.METRIC,
      OWNER_LABELS.PRODUCTIVITY,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.FORECAST,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.MANAGER
    ],
    prohibitedReinterpretations: [
      'production_metric_as_human_worth',
      'production_goal_as_real_production',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Official production is metric truth, not human worth.']
  },
  paid_premium_record: {
    conceptualOwner: OWNER_LABELS.POLICY,
    governingADR: 'ADR-006',
    allowedConsumers: [
      OWNER_LABELS.POLICY,
      OWNER_LABELS.ECONOMIC,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.FORECAST,
      OWNER_LABELS.BUSINESS_PLANNING
    ],
    prohibitedReinterpretations: [
      'paid_premium_as_product_suitability',
      'payment_as_client_intent',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Paid premium requires payment evidence.']
  },
  issued_premium_record: {
    conceptualOwner: OWNER_LABELS.POLICY,
    governingADR: 'ADR-006',
    allowedConsumers: [
      OWNER_LABELS.POLICY,
      OWNER_LABELS.ECONOMIC,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.FORECAST,
      OWNER_LABELS.BUSINESS_PLANNING
    ],
    prohibitedReinterpretations: [
      'issued_as_paid',
      'issued_premium_as_payment',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Issued premium is not paid premium.']
  },
  compensation_rule_pack: {
    conceptualOwner: OWNER_LABELS.COMPENSATION,
    governingADR: 'ADR-017',
    allowedConsumers: [
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.ECONOMIC,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.ADVISOR_EXPERIENCE,
      OWNER_LABELS.ECONOMIC_MOTIVATION
    ],
    prohibitedReinterpretations: [
      'compensation_scenario_as_payment',
      'commission_as_product_recommendation',
      'compensation_gap_as_client_pressure',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Compensation rule packs do not create payment evidence.']
  },
  contest_rule_pack: {
    conceptualOwner: OWNER_LABELS.COMPENSATION,
    governingADR: 'ADR-017',
    allowedConsumers: [
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.ECONOMIC_MOTIVATION
    ],
    prohibitedReinterpretations: [
      'contest_rule_as_confirmed_bonus',
      'contest_goal_as_client_pressure',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Contest rules require period and snapshot context.']
  },
  official_qualification_snapshot: {
    conceptualOwner: OWNER_LABELS.COMPENSATION,
    governingADR: 'ADR-017',
    allowedConsumers: [
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'qualification_as_human_worth',
      'qualification_as_enforcement',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Qualification snapshots require source, period and rules.']
  },
  forecast_assumption: {
    conceptualOwner: OWNER_LABELS.FORECAST,
    governingADR: 'ADR-007',
    allowedConsumers: [
      OWNER_LABELS.FORECAST,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.ECONOMIC_MOTIVATION,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'forecast_as_fact',
      'assumption_as_confirmed_truth',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Forecast assumptions must stay labeled as assumptions.']
  },
  business_goal: {
    conceptualOwner: OWNER_LABELS.BUSINESS_PLANNING,
    governingADR: 'ADR-012',
    allowedConsumers: [
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.NBA,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.ECONOMIC_MOTIVATION,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'goal_as_real_production',
      'goal_as_client_pressure',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Goals require source and period.']
  },
  campaign_goal: {
    conceptualOwner: OWNER_LABELS.BUSINESS_PLANNING,
    governingADR: 'ADR-012',
    allowedConsumers: [
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.ECONOMIC_MOTIVATION
    ],
    prohibitedReinterpretations: [
      'campaign_goal_as_real_production',
      'campaign_goal_as_client_pressure',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Campaign goals do not create production facts.']
  },
  raw_system_activity_log: {
    conceptualOwner: OWNER_LABELS.EVIDENCE,
    governingADR: 'ADR-001',
    allowedConsumers: [
      OWNER_LABELS.EVIDENCE,
      OWNER_LABELS.PRODUCTIVITY,
      OWNER_LABELS.MICK,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'raw_log_as_behavior_truth',
      'raw_log_as_human_worth',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Raw logs are evidence, not behavior interpretation.']
  },
  task_completion_record: {
    conceptualOwner: OWNER_LABELS.PRODUCTIVITY,
    governingADR: 'ADR-014',
    allowedConsumers: [
      OWNER_LABELS.PRODUCTIVITY,
      OWNER_LABELS.MICK,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'completion_as_human_worth',
      'completion_as_client_value',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Task completion is productivity context, not human judgment.']
  },
  calendar_record: {
    conceptualOwner: OWNER_LABELS.EVIDENCE,
    governingADR: 'ADR-001',
    allowedConsumers: [
      OWNER_LABELS.EVIDENCE,
      OWNER_LABELS.PRODUCTIVITY,
      OWNER_LABELS.MICK,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.MANAGER
    ],
    prohibitedReinterpretations: [
      'calendar_event_as_outcome',
      'calendar_gap_as_character',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Calendar records are evidence of scheduled time only.']
  },
  nash_output: {
    conceptualOwner: OWNER_LABELS.NASH,
    governingADR: 'ADR-010',
    allowedConsumers: [
      OWNER_LABELS.NASH,
      OWNER_LABELS.NBA,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'nash_as_client_intent',
      'nash_as_product_truth',
      'nash_as_policy_truth',
      'nash_as_relationship_permission',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['NASH owns conversation guidance, not client truth.']
  },
  nba_output: {
    conceptualOwner: OWNER_LABELS.NBA,
    governingADR: 'ADR-009',
    allowedConsumers: [
      OWNER_LABELS.NBA,
      OWNER_LABELS.NASH,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'nba_as_mandate',
      'priority_as_decision',
      'payout_as_priority',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['NBA prioritizes; humans decide.']
  },
  mick_behavior_signal: {
    conceptualOwner: OWNER_LABELS.MICK,
    governingADR: 'ADR-013',
    allowedConsumers: [
      OWNER_LABELS.MICK,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'behavior_signal_as_character',
      'behavior_signal_as_motivation',
      'behavior_signal_as_enforcement',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Mick owns behavior pattern signals only.']
  },
  productivity_metric: {
    conceptualOwner: OWNER_LABELS.PRODUCTIVITY,
    governingADR: 'ADR-014',
    allowedConsumers: [
      OWNER_LABELS.PRODUCTIVITY,
      OWNER_LABELS.MICK,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.NBA,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'productivity_as_human_worth',
      'metric_as_punishment',
      'metric_as_character',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Productivity owns metrics, not human worth.']
  },
  manager_intelligence_signal: {
    conceptualOwner: OWNER_LABELS.MANAGER,
    governingADR: 'ADR-015',
    allowedConsumers: [
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.ADVISOR_EXPERIENCE,
      OWNER_LABELS.BUSINESS_PLANNING
    ],
    prohibitedReinterpretations: [
      'manager_signal_as_enforcement',
      'manager_signal_as_human_ranking',
      'manager_signal_as_punishment',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Manager Intelligence supports coaching context only.']
  },
  advisor_experience_signal: {
    conceptualOwner: OWNER_LABELS.ADVISOR_EXPERIENCE,
    governingADR: 'ADR-016',
    allowedConsumers: [
      OWNER_LABELS.ADVISOR_EXPERIENCE,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.BUSINESS_PLANNING
    ],
    prohibitedReinterpretations: [
      'advisor_help_as_dependency',
      'learning_state_as_surveillance',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Advisor Experience owns learning and support context.']
  },
  relationship_context: {
    conceptualOwner: OWNER_LABELS.RELATIONSHIP,
    governingADR: 'ADR-011',
    allowedConsumers: [
      OWNER_LABELS.RELATIONSHIP,
      OWNER_LABELS.NASH,
      OWNER_LABELS.NBA,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'relationship_as_permission',
      'relationship_as_client_intent',
      'relationship_as_commercial_obligation',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Relationship context is opportunity/context only.']
  },
  economic_value: {
    conceptualOwner: OWNER_LABELS.ECONOMIC,
    governingADR: 'ADR-008',
    allowedConsumers: [
      OWNER_LABELS.ECONOMIC,
      OWNER_LABELS.FORECAST,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.ECONOMIC_MOTIVATION,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'economic_value_as_client_pressure',
      'economic_value_as_product_suitability',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Economic values require source, currency, period and limits.']
  },
  current_udi_value: {
    conceptualOwner: OWNER_LABELS.ECONOMIC,
    governingADR: 'ADR-008',
    allowedConsumers: [
      OWNER_LABELS.ECONOMIC,
      OWNER_LABELS.FORECAST,
      OWNER_LABELS.PRODUCT,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'udi_as_product_truth',
      'udi_as_future_guarantee',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Current UDI value is Economic Evidence.']
  },
  fx_rate: {
    conceptualOwner: OWNER_LABELS.ECONOMIC,
    governingADR: 'ADR-008',
    allowedConsumers: [
      OWNER_LABELS.ECONOMIC,
      OWNER_LABELS.FORECAST,
      OWNER_LABELS.PRODUCT,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'fx_as_product_truth',
      'fx_as_future_guarantee',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['FX rate source truth is Economic Evidence.']
  },
  policy_event: {
    conceptualOwner: OWNER_LABELS.POLICY,
    governingADR: 'ADR-006',
    allowedConsumers: [
      OWNER_LABELS.POLICY,
      OWNER_LABELS.NBA,
      OWNER_LABELS.NASH,
      OWNER_LABELS.BUSINESS_PLANNING,
      OWNER_LABELS.MANAGER,
      OWNER_LABELS.COMPENSATION,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'policy_event_as_forecast',
      'policy_event_as_client_intent',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Policy events require policy evidence and context.']
  },
  product_condition: {
    conceptualOwner: OWNER_LABELS.PRODUCT,
    governingADR: 'ADR-005',
    allowedConsumers: [
      OWNER_LABELS.PRODUCT,
      OWNER_LABELS.POLICY,
      OWNER_LABELS.NASH,
      OWNER_LABELS.NBA,
      OWNER_LABELS.ADVISOR_EXPERIENCE
    ],
    prohibitedReinterpretations: [
      'product_condition_as_policy_fact',
      'product_condition_as_suitability',
      ...COMMON_PROHIBITIONS
    ],
    notes: ['Product condition is product truth, not policy truth.']
  },
  conflicting_owner_fixture: {
    conceptualOwner: null,
    governingADR: 'ADR-001',
    allowedConsumers: [],
    prohibitedReinterpretations: COMMON_PROHIBITIONS,
    ownershipStatus: 'owner_conflicting',
    notes: ['Validation fixture for conflicting owner behavior.']
  }
};

// Ownership classification only. This is not recommendation approval,
// prioritization approval, action authorization, workflow authorization, or
// recommendation validity.
const CLAIM_OWNERSHIP = {
  product_allows_x: {
    conceptualOwner: OWNER_LABELS.PRODUCT,
    governingADR: 'ADR-005',
    allowedConsumers: [OWNER_LABELS.PRODUCT, OWNER_LABELS.POLICY, OWNER_LABELS.NASH, OWNER_LABELS.NBA, OWNER_LABELS.ADVISOR_EXPERIENCE],
    prohibitedReinterpretations: ['product_claim_as_policy_fact', ...COMMON_PROHIBITIONS],
    notes: ['Product allowance claims require Product Truth.']
  },
  policy_has_x: {
    conceptualOwner: OWNER_LABELS.POLICY,
    governingADR: 'ADR-006',
    allowedConsumers: [OWNER_LABELS.POLICY, OWNER_LABELS.NASH, OWNER_LABELS.NBA, OWNER_LABELS.BUSINESS_PLANNING, OWNER_LABELS.ADVISOR_EXPERIENCE],
    prohibitedReinterpretations: ['policy_claim_from_quote', ...COMMON_PROHIBITIONS],
    notes: ['Policy has claims require Policy Truth.']
  },
  policy_will_cancel: {
    conceptualOwner: OWNER_LABELS.FORECAST,
    governingADR: 'ADR-007',
    allowedConsumers: [OWNER_LABELS.FORECAST, OWNER_LABELS.BUSINESS_PLANNING, OWNER_LABELS.MANAGER],
    prohibitedReinterpretations: ['forecast_as_fact', 'risk_as_confirmed_event', ...COMMON_PROHIBITIONS],
    notes: ['Future cancellation is forecast, not policy fact.']
  },
  policy_cancellation_risk: {
    conceptualOwner: OWNER_LABELS.FORECAST,
    governingADR: 'ADR-007',
    allowedConsumers: [OWNER_LABELS.FORECAST, OWNER_LABELS.BUSINESS_PLANNING, OWNER_LABELS.MANAGER, OWNER_LABELS.NBA],
    prohibitedReinterpretations: ['risk_as_confirmed_event', ...COMMON_PROHIBITIONS],
    notes: ['Cancellation risk remains a scenario or risk signal.']
  },
  advisor_has_produced_x: {
    conceptualOwner: OWNER_LABELS.METRIC,
    governingADR: 'ADR-002',
    allowedConsumers: [OWNER_LABELS.METRIC, OWNER_LABELS.PRODUCTIVITY, OWNER_LABELS.COMPENSATION, OWNER_LABELS.MANAGER],
    prohibitedReinterpretations: ['production_metric_as_human_worth', ...COMMON_PROHIBITIONS],
    notes: ['Production claims require official metric ownership.']
  },
  premium_is_paid: {
    conceptualOwner: OWNER_LABELS.POLICY,
    governingADR: 'ADR-006',
    allowedConsumers: [OWNER_LABELS.POLICY, OWNER_LABELS.ECONOMIC, OWNER_LABELS.COMPENSATION],
    prohibitedReinterpretations: ['issued_as_paid', 'quote_as_payment', ...COMMON_PROHIBITIONS],
    notes: ['Paid premium requires payment evidence.']
  },
  premium_is_issued: {
    conceptualOwner: OWNER_LABELS.POLICY,
    governingADR: 'ADR-006',
    allowedConsumers: [OWNER_LABELS.POLICY, OWNER_LABELS.ECONOMIC, OWNER_LABELS.COMPENSATION],
    prohibitedReinterpretations: ['issued_as_paid', ...COMMON_PROHIBITIONS],
    notes: ['Issued premium is not paid premium.']
  },
  income_is_paid: {
    conceptualOwner: OWNER_LABELS.ECONOMIC,
    governingADR: 'ADR-008',
    allowedConsumers: [OWNER_LABELS.ECONOMIC, OWNER_LABELS.COMPENSATION, OWNER_LABELS.ADVISOR_EXPERIENCE],
    prohibitedReinterpretations: ['compensation_scenario_as_payment', 'forecast_as_fact', ...COMMON_PROHIBITIONS],
    notes: ['Paid income requires payment evidence.']
  },
  commission_is_estimated: {
    conceptualOwner: OWNER_LABELS.COMPENSATION,
    governingADR: 'ADR-017',
    allowedConsumers: [OWNER_LABELS.COMPENSATION, OWNER_LABELS.BUSINESS_PLANNING, OWNER_LABELS.ECONOMIC_MOTIVATION, OWNER_LABELS.ADVISOR_EXPERIENCE],
    prohibitedReinterpretations: ['estimated_commission_as_paid_income', 'commission_as_product_recommendation', ...COMMON_PROHIBITIONS],
    notes: ['Estimated commission is not paid income.']
  },
  bonus_is_confirmed: {
    conceptualOwner: OWNER_LABELS.COMPENSATION,
    governingADR: 'ADR-017',
    allowedConsumers: [OWNER_LABELS.COMPENSATION, OWNER_LABELS.BUSINESS_PLANNING, OWNER_LABELS.MANAGER, OWNER_LABELS.ADVISOR_EXPERIENCE],
    prohibitedReinterpretations: ['bonus_scenario_as_confirmed_bonus', ...COMMON_PROHIBITIONS],
    notes: ['Confirmed bonus requires rule, snapshot and evidence.']
  },
  forecast_suggests_risk: {
    conceptualOwner: OWNER_LABELS.FORECAST,
    governingADR: 'ADR-007',
    allowedConsumers: [OWNER_LABELS.FORECAST, OWNER_LABELS.NBA, OWNER_LABELS.BUSINESS_PLANNING, OWNER_LABELS.MANAGER],
    prohibitedReinterpretations: ['forecast_as_fact', 'risk_as_confirmed_event', ...COMMON_PROHIBITIONS],
    notes: ['Forecast risk remains a scenario.']
  },
  action_is_prioritized: {
    conceptualOwner: OWNER_LABELS.NBA,
    governingADR: 'ADR-009',
    allowedConsumers: [OWNER_LABELS.NBA, OWNER_LABELS.NASH, OWNER_LABELS.BUSINESS_PLANNING, OWNER_LABELS.ADVISOR_EXPERIENCE],
    prohibitedReinterpretations: ['nba_as_mandate', 'priority_as_decision', ...COMMON_PROHIBITIONS],
    notes: ['NBA priority is not mandate.']
  },
  message_should_be_sent: {
    conceptualOwner: OWNER_LABELS.NASH,
    governingADR: 'ADR-010',
    allowedConsumers: [OWNER_LABELS.NASH, OWNER_LABELS.ADVISOR_EXPERIENCE],
    prohibitedReinterpretations: ['nash_as_client_intent', 'nash_as_execution', 'message_guidance_as_permission', ...COMMON_PROHIBITIONS],
    notes: ['NASH can guide language; humans approve sending.']
  },
  relationship_is_opportunity: {
    conceptualOwner: OWNER_LABELS.RELATIONSHIP,
    governingADR: 'ADR-011',
    allowedConsumers: [OWNER_LABELS.RELATIONSHIP, OWNER_LABELS.NBA, OWNER_LABELS.NASH, OWNER_LABELS.BUSINESS_PLANNING, OWNER_LABELS.MANAGER],
    prohibitedReinterpretations: ['relationship_as_permission', 'relationship_as_client_intent', ...COMMON_PROHIBITIONS],
    notes: ['Relationship opportunity is not permission.']
  },
  productivity_metric_below_target: {
    conceptualOwner: OWNER_LABELS.PRODUCTIVITY,
    governingADR: 'ADR-014',
    allowedConsumers: [OWNER_LABELS.PRODUCTIVITY, OWNER_LABELS.MANAGER, OWNER_LABELS.BUSINESS_PLANNING, OWNER_LABELS.MICK],
    prohibitedReinterpretations: ['productivity_as_human_worth', 'metric_as_punishment', ...COMMON_PROHIBITIONS],
    notes: ['Productivity metric is metric context only.']
  },
  manager_should_review: {
    conceptualOwner: OWNER_LABELS.MANAGER,
    governingADR: 'ADR-015',
    allowedConsumers: [OWNER_LABELS.MANAGER],
    prohibitedReinterpretations: ['manager_signal_as_enforcement', 'manager_review_as_punishment', ...COMMON_PROHIBITIONS],
    notes: ['Manager review is coaching context, not enforcement.']
  },
  plan_is_stale: {
    conceptualOwner: OWNER_LABELS.BUSINESS_PLANNING,
    governingADR: 'ADR-012',
    allowedConsumers: [OWNER_LABELS.BUSINESS_PLANNING, OWNER_LABELS.MANAGER, OWNER_LABELS.ADVISOR_EXPERIENCE],
    prohibitedReinterpretations: ['stale_plan_as_failure', 'plan_as_mandate', ...COMMON_PROHIBITIONS],
    notes: ['Stale plan supports review, not punishment.']
  },
  economic_gap_matters: {
    conceptualOwner: OWNER_LABELS.ECONOMIC_MOTIVATION,
    governingADR: 'ADR-018',
    allowedConsumers: [OWNER_LABELS.ECONOMIC_MOTIVATION, OWNER_LABELS.BUSINESS_PLANNING, OWNER_LABELS.ADVISOR_EXPERIENCE],
    prohibitedReinterpretations: ['economic_gap_as_client_pressure', 'money_as_mandate', ...COMMON_PROHIBITIONS],
    notes: ['Money is context, not pressure.']
  },
  client_should_be_contacted: {
    conceptualOwner: OWNER_LABELS.NBA,
    governingADR: 'ADR-009',
    allowedConsumers: [OWNER_LABELS.NBA, OWNER_LABELS.NASH, OWNER_LABELS.ADVISOR_EXPERIENCE],
    prohibitedReinterpretations: ['nba_as_mandate', 'relationship_as_permission', 'nash_as_execution', ...COMMON_PROHIBITIONS],
    notes: ['Contact recommendation needs evidence and human authority.']
  },
  value_is_unknown: {
    conceptualOwner: OWNER_LABELS.EVIDENCE,
    governingADR: 'ADR-001',
    allowedConsumers: ALL_CONSUMERS,
    prohibitedReinterpretations: ['unknown_as_known', 'unknown_as_zero', ...COMMON_PROHIBITIONS],
    notes: ['Unknown remains unknown.']
  }
};

const REINTERPRETATION_ALIASES = {
  scenario_into_fact: 'forecast_as_fact',
  forecast_as_fact: 'forecast_as_fact',
  quote_into_policy: 'quote_as_policy',
  quote_as_policy: 'quote_as_policy',
  quote_into_payment: 'quote_as_payment',
  issued_as_paid: 'issued_as_paid',
  issued_premium_into_paid_premium: 'issued_as_paid',
  compensation_scenario_into_payment: 'compensation_scenario_as_payment',
  compensation_scenario_as_payment: 'compensation_scenario_as_payment',
  relationship_context_into_permission: 'relationship_as_permission',
  relationship_as_permission: 'relationship_as_permission',
  productivity_metric_into_human_worth: 'productivity_as_human_worth',
  productivity_as_human_worth: 'productivity_as_human_worth',
  manager_signal_into_enforcement: 'manager_signal_as_enforcement',
  manager_signal_as_enforcement: 'manager_signal_as_enforcement',
  nba_priority_into_mandate: 'nba_as_mandate',
  nba_as_mandate: 'nba_as_mandate',
  nash_guidance_into_client_intent: 'nash_as_client_intent',
  nash_as_client_intent: 'nash_as_client_intent'
};

function normalizeKey(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeDomain(value = '') {
  const normalized = String(value).trim().toLowerCase();
  return Object.values(OWNER_LABELS).find((label) => label.toLowerCase() === normalized) || String(value).trim();
}

function cloneList(values = []) {
  return [...values];
}

function ambiguousOwnershipResult(sourceType = '', claimType = '') {
  return {
    status: 'owner_ambiguous',
    conceptualOwner: null,
    governingADR: null,
    allowedConsumers: [],
    prohibitedReinterpretations: cloneList(COMMON_PROHIBITIONS),
    ownershipStatus: 'owner_ambiguous',
    consumerStatus: null,
    reinterpretationStatus: null,
    warnings: [
      `Ambiguous ownership: both sourceType (${sourceType || 'not provided'}) and claimType (${claimType || 'not provided'}) were supplied.`
    ],
    blocked: true,
    blockedReason: 'Ownership is ambiguous; strong output must be blocked until only one ownership path is supplied.',
    notes: [
      'Ownership is not validity.',
      'Ambiguous ownership blocks strong output, but it does not stop workflow, deny execution, enforce behavior or gate user action.',
      'This registry does not silently resolve dual ownership paths.'
    ]
  };
}

function buildResult(record, fallbackStatus = 'owner_confirmed') {
  const ownershipStatus = record.ownershipStatus || fallbackStatus;
  return {
    status: ownershipStatus,
    conceptualOwner: record.conceptualOwner || null,
    governingADR: record.governingADR || null,
    allowedConsumers: cloneList(record.allowedConsumers),
    prohibitedReinterpretations: cloneList(record.prohibitedReinterpretations),
    ownershipStatus,
    consumerStatus: null,
    reinterpretationStatus: null,
    warnings: [],
    blocked: ownershipStatus === 'owner_unknown' || ownershipStatus === 'owner_conflicting',
    blockedReason:
      ownershipStatus === 'owner_unknown'
        ? 'Owner is unknown; strong output must be blocked.'
        : ownershipStatus === 'owner_conflicting'
          ? 'Owner is conflicting; strong output must be blocked.'
          : null,
    notes: cloneList(record.notes)
  };
}

function unknownResult(kind, key) {
  return {
    status: 'owner_unknown',
    conceptualOwner: null,
    governingADR: 'ADR-001',
    allowedConsumers: [],
    prohibitedReinterpretations: cloneList(COMMON_PROHIBITIONS),
    ownershipStatus: 'owner_unknown',
    consumerStatus: null,
    reinterpretationStatus: null,
    warnings: [`Unknown ${kind}: ${key || 'not provided'}.`],
    blocked: true,
    blockedReason: 'Owner is unknown; strong output must be blocked.',
    notes: [
      'Ownership is not validity.',
      'Unknown ownership blocks strong output, but it does not stop workflow, deny execution, enforce behavior or gate user action.',
      'Additional validation is required elsewhere; this registry does not perform validation.'
    ]
  };
}

function findOwnership({ sourceType, claimType } = {}) {
  if (sourceType && claimType) {
    return ambiguousOwnershipResult(sourceType, claimType);
  }

  if (sourceType) {
    return getSourceOwnership(sourceType);
  }

  if (claimType) {
    return getClaimOwnership(claimType);
  }

  return {
    status: 'owner_not_applicable',
    conceptualOwner: null,
    governingADR: null,
    allowedConsumers: [],
    prohibitedReinterpretations: [],
    ownershipStatus: 'owner_not_applicable',
    consumerStatus: null,
    reinterpretationStatus: null,
    warnings: ['No sourceType or claimType provided.'],
    blocked: false,
    blockedReason: null,
    notes: ['Ownership cannot be evaluated without a source or claim.']
  };
}

function matchReinterpretation(attemptedInterpretation = '', prohibited = []) {
  const normalized = normalizeKey(attemptedInterpretation);
  const canonical = REINTERPRETATION_ALIASES[normalized] || normalized;
  return prohibited.find((item) => normalizeKey(item) === canonical);
}

export function getSourceOwnership(sourceType = '') {
  const key = normalizeKey(sourceType);
  const record = SOURCE_OWNERSHIP[key];

  if (!record) {
    return unknownResult('sourceType', sourceType);
  }

  return buildResult(record);
}

export function getClaimOwnership(claimType = '') {
  const key = normalizeKey(claimType);
  const record = CLAIM_OWNERSHIP[key];

  if (!record) {
    return unknownResult('claimType', claimType);
  }

  return buildResult(record);
}

export function canDomainConsume({ consumingDomain = '', sourceType = '', claimType = '' } = {}) {
  const ownership = findOwnership({ sourceType, claimType });
  const domain = normalizeDomain(consumingDomain);

  if (ownership.blocked) {
    return {
      ...ownership,
      status: ownership.status,
      consumerStatus: 'consumer_restricted',
      warnings: [...ownership.warnings, 'Consumer check restricted because ownership is not confirmed.']
    };
  }

  if (!domain) {
    return {
      ...ownership,
      status: 'consumer_restricted',
      consumerStatus: 'consumer_restricted',
      warnings: [...ownership.warnings, 'Consuming domain is required.'],
      blocked: true,
      blockedReason: 'Consuming domain is required.'
    };
  }

  const allowed = ownership.allowedConsumers.includes(domain);

  return {
    ...ownership,
    status: allowed ? 'consumer_allowed' : 'consumer_restricted',
    consumerStatus: allowed ? 'consumer_allowed' : 'consumer_restricted',
    warnings: allowed ? ownership.warnings : [...ownership.warnings, `${domain} is not an allowed consumer.`],
    blocked: ownership.blocked || !allowed,
    blockedReason: !allowed ? 'Consuming domain is restricted for this source or claim.' : ownership.blockedReason
  };
}

export function checkReinterpretationRisk({
  consumingDomain = '',
  sourceType = '',
  claimType = '',
  attemptedInterpretation = ''
} = {}) {
  const consumer = consumingDomain
    ? canDomainConsume({ consumingDomain, sourceType, claimType })
    : findOwnership({ sourceType, claimType });
  const matched = matchReinterpretation(
    attemptedInterpretation,
    consumer.prohibitedReinterpretations || []
  );

  if (!attemptedInterpretation) {
    return {
      ...consumer,
      reinterpretationStatus: 'validation_required',
      warnings: [...consumer.warnings, 'No attempted interpretation provided. Additional validation is required elsewhere; this registry does not validate evidence.'],
      notes: [...consumer.notes, 'No reinterpretation risk was evaluated.']
    };
  }

  if (matched) {
    return {
      ...consumer,
      status: 'reinterpretation_blocked',
      reinterpretationStatus: 'reinterpretation_blocked',
      warnings: [...consumer.warnings, `Attempted interpretation is prohibited: ${matched}.`],
      blocked: true,
      blockedReason: 'Attempted interpretation matches a prohibited reinterpretation.'
    };
  }

  return {
    ...consumer,
    reinterpretationStatus: 'validation_required',
    warnings: [...consumer.warnings, 'Ownership registry found no prohibited reinterpretation match; additional validation is required elsewhere and this registry does not validate evidence.'],
    notes: [...consumer.notes, 'Ownership is not validity.']
  };
}

export function evaluateOwnership({
  sourceType = '',
  claimType = '',
  consumingDomain = '',
  attemptedInterpretation = ''
} = {}) {
  const ownership = findOwnership({ sourceType, claimType });

  const consumer = consumingDomain
    ? canDomainConsume({ consumingDomain, sourceType, claimType })
    : ownership;

  const reinterpretation = attemptedInterpretation
    ? checkReinterpretationRisk({ consumingDomain, sourceType, claimType, attemptedInterpretation })
    : consumer;

  const blocked = Boolean(ownership.blocked || consumer.blocked || reinterpretation.blocked);
  const warnings = [
    ...new Set([
      ...(ownership.warnings || []),
      ...(consumer.warnings || []),
      ...(reinterpretation.warnings || [])
    ])
  ];

  return {
    ...reinterpretation,
    ownershipStatus: ownership.ownershipStatus,
    consumerStatus: consumer.consumerStatus,
    reinterpretationStatus: reinterpretation.reinterpretationStatus,
    warnings,
    blocked,
    blockedReason:
      reinterpretation.blockedReason
      || consumer.blockedReason
      || ownership.blockedReason
      || null,
    notes: [
      ...new Set([
        ...(ownership.notes || []),
        ...(consumer.notes || []),
        ...(reinterpretation.notes || [])
      ])
    ]
  };
}

export default {
  getSourceOwnership,
  getClaimOwnership,
  canDomainConsume,
  checkReinterpretationRisk,
  evaluateOwnership
};
