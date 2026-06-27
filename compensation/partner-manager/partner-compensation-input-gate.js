import {
  QUALIFIED_ADVISOR_ECONOMIC_STATUSES,
} from './qualified-advisor-economic-status.js';

export const PARTNER_COMPENSATION_CONCEPT_KEYS = Object.freeze({
  PRODUCTIVITY_BASE: 'productivity-base',
  PRODUCTIVITY_MULTIPLIER: 'productivity-multiplier',
  PRODUCTIVITY_ANNUAL_ADDITIONAL_BONUS: 'productivity-annual-additional-bonus',
  PRODUCTION_BONUS: 'production-bonus',
  ACTIVITY_BONUS: 'activity-bonus',
  FIXED_SUPPORT: 'fixed-support',
  TRANSITION_BONUS: 'transition-bonus',
  CONNECTION_BONUS: 'connection-bonus',
  DEVELOPMENT_BONUS: 'development-bonus',
  PARTNER_PROMOTION_BONUS: 'partner-promotion-bonus',
  UNKNOWN: 'unknown',
});

export const PARTNER_INPUT_READINESS = Object.freeze({
  READY: 'ready',
  PARTIAL_CONTRACT_ALLOWED: 'partial_contract_allowed',
  BLOCKED: 'blocked',
});

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function result({
  allowed = false,
  conceptKey = PARTNER_COMPENSATION_CONCEPT_KEYS.UNKNOWN,
  reason = 'blocked',
  blockedReasons = [],
  requiredInputs = [],
  warnings = [],
  inputReadiness = PARTNER_INPUT_READINESS.BLOCKED,
} = {}) {
  return {
    allowed,
    conceptKey,
    reason,
    blockedReasons,
    requiredInputs,
    warnings,
    inputReadiness,
  };
}

function hasQualifiedStatus(status = {}) {
  return status?.status === QUALIFIED_ADVISOR_ECONOMIC_STATUSES.QUALIFIED_CONFIRMED;
}

export function evaluatePartnerCompensationInput({
  conceptKey = PARTNER_COMPENSATION_CONCEPT_KEYS.UNKNOWN,
  qualifiedAdvisorEconomicStatus = null,
  averageMonthlyInitialCommissions = null,
  hasPaidAppliedEconomicEvidence = false,
  lifecycleOfficial = false,
  LIMRARequired = false,
  IGCRequired = false,
  LIMRA = null,
  IGC = null,
  qualifiedAdvisorCount = null,
  TAWinnerCount = null,
  baseProductivityResult = null,
  nonQualifiedAdvisorEconomicOutput = null,
  rawActivityOnly = false,
  hasPaidAppliedProductionEvidence = false,
  unitLIMRARequired = false,
  unitIGCRequired = false,
  unitLIMRA = null,
  unitIGC = null,
  validLifeGmmPolicyCount = null,
  hasPaidAppliedPolicyEvidence = false,
  allowActivityOnlyPolicies = false,
  accumulatedCommissionEvidence = false,
  TAWinnerEvidence = false,
  assignedPortfolioCommissions = null,
  directKeyAttribution = false,
  commissionEvidence = false,
  hasCompleteTable = false,
  hasFormula = false,
} = {}) {
  if (conceptKey === PARTNER_COMPENSATION_CONCEPT_KEYS.PRODUCTIVITY_BASE) {
    const blockedReasons = [];
    if (!hasQualifiedStatus(qualifiedAdvisorEconomicStatus)) blockedReasons.push('missing_qualified_advisor_economic_status');
    if (!hasNumber(averageMonthlyInitialCommissions)) blockedReasons.push('missing_initial_commission_evidence');
    if (!hasPaidAppliedEconomicEvidence) blockedReasons.push('missing_paid_applied_economic_evidence');
    if (!lifecycleOfficial) blockedReasons.push('precontract_or_unofficial_lifecycle');
    if (LIMRARequired && !hasNumber(LIMRA)) blockedReasons.push('missing_LIMRA');
    if (IGCRequired && !hasNumber(IGC)) blockedReasons.push('missing_IGC');

    return result({
      allowed: blockedReasons.length === 0,
      conceptKey,
      reason: blockedReasons.length === 0 ? 'productivity_base_input_ready' : 'productivity_base_input_blocked',
      blockedReasons,
      requiredInputs: ['qualified_advisor_economic_status', 'average_monthly_initial_commissions', 'paid_applied_economic_evidence', 'official_lifecycle'],
      inputReadiness: blockedReasons.length === 0 ? PARTNER_INPUT_READINESS.READY : PARTNER_INPUT_READINESS.BLOCKED,
    });
  }

  if (conceptKey === PARTNER_COMPENSATION_CONCEPT_KEYS.PRODUCTIVITY_MULTIPLIER) {
    const blockedReasons = [];
    if (!hasNumber(qualifiedAdvisorCount)) blockedReasons.push('missing_qualified_advisor_status');
    if (!hasNumber(TAWinnerCount)) blockedReasons.push('missing_TA_result');
    if (!baseProductivityResult) blockedReasons.push('missing_base_result');

    return result({
      allowed: blockedReasons.length === 0,
      conceptKey,
      reason: blockedReasons.length === 0 ? 'productivity_multiplier_input_ready' : 'productivity_multiplier_input_blocked',
      blockedReasons,
      requiredInputs: ['qualified_advisor_count', 'TA_winner_count', 'base_productivity_result'],
      inputReadiness: blockedReasons.length === 0 ? PARTNER_INPUT_READINESS.READY : PARTNER_INPUT_READINESS.BLOCKED,
    });
  }

  if (conceptKey === PARTNER_COMPENSATION_CONCEPT_KEYS.PRODUCTION_BONUS) {
    const blockedReasons = [];
    if (!nonQualifiedAdvisorEconomicOutput) blockedReasons.push('missing_non_qualified_advisor_economic_output');
    if (rawActivityOnly) blockedReasons.push('raw_activity_only');
    if (!hasPaidAppliedProductionEvidence) blockedReasons.push('missing_paid_applied_evidence');
    if (unitLIMRARequired && !hasNumber(unitLIMRA)) blockedReasons.push('missing_unit_LIMRA');
    if (unitIGCRequired && !hasNumber(unitIGC)) blockedReasons.push('missing_unit_IGC');

    return result({
      allowed: blockedReasons.length === 0,
      conceptKey,
      reason: blockedReasons.length === 0 ? 'production_bonus_input_ready' : 'production_bonus_input_blocked',
      blockedReasons,
      requiredInputs: ['non_qualified_advisor_economic_output', 'paid_applied_production_evidence'],
      inputReadiness: blockedReasons.length === 0 ? PARTNER_INPUT_READINESS.READY : PARTNER_INPUT_READINESS.BLOCKED,
    });
  }

  if (conceptKey === PARTNER_COMPENSATION_CONCEPT_KEYS.ACTIVITY_BONUS) {
    const blockedReasons = [];
    if (!hasNumber(validLifeGmmPolicyCount)) blockedReasons.push('missing_valid_life_gmm_policy_count');
    if (!hasPaidAppliedPolicyEvidence && !allowActivityOnlyPolicies) blockedReasons.push('issued_policy_without_payment_application');
    if (rawActivityOnly) blockedReasons.push('raw_activity_logs_only');

    return result({
      allowed: blockedReasons.length === 0,
      conceptKey,
      reason: blockedReasons.length === 0 ? 'activity_bonus_input_ready' : 'activity_bonus_input_blocked',
      blockedReasons,
      requiredInputs: ['valid_life_gmm_policy_count', 'paid_applied_policy_evidence'],
      inputReadiness: blockedReasons.length === 0 ? PARTNER_INPUT_READINESS.READY : PARTNER_INPUT_READINESS.BLOCKED,
    });
  }

  if (conceptKey === PARTNER_COMPENSATION_CONCEPT_KEYS.FIXED_SUPPORT) {
    const blockedReasons = [];
    if (!accumulatedCommissionEvidence) blockedReasons.push('missing_accumulated_commission_evidence');
    if (!TAWinnerEvidence) blockedReasons.push('missing_TA_winners');
    if (rawActivityOnly) blockedReasons.push('activity_only_evidence');

    return result({
      allowed: blockedReasons.length === 0,
      conceptKey,
      reason: blockedReasons.length === 0 ? 'fixed_support_input_ready' : 'fixed_support_input_blocked',
      blockedReasons,
      requiredInputs: ['accumulated_commission_evidence', 'TA_winners'],
      inputReadiness: blockedReasons.length === 0 ? PARTNER_INPUT_READINESS.READY : PARTNER_INPUT_READINESS.BLOCKED,
    });
  }

  if (conceptKey === PARTNER_COMPENSATION_CONCEPT_KEYS.TRANSITION_BONUS) {
    const blockedReasons = [];
    if (!hasNumber(assignedPortfolioCommissions)) blockedReasons.push('blocked_by_missing_commission_evidence');
    if (!directKeyAttribution) blockedReasons.push('missing_direct_key_evidence');
    if (!commissionEvidence) blockedReasons.push('assigned_portfolio_without_commission_evidence');

    return result({
      allowed: blockedReasons.length === 0,
      conceptKey,
      reason: blockedReasons.length === 0 ? 'transition_bonus_input_ready' : 'transition_bonus_input_blocked',
      blockedReasons,
      requiredInputs: ['assigned_portfolio_commissions', 'direct_key_attribution', 'commission_evidence'],
      inputReadiness: blockedReasons.length === 0 ? PARTNER_INPUT_READINESS.READY : PARTNER_INPUT_READINESS.BLOCKED,
    });
  }

  if (
    conceptKey === PARTNER_COMPENSATION_CONCEPT_KEYS.CONNECTION_BONUS ||
    conceptKey === PARTNER_COMPENSATION_CONCEPT_KEYS.DEVELOPMENT_BONUS ||
    conceptKey === PARTNER_COMPENSATION_CONCEPT_KEYS.PARTNER_PROMOTION_BONUS
  ) {
    const blockedReasons = [];
    if (!hasCompleteTable) blockedReasons.push('blocked_by_missing_table');
    if (!hasFormula) blockedReasons.push('blocked_by_missing_formula');

    return result({
      allowed: false,
      conceptKey,
      reason: 'partial_partner_concept_not_ready_for_full_calculation',
      blockedReasons,
      requiredInputs: ['complete_table', 'formula'],
      warnings: ['Semantic scaffold may be allowed; full calculation remains blocked.'],
      inputReadiness: PARTNER_INPUT_READINESS.PARTIAL_CONTRACT_ALLOWED,
    });
  }

  return result({
    conceptKey: PARTNER_COMPENSATION_CONCEPT_KEYS.UNKNOWN,
    reason: 'unknown_partner_compensation_concept',
    blockedReasons: ['unknown_concept'],
    requiredInputs: [],
  });
}
