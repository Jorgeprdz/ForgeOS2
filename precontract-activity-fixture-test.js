const fs = require("fs");
const path = require("path");

console.log("\nFORGE PRECONTRACT ACTIVITY EVIDENCE FIXTURE TEST v1.0\n");

const fixtureDir = path.join(__dirname, "fixtures", "recruitment", "evidence");
const fixtures = ["precontract-activity-high.json", "precontract-activity-low.json"];

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, fileName), "utf8"));
}

function isIsoDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isNonNegativeNumber(value) {
  return typeof value === "number" && value >= 0;
}

function validateActivityEvidence(data) {
  return (
    typeof data.activityEvidenceId === "string" &&
    typeof data.candidateId === "string" &&
    isIsoDate(data.capturedAt) &&
    isNonNegativeNumber(data.calls) &&
    isNonNegativeNumber(data.referrals) &&
    isNonNegativeNumber(data.rda) &&
    isNonNegativeNumber(data.initialInterviews) &&
    isNonNegativeNumber(data.closingInterviews) &&
    isNonNegativeNumber(data.applications) &&
    isNonNegativeNumber(data.paidPolicies) &&
    isNonNegativeNumber(data.trainingSessions) &&
    Array.isArray(data.certifications) &&
    Array.isArray(data.evaluations) &&
    isNonNegativeNumber(data.twentyFivePointScore)
  );
}

let pass = 0;

fixtures.forEach(fileName => {
  const data = readFixture(fileName);
  const ok = validateActivityEvidence(data);

  console.log(`${ok ? "PASS" : "FAIL"} ${fileName}`);
  if (ok) pass++;
});

const high = readFixture("precontract-activity-high.json");
const low = readFixture("precontract-activity-low.json");
const scenarioOk =
  high.scenario === "high_activity" &&
  low.scenario === "low_activity" &&
  high.calls > low.calls &&
  high.referrals > low.referrals &&
  high.rda > low.rda &&
  high.initialInterviews > low.initialInterviews &&
  high.closingInterviews > low.closingInterviews &&
  high.applications > low.applications &&
  high.paidPolicies > low.paidPolicies &&
  high.twentyFivePointScore > low.twentyFivePointScore;

console.log(`${scenarioOk ? "PASS" : "FAIL"} scenario coverage: high and low activity`);
if (scenarioOk) pass++;

const total = fixtures.length + 1;

console.log("\nResumen:");
console.log(`Total: ${total}`);
console.log(`Pass: ${pass}`);
console.log(`Fail: ${total - pass}`);

if (pass !== total) {
  console.log("\nPRECONTRACT ACTIVITY EVIDENCE FIXTURE TEST NEEDS REVIEW");
  process.exit(1);
}

console.log("\nPRECONTRACT ACTIVITY EVIDENCE FIXTURE TEST PASS");
