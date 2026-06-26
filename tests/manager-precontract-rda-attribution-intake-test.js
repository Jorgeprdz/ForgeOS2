import assert from 'node:assert/strict';

import {
  createManagerPrecontractRdaAttributionIntake,
} from '../compensation/partner-manager/manager-precontract-rda-attribution-intake.js';

import {
  evaluatePartnerOwnershipSourceTruth,
} from '../compensation/partner-manager/partner-ownership-source-truth-gate.js';

{
  const ferAttribution = createManagerPrecontractRdaAttributionIntake({
    advisorCommissionEvent: {
      advisorId: 'Fer',
      promotoriaId: 'Juan',
      sourceEventId: 'ACE-FER-001',
    },
    connection: {
      connectionOwnerType: 'advisor',
      connectionOwnerId: 'Pamela',
      rdaStatus: 'confirmed',
      rdaOwnerId: 'Pamela',
    },
    development: {
      developmentOwnerType: 'partner',
      developmentOwnerId: 'Juan',
      developerShare: 0.5,
    },
    source: 'manager_os_precontract_intake',
  });

  assert.equal(ferAttribution.status, 'confirmed');
  assert.equal(ferAttribution.payoutTruth, false);
  assert.equal(ferAttribution.advisorId, 'Fer');
  assert.equal(ferAttribution.promotoriaId, 'Juan');
  assert.equal(ferAttribution.advisorCommissionEvent.advisorId, 'Fer');
  assert.equal(ferAttribution.advisorCommissionEvent.promotoriaId, 'Juan');
  assert.equal(ferAttribution.advisorCommissionEvent.payoutTruth, false);

  assert.equal(ferAttribution.relationshipAttributions.connection.relationshipType, 'connection');
  assert.equal(ferAttribution.relationshipAttributions.connection.advisorId, 'Fer');
  assert.equal(ferAttribution.relationshipAttributions.connection.connectionOwnerType, 'advisor');
  assert.equal(ferAttribution.relationshipAttributions.connection.connectionOwnerId, 'Pamela');
  assert.equal(ferAttribution.relationshipAttributions.connection.rdaStatus, 'confirmed');
  assert.equal(ferAttribution.relationshipAttributions.connection.rdaOwnerId, 'Pamela');
  assert.equal(ferAttribution.relationshipAttributions.connection.payoutTruth, false);

  assert.equal(ferAttribution.relationshipAttributions.development.relationshipType, 'development');
  assert.equal(ferAttribution.relationshipAttributions.development.advisorId, 'Fer');
  assert.equal(ferAttribution.relationshipAttributions.development.developmentOwnerType, 'partner');
  assert.equal(ferAttribution.relationshipAttributions.development.developmentOwnerId, 'Juan');
  assert.equal(ferAttribution.relationshipAttributions.development.developerShare, 0.5);
  assert.equal(ferAttribution.relationshipAttributions.development.payoutTruth, false);

  const juanConnectionOwnership = evaluatePartnerOwnershipSourceTruth({
    partnerId: 'Juan',
    requestedConcept: 'connection',
    relationshipAttribution: ferAttribution.relationshipAttributions.connection,
  });
  assert.equal(juanConnectionOwnership.status, 'blocked');
  assert.ok(juanConnectionOwnership.blockedReasons.includes('blocked_partner_cannot_claim_advisor_rda_connection'));
  assert.equal(juanConnectionOwnership.payoutTruth, false);

  const juanDevelopmentOwnership = evaluatePartnerOwnershipSourceTruth({
    partnerId: 'Juan',
    requestedConcept: 'development',
    relationshipAttribution: ferAttribution.relationshipAttributions.development,
  });
  assert.equal(juanDevelopmentOwnership.status, 'confirmed');
  assert.equal(juanDevelopmentOwnership.ownershipAllowed, true);
  assert.equal(juanDevelopmentOwnership.calculationAllowed, true);
  assert.equal(juanDevelopmentOwnership.metadata.developerShare, 0.5);
  assert.equal(juanDevelopmentOwnership.payoutTruth, false);
}

{
  const blockedMissingEconomicIdentity = createManagerPrecontractRdaAttributionIntake({
    advisorCommissionEvent: {
      advisorId: 'Fer',
    },
    connection: {
      connectionOwnerType: 'advisor',
      connectionOwnerId: 'Pamela',
      rdaOwnerId: 'Pamela',
    },
  });

  assert.equal(blockedMissingEconomicIdentity.status, 'blocked');
  assert.ok(blockedMissingEconomicIdentity.blockedReasons.includes('blocked_by_missing_advisor_commission_event_identity'));
  assert.ok(blockedMissingEconomicIdentity.missingInputs.includes('advisor_commission_event.promotoriaId'));
  assert.equal(blockedMissingEconomicIdentity.payoutTruth, false);
  assert.equal(Object.prototype.hasOwnProperty.call(blockedMissingEconomicIdentity, 'candidateAmount'), false);
}

{
  const unknownConnection = createManagerPrecontractRdaAttributionIntake({
    advisorCommissionEvent: {
      advisorId: 'Fer',
      promotoriaId: 'Juan',
    },
    connection: {
      connectionOwnerType: 'advisor',
      rdaOwnerId: 'Pamela',
    },
  });

  assert.equal(unknownConnection.status, 'unknown');
  assert.equal(unknownConnection.relationshipAttributions.connection.status, 'unknown');
  assert.ok(unknownConnection.relationshipAttributions.connection.missingInputs.includes('connection_owner_id'));
  assert.equal(unknownConnection.payoutTruth, false);
  assert.equal(Object.prototype.hasOwnProperty.call(unknownConnection.relationshipAttributions.connection, 'candidateAmount'), false);
}

{
  const notModeledDeveloperShare = createManagerPrecontractRdaAttributionIntake({
    advisorCommissionEvent: {
      advisorId: 'Fer',
      promotoriaId: 'Juan',
    },
    development: {
      developmentOwnerType: 'partner',
      developmentOwnerId: 'Juan',
      developerShare: 0.25,
    },
  });

  assert.equal(notModeledDeveloperShare.status, 'not_modeled');
  assert.equal(notModeledDeveloperShare.relationshipAttributions.development.status, 'not_modeled');
  assert.ok(notModeledDeveloperShare.relationshipAttributions.development.blockedReasons.includes('unsupported_developer_share'));
  assert.equal(notModeledDeveloperShare.payoutTruth, false);
  assert.equal(Object.prototype.hasOwnProperty.call(notModeledDeveloperShare.relationshipAttributions.development, 'candidateAmount'), false);
}

{
  const propagatedBlockedStatus = createManagerPrecontractRdaAttributionIntake({
    advisorCommissionEvent: {
      advisorId: 'Fer',
      promotoriaId: 'Juan',
    },
    development: {
      status: 'blocked',
      reason: 'blocked_by_missing_manager_evidence',
      developmentOwnerType: 'partner',
      developmentOwnerId: 'Juan',
      developerShare: 0.5,
    },
  });

  assert.equal(propagatedBlockedStatus.status, 'blocked');
  assert.ok(propagatedBlockedStatus.blockedReasons.includes('blocked_by_missing_manager_evidence'));
  assert.equal(propagatedBlockedStatus.payoutTruth, false);
  assert.equal(Object.prototype.hasOwnProperty.call(propagatedBlockedStatus.relationshipAttributions.development, 'candidateAmount'), false);
}

console.log('PASS manager-precontract-rda-attribution-intake-test');
