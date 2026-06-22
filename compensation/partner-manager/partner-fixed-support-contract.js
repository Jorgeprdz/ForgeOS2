import {
  PARTNER_RULE_PACK_READINESS,
  createPartnerRulePackAssessment,
} from './rule-pack-readiness.js';

import {
  getFixedSupportAmountBySemester,
  loadPartner2026RulePack,
} from './partner-2026-rule-pack-loader.js';

import {
  evaluatePartnerSupportRequirementGate,
} from './partner-support-requirement-gate.js';

export const PARTNER_FIXED_SUPPORT_CONCEPT_KEY = 'fixed-support';
export const PARTNER_FIXED_SUPPORT_TABLE_VERSION = 'SMNYL_PARTNER_2026_PAGE_12_FIXED_SUPPORT';
export const FIXED_SUPPORT_TA_COUNTING_EVENT_NOTE = 'TA-counting precontract/advisor event may count for Partner support eligibility, but it is not a paid bonus and does not release Partner economic gain.';

const DEFAULT_PARTNER_2026_RULE_PACK = loadPartner2026RulePack();

export const FIXED_SUPPORT_AMOUNTS_BY_SEMESTER = Object.freeze(Object.fromEntries(
  (DEFAULT_PARTNER_2026_RULE_PACK.concepts?.['fixed-support']?.supportAmountsBySemester || [])
    .map((row) => [row.semester, row.amount])
));

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

export function assessPartnerFixedSupport({
  rulePack = null,
  semesterIndex = null,
  partnerCareerMonth = null,
  supportRequirementGateResult = null,
  strictSupportRequirementGate = false,
  accumulatedCommissions = null,
  accumulatedCommissionGoal = null,
  accumulatedCommissionGoalsEvidence = false,
  taCountingPrecontractCount = null,
  supportQualifiedPrecontractCount = null,
  taCountingAdvisorEventCount = null,
  taCountingEventEvidence = false,
  TAWinnerCount = null,
  supportTableEvidence = false,
  partnerLifecycleStatus = null,
  rawActivityOnly = false,
} = {}) {
  const blockedReasons = [];
  const missingInputs = [];
  const activeRulePack = rulePack || DEFAULT_PARTNER_2026_RULE_PACK;
  const supportConcept = activeRulePack?.concepts?.['fixed-support'] || {};
  const commissionRule = supportConcept.commissionAchievementPaymentRule || {};
  const trainingRequirement = supportConcept.trainingWinnersRequirement || {};
  const goalRow = (supportConcept.accumulatedCommissionGoals?.rules || [])
    .find((row) => Number(row.partnerCareerMonth) === Number(partnerCareerMonth));
  const resolvedAccumulatedCommissionGoal = hasNumber(accumulatedCommissionGoal)
    ? Number(accumulatedCommissionGoal)
    : (hasNumber(goalRow?.goal) ? Number(goalRow.goal) : null);
  const jsonAmount = getFixedSupportAmountBySemester(activeRulePack, { semesterIndex, partnerCareerMonth });
  const resolvedSemesterIndex = jsonAmount?.semesterIndex ?? semesterIndex;
  const officialSupportTablesPresent = Boolean(
    supportConcept.supportAmountsBySemester &&
    supportConcept.accumulatedCommissionGoals &&
    supportConcept.trainingWinnersRequirement &&
    supportConcept.commissionAchievementPaymentRule
  );
  const resolvedSupportRequirementGate = supportRequirementGateResult || (
    officialSupportTablesPresent
      ? { allowed: true, blockedReasons: [], missingInputs: [] }
      : evaluatePartnerSupportRequirementGate({
        rulePack: activeRulePack,
        partnerCareerMonth,
        semesterIndex: resolvedSemesterIndex,
        accumulatedCommissions,
        accumulatedCommissionGoal: resolvedAccumulatedCommissionGoal,
        accumulatedCommissionGoalsEvidence,
        taCountingPrecontractCount,
        supportQualifiedPrecontractCount,
        taCountingAdvisorEventCount,
        taCountingEventEvidence,
        TAWinnerCount,
        supportTableEvidence,
        partnerLifecycleStatus,
      })
  );
  const baseSupportAmount = jsonAmount.amount;
  const achievementRatio = hasNumber(accumulatedCommissions) && hasNumber(resolvedAccumulatedCommissionGoal) && Number(resolvedAccumulatedCommissionGoal) > 0
    ? Number(accumulatedCommissions) / Number(resolvedAccumulatedCommissionGoal)
    : null;
  const minimumAchievementRatio = commissionRule.minimumAchievementRatioForSupport;
  const supportPayFactor = hasNumber(achievementRatio)
    ? (
      Number(achievementRatio) >= 1
        ? Number(commissionRule.ifAchievementAtLeastFull?.payFactor ?? 1)
        : (
          Number(achievementRatio) >= Number(minimumAchievementRatio)
            ? Number(achievementRatio)
            : null
        )
    )
    : null;
  const amountCandidate = hasNumber(baseSupportAmount) && hasNumber(supportPayFactor)
    ? Number(baseSupportAmount) * Number(supportPayFactor)
    : baseSupportAmount;

  if (!amountCandidate) {
    missingInputs.push('semesterIndex');
    blockedReasons.push('invalid_semester_index');
  }

  if (resolvedSupportRequirementGate?.allowed === false) {
    blockedReasons.push(...resolvedSupportRequirementGate.blockedReasons);
    missingInputs.push(...resolvedSupportRequirementGate.missingInputs);
  } else if (!resolvedSupportRequirementGate && strictSupportRequirementGate) {
    blockedReasons.push('blocked_by_missing_support_requirement_gate');
    missingInputs.push('supportRequirementGateResult');
  }

  const normalizedTaCountingCount = [
    taCountingPrecontractCount,
    supportQualifiedPrecontractCount,
    taCountingAdvisorEventCount,
    TAWinnerCount,
  ].find(hasNumber);

  if (!accumulatedCommissionGoalsEvidence && !officialSupportTablesPresent) blockedReasons.push('blocked_by_missing_accumulated_commission_evidence');
  if (!hasNumber(accumulatedCommissions)) {
    blockedReasons.push('blocked_by_missing_accumulated_commission_actual');
    missingInputs.push('accumulatedCommissionActualLifeIndividualAndGmmi');
  }
  if (!hasNumber(resolvedAccumulatedCommissionGoal)) blockedReasons.push('blocked_by_missing_accumulated_commission_goal');
  if (hasNumber(achievementRatio) && Number(achievementRatio) < Number(minimumAchievementRatio)) {
    blockedReasons.push(commissionRule.ifAchievementBelowMinimum?.blockedReason || 'blocked_by_accumulated_commissions_below_80_percent');
  }

  const trainingRule = (trainingRequirement.rules || []).find((row) => (
    (hasNumber(row.partnerCareerMonth) && Number(row.partnerCareerMonth) === Number(partnerCareerMonth)) ||
    (
      hasNumber(row.partnerCareerMonthFrom) &&
      Number(partnerCareerMonth) >= Number(row.partnerCareerMonthFrom) &&
      (row.partnerCareerMonthTo === null || row.partnerCareerMonthTo === undefined || Number(partnerCareerMonth) <= Number(row.partnerCareerMonthTo))
    )
  ));
  const requiredTrainingWinners = hasNumber(trainingRule?.requiredTrainingWinners)
    ? Number(trainingRule.requiredTrainingWinners)
    : null;
  if (!hasNumber(normalizedTaCountingCount)) {
    blockedReasons.push('blocked_by_missing_training_winner_count');
    missingInputs.push('trainingWinnerActualCountLastSixMonths');
  } else if (hasNumber(requiredTrainingWinners) && Number(normalizedTaCountingCount) < Number(requiredTrainingWinners)) {
    blockedReasons.push('blocked_by_insufficient_training_winners');
  }
  if (!supportTableEvidence && !officialSupportTablesPresent) blockedReasons.push('blocked_by_missing_table');
  if (!partnerLifecycleStatus) {
    blockedReasons.push('blocked_by_partner_inactive');
    missingInputs.push('partnerActiveStatus');
  } else if (!['connected_active', 'active', 'partner_active', 'manager_active'].includes(partnerLifecycleStatus)) {
    blockedReasons.push('blocked_by_partner_inactive');
  }
  if (rawActivityOnly) blockedReasons.push('activity_only_cannot_satisfy_commission_goals');

  return createPartnerRulePackAssessment({
    conceptKey: PARTNER_FIXED_SUPPORT_CONCEPT_KEY,
    readiness: blockedReasons.length > 0
      ? PARTNER_RULE_PACK_READINESS.BLOCKED_BY_MISSING_TABLE
      : PARTNER_RULE_PACK_READINESS.READY_FOR_CONTRACT_WITH_CAUTION,
    calculationAllowed: true,
    requiredInputs: officialSupportTablesPresent
      ? ['partnerCareerMonth', 'accumulatedCommissionActualLifeIndividualAndGmmi', 'trainingWinnerActualCountLastSixMonths', 'partnerActiveStatus']
      : ['semesterIndex', 'supportRequirementGateResult', 'accumulatedCommissionGoalsEvidence', 'taCountingEventEvidence', 'supportTableEvidence'],
    missingInputs,
    blockedReasons,
    warnings: ['Fixed support amount is candidate; payout truth requires official statement/payment evidence.', FIXED_SUPPORT_TA_COUNTING_EVENT_NOTE],
    sourceNotes: ['SMNYL Partner Compensation 2026 page 12.', FIXED_SUPPORT_TA_COUNTING_EVENT_NOTE],
    confidence: blockedReasons.length > 0 ? 'blocked' : 'medium',
    tableVersion: PARTNER_FIXED_SUPPORT_TABLE_VERSION,
    amountCandidate,
    metadata: {
      semesterIndex: resolvedSemesterIndex,
      partnerCareerMonth,
      accumulatedCommissionGoal: resolvedAccumulatedCommissionGoal,
      achievementRatio,
      supportPayFactor,
      baseSupportAmount,
      requiredTrainingWinners,
      rulePackId: activeRulePack?.rulePackId || null,
      taCountingPrecontractCount: normalizedTaCountingCount ?? null,
      taCountingEventEvidence,
      legacyTAWinnerCountAlias: TAWinnerCount,
      partnerLifecycleStatus,
      createsPartnerEconomicGain: false,
      releasesHeldCommission: false,
      supportRequirementGateResult: resolvedSupportRequirementGate,
    },
  });
}
