/**
 * Public URL Verification Boundary Contract
 *
 * Verification is evidence-review only.
 * This boundary never performs network calls, HTTP requests, DNS lookups, live URL verification,
 * deploys, publishes, mutates GitHub Pages settings, or creates a public URL.
 */

const PUBLIC_URL_VERIFICATION_STATUSES = Object.freeze({
  READY_FOR_PUBLIC_URL_VERIFICATION_REVIEW: 'READY_FOR_PUBLIC_URL_VERIFICATION_REVIEW',
  VERIFIED_FROM_EVIDENCE: 'VERIFIED_FROM_EVIDENCE',
  NOT_VERIFIED_FROM_EVIDENCE: 'NOT_VERIFIED_FROM_EVIDENCE',
  NEEDS_OWNER_PUBLIC_SURFACE_DECISION: 'NEEDS_OWNER_PUBLIC_SURFACE_DECISION',
  NEEDS_PUBLIC_URL_EVIDENCE: 'NEEDS_PUBLIC_URL_EVIDENCE',
  NEEDS_EVIDENCE_FRESHNESS: 'NEEDS_EVIDENCE_FRESHNESS',
  NEEDS_SOURCE_OWNERSHIP: 'NEEDS_SOURCE_OWNERSHIP',
  NEEDS_STATIC_PREVIEW_LABEL_EVIDENCE: 'NEEDS_STATIC_PREVIEW_LABEL_EVIDENCE',
  NEEDS_SAMPLE_DATA_EVIDENCE: 'NEEDS_SAMPLE_DATA_EVIDENCE',
  NEEDS_NO_SECRETS_EVIDENCE: 'NEEDS_NO_SECRETS_EVIDENCE',
  NEEDS_NO_API_EVIDENCE: 'NEEDS_NO_API_EVIDENCE',
  NEEDS_NO_TRACKING_EVIDENCE: 'NEEDS_NO_TRACKING_EVIDENCE',
  NEEDS_NO_STORAGE_EVIDENCE: 'NEEDS_NO_STORAGE_EVIDENCE',
  NEEDS_NO_FORMS_EVIDENCE: 'NEEDS_NO_FORMS_EVIDENCE',
  NEEDS_NO_SERVICE_WORKER_EVIDENCE: 'NEEDS_NO_SERVICE_WORKER_EVIDENCE',
  NEEDS_REPOSITORY_VISIBILITY_REVIEW: 'NEEDS_REPOSITORY_VISIBILITY_REVIEW',
  NEEDS_GITHUB_PAGES_CONFIGURATION: 'NEEDS_GITHUB_PAGES_CONFIGURATION',
  NEEDS_ROLLBACK_PLAN: 'NEEDS_ROLLBACK_PLAN',
  NEEDS_EXPIRATION_WINDOW: 'NEEDS_EXPIRATION_WINDOW',
  NEEDS_EVIDENCE: 'NEEDS_EVIDENCE',
  NEEDS_SOURCE_OWNER: 'NEEDS_SOURCE_OWNER',
  NEEDS_IDEMPOTENCY_KEY: 'NEEDS_IDEMPOTENCY_KEY',
  STALE_EVIDENCE: 'STALE_EVIDENCE',
  UNSAFE_SAMPLE_DATA: 'UNSAFE_SAMPLE_DATA',
  SECRET_DETECTED: 'SECRET_DETECTED',
  API_CALL_DETECTED: 'API_CALL_DETECTED',
  TRACKING_DETECTED: 'TRACKING_DETECTED',
  STORAGE_WRITE_DETECTED: 'STORAGE_WRITE_DETECTED',
  FORM_SUBMISSION_DETECTED: 'FORM_SUBMISSION_DETECTED',
  SERVICE_WORKER_DETECTED: 'SERVICE_WORKER_DETECTED',
  NETWORK_CALL_NOT_AUTHORIZED: 'NETWORK_CALL_NOT_AUTHORIZED',
  HTTP_REQUEST_NOT_AUTHORIZED: 'HTTP_REQUEST_NOT_AUTHORIZED',
  DNS_LOOKUP_NOT_AUTHORIZED: 'DNS_LOOKUP_NOT_AUTHORIZED',
  PUBLIC_URL_CREATION_NOT_AUTHORIZED: 'PUBLIC_URL_CREATION_NOT_AUTHORIZED',
  LIVE_URL_DIRECT_VERIFICATION_NOT_AUTHORIZED: 'LIVE_URL_DIRECT_VERIFICATION_NOT_AUTHORIZED',
  DEPLOYMENT_EXECUTION_NOT_AUTHORIZED: 'DEPLOYMENT_EXECUTION_NOT_AUTHORIZED',
  GITHUB_PAGES_SETTINGS_MUTATION_NOT_AUTHORIZED: 'GITHUB_PAGES_SETTINGS_MUTATION_NOT_AUTHORIZED',
  DNS_MUTATION_NOT_AUTHORIZED: 'DNS_MUTATION_NOT_AUTHORIZED',
  CUSTOM_DOMAIN_NOT_AUTHORIZED: 'CUSTOM_DOMAIN_NOT_AUTHORIZED',
  EXPIRED_PUBLIC_URL_VERIFICATION_WINDOW: 'EXPIRED_PUBLIC_URL_VERIFICATION_WINDOW',
  BLOCKED: 'BLOCKED',
  UNKNOWN: 'UNKNOWN',
  NOT_MODELED: 'NOT_MODELED',
});

const PUBLIC_URL_VERIFICATION_DECISIONS = Object.freeze({
  REQUEST_PUBLIC_URL_VERIFICATION_REVIEW: 'REQUEST_PUBLIC_URL_VERIFICATION_REVIEW',
  VERIFY_FROM_EVIDENCE: 'VERIFY_FROM_EVIDENCE',
  DO_NOT_VERIFY_FROM_EVIDENCE: 'DO_NOT_VERIFY_FROM_EVIDENCE',
  BLOCK_PUBLIC_URL_VERIFICATION: 'BLOCK_PUBLIC_URL_VERIFICATION',
  NEEDS_MORE_CONTEXT: 'NEEDS_MORE_CONTEXT',
  EXPIRED: 'EXPIRED',
  NOT_MODELED: 'NOT_MODELED',
});

const PUBLIC_URL_VERIFICATION_ALLOWED_USES = Object.freeze([
  'PUBLIC_URL_VERIFICATION_REVIEW',
  'OWNER_PROVIDED_URL_EVIDENCE_REVIEW',
  'GITHUB_PAGES_URL_EVIDENCE_REVIEW',
  'MANUAL_BROWSER_EVIDENCE_REVIEW',
  'ROLLBACK_PLAN_REVIEW',
]);

const PUBLIC_URL_VERIFICATION_FORBIDDEN_USES = Object.freeze([
  'NETWORK_CALL',
  'HTTP_REQUEST',
  'DNS_LOOKUP',
  'LIVE_URL_DIRECT_VERIFICATION',
  'PUBLIC_URL_CREATION',
  'ACTUAL_DEPLOYMENT_EXECUTION',
  'GITHUB_PAGES_SETTINGS_MUTATION',
  'DNS_MUTATION',
  'CUSTOM_DOMAIN_SETUP',
  'FORCE_PUBLISH',
  'APP_DEPLOYMENT',
  'LIVE_APP_EXECUTION',
  'API_CALL',
  'PROVIDER_API_CALL',
  'EXTERNAL_API_CALL',
  'AUTHENTICATION',
  'ANALYTICS_TRACKING',
  'COOKIE_WRITE',
  'LOCAL_STORAGE_WRITE',
  'SESSION_STORAGE_WRITE',
  'INDEXED_DB_WRITE',
  'SERVICE_WORKER_REGISTRATION',
  'FORM_SUBMISSION',
  'PERSISTENCE_WRITE',
  'CANONICAL_TRUTH_WRITE',
  'BUSINESS_TRUTH_CREATION',
  'METRIC_TRUTH_CREATION',
  'ECONOMIC_TRUTH_CREATION',
  'COMPENSATION_TRUTH',
  'PAYOUT_TRUTH',
  'REVENUE_TRUTH',
  'HUMAN_RANKING',
  'HR_DECISION',
  'PROMOTION_DECISION',
  'TERMINATION',
  'PERSONALITY_TRUTH',
  'ADVISOR_LIFECYCLE_TRUTH',
  'TASK_CREATION',
  'CALENDAR_CREATION',
  'CRM_MUTATION',
  'SEND_MESSAGE',
  'ACTION_EXECUTION',
  'MANIPULATION',
  'SURVEILLANCE',
]);

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function unique(values) {
  return [...new Set(asArray(values).filter((value) => value !== undefined && value !== null && value !== ''))];
}

function norm(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : undefined;
}

function hasObject(value) {
  return Boolean(value && typeof value === 'object');
}

function reviewed(snapshot) {
  return hasObject(snapshot) && (snapshot.reviewed === true || snapshot.validated === true || snapshot.scanned === true);
}

function block(output, status, decision, signal, blockedUse) {
  output.publicUrlVerificationStatus = status;
  output.decision = decision;
  if (signal) output.missingSignals = unique([...output.missingSignals, signal]);
  if (blockedUse) output.blockedUses = unique([...output.blockedUses, blockedUse]);
  return output;
}

function baseOutput(input) {
  return {
    publicUrlVerificationStatus: PUBLIC_URL_VERIFICATION_STATUSES.UNKNOWN,
    decision: PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT,
    publicUrlVerificationRequestId: input.publicUrlVerificationRequestId || null,
    publicUrlVerificationRecord: null,
    publicUrlEvidenceCandidate: null,
    verifiedFromEvidence: false,
    performsNetworkCall: false,
    callsUrl: false,
    performsHttpRequest: false,
    performsDnsLookup: false,
    createsPublicUrl: false,
    verifiesLiveUrlDirectly: false,
    approvedForDeploymentExecution: false,
    approvedForGitHubPagesSettingsMutation: false,
    mutatesDns: false,
    configuresCustomDomain: false,
    deploysApp: false,
    publishesGitHubPages: false,
    callsApi: false,
    enablesAuth: false,
    enablesAnalytics: false,
    enablesTracking: false,
    writesStorage: false,
    registersServiceWorker: false,
    createsFormSubmission: false,
    mutatesCrm: false,
    createsTask: false,
    createsCalendarEvent: false,
    writesCanonicalTruth: false,
    createsBusinessTruth: false,
    createsMetricTruth: false,
    createsEconomicTruth: false,
    executesAction: false,
    sendsMessage: false,
    metricEconomicTruthRemainsSeparate: true,
    githubPagesAvailabilityIsNotDeploymentAuthorization: true,
    missingSignals: [],
    blockedUses: [],
    allowedUses: [],
    evidenceRefs: unique(input.evidenceRefs),
    sourceEvidenceIds: unique(input.sourceEvidenceIds),
    sourceOwners: unique(input.sourceOwners),
    warnings: unique([
      ...asArray(input.warnings),
      ...asArray(input.publicUrlEvidenceSnapshot?.warnings),
      ...asArray(input.ownerPublicSurfaceDecisionSnapshot?.warnings),
      ...asArray(input.githubPagesConfigurationSnapshot?.warnings),
    ]),
    limitations: unique([
      ...asArray(input.limitations),
      ...asArray(input.publicUrlEvidenceSnapshot?.limitations),
      ...asArray(input.ownerPublicSurfaceDecisionSnapshot?.limitations),
      ...asArray(input.githubPagesConfigurationSnapshot?.limitations),
    ]),
    rollbackNotes: unique(asArray(input.rollbackPlanSnapshot?.rollbackNotes || input.rollbackPlanSnapshot?.steps)),
    expirationNotes: unique(asArray(input.expirationWindowSnapshot?.expirationNotes || input.expirationWindowSnapshot?.notes)),
  };
}

function hasOwnerPublicSurfaceDecision(snapshot) {
  return reviewed(snapshot)
    && snapshot.approvedForPublicSurfaceDecision === true
    && snapshot.ownerDecisionRecordOnly === true
    && snapshot.approvedForDeploymentExecution !== true
    && snapshot.approvedForGitHubPagesSettingsMutation !== true
    && snapshot.createsPublicUrl !== true
    && snapshot.verifiesPublicUrl !== true;
}

function hasPublicUrlEvidence(snapshot) {
  return reviewed(snapshot)
    && snapshot.evidenceOnly === true
    && Boolean(snapshot.claimedUrl)
    && snapshot.claimsStaticPreviewPath === true;
}

function hasEvidenceFreshness(snapshot) {
  return reviewed(snapshot) && Boolean(snapshot.evidenceCapturedAt);
}

function evidenceIsStale(snapshot) {
  return hasObject(snapshot) && (snapshot.fresh === false || snapshot.stale === true);
}

function hasSourceOwnership(snapshot) {
  return reviewed(snapshot) && snapshot.sourceOwned === true && Boolean(snapshot.sourceOwner);
}

function hasStaticPreviewLabelEvidence(snapshot) {
  return reviewed(snapshot)
    && snapshot.staticPreviewLabelVisible === true
    && snapshot.readOnlyLabelVisible === true
    && snapshot.notProductionLabelVisible === true;
}

function hasSampleDataEvidence(snapshot) {
  return reviewed(snapshot) && snapshot.sampleDataOnly === true;
}

function hasEvidenceSnapshot(snapshot) {
  return reviewed(snapshot);
}

function hasRepositoryVisibility(snapshot) {
  return reviewed(snapshot) && Boolean(snapshot.visibility);
}

function hasGithubPagesConfiguration(snapshot) {
  return reviewed(snapshot)
    && snapshot.available === true
    && snapshot.settingsMutationRequested !== true
    && snapshot.publishRequested !== true
    && snapshot.deploymentRequested !== true
    && snapshot.publicUrlCreationRequested !== true;
}

function hasRollbackPlan(snapshot) {
  return reviewed(snapshot) && (snapshot.planAvailable === true || asArray(snapshot.steps).length > 0);
}

function hasExpirationWindow(snapshot) {
  return reviewed(snapshot) && Boolean(snapshot.expiresAt) && snapshot.reviewWindowVisible === true;
}

function isExpired(snapshot, nowValue) {
  if (!hasObject(snapshot) || !snapshot.expiresAt) return false;
  const expiry = new Date(snapshot.expiresAt);
  const now = nowValue ? new Date(nowValue) : new Date();
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() <= now.getTime();
}

function hasEvidence(input) {
  return asArray(input.evidenceRefs).length > 0 && asArray(input.sourceEvidenceIds).length > 0;
}

function hasSourceOwners(input) {
  return asArray(input.sourceOwners).length > 0;
}

function scanFailed(snapshot, flagName) {
  return hasObject(snapshot) && snapshot[flagName] === true;
}

function buildPublicUrlVerificationBoundary(input = {}) {
  const original = clone(input) || {};
  const output = baseOutput(original);
  const requestedUse = norm(original.requestedUse);

  if (requestedUse && PUBLIC_URL_VERIFICATION_FORBIDDEN_USES.includes(requestedUse)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.BLOCKED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, requestedUse);
  }

  if (requestedUse && !PUBLIC_URL_VERIFICATION_ALLOWED_USES.includes(requestedUse)) {
    output.blockedUses = unique([requestedUse]);
    output.publicUrlVerificationStatus = PUBLIC_URL_VERIFICATION_STATUSES.NOT_MODELED;
    output.decision = PUBLIC_URL_VERIFICATION_DECISIONS.NOT_MODELED;
    return output;
  }

  if (requestedUse) output.allowedUses = unique([requestedUse]);

  if (!hasOwnerPublicSurfaceDecision(original.ownerPublicSurfaceDecisionSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_OWNER_PUBLIC_SURFACE_DECISION, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'ownerPublicSurfaceDecisionSnapshot');
  }

  if (!hasPublicUrlEvidence(original.publicUrlEvidenceSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_PUBLIC_URL_EVIDENCE, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'publicUrlEvidenceSnapshot');
  }

  if (!hasEvidenceFreshness(original.evidenceFreshnessSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_EVIDENCE_FRESHNESS, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'evidenceFreshnessSnapshot');
  }

  if (!hasSourceOwnership(original.sourceOwnershipSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_SOURCE_OWNERSHIP, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceOwnershipSnapshot');
  }

  if (!hasStaticPreviewLabelEvidence(original.staticPreviewLabelEvidenceSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_STATIC_PREVIEW_LABEL_EVIDENCE, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'staticPreviewLabelEvidenceSnapshot');
  }

  if (!hasSampleDataEvidence(original.sampleDataEvidenceSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_SAMPLE_DATA_EVIDENCE, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'sampleDataEvidenceSnapshot');
  }

  if (!hasEvidenceSnapshot(original.noSecretsEvidenceSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_NO_SECRETS_EVIDENCE, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'noSecretsEvidenceSnapshot');
  }

  if (!hasEvidenceSnapshot(original.noApiEvidenceSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_NO_API_EVIDENCE, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'noApiEvidenceSnapshot');
  }

  if (!hasEvidenceSnapshot(original.noTrackingEvidenceSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_NO_TRACKING_EVIDENCE, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'noTrackingEvidenceSnapshot');
  }

  if (!hasEvidenceSnapshot(original.noStorageEvidenceSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_NO_STORAGE_EVIDENCE, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'noStorageEvidenceSnapshot');
  }

  if (!hasEvidenceSnapshot(original.noFormsEvidenceSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_NO_FORMS_EVIDENCE, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'noFormsEvidenceSnapshot');
  }

  if (!hasEvidenceSnapshot(original.noServiceWorkerEvidenceSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_NO_SERVICE_WORKER_EVIDENCE, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'noServiceWorkerEvidenceSnapshot');
  }

  if (!hasRepositoryVisibility(original.repositoryVisibilitySnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_REPOSITORY_VISIBILITY_REVIEW, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'repositoryVisibilitySnapshot');
  }

  if (!hasGithubPagesConfiguration(original.githubPagesConfigurationSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_GITHUB_PAGES_CONFIGURATION, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'githubPagesConfigurationSnapshot');
  }

  if (!hasRollbackPlan(original.rollbackPlanSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_ROLLBACK_PLAN, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'rollbackPlanSnapshot');
  }

  if (!hasExpirationWindow(original.expirationWindowSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_EXPIRATION_WINDOW, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'expirationWindowSnapshot');
  }

  if (!hasEvidence(original)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_EVIDENCE, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'evidenceRefs');
  }

  if (!hasSourceOwners(original)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_SOURCE_OWNER, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceOwners');
  }

  if (!original.idempotencyKey) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_IDEMPOTENCY_KEY, PUBLIC_URL_VERIFICATION_DECISIONS.NEEDS_MORE_CONTEXT, 'idempotencyKey');
  }

  if (evidenceIsStale(original.evidenceFreshnessSnapshot)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.STALE_EVIDENCE, PUBLIC_URL_VERIFICATION_DECISIONS.DO_NOT_VERIFY_FROM_EVIDENCE, null, 'STALE_EVIDENCE');
  }

  if (original.sampleDataEvidenceSnapshot.unsafeSampleData === true || original.sampleDataEvidenceSnapshot.sampleDataOnly !== true) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.UNSAFE_SAMPLE_DATA, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'UNSAFE_SAMPLE_DATA');
  }

  if (scanFailed(original.noSecretsEvidenceSnapshot, 'secretDetected')) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.SECRET_DETECTED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'SECRET_DETECTED');
  }

  if (scanFailed(original.noApiEvidenceSnapshot, 'apiCallDetected')) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.API_CALL_DETECTED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'API_CALL_DETECTED');
  }

  if (scanFailed(original.noTrackingEvidenceSnapshot, 'trackingDetected')) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.TRACKING_DETECTED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'TRACKING_DETECTED');
  }

  if (scanFailed(original.noStorageEvidenceSnapshot, 'storageWriteDetected')) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.STORAGE_WRITE_DETECTED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'STORAGE_WRITE_DETECTED');
  }

  if (scanFailed(original.noFormsEvidenceSnapshot, 'formSubmissionDetected')) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.FORM_SUBMISSION_DETECTED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'FORM_SUBMISSION_DETECTED');
  }

  if (scanFailed(original.noServiceWorkerEvidenceSnapshot, 'serviceWorkerDetected')) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.SERVICE_WORKER_DETECTED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'SERVICE_WORKER_DETECTED');
  }

  if (original.networkCallRequested === true || original.performsNetworkCall === true) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.NETWORK_CALL_NOT_AUTHORIZED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'NETWORK_CALL_NOT_AUTHORIZED');
  }

  if (original.httpRequestRequested === true || original.performsHttpRequest === true || original.callsUrl === true) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.HTTP_REQUEST_NOT_AUTHORIZED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'HTTP_REQUEST_NOT_AUTHORIZED');
  }

  if (original.dnsLookupRequested === true || original.performsDnsLookup === true) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.DNS_LOOKUP_NOT_AUTHORIZED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'DNS_LOOKUP_NOT_AUTHORIZED');
  }

  if (original.publicUrlCreationRequested === true || original.createsPublicUrl === true) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.PUBLIC_URL_CREATION_NOT_AUTHORIZED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'PUBLIC_URL_CREATION_NOT_AUTHORIZED');
  }

  if (original.liveUrlDirectVerificationRequested === true || original.verifiesLiveUrlDirectly === true) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.LIVE_URL_DIRECT_VERIFICATION_NOT_AUTHORIZED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'LIVE_URL_DIRECT_VERIFICATION_NOT_AUTHORIZED');
  }

  if (original.deploymentExecutionRequested === true || original.approvedForDeploymentExecution === true) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.DEPLOYMENT_EXECUTION_NOT_AUTHORIZED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'DEPLOYMENT_EXECUTION_NOT_AUTHORIZED');
  }

  if (original.githubPagesSettingsMutationRequested === true || original.approvedForGitHubPagesSettingsMutation === true) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.GITHUB_PAGES_SETTINGS_MUTATION_NOT_AUTHORIZED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'GITHUB_PAGES_SETTINGS_MUTATION_NOT_AUTHORIZED');
  }

  if (original.dnsMutationRequested === true || original.mutatesDns === true) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.DNS_MUTATION_NOT_AUTHORIZED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'DNS_MUTATION_NOT_AUTHORIZED');
  }

  if (original.customDomainRequested === true || original.configuresCustomDomain === true) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.CUSTOM_DOMAIN_NOT_AUTHORIZED, PUBLIC_URL_VERIFICATION_DECISIONS.BLOCK_PUBLIC_URL_VERIFICATION, null, 'CUSTOM_DOMAIN_NOT_AUTHORIZED');
  }

  if (isExpired(original.expirationWindowSnapshot, original.now)) {
    return block(output, PUBLIC_URL_VERIFICATION_STATUSES.EXPIRED_PUBLIC_URL_VERIFICATION_WINDOW, PUBLIC_URL_VERIFICATION_DECISIONS.EXPIRED, null, 'EXPIRED_PUBLIC_URL_VERIFICATION_WINDOW');
  }

  output.publicUrlVerificationRecord = {
    publicUrlVerificationRecordId: original.idempotencyKey,
    evidenceOnly: true,
    verifiedFromEvidence: true,
    claimedUrl: original.publicUrlEvidenceSnapshot.claimedUrl,
    claimedStaticPreviewPath: original.publicUrlEvidenceSnapshot.claimedStaticPreviewPath || 'docs/static-preview/forge-alive/',
    performsNetworkCall: false,
    performsHttpRequest: false,
    performsDnsLookup: false,
    createsPublicUrl: false,
    verifiesLiveUrlDirectly: false,
    githubPagesAvailabilityIsNotDeploymentAuthorization: true,
    evidenceRefs: unique(original.evidenceRefs),
    sourceEvidenceIds: unique(original.sourceEvidenceIds),
    sourceOwners: unique(original.sourceOwners),
  };

  output.publicUrlEvidenceCandidate = {
    reviewOnly: true,
    evidenceOnly: true,
    sampleDataOnly: true,
    readOnly: true,
    notProduction: true,
    noNetworkCall: true,
    noHttpRequest: true,
    noDnsLookup: true,
    noPublicUrlCreation: true,
    noLiveUrlDirectVerification: true,
    noDeploymentExecution: true,
    noSettingsMutation: true,
  };

  output.verifiedFromEvidence = true;
  output.publicUrlVerificationStatus = PUBLIC_URL_VERIFICATION_STATUSES.VERIFIED_FROM_EVIDENCE;
  output.decision = PUBLIC_URL_VERIFICATION_DECISIONS.VERIFY_FROM_EVIDENCE;
  output.rollbackNotes = unique([...output.rollbackNotes, 'Rollback plan must remain visible before any separate execution boundary.']);
  output.expirationNotes = unique([...output.expirationNotes, `URL evidence review window expires at ${original.expirationWindowSnapshot.expiresAt}.`]);
  return output;
}

module.exports = {
  buildPublicUrlVerificationBoundary,
  PUBLIC_URL_VERIFICATION_STATUSES,
  PUBLIC_URL_VERIFICATION_DECISIONS,
  PUBLIC_URL_VERIFICATION_ALLOWED_USES,
  PUBLIC_URL_VERIFICATION_FORBIDDEN_USES,
};
