import assert from "node:assert/strict";
import {
  ORVI_EXISTING_ENGINE_BOUNDARIES,
  ORVI_PRODUCT_INTELLIGENCE_SCHEMA_ID,
  buildOrviProductIntelligence,
  validateOrviProductIntelligence,
} from "../product-intelligence/knowledge/orvi-product-intelligence.js";

const syntheticPrivateMarker = ["SYNTHETIC", "PRIVATE", "MARKER"].join("_");

const syntheticInput = {
  detectedProductName: "ORVI synthetic",
  variant: "ORVI_SYNTHETIC_LIMITED_PAY",
  currency: "UDI",
  clientName: syntheticPrivateMarker,
  clientAge: 42,
  gender: "X",
  sumAssuredUDI: 12345,
  basicAnnualPremiumUDI: 456.78,
  totalAnnualPremiumUDI: 500,
  paymentYears: 17,
  maturityAge: 97,
  guaranteedValues: [
    {
      policyYear: 1,
      realAge: 43,
      annualPremiumUDI: 456.78,
      avePremiumUDI: 43.22,
      cashValueUDI: 0,
      cashValueExplicitZero: true,
      sourceStatus: "synthetic_source_confirmed",
    },
    {
      policyYear: 17,
      realAge: 59,
      annualPremiumUDI: 0,
      annualPremiumExplicitZero: true,
      avePremiumUDI: 0,
      avePremiumExplicitZero: true,
      totalAnnualOutflowUDI: 0,
      totalAnnualOutflowExplicitZero: true,
      cashValueUDI: 6789,
      sourceStatus: "synthetic_source_confirmed",
    },
  ],
  sourceTrace: [
    {
      field: "protection_summary.basic_sum_assured",
      sourceType: "synthetic_fixture",
      sourceRef: "fixture-alpha",
      status: "confirmed",
      privacy_safe: true,
    },
    {
      field: "protection_summary.basic_sum_assured",
      sourceType: "synthetic_fixture",
      sourceRef: "fixture-alpha",
      status: "confirmed",
      privacy_safe: true,
    },
    {
      field: "ignored",
      sourceType: "unsafe",
      sourceRef: "unsafe-source-ref",
      status: "observed",
      privacy_safe: false,
    },
  ],
};

const inputSnapshot = structuredClone(syntheticInput);
const complete = buildOrviProductIntelligence(syntheticInput);

assert.deepEqual(syntheticInput, inputSnapshot, "builder must not mutate input");
assert.equal(complete.schema.id, ORVI_PRODUCT_INTELLIGENCE_SCHEMA_ID);
assert.equal(complete.identity.product_type, "orvi");
assert.equal(complete.identity.plan_variant, "ORVI_SYNTHETIC_LIMITED_PAY");
assert.equal(complete.identity.currency, "UDI");
assert.equal(complete.privacy.client_name_stored, false);
assert.equal("client_name" in complete.participants.primary_insured, false);
assert.equal(JSON.stringify(complete).includes(syntheticPrivateMarker), false);
assert.equal(complete.premium_structure.payment_term_years, 17);
assert.equal(complete.protection_summary.maturity_age, 97);
assert.equal(complete.protection_summary.basic_sum_assured.value, 12345);
assert.equal(complete.guaranteed_value_timeline.length, 2);
assert.equal(complete.guaranteed_value_timeline[0].guaranteed_cash_value.value, 0);
assert.equal(complete.guaranteed_value_timeline[1].annual_premium.value, 0);
assert.equal(complete.guaranteed_value_timeline[1].total_annual_outflow.value, 0);
assert.equal(complete.source_trace.length, 1, "source trace must deduplicate and reject unsafe entries");
assert.equal(complete.decision_scenarios.recommendation, null);
assert.equal(complete.decision_scenarios.human_decision_required, true);
assert.equal(complete.mxn_conversion.status, "not_evaluated");
assert.equal(complete.mxn_conversion.future_values_are_guaranteed, false);
assert.equal(complete.ownership.parser_ref, null);
assert.equal(complete.ownership.runtime_ref, null);
assert.equal(complete.ownership.renderer_ref, null);
assert.equal(complete.readiness.runtime_wiring_authorized, false);
assert.equal(Object.isFrozen(complete), true);
assert.equal(Object.isFrozen(complete.identity), true);

const validation = validateOrviProductIntelligence(complete);
assert.equal(validation.valid, true, validation.errors.join(","));

const sparse = buildOrviProductIntelligence({
  sumAssuredUDI: 0,
  basicAnnualPremiumUDI: 0,
  totalAnnualPremiumUDI: 0,
  paymentYears: 0,
  maturityAge: 0,
  guaranteedValues: [
    {
      policyYear: 1,
      realAge: 40,
      annualPremiumUDI: 0,
      avePremiumUDI: 0,
      cashValueUDI: 0,
    },
  ],
});

assert.equal(sparse.identity.plan_variant, null);
assert.equal(sparse.identity.currency, null);
assert.equal(sparse.premium_structure.payment_term_years, null);
assert.equal(sparse.protection_summary.maturity_age, null);
assert.equal(sparse.protection_summary.basic_sum_assured.value, null);
assert.equal(sparse.premium_structure.basic_annual_premium.value, null);
assert.equal(sparse.premium_structure.total_annual_premium.value, null);
assert.equal(sparse.guaranteed_value_timeline[0].annual_premium.value, null);
assert.equal(sparse.guaranteed_value_timeline[0].additional_premium.value, null);
assert.equal(sparse.guaranteed_value_timeline[0].guaranteed_cash_value.value, null);
assert.equal(sparse.missing_information.includes("identity.plan_variant"), true);
assert.equal(sparse.missing_information.includes("protection_summary.basic_sum_assured.value"), true);
assert.equal(JSON.stringify(sparse).includes('"payment_term_years":20'), false);
assert.equal(JSON.stringify(sparse).includes('"maturity_age":99'), false);

assert.equal(
  ORVI_EXISTING_ENGINE_BOUNDARIES.extractor.authority,
  "evidence_only_not_parser_owner",
);
assert.equal(
  ORVI_EXISTING_ENGINE_BOUNDARIES.decision.authority,
  "legacy_explanation_candidate_not_decision_authority",
);

const corrupted = structuredClone(complete);
corrupted.decision_scenarios.recommendation = "automatic answer";
assert.equal(validateOrviProductIntelligence(corrupted).valid, false);
assert.equal(
  validateOrviProductIntelligence(corrupted).errors.includes("RECOMMENDATION_NOT_AUTHORIZED"),
  true,
);

console.log("PASS R15A ORVI canonical Product Intelligence model", {
  timelineRows: complete.guaranteed_value_timeline.length,
  safeSourceTrace: complete.source_trace.length,
  sparseMissingFields: sparse.missing_information.length,
  parserRef: complete.ownership.parser_ref,
  mxnStatus: complete.mxn_conversion.status,
});
