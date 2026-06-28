const assert = require("assert");

const {
  INTERVIEW_STAGES,
  evaluateInterviewFlow,
  normalizeInterviewStage
} = require("../interview-flow/interview-flow-engine");

console.log("\nFORGE INTERVIEW FLOW ENGINE MASTER TEST v1.0\n");

const strongEvidence = {
  interviewEvidenceId: "INTERVIEW_EVIDENCE_001",
  interviewId: "INTERVIEW_001",
  candidateId: "CANDIDATE_001",
  phase: "INITIAL_INTERVIEW",
  recommendation: "ADVANCE",
  questionEvidence: [
    {
      questionEvidenceId: "QUESTION_EVIDENCE_001",
      question: "Why this career?",
      evidence: "Candidate gave concrete career motivation.",
      detectedSignal: "motivation",
      category: "VITAL_FACTOR",
      confidence: 88
    }
  ]
};

function assessment(overrides = {}) {
  return {
    recommendation: "ADVANCE",
    managerAction: "Proceed to Career Interview",
    confidence: 85,
    risks: [],
    provenance: {
      evidenceRefs: ["assessment-evidence-1"],
      sourceEvidenceIds: ["source-1"],
      confidenceLimitations: [],
      warnings: [],
      humanReviewRequired: false
    },
    ...overrides
  };
}

function assertBoundaries(result) {
  assert.equal(result.automaticDecisionAllowed, false);
  assert.equal(result.createsRecruitmentTruth, false);
  assert.equal(result.createsPrecontractTruth, false);
  assert.equal(result.createsAdvisorLifecycleTruth, false);
  assert.equal(result.createsRevenue, false);
  assert.equal(result.createsCompensation, false);
  assert.equal(result.createsPayoutTruth, false);
}

const tests = [
  {
    name: "ADVANCE from INITIAL_INTERVIEW with evidence recommends selection interview",
    run() {
      const result = evaluateInterviewFlow({
        currentStage: "INITIAL_INTERVIEW",
        candidateAssessment: assessment(),
        interviewEvidence: strongEvidence
      });

      assert.equal(result.nextRecommendedStage, INTERVIEW_STAGES.SELECTION_INTERVIEW);
      assert.ok(result.allowedTransitions.includes(INTERVIEW_STAGES.SELECTION_INTERVIEW));
      assert.equal(result.automaticDecisionAllowed, false);
      assertBoundaries(result);
    }
  },
  {
    name: "WATCH candidate routes to additional interview",
    run() {
      const result = evaluateInterviewFlow({
        currentStage: "SELECTION_INTERVIEW",
        candidateAssessment: assessment({
          recommendation: "WATCH",
          managerAction: "Proceed to Additional Interview"
        }),
        interviewEvidence: strongEvidence
      });

      assert.equal(result.humanReviewRequired, true);
      assert.equal(result.nextRecommendedStage, INTERVIEW_STAGES.ADDITIONAL_INTERVIEW);
      assert.equal(result.automaticDecisionAllowed, false);
      assertBoundaries(result);
    }
  },
  {
    name: "REJECT recommendation is not automatic rejection",
    run() {
      const result = evaluateInterviewFlow({
        currentStage: "SELECTION_INTERVIEW",
        candidateAssessment: assessment({
          recommendation: "REJECT",
          managerAction: "Reject Candidate"
        }),
        interviewEvidence: strongEvidence
      });

      assert.equal(result.humanReviewRequired, true);
      assert.equal(result.automaticDecisionAllowed, false);
      assert.ok(result.warnings.some(warning => warning.includes("not automatic rejection")));
      assertBoundaries(result);
    }
  },
  {
    name: "Missing interview evidence requires evidence and review",
    run() {
      const result = evaluateInterviewFlow({
        currentStage: "INITIAL_INTERVIEW",
        candidateAssessment: assessment()
      });

      assert.ok(["NEEDS_EVIDENCE", "NEEDS_HUMAN_REVIEW"].includes(result.stageStatus));
      assert.ok(result.missingEvidence.includes("interview_evidence_required"));
      assert.equal(result.automaticDecisionAllowed, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Skipped transition is blocked without manager override",
    run() {
      const result = evaluateInterviewFlow({
        currentStage: "INITIAL_INTERVIEW",
        requestedTransition: "CAREER_INTERVIEW",
        candidateAssessment: assessment(),
        interviewEvidence: strongEvidence
      });

      assert.ok(result.blockedTransitions.includes(INTERVIEW_STAGES.CAREER_INTERVIEW));
      assert.equal(result.humanReviewRequired, true);
      assertBoundaries(result);
    }
  },
  {
    name: "Manager override allows skipped transition but still requires review",
    run() {
      const result = evaluateInterviewFlow({
        currentStage: "INITIAL_INTERVIEW",
        requestedTransition: "CAREER_INTERVIEW",
        candidateAssessment: assessment(),
        interviewEvidence: strongEvidence,
        managerReview: {
          override: true,
          managerId: "MANAGER_001"
        }
      });

      assert.ok(result.allowedTransitions.includes(INTERVIEW_STAGES.CAREER_INTERVIEW));
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.warnings.some(warning => warning.includes("Manager override")));
      assertBoundaries(result);
    }
  },
  {
    name: "Unknown stage is blocked",
    run() {
      const result = evaluateInterviewFlow({
        currentStage: "UNKNOWN_STAGE",
        requestedTransition: "SELECTION_INTERVIEW",
        candidateAssessment: assessment(),
        interviewEvidence: strongEvidence
      });

      assert.ok(["UNKNOWN", "NOT_MODELED"].includes(result.stageStatus));
      assert.equal(result.humanReviewRequired, true);
      assert.equal(result.automaticDecisionAllowed, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Alias normalization maps known schema stages",
    run() {
      assert.equal(normalizeInterviewStage("FIRST_INTERVIEW"), INTERVIEW_STAGES.INITIAL_INTERVIEW);
      assert.equal(normalizeInterviewStage("SECOND_INTERVIEW"), INTERVIEW_STAGES.SELECTION_INTERVIEW);
      assert.equal(normalizeInterviewStage("FINAL_REVIEW"), INTERVIEW_STAGES.ADDITIONAL_INTERVIEW);
    }
  },
  {
    name: "PRECONTRACT transition is blocked",
    run() {
      const result = evaluateInterviewFlow({
        currentStage: "ADDITIONAL_INTERVIEW",
        requestedTransition: "PRECONTRACT",
        candidateAssessment: assessment(),
        interviewEvidence: strongEvidence
      });

      assert.ok(result.blockedTransitions.includes("PRECONTRACT"));
      assert.equal(result.createsPrecontractTruth, false);
      assert.equal(result.automaticDecisionAllowed, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Provenance refs are preserved from assessment and explicit provenance input",
    run() {
      const result = evaluateInterviewFlow({
        currentStage: "INITIAL_INTERVIEW",
        candidateAssessment: assessment(),
        provenance: {
          evidenceRefs: ["explicit-evidence-1"],
          sourceEvidenceIds: ["explicit-source-1"]
        },
        interviewEvidence: strongEvidence
      });

      assert.ok(result.evidenceRefs.includes("assessment-evidence-1"));
      assert.ok(result.evidenceRefs.includes("explicit-evidence-1"));
      assert.ok(result.evidenceRefs.includes("INTERVIEW_EVIDENCE_001"));
      assert.ok(result.sourceEvidenceIds.includes("source-1"));
      assert.ok(result.sourceEvidenceIds.includes("explicit-source-1"));
      assertBoundaries(result);
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
  console.log("\nINTERVIEW FLOW ENGINE MASTER TEST NEEDS REVIEW");
  process.exit(1);
}

console.log("\nINTERVIEW FLOW ENGINE MASTER TEST PASS");
