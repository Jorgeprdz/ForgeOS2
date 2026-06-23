function numberOrNull(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function round2(value) {
  const numericValue = numberOrNull(value);
  if (numericValue === null) return null;
  return Math.round((numericValue + Number.EPSILON) * 100) / 100;
}

function bool(value) {
  return value === true;
}

function advisorIdOf(advisor = {}, qualification = {}) {
  return advisor.advisorId || advisor.id || qualification.advisorId || advisor.name || null;
}

function advisorNameOf(advisor = {}, qualification = {}) {
  return advisor.name || qualification.advisorName || qualification.advisorId || advisor.id || null;
}

function unique(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function deriveVidaGmmiBasis(advisor = {}) {
  return numberOrNull(advisor.qualifiedAdvisorInitialCommissionsLifeIndividualAndGmmi)
    ?? numberOrNull(advisor.lifeAndGmmiInitialCommissions)
    ?? null;
}

function deriveOtherRamosBasis(advisor = {}) {
  const quarterInitial = numberOrNull(advisor.quarterInitialCommissions);
  const vidaGmmi = deriveVidaGmmiBasis(advisor);

  if (quarterInitial === null || vidaGmmi === null) return null;
  return quarterInitial - vidaGmmi;
}

function buildAdvisorQualificationExplanation({ advisor = {}, qualification = {}, index = null } = {}) {
  const qualified = qualification.qualified === true;
  const active = advisor.activeAtQuarterClose === true || advisor.active === true || advisor.advisorActiveStatus === 'active';
  const averageMonthlyInitialCommissions =
    numberOrNull(qualification.averageMonthlyInitialCommissions)
    ?? numberOrNull(advisor.averageMonthlyInitialCommissions)
    ?? null;

  const quarterInitialCommissions = numberOrNull(advisor.quarterInitialCommissions);
  const lifeIndividualShare =
    numberOrNull(qualification.lifeIndividualShare)
    ?? numberOrNull(advisor.lifeIndividualShare)
    ?? null;

  const LIMRA = numberOrNull(advisor.LIMRA);
  const IGC = numberOrNull(advisor.IGC);

  const reasons = [];
  const blockedReasons = [
    ...asArray(qualification.blockedReasons),
    ...asArray(qualification.missingInputs).map((input) => `missing_${input}`),
  ];
  const warnings = [...asArray(qualification.warnings)];
  const missingInputs = [...asArray(qualification.missingInputs)];
  const evidenceUsed = [];
  const rulesUsed = ['existing_qualified_advisor_economic_status'];

  if (qualified) {
    reasons.push('qualified_by_existing_calculator');
  } else {
    reasons.push('not_qualified_by_existing_calculator');
  }

  if (averageMonthlyInitialCommissions !== null) {
    evidenceUsed.push('averageMonthlyInitialCommissions');
    if (averageMonthlyInitialCommissions >= 9000) {
      reasons.push('average_monthly_initial_commissions_meets_9000_partner_requirement');
    } else {
      blockedReasons.push('blocked_by_average_monthly_initial_commissions_below_9000_partner_requirement');
    }
  } else {
    missingInputs.push('averageMonthlyInitialCommissions');
    blockedReasons.push('blocked_by_missing_average_monthly_initial_commissions');
  }

  if (active) {
    reasons.push('advisor_active_at_period_close');
    evidenceUsed.push('activeAtQuarterClose');
  } else {
    blockedReasons.push('blocked_by_inactive_advisor');
  }

  if (lifeIndividualShare !== null) {
    evidenceUsed.push('lifeIndividualShare');

    if (lifeIndividualShare >= 0.6) {
      reasons.push('index_gate_relevant_life_individual_share_at_least_60_percent');
      rulesUsed.push('limra_igc_gate_when_life_individual_share_at_least_60_percent');

      if (LIMRA === null) {
        missingInputs.push('LIMRA');
        blockedReasons.push('blocked_or_unknown_by_missing_limra_when_index_gate_relevant');
      } else {
        evidenceUsed.push('LIMRA');
      }

      if (IGC === null) {
        missingInputs.push('IGC');
        blockedReasons.push('blocked_or_unknown_by_missing_igc_when_index_gate_relevant');
      } else {
        evidenceUsed.push('IGC');
      }
    } else {
      warnings.push('limra_igc_gate_not_applied_life_individual_share_below_60_percent');
    }
  } else {
    missingInputs.push('lifeIndividualShare');
    warnings.push('unknown_index_gate_relevance_missing_life_individual_share');
  }

  return {
    advisorId: advisorIdOf(advisor, qualification),
    advisorName: advisorNameOf(advisor, qualification),
    index,
    status: qualified ? 'qualified_explained' : 'not_qualified_explained',
    qualified,
    reasons: unique(reasons),
    blockedReasons: unique(blockedReasons),
    missingInputs: unique(missingInputs),
    warnings: unique(warnings),
    evidenceUsed: unique(evidenceUsed),
    rulesUsed: unique(rulesUsed),
    metrics: {
      careerMonth: numberOrNull(advisor.advisorMonth ?? qualification.careerMonth),
      averageMonthlyInitialCommissions: round2(averageMonthlyInitialCommissions),
      quarterInitialCommissions: round2(quarterInitialCommissions),
      monthlyAveragePolicies: round2(advisor.monthlyAveragePolicies),
      quarterPolicyTotal: round2(advisor.quarterPolicyTotal),
      vidaGmmiBasis: round2(deriveVidaGmmiBasis(advisor)),
      otherRamosBasis: round2(deriveOtherRamosBasis(advisor)),
      lifeIndividualShare: round2(lifeIndividualShare),
      LIMRA,
      IGC,
      active,
    },
  };
}

export function explainPartnerAdvisorQualifications({ quarterlyResult = null } = {}) {
  const advisors = quarterlyResult?.qualificationSummary?.normalizedAdvisors || [];
  const qualifications = quarterlyResult?.qualificationSummary?.advisors || [];

  const advisorExplanations = advisors.map((advisor, index) => (
    buildAdvisorQualificationExplanation({
      advisor,
      qualification: qualifications[index] || {},
      index,
    })
  ));

  return {
    status: 'calculated_explanation',
    qualifiedAdvisorCount: advisorExplanations.filter((advisor) => advisor.qualified === true).length,
    nonQualifiedAdvisorCount: advisorExplanations.filter((advisor) => advisor.qualified !== true).length,
    advisors: advisorExplanations,
    warnings: unique(advisorExplanations.flatMap((advisor) => advisor.warnings)),
    blockedReasons: unique(advisorExplanations.flatMap((advisor) => advisor.blockedReasons)),
  };
}

export default {
  explainPartnerAdvisorQualifications,
};
