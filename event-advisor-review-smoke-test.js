import { buildEventAdvisorReview } from './event-advisor-review-engine.js';

const results = [];
function test(name, fn) { try { fn(); results.push({ name, status: 'PASS' }); } catch (error) { results.push({ name, status: 'FAIL', error: error.message }); } }
function assert(condition, message) { if (!condition) throw new Error(message); }

const review = buildEventAdvisorReview({
  event: 'Hospitalized in Houston',
  eventLabels: ['HOSPITALIZATION', 'FOREIGN_EVENT'],
  missingEvidence: ['diagnosis', 'country'],
  evaluationStatus: 'HUMAN_REVIEW_REQUIRED'
});

test('Advisor summary generated', () => { assert(review.advisorSummary.length > 20, 'Summary missing.'); });
test('What to ask next generated', () => { assert(review.whatToAskNext.endsWith('?'), 'Question missing.'); });
test('What not to promise generated', () => { assert(review.whatNotToPromise.length > 0, 'Promises missing.'); });
test('Evidence to request generated', () => { assert(review.evidenceToRequest.includes('diagnosis'), 'Evidence missing.'); });
test('Expectation risk generated', () => { assert(review.expectationRisk.length > 20, 'Risk missing.'); });

console.log('\nFORGE GMM EVENT ADVISOR REVIEW SMOKE TEST v0.1\n');
for (const result of results) { console.log(`${result.status} ${result.name}`); if (result.error) console.log(`   ${result.error}`); }
console.log(JSON.stringify(review, null, 2));
const failed = results.filter((result) => result.status === 'FAIL');
console.log(`\nSummary:\nTotal: ${results.length}\nPass: ${results.length - failed.length}\nFail: ${failed.length}`);
if (failed.length > 0) process.exit(1);
