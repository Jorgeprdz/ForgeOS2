const assert = require("assert");

const {
  MANAGER_RDA_ATTRIBUTION_STATUSES,
  evaluateManagerRdaAttributionTruth
} = require("../rda-attribution/manager-rda-attribution-truth-engine");

console.log("\nFORGE MANAGER RDA ATTRIBUTION TRUTH ENGINE MASTER TEST v1.0\n");

const candidate = { candidateId: "CANDIDATE_001" };
const application = { applicationId: "APPLICATION_001" };
const recruit = { recruitIdentityId: "RECRUIT_IDENTITY_001" };
const advisorCandidate = { advisorCandidateId: "ADVISOR_CANDIDATE_001" };

const confirmedAttribution = {
  status: "CONFIRMED",
  rdaOwnerId: "MANAGER_001",
  evidenceConfirmed: true,
  evidenceRefs: ["manager-rda-attribution-evidence-1"],
  sourceEvidenceIds: ["manager-rda-attribution-source-1"]
};

const rdaEvidence = {
  rdaId: "RDA_EVIDENCE_001",
  rdaOwnerId: "MANAGER_001",
  evidenceConfirmed: true,
  evidenceRefs: ["rda-evidence-ref-1"],
  sourceEvidenceIds: ["rda-source-1"]
};

const managerReview = {
  reviewed: true,
  evidenceRefs: ["manager-review-evidence-1"],
  sourceEvidenceIds: ["manager-review-source-1"]
};

const recruitmentRdaPrerequisite = {
  rdaPrerequisiteStatus: "PROVIDED",
  rdaPrerequisiteSatisfied: true,
  evidenceRefs: ["recruitment-rda-prereq-evidence-1"],
  sourceEvidenceIds: ["recruitment-rda-prereq-source-1"]
};

const precontractGate = {
  precontractReviewPacketReady: true,
  evidenceRefs: ["precontract-gate-evidence-1"],
  sourceEvidenceIds: ["precontract-gate-source-1"]
};

function baseInput(overrides = {}) {
  return {
    rdaAttribution: confirmedAttribution,
    rdaEvidence,
    managerReview,
    recruitmentRdaPrerequisite,
    precontractGate,
    candidate,
    application,
    recruit,
    advisorCandidate,
    ...overrides
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoDownstreamTruth(result) {
  assert.equal(result.automaticDecisionAllowed, false);
  assert.equal(result.createsCompensationOwnershipTruth, false);
  assert.equal(result.createsPrecontractTruth, false);
  assert.equal(result.createsAdvisorLifecycleTruth, false);
  assert.equal(result.createsRevenue, false);
  assert.equal(result.createsCompensation, false);
  assert.equal(result.createsPayoutTruth, false);
}

const tests = [
  {
    name: "Confirmed Manager OS attribution creates only Manager/RDA attribution truth",
    run() {
      const result = evaluateManagerRdaAttributionTruth(baseInput());

      assert.equal(result.attributionStatus, MANAGER_RDA_ATTRIBUTION_STATUSES.CONFIRMED);
      assert.equal(result.attributionTruthReady, true);
      assert.equal(result.proposedRdaOwner, "MANAGER_001");
      assert.equal(result.confirmedRdaOwner, "MANAGER_001");
      assert.equal(result.createsManagerOwnershipTruth, true);
      assert.equal(result.createsRdaAttributionTruth, true);
      assert.ok(result.allowedTransitions.includes("MANAGER_OWNERSHIP_TRUTH"));
      assert.ok(result.allowedTransitions.includes("RDA_ATTRIBUTION_TRUTH"));
      assertNoDownstreamTruth(result);
    }
  },
  {
    name: "Missing attribution stays missing and requires evidence",
    run() {
      const result = evaluateManagerRdaAttributionTruth({ candidate, application, recruit });

      assert.equal(result.attributionStatus, MANAGER_RDA_ATTRIBUTION_STATUSES.MISSING);
      assert.equal(result.attributionTruthReady, false);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.missingEvidence.includes("rda_attribution_or_evidence_required"));
      assert.ok(result.missingEvidence.includes("explicit_evidence_confirmed_attribution_required"));
      assert.equal(result.createsManagerOwnershipTruth, false);
      assert.equal(result.createsRdaAttributionTruth, false);
      assertNoDownstreamTruth(result);
    }
  },
  {
    name: "Proposed attribution is not truth",
    run() {
      const result = evaluateManagerRdaAttributionTruth(baseInput({
        rdaAttribution: {
          status: "PROPOSED",
          rdaOwnerId: "MANAGER_001",
          evidenceRefs: ["proposal-evidence-1"]
        }
      }));

      assert.equal(result.attributionStatus, MANAGER_RDA_ATTRIBUTION_STATUSES.PROPOSED);
      assert.equal(result.attributionTruthReady, false);
      assert.equal(result.confirmedRdaOwner, null);
      assert.equal(result.createsRdaAttributionTruth, false);
      assertNoDownstreamTruth(result);
    }
  },
  {
    name: "Provided recruitment prerequisite is not attribution truth",
    run() {
      const result = evaluateManagerRdaAttributionTruth(baseInput({
        rdaAttribution: null,
        rdaEvidence: {
          ...rdaEvidence,
          evidenceConfirmed: false
        }
      }));

      assert.equal(result.attributionStatus, MANAGER_RDA_ATTRIBUTION_STATUSES.PROVIDED);
      assert.equal(result.attributionTruthReady, false);
      assert.ok(result.warnings.some((warning) => warning.includes("Recruitment prerequisite PROVIDED")));
      assert.equal(result.createsRdaAttributionTruth, false);
      assertNoDownstreamTruth(result);
    }
  },
  {
    name: "Confirmed status without evidence gate remains pending review",
    run() {
      const result = evaluateManagerRdaAttributionTruth(baseInput({
        rdaAttribution: {
          status: "CONFIRMED",
          rdaOwnerId: "MANAGER_001",
          evidenceRefs: ["weak-confirmation-1"]
        },
        rdaEvidence: null
      }));

      assert.equal(result.attributionStatus, MANAGER_RDA_ATTRIBUTION_STATUSES.PENDING_REVIEW);
      assert.equal(result.attributionTruthReady, false);
      assert.ok(result.missingEvidence.includes("explicit_evidence_confirmed_attribution_required"));
      assert.ok(result.warnings.some((warning) => warning.includes("lacks required Manager OS evidence gate")));
      assertNoDownstreamTruth(result);
    }
  },
  {
    name: "Manager self-confirmation alone is not truth",
    run() {
      const result = evaluateManagerRdaAttributionTruth(baseInput({
        managerReview: {
          reviewed: true,
          selfConfirmed: true,
          evidenceRefs: ["manager-self-confirmed-1"]
        }
      }));

      assert.equal(result.attributionTruthReady, false);
      assert.equal(result.confirmedRdaOwner, null);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.warnings.some((warning) => warning.includes("self-confirmation")));
      assert.equal(result.createsManagerOwnershipTruth, false);
      assertNoDownstreamTruth(result);
    }
  },
  {
    name: "Compensation intake is not attribution truth",
    run() {
      const result = evaluateManagerRdaAttributionTruth(baseInput({
        rdaAttribution: {
          ...confirmedAttribution,
          source: "compensation_intake"
        }
      }));

      assert.equal(result.attributionTruthReady, true);
      assert.ok(result.warnings.some((warning) => warning.includes("Compensation intake")));
      assert.equal(result.createsCompensationOwnershipTruth, false);
      assert.equal(result.createsCompensation, false);
      assert.equal(result.createsPayoutTruth, false);
    }
  },
  {
    name: "Rejected attribution is reviewed but not automatic rejection",
    run() {
      const result = evaluateManagerRdaAttributionTruth(baseInput({
        rdaAttribution: {
          status: "REJECTED",
          rdaOwnerId: "MANAGER_001",
          evidenceRefs: ["rejection-evidence-1"]
        }
      }));

      assert.equal(result.attributionStatus, MANAGER_RDA_ATTRIBUTION_STATUSES.REJECTED);
      assert.equal(result.attributionTruthReady, false);
      assert.equal(result.automaticDecisionAllowed, false);
      assert.ok(result.blockedTransitions.includes("RDA_ATTRIBUTION_TRUTH"));
      assertNoDownstreamTruth(result);
    }
  },
  {
    name: "Blocked and unknown do not collapse to zero",
    run() {
      ["BLOCKED", "UNKNOWN"].forEach((status) => {
        const result = evaluateManagerRdaAttributionTruth(baseInput({
          rdaAttribution: {
            status,
            rdaOwnerId: "MANAGER_001"
          }
        }));

        assert.equal(result.attributionStatus, MANAGER_RDA_ATTRIBUTION_STATUSES[status]);
        assert.equal(result.attributionTruthReady, false);
        assert.equal(result.humanReviewRequired, true);
        assert.equal(Object.prototype.hasOwnProperty.call(result, "candidateAmount"), false);
        assertNoDownstreamTruth(result);
      });
    }
  },
  {
    name: "Unknown unsupported status becomes not modeled",
    run() {
      const result = evaluateManagerRdaAttributionTruth(baseInput({
        rdaAttribution: {
          status: "SOMETHING_ELSE",
          rdaOwnerId: "MANAGER_001"
        }
      }));

      assert.equal(result.attributionStatus, MANAGER_RDA_ATTRIBUTION_STATUSES.NOT_MODELED);
      assert.equal(result.attributionTruthReady, false);
      assert.ok(result.blockedTransitions.includes("RDA_ATTRIBUTION_TRUTH"));
      assertNoDownstreamTruth(result);
    }
  },
  {
    name: "Forbidden downstream transitions are blocked",
    run() {
      [
        "COMPENSATION_OWNERSHIP_TRUTH",
        "PRECONTRACT",
        "ADVISOR_LIFECYCLE",
        "REVENUE",
        "COMPENSATION",
        "PAYOUT",
        "PAYMENT",
        "AUTOMATIC_APPROVAL",
        "AUTOMATIC_REJECTION"
      ].forEach((requestedTransition) => {
        const result = evaluateManagerRdaAttributionTruth(baseInput({ requestedTransition }));

        assert.ok(result.blockedTransitions.includes(requestedTransition), requestedTransition);
        assertNoDownstreamTruth(result);
      });
    }
  },
  {
    name: "Manager truth transition is blocked unless truth ready",
    run() {
      const result = evaluateManagerRdaAttributionTruth(baseInput({
        requestedTransition: "RDA_ATTRIBUTION_TRUTH",
        managerReview: {
          reviewed: true,
          selfConfirmed: true
        }
      }));

      assert.ok(result.blockedTransitions.includes("RDA_ATTRIBUTION_TRUTH"));
      assert.equal(result.createsRdaAttributionTruth, false);
      assertNoDownstreamTruth(result);
    }
  },
  {
    name: "Evidence refs merge without duplicates",
    run() {
      const result = evaluateManagerRdaAttributionTruth(baseInput({
        rdaAttribution: {
          ...confirmedAttribution,
          evidenceRefs: ["manager-rda-attribution-evidence-1", "precontract-gate-evidence-1"]
        }
      }));

      [
        "manager-rda-attribution-evidence-1",
        "RDA_EVIDENCE_001",
        "rda-evidence-ref-1",
        "manager-review-evidence-1",
        "recruitment-rda-prereq-evidence-1",
        "precontract-gate-evidence-1",
        "CANDIDATE_001",
        "APPLICATION_001",
        "RECRUIT_IDENTITY_001",
        "ADVISOR_CANDIDATE_001"
      ].forEach((ref) => assert.ok(result.evidenceRefs.includes(ref), ref));

      assert.equal(result.evidenceRefs.filter((ref) => ref === "precontract-gate-evidence-1").length, 1);
      assert.ok(result.sourceEvidenceIds.includes("manager-rda-attribution-source-1"));
      assert.ok(result.sourceEvidenceIds.includes("rda-source-1"));
      assertNoDownstreamTruth(result);
    }
  },
  {
    name: "Inputs are not mutated",
    run() {
      const input = baseInput();
      const before = clone(input);

      evaluateManagerRdaAttributionTruth(input);

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
  console.log("\nMANAGER RDA ATTRIBUTION TRUTH ENGINE MASTER TEST NEEDS REVIEW");
  process.exit(1);
}

console.log("\nMANAGER RDA ATTRIBUTION TRUTH ENGINE MASTER TEST PASS");
