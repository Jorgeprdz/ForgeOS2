import {
  getSourceOwnership,
  getClaimOwnership,
  canDomainConsume,
  checkReinterpretationRisk,
  evaluateOwnership
} from './source-ownership-registry.js';

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({ name, status: 'FAIL', error: error.message });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertOwner(sourceType, expectedOwner) {
  const result = getSourceOwnership(sourceType);
  assert(result.conceptualOwner === expectedOwner, `${sourceType} owner mismatch.`);
  assert(result.blocked === false, `${sourceType} should not be blocked.`);
}

test('UDI owner is Economic Evidence', () => {
  assertOwner('current_udi_value', 'Economic Evidence');
});

test('FX owner is Economic Evidence', () => {
  assertOwner('fx_rate', 'Economic Evidence');
});

test('Raw quote owner is Evidence Ownership', () => {
  assertOwner('raw_quote_illustration_document', 'Evidence Ownership');
});

test('Quoted premium owner is Economic Evidence', () => {
  assertOwner('quoted_premium', 'Economic Evidence');
});

test('Projection from quote owner is Forecast Truth', () => {
  assertOwner('projection_derived_from_quote', 'Forecast Truth');
});

test('NASH does not own client intent truth', () => {
  const risk = checkReinterpretationRisk({
    sourceType: 'nash_output',
    attemptedInterpretation: 'nash_guidance_into_client_intent'
  });
  assert(risk.status === 'reinterpretation_blocked', 'NASH client intent risk should be blocked.');
  assert(risk.blocked === true, 'NASH client intent risk block flag mismatch.');
});

test('Relationship opportunity is not permission', () => {
  const risk = checkReinterpretationRisk({
    claimType: 'relationship_is_opportunity',
    attemptedInterpretation: 'relationship_context_into_permission'
  });
  assert(risk.status === 'reinterpretation_blocked', 'Relationship permission risk should be blocked.');
});

test('Dual source and claim inputs surface ownership ambiguity', () => {
  const result = evaluateOwnership({
    sourceType: 'productivity_metric',
    claimType: 'advisor_has_produced_x'
  });
  assert(result.ownershipStatus === 'owner_ambiguous', 'Dual input ownership should be ambiguous.');
  assert(result.blocked === true, 'Ambiguous ownership should be blocked.');
  assert(result.status === 'owner_ambiguous', 'Dual input status should remain ambiguous.');
});

test('Raw activity log owner is Evidence Ownership', () => {
  assertOwner('raw_system_activity_log', 'Evidence Ownership');
});

test('Productivity metric owner is Productivity', () => {
  assertOwner('productivity_metric', 'Productivity');
});

test('Mick behavior signal owner is Mick Behavior Intelligence', () => {
  assertOwner('mick_behavior_signal', 'Mick Behavior Intelligence');
});

test('Issued premium is not paid premium', () => {
  const risk = checkReinterpretationRisk({
    sourceType: 'issued_premium_record',
    attemptedInterpretation: 'issued_premium_into_paid_premium'
  });
  assert(risk.status === 'reinterpretation_blocked', 'Issued-as-paid risk should be blocked.');
});

test('Compensation scenario is not payment', () => {
  const risk = checkReinterpretationRisk({
    sourceType: 'compensation_rule_pack',
    attemptedInterpretation: 'compensation_scenario_into_payment'
  });
  assert(risk.status === 'reinterpretation_blocked', 'Compensation scenario payment risk should be blocked.');
});

test('NBA priority is not mandate', () => {
  const risk = checkReinterpretationRisk({
    sourceType: 'nba_output',
    attemptedInterpretation: 'nba_priority_into_mandate'
  });
  assert(risk.status === 'reinterpretation_blocked', 'NBA mandate risk should be blocked.');
});

test('Manager signal is not enforcement', () => {
  const risk = checkReinterpretationRisk({
    sourceType: 'manager_intelligence_signal',
    attemptedInterpretation: 'manager_signal_into_enforcement'
  });
  assert(risk.status === 'reinterpretation_blocked', 'Manager enforcement risk should be blocked.');
});

test('Unknown source type returns owner_unknown and blocked true', () => {
  const result = getSourceOwnership('unknown_source_type');
  assert(result.status === 'owner_unknown', 'Unknown source status mismatch.');
  assert(result.blocked === true, 'Unknown source should be blocked.');
});

test('Conflicting owner state blocks strong output', () => {
  const result = getSourceOwnership('conflicting_owner_fixture');
  assert(result.status === 'owner_conflicting', 'Conflicting owner status mismatch.');
  assert(result.blocked === true, 'Conflicting owner should be blocked.');
});

test('Consumer restricted returns consumer_restricted', () => {
  const result = canDomainConsume({
    consumingDomain: 'Product Truth',
    sourceType: 'manager_intelligence_signal'
  });
  assert(result.consumerStatus === 'consumer_restricted', 'Consumer restriction mismatch.');
  assert(result.blocked === true, 'Restricted consumer should be blocked.');
});

test('Dual source and claim inputs are not silently selected for consumer checks', () => {
  const result = canDomainConsume({
    consumingDomain: 'Manager Intelligence',
    sourceType: 'productivity_metric',
    claimType: 'advisor_has_produced_x'
  });
  assert(result.ownershipStatus === 'owner_ambiguous', 'Dual input consumer check should be ambiguous.');
  assert(result.consumerStatus === 'consumer_restricted', 'Ambiguous ownership should restrict consumers.');
  assert(result.blocked === true, 'Ambiguous ownership should block strong output.');
});

test('Prohibited reinterpretation returns reinterpretation_blocked', () => {
  const result = checkReinterpretationRisk({
    sourceType: 'raw_quote_illustration_document',
    attemptedInterpretation: 'quote_into_policy'
  });
  assert(result.reinterpretationStatus === 'reinterpretation_blocked', 'Reinterpretation status mismatch.');
  assert(result.blocked === true, 'Prohibited reinterpretation should be blocked.');
});

test('Productivity-as-human-worth risk is blocked', () => {
  const result = checkReinterpretationRisk({
    sourceType: 'productivity_metric',
    attemptedInterpretation: 'productivity_metric_into_human_worth'
  });
  assert(result.status === 'reinterpretation_blocked', 'Productivity human worth risk should be blocked.');
});

test('Forecast-as-fact risk is blocked', () => {
  const result = checkReinterpretationRisk({
    sourceType: 'projection_derived_from_quote',
    attemptedInterpretation: 'scenario_into_fact'
  });
  assert(result.status === 'reinterpretation_blocked', 'Forecast fact risk should be blocked.');
});

test('Validation required means validation is required elsewhere', () => {
  const result = checkReinterpretationRisk({
    sourceType: 'raw_quote_illustration_document'
  });
  assert(result.reinterpretationStatus === 'validation_required', 'Missing attempted interpretation should require validation.');
  assert(
    result.warnings.some((warning) => warning.includes('Additional validation is required elsewhere')),
    'Validation-required warning should be explicit.'
  );
});

test('Evaluate ownership consolidates owner, consumer and reinterpretation results', () => {
  const result = evaluateOwnership({
    sourceType: 'productivity_metric',
    consumingDomain: 'Manager Intelligence',
    attemptedInterpretation: 'productivity_metric_into_human_worth'
  });
  assert(result.ownershipStatus === 'owner_confirmed', 'Consolidated ownership mismatch.');
  assert(result.consumerStatus === 'consumer_allowed', 'Consolidated consumer mismatch.');
  assert(result.reinterpretationStatus === 'reinterpretation_blocked', 'Consolidated reinterpretation mismatch.');
  assert(result.blocked === true, 'Consolidated block mismatch.');
});

console.log('\nFORGE SOURCE OWNERSHIP REGISTRY VALIDATION v0.1\n');

for (const result of results) {
  console.log(`${result.status} ${result.name}`);
  if (result.error) {
    console.log(`   ${result.error}`);
  }
}

const failed = results.filter((result) => result.status === 'FAIL');

console.log(`\nSummary:\nTotal: ${results.length}\nPass: ${results.length - failed.length}\nFail: ${failed.length}`);

if (failed.length > 0) {
  process.exit(1);
}
