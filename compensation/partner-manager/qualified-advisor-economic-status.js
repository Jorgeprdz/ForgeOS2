import {
  ADVISOR_ECONOMIC_OUTPUT_STATUSES,
} from './advisor-economic-output.js';

import {
  loadPartner2026RulePack,
} from './partner-2026-rule-pack-loader.js';

const DEFAULT_PARTNER_2026_RULE_PACK = loadPartner2026RulePack();

export const DEFAULT_PARTNER_2026_QUALIFIED_COMMISSION_THRESHOLD = DEFAULT_PARTNER_2026_RULE_PACK
  .globalRules
  .advisorQualifiedDefinition
  .requires
  .averageMonthlyInitialCommissionsAtLeast;

export const QUALIFIED_ADVISOR_ECONOMIC_STATUSES = Object.freeze({
  QUALIFIED_CONFIRMED: 'qualified_confirmed',
  NOT_QUALIFIED_CONFIRMED: 'not_qualified_confirmed',
  UNKNOWN: 'unknown',
  BLOCKED_BY_MISSING_COMMISSION_EVIDENCE: 'blocked_by_missing_commission_evidence',
  BLOCKED_BY_MISSING_LIMRA: 'blocked_by_missing_LIMRA',
  BLOCKED_BY_MISSING_IGC: 'blocked_by_missing_IGC',
  BLOCKED_BY_MISSING_LIFE_INDIVIDUAL_SHARE: 'blocked_by_missing_life_individual_share',
  BLOCKED_BY_MISSING_LIFECYCLE: 'blocked_by_missing_lifecycle',
  BLOCKED_BY_PRECONTRACT_STATUS: 'blocked_by_precontract_status',
  BLOCKED_BY_MISSING_THRESHOLD: 'blocked_by_missing_threshold',
});

const PRECONTRACT_STATUSES = new Set([
  'precontract',
  'precontract_signed',
  'pending_activation',
]);

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function blocked(status, reasons, warnings = []) {
  return {
    status,
    qualified: false,
    averageMonthlyInitialCommissions: null,
    indexesApplied: null,
    indexApplicabilityReason: null,
    blockedReasons: reasons,
    missingInputs: [],
    sourceRulePackId: DEFAULT_PARTNER_2026_RULE_PACK.rulePackId,
    threshold: null,
    reasons,
    warnings,
    unknownIsZero: false,
  };
}

export function evaluateQualifiedAdvisorEconomicStatus({
  rulePack = DEFAULT_PARTNER_2026_RULE_PACK,
  advisorId = null,
  averageMonthlyInitialCommissions = null,
  threshold = null,
  LIMRA = null,
  IGC = null,
  requireLIMRA = true,
  requireIGC = true,
  lifeIndividualShare = null,
  lifeIndividualInitialCommissions = null,
  quarterInitialCommissions = null,
  lifecycleStatus = 'unknown',
  lifecycleGateAllowed = false,
  advisorActiveStatus = null,
  active = null,
  advisorStage = null,
  careerMonth = null,
  economicOutputStatus = ADVISOR_ECONOMIC_OUTPUT_STATUSES.UNKNOWN,
} = {}) {
  const activeRulePack = rulePack || DEFAULT_PARTNER_2026_RULE_PACK;
  const sourceRulePackId = activeRulePack?.rulePackId || null;
  const resolvedThreshold = hasNumber(threshold)
    ? Number(threshold)
    : activeRulePack?.globalRules?.advisorQualifiedDefinition?.requires?.averageMonthlyInitialCommissionsAtLeast;
  const indexRule = activeRulePack?.globalRules?.advisorQualifiedDefinition?.indexApplicabilityRule || {};
  const indexShareThreshold = indexRule.conservationIndexesOnlyApplyIfLifeIndividualInitialCommissionsShareAtLeast;
  const derivedLifeShare = hasNumber(lifeIndividualShare)
    ? Number(lifeIndividualShare)
    : (
      hasNumber(lifeIndividualInitialCommissions) && hasNumber(quarterInitialCommissions) && Number(quarterInitialCommissions) > 0
        ? Number(lifeIndividualInitialCommissions) / Number(quarterInitialCommissions)
        : null
    );
  const indexesApplied = hasNumber(indexShareThreshold) && hasNumber(derivedLifeShare)
    ? Number(derivedLifeShare) >= Number(indexShareThreshold)
    : null;
  const indexApplicabilityReason = indexesApplied === true
    ? 'life_individual_share_at_or_above_threshold'
    : (
      indexesApplied === false
        ? 'life_individual_share_below_threshold'
        : 'life_individual_share_unknown'
    );
  const activeAllowed = active === true ||
    advisorActiveStatus === 'active' ||
    lifecycleStatus === 'connected_active' ||
    lifecycleStatus === 'active';

  if (!hasNumber(resolvedThreshold)) {
    return {
      ...blocked(
        QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_MISSING_THRESHOLD,
        ['threshold_required_no_silent_default']
      ),
      advisorId,
      sourceRulePackId,
    };
  }

  if (PRECONTRACT_STATUSES.has(lifecycleStatus)) {
    return {
      ...blocked(
        QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_PRECONTRACT_STATUS,
        ['precontract_cannot_be_qualified_for_official_partner_compensation']
      ),
      advisorId,
      threshold: resolvedThreshold,
      indexesApplied,
      indexApplicabilityReason,
      sourceRulePackId,
    };
  }

  if (!lifecycleStatus || lifecycleStatus === 'unknown' || lifecycleGateAllowed !== true || activeAllowed !== true) {
    return {
      ...blocked(
        QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_MISSING_LIFECYCLE,
        ['official_lifecycle_gate_required', 'advisor_active_status_required']
      ),
      advisorId,
      threshold: resolvedThreshold,
      indexesApplied,
      indexApplicabilityReason,
      sourceRulePackId,
    };
  }

  if (economicOutputStatus === ADVISOR_ECONOMIC_OUTPUT_STATUSES.CANDIDATE) {
    return {
      ...blocked(
        QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_MISSING_COMMISSION_EVIDENCE,
        ['candidate_economic_output_not_eligible']
      ),
      advisorId,
      threshold: resolvedThreshold,
      indexesApplied,
      indexApplicabilityReason,
      sourceRulePackId,
    };
  }

  if (!hasNumber(averageMonthlyInitialCommissions)) {
    return {
      ...blocked(
        QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_MISSING_COMMISSION_EVIDENCE,
        ['average_monthly_initial_commissions_required']
      ),
      advisorId,
      threshold: resolvedThreshold,
      indexesApplied,
      indexApplicabilityReason,
      sourceRulePackId,
    };
  }

  if (indexesApplied === null) {
    return {
      ...blocked(
        QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_MISSING_LIFE_INDIVIDUAL_SHARE,
        ['life_individual_share_required_to_determine_index_applicability']
      ),
      advisorId,
      threshold: resolvedThreshold,
      indexesApplied,
      indexApplicabilityReason,
      missingInputs: ['lifeIndividualShare'],
      sourceRulePackId,
    };
  }

  if (indexesApplied && requireLIMRA && !hasNumber(LIMRA)) {
    return {
      ...blocked(
        QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_MISSING_LIMRA,
        ['LIMRA_required']
      ),
      advisorId,
      threshold: resolvedThreshold,
      indexesApplied,
      indexApplicabilityReason,
      missingInputs: ['LIMRA'],
      sourceRulePackId,
    };
  }

  if (indexesApplied && requireIGC && !hasNumber(IGC)) {
    return {
      ...blocked(
        QUALIFIED_ADVISOR_ECONOMIC_STATUSES.BLOCKED_BY_MISSING_IGC,
        ['IGC_required']
      ),
      advisorId,
      threshold: resolvedThreshold,
      indexesApplied,
      indexApplicabilityReason,
      missingInputs: ['IGC'],
      sourceRulePackId,
    };
  }

  const qualified = Number(averageMonthlyInitialCommissions) >= Number(resolvedThreshold);

  return {
    advisorId,
    status: qualified
      ? QUALIFIED_ADVISOR_ECONOMIC_STATUSES.QUALIFIED_CONFIRMED
      : QUALIFIED_ADVISOR_ECONOMIC_STATUSES.NOT_QUALIFIED_CONFIRMED,
    qualified,
    averageMonthlyInitialCommissions: Number(averageMonthlyInitialCommissions),
    threshold: Number(resolvedThreshold),
    LIMRA: hasNumber(LIMRA) ? Number(LIMRA) : null,
    IGC: hasNumber(IGC) ? Number(IGC) : null,
    indexesApplied,
    indexApplicabilityReason,
    blockedReasons: [],
    missingInputs: [],
    sourceRulePackId,
    lifecycleStatus,
    advisorStage,
    careerMonth,
    economicOutputStatus,
    reasons: [],
    warnings: [],
    unknownIsZero: false,
  };
}
