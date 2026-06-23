const DECISION_STATUS = Object.freeze({
  INCLUDED: 'included',
  EXCLUDED: 'excluded_by_rule',
  BLOCKED: 'blocked',
  UNKNOWN: 'unknown',
  NOT_MODELED: 'not_modeled',
});

const DEFAULT_REASON = Object.freeze({
  MISSING_POLICY: 'missing_policy',
  MISSING_RULE_PACK: 'missing_rule_pack',
  MISSING_LINE_OF_BUSINESS: 'missing_line_of_business',
  MISSING_PRODUCT_CODE: 'missing_product_code',
  MISSING_INSURED_AGE: 'missing_insured_age',
  EXCLUDED_PRODUCT: 'excluded_product',
  EXCLUDED_PRODUCT_COMPONENT: 'excluded_product_component',
  EXCLUDED_BY_INSURED_AGE: 'excluded_by_insured_age',
  UNSUPPORTED_LINE_OF_BUSINESS: 'unsupported_line_of_business',
  INVALID_COMMISSION_AMOUNT: 'invalid_commission_amount',
});

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeList(values) {
  return new Set(asArray(values).map(normalizeKey).filter(Boolean));
}

function getCountingAndWeightingRules(rulePack) {
  return (
    rulePack?.countingAndWeightingRules
    || rulePack?.advisorDevelopment?.countingAndWeightingRules
    || rulePack?.rules?.countingAndWeightingRules
    || null
  );
}

function getLineRule(rules, policy) {
  const lineOfBusiness = normalizeKey(
    policy.lineOfBusiness
    || policy.businessLine
    || policy.ramo
    || policy.line
    || policy.productLine
  );

  if (!lineOfBusiness) {
    return {
      status: DECISION_STATUS.BLOCKED,
      reason: DEFAULT_REASON.MISSING_LINE_OF_BUSINESS,
      lineOfBusiness,
      rule: null,
    };
  }

  const aliases = {
    vida_individual: ['lifeIndividual', 'life', 'vidaIndividual', 'vida_individual'],
    vida: ['lifeIndividual', 'life', 'vidaIndividual', 'vida_individual'],
    life: ['lifeIndividual', 'life', 'vidaIndividual', 'vida_individual'],
    life_individual: ['lifeIndividual', 'life', 'vidaIndividual', 'vida_individual'],
    gmmi: ['gmmi', 'medicalIndividual', 'gastosMedicosIndividual', 'gastos_medicos_individual'],
    gastos_medicos_individual: ['gmmi', 'medicalIndividual', 'gastosMedicosIndividual', 'gastos_medicos_individual'],
    medical_individual: ['gmmi', 'medicalIndividual', 'gastosMedicosIndividual', 'gastos_medicos_individual'],
  };

  const candidateKeys = aliases[lineOfBusiness] || [lineOfBusiness];

  for (const key of candidateKeys) {
    if (rules?.[key]) {
      return {
        status: DECISION_STATUS.INCLUDED,
        reason: null,
        lineOfBusiness,
        rule: rules[key],
      };
    }
  }

  return {
    status: DECISION_STATUS.NOT_MODELED,
    reason: DEFAULT_REASON.UNSUPPORTED_LINE_OF_BUSINESS,
    lineOfBusiness,
    rule: null,
  };
}

function getProductCode(policy) {
  return normalizeKey(
    policy.productCode
    || policy.product
    || policy.productName
    || policy.plan
    || policy.planCode
  );
}

function getExcludedProducts(lineRule, rules) {
  return new Set([
    ...normalizeList(rules?.excludedProducts),
    ...normalizeList(lineRule?.excludedProducts),
    ...normalizeList(lineRule?.productExclusions),
  ]);
}

function getExcludedComponents(lineRule, rules) {
  return new Set([
    ...normalizeList(rules?.excludedComponents),
    ...normalizeList(rules?.commissionExclusions),
    ...normalizeList(lineRule?.excludedComponents),
    ...normalizeList(lineRule?.commissionExclusions),
  ]);
}

function hasExcludedComponent(policy, excludedComponents) {
  const components = [
    policy.componentCode,
    policy.component,
    policy.rider,
    policy.coverageCode,
    policy.coverage,
    ...(Array.isArray(policy.components) ? policy.components : []),
    ...(Array.isArray(policy.riders) ? policy.riders : []),
    ...(Array.isArray(policy.coverages) ? policy.coverages : []),
  ].map(normalizeKey).filter(Boolean);

  return components.find((component) => excludedComponents.has(component)) || null;
}

function getInsuredAge(policy) {
  return numberOrNull(
    policy.insuredAge
    ?? policy.age
    ?? policy.aseguradoEdad
    ?? policy.edadAsegurado
  );
}

function getCommissionAmount(policy) {
  return numberOrNull(
    policy.initialCommission
    ?? policy.initialCommissionAmount
    ?? policy.commission
    ?? policy.commissionAmount
    ?? policy.comisionInicial
    ?? policy.comision
    ?? policy.amount
  );
}

function getCommissionFactor(lineRule) {
  const factor = numberOrNull(
    lineRule?.commissionFactor
    ?? lineRule?.weight
    ?? lineRule?.commissionWeight
    ?? lineRule?.participationFactor
  );

  if (factor === null) return 1;

  return factor;
}

function evaluatePolicy(policy, rules) {
  if (!policy || typeof policy !== 'object') {
    return {
      status: DECISION_STATUS.BLOCKED,
      reason: DEFAULT_REASON.MISSING_POLICY,
      policy,
      evaluatedAmount: null,
      rawAmount: null,
      factor: null,
    };
  }

  const lineMatch = getLineRule(rules, policy);

  if (lineMatch.status !== DECISION_STATUS.INCLUDED) {
    return {
      status: lineMatch.status,
      reason: lineMatch.reason,
      policy,
      lineOfBusiness: lineMatch.lineOfBusiness,
      evaluatedAmount: null,
      rawAmount: getCommissionAmount(policy),
      factor: null,
    };
  }

  const productCode = getProductCode(policy);

  if (!productCode) {
    return {
      status: DECISION_STATUS.BLOCKED,
      reason: DEFAULT_REASON.MISSING_PRODUCT_CODE,
      policy,
      lineOfBusiness: lineMatch.lineOfBusiness,
      evaluatedAmount: null,
      rawAmount: getCommissionAmount(policy),
      factor: null,
    };
  }

  const excludedProducts = getExcludedProducts(lineMatch.rule, rules);

  if (excludedProducts.has(productCode)) {
    return {
      status: DECISION_STATUS.EXCLUDED,
      reason: DEFAULT_REASON.EXCLUDED_PRODUCT,
      policy,
      lineOfBusiness: lineMatch.lineOfBusiness,
      productCode,
      evaluatedAmount: null,
      rawAmount: getCommissionAmount(policy),
      factor: null,
    };
  }

  const excludedComponents = getExcludedComponents(lineMatch.rule, rules);
  const excludedComponent = hasExcludedComponent(policy, excludedComponents);

  if (excludedComponent) {
    return {
      status: DECISION_STATUS.EXCLUDED,
      reason: DEFAULT_REASON.EXCLUDED_PRODUCT_COMPONENT,
      policy,
      lineOfBusiness: lineMatch.lineOfBusiness,
      productCode,
      excludedComponent,
      evaluatedAmount: null,
      rawAmount: getCommissionAmount(policy),
      factor: null,
    };
  }

  const ageExclusion = lineMatch.rule?.ageExclusion || lineMatch.rule?.insuredAgeExclusion || null;
  const minAgeExcluded = numberOrNull(
    ageExclusion?.minAgeExcluded
    ?? ageExclusion?.insuredAgeGreaterThanOrEqual
    ?? ageExclusion?.minimumExcludedAge
  );

  if (minAgeExcluded !== null) {
    const insuredAge = getInsuredAge(policy);

    if (insuredAge === null) {
      return {
        status: DECISION_STATUS.BLOCKED,
        reason: DEFAULT_REASON.MISSING_INSURED_AGE,
        policy,
        lineOfBusiness: lineMatch.lineOfBusiness,
        productCode,
        evaluatedAmount: null,
        rawAmount: getCommissionAmount(policy),
        factor: null,
      };
    }

    if (insuredAge >= minAgeExcluded) {
      return {
        status: DECISION_STATUS.EXCLUDED,
        reason: DEFAULT_REASON.EXCLUDED_BY_INSURED_AGE,
        policy,
        lineOfBusiness: lineMatch.lineOfBusiness,
        productCode,
        insuredAge,
        evaluatedAmount: null,
        rawAmount: getCommissionAmount(policy),
        factor: null,
      };
    }
  }

  const rawAmount = getCommissionAmount(policy);

  if (rawAmount === null) {
    return {
      status: DECISION_STATUS.BLOCKED,
      reason: DEFAULT_REASON.INVALID_COMMISSION_AMOUNT,
      policy,
      lineOfBusiness: lineMatch.lineOfBusiness,
      productCode,
      evaluatedAmount: null,
      rawAmount: null,
      factor: null,
    };
  }

  const factor = getCommissionFactor(lineMatch.rule);

  return {
    status: DECISION_STATUS.INCLUDED,
    reason: null,
    policy,
    lineOfBusiness: lineMatch.lineOfBusiness,
    productCode,
    evaluatedAmount: rawAmount * factor,
    rawAmount,
    factor,
  };
}

function summarizeEvaluations(evaluations) {
  const summary = {
    includedCount: 0,
    excludedCount: 0,
    blockedCount: 0,
    unknownCount: 0,
    notModeledCount: 0,
    rawAmount: 0,
    evaluatedAmount: 0,
    reasons: {},
  };

  for (const evaluation of evaluations) {
    if (evaluation.status === DECISION_STATUS.INCLUDED) {
      summary.includedCount += 1;
      summary.rawAmount += evaluation.rawAmount ?? 0;
      summary.evaluatedAmount += evaluation.evaluatedAmount ?? 0;
      continue;
    }

    if (evaluation.status === DECISION_STATUS.EXCLUDED) {
      summary.excludedCount += 1;
    } else if (evaluation.status === DECISION_STATUS.BLOCKED) {
      summary.blockedCount += 1;
    } else if (evaluation.status === DECISION_STATUS.UNKNOWN) {
      summary.unknownCount += 1;
    } else if (evaluation.status === DECISION_STATUS.NOT_MODELED) {
      summary.notModeledCount += 1;
    }

    const reason = evaluation.reason || 'unspecified';
    summary.reasons[reason] = (summary.reasons[reason] || 0) + 1;
  }

  return summary;
}

export function evaluateAdvisorDevelopmentPolicies(input = {}) {
  const rulePack = input.rulePack || input.rules || null;
  const policies = asArray(input.policies);
  const countingAndWeightingRules = getCountingAndWeightingRules(rulePack);

  if (!countingAndWeightingRules) {
    const evaluations = policies.map((policy) => ({
      status: DECISION_STATUS.BLOCKED,
      reason: DEFAULT_REASON.MISSING_RULE_PACK,
      policy,
      evaluatedAmount: null,
      rawAmount: getCommissionAmount(policy),
      factor: null,
    }));

    return {
      status: DECISION_STATUS.BLOCKED,
      reason: DEFAULT_REASON.MISSING_RULE_PACK,
      payoutTruth: false,
      policies: evaluations,
      summary: summarizeEvaluations(evaluations),
    };
  }

  const evaluations = policies.map((policy) => evaluatePolicy(policy, countingAndWeightingRules));

  return {
    status: evaluations.some((item) => item.status === DECISION_STATUS.BLOCKED)
      ? DECISION_STATUS.BLOCKED
      : DECISION_STATUS.INCLUDED,
    reason: evaluations.some((item) => item.status === DECISION_STATUS.BLOCKED)
      ? 'one_or_more_policies_blocked'
      : null,
    payoutTruth: false,
    policies: evaluations,
    summary: summarizeEvaluations(evaluations),
  };
}

export {
  DECISION_STATUS,
};
