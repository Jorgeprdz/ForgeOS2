const assert = require("assert");

const {
  CANONICAL_CAREER_STAGES,
  CAREER_CHAIN_CONTRACT_STATUSES,
  evaluateAdvisorLifecycleCareerChainContract
} = require("../advisor-lifecycle/advisor-lifecycle-career-chain-contract");

console.log("\nFORGE ADVISOR LIFECYCLE CAREER CHAIN CONTRACT TEST v1.0\n");

function removedStageLabel() {
  return `${"Senior"} ${"Advisor"}`;
}

function removedStageEnum() {
  return ["SENIOR", "ADVISOR"].join("_");
}

function assertNoTruth(result) {
  assert.equal(result.automaticDecisionAllowed, false);
  assert.equal(result.createsAdvisorLifecycleTruth, false);
  assert.equal(result.createsCompensationOwnershipTruth, false);
  assert.equal(result.createsPrecontractTruth, false);
  assert.equal(result.createsRevenue, false);
  assert.equal(result.createsCompensation, false);
  assert.equal(result.createsPayoutTruth, false);
}

function assertReadyReference(result, stage, label, position) {
  assert.equal(result.careerChainStatus, CAREER_CHAIN_CONTRACT_STATUSES.READY_FOR_REFERENCE);
  assert.equal(result.canonicalCareerStage, stage);
  assert.equal(result.routeLabel, label);
  assert.equal(result.routePosition, position);
  assert.equal(result.advisorLifecycleReviewRequired, true);
  assert.equal(result.humanReviewRequired, true);
  assertNoTruth(result);
}

const tests = [
  {
    name: "Candidate maps to Candidate reference only",
    run() {
      const result = evaluateAdvisorLifecycleCareerChainContract({ advisorStatus: "CANDIDATE" });
      assertReadyReference(result, CANONICAL_CAREER_STAGES.CANDIDATE, "Candidate", 1);
    }
  },
  {
    name: "Precontract maps to Precontract reference only",
    run() {
      const result = evaluateAdvisorLifecycleCareerChainContract({ advisorStatus: "PRECONTRACT" });
      assertReadyReference(result, CANONICAL_CAREER_STAGES.PRECONTRACT, "Precontract", 2);
    }
  },
  {
    name: "Active maps to Advisor reference only",
    run() {
      const result = evaluateAdvisorLifecycleCareerChainContract({ advisorStatus: "ACTIVE" });
      assertReadyReference(result, CANONICAL_CAREER_STAGES.ADVISOR, "Advisor", 3);
    }
  },
  {
    name: "Connected lifecycle statuses map to Advisor reference only",
    run() {
      ["connected_active", "advisor_development", "new_professional", "professional"].forEach((lifecycleStatus) => {
        const result = evaluateAdvisorLifecycleCareerChainContract({ lifecycleStatus });
        assertReadyReference(result, CANONICAL_CAREER_STAGES.ADVISOR, "Advisor", 3);
      });
    }
  },
  {
    name: "Manager maps to Manager Partner reference only",
    run() {
      const result = evaluateAdvisorLifecycleCareerChainContract({ advisorStatus: "MANAGER" });
      assertReadyReference(result, CANONICAL_CAREER_STAGES.MANAGER_PARTNER, "Manager / Partner", 4);
    }
  },
  {
    name: "Partner maps to Manager Partner reference only",
    run() {
      const result = evaluateAdvisorLifecycleCareerChainContract({ advisorStatus: "PARTNER" });
      assertReadyReference(result, CANONICAL_CAREER_STAGES.MANAGER_PARTNER, "Manager / Partner", 4);
    }
  },
  {
    name: "Director maps to Director reference only",
    run() {
      const result = evaluateAdvisorLifecycleCareerChainContract({ advisorStatus: "DIRECTOR" });
      assertReadyReference(result, CANONICAL_CAREER_STAGES.DIRECTOR, "Director", 5);
    }
  },
  {
    name: "Inactive does not collapse to zero",
    run() {
      const result = evaluateAdvisorLifecycleCareerChainContract({ advisorStatus: "INACTIVE" });
      assert.equal(result.careerChainStatus, CAREER_CHAIN_CONTRACT_STATUSES.NEEDS_REVIEW);
      assert.equal(result.canonicalCareerStage, null);
      assert.equal(result.routeLabel, "Inactive reference - review required");
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.missingPrerequisites.includes("inactive_status_requires_lifecycle_review"));
      assertNoTruth(result);
    }
  },
  {
    name: "Unknown status is not modeled and needs review",
    run() {
      const result = evaluateAdvisorLifecycleCareerChainContract({ advisorStatus: "SURPRISE" });
      assert.equal(result.careerChainStatus, CAREER_CHAIN_CONTRACT_STATUSES.NOT_MODELED);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.missingPrerequisites.includes("modeled_career_chain_status_required"));
      assertNoTruth(result);
    }
  },
  {
    name: "Removed advisor stage label and enum are not modeled",
    run() {
      [removedStageLabel(), removedStageEnum()].forEach((advisorStatus) => {
        const result = evaluateAdvisorLifecycleCareerChainContract({ advisorStatus });
        assert.equal(result.careerChainStatus, CAREER_CHAIN_CONTRACT_STATUSES.NOT_MODELED);
        assert.equal(result.canonicalCareerStage, null);
        assert.equal(result.humanReviewRequired, true);
        assertNoTruth(result);
      });
    }
  },
  {
    name: "Missing input remains not evaluated",
    run() {
      const result = evaluateAdvisorLifecycleCareerChainContract();
      assert.equal(result.careerChainStatus, CAREER_CHAIN_CONTRACT_STATUSES.NOT_EVALUATED);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.missingEvidence.includes("advisor_lifecycle_status_required"));
      assertNoTruth(result);
    }
  },
  {
    name: "Blocked input remains blocked",
    run() {
      const result = evaluateAdvisorLifecycleCareerChainContract({ advisorStatus: "BLOCKED" });
      assert.equal(result.careerChainStatus, CAREER_CHAIN_CONTRACT_STATUSES.BLOCKED);
      assert.equal(result.humanReviewRequired, true);
      assert.ok(result.missingPrerequisites.includes("blocked_career_chain_status_requires_review"));
      assertNoTruth(result);
    }
  },
  {
    name: "Forbidden downstream transitions remain blocked",
    run() {
      [
        "ADVISOR_LIFECYCLE_TRUTH",
        "PRECONTRACT_TRUTH",
        "COMPENSATION_OWNERSHIP_TRUTH",
        "REVENUE",
        "COMPENSATION",
        "PAYOUT",
        "PAYMENT",
        "AUTOMATIC_APPROVAL",
        "AUTOMATIC_REJECTION"
      ].forEach((requestedTransition) => {
        const result = evaluateAdvisorLifecycleCareerChainContract({
          advisorStatus: "ACTIVE",
          requestedTransition
        });
        assert.ok(result.blockedTransitions.includes(requestedTransition));
        assertNoTruth(result);
      });
    }
  },
  {
    name: "Evidence refs merge without duplicates",
    run() {
      const result = evaluateAdvisorLifecycleCareerChainContract({
        advisorStatus: "ACTIVE",
        advisorId: "ADVISOR_001",
        evidenceRefs: ["career-chain-evidence-1", "advisor-evidence-1"],
        sourceEvidenceIds: ["source-1"],
        advisor: {
          advisorId: "ADVISOR_001",
          evidenceRefs: ["advisor-evidence-1", "advisor-evidence-2"],
          sourceEvidenceIds: ["source-1", "source-2"]
        }
      });
      assert.deepEqual(result.evidenceRefs.sort(), [
        "ADVISOR_001",
        "advisor-evidence-1",
        "advisor-evidence-2",
        "career-chain-evidence-1"
      ].sort());
      assert.deepEqual(result.sourceEvidenceIds.sort(), ["source-1", "source-2"].sort());
      assertNoTruth(result);
    }
  },
  {
    name: "Inputs are not mutated",
    run() {
      const input = {
        advisorStatus: "ACTIVE",
        evidenceRefs: ["evidence-1"],
        advisor: {
          advisorId: "ADVISOR_001",
          evidenceRefs: ["advisor-evidence-1"]
        }
      };
      const before = JSON.parse(JSON.stringify(input));
      evaluateAdvisorLifecycleCareerChainContract(input);
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
  console.log("\nADVISOR LIFECYCLE CAREER CHAIN CONTRACT TEST NEEDS REVIEW");
  process.exit(1);
}

console.log("\nADVISOR LIFECYCLE CAREER CHAIN CONTRACT TEST PASS");
