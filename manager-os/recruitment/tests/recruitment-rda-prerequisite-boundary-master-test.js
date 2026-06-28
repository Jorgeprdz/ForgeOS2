const assert = require("assert");

const {
  RECRUITMENT_RDA_PREREQUISITE_STATUSES,
  evaluateRecruitmentRdaPrerequisiteBoundary
} = require("../rda-boundary/recruitment-rda-prerequisite-boundary");

console.log("\nFORGE RECRUITMENT RDA PREREQUISITE BOUNDARY MASTER TEST v1.0\n");

const recruit = { recruitIdentityId: "RECRUIT_IDENTITY_001" };
const candidate = { candidateId: "CANDIDATE_001" };
const application = { applicationId: "APPLICATION_001" };

const recruitmentPipeline = {
  readyForPrecontractReview: true,
  evidenceRefs: ["pipeline-evidence-1"],
  sourceEvidenceIds: ["pipeline-source-1"],
  warnings: [],
  confidenceLimitations: []
};

const precontractGate = {
  precontractReviewPacketReady: true,
  rdaAttributionRequired: false,
  missingPrerequisites: [],
  evidenceRefs: ["precontract-gate-evidence-1"],
  sourceEvidenceIds: ["precontract-gate-source-1"],
  warnings: [],
  confidenceLimitations: []
};

const rdaEvidence = {
  rdaId: "RDA_EVIDENCE_001",
  candidateId: "CANDIDATE_001",
  sourceAdvisor: "ADVISOR_SOURCE_001",
  evidenceRefs: ["rda-evidence-ref-1"],
  sourceEvidenceIds: ["rda-source-1"]
};

const providedAttribution = {
  status: "PROVIDED",
  evidenceRefs: ["rda-attribution-evidence-1"],
  sourceEvidenceIds: ["rda-attribution-source-1"]
};

function baseInput(overrides = {}) {
  return {
    rdaAttribution: providedAttribution,
    rdaEvidence,
    recruitmentPipeline,
    precontractGate,
    candidate,
    application,
    recruit,
    managerReview: {
      reviewed: true,
      evidenceRefs: ["manager-review-evidence-1"],
      sourceEvidenceIds: ["manager-review-source-1"]
    },
    provenance: {
      evidenceRefs: ["provenance-evidence-1"],
      sourceEvidenceIds: ["provenance-source-1"]
    },
    ...overrides
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertBoundaries(result) {
  assert.equal(result.automaticDecisionAllowed, false);
  assert.equal(result.createsManagerOwnershipTruth, false);
  assert.equal(result.createsRdaAttributionTruth, false);
  assert.equal(result.createsCompensationOwnershipTruth, false);
  assert.equal(result.createsPrecontractTruth, false);
  assert.equal(result.createsAdvisorLifecycleTruth, false);
  assert.equal(result.createsRevenue, false);
  assert.equal(result.createsCompensation, false);
  assert.equal(result.createsPayoutTruth, false);
}

const tests = [
  {
    name: "Missing RDA requires prerequisite review",
    run() {
      const result = evaluateRecruitmentRdaPrerequisiteBoundary({
        candidate,
        application,
        recruit
      });

      assert.equal(result.rdaPrerequisiteStatus, RECRUITMENT_RDA_PREREQUISITE_STATUSES.MISSING);
      assert.equal(result.rdaAttributionRequired, true);
      assert.equal(result.humanReviewRequired, true);
      assert.equal(result.managerReviewRequired, true);
      assert.ok(result.missingPrerequisites.includes("rda_manager_attribution_review_required"));
      assert.equal(result.rdaPrerequisiteSatisfied, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Pending RDA remains prerequisite only",
    run() {
      const result = evaluateRecruitmentRdaPrerequisiteBoundary(baseInput({
        rdaAttribution: { status: "PENDING" }
      }));

      assert.equal(result.rdaPrerequisiteStatus, RECRUITMENT_RDA_PREREQUISITE_STATUSES.PENDING);
      assert.equal(result.rdaPrerequisiteSatisfied, false);
      assert.equal(result.humanReviewRequired, true);
      assertBoundaries(result);
    }
  },
  {
    name: "Unknown RDA requires review",
    run() {
      const result = evaluateRecruitmentRdaPrerequisiteBoundary(baseInput({
        rdaAttribution: { status: "UNKNOWN" }
      }));

      assert.equal(result.rdaPrerequisiteStatus, RECRUITMENT_RDA_PREREQUISITE_STATUSES.UNKNOWN);
      assert.equal(result.humanReviewRequired, true);
      assert.equal(result.automaticDecisionAllowed, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Blocked RDA blocks downstream truth",
    run() {
      const result = evaluateRecruitmentRdaPrerequisiteBoundary(baseInput({
        rdaAttribution: { status: "BLOCKED" }
      }));

      assert.equal(result.rdaPrerequisiteStatus, RECRUITMENT_RDA_PREREQUISITE_STATUSES.BLOCKED);
      assert.ok(result.blockedTransitions.includes("RDA_ATTRIBUTION_TRUTH"));
      assert.equal(result.rdaPrerequisiteSatisfied, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Review required status requires manager and human review",
    run() {
      const result = evaluateRecruitmentRdaPrerequisiteBoundary(baseInput({
        rdaAttribution: { status: "REVIEW_REQUIRED" }
      }));

      assert.equal(result.rdaPrerequisiteStatus, RECRUITMENT_RDA_PREREQUISITE_STATUSES.REVIEW_REQUIRED);
      assert.equal(result.managerReviewRequired, true);
      assert.equal(result.humanReviewRequired, true);
      assertBoundaries(result);
    }
  },
  {
    name: "Provided or confirmed RDA is evidence only",
    run() {
      ["PROVIDED", "CONFIRMED"].forEach((status) => {
        const result = evaluateRecruitmentRdaPrerequisiteBoundary(baseInput({
          rdaAttribution: { status }
        }));

        assert.equal(result.rdaPrerequisiteStatus, RECRUITMENT_RDA_PREREQUISITE_STATUSES.PROVIDED);
        assert.equal(result.rdaPrerequisiteSatisfied, true);
        assert.equal(result.createsRdaAttributionTruth, false);
        assert.equal(result.createsCompensationOwnershipTruth, false);
        assert.equal(result.createsCompensation, false);
        assert.equal(result.createsPayoutTruth, false);
        assert.ok(result.warnings.some((warning) => warning.includes("not ownership truth")));
        assertBoundaries(result);
      });
    }
  },
  {
    name: "Strong RDA evidence is not ownership truth",
    run() {
      const result = evaluateRecruitmentRdaPrerequisiteBoundary(baseInput({
        rdaAttribution: null,
        rdaEvidence,
        managerReview: {}
      }));

      assert.equal(result.rdaPrerequisiteStatus, RECRUITMENT_RDA_PREREQUISITE_STATUSES.PROVIDED);
      assert.ok(result.evidenceRefs.includes("RDA_EVIDENCE_001"));
      assert.equal(result.createsRdaAttributionTruth, false);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.warnings.some((warning) => warning.includes("not RDA attribution truth")));
      assertBoundaries(result);
    }
  },
  {
    name: "Manager self-confirmation is not ownership truth",
    run() {
      const result = evaluateRecruitmentRdaPrerequisiteBoundary(baseInput({
        managerReview: {
          reviewed: true,
          selfConfirmed: true
        }
      }));

      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.warnings.some((warning) => warning.includes("self-confirmation")));
      assert.equal(result.createsManagerOwnershipTruth, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Manager override is not ownership truth",
    run() {
      const result = evaluateRecruitmentRdaPrerequisiteBoundary(baseInput({
        managerReview: {
          reviewed: true,
          override: true
        }
      }));

      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.warnings.some((warning) => warning.includes("Manager override")));
      assert.equal(result.createsManagerOwnershipTruth, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Precontract gate RDA requirement is preserved",
    run() {
      const result = evaluateRecruitmentRdaPrerequisiteBoundary(baseInput({
        precontractGate: {
          ...precontractGate,
          rdaAttributionRequired: true
        }
      }));

      assert.equal(result.rdaAttributionRequired, true);
      assert.ok(result.missingPrerequisites.includes("rda_manager_attribution_review_required"));
      assert.equal(result.createsRdaAttributionTruth, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Forbidden transitions are blocked",
    run() {
      [
        "MANAGER_OWNERSHIP_TRUTH",
        "RDA_ATTRIBUTION_TRUTH",
        "COMPENSATION_OWNERSHIP_TRUTH",
        "PRECONTRACT",
        "ADVISOR_LIFECYCLE",
        "REVENUE",
        "COMPENSATION",
        "PAYOUT",
        "PAYMENT"
      ].forEach((requestedTransition) => {
        const result = evaluateRecruitmentRdaPrerequisiteBoundary(baseInput({ requestedTransition }));

        assert.ok(result.blockedTransitions.includes(requestedTransition));
        assertBoundaries(result);
      });
    }
  },
  {
    name: "Evidence refs merge without duplicates",
    run() {
      const result = evaluateRecruitmentRdaPrerequisiteBoundary(baseInput({
        rdaAttribution: {
          status: "PROVIDED",
          evidenceRefs: ["rda-attribution-evidence-1", "pipeline-evidence-1"],
          sourceEvidenceIds: ["rda-attribution-source-1"]
        }
      }));

      [
        "rda-attribution-evidence-1",
        "RDA_EVIDENCE_001",
        "rda-evidence-ref-1",
        "pipeline-evidence-1",
        "precontract-gate-evidence-1",
        "provenance-evidence-1",
        "manager-review-evidence-1",
        "CANDIDATE_001",
        "APPLICATION_001",
        "RECRUIT_IDENTITY_001"
      ].forEach((ref) => assert.ok(result.evidenceRefs.includes(ref), ref));

      assert.equal(result.evidenceRefs.filter((ref) => ref === "pipeline-evidence-1").length, 1);
      assert.ok(result.sourceEvidenceIds.includes("rda-attribution-source-1"));
      assert.ok(result.sourceEvidenceIds.includes("rda-source-1"));
      assertBoundaries(result);
    }
  },
  {
    name: "Unknown unrecognized RDA status is not modeled",
    run() {
      const result = evaluateRecruitmentRdaPrerequisiteBoundary(baseInput({
        rdaAttribution: { status: "SOMETHING_ELSE" }
      }));

      assert.equal(result.rdaPrerequisiteStatus, RECRUITMENT_RDA_PREREQUISITE_STATUSES.NOT_MODELED);
      assert.equal(result.humanReviewRequired, true);
      assert.equal(result.rdaPrerequisiteSatisfied, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Inputs are not mutated",
    run() {
      const input = baseInput();
      const before = clone(input);

      evaluateRecruitmentRdaPrerequisiteBoundary(input);

      assert.deepEqual(input, before);
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
  console.log("\nRECRUITMENT RDA PREREQUISITE BOUNDARY MASTER TEST NEEDS REVIEW");
  process.exit(1);
}

console.log("\nRECRUITMENT RDA PREREQUISITE BOUNDARY MASTER TEST PASS");
