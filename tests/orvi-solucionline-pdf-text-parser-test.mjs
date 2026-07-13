import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ORVI_PDF_PARSER_IMPLEMENTATION_REF,
  validateOrviPdfParserEnvelope,
} from "../product-intelligence/quotes/orvi-pdf-parser-contract.js";
import {
  ORVI_SOLUCIONLINE_PDF_TEXT_PARSER_ID,
  parseOrviSolucionlinePdfText,
} from "../product-intelligence/quotes/orvi-solucionline-pdf-text-parser.js";

const text = await readFile(new URL("../fixtures/orvi-solucionline-synthetic-quote.txt", import.meta.url), "utf8");
const expected = JSON.parse(await readFile(new URL("../fixtures/orvi-solucionline-synthetic-parsed-expected.json", import.meta.url), "utf8"));
const inputSnapshot = `${text}`;
const parsed = parseOrviSolucionlinePdfText(text);

assert.equal(text, inputSnapshot, "parser must not mutate text");
assert.deepEqual(parsed, expected);
assert.equal(validateOrviPdfParserEnvelope(parsed).valid, true);
assert.equal(parsed.ownership.parser_ref, ORVI_PDF_PARSER_IMPLEMENTATION_REF);
assert.equal(parsed.synthetic_fixture, true);
assert.equal(parsed.document.currency, "USD");
assert.equal(parsed.document.payment_term_years, 10);
assert.equal(parsed.guaranteed_values.rows.length, 16);
assert.equal(parsed.guaranteed_values.rows[10].annual_premium.state, "explicit_zero");
assert.equal(parsed.coverages[1].annual_premium.state, "sin_costo");
assert.equal(parsed.coverages[1].sum_assured.state, "amparado");
assert.equal(parsed.premium_summary.reconciliation.status, "source_displayed_total_unreconciled");
assert.equal(parsed.premium_summary.reconciliation.source_total_preserved, true);
assert.equal(parsed.premium_summary.reconciliation.recomputed_override_applied, false);
assert.equal(parsed.recommendation, null);
assert.equal(parsed.mxn_projection, null);
assert.equal(JSON.stringify(parsed).includes("@"), false);
assert.equal(/\b\d{2}\/\d{2}\/\d{4}\b/.test(JSON.stringify(parsed)), false);
assert.equal(ORVI_SOLUCIONLINE_PDF_TEXT_PARSER_ID, "orvi.solucionline.pdf.text-parser.v1");

assert.throws(() => parseOrviSolucionlinePdfText(""), /non-empty string/);

console.log("PASS R15E ORVI Solucionline PDF text parser", {
  parserId: ORVI_SOLUCIONLINE_PDF_TEXT_PARSER_ID,
  currency: parsed.document.currency,
  paymentTermYears: parsed.document.payment_term_years,
  timelineRows: parsed.guaranteed_values.rows.length,
  coverages: parsed.coverages.length,
  recommendedBenefits: parsed.recommended_benefits.length,
  parserRef: parsed.ownership.parser_ref,
});
