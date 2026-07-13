import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { ORVI_PDF_PARSER_IMPLEMENTATION_REF } from "../product-intelligence/quotes/orvi-pdf-parser-contract.js";
import { parseOrviSolucionlinePdfText } from "../product-intelligence/quotes/orvi-solucionline-pdf-text-parser.js";
import {
  ORVI_PDF_TO_PRODUCT_INTELLIGENCE_ADAPTER_ID,
  mapOrviPdfEnvelopeToProductIntelligence,
} from "../product-intelligence/quotes/orvi-pdf-to-product-intelligence.js";
import { validateOrviProductIntelligence } from "../product-intelligence/knowledge/orvi-product-intelligence.js";

const text = await readFile(new URL("../fixtures/orvi-solucionline-synthetic-quote.txt", import.meta.url), "utf8");
const envelope = parseOrviSolucionlinePdfText(text);
const envelopeSnapshot = structuredClone(envelope);
const model = mapOrviPdfEnvelopeToProductIntelligence(envelope);

assert.deepEqual(envelope, envelopeSnapshot, "mapper must not mutate parser envelope");
assert.equal(validateOrviProductIntelligence(model).valid, true);
assert.equal(model.identity.product_type, "orvi");
assert.equal(model.identity.plan_variant, "ORVI SYNTHETIC 10 PAY USD");
assert.equal(model.identity.currency, "USD");
assert.equal(model.ownership.parser_ref, ORVI_PDF_PARSER_IMPLEMENTATION_REF);
assert.equal(model.readiness.parser_required, false);
assert.equal(model.readiness.runtime_wiring_authorized, false);
assert.equal(model.readiness.dashboard_authorized, false);
assert.equal(model.readiness.status, "CANONICAL_MODEL_COMPLETE");
assert.equal(model.premium_structure.payment_term_years, 10);
assert.equal(model.premium_structure.basic_annual_premium.value, 1387.4);
assert.equal(model.premium_structure.additional_annual_premium.value, 173);
assert.equal(model.premium_structure.total_annual_premium.value, 1481);
assert.equal(model.premium_structure.displayed_total_with_recommended.value, 1707.55);
assert.equal(model.premium_structure.visible_line_item_sum.value, 1692.3);
assert.equal(model.premium_structure.reconciliation.status, "source_displayed_total_unreconciled");
assert.equal(model.premium_structure.reconciliation.source_total_preserved, true);
assert.equal(model.premium_structure.reconciliation.recomputed_override_applied, false);
assert.equal(model.protection_summary.basic_sum_assured.value, 73250);
assert.equal(model.protection_summary.coverage_duration_years, 58);
assert.equal(model.protection_summary.maturity_age, null);
assert.equal(model.protection_summary.included_coverages.length, 3);
assert.equal(model.protection_summary.included_coverages[1].annual_premium.state, "sin_costo");
assert.equal(model.protection_summary.included_coverages[1].sum_assured.state, "amparado");
assert.equal(model.protection_summary.additional_coverages.length, 1);
assert.equal(model.guaranteed_value_timeline.length, 16);
assert.equal(model.guaranteed_value_timeline[0].cash_value.value, 0);
assert.equal(model.guaranteed_value_timeline[0].guaranteed_surrender_value.value, 181);
assert.equal(model.guaranteed_value_timeline[0].total_recovery.value, 181);
assert.equal(model.guaranteed_value_timeline[10].annual_premium.value, 0);
assert.equal(model.guaranteed_value_timeline[10].additional_premium.value, 0);
assert.equal(model.decision_scenarios.recommendation, null);
assert.equal(model.decision_scenarios.human_decision_required, true);
assert.equal(model.mxn_conversion.status, "not_evaluated");
assert.equal(model.mxn_conversion.future_values_are_guaranteed, false);
assert.equal(model.source_trace.length, 5);
assert.equal(model.source_trace.every((entry) => entry.privacy_safe === true), true);
assert.equal(model.privacy.client_name_stored, false);
assert.equal(/@|\b\d{2}\/\d{2}\/\d{4}\b/.test(JSON.stringify(model)), false);
assert.equal(ORVI_PDF_TO_PRODUCT_INTELLIGENCE_ADAPTER_ID, "orvi.pdf-to-product-intelligence.v1");

console.log("PASS R15E ORVI canonical mapping", {
  adapterId: ORVI_PDF_TO_PRODUCT_INTELLIGENCE_ADAPTER_ID,
  parserRef: model.ownership.parser_ref,
  currency: model.identity.currency,
  paymentTermYears: model.premium_structure.payment_term_years,
  timelineRows: model.guaranteed_value_timeline.length,
  readiness: model.readiness.status,
  recommendation: model.decision_scenarios.recommendation,
  mxnStatus: model.mxn_conversion.status,
});
