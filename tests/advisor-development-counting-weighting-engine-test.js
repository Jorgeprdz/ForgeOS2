import assert from 'node:assert/strict';

import {
  DECISION_STATUS,
  evaluateAdvisorDevelopmentPolicies,
} from '../compensation/advisor-development/advisor-development-counting-weighting-engine.js';

const rulePack = {
  rulePackId: 'smnyl-advisor-development-2026',
  version: 'draft-test',
  countingAndWeightingRules: {
    excludedComponents: ['ave', 'avecp', 'cvd', 'aportacion_adicional', 'descuento_nomina'],
    excludedProducts: ['tempo_vida_1', 'star_temporal_1'],
    lifeIndividual: {
      commissionFactor: 0.9,
    },
    gmmi: {
      commissionFactor: 1,
      ageExclusion: {
        minAgeExcluded: 60,
      },
    },
  },
};

function testLifeCommissionIsWeightedAtNinetyPercent() {
  const result = evaluateAdvisorDevelopmentPolicies({
    rulePack,
    policies: [
      {
        id: 'life-1',
        lineOfBusiness: 'vida individual',
        productCode: 'orvi_99',
        commissionAmount: 10000,
      },
    ],
  });

  assert.equal(result.payoutTruth, false);
  assert.equal(result.policies[0].status, DECISION_STATUS.INCLUDED);
  assert.equal(result.policies[0].rawAmount, 10000);
  assert.equal(result.policies[0].factor, 0.9);
  assert.equal(result.policies[0].evaluatedAmount, 9000);
  assert.equal(result.summary.evaluatedAmount, 9000);

  console.log('PASS life individual commission is weighted at 90%');
}

function testGmmiCommissionIsWeightedAtOneHundredPercent() {
  const result = evaluateAdvisorDevelopmentPolicies({
    rulePack,
    policies: [
      {
        id: 'gmmi-1',
        lineOfBusiness: 'GMMI',
        productCode: 'gmmi_individual',
        insuredAge: 45,
        commissionAmount: 10000,
      },
    ],
  });

  assert.equal(result.policies[0].status, DECISION_STATUS.INCLUDED);
  assert.equal(result.policies[0].factor, 1);
  assert.equal(result.policies[0].evaluatedAmount, 10000);

  console.log('PASS GMMI commission is weighted at 100%');
}

function testGmmiAgeSixtyIsExcludedNotZeroedSilently() {
  const result = evaluateAdvisorDevelopmentPolicies({
    rulePack,
    policies: [
      {
        id: 'gmmi-60',
        lineOfBusiness: 'GMMI',
        productCode: 'gmmi_individual',
        insuredAge: 60,
        commissionAmount: 10000,
      },
    ],
  });

  assert.equal(result.policies[0].status, DECISION_STATUS.EXCLUDED);
  assert.equal(result.policies[0].reason, 'excluded_by_insured_age');
  assert.equal(result.policies[0].evaluatedAmount, null);
  assert.equal(result.summary.excludedCount, 1);

  console.log('PASS GMMI insured age >= 60 is excluded with audit reason');
}

function testGmmiMissingAgeBlocksInsteadOfAssumingEligible() {
  const result = evaluateAdvisorDevelopmentPolicies({
    rulePack,
    policies: [
      {
        id: 'gmmi-null-age',
        lineOfBusiness: 'GMMI',
        productCode: 'gmmi_individual',
        insuredAge: null,
        commissionAmount: 10000,
      },
    ],
  });

  assert.equal(result.status, DECISION_STATUS.BLOCKED);
  assert.equal(result.policies[0].status, DECISION_STATUS.BLOCKED);
  assert.equal(result.policies[0].reason, 'missing_insured_age');
  assert.equal(result.policies[0].evaluatedAmount, null);
  assert.equal(result.summary.blockedCount, 1);

  console.log('PASS missing GMMI insured age blocks instead of assuming eligible');
}

function testExcludedProductsAreExcludedWithAuditReason() {
  const result = evaluateAdvisorDevelopmentPolicies({
    rulePack,
    policies: [
      {
        id: 'tempo-1',
        lineOfBusiness: 'vida individual',
        productCode: 'Tempo Vida 1',
        commissionAmount: 10000,
      },
      {
        id: 'star-1',
        lineOfBusiness: 'vida individual',
        productCode: 'Star Temporal 1',
        commissionAmount: 10000,
      },
    ],
  });

  assert.equal(result.policies[0].status, DECISION_STATUS.EXCLUDED);
  assert.equal(result.policies[0].reason, 'excluded_product');
  assert.equal(result.policies[1].status, DECISION_STATUS.EXCLUDED);
  assert.equal(result.policies[1].reason, 'excluded_product');
  assert.equal(result.summary.excludedCount, 2);

  console.log('PASS excluded products are excluded with audit reasons');
}

function testExcludedComponentsAreExcludedWithAuditReason() {
  const result = evaluateAdvisorDevelopmentPolicies({
    rulePack,
    policies: [
      {
        id: 'ave-1',
        lineOfBusiness: 'vida individual',
        productCode: 'orvi_99',
        componentCode: 'AVE',
        commissionAmount: 10000,
      },
    ],
  });

  assert.equal(result.policies[0].status, DECISION_STATUS.EXCLUDED);
  assert.equal(result.policies[0].reason, 'excluded_product_component');
  assert.equal(result.policies[0].excludedComponent, 'ave');

  console.log('PASS excluded components are excluded with audit reasons');
}

function testMissingRulePackBlocksWithoutZeroing() {
  const result = evaluateAdvisorDevelopmentPolicies({
    policies: [
      {
        id: 'life-1',
        lineOfBusiness: 'vida individual',
        productCode: 'orvi_99',
        commissionAmount: 10000,
      },
    ],
  });

  assert.equal(result.status, DECISION_STATUS.BLOCKED);
  assert.equal(result.reason, 'missing_rule_pack');
  assert.equal(result.policies[0].evaluatedAmount, null);
  assert.equal(result.summary.blockedCount, 1);

  console.log('PASS missing rule pack blocks without zeroing');
}

function testUnsupportedLineIsNotModeledNotZeroed() {
  const result = evaluateAdvisorDevelopmentPolicies({
    rulePack,
    policies: [
      {
        id: 'auto-1',
        lineOfBusiness: 'autos',
        productCode: 'auto_individual',
        commissionAmount: 10000,
      },
    ],
  });

  assert.equal(result.policies[0].status, DECISION_STATUS.NOT_MODELED);
  assert.equal(result.policies[0].reason, 'unsupported_line_of_business');
  assert.equal(result.policies[0].evaluatedAmount, null);
  assert.equal(result.summary.notModeledCount, 1);

  console.log('PASS unsupported line is not_modeled, not zeroed');
}

testLifeCommissionIsWeightedAtNinetyPercent();
testGmmiCommissionIsWeightedAtOneHundredPercent();
testGmmiAgeSixtyIsExcludedNotZeroedSilently();
testGmmiMissingAgeBlocksInsteadOfAssumingEligible();
testExcludedProductsAreExcludedWithAuditReason();
testExcludedComponentsAreExcludedWithAuditReason();
testMissingRulePackBlocksWithoutZeroing();
testUnsupportedLineIsNotModeledNotZeroed();

console.log('PASS advisor-development-counting-weighting-engine-test');
