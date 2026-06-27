'use strict';

const VALID_TRANSITION_COMMISSION_TYPES = Object.freeze(['initial', 'renewal']);
const TRANSITION_WINDOW_START_MONTH = 1;
const TRANSITION_WINDOW_END_MONTH = 6;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function evidenceIsConfirmed(evidence) {
  if (evidence === true) return true;
  if (!evidence || typeof evidence !== 'object') return false;

  if (
    evidence.confirmed === true ||
    evidence.passed === true ||
    evidence.verified === true
  ) {
    return true;
  }

  if (typeof evidence.status === 'string') {
    return ['confirmed', 'verified', 'present', 'passed', 'pass', 'ok'].includes(
      evidence.status.trim().toLowerCase()
    );
  }

  return false;
}

function isTransitionMonth(value) {
  return Number.isInteger(value) &&
    value >= TRANSITION_WINDOW_START_MONTH &&
    value <= TRANSITION_WINDOW_END_MONTH;
}

function validatePartnerTransitionLineage(lineage) {
  const blockingReasons = [];

  if (!lineage || typeof lineage !== 'object') {
    return {
      isValid: false,
      status: 'BLOCKED_OR_UNKNOWN',
      blockingReasons: ['MISSING_TRANSITION_LINEAGE'],
      normalized: null
    };
  }

  if (!isNonEmptyString(lineage.partnerId)) {
    blockingReasons.push('MISSING_PARTNER_ID');
  }

  if (!isNonEmptyString(lineage.formerAdvisorId)) {
    blockingReasons.push('MISSING_FORMER_ADVISOR_ID');
  }

  if (!isNonEmptyString(lineage.formerAdvisorCode)) {
    blockingReasons.push('MISSING_FORMER_ADVISOR_CODE');
  }

  if (!isNonEmptyString(lineage.formerAdvisorCompensationKey)) {
    blockingReasons.push('MISSING_FORMER_ADVISOR_COMPENSATION_KEY');
  }

  if (!isNonEmptyString(lineage.partnerContractDate)) {
    blockingReasons.push('MISSING_PARTNER_CONTRACT_DATE');
  }

  if (!isTransitionMonth(lineage.partnerCareerMonth)) {
    blockingReasons.push('TRANSITION_WINDOW_OUTSIDE_MONTHS_1_6');
  }

  if (!isNonEmptyString(lineage.directKey) && !isNonEmptyString(lineage.assignedPortfolioId)) {
    blockingReasons.push('MISSING_DIRECT_KEY_OR_ASSIGNED_PORTFOLIO');
  }

  if (!evidenceIsConfirmed(lineage.lineageEvidence)) {
    blockingReasons.push('MISSING_LINEAGE_EVIDENCE');
  }

  return {
    isValid: blockingReasons.length === 0,
    status: blockingReasons.length === 0 ? 'READY_FOR_CONTRACT' : 'BLOCKED_OR_UNKNOWN',
    blockingReasons,
    normalized: blockingReasons.length === 0
      ? {
          partnerId: lineage.partnerId,
          formerAdvisorId: lineage.formerAdvisorId,
          formerAdvisorCode: lineage.formerAdvisorCode,
          formerAdvisorCompensationKey: lineage.formerAdvisorCompensationKey,
          partnerContractDate: lineage.partnerContractDate,
          partnerCareerMonth: lineage.partnerCareerMonth,
          directKey: lineage.directKey || null,
          assignedPortfolioId: lineage.assignedPortfolioId || null
        }
      : null
  };
}

function validateTransitionEligibilityEvidence(evidence) {
  const blockingReasons = [];

  if (!evidence || typeof evidence !== 'object') {
    return {
      isValid: false,
      status: 'BLOCKED_OR_UNKNOWN',
      blockingReasons: ['MISSING_TRANSITION_ELIGIBILITY_EVIDENCE']
    };
  }

  if (!evidenceIsConfirmed(evidence.nonAdministrationEvidence)) {
    blockingReasons.push('NON_ADMINISTRATION_EVIDENCE_NOT_CONFIRMED');
  }

  if (!evidenceIsConfirmed(evidence.nonClientInterventionEvidence)) {
    blockingReasons.push('NON_CLIENT_INTERVENTION_EVIDENCE_NOT_CONFIRMED');
  }

  if (
    !evidenceIsConfirmed(evidence.directKeyAttributionEvidence) &&
    !evidenceIsConfirmed(evidence.assignedPortfolioEvidence)
  ) {
    blockingReasons.push('DIRECT_KEY_OR_ASSIGNED_PORTFOLIO_EVIDENCE_NOT_CONFIRMED');
  }

  return {
    isValid: blockingReasons.length === 0,
    status: blockingReasons.length === 0 ? 'READY_FOR_CONTRACT' : 'BLOCKED_OR_UNKNOWN',
    blockingReasons
  };
}

function validateTransitionCommissionLedgerLine(line, lineage, index = 0) {
  const blockingReasons = [];
  const prefix = `LEDGER_${index}`;

  if (!line || typeof line !== 'object') {
    return {
      isValid: false,
      status: 'BLOCKED_OR_UNKNOWN',
      blockingReasons: [`${prefix}_MISSING_LEDGER_LINE`],
      normalized: null
    };
  }

  if (!isNonEmptyString(line.ledgerLineId)) {
    blockingReasons.push(`${prefix}_MISSING_LEDGER_LINE_ID`);
  }

  if (!isNonEmptyString(line.partnerId)) {
    blockingReasons.push(`${prefix}_MISSING_PARTNER_ID`);
  }

  if (!isNonEmptyString(line.formerAdvisorId)) {
    blockingReasons.push(`${prefix}_MISSING_FORMER_ADVISOR_ID`);
  }

  if (!isNonEmptyString(line.formerAdvisorCompensationKey)) {
    blockingReasons.push(`${prefix}_MISSING_FORMER_ADVISOR_COMPENSATION_KEY`);
  }

  if (!VALID_TRANSITION_COMMISSION_TYPES.includes(line.commissionType)) {
    blockingReasons.push(`${prefix}_INVALID_COMMISSION_TYPE`);
  }

  if (!isPositiveNumber(line.commissionAmount)) {
    blockingReasons.push(`${prefix}_MISSING_OR_INVALID_COMMISSION_AMOUNT`);
  }

  if (!isNonEmptyString(line.premiumPaymentDate)) {
    blockingReasons.push(`${prefix}_MISSING_PREMIUM_PAYMENT_DATE`);
  }

  if (!isNonEmptyString(line.commissionPaidDate)) {
    blockingReasons.push(`${prefix}_MISSING_COMMISSION_PAID_DATE`);
  }

  if (!evidenceIsConfirmed(line.paidPremiumEvidence)) {
    blockingReasons.push(`${prefix}_PAID_PREMIUM_EVIDENCE_NOT_CONFIRMED`);
  }

  if (!evidenceIsConfirmed(line.paidAppliedCommissionEvidence)) {
    blockingReasons.push(`${prefix}_PAID_APPLIED_COMMISSION_EVIDENCE_NOT_CONFIRMED`);
  }

  if (lineage && typeof lineage === 'object') {
    if (line.partnerId !== lineage.partnerId) {
      blockingReasons.push(`${prefix}_PARTNER_ID_DOES_NOT_MATCH_LINEAGE`);
    }

    if (line.formerAdvisorId !== lineage.formerAdvisorId) {
      blockingReasons.push(`${prefix}_FORMER_ADVISOR_ID_DOES_NOT_MATCH_LINEAGE`);
    }

    if (line.formerAdvisorCompensationKey !== lineage.formerAdvisorCompensationKey) {
      blockingReasons.push(`${prefix}_FORMER_ADVISOR_KEY_DOES_NOT_MATCH_LINEAGE`);
    }

    const directKeyMatches = isNonEmptyString(lineage.directKey) && line.directKey === lineage.directKey;
    const portfolioMatches = isNonEmptyString(lineage.assignedPortfolioId) &&
      line.assignedPortfolioId === lineage.assignedPortfolioId;

    if (!directKeyMatches && !portfolioMatches) {
      blockingReasons.push(`${prefix}_DIRECT_KEY_OR_PORTFOLIO_DOES_NOT_MATCH_LINEAGE`);
    }
  }

  return {
    isValid: blockingReasons.length === 0,
    status: blockingReasons.length === 0 ? 'READY_FOR_CONTRACT' : 'BLOCKED_OR_UNKNOWN',
    blockingReasons,
    normalized: blockingReasons.length === 0
      ? {
          ledgerLineId: line.ledgerLineId,
          partnerId: line.partnerId,
          formerAdvisorId: line.formerAdvisorId,
          formerAdvisorCompensationKey: line.formerAdvisorCompensationKey,
          directKey: line.directKey || null,
          assignedPortfolioId: line.assignedPortfolioId || null,
          commissionType: line.commissionType,
          commissionAmount: line.commissionAmount,
          premiumPaymentDate: line.premiumPaymentDate,
          commissionPaidDate: line.commissionPaidDate
        }
      : null
  };
}

function assessTransitionContractReadiness(input = {}) {
  const lineage = input.lineage;
  const eligibilityEvidence = input.eligibilityEvidence;
  const ledgerLines = input.ledgerLines;

  const lineageAssessment = validatePartnerTransitionLineage(lineage);
  const eligibilityAssessment = validateTransitionEligibilityEvidence(eligibilityEvidence);

  const blockingReasons = [
    ...lineageAssessment.blockingReasons,
    ...eligibilityAssessment.blockingReasons
  ];

  let ledgerAssessments = [];

  if (!Array.isArray(ledgerLines)) {
    blockingReasons.push('LEDGER_LINES_NOT_ARRAY');
  } else if (ledgerLines.length === 0) {
    blockingReasons.push('NO_TRANSITION_LEDGER_LINES');
  } else {
    ledgerAssessments = ledgerLines.map((line, index) =>
      validateTransitionCommissionLedgerLine(line, lineage, index)
    );

    for (const assessment of ledgerAssessments) {
      blockingReasons.push(...assessment.blockingReasons);
    }
  }

  const validLedgerLines = ledgerAssessments.filter((assessment) => assessment.isValid);
  const eligibleCommissionTypes = Array.from(new Set(
    validLedgerLines
      .map((assessment) => assessment.normalized && assessment.normalized.commissionType)
      .filter(Boolean)
  ));

  const readyForCandidateCalculator = blockingReasons.length === 0 && validLedgerLines.length > 0;

  return {
    status: readyForCandidateCalculator ? 'READY_FOR_CANDIDATE_CALCULATOR' : 'BLOCKED_OR_UNKNOWN',
    readyForCandidateCalculator,
    calculationPerformed: false,
    candidateAmount: null,
    payoutTruth: false,
    blockingReasons,
    lineageAssessment,
    eligibilityAssessment,
    ledgerAssessments,
    eligibleLedgerLineCount: validLedgerLines.length,
    eligibleCommissionTypes
  };
}

module.exports = {
  VALID_TRANSITION_COMMISSION_TYPES,
  TRANSITION_WINDOW_START_MONTH,
  TRANSITION_WINDOW_END_MONTH,
  evidenceIsConfirmed,
  validatePartnerTransitionLineage,
  validateTransitionEligibilityEvidence,
  validateTransitionCommissionLedgerLine,
  assessTransitionContractReadiness
};
