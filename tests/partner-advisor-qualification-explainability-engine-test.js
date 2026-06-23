import assert from 'node:assert/strict';

import {
  calculatePartnerQuarterlyBonusCandidate,
} from '../compensation/partner-manager/partner-quarterly-bonus-calculator.js';

import {
  explainPartnerAdvisorQualifications,
} from '../compensation/partner-manager/partner-advisor-qualification-explainability-engine.js';

const r2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const rawFact = (month, vidaIndividual, gmmiIndividual, otherRamos, vidaPolicies, gmmiPolicies = 0) => ({
  month,
  initialCommissions: {
    vidaIndividual,
    gmmiIndividual,
    otherRamos,
  },
  paidPolicies: {
    vidaIndividual: vidaPolicies,
    gmmiIndividual: gmmiPolicies,
  },
});

const advisor = (id, name, connectionDate, indexes, facts, extra = {}) => ({
  id,
  name,
  connectionDate,
  active: true,
  status: 'active',
  indexes,
  monthlyFacts: facts,
  ...extra,
});

const scenario = calculatePartnerQuarterlyBonusCandidate({
  partner: {
    id: 'partner-mario-scenario-b',
    name: 'Mario',
    connectionDate: '2024-12-01',
    organizationType: 'nueva_organizacion',
    active: true,
    status: 'active',
    unitIndexes: { LIMRA: 84, IGC: 91 },
  },
  period: {
    id: '2026-Q2',
    type: 'quarter',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    months: [
      { id: '2026-04', startDate: '2026-04-01', endDate: '2026-04-30' },
      { id: '2026-05', startDate: '2026-05-01', endDate: '2026-05-31' },
      { id: '2026-06', startDate: '2026-06-01', endDate: '2026-06-30' },
    ],
  },
  advisors: [
    advisor('ana', 'Ana', '2025-04-01', { LIMRA: 82, IGC: 89 }, [
      rawFact('2026-04', 14000, 3000, 5000, 5),
      rawFact('2026-05', 12000, 4000, 6000, 5),
      rawFact('2026-06', 15000, 3000, 4000, 5),
    ]),

    advisor('bruno', 'Bruno', '2025-07-01', { LIMRA: 80, IGC: 88 }, [
      rawFact('2026-04', 9000, 2500, 2500, 4),
      rawFact('2026-05', 10000, 2000, 3000, 4),
      rawFact('2026-06', 11000, 2500, 2500, 4),
    ]),

    advisor('carla', 'Carla', '2026-01-01', { LIMRA: 79, IGC: 87 }, [
      rawFact('2026-04', 17000, 2000, 9000, 6),
      rawFact('2026-05', 16000, 2500, 8000, 6),
      rawFact('2026-06', 17500, 2500, 7000, 6),
    ], {
      contestDate: '2026-01-01',
      connectedAdvisorEvidence: true,
      developerEligibilityEvidence: true,
    }),

    advisor('diego', 'Diego', '2025-10-01', { LIMRA: 81, IGC: 90 }, [
      rawFact('2026-04', 8000, 1500, 4000, 3),
      rawFact('2026-05', 8500, 1500, 3500, 3),
      rawFact('2026-06', 9000, 1500, 3000, 3),
    ], {
      developerEligibilityEvidence: true,
    }),

    advisor('elena', 'Elena', '2026-03-01', { LIMRA: 76, IGC: 82 }, [
      rawFact('2026-04', 4000, 1000, 2000, 1),
      rawFact('2026-05', 3000, 1000, 2000, 1),
      rawFact('2026-06', 4000, 1000, 2000, 1),
    ]),

    advisor('fernando', 'Fernando', '2024-09-01', { LIMRA: null, IGC: null }, [
      rawFact('2026-04', 2000, 500, 9000, 0),
      rawFact('2026-05', 3000, 500, 8000, 0),
      rawFact('2026-06', 2500, 500, 8500, 0),
    ]),

    advisor('gabriela', 'Gabriela', '2025-12-01', { LIMRA: 70, IGC: 75 }, [
      rawFact('2026-04', 5000, 1000, 2500, 2),
      rawFact('2026-05', 5000, 1000, 2500, 2),
      rawFact('2026-06', 5000, 1000, 2500, 2),
    ]),

    advisor('hector', 'Héctor', '2023-08-01', { LIMRA: 83, IGC: 92 }, [
      rawFact('2026-04', 0, 0, 10000, 0),
      rawFact('2026-05', 0, 0, 12000, 0),
      rawFact('2026-06', 0, 0, 11000, 0),
    ], {
      active: false,
      status: 'inactive',
    }),
  ],
  evidence: {
    officialStatementEvidence: false,
    payoutTruthEvidence: false,
    paidAppliedEconomicEvidence: true,
  },
});

const explanation = explainPartnerAdvisorQualifications({ quarterlyResult: scenario });

const byName = new Map(explanation.advisors.map((advisorExplanation) => [
  advisorExplanation.advisorName,
  advisorExplanation,
]));

assert.equal(scenario.qualificationSummary.qualifiedAdvisorCount, 5);
assert.equal(explanation.qualifiedAdvisorCount, 5);

assert.equal(byName.get('Ana').qualified, true);
assert.equal(byName.get('Bruno').qualified, true);
assert.equal(byName.get('Carla').qualified, true);
assert.equal(byName.get('Diego').qualified, true);

assert.equal(byName.get('Fernando').qualified, true);
assert.ok(byName.get('Fernando').reasons.includes('qualified_by_existing_calculator'));
assert.ok(byName.get('Fernando').reasons.includes('average_monthly_initial_commissions_meets_9000_partner_requirement'));
assert.ok(byName.get('Fernando').warnings.includes('limra_igc_gate_not_applied_life_individual_share_below_60_percent'));

assert.equal(byName.get('Gabriela').qualified, false);
assert.ok(byName.get('Gabriela').blockedReasons.includes('blocked_by_average_monthly_initial_commissions_below_9000_partner_requirement'));
assert.equal(r2(byName.get('Gabriela').metrics.averageMonthlyInitialCommissions), 8500);

assert.equal(byName.get('Héctor').qualified, false);
assert.ok(byName.get('Héctor').blockedReasons.includes('blocked_by_inactive_advisor'));

console.log('PASS partner-advisor-qualification-explainability-engine-test');
