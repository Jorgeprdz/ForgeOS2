import {
  assessPartnerConnectionBonus,
  assessPartnerDevelopmentBonus,
  assessPartnerPromotionBonus,
  assessPartnerTransitionBonus,
} from './partner-partial-bonus-contracts.js';

import {
  getConnectionBonusAmount,
  getDevelopmentBonusAmount,
} from './partner-2026-rule-pack-loader.js';

import {
  PARTNER_SAFE_CALCULATION_STATUSES,
  createPartnerSafeCalculationResult,
} from './partner-safe-calculation-result.js';

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

export function gatePartnerTransitionBonusCalculation({
  assignedPortfolioCommissions = null,
  directKeyAttribution = false,
  commissionEvidence = false,
} = {}) {
  const assessment = assessPartnerTransitionBonus({
    assignedPortfolioCommissions,
    directKeyAttribution,
    commissionEvidence,
  });

  return createPartnerSafeCalculationResult({
    conceptKey: 'transition-bonus',
    status: PARTNER_SAFE_CALCULATION_STATUSES.BLOCKED_BY_MISSING_COMMISSION_EVIDENCE,
    calculationAllowed: false,
    blockedReasons: assessment.blockedReasons.length > 0
      ? assessment.blockedReasons
      : ['partial_readiness_no_full_calculation'],
    sourceNotes: assessment.sourceNotes,
    confidence: assessment.confidence,
    evidenceRequirement: ['assigned_portfolio_commissions', 'direct_key_attribution', 'commission_evidence'],
    metadata: { assessment },
  });
}

export function gatePartnerConnectionBonusCalculation({
  rulePack = null,
  onboardingEvidence = false,
  advisorMonth = null,
  validPolicyCount = null,
  monthlyPolicies = null,
  quarterPolicyTotal = null,
  policyInputIsMonthly = false,
  paidAppliedPolicyEvidence = false,
  hasCompletePolicyAmountTable = false,
  connectorActiveAtMonthClose = true,
  connectedAdvisorActiveAtMonthClose = true,
} = {}) {
  const assessment = assessPartnerConnectionBonus({ rulePack, hasCompletePolicyAmountTable });
  const blockedReasons = rulePack ? [] : ['partial_readiness_no_full_calculation'];
  const evaluatingMonthlyScale = [2, 3].includes(Number(advisorMonth));
  const resolvedMonthlyPolicies = hasNumber(monthlyPolicies)
    ? monthlyPolicies
    : (policyInputIsMonthly ? validPolicyCount : null);
  if (!onboardingEvidence && !evaluatingMonthlyScale) blockedReasons.push('missing_onboarding_evidence');
  if (!rulePack && !hasCompletePolicyAmountTable) blockedReasons.push('blocked_by_missing_table');
  const ruleAmount = rulePack ? getConnectionBonusAmount(rulePack, { advisorMonth, validPolicyCount: resolvedMonthlyPolicies, onboardingEvidence }) : { amount: null };
  if (rulePack && evaluatingMonthlyScale && paidAppliedPolicyEvidence !== true) blockedReasons.push('missing_paid_applied_policy_evidence');
  if (rulePack && evaluatingMonthlyScale && !hasNumber(resolvedMonthlyPolicies)) blockedReasons.push(hasNumber(quarterPolicyTotal) ? 'blocked_by_missing_monthly_policy_breakdown' : 'missing_policy_scale_match');
  if (connectorActiveAtMonthClose !== true || connectedAdvisorActiveAtMonthClose !== true) blockedReasons.push('blocked_by_inactive_connection_participants');
  if (rulePack && evaluatingMonthlyScale && ruleAmount.amount === null) blockedReasons.push('missing_policy_scale_match');

  return createPartnerSafeCalculationResult({
    conceptKey: 'connection-bonus',
    status: blockedReasons.length > 0 ? PARTNER_SAFE_CALCULATION_STATUSES.CALCULATION_PARTIAL : PARTNER_SAFE_CALCULATION_STATUSES.CALCULATED_CANDIDATE,
    calculationAllowed: rulePack && blockedReasons.length === 0,
    calculatedCandidate: rulePack && blockedReasons.length === 0,
    candidateAmount: rulePack ? ruleAmount.amount : null,
    blockedReasons,
    warnings: assessment.warnings,
    sourceNotes: assessment.sourceNotes,
    confidence: assessment.confidence,
    evidenceRequirement: ['onboarding_evidence', 'complete_policy_amount_table'],
    metadata: {
      semanticCandidateAmount: onboardingEvidence ? assessment.metadata?.activationSemanticAmount ?? null : null,
      assessment,
    },
  });
}

export function gatePartnerDevelopmentBonusCalculation({
  rulePack = null,
  advisorMonth = null,
  validPolicyCount = null,
  monthlyPolicies = null,
  quarterPolicyTotal = null,
  policyInputIsMonthly = false,
  paidAppliedPolicyEvidence = false,
  developerCount = 1,
  developerEligibilityEvidence = true,
} = {}) {
  const assessment = assessPartnerDevelopmentBonus({ rulePack });
  const resolvedMonthlyPolicies = hasNumber(monthlyPolicies)
    ? monthlyPolicies
    : (policyInputIsMonthly ? validPolicyCount : null);
  const ruleAmount = rulePack ? getDevelopmentBonusAmount(rulePack, { advisorMonth, validPolicyCount: resolvedMonthlyPolicies }) : { amount: null };
  const blockedReasons = rulePack ? [] : ['example_only_not_formula', 'blocked_by_missing_table'];
  if (rulePack && !hasNumber(resolvedMonthlyPolicies)) blockedReasons.push(hasNumber(quarterPolicyTotal) ? 'blocked_by_missing_monthly_policy_breakdown' : 'missing_policy_scale_match');
  if (rulePack && ruleAmount.amount === null) blockedReasons.push(...ruleAmount.blockedReasons);
  if (rulePack && paidAppliedPolicyEvidence !== true) blockedReasons.push('missing_paid_applied_policy_evidence');
  if (rulePack && developerEligibilityEvidence !== true) blockedReasons.push('missing_developer_eligibility_evidence');
  const shareFactor = Number(developerCount) === 2 ? 0.5 : 1;
  return createPartnerSafeCalculationResult({
    conceptKey: 'development-bonus',
    status: rulePack ? (
      blockedReasons.length > 0 ? PARTNER_SAFE_CALCULATION_STATUSES.BLOCKED_BY_MISSING_EVIDENCE : PARTNER_SAFE_CALCULATION_STATUSES.CALCULATED_CANDIDATE
    ) : PARTNER_SAFE_CALCULATION_STATUSES.EXAMPLE_ONLY,
    calculationAllowed: rulePack && blockedReasons.length === 0,
    calculatedCandidate: rulePack && blockedReasons.length === 0,
    candidateAmount: rulePack && ruleAmount.amount !== null ? Number(ruleAmount.amount) * shareFactor : null,
    blockedReasons,
    warnings: assessment.warnings,
    sourceNotes: assessment.sourceNotes,
    confidence: assessment.confidence,
    evidenceRequirement: ['complete_policy_amount_table'],
    metadata: {
      exampleOnly: assessment.metadata.exampleOnly,
      shareFactor,
      additionalMonth12BonusStatus: Number(advisorMonth) === 12 ? 'blocked_without_month_12_evidence' : 'not_applicable',
      assessment,
    },
  });
}

export function gatePartnerPromotionBonusCalculation({
  hasAltaPartnerTable = false,
  hasSupportMetricsDefinition = false,
} = {}) {
  const assessment = assessPartnerPromotionBonus({
    hasAltaPartnerTable,
    hasSupportMetricsDefinition,
  });
  return createPartnerSafeCalculationResult({
    conceptKey: 'partner-promotion-bonus',
    status: PARTNER_SAFE_CALCULATION_STATUSES.CALCULATION_PARTIAL,
    calculationAllowed: false,
    blockedReasons: assessment.blockedReasons.length > 0
      ? assessment.blockedReasons
      : ['partial_readiness_no_full_calculation'],
    warnings: assessment.warnings,
    sourceNotes: assessment.sourceNotes,
    confidence: assessment.confidence,
    evidenceRequirement: ['alta_partner_table', 'support_metrics_definition'],
    metadata: {
      semanticAmounts: {
        total: assessment.metadata?.totalSemanticAmount ?? null,
        initial: assessment.metadata?.initialPayment ?? null,
        monthly: assessment.metadata?.monthlyPayment ?? null,
        payments: assessment.metadata?.monthlyPayments ?? null,
      },
      assessment,
    },
  });
}
