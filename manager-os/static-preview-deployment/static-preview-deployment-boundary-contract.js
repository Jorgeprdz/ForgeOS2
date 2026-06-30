/**
 * Static Preview Deployment Boundary Contract
 *
 * GitHub Pages availability is not deployment authorization.
 * This boundary reviews whether a static preview may become a public surface candidate.
 * It never deploys, publishes, mutates GitHub Pages settings, creates public URLs, or configures DNS.
 */

const STATIC_PREVIEW_DEPLOYMENT_STATUSES = Object.freeze({
  READY_FOR_DEPLOYMENT_REVIEW: 'READY_FOR_DEPLOYMENT_REVIEW',
  APPROVED_FOR_PUBLIC_SURFACE_CANDIDATE: 'APPROVED_FOR_PUBLIC_SURFACE_CANDIDATE',
  NEEDS_STATIC_PREVIEW_BOUNDARY: 'NEEDS_STATIC_PREVIEW_BOUNDARY',
  NEEDS_STATIC_PREVIEW_FILES: 'NEEDS_STATIC_PREVIEW_FILES',
  NEEDS_GITHUB_PAGES_CONFIGURATION: 'NEEDS_GITHUB_PAGES_CONFIGURATION',
  NEEDS_REPOSITORY_VISIBILITY_REVIEW: 'NEEDS_REPOSITORY_VISIBILITY_REVIEW',
  NEEDS_BRANCH_SOURCE_REVIEW: 'NEEDS_BRANCH_SOURCE_REVIEW',
  NEEDS_OWNER_APPROVAL: 'NEEDS_OWNER_APPROVAL',
  NEEDS_PUBLIC_SURFACE_LABELING: 'NEEDS_PUBLIC_SURFACE_LABELING',
  NEEDS_SAMPLE_DATA_AUDIT: 'NEEDS_SAMPLE_DATA_AUDIT',
  NEEDS_NO_SECRETS_SCAN: 'NEEDS_NO_SECRETS_SCAN',
  NEEDS_NO_API_SCAN: 'NEEDS_NO_API_SCAN',
  NEEDS_NO_TRACKING_SCAN: 'NEEDS_NO_TRACKING_SCAN',
  NEEDS_NO_STORAGE_SCAN: 'NEEDS_NO_STORAGE_SCAN',
  NEEDS_NO_FORMS_SCAN: 'NEEDS_NO_FORMS_SCAN',
  NEEDS_NO_SERVICE_WORKER_SCAN: 'NEEDS_NO_SERVICE_WORKER_SCAN',
  NEEDS_CACHE_POLICY: 'NEEDS_CACHE_POLICY',
  NEEDS_ROLLBACK_PLAN: 'NEEDS_ROLLBACK_PLAN',
  NEEDS_EXPIRATION_WINDOW: 'NEEDS_EXPIRATION_WINDOW',
  NEEDS_EVIDENCE: 'NEEDS_EVIDENCE',
  NEEDS_SOURCE_OWNER: 'NEEDS_SOURCE_OWNER',
  NEEDS_IDEMPOTENCY_KEY: 'NEEDS_IDEMPOTENCY_KEY',
  PUBLIC_REPOSITORY_RISK_REVIEW: 'PUBLIC_REPOSITORY_RISK_REVIEW',
  UNSAFE_SAMPLE_DATA: 'UNSAFE_SAMPLE_DATA',
  PRODUCTION_DATA_DETECTED: 'PRODUCTION_DATA_DETECTED',
  SECRET_DETECTED: 'SECRET_DETECTED',
  API_CALL_DETECTED: 'API_CALL_DETECTED',
  TRACKING_DETECTED: 'TRACKING_DETECTED',
  STORAGE_WRITE_DETECTED: 'STORAGE_WRITE_DETECTED',
  FORM_SUBMISSION_DETECTED: 'FORM_SUBMISSION_DETECTED',
  SERVICE_WORKER_DETECTED: 'SERVICE_WORKER_DETECTED',
  DEPLOYMENT_EXECUTION_NOT_AUTHORIZED: 'DEPLOYMENT_EXECUTION_NOT_AUTHORIZED',
  GITHUB_PAGES_SETTINGS_MUTATION_NOT_AUTHORIZED: 'GITHUB_PAGES_SETTINGS_MUTATION_NOT_AUTHORIZED',
  DNS_MUTATION_NOT_AUTHORIZED: 'DNS_MUTATION_NOT_AUTHORIZED',
  CUSTOM_DOMAIN_NOT_AUTHORIZED: 'CUSTOM_DOMAIN_NOT_AUTHORIZED',
  EXPIRED_DEPLOYMENT_REVIEW_WINDOW: 'EXPIRED_DEPLOYMENT_REVIEW_WINDOW',
  BLOCKED: 'BLOCKED',
  UNKNOWN: 'UNKNOWN',
  NOT_MODELED: 'NOT_MODELED',
});

const STATIC_PREVIEW_DEPLOYMENT_DECISIONS = Object.freeze({
  REQUEST_DEPLOYMENT_REVIEW: 'REQUEST_DEPLOYMENT_REVIEW',
  APPROVE_PUBLIC_SURFACE_CANDIDATE: 'APPROVE_PUBLIC_SURFACE_CANDIDATE',
  BLOCK_PUBLIC_SURFACE: 'BLOCK_PUBLIC_SURFACE',
  NEEDS_MORE_CONTEXT: 'NEEDS_MORE_CONTEXT',
  EXPIRED: 'EXPIRED',
  NOT_MODELED: 'NOT_MODELED',
});

const STATIC_PREVIEW_DEPLOYMENT_ALLOWED_USES = Object.freeze([
  'STATIC_PREVIEW_DEPLOYMENT_REVIEW',
  'PUBLIC_SURFACE_CANDIDATE_REVIEW',
  'GITHUB_PAGES_CONFIGURATION_REVIEW',
  'SAFE_STATIC_PREVIEW_PUBLICATION_REVIEW',
  'ROLLBACK_PLAN_REVIEW',
]);

const STATIC_PREVIEW_DEPLOYMENT_FORBIDDEN_USES = Object.freeze([
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
  output.deploymentBoundaryStatus = status;
  output.decision = decision;
  if (signal) output.missingSignals = unique([...output.missingSignals, signal]);
  if (blockedUse) output.blockedUses = unique([...output.blockedUses, blockedUse]);
  return output;
}

function baseOutput(input) {
  return {
    deploymentBoundaryStatus: STATIC_PREVIEW_DEPLOYMENT_STATUSES.UNKNOWN,
    decision: STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT,
    staticPreviewDeploymentRequestId: input.staticPreviewDeploymentRequestId || null,
    publicSurfaceCandidate: null,
    eligibleForPublicSurfaceReview: false,
    approvedForGitHubPagesSettingsMutation: false,
    approvedForDeploymentExecution: false,
    createsPublicUrl: false,
    mutatesGitHubPagesSettings: false,
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
    warnings: unique([
      ...asArray(input.warnings),
      ...asArray(input.staticPreviewBoundarySnapshot?.warnings),
      ...asArray(input.githubPagesConfigurationSnapshot?.warnings),
    ]),
    limitations: unique([
      ...asArray(input.limitations),
      ...asArray(input.staticPreviewBoundarySnapshot?.limitations),
      ...asArray(input.githubPagesConfigurationSnapshot?.limitations),
    ]),
    rollbackNotes: unique(asArray(input.rollbackPlanSnapshot?.rollbackNotes || input.rollbackPlanSnapshot?.steps)),
    expirationNotes: unique(asArray(input.expirationWindowSnapshot?.expirationNotes || input.expirationWindowSnapshot?.notes)),
  };
}

function hasStaticPreviewBoundary(snapshot) {
  return hasObject(snapshot)
    && snapshot.implemented === true
    && snapshot.allowedForStaticPreviewCandidate === true
    && snapshot.approvedForGitHubPagesPublish !== true
    && snapshot.deploysApp !== true
    && snapshot.publishesGitHubPages !== true;
}

function hasStaticPreviewFiles(snapshot) {
  const files = asArray(snapshot?.files);
  return reviewed(snapshot)
    && snapshot.sampleDataOnly === true
    && snapshot.readOnly === true
    && snapshot.notProduction === true
    && files.includes('docs/static-preview/forge-alive/index.html')
    && files.includes('docs/static-preview/forge-alive/styles.css')
    && files.includes('docs/static-preview/forge-alive/sample-data.js');
}

function hasGithubPagesConfig(snapshot) {
  return reviewed(snapshot)
    && snapshot.available === true
    && snapshot.settingsMutationRequested !== true
    && snapshot.publishRequested !== true
    && snapshot.deploymentRequested !== true;
}

function hasRepositoryVisibility(snapshot) {
  return reviewed(snapshot) && Boolean(snapshot.visibility);
}

function publicRepositoryNeedsRiskReview(snapshot) {
  return norm(snapshot.visibility) === 'PUBLIC' && snapshot.explicitPublicRepositoryRiskReview !== true;
}

function hasBranchSource(snapshot) {
  return reviewed(snapshot) && Boolean(snapshot.branch) && Boolean(snapshot.sourceDir);
}

function hasOwnerApproval(snapshot) {
  return reviewed(snapshot) && snapshot.approved === true && Boolean(snapshot.owner);
}

function hasPublicSurfaceLabeling(snapshot) {
  return reviewed(snapshot)
    && snapshot.sampleDataLabelVisible === true
    && snapshot.readOnlyLabelVisible === true
    && snapshot.notProductionLabelVisible === true;
}

function hasSampleDataAudit(snapshot) {
  return reviewed(snapshot) && snapshot.safeSampleDataOnly === true;
}

function scanPresent(snapshot) {
  return reviewed(snapshot);
}

function scanFailed(snapshot, flagName) {
  return hasObject(snapshot) && snapshot[flagName] === true;
}

function hasCachePolicy(snapshot) {
  return reviewed(snapshot)
    && snapshot.cachePolicyVisible === true
    && snapshot.noServiceWorker === true
    && snapshot.noStorageWrites === true;
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

function buildStaticPreviewDeploymentBoundary(input = {}) {
  const original = clone(input) || {};
  const output = baseOutput(original);
  const requestedUse = norm(original.requestedUse);

  if (requestedUse && STATIC_PREVIEW_DEPLOYMENT_FORBIDDEN_USES.includes(requestedUse)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.BLOCKED, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, requestedUse);
  }

  if (requestedUse && !STATIC_PREVIEW_DEPLOYMENT_ALLOWED_USES.includes(requestedUse)) {
    output.blockedUses = unique([requestedUse]);
    output.deploymentBoundaryStatus = STATIC_PREVIEW_DEPLOYMENT_STATUSES.NOT_MODELED;
    output.decision = STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NOT_MODELED;
    return output;
  }

  if (requestedUse) output.allowedUses = unique([requestedUse]);

  if (!hasStaticPreviewBoundary(original.staticPreviewBoundarySnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_STATIC_PREVIEW_BOUNDARY, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'staticPreviewBoundarySnapshot');
  }

  if (!hasStaticPreviewFiles(original.staticPreviewFilesSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_STATIC_PREVIEW_FILES, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'staticPreviewFilesSnapshot');
  }

  if (!hasGithubPagesConfig(original.githubPagesConfigurationSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_GITHUB_PAGES_CONFIGURATION, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'githubPagesConfigurationSnapshot');
  }

  if (!hasRepositoryVisibility(original.repositoryVisibilitySnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_REPOSITORY_VISIBILITY_REVIEW, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'repositoryVisibilitySnapshot');
  }

  if (!hasBranchSource(original.branchSourceSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_BRANCH_SOURCE_REVIEW, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'branchSourceSnapshot');
  }

  if (!hasOwnerApproval(original.ownerApprovalSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_OWNER_APPROVAL, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'ownerApprovalSnapshot');
  }

  if (!hasPublicSurfaceLabeling(original.publicSurfaceLabelingSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_PUBLIC_SURFACE_LABELING, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'publicSurfaceLabelingSnapshot');
  }

  if (!hasSampleDataAudit(original.sampleDataAuditSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_SAMPLE_DATA_AUDIT, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'sampleDataAuditSnapshot');
  }

  if (!scanPresent(original.secretsScanSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_NO_SECRETS_SCAN, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'secretsScanSnapshot');
  }

  if (!scanPresent(original.apiScanSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_NO_API_SCAN, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'apiScanSnapshot');
  }

  if (!scanPresent(original.trackingScanSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_NO_TRACKING_SCAN, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'trackingScanSnapshot');
  }

  if (!scanPresent(original.storageScanSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_NO_STORAGE_SCAN, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'storageScanSnapshot');
  }

  if (!scanPresent(original.formsScanSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_NO_FORMS_SCAN, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'formsScanSnapshot');
  }

  if (!scanPresent(original.serviceWorkerScanSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_NO_SERVICE_WORKER_SCAN, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'serviceWorkerScanSnapshot');
  }

  if (!hasCachePolicy(original.cachePolicySnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_CACHE_POLICY, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'cachePolicySnapshot');
  }

  if (!hasRollbackPlan(original.rollbackPlanSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_ROLLBACK_PLAN, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'rollbackPlanSnapshot');
  }

  if (!hasExpirationWindow(original.expirationWindowSnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_EXPIRATION_WINDOW, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'expirationWindowSnapshot');
  }

  if (!hasEvidence(original)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_EVIDENCE, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'evidenceRefs');
  }

  if (!hasSourceOwners(original)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_SOURCE_OWNER, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'sourceOwners');
  }

  if (!original.idempotencyKey) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_IDEMPOTENCY_KEY, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'idempotencyKey');
  }

  if (publicRepositoryNeedsRiskReview(original.repositoryVisibilitySnapshot)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.PUBLIC_REPOSITORY_RISK_REVIEW, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.NEEDS_MORE_CONTEXT, 'explicitPublicRepositoryRiskReview');
  }

  if (original.sampleDataAuditSnapshot.unsafeSampleData === true) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.UNSAFE_SAMPLE_DATA, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, 'UNSAFE_SAMPLE_DATA');
  }

  if (original.sampleDataAuditSnapshot.containsProductionData === true || original.sampleDataAuditSnapshot.containsProductionPii === true) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.PRODUCTION_DATA_DETECTED, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, 'PRODUCTION_DATA_DETECTED');
  }

  if (scanFailed(original.secretsScanSnapshot, 'secretDetected')) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.SECRET_DETECTED, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, 'SECRET_DETECTED');
  }

  if (scanFailed(original.apiScanSnapshot, 'apiCallDetected')) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.API_CALL_DETECTED, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, 'API_CALL_DETECTED');
  }

  if (scanFailed(original.trackingScanSnapshot, 'trackingDetected')) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.TRACKING_DETECTED, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, 'TRACKING_DETECTED');
  }

  if (scanFailed(original.storageScanSnapshot, 'storageWriteDetected')) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.STORAGE_WRITE_DETECTED, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, 'STORAGE_WRITE_DETECTED');
  }

  if (scanFailed(original.formsScanSnapshot, 'formSubmissionDetected')) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.FORM_SUBMISSION_DETECTED, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, 'FORM_SUBMISSION_DETECTED');
  }

  if (scanFailed(original.serviceWorkerScanSnapshot, 'serviceWorkerDetected')) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.SERVICE_WORKER_DETECTED, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, 'SERVICE_WORKER_DETECTED');
  }

  if (original.deploymentExecutionRequested === true || original.approvedForDeploymentExecution === true) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.DEPLOYMENT_EXECUTION_NOT_AUTHORIZED, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, 'DEPLOYMENT_EXECUTION_NOT_AUTHORIZED');
  }

  if (original.githubPagesSettingsMutationRequested === true || original.approvedForGitHubPagesSettingsMutation === true) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.GITHUB_PAGES_SETTINGS_MUTATION_NOT_AUTHORIZED, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, 'GITHUB_PAGES_SETTINGS_MUTATION_NOT_AUTHORIZED');
  }

  if (original.dnsMutationRequested === true || original.mutatesDns === true) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.DNS_MUTATION_NOT_AUTHORIZED, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, 'DNS_MUTATION_NOT_AUTHORIZED');
  }

  if (original.customDomainRequested === true || original.configuresCustomDomain === true) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.CUSTOM_DOMAIN_NOT_AUTHORIZED, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.BLOCK_PUBLIC_SURFACE, null, 'CUSTOM_DOMAIN_NOT_AUTHORIZED');
  }

  if (isExpired(original.expirationWindowSnapshot, original.now)) {
    return block(output, STATIC_PREVIEW_DEPLOYMENT_STATUSES.EXPIRED_DEPLOYMENT_REVIEW_WINDOW, STATIC_PREVIEW_DEPLOYMENT_DECISIONS.EXPIRED, null, 'EXPIRED_DEPLOYMENT_REVIEW_WINDOW');
  }

  output.publicSurfaceCandidate = {
    candidateName: 'Forge Alive Static Preview Public Surface Candidate',
    reviewOnly: true,
    sampleDataOnly: true,
    readOnly: true,
    notProduction: true,
    noDeploymentExecution: true,
    noGitHubPagesSettingsMutation: true,
    noPublicUrlCreation: true,
    noDnsMutation: true,
    noCustomDomain: true,
    githubPagesAvailabilityIsNotDeploymentAuthorization: true,
    files: clone(original.staticPreviewFilesSnapshot.files),
    owner: original.ownerApprovalSnapshot.owner,
    branch: original.branchSourceSnapshot.branch,
    sourceDir: original.branchSourceSnapshot.sourceDir,
  };
  output.eligibleForPublicSurfaceReview = true;
  output.deploymentBoundaryStatus = STATIC_PREVIEW_DEPLOYMENT_STATUSES.APPROVED_FOR_PUBLIC_SURFACE_CANDIDATE;
  output.decision = STATIC_PREVIEW_DEPLOYMENT_DECISIONS.APPROVE_PUBLIC_SURFACE_CANDIDATE;
  output.rollbackNotes = unique([...output.rollbackNotes, 'Rollback plan must remain visible before public surfacing.']);
  output.expirationNotes = unique([...output.expirationNotes, `Review window expires at ${original.expirationWindowSnapshot.expiresAt}.`]);
  return output;
}

module.exports = {
  buildStaticPreviewDeploymentBoundary,
  STATIC_PREVIEW_DEPLOYMENT_STATUSES,
  STATIC_PREVIEW_DEPLOYMENT_DECISIONS,
  STATIC_PREVIEW_DEPLOYMENT_ALLOWED_USES,
  STATIC_PREVIEW_DEPLOYMENT_FORBIDDEN_USES,
};
