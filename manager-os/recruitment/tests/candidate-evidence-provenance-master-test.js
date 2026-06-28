const assert = require("assert");
const { evaluateCandidateAssessment } = require("../candidate-intelligence/candidate-assessment-engine");
const { evaluateCandidateEvidenceProvenance } = require("../candidate-intelligence/candidate-evidence-provenance-engine");

console.log("\nFORGE CANDIDATE EVIDENCE PROVENANCE MASTER TEST v1.0\n");

const strongCandidate = {
  hardFactors: {
    age: 35,
    marriage: "MARRIED",
    yearsLivingInTown: 12,
    career: "Commercial Sales Director",
    employmentStatus: "EMPLOYED"
  },
  vitalFactors: {
    mentalAgility: 88,
    drive: 91,
    energy: 86,
    moneyMotivation: 84,
    character: 90,
    integrity: 92,
    successHistory: 85,
    retentionPotential: 87
  },
  coachabilitySignals: {
    completesAssignments: true,
    followsProcess: true,
    attendsInterviews: true,
    memorizesScripts: true,
    acceptsFeedback: true
  },
  marketQuality: {
    project200Size: 170,
    advisorReferralsCount: 4,
    prospectCount: 45,
    networkStrength: 86,
    appointmentPotential: 84
  }
};

function assertDomainBoundaries(provenance) {
  assert.equal(provenance.automaticDecisionAllowed, false);
  assert.equal(provenance.confidenceIsNotEvidenceProvenance, true);
  assert.equal(provenance.createsRecruitmentTruth, false);
  assert.equal(provenance.createsPrecontractTruth, false);
  assert.equal(provenance.createsAdvisorLifecycleTruth, false);
  assert.equal(provenance.createsRevenue, false);
  assert.equal(provenance.createsCompensation, false);
  assert.equal(provenance.createsPayoutTruth, false);
}

const tests = [
  {
    name: "Strong candidate with evidence refs exposes provenance without automatic decision",
    run() {
      const result = evaluateCandidateAssessment({
        ...strongCandidate,
        evidenceRefs: ["interview-1", "market-1"],
        sourceEvidenceIds: ["ev-001"],
        signalEvidenceMap: {
          coachability: ["ev-coach-1"],
          marketQuality: ["ev-market-1"],
          hardFactors: ["ev-hard-1"],
          vitalFactors: ["ev-vital-1"]
        }
      });

      assert.equal(result.recommendation, "ADVANCE");
      assert.equal(result.provenance.provenanceAvailable, true);
      assert.deepEqual(result.provenance.evidenceRefs, ["interview-1", "market-1"]);
      assert.deepEqual(result.provenance.sourceEvidenceIds, ["ev-001"]);
      assert.deepEqual(result.provenance.evidenceBackedSignals, ["coachability", "hardFactors", "marketQuality", "vitalFactors"]);
      assert.deepEqual(result.provenance.inputBackedSignals, []);
      assert.equal(result.provenance.humanReviewRequired, false);
      assertDomainBoundaries(result.provenance);
    }
  },
  {
    name: "Strong candidate without evidence refs remains scored but requires review",
    run() {
      const result = evaluateCandidateAssessment(strongCandidate);

      assert.equal(result.recommendation, "ADVANCE");
      assert.equal(result.provenance.provenanceAvailable, false);
      assert.equal(result.provenance.humanReviewRequired, true);
      assert.ok(result.provenance.warnings.some(warning => warning.includes("Missing evidence provenance")));
      assertDomainBoundaries(result.provenance);
    }
  },
  {
    name: "Contradictory signals require human review",
    run() {
      const result = evaluateCandidateAssessment({
        ...strongCandidate,
        coachabilitySignals: {
          completesAssignments: true,
          followsProcess: true,
          attendsInterviews: true,
          memorizesScripts: true,
          acceptsFeedback: true,
          wantsOwnSystem: true,
          incompleteTasks: true
        },
        evidenceRefs: ["interview-contradiction"],
        signalEvidenceMap: {
          coachability: ["ev-coach-mixed"],
          marketQuality: ["ev-market"],
          hardFactors: ["ev-hard"],
          vitalFactors: ["ev-vital"]
        }
      });

      assert.equal(result.recommendation, "WATCH");
      assert.equal(result.provenance.humanReviewRequired, true);
      assert.equal(result.provenance.automaticDecisionAllowed, false);
      assert.ok(result.provenance.confidenceLimitations.includes("contradictory_candidate_signals_require_review"));
      assertDomainBoundaries(result.provenance);
    }
  },
  {
    name: "Reject recommendation is decision support, not automatic rejection",
    run() {
      const result = evaluateCandidateAssessment({
        ...strongCandidate,
        vitalFactors: {
          mentalAgility: 35,
          drive: 40,
          energy: 35,
          moneyMotivation: 45,
          character: 30,
          integrity: 35,
          successHistory: 25,
          retentionPotential: 30
        },
        evidenceRefs: ["interview-risk"],
        signalEvidenceMap: {
          coachability: ["ev-coach"],
          marketQuality: ["ev-market"],
          hardFactors: ["ev-hard"],
          vitalFactors: ["ev-vital-risk"]
        }
      });

      assert.equal(result.recommendation, "REJECT");
      assert.equal(result.provenance.automaticDecisionAllowed, false);
      assert.equal(result.provenance.humanReviewRequired, true);
      assert.ok(result.provenance.warnings.some(warning => warning.includes("not an automatic decision")));
      assertDomainBoundaries(result.provenance);
    }
  },
  {
    name: "Missing data populates missing signals and confidence limitations",
    run() {
      const result = evaluateCandidateAssessment({
        hardFactors: {
          career: "Retail"
        },
        vitalFactors: {
          drive: 75
        },
        coachabilitySignals: {},
        marketQuality: {},
        evidenceRefs: ["partial-interview"],
        signalEvidenceMap: {
          hardFactors: ["ev-hard-partial"]
        }
      });

      assert.ok(result.confidence < 40);
      assert.ok(result.provenance.missingSignals.length > 0);
      assert.ok(result.provenance.confidenceLimitations.includes("candidate_inputs_missing"));
      assert.equal(result.provenance.humanReviewRequired, true);
      assertDomainBoundaries(result.provenance);
    }
  },
  {
    name: "Evidence map separates evidence-backed and input-backed dimensions",
    run() {
      const result = evaluateCandidateAssessment({
        ...strongCandidate,
        evidenceRefs: ["interview-1"],
        signalEvidenceMap: {
          coachability: ["ev-coach-1"],
          marketQuality: ["ev-market-1"],
          unsupportedDomain: ["ev-unsupported"]
        }
      });

      assert.deepEqual(result.provenance.evidenceBackedSignals, ["coachability", "marketQuality"]);
      assert.deepEqual(result.provenance.inputBackedSignals, ["hardFactors", "vitalFactors"]);
      assert.deepEqual(result.provenance.unsupportedSignals, ["unsupportedDomain"]);
      assert.equal(result.provenance.humanReviewRequired, true);
      assertDomainBoundaries(result.provenance);
    }
  },
  {
    name: "Standalone provenance helper remains usable",
    run() {
      const provenance = evaluateCandidateEvidenceProvenance({
        input: strongCandidate,
        assessment: {
          recommendation: "ADVANCE",
          risks: [],
          confidence: 85
        }
      });

      assert.equal(provenance.provenanceAvailable, false);
      assert.equal(provenance.automaticDecisionAllowed, false);
      assert.equal(provenance.humanReviewRequired, true);
      assertDomainBoundaries(provenance);
    }
  }
];

let pass = 0;

tests.forEach(test => {
  try {
    test.run();
    pass += 1;
    console.log(`PASS ${test.name}`);
  } catch (error) {
    console.log(`FAIL ${test.name}`);
    console.log(error);
  }
});

console.log("\nResumen:");
console.log(`Total: ${tests.length}`);
console.log(`Pass: ${pass}`);
console.log(`Fail: ${tests.length - pass}`);

if (pass !== tests.length) {
  console.log("\nCANDIDATE EVIDENCE PROVENANCE MASTER TEST NEEDS REVIEW");
  process.exit(1);
}

console.log("\nCANDIDATE EVIDENCE PROVENANCE MASTER TEST PASS");
