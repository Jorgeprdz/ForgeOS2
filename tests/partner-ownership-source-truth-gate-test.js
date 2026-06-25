
import assert from 'node:assert/strict';

import {
  evaluatePartnerOwnershipSourceTruth,
  PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES,
} from '../compensation/partner-manager/partner-ownership-source-truth-gate.js';

{
  const result = evaluatePartnerOwnershipSourceTruth({
    partnerId: 'Juan',
    requestedConcept: 'connection-bonus',
    relationshipAttribution: {
      status: 'confirmed',
      relationshipType: 'connection',
      advisorId: 'Roberto',
      connectionOwnerType: 'partner',
      connectionOwnerId: 'Juan',
      rdaStatus: 'not_applicable',
      rdaOwnerId: null,
      payoutTruth: false,
    },
  });

  assert.equal(result.status, PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.CONFIRMED);
  assert.equal(result.ownershipAllowed, true);
  assert.equal(result.calculationAllowed, true);
  assert.equal(result.payoutTruth, false);
  assert.equal(result.metadata.connectionOwnerType, 'partner');
  assert.equal(result.metadata.connectionOwnerId, 'Juan');
  assert.equal(result.metadata.rdaStatus, 'not_applicable');
  assert.equal(result.metadata.rdaOwnerId, null);
  console.log('PASS partner direct connection is allowed for partner connection bonus');
}

{
  const result = evaluatePartnerOwnershipSourceTruth({
    partnerId: 'Juan',
    requestedConcept: 'connection-bonus',
    relationshipAttribution: {
      status: 'confirmed',
      relationshipType: 'connection',
      advisorId: 'Fer',
      connectionOwnerType: 'advisor',
      connectionOwnerId: 'Pamela',
      rdaStatus: 'confirmed',
      rdaOwnerId: 'Pamela',
      payoutTruth: false,
    },
  });

  assert.equal(result.status, PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.BLOCKED);
  assert.equal(result.ownershipAllowed, false);
  assert.equal(result.calculationAllowed, false);
  assert.equal(result.reason, 'blocked_partner_cannot_claim_advisor_rda_connection');
  assert.equal(result.payoutTruth, false);
  assert.equal(result.metadata.rdaOwnerId, 'Pamela');
  console.log('PASS partner cannot claim advisor RDA connection');
}

{
  const result = evaluatePartnerOwnershipSourceTruth({
    partnerId: 'Juan',
    requestedConcept: 'development-bonus',
    relationshipAttribution: {
      status: 'confirmed',
      relationshipType: 'development',
      advisorId: 'Fer',
      developmentOwnerType: 'partner',
      developmentOwnerId: 'Juan',
      developerShare: 0.5,
      payoutTruth: false,
    },
  });

  assert.equal(result.status, PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.CONFIRMED);
  assert.equal(result.ownershipAllowed, true);
  assert.equal(result.calculationAllowed, true);
  assert.equal(result.metadata.developerShare, 0.5);
  assert.equal(result.payoutTruth, false);
  console.log('PASS partner shared development is allowed with 50 percent share');
}

{
  const result = evaluatePartnerOwnershipSourceTruth({
    partnerId: 'Juan',
    requestedConcept: 'development-bonus',
    relationshipAttribution: {
      status: 'confirmed',
      relationshipType: 'development',
      advisorId: 'Roberto',
      developmentOwnerType: 'partner',
      developmentOwnerId: 'Juan',
      developerShare: 1.0,
      payoutTruth: false,
    },
  });

  assert.equal(result.status, PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.CONFIRMED);
  assert.equal(result.ownershipAllowed, true);
  assert.equal(result.calculationAllowed, true);
  assert.equal(result.metadata.developerShare, 1.0);
  assert.equal(result.payoutTruth, false);
  console.log('PASS partner full development is allowed with 100 percent share');
}

{
  const result = evaluatePartnerOwnershipSourceTruth({
    partnerId: 'Juan',
    requestedConcept: 'connection-bonus',
    relationshipAttribution: {
      status: 'blocked',
      reason: 'blocked_by_missing_manager_precontract_attribution',
      relationshipType: 'connection',
      advisorId: 'Fer',
      payoutTruth: false,
    },
  });

  assert.equal(result.status, PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.BLOCKED);
  assert.equal(result.ownershipAllowed, false);
  assert.equal(result.calculationAllowed, false);
  assert.equal(result.reason, 'blocked_by_missing_manager_precontract_attribution');
  assert.equal(result.payoutTruth, false);
  console.log('PASS missing Manager OS attribution blocks partner ownership consumption');
}

{
  const result = evaluatePartnerOwnershipSourceTruth({
    partnerId: 'Juan',
    requestedConcept: 'development-bonus',
    relationshipAttribution: {
      status: 'confirmed',
      relationshipType: 'development',
      advisorId: 'Fer',
      developmentOwnerType: 'partner',
      developmentOwnerId: 'Juan',
      developerShare: '0.5',
      payoutTruth: false,
    },
  });

  assert.equal(result.status, PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.UNKNOWN);
  assert.equal(result.ownershipAllowed, false);
  assert.equal(result.calculationAllowed, false);
  assert.equal(result.reason, 'invalid_developer_share');
  assert.equal(result.payoutTruth, false);
  console.log('PASS non numeric developerShare returns unknown');
}

{
  const result = evaluatePartnerOwnershipSourceTruth({
    partnerId: 'Juan',
    requestedConcept: 'development-bonus',
    relationshipAttribution: {
      status: 'confirmed',
      relationshipType: 'development',
      advisorId: 'Fer',
      developmentOwnerType: 'partner',
      developmentOwnerId: 'Juan',
      developerShare: 0.33,
      payoutTruth: false,
    },
  });

  assert.equal(result.status, PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.NOT_MODELED);
  assert.equal(result.ownershipAllowed, false);
  assert.equal(result.calculationAllowed, false);
  assert.equal(result.reason, 'unsupported_developer_share');
  assert.equal(result.payoutTruth, false);
  console.log('PASS unsupported developerShare returns not_modeled');
}

{
  const result = evaluatePartnerOwnershipSourceTruth({
    partnerId: 'Juan',
    requestedConcept: 'connection-bonus',
    relationshipAttribution: {
      status: 'confirmed',
      relationshipType: 'connection',
      advisorId: 'Roberto',
      connectionOwnerType: 'partner',
      connectionOwnerId: 'OtroPartner',
      rdaStatus: 'not_applicable',
      rdaOwnerId: null,
      payoutTruth: false,
    },
  });

  assert.equal(result.status, PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.BLOCKED);
  assert.equal(result.ownershipAllowed, false);
  assert.equal(result.calculationAllowed, false);
  assert.equal(result.reason, 'blocked_partner_is_not_connection_owner');
  assert.equal(result.payoutTruth, false);
  console.log('PASS partner cannot claim another partner direct connection');
}

{
  const result = evaluatePartnerOwnershipSourceTruth({
    partnerId: 'Juan',
    requestedConcept: 'mystery-bonus',
    relationshipAttribution: {
      status: 'confirmed',
      relationshipType: 'connection',
      advisorId: 'Roberto',
      connectionOwnerType: 'partner',
      connectionOwnerId: 'Juan',
      payoutTruth: false,
    },
  });

  assert.equal(result.status, PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.NOT_MODELED);
  assert.equal(result.ownershipAllowed, false);
  assert.equal(result.calculationAllowed, false);
  assert.equal(result.reason, 'unsupported_partner_ownership_concept');
  assert.equal(result.payoutTruth, false);
  console.log('PASS unsupported partner ownership concept returns not_modeled');
}

console.log('PASS partner-ownership-source-truth-gate-test');
