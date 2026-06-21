import {
  ADVISOR_ECONOMIC_OUTPUT_STATUSES,
} from './advisor-economic-output.js';

import {
  QUALIFIED_ADVISOR_ECONOMIC_STATUSES,
} from './qualified-advisor-economic-status.js';

export const TEAM_ECONOMIC_OUTPUT_STATUSES = Object.freeze({
  TEAM_OUTPUT_CONFIRMED: 'team_output_confirmed',
  TEAM_OUTPUT_PARTIAL: 'team_output_partial',
  TEAM_OUTPUT_UNKNOWN: 'team_output_unknown',
  BLOCKED_BY_SCOPE: 'blocked_by_scope',
  BLOCKED_BY_MISSING_ADVISOR_OUTPUTS: 'blocked_by_missing_advisor_outputs',
  BLOCKED_BY_HELD_PRECONTRACT_COMMISSION: 'blocked_by_held_precontract_commission',
});

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function sumValues(values) {
  return values.reduce((total, value) => total + Number(value), 0);
}

function canSumOutput(output = {}) {
  return (
    output.hiddenByScope !== true &&
    output.heldPrecontractCommission !== true &&
    output.economicStatus !== ADVISOR_ECONOMIC_OUTPUT_STATUSES.UNKNOWN &&
    output.economicStatus !== ADVISOR_ECONOMIC_OUTPUT_STATUSES.BLOCKED &&
    hasNumber(output.totalCommissions)
  );
}

export function createTeamEconomicOutput({
  partnerId = null,
  period = null,
  advisorOutputs = [],
  qualifiedAdvisorStatuses = [],
  warnings = [],
} = {}) {
  if (!Array.isArray(advisorOutputs) || advisorOutputs.length === 0) {
    return {
      partnerId,
      period,
      advisorOutputs: [],
      qualifiedAdvisorStatuses: [...qualifiedAdvisorStatuses],
      teamInitialCommissions: null,
      teamRenewalCommissions: null,
      teamTotalCommissions: null,
      qualifiedAdvisorCount: 0,
      nonQualifiedAdvisorEconomicOutput: [],
      paidAppliedPolicyCount: null,
      blockedAdvisorOutputs: [],
      hiddenByScopeOutputs: [],
      warnings: [...warnings, 'advisor_outputs_required'],
      status: TEAM_ECONOMIC_OUTPUT_STATUSES.BLOCKED_BY_MISSING_ADVISOR_OUTPUTS,
      unknownIsZero: false,
      blockedIsZero: false,
    };
  }

  const hiddenByScopeOutputs = advisorOutputs.filter((output) => output.hiddenByScope === true);
  const heldOutputs = advisorOutputs.filter((output) => output.heldPrecontractCommission === true);
  const blockedAdvisorOutputs = advisorOutputs.filter((output) => (
    output.economicStatus === ADVISOR_ECONOMIC_OUTPUT_STATUSES.BLOCKED ||
    output.economicStatus === ADVISOR_ECONOMIC_OUTPUT_STATUSES.UNKNOWN ||
    output.heldPrecontractCommission === true
  ));

  const visibleSummableOutputs = advisorOutputs.filter(canSumOutput);
  const qualifiedAdvisorIds = new Set(
    qualifiedAdvisorStatuses
      .filter((status) => status.status === QUALIFIED_ADVISOR_ECONOMIC_STATUSES.QUALIFIED_CONFIRMED)
      .map((status) => status.advisorId)
      .filter(Boolean)
  );

  const nonQualifiedAdvisorEconomicOutput = visibleSummableOutputs.filter((output) => !qualifiedAdvisorIds.has(output.advisorId));
  const teamInitialCommissions = visibleSummableOutputs.some((output) => hasNumber(output.initialCommissions))
    ? sumValues(visibleSummableOutputs.map((output) => output.initialCommissions).filter(hasNumber))
    : null;
  const teamRenewalCommissions = visibleSummableOutputs.some((output) => hasNumber(output.renewalCommissions))
    ? sumValues(visibleSummableOutputs.map((output) => output.renewalCommissions).filter(hasNumber))
    : null;
  const teamTotalCommissions = visibleSummableOutputs.some((output) => hasNumber(output.totalCommissions))
    ? sumValues(visibleSummableOutputs.map((output) => output.totalCommissions).filter(hasNumber))
    : null;
  const paidAppliedPolicyCount = visibleSummableOutputs.some((output) => hasNumber(output.paidAppliedPolicyCount))
    ? sumValues(visibleSummableOutputs.map((output) => output.paidAppliedPolicyCount).filter(hasNumber))
    : null;

  let status = TEAM_ECONOMIC_OUTPUT_STATUSES.TEAM_OUTPUT_CONFIRMED;
  if (hiddenByScopeOutputs.length > 0 && visibleSummableOutputs.length === 0) {
    status = TEAM_ECONOMIC_OUTPUT_STATUSES.BLOCKED_BY_SCOPE;
  } else if (heldOutputs.length > 0 && visibleSummableOutputs.length === 0) {
    status = TEAM_ECONOMIC_OUTPUT_STATUSES.BLOCKED_BY_HELD_PRECONTRACT_COMMISSION;
  } else if (blockedAdvisorOutputs.length > 0 || hiddenByScopeOutputs.length > 0) {
    status = TEAM_ECONOMIC_OUTPUT_STATUSES.TEAM_OUTPUT_PARTIAL;
  } else if (visibleSummableOutputs.length === 0) {
    status = TEAM_ECONOMIC_OUTPUT_STATUSES.TEAM_OUTPUT_UNKNOWN;
  }

  return {
    partnerId,
    period,
    advisorOutputs: [...advisorOutputs],
    qualifiedAdvisorStatuses: [...qualifiedAdvisorStatuses],
    teamInitialCommissions,
    teamRenewalCommissions,
    teamTotalCommissions,
    qualifiedAdvisorCount: qualifiedAdvisorIds.size,
    nonQualifiedAdvisorEconomicOutput,
    paidAppliedPolicyCount,
    blockedAdvisorOutputs,
    hiddenByScopeOutputs,
    warnings: [
      ...warnings,
      ...(hiddenByScopeOutputs.length > 0 ? ['hidden_by_scope_excluded_before_aggregation'] : []),
      ...(heldOutputs.length > 0 ? ['held_precontract_commission_not_summed_as_payable'] : []),
    ],
    status,
    unknownIsZero: false,
    blockedIsZero: false,
  };
}
