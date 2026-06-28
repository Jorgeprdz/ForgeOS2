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

// PCV_2026_FIXED_SUPPORT_OFFICIAL_TABLES_LOCK
export const PCV_2026_FIXED_SUPPORT_MONTHLY_SUPPORT_AMOUNTS_BY_SEMESTER = Object.freeze([
  Object.freeze({ semester: 1, careerMonthStart: 1, careerMonthEnd: 6, monthlySupportAmount: 65000 }),
  Object.freeze({ semester: 2, careerMonthStart: 7, careerMonthEnd: 12, monthlySupportAmount: 54000 }),
  Object.freeze({ semester: 3, careerMonthStart: 13, careerMonthEnd: 18, monthlySupportAmount: 43500 }),
  Object.freeze({ semester: 4, careerMonthStart: 19, careerMonthEnd: 24, monthlySupportAmount: 32500 }),
  Object.freeze({ semester: 5, careerMonthStart: 25, careerMonthEnd: 30, monthlySupportAmount: 21500 }),
  Object.freeze({ semester: 6, careerMonthStart: 31, careerMonthEnd: 36, monthlySupportAmount: 11000 }),
]);

export const PCV_2026_FIXED_SUPPORT_INITIAL_COMMISSION_GOALS_BY_CAREER_MONTH = Object.freeze([
  Object.freeze({ careerMonth: 1, initialCommissionGoal: 14500 }),
  Object.freeze({ careerMonth: 2, initialCommissionGoal: 18500 }),
  Object.freeze({ careerMonth: 3, initialCommissionGoal: 22000 }),
  Object.freeze({ careerMonth: 4, initialCommissionGoal: 25000 }),
  Object.freeze({ careerMonth: 5, initialCommissionGoal: 29000 }),
  Object.freeze({ careerMonth: 6, initialCommissionGoal: 33000 }),
  Object.freeze({ careerMonth: 7, initialCommissionGoal: 40000 }),
  Object.freeze({ careerMonth: 8, initialCommissionGoal: 47500 }),
  Object.freeze({ careerMonth: 9, initialCommissionGoal: 55000 }),
  Object.freeze({ careerMonth: 10, initialCommissionGoal: 62000 }),
  Object.freeze({ careerMonth: 11, initialCommissionGoal: 63000 }),
  Object.freeze({ careerMonth: 12, initialCommissionGoal: 63500 }),
  Object.freeze({ careerMonth: 13, initialCommissionGoal: 63500 }),
  Object.freeze({ careerMonth: 14, initialCommissionGoal: 64500 }),
  Object.freeze({ careerMonth: 15, initialCommissionGoal: 65500 }),
  Object.freeze({ careerMonth: 16, initialCommissionGoal: 67500 }),
  Object.freeze({ careerMonth: 17, initialCommissionGoal: 69000 }),
  Object.freeze({ careerMonth: 18, initialCommissionGoal: 70000 }),
  Object.freeze({ careerMonth: 19, initialCommissionGoal: 71000 }),
  Object.freeze({ careerMonth: 20, initialCommissionGoal: 72500 }),
  Object.freeze({ careerMonth: 21, initialCommissionGoal: 73500 }),
  Object.freeze({ careerMonth: 22, initialCommissionGoal: 74500 }),
  Object.freeze({ careerMonth: 23, initialCommissionGoal: 75500 }),
  Object.freeze({ careerMonth: 24, initialCommissionGoal: 76500 }),
  Object.freeze({ careerMonth: 25, initialCommissionGoal: 76500 }),
  Object.freeze({ careerMonth: 26, initialCommissionGoal: 78000 }),
  Object.freeze({ careerMonth: 27, initialCommissionGoal: 80000 }),
  Object.freeze({ careerMonth: 28, initialCommissionGoal: 81000 }),
  Object.freeze({ careerMonth: 29, initialCommissionGoal: 82000 }),
  Object.freeze({ careerMonth: 30, initialCommissionGoal: 83000 }),
  Object.freeze({ careerMonth: 31, initialCommissionGoal: 84500 }),
  Object.freeze({ careerMonth: 32, initialCommissionGoal: 85500 }),
  Object.freeze({ careerMonth: 33, initialCommissionGoal: 86500 }),
  Object.freeze({ careerMonth: 34, initialCommissionGoal: 87500 }),
  Object.freeze({ careerMonth: 35, initialCommissionGoal: 88500 }),
  Object.freeze({ careerMonth: 36, initialCommissionGoal: 90500 }),
]);

export const PCV_2026_FIXED_SUPPORT_TA_WINNER_TARGETS_BY_CAREER_MONTH = Object.freeze([
  Object.freeze({ careerMonthStart: 1, careerMonthEnd: 2, requiredTrainingAdvisorWinners: 0 }),
  Object.freeze({ careerMonthStart: 3, careerMonthEnd: 4, requiredTrainingAdvisorWinners: 1 }),
  Object.freeze({ careerMonthStart: 5, careerMonthEnd: 5, requiredTrainingAdvisorWinners: 2 }),
  Object.freeze({ careerMonthStart: 6, careerMonthEnd: 36, requiredTrainingAdvisorWinners: 3 }),
]);

export const PCV_2026_FIXED_SUPPORT_FIRST_TWO_HIRES_EXCLUSION = Object.freeze({
  appliesTo: 'training_advisor_winner_goal',
  excludedHireCount: 2,
  rule: 'first two hires in Partner unit are not considered for TA winner goal',
  evidenceRequired: true,
});

export const PCV_2026_FIXED_SUPPORT_COMPLIANCE_RULES = Object.freeze({
  minimumComplianceRatio: 0.8,
  proportionalSupportStartInclusive: 0.8,
  proportionalSupportEndExclusive: 1,
  fullSupportStartInclusive: 1,
  recoveryMaxPreviousMonths: 3,
  recoveryRequiresSamePartnerYear: true,
  payoutTruth: false,
  unknownIsNotZero: true,
});

export function normalizePcv2026FixedSupportCareerMonth(value) {
  const careerMonth = Number(value);

  if (!Number.isInteger(careerMonth) || careerMonth < 1 || careerMonth > 36) {
    return null;
  }

  return careerMonth;
}

export function getPcv2026FixedSupportSemesterForCareerMonth(value) {
  const careerMonth = normalizePcv2026FixedSupportCareerMonth(value);

  if (careerMonth === null) return null;

  const semester = PCV_2026_FIXED_SUPPORT_MONTHLY_SUPPORT_AMOUNTS_BY_SEMESTER.find(
    (entry) => careerMonth >= entry.careerMonthStart && careerMonth <= entry.careerMonthEnd
  );

  return semester ? semester.semester : null;
}

export function getPcv2026FixedSupportMonthlyAmountForCareerMonth(value) {
  const careerMonth = normalizePcv2026FixedSupportCareerMonth(value);

  if (careerMonth === null) return null;

  const semester = PCV_2026_FIXED_SUPPORT_MONTHLY_SUPPORT_AMOUNTS_BY_SEMESTER.find(
    (entry) => careerMonth >= entry.careerMonthStart && careerMonth <= entry.careerMonthEnd
  );

  return semester ? semester.monthlySupportAmount : null;
}

export function getPcv2026FixedSupportInitialCommissionGoalForCareerMonth(value) {
  const careerMonth = normalizePcv2026FixedSupportCareerMonth(value);

  if (careerMonth === null) return null;

  const goal = PCV_2026_FIXED_SUPPORT_INITIAL_COMMISSION_GOALS_BY_CAREER_MONTH.find(
    (entry) => entry.careerMonth === careerMonth
  );

  return goal ? goal.initialCommissionGoal : null;
}

export function getPcv2026FixedSupportTrainingAdvisorTargetForCareerMonth(value) {
  const careerMonth = normalizePcv2026FixedSupportCareerMonth(value);

  if (careerMonth === null) return null;

  const target = PCV_2026_FIXED_SUPPORT_TA_WINNER_TARGETS_BY_CAREER_MONTH.find(
    (entry) => careerMonth >= entry.careerMonthStart && careerMonth <= entry.careerMonthEnd
  );

  return target ? target.requiredTrainingAdvisorWinners : null;
}

export function getPcv2026FixedSupportOfficialTables() {
  return {
    monthlySupportAmountsBySemester: PCV_2026_FIXED_SUPPORT_MONTHLY_SUPPORT_AMOUNTS_BY_SEMESTER,
    initialCommissionGoalsByCareerMonth: PCV_2026_FIXED_SUPPORT_INITIAL_COMMISSION_GOALS_BY_CAREER_MONTH,
    trainingAdvisorWinnerTargetsByCareerMonth: PCV_2026_FIXED_SUPPORT_TA_WINNER_TARGETS_BY_CAREER_MONTH,
    firstTwoHiresExclusion: PCV_2026_FIXED_SUPPORT_FIRST_TWO_HIRES_EXCLUSION,
    complianceRules: PCV_2026_FIXED_SUPPORT_COMPLIANCE_RULES,
  };
}

export function validatePcv2026FixedSupportOfficialContract(input = {}) {
  const careerMonth = normalizePcv2026FixedSupportCareerMonth(input.careerMonth);
  const blockingReasons = [];

  if (input.payoutTruth === true) {
    blockingReasons.push('PAYOUT_TRUTH_INPUT_NOT_ALLOWED_FOR_CANDIDATE_CONTRACT');
  }

  if (careerMonth === null) {
    blockingReasons.push('CAREER_MONTH_REQUIRED_1_TO_36');
  }

  const monthlySupportAmount = getPcv2026FixedSupportMonthlyAmountForCareerMonth(careerMonth);
  const initialCommissionGoal = getPcv2026FixedSupportInitialCommissionGoalForCareerMonth(careerMonth);
  const trainingAdvisorTarget = getPcv2026FixedSupportTrainingAdvisorTargetForCareerMonth(careerMonth);

  if (careerMonth !== null && monthlySupportAmount === null) {
    blockingReasons.push('MONTHLY_SUPPORT_AMOUNT_NOT_FOUND');
  }

  if (careerMonth !== null && initialCommissionGoal === null) {
    blockingReasons.push('INITIAL_COMMISSION_GOAL_NOT_FOUND');
  }

  if (careerMonth !== null && trainingAdvisorTarget === null) {
    blockingReasons.push('TRAINING_ADVISOR_TARGET_NOT_FOUND');
  }

  return {
    concept: 'fixed-support',
    status: blockingReasons.length === 0 ? 'CONTRACT_TABLES_AVAILABLE' : 'BLOCKED_OR_UNKNOWN',
    readyForCandidateCalculator: blockingReasons.length === 0,
    calculationPerformed: false,
    candidateAmount: null,
    payoutTruth: false,
    careerMonth,
    semester: getPcv2026FixedSupportSemesterForCareerMonth(careerMonth),
    monthlySupportAmount,
    initialCommissionGoal,
    trainingAdvisorTarget,
    firstTwoHiresExclusion: PCV_2026_FIXED_SUPPORT_FIRST_TWO_HIRES_EXCLUSION,
    complianceRules: PCV_2026_FIXED_SUPPORT_COMPLIANCE_RULES,
    blockingReasons,
  };
}
