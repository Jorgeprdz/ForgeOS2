import {
  createHiddenByScopeRevenueValue,
} from './revenue-value.js';

function normalizeSet(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return new Set(Array.isArray(value) ? value.map(String) : [String(value)]);
}

function getItemAdvisorId(item = {}) {
  return item.advisorId || item.ownerAdvisorId || item.policyData?.advisorId || item.paymentEvent?.advisorId || null;
}

function getItemPolicyId(item = {}) {
  return item.policyId || item.policyNumber || item.policyData?.policyNumber || item.paymentEvent?.policyNumber || null;
}

export function createRevenueScopeGate({
  authorizedAdvisorIds = null,
  authorizedPolicyIds = null,
  authorizationFn = null,
  defaultAllow = true,
} = {}) {
  const advisorSet = normalizeSet(authorizedAdvisorIds);
  const policySet = normalizeSet(authorizedPolicyIds);

  function authorize(item = {}, context = {}) {
    if (typeof authorizationFn === 'function') {
      const result = authorizationFn(item, context);
      if (result === true) {
        return { allowed: true, reason: null };
      }
      if (result === false) {
        return { allowed: false, reason: 'scope_denied' };
      }
      if (result && typeof result === 'object') {
        return {
          allowed: result.allowed === true,
          reason: result.reason || (result.allowed === true ? null : 'scope_denied'),
          metadata: result.metadata || {},
        };
      }
    }

    const advisorId = getItemAdvisorId(item);
    if (advisorSet && (!advisorId || !advisorSet.has(String(advisorId)))) {
      return {
        allowed: false,
        reason: 'advisor_out_of_scope',
        metadata: { advisorId },
      };
    }

    const policyId = getItemPolicyId(item);
    if (policySet && (!policyId || !policySet.has(String(policyId)))) {
      return {
        allowed: false,
        reason: 'policy_out_of_scope',
        metadata: { policyId },
      };
    }

    return {
      allowed: defaultAllow,
      reason: defaultAllow ? null : 'scope_denied',
    };
  }

  return Object.freeze({
    authorize,
    apply(item = {}, context = {}) {
      const authorization = authorize(item, context);

      if (authorization.allowed) {
        return {
          visible: true,
          item,
          authorization,
        };
      }

      return {
        visible: false,
        item,
        authorization,
        revenueValue: createHiddenByScopeRevenueValue(item, {
          reason: authorization.reason,
          scopeMetadata: authorization.metadata || {},
        }),
      };
    },
  });
}

export function applyRevenueScope(item = {}, {
  scopeGate = null,
  context = {},
} = {}) {
  const gate = scopeGate || createRevenueScopeGate();
  return gate.apply(item, context);
}
