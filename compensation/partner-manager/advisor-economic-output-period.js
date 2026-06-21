import {
  ADVISOR_ECONOMIC_OUTPUT_STATUSES,
} from './advisor-economic-output.js';

export const ADVISOR_ECONOMIC_PERIOD_TYPES = Object.freeze({
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  SEMESTER: 'semester',
  ANNUAL: 'annual',
  CUSTOM: 'custom',
  UNKNOWN: 'unknown',
});

export const ADVISOR_ECONOMIC_PERIOD_STATES = Object.freeze({
  READY: 'ready',
  BLOCKED: 'blocked',
  UNKNOWN: 'unknown',
});

export const ADVISOR_ECONOMIC_PERIOD_REASONS = Object.freeze({
  INVALID_PERIOD: 'blocked_by_invalid_period',
  MISSING_INITIAL_COMMISSIONS: 'blocked_by_missing_initial_commissions',
});

const CONFIRMED_INITIAL_STATUSES = new Set([
  ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAID_APPLIED_CONFIRMED,
  ADVISOR_ECONOMIC_OUTPUT_STATUSES.CARRIER_CALCULATED,
  ADVISOR_ECONOMIC_OUTPUT_STATUSES.PAYOUT_CONFIRMED,
]);

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}`.includes('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizePeriodType(periodType) {
  return Object.values(ADVISOR_ECONOMIC_PERIOD_TYPES).includes(periodType)
    ? periodType
    : ADVISOR_ECONOMIC_PERIOD_TYPES.UNKNOWN;
}

function monthDiff(start, end) {
  return ((end.getFullYear() - start.getFullYear()) * 12) + end.getMonth() - start.getMonth() + 1;
}

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function sumValues(values) {
  return values.reduce((total, value) => total + Number(value), 0);
}

export function createAdvisorEconomicOutputPeriod({
  periodType = ADVISOR_ECONOMIC_PERIOD_TYPES.UNKNOWN,
  periodStart = null,
  periodEnd = null,
  monthCount = null,
  advisorOutputs = [],
  accumulatedCommissions = null,
  paidAppliedPolicyCount = null,
  blockedReasons = [],
  warnings = [],
} = {}) {
  const safePeriodType = normalizePeriodType(periodType);
  const start = parseDate(periodStart);
  const end = parseDate(periodEnd);
  const reasons = [...blockedReasons];
  let safeMonthCount = hasNumber(monthCount) ? Number(monthCount) : null;

  if (!safeMonthCount && start && end && end >= start) {
    safeMonthCount = monthDiff(start, end);
  }

  if (!safeMonthCount || safeMonthCount <= 0 || (start && end && end < start)) {
    reasons.push(ADVISOR_ECONOMIC_PERIOD_REASONS.INVALID_PERIOD);
  }

  const confirmedInitialValues = advisorOutputs
    .filter((output) => CONFIRMED_INITIAL_STATUSES.has(output.economicStatus))
    .map((output) => output.initialCommissions)
    .filter(hasNumber);

  if (confirmedInitialValues.length === 0) {
    reasons.push(ADVISOR_ECONOMIC_PERIOD_REASONS.MISSING_INITIAL_COMMISSIONS);
  }

  const initialTotal = confirmedInitialValues.length > 0 ? sumValues(confirmedInitialValues) : null;
  const averageMonthlyInitialCommissions = (
    reasons.length === 0 && initialTotal !== null
      ? initialTotal / safeMonthCount
      : null
  );

  const safeAccumulated = hasNumber(accumulatedCommissions)
    ? Number(accumulatedCommissions)
    : (
      advisorOutputs.some((output) => hasNumber(output.totalCommissions))
        ? sumValues(advisorOutputs.map((output) => output.totalCommissions).filter(hasNumber))
        : null
    );

  return {
    periodType: safePeriodType,
    periodStart,
    periodEnd,
    monthCount: safeMonthCount,
    averageMonthlyInitialCommissions,
    accumulatedCommissions: reasons.includes(ADVISOR_ECONOMIC_PERIOD_REASONS.MISSING_INITIAL_COMMISSIONS)
      ? safeAccumulated
      : safeAccumulated,
    paidAppliedPolicyCount: hasNumber(paidAppliedPolicyCount)
      ? Number(paidAppliedPolicyCount)
      : sumValues(advisorOutputs.map((output) => output.paidAppliedPolicyCount).filter(hasNumber)),
    blockedReasons: reasons,
    warnings: [...warnings],
    state: reasons.length > 0
      ? ADVISOR_ECONOMIC_PERIOD_STATES.BLOCKED
      : ADVISOR_ECONOMIC_PERIOD_STATES.READY,
    renewalCommissionsIncludedInInitialAverage: false,
    unknownIsZero: false,
  };
}
