import assert from 'node:assert/strict';

import {
  loadDefaultSMNYLPartner2026RulePack,
} from '../compensation/partner-manager/rule-engine/partner-rule-pack-loader.js';

import {
  deriveSemesterIndexFromCareerMonth,
  getConcept,
  resolveBandRate,
  resolveExactOrAboveScale,
  resolveExactOrPlusScale,
  resolveSemesterAmount,
  resolveThresholdScale,
} from '../compensation/partner-manager/rule-engine/partner-rule-resolver.js';

const rulePack = loadDefaultSMNYLPartner2026RulePack();

assert.equal(getConcept(rulePack, 'productivity-base').displayName, 'Productividad Base');

const productivityConcept = getConcept(rulePack, 'productivity-base');
const firstBand = productivityConcept.table.bands[0];
const firstClass = Object.keys(firstBand.rates)[0];
const firstClassRate = firstBand.rates[firstClass];
assert.equal(resolveBandRate({
  bands: productivityConcept.table.bands,
  value: firstBand.minAverageMonthlyInitialCommissions,
  classKey: firstClass,
}).rate, firstClassRate);

const multiplierConcept = getConcept(rulePack, 'productivity-multiplier');
const multiplierScale = multiplierConcept.scale || multiplierConcept.table;
const multiplierRow = multiplierScale[0];
assert.equal(multiplierConcept.trainingWinnerPayFactor.withTrainingWinnerInQuarter.payFactor, 1);
assert.equal(multiplierConcept.trainingWinnerPayFactor.withoutTrainingWinnerInQuarter.payFactor, 0.8);
assert.equal(resolveThresholdScale({
  scale: multiplierScale,
  value: multiplierRow.qualifiedAdvisorCount,
  valueKey: 'qualifiedAdvisorCount',
  resultKey: 'multiplierRate',
}).value, multiplierRow.multiplierRate);
assert.deepEqual(
  multiplierScale.map((row) => ({
    qualifiedAdvisorCount: row.qualifiedAdvisorCount,
    multiplierRate: row.multiplierRate,
    appliesToCountAndAbove: row.appliesToCountAndAbove === true,
  })),
  [
    { qualifiedAdvisorCount: 3, multiplierRate: 0.3, appliesToCountAndAbove: false },
    { qualifiedAdvisorCount: 4, multiplierRate: 0.4, appliesToCountAndAbove: false },
    { qualifiedAdvisorCount: 5, multiplierRate: 0.5, appliesToCountAndAbove: false },
    { qualifiedAdvisorCount: 6, multiplierRate: 0.6, appliesToCountAndAbove: false },
    { qualifiedAdvisorCount: 7, multiplierRate: 0.7, appliesToCountAndAbove: false },
    { qualifiedAdvisorCount: 8, multiplierRate: 0.8, appliesToCountAndAbove: false },
    { qualifiedAdvisorCount: 9, multiplierRate: 0.9, appliesToCountAndAbove: false },
    { qualifiedAdvisorCount: 10, multiplierRate: 1, appliesToCountAndAbove: true },
  ]
);
assert.equal(resolveExactOrAboveScale({
  scale: multiplierScale,
  value: 3,
  valueKey: 'qualifiedAdvisorCount',
  resultKey: 'multiplierRate',
}).value, 0.3);
assert.equal(resolveExactOrAboveScale({
  scale: multiplierScale,
  value: 4,
  valueKey: 'qualifiedAdvisorCount',
  resultKey: 'multiplierRate',
}).value, 0.4);
assert.equal(resolveExactOrAboveScale({
  scale: multiplierScale,
  value: 5,
  valueKey: 'qualifiedAdvisorCount',
  resultKey: 'multiplierRate',
}).value, 0.5);
assert.equal(resolveExactOrAboveScale({
  scale: multiplierScale,
  value: 9,
  valueKey: 'qualifiedAdvisorCount',
  resultKey: 'multiplierRate',
}).value, 0.9);
assert.equal(resolveExactOrAboveScale({
  scale: multiplierScale,
  value: 10,
  valueKey: 'qualifiedAdvisorCount',
  resultKey: 'multiplierRate',
}).value, 1);
assert.equal(resolveExactOrAboveScale({
  scale: multiplierScale,
  value: 11,
  valueKey: 'qualifiedAdvisorCount',
  resultKey: 'multiplierRate',
}).value, 1);

const activityConcept = getConcept(rulePack, 'activity-bonus');
const plusRow = activityConcept.policyScale.find((row) => row.appliesToCountAndAbove === true);
assert.equal(resolveExactOrAboveScale({
  scale: activityConcept.policyScale,
  value: Number(plusRow.monthlyAveragePolicies) + 1,
  valueKey: 'monthlyAveragePolicies',
  resultKey: 'rate',
}).value, plusRow.rate);

const fixedSupportConcept = getConcept(rulePack, 'fixed-support');
const semesterRow = fixedSupportConcept.supportAmountsBySemester[0];
assert.equal(resolveSemesterAmount({
  supportAmountsBySemester: fixedSupportConcept.supportAmountsBySemester,
  semesterIndex: semesterRow.semester,
}).amount, semesterRow.amount);

assert.equal(deriveSemesterIndexFromCareerMonth({ careerMonth: 25 }), 5);

console.log('PASS partner-rule-resolver-test');
