const LIFECYCLE_RDA_REFERENCE_STATUSES = Object.freeze({
  NOT_EVALUATED: "NOT_EVALUATED",
  PENDING_REVIEW: "PENDING_REVIEW",
  BLOCKED: "BLOCKED",
  READY_FOR_LIFECYCLE_REFERENCE: "READY_FOR_LIFECYCLE_REFERENCE"
});

const FORBIDDEN_TRANSITIONS = new Set([
  "ADVISOR_LIFECYCLE_TRUTH",
  "PRECONTRACT_TRUTH",
  "COMPENSATION_OWNERSHIP_TRUTH",
  "REVENUE",
  "COMPENSATION",
  "PAYOUT",
  "PAYMENT",
  "AUTOMATIC_APPROVAL",
  "AUTOMATIC_REJECTION"
]);

function present(value) {
  return value !== undefined && value !== null && value !== "";
}

function asArray(value) {
  if (!present(value)) return [];
  return Array.isArray(value) ? value.filter(present) : [value].filter(present);
}

function unique(values) {
  return [...new Set(values.filter(present))];
}

function normalizeText(value) {
  return present(value) ? String(value).trim().toUpperCase() : null;
}

function boundaryFlags() {
  return {
    automaticDecisionAllowed: false,
    createsAdvisorLifecycleTruth: false,
    createsCompensationOwnershipTruth: false,
    createsPrecontractTruth: false,
    createsRevenue: false,
    createsCompensation: false,
    createsPayoutTruth: false
  };
}

function resolveLifecycleRdaReferenceStatus(managerRdaConsumerContract = {}) {
  if (!present(managerRdaConsumerContract) || Object.keys(managerRdaConsumerContract).length === 0) {
    return LIFECYCLE_RDA_REFERENCE_STATUSES.NOT_EVALUATED;
  }

  const contractStatus = normalizeText(managerRdaConsumerContract.contractStatus);

  if (contractStatus === "BLOCKED" || asArray(managerRdaConsumerContract.blockedTransitions).length > 0) {
    return LIFECYCLE_RDA_REFERENCE_STATUSES.BLOCKED;
  }

  if (
    contractStatus === "READY_FOR_REFERENCE" &&
    managerRdaConsumerContract.referenceOnly &&
    managerRdaConsumerContract.referenceOnly.attributionTruthReady === true
  ) {
    return LIFECYCLE_RDA_REFERENCE_STATUSES.READY_FOR_LIFECYCLE_REFERENCE;
  }

  return LIFECYCLE_RDA_REFERENCE_STATUSES.PENDING_REVIEW;
}

function evaluateAdvisorLifecycleRdaReferenceConsumer({
  managerRdaConsumerContract = {},
  advisorLifecycleContext = {},
  requestedTransition = null
} = {}) {
  const lifecycleRdaReferenceStatus = resolveLifecycleRdaReferenceStatus(managerRdaConsumerContract);
  const reference = managerRdaConsumerContract.referenceOnly || {};
  const requested = normalizeText(requestedTransition);
  const warnings = unique([
    ...asArray(managerRdaConsumerContract.warnings),
    ...asArray(advisorLifecycleContext.warnings)
  ]);
  const missingEvidence = unique([
    ...asArray(managerRdaConsumerContract.missingEvidence),
    ...asArray(advisorLifecycleContext.missingEvidence)
  ]);
  const missingPrerequisites = unique([
    ...asArray(managerRdaConsumerContract.missingPrerequisites),
    ...asArray(advisorLifecycleContext.missingPrerequisites)
  ]);
  const allowedTransitions = [];
  const blockedTransitions = [...asArray(managerRdaConsumerContract.blockedTransitions)];

  if (requested && FORBIDDEN_TRANSITIONS.has(requested)) {
    blockedTransitions.push(requested);
    warnings.push(`${requested} transition is forbidden from Advisor Lifecycle RDA reference consumer.`);
  }

  if (!present(managerRdaConsumerContract) || Object.keys(managerRdaConsumerContract).length === 0) {
    missingEvidence.push("manager_rda_consumer_contract_required");
  }

  if (lifecycleRdaReferenceStatus !== LIFECYCLE_RDA_REFERENCE_STATUSES.READY_FOR_LIFECYCLE_REFERENCE) {
    missingPrerequisites.push("manager_rda_reference_ready_required");
    warnings.push("RDA reference is not ready for Advisor Lifecycle reference consumption.");
  } else {
    allowedTransitions.push("USE_RDA_REFERENCE_FOR_LIFECYCLE_REVIEW");
  }

  warnings.push("Advisor Lifecycle RDA reference is read-only and does not create Advisor Lifecycle truth.");
  warnings.push("Advisor Lifecycle RDA reference does not create compensation, revenue, precontract or payout truth.");

  const rdaReferenceReady = lifecycleRdaReferenceStatus === LIFECYCLE_RDA_REFERENCE_STATUSES.READY_FOR_LIFECYCLE_REFERENCE;

  return {
    lifecycleRdaReferenceStatus,
    rdaReferenceReady,
    attributionStatus: reference.attributionStatus || null,
    proposedRdaOwner: reference.proposedRdaOwner || null,
    confirmedRdaOwner: rdaReferenceReady ? reference.confirmedRdaOwner || null : null,
    advisorLifecycleReviewRequired: true,
    humanReviewRequired: true,
    missingEvidence: unique(missingEvidence),
    missingPrerequisites: unique(missingPrerequisites),
    evidenceRefs: unique([
      ...asArray(managerRdaConsumerContract.evidenceRefs),
      ...asArray(reference.evidenceRefs),
      ...asArray(advisorLifecycleContext.evidenceRefs)
    ]),
    sourceEvidenceIds: unique([
      ...asArray(managerRdaConsumerContract.sourceEvidenceIds),
      ...asArray(reference.sourceEvidenceIds),
      ...asArray(advisorLifecycleContext.sourceEvidenceIds)
    ]),
    warnings: unique(warnings),
    allowedTransitions: unique(allowedTransitions),
    blockedTransitions: unique(blockedTransitions),
    ...boundaryFlags()
  };
}

module.exports = {
  LIFECYCLE_RDA_REFERENCE_STATUSES,
  evaluateAdvisorLifecycleRdaReferenceConsumer
};
