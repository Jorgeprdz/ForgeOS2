
export const PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES = Object.freeze({
  CONFIRMED: 'confirmed',
  BLOCKED: 'blocked',
  UNKNOWN: 'unknown',
  NOT_MODELED: 'not_modeled',
});

const SUPPORTED_PARTNER_OWNERSHIP_CONCEPTS = Object.freeze({
  CONNECTION: 'connection',
  DEVELOPMENT: 'development',
});

function normalizePartnerOwnershipConcept(concept) {
  const normalized = String(concept || '').trim().toLowerCase();

  if (['connection', 'connection-bonus', 'connection_bonus'].includes(normalized)) {
    return SUPPORTED_PARTNER_OWNERSHIP_CONCEPTS.CONNECTION;
  }

  if (['development', 'development-bonus', 'development_bonus'].includes(normalized)) {
    return SUPPORTED_PARTNER_OWNERSHIP_CONCEPTS.DEVELOPMENT;
  }

  return null;
}

function createPartnerOwnershipSourceTruthResult({
  status,
  reason,
  requestedConcept,
  normalizedConcept = null,
  partnerId = null,
  advisorId = null,
  relationshipType = null,
  ownershipAllowed = false,
  calculationAllowed = false,
  blockedReasons = [],
  missingInputs = [],
  metadata = {},
} = {}) {
  return {
    status,
    reason,
    requestedConcept,
    normalizedConcept,
    partnerId,
    advisorId,
    relationshipType,
    ownershipAllowed,
    calculationAllowed,
    payoutTruth: false,
    blockedReasons,
    missingInputs,
    metadata,
  };
}

/**
 * Evaluates whether Partner Compensation may consume a Manager OS relationship attribution.
 *
 * Boundary:
 * - Manager OS creates ownership attribution.
 * - Partner Compensation consumes attribution.
 * - This gate never infers ownership.
 * - This gate never creates payout truth or money.
 */
export function evaluatePartnerOwnershipSourceTruth({
  partnerId,
  requestedConcept,
  relationshipAttribution,
} = {}) {
  const normalizedConcept = normalizePartnerOwnershipConcept(requestedConcept);

  if (!normalizedConcept) {
    return createPartnerOwnershipSourceTruthResult({
      status: PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.NOT_MODELED,
      reason: 'unsupported_partner_ownership_concept',
      requestedConcept,
      partnerId,
      blockedReasons: ['unsupported_partner_ownership_concept'],
    });
  }

  if (!partnerId) {
    return createPartnerOwnershipSourceTruthResult({
      status: PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.BLOCKED,
      reason: 'blocked_by_missing_partner_id',
      requestedConcept,
      normalizedConcept,
      missingInputs: ['partner_id'],
      blockedReasons: ['blocked_by_missing_partner_id'],
    });
  }

  if (!relationshipAttribution) {
    return createPartnerOwnershipSourceTruthResult({
      status: PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.BLOCKED,
      reason: 'blocked_by_missing_manager_precontract_attribution',
      requestedConcept,
      normalizedConcept,
      partnerId,
      missingInputs: ['manager_precontract_attribution'],
      blockedReasons: ['blocked_by_missing_manager_precontract_attribution'],
    });
  }

  const {
    status: attributionStatus,
    reason: attributionReason,
    advisorId,
    relationshipType,
  } = relationshipAttribution;

  if (attributionStatus !== 'confirmed') {
    const propagatedStatus = [
      PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.BLOCKED,
      PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.UNKNOWN,
      PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.NOT_MODELED,
    ].includes(attributionStatus)
      ? attributionStatus
      : PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.BLOCKED;

    const reason = attributionReason || 'relationship_attribution_not_confirmed';

    return createPartnerOwnershipSourceTruthResult({
      status: propagatedStatus,
      reason,
      requestedConcept,
      normalizedConcept,
      partnerId,
      advisorId,
      relationshipType,
      blockedReasons: [reason],
      metadata: {
        relationshipAttribution,
      },
    });
  }

  if (normalizedConcept === SUPPORTED_PARTNER_OWNERSHIP_CONCEPTS.CONNECTION) {
    if (relationshipType !== 'connection') {
      return createPartnerOwnershipSourceTruthResult({
        status: PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.NOT_MODELED,
        reason: 'relationship_attribution_type_mismatch',
        requestedConcept,
        normalizedConcept,
        partnerId,
        advisorId,
        relationshipType,
        blockedReasons: ['relationship_attribution_type_mismatch'],
        metadata: {
          relationshipAttribution,
        },
      });
    }

    const connectionOwnerType = relationshipAttribution.connectionOwnerType || relationshipAttribution.ownerType;
    const connectionOwnerId = relationshipAttribution.connectionOwnerId || relationshipAttribution.ownerId;

    if (connectionOwnerType !== 'partner') {
      const reason = connectionOwnerType === 'advisor'
        ? 'blocked_partner_cannot_claim_advisor_rda_connection'
        : 'blocked_partner_is_not_connection_owner';

      return createPartnerOwnershipSourceTruthResult({
        status: PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.BLOCKED,
        reason,
        requestedConcept,
        normalizedConcept,
        partnerId,
        advisorId,
        relationshipType,
        blockedReasons: [reason],
        metadata: {
          connectionOwnerType,
          connectionOwnerId,
          rdaStatus: relationshipAttribution.rdaStatus || null,
          rdaOwnerId: relationshipAttribution.rdaOwnerId || null,
          relationshipAttribution,
        },
      });
    }

    if (connectionOwnerId !== partnerId) {
      return createPartnerOwnershipSourceTruthResult({
        status: PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.BLOCKED,
        reason: 'blocked_partner_is_not_connection_owner',
        requestedConcept,
        normalizedConcept,
        partnerId,
        advisorId,
        relationshipType,
        blockedReasons: ['blocked_partner_is_not_connection_owner'],
        metadata: {
          connectionOwnerType,
          connectionOwnerId,
          relationshipAttribution,
        },
      });
    }

    return createPartnerOwnershipSourceTruthResult({
      status: PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.CONFIRMED,
      reason: 'partner_connection_source_truth_confirmed',
      requestedConcept,
      normalizedConcept,
      partnerId,
      advisorId,
      relationshipType,
      ownershipAllowed: true,
      calculationAllowed: true,
      metadata: {
        connectionOwnerType,
        connectionOwnerId,
        rdaStatus: relationshipAttribution.rdaStatus || 'not_applicable',
        rdaOwnerId: relationshipAttribution.rdaOwnerId ?? null,
        relationshipAttribution,
      },
    });
  }

  if (relationshipType !== 'development') {
    return createPartnerOwnershipSourceTruthResult({
      status: PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.NOT_MODELED,
      reason: 'relationship_attribution_type_mismatch',
      requestedConcept,
      normalizedConcept,
      partnerId,
      advisorId,
      relationshipType,
      blockedReasons: ['relationship_attribution_type_mismatch'],
      metadata: {
        relationshipAttribution,
      },
    });
  }

  const developmentOwnerType = relationshipAttribution.developmentOwnerType || relationshipAttribution.ownerType;
  const developmentOwnerId = relationshipAttribution.developmentOwnerId || relationshipAttribution.ownerId;

  if (developmentOwnerType !== 'partner' || developmentOwnerId !== partnerId) {
    return createPartnerOwnershipSourceTruthResult({
      status: PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.BLOCKED,
      reason: 'blocked_partner_is_not_development_owner',
      requestedConcept,
      normalizedConcept,
      partnerId,
      advisorId,
      relationshipType,
      blockedReasons: ['blocked_partner_is_not_development_owner'],
      metadata: {
        developmentOwnerType,
        developmentOwnerId,
        relationshipAttribution,
      },
    });
  }

  const { developerShare } = relationshipAttribution;

  if (typeof developerShare !== 'number' || !Number.isFinite(developerShare)) {
    return createPartnerOwnershipSourceTruthResult({
      status: PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.UNKNOWN,
      reason: 'invalid_developer_share',
      requestedConcept,
      normalizedConcept,
      partnerId,
      advisorId,
      relationshipType,
      blockedReasons: ['invalid_developer_share'],
      metadata: {
        developmentOwnerType,
        developmentOwnerId,
        developerShare,
        relationshipAttribution,
      },
    });
  }

  if (developerShare !== 1.0 && developerShare !== 0.5) {
    return createPartnerOwnershipSourceTruthResult({
      status: PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.NOT_MODELED,
      reason: 'unsupported_developer_share',
      requestedConcept,
      normalizedConcept,
      partnerId,
      advisorId,
      relationshipType,
      blockedReasons: ['unsupported_developer_share'],
      metadata: {
        developmentOwnerType,
        developmentOwnerId,
        developerShare,
        relationshipAttribution,
      },
    });
  }

  return createPartnerOwnershipSourceTruthResult({
    status: PARTNER_OWNERSHIP_SOURCE_TRUTH_STATUSES.CONFIRMED,
    reason: 'partner_development_source_truth_confirmed',
    requestedConcept,
    normalizedConcept,
    partnerId,
    advisorId,
    relationshipType,
    ownershipAllowed: true,
    calculationAllowed: true,
    metadata: {
      developmentOwnerType,
      developmentOwnerId,
      developerShare,
      relationshipAttribution,
    },
  });
}

export default evaluatePartnerOwnershipSourceTruth;
