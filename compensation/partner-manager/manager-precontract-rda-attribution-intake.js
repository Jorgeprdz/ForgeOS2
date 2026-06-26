export const MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES = Object.freeze({
  CONFIRMED: 'confirmed',
  BLOCKED: 'blocked',
  UNKNOWN: 'unknown',
  NOT_MODELED: 'not_modeled',
});

function present(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function numberOrNull(value) {
  if (!present(value)) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function missing(entries) {
  return entries.filter(([, value]) => !present(value)).map(([key]) => key);
}

function relationshipStatus(entries) {
  const statuses = entries.map((entry) => entry.status);
  if (statuses.includes(MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.BLOCKED)) {
    return MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.BLOCKED;
  }
  if (statuses.includes(MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.UNKNOWN)) {
    return MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.UNKNOWN;
  }
  if (statuses.includes(MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.NOT_MODELED)) {
    return MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.NOT_MODELED;
  }
  return MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.CONFIRMED;
}

function relationshipReason(status) {
  if (status === MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.BLOCKED) {
    return 'blocked_by_relationship_attribution';
  }
  if (status === MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.UNKNOWN) {
    return 'unknown_relationship_attribution';
  }
  if (status === MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.NOT_MODELED) {
    return 'relationship_attribution_not_modeled';
  }
  return 'manager_precontract_rda_attribution_intake_confirmed';
}

function normalizeNonConfirmedStatus(status) {
  if (
    status === MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.BLOCKED
    || status === MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.UNKNOWN
    || status === MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.NOT_MODELED
  ) {
    return status;
  }

  return MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.BLOCKED;
}

export function createConnectionAttribution({ advisorId, connection = {} } = {}) {
  const connectionOwnerType = connection.connectionOwnerType || connection.ownerType || null;
  const connectionOwnerId = connection.connectionOwnerId || connection.ownerId || null;
  const rdaOwnerId = connection.rdaOwnerId || connection.rdaAdvisorId || null;
  const rdaStatus = connection.rdaStatus || (rdaOwnerId ? 'confirmed' : 'not_applicable');

  if (connection.status && connection.status !== MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.CONFIRMED) {
    const status = normalizeNonConfirmedStatus(connection.status);
    const reason = connection.reason || 'connection_attribution_not_confirmed';
    return {
      status,
      reason,
      relationshipType: 'connection',
      advisorId,
      connectionOwnerType,
      connectionOwnerId,
      rdaStatus,
      rdaOwnerId,
      payoutTruth: false,
      blockedReasons: [reason],
      missingInputs: [],
    };
  }

  const missingInputs = missing([
    ['connection_owner_type', connectionOwnerType],
    ['connection_owner_id', connectionOwnerId],
  ]);

  if (missingInputs.length > 0) {
    return {
      status: MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.UNKNOWN,
      reason: 'unknown_connection_owner',
      relationshipType: 'connection',
      advisorId,
      connectionOwnerType,
      connectionOwnerId,
      rdaStatus,
      rdaOwnerId,
      payoutTruth: false,
      blockedReasons: ['unknown_connection_owner'],
      missingInputs,
    };
  }

  return {
    status: MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.CONFIRMED,
    reason: 'manager_precontract_connection_attribution_confirmed',
    relationshipType: 'connection',
    advisorId,
    connectionOwnerType,
    connectionOwnerId,
    rdaStatus,
    rdaOwnerId,
    payoutTruth: false,
    blockedReasons: [],
    missingInputs: [],
  };
}

export function createDevelopmentAttribution({ advisorId, development = {} } = {}) {
  const developmentOwnerType = development.developmentOwnerType || development.ownerType || null;
  const developmentOwnerId = development.developmentOwnerId || development.ownerId || null;
  const developerShare = numberOrNull(development.developerShare);

  if (development.status && development.status !== MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.CONFIRMED) {
    const status = normalizeNonConfirmedStatus(development.status);
    const reason = development.reason || 'development_attribution_not_confirmed';
    return {
      status,
      reason,
      relationshipType: 'development',
      advisorId,
      developmentOwnerType,
      developmentOwnerId,
      developerShare,
      payoutTruth: false,
      blockedReasons: [reason],
      missingInputs: [],
    };
  }

  const missingInputs = missing([
    ['development_owner_type', developmentOwnerType],
    ['development_owner_id', developmentOwnerId],
    ['developer_share', developerShare],
  ]);

  if (missingInputs.length > 0) {
    return {
      status: MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.UNKNOWN,
      reason: 'unknown_development_owner_or_share',
      relationshipType: 'development',
      advisorId,
      developmentOwnerType,
      developmentOwnerId,
      developerShare,
      payoutTruth: false,
      blockedReasons: ['unknown_development_owner_or_share'],
      missingInputs,
    };
  }

  if (![1, 0.5].includes(developerShare)) {
    return {
      status: MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.NOT_MODELED,
      reason: 'unsupported_developer_share',
      relationshipType: 'development',
      advisorId,
      developmentOwnerType,
      developmentOwnerId,
      developerShare,
      payoutTruth: false,
      blockedReasons: ['unsupported_developer_share'],
      missingInputs: [],
    };
  }

  return {
    status: MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.CONFIRMED,
    reason: 'manager_precontract_development_attribution_confirmed',
    relationshipType: 'development',
    advisorId,
    developmentOwnerType,
    developmentOwnerId,
    developerShare,
    payoutTruth: false,
    blockedReasons: [],
    missingInputs: [],
  };
}

/**
 * Manager OS intake for precontract RDA / connection / development attribution.
 *
 * Boundaries:
 * - advisorCommissionEvent.advisorId identifies the advisor economic event.
 * - advisorCommissionEvent.promotoriaId routes advisor commission economy.
 * - relationshipAttributions define connection, RDA and development ownership.
 * - This intake never creates payout truth.
 * - blocked / unknown / not_modeled are preserved and never collapsed to zero.
 */
export function createManagerPrecontractRdaAttributionIntake({
  advisorCommissionEvent = {},
  connection = null,
  development = null,
  source = null,
  evidence = {},
} = {}) {
  const advisorId = advisorCommissionEvent.advisorId || evidence.advisorId || null;
  const promotoriaId = advisorCommissionEvent.promotoriaId || evidence.promotoriaId || null;
  const sourceEventId = advisorCommissionEvent.sourceEventId || advisorCommissionEvent.id || null;

  const missingAdvisorCommissionInputs = missing([
    ['advisor_commission_event.advisorId', advisorId],
    ['advisor_commission_event.promotoriaId', promotoriaId],
  ]);

  const relationshipAttributions = {};
  if (connection) relationshipAttributions.connection = createConnectionAttribution({ advisorId, connection });
  if (development) relationshipAttributions.development = createDevelopmentAttribution({ advisorId, development });

  const entries = Object.values(relationshipAttributions);
  const status = missingAdvisorCommissionInputs.length > 0
    ? MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.BLOCKED
    : relationshipStatus(entries);
  const reason = missingAdvisorCommissionInputs.length > 0
    ? 'blocked_by_missing_advisor_commission_event_identity'
    : relationshipReason(status);

  return {
    status,
    reason,
    advisorId,
    promotoriaId,
    payoutTruth: false,
    advisorCommissionEvent: {
      advisorId,
      promotoriaId,
      sourceEventId,
      payoutTruth: false,
    },
    relationshipAttributions,
    blockedReasons: unique([
      ...(status === MANAGER_PRECONTRACT_ATTRIBUTION_STATUSES.BLOCKED ? [reason] : []),
      ...entries.flatMap((entry) => entry.blockedReasons || []),
    ]),
    missingInputs: unique([
      ...missingAdvisorCommissionInputs,
      ...entries.flatMap((entry) => entry.missingInputs || []),
    ]),
    metadata: {
      source,
      evidence,
      blockedUnknownNotModeledAreNotZero: true,
    },
  };
}

export default createManagerPrecontractRdaAttributionIntake;
