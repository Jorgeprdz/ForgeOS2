import { EVIDENCE_PROCESSING_STATUSES } from './evidence-processing-status.js';
import { EVIDENCE_CANDIDATE_TYPES } from './evidence-extraction-candidate.js';

export const EVIDENCE_INBOX_ROUTE_TYPES = Object.freeze({
  POLICY_EVIDENCE_PACKET: 'PolicyEvidencePacket',
  PAYMENT_EVIDENCE_PACKET: 'PaymentEvidencePacket',
  COMMISSION_STATEMENT_EVIDENCE_PACKET: 'CommissionStatementEvidencePacket',
  BONUS_RULE_EVIDENCE_PACKET: 'BonusRuleEvidencePacket',
  BONUS_PRODUCTION_EVIDENCE_PACKET: 'BonusProductionEvidencePacket',
  BONUS_CARRIER_CALCULATED_EVIDENCE_PACKET: 'BonusCarrierCalculatedEvidencePacket',
  BONUS_PAYMENT_EVIDENCE_PACKET: 'BonusPaymentEvidencePacket',
  NEEDS_REVIEW: 'needs_review',
});

const ROUTES_BY_CANDIDATE_TYPE = Object.freeze({
  [EVIDENCE_CANDIDATE_TYPES.POLICY]: EVIDENCE_INBOX_ROUTE_TYPES.POLICY_EVIDENCE_PACKET,
  [EVIDENCE_CANDIDATE_TYPES.PAYMENT]: EVIDENCE_INBOX_ROUTE_TYPES.PAYMENT_EVIDENCE_PACKET,
  [EVIDENCE_CANDIDATE_TYPES.COMMISSION_STATEMENT]: EVIDENCE_INBOX_ROUTE_TYPES.COMMISSION_STATEMENT_EVIDENCE_PACKET,
  [EVIDENCE_CANDIDATE_TYPES.BONUS_RULE]: EVIDENCE_INBOX_ROUTE_TYPES.BONUS_RULE_EVIDENCE_PACKET,
  [EVIDENCE_CANDIDATE_TYPES.BONUS_PRODUCTION_BASIS]: EVIDENCE_INBOX_ROUTE_TYPES.BONUS_PRODUCTION_EVIDENCE_PACKET,
  [EVIDENCE_CANDIDATE_TYPES.BONUS_CARRIER_CALCULATED]: EVIDENCE_INBOX_ROUTE_TYPES.BONUS_CARRIER_CALCULATED_EVIDENCE_PACKET,
  [EVIDENCE_CANDIDATE_TYPES.BONUS_PAYMENT_EVIDENCE]: EVIDENCE_INBOX_ROUTE_TYPES.BONUS_PAYMENT_EVIDENCE_PACKET,
});

const BONUS_CANDIDATE_TYPES = new Set([
  EVIDENCE_CANDIDATE_TYPES.BONUS_RULE,
  EVIDENCE_CANDIDATE_TYPES.BONUS_PRODUCTION_BASIS,
  EVIDENCE_CANDIDATE_TYPES.BONUS_CARRIER_CALCULATED,
  EVIDENCE_CANDIDATE_TYPES.BONUS_PAYMENT_EVIDENCE,
]);

export function resolveEvidenceInboxRoute(candidate = {}) {
  const packetRoute = ROUTES_BY_CANDIDATE_TYPE[candidate.candidateType];

  if (!packetRoute) {
    return {
      allowed: false,
      status: EVIDENCE_PROCESSING_STATUSES.BLOCKED,
      reason: 'unknown_document_type_needs_review',
      packetRoute: null,
      createsPacketTruth: false,
      routesToRevenueSnapshot: false,
      createsPaidConfirmed: false,
    };
  }

  return {
    allowed: true,
    status: EVIDENCE_PROCESSING_STATUSES.PACKET_CREATED,
    reason: 'route_contract_resolved',
    packetRoute,
    createsPacketTruth: false,
    routesToRevenueSnapshot: false,
    createsPaidConfirmed: false,
    routesToCommissionStatementEvidencePacket: packetRoute === EVIDENCE_INBOX_ROUTE_TYPES.COMMISSION_STATEMENT_EVIDENCE_PACKET,
    bonusEvidence: BONUS_CANDIDATE_TYPES.has(candidate.candidateType),
    createsPayoutTruth: false,
    bonusCarrierCalculatedIsPaidConfirmed: false,
    bonusRuleAuthorizesImplementation: false,
    requiresHumanConfirmationBeforePaymentEvent: candidate.candidateType === EVIDENCE_CANDIDATE_TYPES.PAYMENT,
  };
}

export function canRouteToRevenueSnapshot() {
  return false;
}

export function commissionStatementIsOnlyPayoutTruthPath(candidate = {}) {
  return candidate.candidateType === EVIDENCE_CANDIDATE_TYPES.COMMISSION_STATEMENT;
}

export function isBonusEvidenceCandidate(candidate = {}) {
  return BONUS_CANDIDATE_TYPES.has(candidate.candidateType);
}
