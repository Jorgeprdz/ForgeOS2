const assert = require("assert");

const {
  PRECONTRACT_GATE_STATUSES,
  evaluateRecruitmentToPrecontractGate
} = require("../precontract-gate/recruitment-to-precontract-gate");

console.log("\nFORGE RECRUITMENT TO PRECONTRACT GATE MASTER TEST v1.0\n");

const recruit = {
  recruitIdentityId: "RECRUIT_IDENTITY_001"
};

const candidate = {
  candidateId: "CANDIDATE_001"
};

const application = {
  applicationId: "APPLICATION_001"
};

const recruitmentPipeline = {
  readyForPrecontractReview: true,
  pipelineStatus: "READY",
  normalizedPipelineState: "READY_FOR_PRECONTRACT_REVIEW",
  blockedTransitions: [],
  missingEvidence: [],
  evidenceRefs: ["pipeline-evidence-1"],
  sourceEvidenceIds: ["pipeline-source-1"],
  warnings: ["Ready for precontract review is decision support only."],
  confidenceLimitations: [],
  humanReviewRequired: true,
  createsPrecontractTruth: false
};

const candidateAssessment = {
  recommendation: "ADVANCE",
  provenance: {
    evidenceRefs: ["assessment-evidence-1"],
    sourceEvidenceIds: ["assessment-source-1"],
    warnings: [],
    confidenceLimitations: []
  }
};

const interviewFlow = {
  stageStatus: "READY",
  humanReviewRequired: false,
  blockedTransitions: [],
  missingEvidence: [],
  evidenceRefs: ["interview-flow-evidence-1"],
  sourceEvidenceIds: ["interview-source-1"],
  warnings: [],
  confidenceLimitations: []
};

const interviewEvidence = {
  interviewEvidenceId: "INTERVIEW_EVIDENCE_001"
};

const precontractCycle = {
  cycleId: "PRECONTRACT_CYCLE_001",
  cycleStatus: "READY"
};

const precontractActivityEvidence = {
  activityEvidenceId: "PRECONTRACT_ACTIVITY_001"
};

const confirmedRdaAttribution = {
  status: "CONFIRMED",
  evidenceId: "RDA_EVIDENCE_001"
};

function baseInput(overrides = {}) {
  return {
    recruitmentPipeline,
    candidateAssessment,
    interviewFlow,
    interviewEvidence,
    candidate,
    application,
    recruit,
    precontractCycle,
    precontractActivityEvidence,
    rdaAttribution: confirmedRdaAttribution,
    ...overrides
  };
}

function assertBoundaries(result) {
  assert.equal(result.automaticDecisionAllowed, false);
  assert.equal(result.createsPrecontractTruth, false);
  assert.equal(result.createsPrecontractCycle, false);
  assert.equal(result.createsPrecontractActivity, false);
  assert.equal(result.createsAdvisorLifecycleTruth, false);
  assert.equal(result.createsRevenue, false);
  assert.equal(result.createsCompensation, false);
  assert.equal(result.createsPayoutTruth, false);
}

const tests = [
  {
    name: "Ready pipeline produces review packet only",
    run() {
      const result = evaluateRecruitmentToPrecontractGate(baseInput());

      assert.equal(result.gateStatus, PRECONTRACT_GATE_STATUSES.READY_FOR_REVIEW_PACKET);
      assert.equal(result.readyForPrecontractReview, true);
      assert.equal(result.precontractReviewPacketReady, true);
      assert.ok(result.allowedTransitions.includes("PRECONTRACT_REVIEW_PACKET"));
      assertBoundaries(result);
    }
  },
  {
    name: "READY_FOR_PRECONTRACT_REVIEW is not PRECONTRACT",
    run() {
      const result = evaluateRecruitmentToPrecontractGate(baseInput({
        requestedTransition: "PRECONTRACT"
      }));

      assert.ok(result.blockedTransitions.includes("PRECONTRACT"));
      assert.equal(result.precontractReviewPacketReady, false);
      assert.equal(result.createsPrecontractTruth, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Pipeline not ready blocks packet",
    run() {
      const result = evaluateRecruitmentToPrecontractGate(baseInput({
        recruitmentPipeline: {
          ...recruitmentPipeline,
          readyForPrecontractReview: false
        }
      }));

      assert.equal(result.precontractReviewPacketReady, false);
      assert.ok([
        PRECONTRACT_GATE_STATUSES.NEEDS_EVIDENCE,
        PRECONTRACT_GATE_STATUSES.NEEDS_HUMAN_REVIEW
      ].includes(result.gateStatus));
      assert.equal(result.humanReviewRequired, true);
      assertBoundaries(result);
    }
  },
  {
    name: "Candidate Assessment REJECT does not auto-reject but blocks/requires review",
    run() {
      const result = evaluateRecruitmentToPrecontractGate(baseInput({
        candidateAssessment: {
          ...candidateAssessment,
          recommendation: "REJECT"
        }
      }));

      assert.equal(result.precontractReviewPacketReady, false);
      assert.equal(result.automaticDecisionAllowed, false);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.warnings.some((warning) => warning.includes("decision support only")));
      assertBoundaries(result);
    }
  },
  {
    name: "WATCH and COACH require human review",
    run() {
      ["WATCH", "COACH"].forEach((recommendation) => {
        const result = evaluateRecruitmentToPrecontractGate(baseInput({
          candidateAssessment: {
            ...candidateAssessment,
            recommendation
          }
        }));

        assert.equal(result.humanReviewRequired, true);
        assert.equal(result.managerReviewRequired, true);
        assertBoundaries(result);
      });
    }
  },
  {
    name: "Interview Flow blocked blocks packet",
    run() {
      const result = evaluateRecruitmentToPrecontractGate(baseInput({
        interviewFlow: {
          ...interviewFlow,
          stageStatus: "BLOCKED",
          humanReviewRequired: true
        }
      }));

      assert.equal(result.precontractReviewPacketReady, false);
      assert.ok([
        PRECONTRACT_GATE_STATUSES.BLOCKED,
        PRECONTRACT_GATE_STATUSES.NEEDS_HUMAN_REVIEW
      ].includes(result.gateStatus));
      assert.equal(result.humanReviewRequired, true);
      assertBoundaries(result);
    }
  },
  {
    name: "Missing identity or evidence requires review",
    run() {
      const result = evaluateRecruitmentToPrecontractGate({
        recruitmentPipeline: {
          ...recruitmentPipeline,
          evidenceRefs: [],
          sourceEvidenceIds: []
        },
        candidateAssessment: {
          recommendation: "ADVANCE",
          provenance: {}
        },
        interviewFlow: {
          stageStatus: "READY",
          evidenceRefs: [],
          sourceEvidenceIds: []
        },
        candidate: {},
        application: {},
        recruit: {},
        rdaAttribution: confirmedRdaAttribution
      });

      assert.equal(result.precontractReviewPacketReady, false);
      assert.ok(result.missingEvidence.includes("candidate_identity_required"));
      assert.ok(result.missingEvidence.includes("application_identity_required"));
      assert.ok(result.missingEvidence.includes("upstream_evidence_required"));
      assert.equal(result.automaticDecisionAllowed, false);
      assertBoundaries(result);
    }
  },
  {
    name: "RDA missing is surfaced as pending prerequisite, not truth",
    run() {
      const result = evaluateRecruitmentToPrecontractGate(baseInput({
        rdaAttribution: null
      }));

      assert.equal(result.rdaAttributionRequired, true);
      assert.ok(result.missingPrerequisites.includes("rda_manager_attribution_review_required"));
      assert.equal(result.createsCompensation, false);
      assert.equal(result.createsPayoutTruth, false);
      assertBoundaries(result);
    }
  },
  {
    name: "RDA pending or unknown requires review",
    run() {
      ["PENDING", "UNKNOWN"].forEach((status) => {
        const result = evaluateRecruitmentToPrecontractGate(baseInput({
          rdaAttribution: { status }
        }));

        assert.equal(result.humanReviewRequired, true);
        assert.equal(result.rdaAttributionRequired, true);
        assert.equal(result.createsCompensation, false);
        assertBoundaries(result);
      });
    }
  },
  {
    name: "Manager override does not create truth",
    run() {
      const result = evaluateRecruitmentToPrecontractGate(baseInput({
        managerReview: {
          override: true,
          managerId: "MANAGER_001"
        }
      }));

      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.warnings.some((warning) => warning.includes("Manager override")));
      assert.equal(result.createsPrecontractTruth, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Precontract cycle evidence is reference only",
    run() {
      const result = evaluateRecruitmentToPrecontractGate(baseInput({
        precontractCycle: {
          cycleId: "PRECONTRACT_CYCLE_READY_001",
          cycleStatus: "READY"
        }
      }));

      assert.equal(result.precontractReviewPacketReady, true);
      assert.ok(result.evidenceRefs.includes("PRECONTRACT_CYCLE_READY_001"));
      assert.equal(result.createsPrecontractCycle, false);
      assert.equal(result.createsPrecontractTruth, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Expired or closed precontract cycle requires review",
    run() {
      ["KEY_EXPIRED", "CLOSED"].forEach((cycleStatus) => {
        const result = evaluateRecruitmentToPrecontractGate(baseInput({
          precontractCycle: {
            cycleId: `PRECONTRACT_CYCLE_${cycleStatus}`,
            cycleStatus
          }
        }));

        assert.equal(result.humanReviewRequired, true);
        assert.ok(result.warnings.some((warning) => warning.includes(cycleStatus)));
        assert.equal(result.createsPrecontractTruth, false);
        assertBoundaries(result);
      });
    }
  },
  {
    name: "Forbidden downstream transitions are blocked",
    run() {
      [
        "ADVISOR_LIFECYCLE",
        "ADVISOR",
        "ACTIVATION",
        "CONNECTION",
        "REVENUE",
        "COMPENSATION",
        "PAYOUT",
        "PAYMENT"
      ].forEach((requestedTransition) => {
        const result = evaluateRecruitmentToPrecontractGate(baseInput({ requestedTransition }));

        assert.ok(result.blockedTransitions.includes(requestedTransition));
        assert.equal(result.precontractReviewPacketReady, false);
        assertBoundaries(result);
      });
    }
  },
  {
    name: "Evidence refs merge without duplicates",
    run() {
      const result = evaluateRecruitmentToPrecontractGate(baseInput({
        provenance: {
          evidenceRefs: ["external-evidence-1", "pipeline-evidence-1"],
          sourceEvidenceIds: ["external-source-1"]
        },
        interviewEvidence: [
          interviewEvidence,
          { interviewEvidenceId: "INTERVIEW_EVIDENCE_001" }
        ]
      }));

      [
        "pipeline-evidence-1",
        "assessment-evidence-1",
        "interview-flow-evidence-1",
        "external-evidence-1",
        "INTERVIEW_EVIDENCE_001",
        "PRECONTRACT_ACTIVITY_001",
        "PRECONTRACT_CYCLE_001",
        "CANDIDATE_001",
        "APPLICATION_001",
        "RECRUIT_IDENTITY_001"
      ].forEach((ref) => assert.ok(result.evidenceRefs.includes(ref), ref));

      assert.equal(result.evidenceRefs.filter((ref) => ref === "pipeline-evidence-1").length, 1);
      assert.equal(result.evidenceRefs.filter((ref) => ref === "INTERVIEW_EVIDENCE_001").length, 1);
      assert.ok(result.sourceEvidenceIds.includes("external-source-1"));
      assertBoundaries(result);
    }
  }
];

let pass = 0;

tests.forEach((test) => {
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
  console.log("\nRECRUITMENT TO PRECONTRACT GATE MASTER TEST NEEDS REVIEW");
  process.exit(1);
}

console.log("\nRECRUITMENT TO PRECONTRACT GATE MASTER TEST PASS");
