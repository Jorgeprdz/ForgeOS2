import assert from 'node:assert/strict';

import {
  loadPartner2026RulePack,
} from '../compensation/partner-manager/partner-2026-rule-pack-loader.js';

import {
  validatePartner2026RulePack,
} from '../compensation/partner-manager/partner-2026-rule-pack-validator.js';

const rulePack = loadPartner2026RulePack();
const validation = validatePartner2026RulePack(rulePack);
assert.equal(validation.valid, true);
assert.equal(rulePack.source.fileName, 'PCV 2026 Partners.pdf');

const missingConcepts = validatePartner2026RulePack({
  ...rulePack,
  concepts: undefined,
});
assert.equal(missingConcepts.valid, false);
assert.ok(missingConcepts.errors.includes('concepts_required'));

const notSourceTruth = validatePartner2026RulePack({
  ...rulePack,
  source: {
    ...rulePack.source,
    sourceTruth: false,
  },
});
assert.equal(notSourceTruth.valid, false);
assert.ok(notSourceTruth.errors.includes('sourceTruth_must_be_true'));

const wrongSourceFile = validatePartner2026RulePack({
  ...rulePack,
  source: {
    ...rulePack.source,
    fileName: '2026_Partner_Compensation.pdf',
  },
});
assert.equal(wrongSourceFile.valid, false);
assert.ok(wrongSourceFile.errors.includes('official_v1_source_file_required'));

const missingPayoutTruthRule = validatePartner2026RulePack({
  ...rulePack,
  globalRules: {
    ...rulePack.globalRules,
    payoutTruthRule: undefined,
  },
});
assert.equal(missingPayoutTruthRule.valid, false);
assert.ok(missingPayoutTruthRule.errors.includes('payoutTruthRule_required'));

console.log('PASS partner-2026-rule-pack-validator-test');
