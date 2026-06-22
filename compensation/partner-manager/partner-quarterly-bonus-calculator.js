import {
  ADVISOR_ECONOMIC_OUTPUT_STATUSES,
  createAdvisorEconomicOutput,
} from './advisor-economic-output.js';

import {
  QUALIFIED_ADVISOR_ECONOMIC_STATUSES,
  evaluateQualifiedAdvisorEconomicStatus,
} from './qualified-advisor-economic-status.js';

import {
  loadPartner2026RulePack,
} from './partner-2026-rule-pack-loader.js';

import {
  calculatePartnerActivityBonusCandidate,
} from './partner-activity-bonus-calculator.js';

import {
  calculatePartnerFixedSupportCandidate,
} from './partner-fixed-support-calculator.js';

import {
  gatePartnerConnectionBonusCalculation,
  gatePartnerDevelopmentBonusCalculation,
} from './partner-partial-bonus-calculation-gate.js';

import {
  calculatePartnerProductionBonusCandidate,
} from './partner-production-bonus-calculator.js';

import {
  calculatePartnerProductivityBaseCandidate,
} from './partner-productivity-base-calculator.js';

import {
  calculatePartnerProductivityMultiplierCandidate,
} from './partner-productivity-multiplier-calculator.js';

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function sumNumbers(values) {
  const numeric = values.filter(hasNumber).map(Number);
  return numeric.length > 0 ? numeric.reduce((total, value) => total + value, 0) : null;
}

function quarterAverage(value) {
  return hasNumber(value) ? Number(value) / 3 : null;
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value);
  const normalized = raw.length === 7 ? `${raw}-01` : raw.slice(0, 10);
  const date = new Date(`${normalized}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function addMonths(date, count) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));
}

function monthsBetweenInclusive(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return [];
  const months = [];
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cursor <= last) {
    months.push({ key: monthKey(cursor), date: new Date(cursor) });
    cursor = addMonths(cursor, 1);
  }
  return months;
}

function resolvePeriodMonths(period = {}) {
  if (Array.isArray(period.months) && period.months.length > 0) {
    return period.months.map((month) => {
      const date = parseDate(`${month}-01`);
      return date ? { key: month, date } : null;
    }).filter(Boolean);
  }
  if (period.startDate && period.endDate) return monthsBetweenInclusive(period.startDate, period.endDate);
  if (period.year && period.quarter) {
    const quarterNumber = Number(String(period.quarter).replace('Q', ''));
    if (quarterNumber >= 1 && quarterNumber <= 4) {
      const startMonth = (quarterNumber - 1) * 3;
      const start = new Date(Date.UTC(Number(period.year), startMonth, 1));
      const end = new Date(Date.UTC(Number(period.year), startMonth + 2, 1));
      return monthsBetweenInclusive(monthKey(start), monthKey(end));
    }
  }
  return [];
}

function careerMonthAt(connectionDate, targetDate) {
  const start = parseDate(connectionDate);
  const target = parseDate(targetDate);
  if (!start || !target) return null;
  const diff = (target.getUTCFullYear() - start.getUTCFullYear()) * 12 + target.getUTCMonth() - start.getUTCMonth();
  return diff >= 0 ? diff + 1 : null;
}

function sumCommissionBucket(initialCommissions = {}) {
  return sumNumbers([
    initialCommissions.vidaIndividual,
    initialCommissions.gmmiIndividual,
    initialCommissions.otherRamos,
  ]) ?? 0;
}

function policyCountingFactor(rulePack, conceptKey) {
  const factor = rulePack?.concepts?.[conceptKey]?.policyCounting?.lifePlusIndividualGMMICountsAs;
  return hasNumber(factor) ? Number(factor) : 1;
}

function monthlyPolicyCount(fact = {}, gmmiFactor = 1) {
  const paidPolicies = fact.paidPolicies || {};
  return Number(paidPolicies.vidaIndividual || 0) + (Number(paidPolicies.gmmiIndividual || 0) * Number(gmmiFactor));
}

function normalizeMonthlyFacts(advisor = {}, periodMonths = [], rulePack) {
  const factsByMonth = new Map((advisor.monthlyFacts || []).map((fact) => [fact.month, fact]));
  const activityGmmiFactor = policyCountingFactor(rulePack, 'activity-bonus');
  const partialGmmiFactor = policyCountingFactor(rulePack, 'connection-bonus');
  const facts = periodMonths.map((month) => {
    const fact = factsByMonth.get(month.key) || {};
    const initialCommissions = fact.initialCommissions || {};
    return {
      month: month.key,
      initialCommissionsAllRamos: sumCommissionBucket(initialCommissions),
      lifeIndividualInitialCommissions: Number(initialCommissions.vidaIndividual || 0),
      lifeAndGmmiInitialCommissions: Number(initialCommissions.vidaIndividual || 0) + Number(initialCommissions.gmmiIndividual || 0),
      activityMonthlyPolicies: monthlyPolicyCount(fact, activityGmmiFactor),
      partialMonthlyPolicies: monthlyPolicyCount(fact, partialGmmiFactor),
    };
  });
  return {
    facts,
    quarterInitialCommissionsAllRamos: sumNumbers(facts.map((fact) => fact.initialCommissionsAllRamos)),
    lifeIndividualInitialCommissions: sumNumbers(facts.map((fact) => fact.lifeIndividualInitialCommissions)),
    qualifiedAdvisorInitialCommissionsLifeIndividualAndGmmi: sumNumbers(facts.map((fact) => fact.lifeAndGmmiInitialCommissions)),
    quarterPolicyTotal: sumNumbers(facts.map((fact) => fact.activityMonthlyPolicies)),
    monthlyAveragePolicies: periodMonths.length > 0
      ? (sumNumbers(facts.map((fact) => fact.activityMonthlyPolicies)) ?? 0) / periodMonths.length
      : null,
  };
}

function normalizePartnerQuarterlyInput({ partner = {}, advisors = [], period = {}, evidence = {} } = {}, rulePack) {
  const periodMonths = resolvePeriodMonths(period);
  const periodStartMonth = periodMonths[0]?.date || null;
  const periodEndMonth = periodMonths[periodMonths.length - 1]?.date || null;
  const normalizedPartner = {
    ...partner,
    partnerCareerMonthAtPeriodStart: partner.partnerCareerMonthAtPeriodStart ?? careerMonthAt(partner.connectionDate, periodStartMonth),
    partnerCareerMonthAtPeriodEnd: partner.partnerCareerMonthAtPeriodEnd ?? careerMonthAt(partner.connectionDate, periodEndMonth),
  };
  normalizedPartner.partnerCareerMonth = partner.partnerCareerMonth ?? normalizedPartner.partnerCareerMonthAtPeriodEnd;
  normalizedPartner.partnerConnectedYear = partner.partnerConnectedYear ?? parseDate(partner.connectionDate)?.getUTCFullYear();

  const normalizedAdvisors = advisors.map((advisor) => {
    if (!Array.isArray(advisor.monthlyFacts) || advisor.monthlyFacts.length === 0) return advisor;
    const advisorStartDate = advisor.connectionDate || advisor.contestDate;
    const monthly = normalizeMonthlyFacts(advisor, periodMonths, rulePack);
    const quarterInitialCommissions = monthly.quarterInitialCommissionsAllRamos;
    const lifeIndividualInitialCommissions = monthly.lifeIndividualInitialCommissions;
    const advisorCareerMonthAtPeriodEnd = careerMonthAt(advisorStartDate, periodEndMonth);
    return {
      ...advisor,
      advisorCareerMonthAtPeriodStart: advisor.advisorCareerMonthAtPeriodStart ?? careerMonthAt(advisorStartDate, periodStartMonth),
      advisorCareerMonthAtPeriodEnd: advisor.advisorCareerMonthAtPeriodEnd ?? advisorCareerMonthAtPeriodEnd,
      advisorMonth: advisor.advisorMonth ?? advisorCareerMonthAtPeriodEnd,
      quarterInitialCommissions: quarterInitialCommissions ?? advisor.quarterInitialCommissions,
      quarterInitialCommissionsAllRamos: quarterInitialCommissions ?? advisor.quarterInitialCommissionsAllRamos,
      lifeIndividualInitialCommissions: advisor.lifeIndividualInitialCommissions ?? lifeIndividualInitialCommissions,
      lifeIndividualShare: advisor.lifeIndividualShare ?? (
        hasNumber(lifeIndividualInitialCommissions) && hasNumber(quarterInitialCommissions) && Number(quarterInitialCommissions) > 0
          ? Number(lifeIndividualInitialCommissions) / Number(quarterInitialCommissions)
          : null
      ),
      qualifiedAdvisorInitialCommissionsLifeIndividualAndGmmi: advisor.qualifiedAdvisorInitialCommissionsLifeIndividualAndGmmi ?? monthly.qualifiedAdvisorInitialCommissionsLifeIndividualAndGmmi,
      monthlyPolicies: advisor.monthlyPolicies ?? monthly.facts[monthly.facts.length - 1]?.partialMonthlyPolicies,
      quarterPolicyTotal: monthly.quarterPolicyTotal ?? advisor.quarterPolicyTotal,
      monthlyAveragePolicies: monthly.monthlyAveragePolicies ?? advisor.monthlyAveragePolicies,
      paidAppliedPolicyEvidence: advisor.paidAppliedPolicyEvidence ?? true,
      activeAtQuarterClose: advisor.activeAtQuarterClose ?? advisor.active !== false,
      advisorActiveStatus: advisor.advisorActiveStatus ?? (advisor.active === false ? null : 'active'),
      LIMRA: advisor.LIMRA ?? advisor.indexes?.LIMRA,
      IGC: advisor.IGC ?? advisor.indexes?.IGC,
      metadata: {
        ...(advisor.metadata || {}),
        normalizedMonthlyFacts: monthly.facts,
      },
    };
  });

  return {
    partner: normalizedPartner,
    advisors: normalizedAdvisors,
    period: {
      ...period,
      months: period.months || periodMonths.map((month) => month.key),
    },
    evidence,
    metadata: { periodMonths },
  };
}

function validOutput(advisor) {
  return createAdvisorEconomicOutput({
    advisorId: advisor.advisorId || advisor.name || 'advisor',
    initialCommissions: advisor.quarterInitialCommissions,
    economicStatus: advisor.economicStatus || ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
  });
}

function collectBlockedConcepts(concepts) {
  return Object.entries(concepts)
    .filter(([, result]) => (result?.blockedReasons || []).length > 0 || (result?.missingInputs || []).length > 0)
    .map(([conceptKey, result]) => ({
      conceptKey,
      blockedReasons: result.blockedReasons || [],
      missingInputs: result.missingInputs || [],
    }));
}

function calculatedAmount(result) {
  return hasNumber(result?.candidateAmount) ? Number(result.candidateAmount) : null;
}

function sourceRulePackFileName(rulePack) {
  const sourceRulePackFile = rulePack?.sourceRulePackFile;
  if (sourceRulePackFile) {
    return String(sourceRulePackFile).split('/').pop();
  }
  return 'smnyl_partner_compensation_2026_rules_official_v1.json';
}

function inferTrainingWinnerInQuarter({ advisors = [], evidence = {} } = {}) {
  if (evidence.trainingWinnerInQuarter === true || evidence.taCountingEventEvidence === true) {
    return {
      trainingWinnerInQuarter: true,
      source: 'explicit_evidence',
      warnings: [],
    };
  }
  if (evidence.trainingWinnerInQuarter === false) {
    return {
      trainingWinnerInQuarter: false,
      source: 'explicit_evidence',
      warnings: [],
    };
  }

  const trainingEvent = (evidence.trainingAllowanceEvents || []).find((event) => (
    (event.wonTrainingAllowanceFirstTimeInQuarter === true || event.inQuarter === true) &&
    event.activeAtPeriodClose !== false &&
    event.activeGroup2 !== false
  ));

  if (trainingEvent) {
    return {
      trainingWinnerInQuarter: true,
      source: 'training_allowance_event_evidence',
      advisorId: trainingEvent.advisorId || null,
      warnings: [],
    };
  }

  const inferredAdvisor = advisors.find((advisor) => (
    Number(advisor.advisorMonth) >= 1 &&
    Number(advisor.advisorMonth) <= 12 &&
    advisor.wonTrainingAllowanceFirstTimeInQuarter === true &&
    advisor.activeAtQuarterClose === true
  ));

  if (inferredAdvisor) {
    return {
      trainingWinnerInQuarter: true,
      source: 'advisor_training_winner_evidence',
      advisorId: inferredAdvisor.advisorId || inferredAdvisor.name || null,
      warnings: [],
    };
  }

  return {
    trainingWinnerInQuarter: null,
    source: 'unknown',
    warnings: ['training_winner_not_inferred_from_advisor_month_only'],
  };
}

function inferTrainingWinnerCountLastSixMonths({ advisors = [], evidence = {}, periodEndDate = null } = {}) {
  if (hasNumber(evidence.trainingWinnerActualCountLastSixMonths)) {
    return Number(evidence.trainingWinnerActualCountLastSixMonths);
  }
  if (Array.isArray(evidence.trainingAllowanceEvents) && evidence.trainingAllowanceEvents.length > 0) {
    const end = parseDate(periodEndDate);
    const windowStart = end ? addMonths(end, -5) : null;
    return evidence.trainingAllowanceEvents.filter((event) => {
      const eventDate = parseDate(event.date || event.firstWonDate || event.trainingAllowanceDate);
      if (end && eventDate && (eventDate < windowStart || eventDate > end)) return false;
      if (event.activeGroup2 === false || event.activeAtPeriodClose === false) return false;
      if (hasNumber(event.unitOnboardingSequence) && Number(event.unitOnboardingSequence) <= 2) return false;
      return event.countsForSupport !== false;
    }).length;
  }
  const winnerEvidenceAdvisors = advisors.filter((advisor) => (
    advisor.wonTrainingAllowanceFirstTimeInLastSixMonths === true ||
    advisor.wonTrainingAllowanceFirstTimeInQuarter === true
  ));
  if (winnerEvidenceAdvisors.length === 0) return null;
  const winners = winnerEvidenceAdvisors.filter((advisor) => (
    advisor.activeGroup2 === true &&
    Number(advisor.advisorMonth) <= 12 &&
    Number(advisor.unitOnboardingSequence || 999) > 2
  ));
  return winners.length;
}

function buildQuarterlyPaymentSchedule({ concepts, rulePack }) {
  const monthlyAdvances = [];
  const monthlyPayments = [];
  const eventBasedPayments = [];
  const quarterEndPayments = [];
  const blockedPayments = [];
  const warnings = [];

  for (const [conceptKey, result] of Object.entries(concepts)) {
    const amount = calculatedAmount(result);
    const cadence = rulePack.concepts?.[conceptKey]?.paymentCadence || {};
    if (!hasNumber(amount)) {
      blockedPayments.push({
        conceptKey,
        blockedReasons: result?.blockedReasons || [],
        missingInputs: result?.missingInputs || [],
      });
      continue;
    }

    if (cadence.paymentFrequency === 'monthly' && Number(cadence.paymentDurationMonths) === 3) {
      monthlyPayments.push({
        conceptKey,
        months: 3,
        monthlyAmount: amount / 3,
        totalAmount: amount,
        settlementTiming: cadence.settlementTiming,
      });
    } else if (cadence.paymentFrequency === 'monthly') {
      monthlyAdvances.push({
        conceptKey,
        amount,
        settlementTiming: cadence.settlementTiming,
      });
    } else if (String(cadence.paymentFrequency || '').includes('one_time')) {
      eventBasedPayments.push({
        conceptKey,
        amount,
        settlementTiming: cadence.settlementTiming,
      });
    } else {
      quarterEndPayments.push({
        conceptKey,
        amount,
        settlementTiming: cadence.settlementTiming || null,
      });
      warnings.push(`unknown_payment_cadence:${conceptKey}`);
    }
  }

  const totalQuarterPayableCandidate = sumNumbers(Object.values(concepts).map(calculatedAmount));
  return {
    monthlyAdvances,
    monthlyPayments,
    eventBasedPayments,
    quarterEndPayments,
    blockedPayments,
    totalQuarterPayableCandidate,
    averageMonthlyCashflowCandidate: hasNumber(totalQuarterPayableCandidate) ? totalQuarterPayableCandidate / 3 : null,
    warnings,
  };
}

export function calculatePartnerQuarterlyBonusCandidate({
  partner = {},
  advisors = [],
  period = {},
  evidence = {},
  rulePack = null,
} = {}) {
  const activeRulePack = rulePack || loadPartner2026RulePack();
  const normalizedInput = normalizePartnerQuarterlyInput({ partner, advisors, period, evidence }, activeRulePack);
  partner = normalizedInput.partner;
  advisors = normalizedInput.advisors;
  period = normalizedInput.period;
  evidence = normalizedInput.evidence;
  const warnings = [];
  const missingInputs = [];
  const periodMonths = normalizedInput.metadata.periodMonths;

  const qualifiedAdvisorResults = advisors.map((advisor) => {
    const averageMonthlyInitialCommissions = hasNumber(advisor.averageMonthlyInitialCommissions)
      ? Number(advisor.averageMonthlyInitialCommissions)
      : quarterAverage(advisor.quarterInitialCommissions);
    return evaluateQualifiedAdvisorEconomicStatus({
      rulePack: activeRulePack,
      advisorId: advisor.advisorId || advisor.name,
      averageMonthlyInitialCommissions,
      lifeIndividualShare: advisor.lifeIndividualShare,
      lifeIndividualInitialCommissions: advisor.lifeIndividualInitialCommissions,
      quarterInitialCommissions: advisor.quarterInitialCommissions,
      LIMRA: advisor.LIMRA,
      IGC: advisor.IGC,
      lifecycleStatus: advisor.lifecycleStatus || (advisor.activeAtQuarterClose ? 'connected_active' : 'unknown'),
      lifecycleGateAllowed: advisor.lifecycleGateAllowed ?? advisor.activeAtQuarterClose === true,
      advisorActiveStatus: advisor.advisorActiveStatus || (advisor.activeAtQuarterClose ? 'active' : null),
      careerMonth: advisor.advisorMonth,
      economicOutputStatus: advisor.economicStatus || ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
    });
  });
  const qualifiedAdvisors = advisors.filter((_, index) => qualifiedAdvisorResults[index].qualified === true);
  const nonQualifiedActiveAdvisors = advisors.filter((advisor, index) => (
    qualifiedAdvisorResults[index].qualified !== true &&
    (advisor.activeAtQuarterClose === true || advisor.advisorActiveStatus === 'active')
  ));

  const productivityBaseParts = qualifiedAdvisors.map((advisor, index) => {
    const originalIndex = advisors.indexOf(advisor);
    const averageMonthlyInitialCommissions = qualifiedAdvisorResults[originalIndex].averageMonthlyInitialCommissions;
    return calculatePartnerProductivityBaseCandidate({
      rulePack: activeRulePack,
      advisorEconomicOutputs: [validOutput(advisor)],
      qualifiedAdvisorEconomicStatuses: [qualifiedAdvisorResults[originalIndex]],
      averageMonthlyInitialCommissions,
      advisorCareerMonth: advisor.advisorMonth,
      lifecycleGate: { allowed: true },
      baseAmount: advisor.quarterInitialCommissions,
    });
  });
  const productivityBaseAmount = sumNumbers(productivityBaseParts.map((part) => part.candidateAmount));
  const productivityBase = {
    conceptKey: 'productivity-base',
    status: hasNumber(productivityBaseAmount) ? 'calculated_candidate' : 'blocked_by_missing_economic_input',
    candidateAmount: productivityBaseAmount,
    payoutTruth: false,
    blockedReasons: productivityBaseParts.flatMap((part) => part.blockedReasons || []),
    missingInputs: productivityBaseParts.flatMap((part) => part.missingInputs || []),
    warnings: productivityBaseParts.flatMap((part) => part.warnings || []),
    metadata: { parts: productivityBaseParts },
  };

  const trainingWinnerInference = inferTrainingWinnerInQuarter({ advisors, evidence });
  warnings.push(...trainingWinnerInference.warnings);
  const productivityMultiplier = calculatePartnerProductivityMultiplierCandidate({
    rulePack: activeRulePack,
    productivityBaseCandidate: productivityBaseAmount,
    qualifiedAdvisorCount: qualifiedAdvisors.length,
    partnerCareerMonth: partner.partnerCareerMonth,
    partnerConnectedYear: partner.partnerConnectedYear,
    trainingWinnerInQuarter: trainingWinnerInference.trainingWinnerInQuarter,
  });

  const productionBaseAmount = sumNumbers(nonQualifiedActiveAdvisors.map((advisor) => advisor.quarterInitialCommissions));
  const production = calculatePartnerProductionBonusCandidate({
    rulePack: activeRulePack,
    nonQualifiedAdvisorEconomicOutput: nonQualifiedActiveAdvisors.length > 0 ? validOutput(nonQualifiedActiveAdvisors[0]) : null,
    organizationType: partner.organizationType,
    unitLIMRA: partner.unitLIMRA,
    unitIGC: partner.unitIGC,
    paidAppliedEconomicEvidence: evidence.paidAppliedEconomicEvidence !== false,
    validEconomicBaseAmount: productionBaseAmount,
  });

  const activityParts = qualifiedAdvisors.map((advisor) => {
    const originalIndex = advisors.indexOf(advisor);
    return calculatePartnerActivityBonusCandidate({
      rulePack: activeRulePack,
      qualifiedAdvisorStatus: qualifiedAdvisorResults[originalIndex],
      advisorCareerMonth: advisor.advisorMonth,
      monthlyAveragePolicies: advisor.monthlyAveragePolicies,
      quarterPolicyTotal: advisor.quarterPolicyTotal,
      paidAppliedPolicyEvidence: advisor.paidAppliedPolicyEvidence === true,
      economicBasisAmount: advisor.qualifiedAdvisorInitialCommissionsLifeIndividualAndGmmi,
      period,
    });
  });
  const activityAmount = sumNumbers(activityParts.map((part) => part.candidateAmount));
  const activity = {
    conceptKey: 'activity-bonus',
    status: hasNumber(activityAmount) ? 'calculated_candidate' : 'blocked_by_missing_economic_input',
    candidateAmount: activityAmount,
    payoutTruth: false,
    blockedReasons: activityParts.flatMap((part) => part.blockedReasons || []),
    missingInputs: activityParts.flatMap((part) => part.missingInputs || []),
    warnings: activityParts.flatMap((part) => part.warnings || []),
    metadata: { parts: activityParts },
  };

  const connectionParts = advisors.flatMap((advisor) => {
    if ((advisor.connectionDate || advisor.contestDate) && advisor.metadata?.normalizedMonthlyFacts && periodMonths.length > 0) {
      return periodMonths
        .map((month) => {
          const advisorMonth = careerMonthAt(advisor.connectionDate || advisor.contestDate, month.date);
          const monthFact = advisor.metadata.normalizedMonthlyFacts.find((fact) => fact.month === month.key);
          if (![1, 2, 3].includes(Number(advisorMonth))) return null;
          const result = gatePartnerConnectionBonusCalculation({
            rulePack: activeRulePack,
            onboardingEvidence: advisor.onboardingEvidence === true || Number(advisorMonth) === 1,
            advisorMonth,
            monthlyPolicies: monthFact?.partialMonthlyPolicies,
            paidAppliedPolicyEvidence: advisor.paidAppliedPolicyEvidence === true,
            connectorActiveAtMonthClose: partner.active === true,
            connectedAdvisorActiveAtMonthClose: advisor.activeAtQuarterClose === true,
          });
          return {
            ...result,
            metadata: {
              ...result.metadata,
              advisorId: advisor.advisorId || advisor.name || null,
              month: month.key,
              advisorMonth,
            },
          };
        })
        .filter(Boolean);
    }
    if (![1, 2, 3].includes(Number(advisor.advisorMonth))) return [];
    return [gatePartnerConnectionBonusCalculation({
      rulePack: activeRulePack,
      onboardingEvidence: advisor.onboardingEvidence === true,
      advisorMonth: advisor.advisorMonth,
      monthlyPolicies: advisor.monthlyPolicies,
      quarterPolicyTotal: advisor.quarterPolicyTotal,
      paidAppliedPolicyEvidence: advisor.paidAppliedPolicyEvidence === true,
      connectorActiveAtMonthClose: partner.active === true,
      connectedAdvisorActiveAtMonthClose: advisor.activeAtMonthClose === true,
    })];
  });
  const connectionAmount = sumNumbers(connectionParts.map((part) => part.candidateAmount));
  const connection = {
    conceptKey: 'connection-bonus',
    status: hasNumber(connectionAmount) ? 'calculated_candidate' : 'blocked_by_missing_evidence',
    candidateAmount: connectionAmount,
    payoutTruth: false,
    blockedReasons: connectionParts.flatMap((part) => part.blockedReasons || []),
    missingInputs: connectionParts.flatMap((part) => part.missingInputs || []),
    warnings: connectionParts.flatMap((part) => part.warnings || []),
    metadata: { parts: connectionParts },
  };

  const developmentParts = advisors.flatMap((advisor) => {
    if ((advisor.connectionDate || advisor.contestDate) && advisor.metadata?.normalizedMonthlyFacts && periodMonths.length > 0) {
      return periodMonths
        .map((month) => {
          const advisorMonth = careerMonthAt(advisor.connectionDate || advisor.contestDate, month.date);
          const monthFact = advisor.metadata.normalizedMonthlyFacts.find((fact) => fact.month === month.key);
          if (Number(advisorMonth) < 4 || Number(advisorMonth) > 15) return null;
          const result = gatePartnerDevelopmentBonusCalculation({
            rulePack: activeRulePack,
            advisorMonth,
            monthlyPolicies: monthFact?.partialMonthlyPolicies,
            paidAppliedPolicyEvidence: advisor.paidAppliedPolicyEvidence === true,
            developerCount: advisor.developerCount || 1,
            developerEligibilityEvidence: advisor.developerEligibilityEvidence !== false,
          });
          return {
            ...result,
            metadata: {
              ...result.metadata,
              advisorId: advisor.advisorId || advisor.name || null,
              month: month.key,
              advisorMonth,
            },
          };
        })
        .filter(Boolean);
    }
    if (Number(advisor.advisorMonth) < 4 || Number(advisor.advisorMonth) > 15) return [];
    return [gatePartnerDevelopmentBonusCalculation({
      rulePack: activeRulePack,
      advisorMonth: advisor.advisorMonth,
      monthlyPolicies: advisor.monthlyPolicies,
      quarterPolicyTotal: advisor.quarterPolicyTotal,
      paidAppliedPolicyEvidence: advisor.paidAppliedPolicyEvidence === true,
      developerCount: advisor.developerCount || 1,
      developerEligibilityEvidence: advisor.developerEligibilityEvidence === true,
    })];
  });
  const developmentAmount = sumNumbers(developmentParts.map((part) => part.candidateAmount));
  const development = {
    conceptKey: 'development-bonus',
    status: hasNumber(developmentAmount) ? 'calculated_candidate' : 'blocked_by_missing_evidence',
    candidateAmount: developmentAmount,
    payoutTruth: false,
    blockedReasons: developmentParts.flatMap((part) => part.blockedReasons || []),
    missingInputs: developmentParts.flatMap((part) => part.missingInputs || []),
    warnings: developmentParts.flatMap((part) => part.warnings || []),
    metadata: { parts: developmentParts },
  };

  const inferredTrainingWinnerCount = inferTrainingWinnerCountLastSixMonths({
    advisors,
    evidence,
    periodEndDate: periodMonths[periodMonths.length - 1]?.date,
  });
  const supportActualByMonth = evidence.supportAccumulatedCommissionActualByMonth || {};
  const supportParts = periodMonths.length > 0 && partner.connectionDate
    ? periodMonths.map((month) => {
      const partnerCareerMonth = careerMonthAt(partner.connectionDate, month.date);
      const actual = supportActualByMonth[month.key] ?? evidence.accumulatedCommissionActualLifeIndividualAndGmmi;
      return {
        month: month.key,
        partnerCareerMonth,
        result: calculatePartnerFixedSupportCandidate({
          rulePack: activeRulePack,
          partnerCareerMonth,
          accumulatedCommissionActualLifeIndividualAndGmmi: actual,
          accumulatedCommissionGoalsEvidence: hasNumber(actual),
          trainingWinnerActualCountLastSixMonths: inferredTrainingWinnerCount,
          partnerLifecycleStatus: partner.active === true ? 'partner_active' : 'inactive',
          supportTableEvidenceRequired: false,
        }),
      };
    })
    : null;
  const fixedSupportSingle = calculatePartnerFixedSupportCandidate({
    rulePack: activeRulePack,
    partnerCareerMonth: partner.partnerCareerMonth,
    accumulatedCommissionActualLifeIndividualAndGmmi: evidence.accumulatedCommissionActualLifeIndividualAndGmmi,
    accumulatedCommissionGoalsEvidence: hasNumber(evidence.accumulatedCommissionActualLifeIndividualAndGmmi),
    trainingWinnerActualCountLastSixMonths: inferredTrainingWinnerCount,
    partnerLifecycleStatus: partner.active === true ? 'partner_active' : 'inactive',
    supportTableEvidenceRequired: false,
  });
  const fixedSupport = supportParts
    ? {
      conceptKey: 'fixed-support',
      status: supportParts.some((part) => (part.result.blockedReasons || []).length > 0 || (part.result.missingInputs || []).length > 0)
        ? 'partial_candidate_with_blocked_months'
        : 'calculated_candidate',
      candidateAmount: sumNumbers(supportParts.map((part) => calculatedAmount(part.result))),
      payoutTruth: false,
      blockedReasons: supportParts.flatMap((part) => part.result.blockedReasons || []),
      missingInputs: supportParts.flatMap((part) => part.result.missingInputs || []),
      warnings: supportParts.flatMap((part) => part.result.warnings || []),
      metadata: {
        parts: supportParts,
      },
    }
    : fixedSupportSingle;

  const concepts = {
    productivityBase,
    productivityMultiplier,
    production,
    activity,
    development,
    connection,
    fixedSupport,
  };
  const blockedConcepts = collectBlockedConcepts(concepts);
  const totalQuarterCandidateExcludingBlocked = sumNumbers(Object.values(concepts).map(calculatedAmount));
  const paymentSchedule = buildQuarterlyPaymentSchedule({ concepts, rulePack: activeRulePack });
  const allMissingInputs = [
    ...missingInputs,
    ...Object.values(concepts).flatMap((concept) => concept.missingInputs || []),
  ];
  const allWarnings = [
    ...warnings,
    ...Object.values(concepts).flatMap((concept) => concept.warnings || []),
    ...paymentSchedule.warnings,
  ];

  return {
    status: blockedConcepts.length > 0 ? 'partial_candidate_with_blocked_concepts' : 'calculated_candidate',
    payoutTruth: false,
    rulePackId: activeRulePack.rulePackId,
    sourceRulePackFile: sourceRulePackFileName(activeRulePack),
    partner,
    period,
    qualificationSummary: {
      qualifiedAdvisorCount: qualifiedAdvisors.length,
      nonQualifiedActiveAdvisorCount: nonQualifiedActiveAdvisors.length,
      advisors: qualifiedAdvisorResults,
      normalizedAdvisors: advisors,
    },
    trainingWinnerInference,
    concepts,
    paymentSchedule,
    totals: {
      totalQuarterCandidateExcludingBlocked,
      monthlyAverageCandidateExcludingBlocked: hasNumber(totalQuarterCandidateExcludingBlocked) ? totalQuarterCandidateExcludingBlocked / 3 : null,
      totalQuarterBlockedReasons: blockedConcepts.flatMap((concept) => concept.blockedReasons),
      excludedConcepts: blockedConcepts.map((concept) => concept.conceptKey),
    },
    warnings: [...new Set(allWarnings)],
    missingInputs: [...new Set(allMissingInputs)],
  };
}
