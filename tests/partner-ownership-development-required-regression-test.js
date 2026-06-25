
import assert from 'node:assert/strict';

import {
  calculatePartnerQuarterlyBonusCandidate,
} from '../compensation/partner-manager/partner-quarterly-bonus-calculator.js';

const partnerJuan = {
  partnerId: 'Juan',
  partnerCareerMonth: 12,
  partnerConnectedYear: 2026,
  organizationType: 'nueva_organizacion',
  unitLIMRA: 80,
  unitIGC: 90,
  active: true,
};

const result = calculatePartnerQuarterlyBonusCandidate({
  partner: partnerJuan,
  period: { type: 'quarter', quarter: 'Q1', year: 2026 },
  evidence: {
    paidAppliedEconomicEvidence: true,
    partnerOwnershipSourceTruthRequired: true,
  },
  advisors: [
    {
      name: 'Missing Development Attribution',
      advisorId: 'MissingDevelopmentAttribution',
      advisorMonth: 4,
      monthlyPolicies: 3,
      quarterPolicyTotal: 3,
      activeAtQuarterClose: true,
      paidAppliedPolicyEvidence: true,
      developerEligibilityEvidence: true,
      LIMRA: 80,
      IGC: 90,
    },
    {
      name: 'Unsupported Developer Share',
      advisorId: 'UnsupportedDeveloperShare',
      advisorMonth: 4,
      monthlyPolicies: 3,
      quarterPolicyTotal: 3,
      activeAtQuarterClose: true,
      paidAppliedPolicyEvidence: true,
      developerEligibilityEvidence: true,
      LIMRA: 80,
      IGC: 90,
      relationshipAttributions: {
        development: {
          status: 'confirmed',
          relationshipType: 'development',
          advisorId: 'UnsupportedDeveloperShare',
          developmentOwnerType: 'partner',
          developmentOwnerId: 'Juan',
          developerShare: 0.25,
          payoutTruth: false,
        },
      },
    },
  ],
});

assert.equal(result.payoutTruth, false);
assert.equal(result.concepts.development.candidateAmount, null);

assert.ok(result.concepts.development.blockedReasons.includes(
  'blocked_by_missing_manager_precontract_attribution',
));
assert.ok(result.concepts.development.blockedReasons.includes(
  'unsupported_developer_share',
));

assert.equal(result.concepts.development.warnings.includes(
  'partner_ownership_source_truth_not_required',
), false);
assert.equal(result.warnings.includes(
  'partner_ownership_source_truth_not_required',
), false);

assert.deepEqual(result.concepts.development.metadata.ownershipSourceTruth, {
  required: true,
  status: 'blocked',
  evaluatedParts: 2,
  confirmedParts: 0,
  blockedParts: 2,
  legacyParts: 0,
  totalParts: 2,
  payoutTruth: false,
});

const developmentParts = result.concepts.development.metadata.parts;

const missingDevelopment = developmentParts.find((part) => (
  part.metadata.advisorId === 'MissingDevelopmentAttribution'
));
assert.equal(missingDevelopment.candidateAmount, null);
assert.equal(
  missingDevelopment.metadata.ownershipSourceTruth.blockedReasons.includes(
    'blocked_by_missing_manager_precontract_attribution',
  ),
  true,
);
assert.equal(missingDevelopment.metadata.ownershipSourceTruth.payoutTruth, false);

const unsupportedShare = developmentParts.find((part) => (
  part.metadata.advisorId === 'UnsupportedDeveloperShare'
));
assert.equal(unsupportedShare.candidateAmount, null);
assert.equal(
  unsupportedShare.metadata.ownershipSourceTruth.blockedReasons.includes(
    'unsupported_developer_share',
  ),
  true,
);
assert.equal(unsupportedShare.metadata.ownershipSourceTruth.payoutTruth, false);

console.log('PASS partner required development ownership regressions');
