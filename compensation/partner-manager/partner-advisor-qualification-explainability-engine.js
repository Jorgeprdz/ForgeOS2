import {
  createRulePackIdentitySnapshot,
  flattenRulePackIdentitySnapshot,
} from '../../governance/rule-pack-identity-snapshot.js';

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function round2(value) {
  const numericValue = numberOrNull(value);
  if (numericValue === null) return null;
  return Math.round((numericValue + Number.EPSILON) * 100) / 100;
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

function firstDefined(candidates = []) {
  return candidates.find((candidate) => candidate !== undefined);
}

function createNumericRawFact({ value, source = 'input' } = {}) {
  if (value === undefined || value === null || value === '') {
    return {
      value: null,
      state: 'missing',
      source,
    };
  }

  const numericValue = numberOrNull(value);

  if (numericValue === null) {
    return {
      value: null,
      state: 'unknown',
      source,
      rawValue: value,
    };
  }

  return {
    value: round2(numericValue),
    state: 'observed',
    source,
  };
}

function createBooleanRawFact({ value, source = 'input' } = {}) {
  if (value === undefined || value === null || value === '') {
    return {
      value: null,
      state: 'missing',
      source,
    };
  }

  if (value === true || value === false) {
    return {
      value,
      state: 'observed',
      source,
    };
  }

  if (value === 'active') {
    return {
      value: true,
      state: 'observed',
      source,
    };
  }

  if (value === 'inactive') {
    return {
      value: false,
      state: 'observed',
      source,
    };
  }

  return {
    value: null,
    state: 'unknown',
    source,
    rawValue: value,
  };
}

function numericFactFromCandidates(candidates = []) {
  let firstMissing = null;
  let firstUnknown = null;

  for (const candidate of candidates) {
    if (!candidate || candidate.value === undefined) continue;

    const fact = createNumericRawFact(candidate);

    if (fact.state === 'observed') {
      return fact;
    }

    if (fact.state === 'unknown' && firstUnknown === null) {
      firstUnknown = fact;
    }

    if (fact.state === 'missing' && firstMissing === null) {
      firstMissing = fact;
    }
  }

  return firstUnknown
    ?? firstMissing
    ?? createNumericRawFact({ value: undefined, source: 'input' });
}


function boolFactFromCandidates(candidates = []) {
  const candidate = candidates.find((item) => item && item.value !== undefined);
  if (!candidate) return createBooleanRawFact({ value: undefined, source: 'input' });
  return createBooleanRawFact(candidate);
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

function factInitialCommissionTotal(fact = {}) {
  const initialCommissions = fact.initialCommissions || {};

  const vidaIndividual = numberOrNull(initialCommissions.vidaIndividual) ?? 0;
  const gmmiIndividual = numberOrNull(initialCommissions.gmmiIndividual) ?? 0;
  const otherRamos = numberOrNull(initialCommissions.otherRamos) ?? 0;

  const hasAnyObservedValue = numberOrNull(initialCommissions.vidaIndividual) !== null
    || numberOrNull(initialCommissions.gmmiIndividual) !== null
    || numberOrNull(initialCommissions.otherRamos) !== null;

  if (!hasAnyObservedValue) return null;

  return vidaIndividual + gmmiIndividual + otherRamos;
}

function deriveQuarterInitialCommissionsFromMonthlyFacts(advisor = {}) {
  const monthlyFacts = asArray(advisor.monthlyFacts);

  if (monthlyFacts.length === 0) return null;

  const monthlyTotals = monthlyFacts
    .map(factInitialCommissionTotal)
    .filter((value) => value !== null);

  if (monthlyTotals.length === 0) return null;

  return monthlyTotals.reduce((total, value) => total + value, 0);
}

function deriveAverageMonthlyInitialCommissionsFromMonthlyFacts(advisor = {}) {
  const monthlyFacts = asArray(advisor.monthlyFacts);

  if (monthlyFacts.length === 0) return null;

  const monthlyTotals = monthlyFacts
    .map(factInitialCommissionTotal)
    .filter((value) => value !== null);

  if (monthlyTotals.length === 0) return null;

  return monthlyTotals.reduce((total, value) => total + value, 0) / monthlyTotals.length;
}


function buildRawFacts({ advisor = {}, qualification = {} } = {}) {
  const activeRawValue = firstDefined([
    advisor.activeAtQuarterClose,
    advisor.active,
    advisor.advisorActiveStatus,
    advisor.status,
    qualification.activeAtQuarterClose,
  ]);

  const derivedAverageMonthlyInitialCommissions = deriveAverageMonthlyInitialCommissionsFromMonthlyFacts(advisor);
  const derivedQuarterInitialCommissions = deriveQuarterInitialCommissionsFromMonthlyFacts(advisor);

  return {
    ciPromedio: numericFactFromCandidates([
      { value: advisor.averageMonthlyInitialCommissions, source: 'normalizedAdvisor.averageMonthlyInitialCommissions' },
      { value: qualification.averageMonthlyInitialCommissions, source: 'qualification.averageMonthlyInitialCommissions' },
      { value: derivedAverageMonthlyInitialCommissions, source: 'derived.monthlyFacts.averageMonthlyInitialCommissions' },
    ]),
    averageMonthlyInitialCommissions: numericFactFromCandidates([
      { value: advisor.averageMonthlyInitialCommissions, source: 'normalizedAdvisor.averageMonthlyInitialCommissions' },
      { value: qualification.averageMonthlyInitialCommissions, source: 'qualification.averageMonthlyInitialCommissions' },
      { value: derivedAverageMonthlyInitialCommissions, source: 'derived.monthlyFacts.averageMonthlyInitialCommissions' },
    ]),
    quarterInitialCommissions: numericFactFromCandidates([
      { value: advisor.quarterInitialCommissions, source: 'normalizedAdvisor.quarterInitialCommissions' },
      { value: qualification.quarterInitialCommissions, source: 'qualification.quarterInitialCommissions' },
      { value: derivedQuarterInitialCommissions, source: 'derived.monthlyFacts.quarterInitialCommissions' },
    ]),
    monthlyAveragePolicies: numericFactFromCandidates([
      { value: advisor.monthlyAveragePolicies, source: 'normalizedAdvisor.monthlyAveragePolicies' },
    ]),
    quarterPolicyTotal: numericFactFromCandidates([
      { value: advisor.quarterPolicyTotal, source: 'normalizedAdvisor.quarterPolicyTotal' },
    ]),
    vidaGmmiBasis: createNumericRawFact({
      value: deriveVidaGmmiBasis(advisor),
      source: 'derived.vidaGmmiBasis',
    }),
    otherRamosBasis: createNumericRawFact({
      value: deriveOtherRamosBasis(advisor),
      source: 'derived.otherRamosBasis',
    }),
    lifeIndividualShare: numericFactFromCandidates([
      { value: advisor.lifeIndividualShare, source: 'normalizedAdvisor.lifeIndividualShare' },
      { value: qualification.lifeIndividualShare, source: 'qualification.lifeIndividualShare' },
    ]),
    LIMRA: numericFactFromCandidates([
      { value: advisor.LIMRA, source: 'normalizedAdvisor.LIMRA' },
      { value: advisor.indexes?.LIMRA, source: 'advisor.indexes.LIMRA' },
      { value: qualification.LIMRA, source: 'qualification.LIMRA' },
    ]),
    IGC: numericFactFromCandidates([
      { value: advisor.IGC, source: 'normalizedAdvisor.IGC' },
      { value: advisor.indexes?.IGC, source: 'advisor.indexes.IGC' },
      { value: qualification.IGC, source: 'qualification.IGC' },
    ]),
    active: createBooleanRawFact({
      value: activeRawValue,
      source: 'advisor.activeAtQuarterClose',
    }),
    careerMonth: numericFactFromCandidates([
      { value: advisor.advisorMonth, source: 'normalizedAdvisor.advisorMonth' },
      { value: qualification.careerMonth, source: 'qualification.careerMonth' },
    ]),
  };
}


function evaluatedNumericMetric({ rawFact, threshold = null, priorBlocked = false, excluded = false, missingRequired = false } = {}) {
  if (excluded) {
    return {
      value: rawFact?.value ?? null,
      state: 'excluded_by_rule',
    };
  }

  if (priorBlocked && rawFact?.state === 'observed') {
    return {
      value: rawFact.value,
      state: 'not_evaluated_due_to_prior_block',
    };
  }

  if (rawFact?.state === 'missing' || missingRequired) {
    return {
      value: null,
      state: 'missing_and_required',
    };
  }

  if (rawFact?.state === 'unknown') {
    return {
      value: null,
      state: 'unknown',
    };
  }

  if (rawFact?.state !== 'observed') {
    return {
      value: null,
      state: 'unknown',
    };
  }

  if (threshold === null) {
    return {
      value: rawFact.value,
      state: 'evaluated_observed',
    };
  }

  return {
    value: rawFact.value,
    state: rawFact.value >= threshold ? 'evaluated_passed' : 'evaluated_failed',
    threshold,
  };
}

function evaluatedBooleanMetric({ rawFact } = {}) {
  if (rawFact?.state === 'missing') {
    return {
      value: null,
      state: 'missing_and_required',
    };
  }

  if (rawFact?.state === 'unknown') {
    return {
      value: null,
      state: 'unknown',
    };
  }

  return {
    value: rawFact?.value ?? null,
    state: rawFact?.value === true ? 'evaluated_passed' : 'evaluated_failed',
  };
}

function primaryReasonFrom({ qualified, active, averageMonthlyInitialCommissions, lifeIndividualShare, LIMRA, IGC, blockedReasons = [] } = {}) {
  if (qualified) return 'qualified';

  if (active !== true) return 'inactive_advisor';
  if (averageMonthlyInitialCommissions === null) return 'missing_average_monthly_initial_commissions';
  if (averageMonthlyInitialCommissions < 9000) return 'average_monthly_initial_commissions_below_9000';
  if (lifeIndividualShare === null) return 'missing_life_individual_share';
  if (lifeIndividualShare >= 0.6 && LIMRA === null) return 'missing_limra';
  if (lifeIndividualShare >= 0.6 && IGC === null) return 'missing_igc';

  const explicitBlockedReason = blockedReasons[0];
  if (explicitBlockedReason) return explicitBlockedReason;

  return 'not_qualified_by_existing_calculator';
}

function decisionStatusFrom(primaryReason, qualified) {
  if (qualified) return 'qualified';

  const map = {
    inactive_advisor: 'blocked_by_inactive_advisor',
    missing_average_monthly_initial_commissions: 'blocked_by_missing_average_monthly_initial_commissions',
    average_monthly_initial_commissions_below_9000: 'blocked_by_average_monthly_initial_commissions_below_9000_partner_requirement',
    missing_life_individual_share: 'blocked_by_missing_life_individual_share',
    missing_limra: 'blocked_by_missing_limra',
    missing_igc: 'blocked_by_missing_igc',
  };

  return map[primaryReason] || String(primaryReason || 'not_qualified_explained');
}

function money(value) {
  const numericValue = numberOrNull(value);
  if (numericValue === null) return 'dato no disponible';

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function humanSummaryFrom({ qualified, primaryReason, rawFacts = {} } = {}) {
  const observedCi = rawFacts.ciPromedio?.state === 'observed'
    ? rawFacts.ciPromedio.value
    : null;

  const ciSentence = observedCi !== null
    ? ` El PromCI observado fue ${money(observedCi)}.`
    : ' No hay PromCI observado confirmable.';

  if (qualified) {
    return `Califica según el cálculo existente.${ciSentence}`;
  }

  const reasonText = {
    inactive_advisor: 'No califica porque el asesor está inactivo al cierre del periodo.',
    missing_average_monthly_initial_commissions: 'No califica porque falta evidencia de PromCI.',
    average_monthly_initial_commissions_below_9000: 'No califica porque el PromCI evaluado no alcanza el mínimo requerido.',
    missing_life_individual_share: 'No califica porque falta información de participación de Vida Individual.',
    missing_limra: 'No califica porque falta evidencia de LIMRA.',
    missing_igc: 'No califica porque falta evidencia de IGC.',
  }[primaryReason] || 'No califica según el cálculo existente.';

  if (observedCi !== null && ['inactive_advisor', 'missing_limra', 'missing_igc', 'missing_life_individual_share'].includes(primaryReason)) {
    return `${reasonText}${ciSentence} El valor observado se conserva, pero la evaluación quedó detenida por el gate correspondiente.`;
  }

  return `${reasonText}${ciSentence}`;
}

function buildEvaluatedMetrics({ rawFacts = {}, active, averageMonthlyInitialCommissions, lifeIndividualShare, LIMRA, IGC } = {}) {
  const inactivePriorBlock = active !== true;
  const ciPassed = averageMonthlyInitialCommissions !== null && averageMonthlyInitialCommissions >= 9000;
  const ciPriorBlock = inactivePriorBlock;
  const indexGateUnknown = lifeIndividualShare === null;
  const indexGateRelevant = lifeIndividualShare !== null && lifeIndividualShare >= 0.6;
  const indexGateExcluded = lifeIndividualShare !== null && lifeIndividualShare < 0.6;
  const priorBlockForIndex = inactivePriorBlock || !ciPassed;

  return {
    ciPromedio: evaluatedNumericMetric({
      rawFact: rawFacts.ciPromedio,
      threshold: 9000,
      priorBlocked: ciPriorBlock,
    }),
    averageMonthlyInitialCommissions: evaluatedNumericMetric({
      rawFact: rawFacts.averageMonthlyInitialCommissions,
      threshold: 9000,
      priorBlocked: ciPriorBlock,
    }),
    active: evaluatedBooleanMetric({
      rawFact: rawFacts.active,
    }),
    lifeIndividualShare: evaluatedNumericMetric({
      rawFact: rawFacts.lifeIndividualShare,
      threshold: 0.6,
      priorBlocked: priorBlockForIndex,
      missingRequired: indexGateUnknown,
    }),
    LIMRA: evaluatedNumericMetric({
      rawFact: rawFacts.LIMRA,
      priorBlocked: priorBlockForIndex || indexGateUnknown,
      excluded: indexGateExcluded,
      missingRequired: indexGateRelevant && LIMRA === null,
    }),
    IGC: evaluatedNumericMetric({
      rawFact: rawFacts.IGC,
      priorBlocked: priorBlockForIndex || indexGateUnknown,
      excluded: indexGateExcluded,
      missingRequired: indexGateRelevant && IGC === null,
    }),
    quarterInitialCommissions: evaluatedNumericMetric({
      rawFact: rawFacts.quarterInitialCommissions,
      priorBlocked: false,
    }),
    monthlyAveragePolicies: evaluatedNumericMetric({
      rawFact: rawFacts.monthlyAveragePolicies,
      priorBlocked: false,
    }),
    quarterPolicyTotal: evaluatedNumericMetric({
      rawFact: rawFacts.quarterPolicyTotal,
      priorBlocked: false,
    }),
    vidaGmmiBasis: evaluatedNumericMetric({
      rawFact: rawFacts.vidaGmmiBasis,
      priorBlocked: false,
    }),
    otherRamosBasis: evaluatedNumericMetric({
      rawFact: rawFacts.otherRamosBasis,
      priorBlocked: false,
    }),
    careerMonth: evaluatedNumericMetric({
      rawFact: rawFacts.careerMonth,
      priorBlocked: false,
    }),
  };
}

function buildAdvisorQualificationExplanation({
  advisor = {},
  qualification = {},
  index = null,
  rulePackIdentityStamp,
} = {}) {
  const qualified = qualification.qualified === true;
  const rawFacts = buildRawFacts({ advisor, qualification });

  const active = rawFacts.active.value === true;
  const averageMonthlyInitialCommissions = rawFacts.ciPromedio.state === 'observed'
    ? rawFacts.ciPromedio.value
    : null;
  const quarterInitialCommissions = rawFacts.quarterInitialCommissions.state === 'observed'
    ? rawFacts.quarterInitialCommissions.value
    : null;
  const lifeIndividualShare = rawFacts.lifeIndividualShare.state === 'observed'
    ? rawFacts.lifeIndividualShare.value
    : null;
  const LIMRA = rawFacts.LIMRA.state === 'observed'
    ? rawFacts.LIMRA.value
    : null;
  const IGC = rawFacts.IGC.state === 'observed'
    ? rawFacts.IGC.value
    : null;

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

  const primaryReason = primaryReasonFrom({
    qualified,
    active,
    averageMonthlyInitialCommissions,
    lifeIndividualShare,
    LIMRA,
    IGC,
    blockedReasons,
  });

  const evaluatedMetrics = buildEvaluatedMetrics({
    rawFacts,
    active,
    averageMonthlyInitialCommissions,
    lifeIndividualShare,
    LIMRA,
    IGC,
  });

  const qualificationDecision = {
    qualified,
    status: decisionStatusFrom(primaryReason, qualified),
    primaryReason,
  };

  return {
    advisorId: advisorIdOf(advisor, qualification),
    advisorName: advisorNameOf(advisor, qualification),
    index,
    status: qualified ? 'qualified_explained' : 'not_qualified_explained',
    qualified,
    qualificationDecision,
    reasons: unique(reasons),
    blockedReasons: unique(blockedReasons),
    missingInputs: unique(missingInputs),
    warnings: unique(warnings),
    evidenceUsed: unique(evidenceUsed),
    rulesUsed: unique(rulesUsed),
    rawFacts,
    evaluatedMetrics,
    explanation: {
      humanSummary: humanSummaryFrom({ qualified, primaryReason, rawFacts }),
      warnings: unique(warnings),
    },
    metrics: {
      careerMonth: rawFacts.careerMonth.value,
      averageMonthlyInitialCommissions: evaluatedMetrics.ciPromedio.value,
      quarterInitialCommissions: round2(quarterInitialCommissions),
      monthlyAveragePolicies: rawFacts.monthlyAveragePolicies.value,
      quarterPolicyTotal: rawFacts.quarterPolicyTotal.value,
      vidaGmmiBasis: rawFacts.vidaGmmiBasis.value,
      otherRamosBasis: rawFacts.otherRamosBasis.value,
      lifeIndividualShare: rawFacts.lifeIndividualShare.value,
      LIMRA: rawFacts.LIMRA.value,
      IGC: rawFacts.IGC.value,
      active,
    },
    ...rulePackIdentityStamp,
  };
}

export function explainPartnerAdvisorQualifications({ quarterlyResult = null, rulePackIdentity = null } = {}) {
  const identity = createRulePackIdentitySnapshot({
    rulePackIdentity,
    calculatedAt: rulePackIdentity?.calculatedAt ?? null,
    generatedAt: rulePackIdentity?.generatedAt ?? null,
    allowDraft: true,
  });
  const rulePackIdentityStamp = flattenRulePackIdentitySnapshot(identity);

  const advisors = quarterlyResult?.qualificationSummary?.normalizedAdvisors || [];
  const qualifications = quarterlyResult?.qualificationSummary?.advisors || [];

  const advisorExplanations = advisors.map((advisor, index) => (
    buildAdvisorQualificationExplanation({
      advisor,
      qualification: qualifications[index] || {},
      index,
      rulePackIdentityStamp,
    })
  ));

  return {
    status: 'calculated_explanation',
    qualifiedAdvisorCount: advisorExplanations.filter((advisor) => advisor.qualified === true).length,
    nonQualifiedAdvisorCount: advisorExplanations.filter((advisor) => advisor.qualified !== true).length,
    advisors: advisorExplanations,
    warnings: unique(advisorExplanations.flatMap((advisor) => advisor.warnings)),
    blockedReasons: unique(advisorExplanations.flatMap((advisor) => advisor.blockedReasons)),
    ...rulePackIdentityStamp,
  };
}

export default {
  explainPartnerAdvisorQualifications,
};
