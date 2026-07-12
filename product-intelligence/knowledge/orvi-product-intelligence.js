export const ORVI_PRODUCT_INTELLIGENCE_SCHEMA_ID = "forge.product_intelligence.orvi";
export const ORVI_PRODUCT_INTELLIGENCE_SCHEMA_VERSION = "R15A";

export const ORVI_EXISTING_ENGINE_BOUNDARIES = Object.freeze({
  extractor: Object.freeze({
    ref: "orvi-ocr-extractor.js",
    authority: "evidence_only_not_parser_owner",
    warning: "legacy missing values may be coerced to zero",
  }),
  guaranteed_value_timeline: Object.freeze({
    ref: "orvi-guaranteed-value-timeline-engine.js",
    authority: "candidate_calculation_surface_not_canonical_owner",
  }),
  mxn_conversion: Object.freeze({
    ref: "orvi-mxn-conversion-engine.js",
    authority: "scenario_engine_not_guarantee_owner",
  }),
  wait_vs_cancel: Object.freeze({
    ref: "orvi-wait-vs-cancel-engine.js",
    authority: "comparison_candidate_not_recommendation_authority",
  }),
  decision: Object.freeze({
    ref: "orvi-decision-engine.js",
    authority: "legacy_explanation_candidate_not_decision_authority",
  }),
  event: Object.freeze({
    ref: "orvi-event-engine.js",
    authority: "presentation_candidate_not_product_truth_owner",
  }),
});

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function normalizeString(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeUpperString(value) {
  const normalized = normalizeString(value);
  return normalized ? normalized.toUpperCase() : null;
}

function normalizeFiniteNumber(value, { allowZero = false, explicitZero = false } = {}) {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(number)) return null;
  if (number === 0) return allowZero && explicitZero ? 0 : null;
  return number;
}

function normalizePositiveInteger(value) {
  const number = normalizeFiniteNumber(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function normalizeAge(value) {
  const number = normalizePositiveInteger(value);
  return number !== null && number <= 130 ? number : null;
}

function normalizeExplicitZeroFlag(container, keys = []) {
  if (!isRecord(container)) return false;
  return keys.some((key) => container[key] === true || container[key] === "explicit_zero");
}

function makeMoney({ value, currency, sourcePath, guaranteeStatus = "unknown", explicitZero = false }) {
  const normalizedCurrency = normalizeUpperString(currency);
  const normalizedValue = normalizeFiniteNumber(value, {
    allowZero: true,
    explicitZero,
  });

  return {
    value: normalizedValue,
    currency: normalizedCurrency,
    truth_status: normalizedValue === null ? "missing_information" : "source_provided",
    guarantee_status: guaranteeStatus,
    source_path: sourcePath,
  };
}

function normalizeSourceTrace(sourceTrace) {
  if (!Array.isArray(sourceTrace)) return [];

  const seen = new Set();
  const normalized = [];

  for (const item of sourceTrace) {
    if (!isRecord(item) || item.privacy_safe !== true) continue;

    const field = normalizeString(item.field);
    const sourceType = normalizeString(item.source_type ?? item.sourceType);
    const sourceRef = normalizeString(item.source_ref ?? item.sourceRef);
    const status = normalizeString(item.status) ?? "observed";

    if (!field || !sourceType) continue;

    const key = `${field}|${sourceType}|${sourceRef ?? ""}|${status}`;
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      field,
      source_type: sourceType,
      source_ref: sourceRef,
      status,
      privacy_safe: true,
    });
  }

  return normalized;
}

function normalizeTimelineRow(row, index, defaultCurrency) {
  const source = isRecord(row) ? row : {};
  const policyYear = normalizePositiveInteger(firstDefined(source.policy_year, source.policyYear, source.year));
  const attainedAge = normalizeAge(firstDefined(source.attained_age, source.realAge, source.age));
  const currency = normalizeUpperString(firstDefined(source.currency, defaultCurrency));

  const annualPremiumExplicitZero = normalizeExplicitZeroFlag(source, [
    "annual_premium_explicit_zero",
    "annualPremiumExplicitZero",
  ]);
  const additionalPremiumExplicitZero = normalizeExplicitZeroFlag(source, [
    "additional_premium_explicit_zero",
    "additionalPremiumExplicitZero",
    "ave_premium_explicit_zero",
    "avePremiumExplicitZero",
  ]);
  const totalOutflowExplicitZero = normalizeExplicitZeroFlag(source, [
    "total_annual_outflow_explicit_zero",
    "totalAnnualOutflowExplicitZero",
  ]);
  const cashValueExplicitZero = normalizeExplicitZeroFlag(source, [
    "cash_value_explicit_zero",
    "cashValueExplicitZero",
  ]);

  return {
    row_index: index,
    policy_year: policyYear,
    attained_age: attainedAge,
    annual_premium: makeMoney({
      value: firstDefined(source.annual_premium_udi, source.annualPremiumUDI, source.annual_premium),
      currency,
      explicitZero: annualPremiumExplicitZero,
      guaranteeStatus: "contractual_schedule",
      sourcePath: `guaranteed_value_timeline[${index}].annual_premium`,
    }),
    additional_premium: makeMoney({
      value: firstDefined(source.additional_premium_udi, source.avePremiumUDI, source.additional_premium),
      currency,
      explicitZero: additionalPremiumExplicitZero,
      guaranteeStatus: "contractual_schedule",
      sourcePath: `guaranteed_value_timeline[${index}].additional_premium`,
    }),
    total_annual_outflow: makeMoney({
      value: firstDefined(source.total_annual_outflow_udi, source.totalAnnualOutflowUDI, source.total_annual_outflow),
      currency,
      explicitZero: totalOutflowExplicitZero,
      guaranteeStatus: "contractual_schedule",
      sourcePath: `guaranteed_value_timeline[${index}].total_annual_outflow`,
    }),
    guaranteed_cash_value: makeMoney({
      value: firstDefined(source.cash_value_udi, source.cashValueUDI, source.guaranteed_cash_value),
      currency,
      explicitZero: cashValueExplicitZero,
      guaranteeStatus: "guaranteed_if_source_confirmed",
      sourcePath: `guaranteed_value_timeline[${index}].guaranteed_cash_value`,
    }),
    source_status: normalizeString(source.source_status ?? source.sourceStatus) ?? "input_unverified",
  };
}

function normalizeTimeline(rows, currency) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => normalizeTimelineRow(row, index, currency));
}

function collectMissingInformation(model) {
  const missing = [];
  const push = (path, value) => {
    if (value === null || value === undefined || value === "") missing.push(path);
  };

  push("identity.detected_product_name", model.identity.detected_product_name);
  push("identity.plan_variant", model.identity.plan_variant);
  push("identity.currency", model.identity.currency);
  push("participants.primary_insured.age", model.participants.primary_insured.age);
  push("premium_structure.basic_annual_premium.value", model.premium_structure.basic_annual_premium.value);
  push("premium_structure.total_annual_premium.value", model.premium_structure.total_annual_premium.value);
  push("premium_structure.payment_term_years", model.premium_structure.payment_term_years);
  push("protection_summary.basic_sum_assured.value", model.protection_summary.basic_sum_assured.value);
  push("protection_summary.maturity_age", model.protection_summary.maturity_age);

  if (model.guaranteed_value_timeline.length === 0) {
    missing.push("guaranteed_value_timeline");
  }

  return missing;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export function buildOrviProductIntelligence(input = {}) {
  const source = isRecord(input) ? input : {};
  const identitySource = isRecord(source.identity) ? source.identity : {};
  const participantsSource = isRecord(source.participants) ? source.participants : {};
  const primaryInsuredSource = isRecord(participantsSource.primary_insured)
    ? participantsSource.primary_insured
    : {};
  const premiumSource = isRecord(source.premium_structure) ? source.premium_structure : {};
  const protectionSource = isRecord(source.protection_summary) ? source.protection_summary : {};

  const currency = normalizeUpperString(
    firstDefined(identitySource.currency, source.currency),
  );

  const basicAnnualPremiumValue = firstDefined(
    premiumSource.basic_annual_premium?.value,
    premiumSource.basic_annual_premium,
    source.basicAnnualPremiumUDI,
    source.basic_annual_premium_udi,
  );
  const additionalAnnualPremiumValue = firstDefined(
    premiumSource.additional_annual_premium?.value,
    premiumSource.additional_annual_premium,
    source.additionalAnnualPremiumUDI,
    source.aveAnnualPremiumUDI,
    source.additional_annual_premium_udi,
  );
  const totalAnnualPremiumValue = firstDefined(
    premiumSource.total_annual_premium?.value,
    premiumSource.total_annual_premium,
    source.totalAnnualPremiumUDI,
    source.total_annual_premium_udi,
  );
  const sumAssuredValue = firstDefined(
    protectionSource.basic_sum_assured?.value,
    protectionSource.basic_sum_assured,
    source.sumAssuredUDI,
    source.sum_assured_udi,
  );

  const model = {
    schema: {
      id: ORVI_PRODUCT_INTELLIGENCE_SCHEMA_ID,
      version: ORVI_PRODUCT_INTELLIGENCE_SCHEMA_VERSION,
    },
    identity: {
      product_type: "orvi",
      product_family: "orvi",
      detected_product_name: normalizeString(
        firstDefined(identitySource.detected_product_name, source.detectedProductName, source.product),
      ),
      plan_variant: normalizeString(
        firstDefined(identitySource.plan_variant, source.plan_variant, source.variant),
      ),
      currency,
    },
    ownership: {
      canonical_owner: "product-intelligence",
      parser_ref: null,
      runtime_ref: null,
      renderer_ref: null,
      existing_engine_boundaries: ORVI_EXISTING_ENGINE_BOUNDARIES,
    },
    privacy: {
      client_identity_owner: "outside_product_intelligence",
      client_name_stored: false,
    },
    participants: {
      primary_insured: {
        age: normalizeAge(
          firstDefined(primaryInsuredSource.age, source.clientAge, source.client_age),
        ),
        gender: normalizeString(
          firstDefined(primaryInsuredSource.gender, source.gender),
        ),
      },
    },
    premium_structure: {
      basic_annual_premium: makeMoney({
        value: basicAnnualPremiumValue,
        currency,
        explicitZero: premiumSource.basic_annual_premium_explicit_zero === true,
        guaranteeStatus: "contractual_if_source_confirmed",
        sourcePath: "premium_structure.basic_annual_premium",
      }),
      additional_annual_premium: makeMoney({
        value: additionalAnnualPremiumValue,
        currency,
        explicitZero: premiumSource.additional_annual_premium_explicit_zero === true,
        guaranteeStatus: "contractual_if_source_confirmed",
        sourcePath: "premium_structure.additional_annual_premium",
      }),
      total_annual_premium: makeMoney({
        value: totalAnnualPremiumValue,
        currency,
        explicitZero: premiumSource.total_annual_premium_explicit_zero === true,
        guaranteeStatus: "contractual_if_source_confirmed",
        sourcePath: "premium_structure.total_annual_premium",
      }),
      payment_term_years: normalizePositiveInteger(
        firstDefined(premiumSource.payment_term_years, source.paymentYears, source.payment_years),
      ),
      limited_payment_variant: normalizeString(
        firstDefined(premiumSource.limited_payment_variant, source.limitedPaymentVariant),
      ),
    },
    protection_summary: {
      basic_sum_assured: makeMoney({
        value: sumAssuredValue,
        currency,
        explicitZero: protectionSource.basic_sum_assured_explicit_zero === true,
        guaranteeStatus: "contractual_if_source_confirmed",
        sourcePath: "protection_summary.basic_sum_assured",
      }),
      maturity_age: normalizeAge(
        firstDefined(protectionSource.maturity_age, source.maturityAge, source.maturity_age),
      ),
      included_coverages: Array.isArray(protectionSource.included_coverages)
        ? structuredClone(protectionSource.included_coverages)
        : [],
      additional_coverages: Array.isArray(protectionSource.additional_coverages)
        ? structuredClone(protectionSource.additional_coverages)
        : [],
    },
    guaranteed_value_timeline: normalizeTimeline(
      firstDefined(source.guaranteed_value_timeline, source.guaranteedValues),
      currency,
    ),
    decision_scenarios: {
      status: "not_evaluated",
      continue_or_wait: null,
      cancel_or_surrender: null,
      comparison_status: "unknown",
      recommendation: null,
      human_decision_required: true,
    },
    mxn_conversion: {
      status: "not_evaluated",
      current_udi_metadata: null,
      current_values: [],
      projected_values: [],
      scenario_status: "not_evaluated",
      future_values_are_guaranteed: false,
    },
    source_trace: normalizeSourceTrace(source.source_trace ?? source.sourceTrace),
    missing_information: [],
    readiness: {
      status: "PARTIAL",
      parser_required: true,
      runtime_wiring_authorized: false,
      dashboard_authorized: false,
    },
  };

  model.missing_information = collectMissingInformation(model);
  model.readiness.status = model.missing_information.length === 0 ? "CANONICAL_MODEL_COMPLETE" : "PARTIAL";

  return deepFreeze(model);
}

export function validateOrviProductIntelligence(model) {
  const errors = [];

  if (!isRecord(model)) errors.push("MODEL_NOT_OBJECT");
  if (model?.schema?.id !== ORVI_PRODUCT_INTELLIGENCE_SCHEMA_ID) errors.push("SCHEMA_ID_INVALID");
  if (model?.identity?.product_type !== "orvi") errors.push("PRODUCT_TYPE_INVALID");
  if (model?.ownership?.canonical_owner !== "product-intelligence") errors.push("CANONICAL_OWNER_INVALID");
  if (model?.ownership?.parser_ref !== null) errors.push("PARSER_REF_MUST_REMAIN_NULL_IN_R15A");
  if (model?.decision_scenarios?.recommendation !== null) errors.push("RECOMMENDATION_NOT_AUTHORIZED");
  if (model?.decision_scenarios?.human_decision_required !== true) errors.push("HUMAN_DECISION_GATE_MISSING");
  if (model?.mxn_conversion?.status !== "not_evaluated") errors.push("MXN_CONVERSION_NOT_AUTHORIZED");
  if (model?.mxn_conversion?.future_values_are_guaranteed !== false) errors.push("FUTURE_MXN_GUARANTEE_INVALID");
  if (!Array.isArray(model?.missing_information)) errors.push("MISSING_INFORMATION_INVALID");

  const serialized = JSON.stringify(model);
  if (/NaN|Infinity|undefined/.test(serialized)) errors.push("NON_JSON_FINITE_VALUE_PRESENT");

  return {
    valid: errors.length === 0,
    errors,
  };
}
