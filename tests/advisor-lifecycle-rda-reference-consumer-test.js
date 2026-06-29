const assert = require("assert");

const {
  mapManagerRdaAttributionForConsumer
} = require("../manager-os/rda-attribution/manager-rda-consumer-contract");

const {
  evaluateManagerRdaAttributionTruth
} = require("../manager-os/rda-attribution/manager-rda-attribution-truth-engine");

const {
  LIFECYCLE_RDA_REFERENCE_STATUSES,
  evaluateAdvisorLifecycleRdaReferenceConsumer
} = require("../advisor-lifecycle/advisor-lifecycle-rda-reference-consumer");

console.log("\nFORGE ADVISOR LIFECYCLE RDA REFERENCE CONSUMER TEST v1.0\n");

const confirmedTruth = evaluateManagerRdaAttributionTruth({
  rdaAttribution: {
    status: "CONFIRMED",
    proposedRdaOwner: "MANAGER_001",
    confirmedRdaOwner: "MANAGER_001",
    evidenceConfirmed: true,
    evidenceRefs: ["rda-attribution-evidence-1"],
    sourceEvidenceIds: ["rda-attribution-source-1"]
  },
  rdaEvidence: {
    rdaId: "RDA_EVIDENCE_001",
    candidateId: "CANDIDATE_001",
    sourceAdvisor: "MANAGER_001",
    evidenceRefs: ["rda-evidence-ref-1"],
    sourceEvidenceIds: ["rda-source-1"]
  },
  managerReview: {
    reviewed: true,
    independentReview: true,
    evidenceRefs: ["manager-review-evidence-1"],
    sourceEvidenceIds: ["manager-review-source-1"]
  },
  candidate: { candidateId: "CANDIDATE_001" },
  application: { applicationId: "APPLICATION_001" },
  recruit: { recruitIdentityId: "RECRUIT_001" }
});

const readyContract = mapManagerRdaAttributionForConsumer({
  attributionTruth: confirmedTruth,
  consumerMode: "ADVISOR_LIFECYCLE_REFERENCE"
});

function assertBoundaries(result) {
  assert.equal(result.automaticDecisionAllowed, false);
  assert.equal(result.createsAdvisorLifecycleTruth, false);
  assert.equal(result.createsCompensationOwnershipTruth, false);
  assert.equal(result.createsPrecontractTruth, false);
  assert.equal(result.createsRevenue, false);
  assert.equal(result.createsCompensation, false);
  assert.equal(result.createsPayoutTruth, false);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const tests = [
  {
    name: "Ready Manager RDA contract becomes lifecycle reference only",
    run() {
      const result = evaluateAdvisorLifecycleRdaReferenceConsumer({
        managerRdaConsumerContract: readyContract
      });

      assert.equal(result.lifecycleRdaReferenceStatus, LIFECYCLE_RDA_REFERENCE_STATUSES.READY_FOR_LIFECYCLE_REFERENCE);
      assert.equal(result.rdaReferenceReady, true);
      assert.equal(result.confirmedRdaOwner, "MANAGER_001");
      assert.ok(result.allowedTransitions.includes("USE_RDA_REFERENCE_FOR_LIFECYCLE_REVIEW"));
      assert.equal(result.advisorLifecycleReviewRequired, true);
      assert.equal(result.humanReviewRequired, true);
      assertBoundaries(result);
    }
  },
  {
    name: "Missing contract is not evaluated and requires evidence",
    run() {
      const result = evaluateAdvisorLifecycleRdaReferenceConsumer({});

      assert.equal(result.lifecycleRdaReferenceStatus, LIFECYCLE_RDA_REFERENCE_STATUSES.NOT_EVALUATED);
      assert.equal(result.rdaReferenceReady, false);
      assert.ok(result.missingEvidence.includes("manager_rda_consumer_contract_required"));
      assert.ok(result.missingPrerequisites.includes("manager_rda_reference_ready_required"));
      assertBoundaries(result);
    }
  },
  {
    name: "Proposed attribution remains pending review",
    run() {
      const proposedTruth = evaluateManagerRdaAttributionTruth({
        rdaAttribution: {
          status: "PROPOSED",
          proposedRdaOwner: "MANAGER_001"
        },
        candidate: { candidateId: "CANDIDATE_001" }
      });

      const contract = mapManagerRdaAttributionForConsumer({
        attributionTruth: proposedTruth,
        consumerMode: "ADVISOR_LIFECYCLE_REFERENCE"
      });

      const result = evaluateAdvisorLifecycleRdaReferenceConsumer({
        managerRdaConsumerContract: contract
      });

      assert.equal(result.lifecycleRdaReferenceStatus, LIFECYCLE_RDA_REFERENCE_STATUSES.PENDING_REVIEW);
      assert.equal(result.confirmedRdaOwner, null);
      assert.equal(result.rdaReferenceReady, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Blocked contract remains blocked",
    run() {
      const result = evaluateAdvisorLifecycleRdaReferenceConsumer({
        managerRdaConsumerContract: {
          contractStatus: "BLOCKED",
          referenceOnly: {
            attributionStatus: "BLOCKED",
            attributionTruthReady: false
          },
          blockedTransitions: ["PAYOUT"]
        }
      });

      assert.equal(result.lifecycleRdaReferenceStatus, LIFECYCLE_RDA_REFERENCE_STATUSES.BLOCKED);
      assert.equal(result.rdaReferenceReady, false);
      assert.ok(result.blockedTransitions.includes("PAYOUT"));
      assertBoundaries(result);
    }
  },
  {
    name: "Forbidden lifecycle/downstream transitions are blocked",
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
        const result = evaluateAdvisorLifecycleRdaReferenceConsumer({
          managerRdaConsumerContract: readyContract,
          requestedTransition
        });

        assert.ok(result.blockedTransitions.includes(requestedTransition));
        assert.equal(result.humanReviewRequired, true);
        assertBoundaries(result);
      });
    }
  },
  {
    name: "Advisor Lifecycle truth is never created",
    run() {
      const result = evaluateAdvisorLifecycleRdaReferenceConsumer({
        managerRdaConsumerContract: readyContract,
        requestedTransition: "ADVISOR_LIFECYCLE_TRUTH"
      });

      assert.equal(result.createsAdvisorLifecycleTruth, false);
      assert.equal(result.automaticDecisionAllowed, false);
      assertBoundaries(result);
    }
  },
  {
    name: "Compensation revenue and payout truth remain false",
    run() {
      const result = evaluateAdvisorLifecycleRdaReferenceConsumer({
        managerRdaConsumerContract: readyContract
      });

      assert.equal(result.createsCompensationOwnershipTruth, false);
      assert.equal(result.createsRevenue, false);
      assert.equal(result.createsCompensation, false);
      assert.equal(result.createsPayoutTruth, false);
      assert.equal(Object.prototype.hasOwnProperty.call(result, "candidateAmount"), false);
      assertBoundaries(result);
    }
  },
  {
    name: "Evidence refs merge without duplicates",
    run() {
      const result = evaluateAdvisorLifecycleRdaReferenceConsumer({
        managerRdaConsumerContract: {
          ...readyContract,
          evidenceRefs: ["same-ref", "contract-ref"],
          sourceEvidenceIds: ["same-source", "contract-source"],
          referenceOnly: {
            ...readyContract.referenceOnly,
            evidenceRefs: ["same-ref", "reference-ref"],
            sourceEvidenceIds: ["same-source", "reference-source"]
          }
        },
        advisorLifecycleContext: {
          evidenceRefs: ["same-ref", "lifecycle-ref"],
          sourceEvidenceIds: ["same-source", "lifecycle-source"]
        }
      });

      assert.deepEqual(result.evidenceRefs.sort(), ["contract-ref", "lifecycle-ref", "reference-ref", "same-ref"].sort());
      assert.deepEqual(result.sourceEvidenceIds.sort(), ["contract-source", "lifecycle-source", "reference-source", "same-source"].sort());
      assertBoundaries(result);
    }
  },
  {
    name: "Inputs are not mutated",
    run() {
      const input = {
        managerRdaConsumerContract: readyContract,
        advisorLifecycleContext: {
          evidenceRefs: ["lifecycle-ref"]
        }
      };
      const before = clone(input);

      evaluateAdvisorLifecycleRdaReferenceConsumer(input);

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
  console.log("\nADVISOR LIFECYCLE RDA REFERENCE CONSUMER TEST NEEDS REVIEW");
  process.exit(1);
}

console.log("\nADVISOR LIFECYCLE RDA REFERENCE CONSUMER TEST PASS");
