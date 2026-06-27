'use strict';

const {
  ANNUAL_PRODUCTIVITY_CONNECTION_CONTEXTS
} = require('../compensation/partner-manager/partner-annual-productivity-bonus-contract');

const {
  orchestrateAnnualProductivityBonusCandidates
} = require('../compensation/partner-manager/partner-annual-productivity-bonus-orchestrator');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function productivityCandidate(quarter, amount = 10000, overrides = {}) {
  return {
    quarter,
    status: 'CANDIDATE_CALCULATED',
    calculationPerformed: true,
    candidateAmount: amount,
    payoutTruth: false,
    ...overrides
  };
}

function confirmedEvidence(overrides = {}) {
  return {
    status: 'confirmed',
    ...overrides
  };
}

function annualInput(overrides = {}) {
  return {
    partnerId: 'partner-001',
    year: 2026,
    connectionContext: ANNUAL_PRODUCTIVITY_CONNECTION_CONTEXTS.JAN_JUN_2026,
    quarterlyProductivityBonusCandidates: {
      Q1: productivityCandidate('Q1', 10000),
      Q2: productivityCandidate('Q2', 12000),
      Q3: productivityCandidate('Q3', 14000),
      Q4: productivityCandidate('Q4', 16000)
    },
    quarterlyTAWinnerEvidence: {
      Q1: confirmedEvidence(),
      Q2: confirmedEvidence(),
      Q3: confirmedEvidence(),
      Q4: confirmedEvidence()
    },
    decemberActiveTAWinnerCount: 8,
    decemberActiveTAWinnerEvidence: confirmedEvidence(),
    ...overrides
  };
}

function testOrchestratesSingleAnnualCandidate() {
  const result = orchestrateAnnualProductivityBonusCandidates({
    annualProductivityInput: annualInput()
  });

  assert(result.status === 'ALL_CANDIDATES_CALCULATED', 'Valid single annual input should calculate.');
  assert(result.calculatedAnnualCount === 1, 'One annual result should calculate.');
  assert(result.blockedAnnualCount === 0, 'No result should block.');
  assert(result.annualProductivityBonusBase === 52000, 'Base should be 52000.');
  assert(result.totalCandidateAmount === 5200, 'Candidate should be 10% of base.');
  assert(result.payoutTruth === false, 'Orchestrator must keep payoutTruth false.');
  assert(result.quarterlyProductivityFlowTouched === false, 'Quarterly productivity flow must not be touched.');
  assert(result.annualResults.length === 1, 'One annual result expected.');
}

function testOrchestratesMultipleAnnualCandidates() {
  const result = orchestrateAnnualProductivityBonusCandidates({
    annualProductivityInputs: [
      annualInput({
        partnerId: 'partner-001',
        quarterlyProductivityBonusCandidates: {
          Q1: productivityCandidate('Q1', 10000),
          Q2: productivityCandidate('Q2', 10000),
          Q3: productivityCandidate('Q3', 10000),
          Q4: productivityCandidate('Q4', 10000)
        }
      }),
      annualInput({
        partnerId: 'partner-002',
        connectionContext: ANNUAL_PRODUCTIVITY_CONNECTION_CONTEXTS.JUL_DEC_2026,
        decemberActiveTAWinnerCount: 4,
        quarterlyProductivityBonusCandidates: {
          Q1: productivityCandidate('Q1', 5000),
          Q2: productivityCandidate('Q2', 5000),
          Q3: productivityCandidate('Q3', 5000),
          Q4: productivityCandidate('Q4', 5000)
        }
      })
    ]
  });

  assert(result.status === 'ALL_CANDIDATES_CALCULATED', 'Both annual candidates should calculate.');
  assert(result.calculatedAnnualCount === 2, 'Two annual results should calculate.');
  assert(result.blockedAnnualCount === 0, 'No annual result should block.');
  assert(result.annualProductivityBonusBase === 60000, 'Base should sum both annual bases.');
  assert(result.totalCandidateAmount === 6000, 'Candidate should sum 4000 + 2000.');
  assert(result.annualResults[1].decemberActiveTAWinnerThreshold === 4, 'Second result should use Jul-Dec threshold 4.');
}

function testMissingAnnualInputsBlocksWithoutZero() {
  const result = orchestrateAnnualProductivityBonusCandidates({});

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'Missing annual inputs should block.');
  assert(result.totalCandidateAmount === null, 'Missing annual inputs must not become zero.');
  assert(result.annualProductivityBonusBase === null, 'Missing annual inputs must not create base zero.');
  assert(result.payoutTruth === false, 'Missing inputs must keep payoutTruth false.');
  assert(
    result.blockingReasons.includes('NO_ANNUAL_PRODUCTIVITY_INPUTS'),
    'Missing annual inputs reason required.'
  );
}

function testPartialWithOneBlockedAnnualCandidate() {
  const result = orchestrateAnnualProductivityBonusCandidates({
    annualProductivityInputs: [
      annualInput({
        partnerId: 'partner-good',
        quarterlyProductivityBonusCandidates: {
          Q1: productivityCandidate('Q1', 10000),
          Q2: productivityCandidate('Q2', 10000),
          Q3: productivityCandidate('Q3', 10000),
          Q4: productivityCandidate('Q4', 10000)
        }
      }),
      annualInput({
        partnerId: 'partner-blocked',
        quarterlyProductivityBonusCandidates: {
          Q1: productivityCandidate('Q1', 10000),
          Q2: productivityCandidate('Q2', 10000),
          Q3: productivityCandidate('Q3', 10000)
        }
      })
    ]
  });

  assert(result.status === 'PARTIAL_WITH_BLOCKS', 'One calculated plus one blocked should be partial.');
  assert(result.calculatedAnnualCount === 1, 'Only one annual result should calculate.');
  assert(result.blockedAnnualCount === 1, 'One annual result should block.');
  assert(result.totalCandidateAmount === 4000, 'Blocked annual result must not be summed.');
  assert(
    result.blockingReasons.includes('Q4_MISSING_PRODUCTIVITY_BONUS_CANDIDATE'),
    'Missing Q4 reason required.'
  );
}

function testDecemberThresholdBlockPropagates() {
  const result = orchestrateAnnualProductivityBonusCandidates({
    annualProductivityInput: annualInput({
      decemberActiveTAWinnerCount: 7
    })
  });

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'December threshold miss should block.');
  assert(result.totalCandidateAmount === null, 'Threshold miss must not become zero.');
  assert(
    result.blockingReasons.includes('DECEMBER_ACTIVE_TA_WINNER_THRESHOLD_NOT_MET'),
    'Threshold reason required.'
  );
}

function testTAWinnerEvidenceBlockPropagates() {
  const result = orchestrateAnnualProductivityBonusCandidates({
    annualProductivityInput: annualInput({
      quarterlyTAWinnerEvidence: {
        Q1: confirmedEvidence(),
        Q2: confirmedEvidence(),
        Q3: confirmedEvidence()
      }
    })
  });

  assert(result.status === 'BLOCKED_OR_UNKNOWN', 'Missing quarterly TA evidence should block.');
  assert(result.totalCandidateAmount === null, 'Missing TA evidence must not become zero.');
  assert(
    result.blockingReasons.includes('Q4_TA_WINNER_EVIDENCE_NOT_CONFIRMED'),
    'Missing Q4 TA reason required.'
  );
}

testOrchestratesSingleAnnualCandidate();
testOrchestratesMultipleAnnualCandidates();
testMissingAnnualInputsBlocksWithoutZero();
testPartialWithOneBlockedAnnualCandidate();
testDecemberThresholdBlockPropagates();
testTAWinnerEvidenceBlockPropagates();

console.log('PASS partner-annual-productivity-bonus-orchestrator-test');
