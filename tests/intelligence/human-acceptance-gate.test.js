// tests/intelligence/human-acceptance-gate.test.js
const assert = require('assert');
const gate = require('../../src/intelligence/semantic-guardrails/human-acceptance-gate');

const validCandidate = {
    type: "commitment_established",
    owner: "advisor",
    action: "send proposal",
    due: "monday",
    quality: "strong",
    confidence: 0.82,
    evidence_span: "el lunes le paso una propuesta",
    source: "semantic_extractor",
    model_version: "alpha-v0.2-experimental",
    generated_at: "2026-06-17T00:00:00.000Z",
    review_status: "proposed",
    unknowns: []
};

async function runTests() {
    console.log('Test 1: Propose valid candidate');
    const record = gate.propose(validCandidate, 'advisor-1');
    assert.strictEqual(record.status, 'proposed');
    assert.strictEqual(record.candidate.evidence_span, validCandidate.evidence_span);

    console.log('Test 2: Reject invalid candidate before proposal');
    assert.throws(() => gate.propose({}, 'advisor-1'), /Invalid candidate/);

    console.log('Test 3: Accept proposed candidate');
    let record2 = gate.propose(validCandidate, 'advisor-1');
    record2 = gate.accept(record2, 'advisor-1');
    assert.strictEqual(record2.status, 'accepted');

    console.log('Test 4: Reject proposed candidate with reason');
    let record3 = gate.propose(validCandidate, 'advisor-1');
    record3 = gate.reject(record3, 'advisor-1', 'Not relevant');
    assert.strictEqual(record3.status, 'rejected');

    console.log('Test 5: Expire proposed candidate with reason');
    let record4 = gate.propose(validCandidate, 'advisor-1');
    record4 = gate.expire(record4, 'system', 'Timeout');
    assert.strictEqual(record4.status, 'expired');

    console.log('Test 6: Reject acceptance without actor');
    const record5 = gate.propose(validCandidate, 'advisor-1');
    assert.throws(() => gate.accept(record5, null), /Actor is required/);

    console.log('Test 7: Reject rejection without reason');
    const record6 = gate.propose(validCandidate, 'advisor-1');
    assert.throws(() => gate.reject(record6, 'advisor-1', null), /Reason is required/);

    console.log('Test 8, 9, 10: Check canEnterLedger');
    const rAccepted = gate.accept(gate.propose(validCandidate, 'advisor-1'), 'advisor-1');
    assert.strictEqual(gate.getStatus(rAccepted).canEnterLedger, true);

    const rRejected = gate.reject(gate.propose(validCandidate, 'advisor-1'), 'advisor-1', 'Reason');
    assert.strictEqual(gate.getStatus(rRejected).canEnterLedger, false);

    const rExpired = gate.expire(gate.propose(validCandidate, 'advisor-1'), 'system', 'Reason');
    assert.strictEqual(gate.getStatus(rExpired).canEnterLedger, false);

    console.log('Test 11: Expired candidate cannot be accepted later');
    const rExpired2 = gate.expire(gate.propose(validCandidate, 'advisor-1'), 'system', 'Reason');
    assert.throws(() => gate.accept(rExpired2, 'advisor-1'), /Cannot transition from expired/);
}

runTests().then(() => console.log('All gate tests passed')).catch(err => {
    console.error('Test failed', err);
    process.exit(1);
});
