const assert = require('assert');
const {
  buildStaticPreviewDeploymentBoundary,
  STATIC_PREVIEW_DEPLOYMENT_STATUSES,
  STATIC_PREVIEW_DEPLOYMENT_ALLOWED_USES,
  STATIC_PREVIEW_DEPLOYMENT_FORBIDDEN_USES,
} = require('../static-preview-deployment/static-preview-deployment-boundary-contract');

function futureDate() {
  return new Date(Date.now() + 86400000).toISOString();
}

function validInput(overrides = {}) {
  return {
    staticPreviewDeploymentRequestId: 'deploy-review-1',
    staticPreviewBoundarySnapshot: {
      implemented: true,
      allowedForStaticPreviewCandidate: true,
      approvedForGitHubPagesPublish: false,
      deploysApp: false,
      publishesGitHubPages: false,
      warnings: ['public surface candidate only'],
      limitations: ['no deploy execution'],
    },
    staticPreviewFilesSnapshot: {
      reviewed: true,
      readOnly: true,
      sampleDataOnly: true,
      notProduction: true,
      files: [
        'docs/static-preview/forge-alive/index.html',
        'docs/static-preview/forge-alive/styles.css',
        'docs/static-preview/forge-alive/sample-data.js',
      ],
    },
    githubPagesConfigurationSnapshot: {
      reviewed: true,
      available: true,
      settingsMutationRequested: false,
      publishRequested: false,
      deploymentRequested: false,
      warnings: ['availability is not authorization'],
    },
    repositoryVisibilitySnapshot: {
      reviewed: true,
      visibility: 'PRIVATE',
      explicitPublicRepositoryRiskReview: false,
    },
    branchSourceSnapshot: {
      reviewed: true,
      branch: 'main',
      sourceDir: 'docs',
    },
    ownerApprovalSnapshot: {
      reviewed: true,
      approved: true,
      owner: 'Forge Owner',
    },
    publicSurfaceLabelingSnapshot: {
      reviewed: true,
      sampleDataLabelVisible: true,
      readOnlyLabelVisible: true,
      notProductionLabelVisible: true,
    },
    sampleDataAuditSnapshot: {
      reviewed: true,
      safeSampleDataOnly: true,
      containsProductionData: false,
      containsProductionPii: false,
      unsafeSampleData: false,
    },
    secretsScanSnapshot: {
      scanned: true,
      secretDetected: false,
    },
    apiScanSnapshot: {
      scanned: true,
      apiCallDetected: false,
    },
    trackingScanSnapshot: {
      scanned: true,
      trackingDetected: false,
    },
    storageScanSnapshot: {
      scanned: true,
      storageWriteDetected: false,
    },
    formsScanSnapshot: {
      scanned: true,
      formSubmissionDetected: false,
    },
    serviceWorkerScanSnapshot: {
      scanned: true,
      serviceWorkerDetected: false,
    },
    cachePolicySnapshot: {
      reviewed: true,
      cachePolicyVisible: true,
      noServiceWorker: true,
      noStorageWrites: true,
    },
    rollbackPlanSnapshot: {
      reviewed: true,
      planAvailable: true,
      steps: ['revert public surface candidate if review fails'],
    },
    expirationWindowSnapshot: {
      reviewed: true,
      reviewWindowVisible: true,
      expiresAt: futureDate(),
      notes: ['review window visible'],
    },
    evidenceRefs: ['044B-certificate'],
    sourceEvidenceIds: ['ae6062c'],
    sourceOwners: ['Forge Architecture'],
    idempotencyKey: 'deployment-boundary-idem-1',
    requestedUse: 'PUBLIC_SURFACE_CANDIDATE_REVIEW',
    now: new Date().toISOString(),
    ...overrides,
  };
}

function assertAllForbiddenRemainFalse(output) {
  const flags = [
    'approvedForGitHubPagesSettingsMutation',
    'approvedForDeploymentExecution',
    'createsPublicUrl',
    'mutatesGitHubPagesSettings',
    'mutatesDns',
    'configuresCustomDomain',
    'deploysApp',
    'publishesGitHubPages',
    'callsApi',
    'enablesAuth',
    'enablesAnalytics',
    'enablesTracking',
    'writesStorage',
    'registersServiceWorker',
    'createsFormSubmission',
    'mutatesCrm',
    'createsTask',
    'createsCalendarEvent',
    'writesCanonicalTruth',
    'createsBusinessTruth',
    'createsMetricTruth',
    'createsEconomicTruth',
    'executesAction',
    'sendsMessage',
  ];
  for (const flag of flags) assert.strictEqual(output[flag], false, flag);
}

const tests = [];
tests.push(['missing static preview boundary snapshot blocks', () => {
  assert.ok(STATIC_PREVIEW_DEPLOYMENT_ALLOWED_USES.includes('PUBLIC_SURFACE_CANDIDATE_REVIEW'));
  assert.ok(STATIC_PREVIEW_DEPLOYMENT_FORBIDDEN_USES.includes('ACTUAL_DEPLOYMENT_EXECUTION'));
  const out = buildStaticPreviewDeploymentBoundary(validInput({ staticPreviewBoundarySnapshot: null }));
  assert.strictEqual(out.deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_STATIC_PREVIEW_BOUNDARY);
  assertAllForbiddenRemainFalse(out);
}]);
tests.push(['missing static preview files snapshot blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ staticPreviewFilesSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_STATIC_PREVIEW_FILES)]);
tests.push(['missing GitHub Pages configuration blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ githubPagesConfigurationSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_GITHUB_PAGES_CONFIGURATION)]);
tests.push(['missing repository visibility review blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ repositoryVisibilitySnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_REPOSITORY_VISIBILITY_REVIEW)]);
tests.push(['missing branch source review blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ branchSourceSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_BRANCH_SOURCE_REVIEW)]);
tests.push(['missing owner approval blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ ownerApprovalSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_OWNER_APPROVAL)]);
tests.push(['missing public surface labeling blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ publicSurfaceLabelingSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_PUBLIC_SURFACE_LABELING)]);
tests.push(['missing sample data audit blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ sampleDataAuditSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_SAMPLE_DATA_AUDIT)]);
tests.push(['missing no-secrets scan blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ secretsScanSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_NO_SECRETS_SCAN)]);
tests.push(['missing no-API scan blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ apiScanSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_NO_API_SCAN)]);
tests.push(['missing no-tracking scan blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ trackingScanSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_NO_TRACKING_SCAN)]);
tests.push(['missing no-storage scan blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ storageScanSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_NO_STORAGE_SCAN)]);
tests.push(['missing no-forms scan blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ formsScanSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_NO_FORMS_SCAN)]);
tests.push(['missing no-service-worker scan blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ serviceWorkerScanSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_NO_SERVICE_WORKER_SCAN)]);
tests.push(['missing cache policy blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ cachePolicySnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_CACHE_POLICY)]);
tests.push(['missing rollback plan blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ rollbackPlanSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_ROLLBACK_PLAN)]);
tests.push(['missing expiration window blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ expirationWindowSnapshot: null })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_EXPIRATION_WINDOW)]);
tests.push(['missing evidence blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ evidenceRefs: [] })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_EVIDENCE)]);
tests.push(['missing source owner blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ sourceOwners: [] })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_SOURCE_OWNER)]);
tests.push(['missing idempotency key blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ idempotencyKey: '' })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.NEEDS_IDEMPOTENCY_KEY)]);
tests.push(['public repository risk requires explicit review', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ repositoryVisibilitySnapshot: { reviewed: true, visibility: 'PUBLIC', explicitPublicRepositoryRiskReview: false } })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.PUBLIC_REPOSITORY_RISK_REVIEW)]);
tests.push(['unsafe sample data blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ sampleDataAuditSnapshot: { reviewed: true, safeSampleDataOnly: true, containsProductionData: false, containsProductionPii: false, unsafeSampleData: true } })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.UNSAFE_SAMPLE_DATA)]);
tests.push(['production data blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ sampleDataAuditSnapshot: { reviewed: true, safeSampleDataOnly: true, containsProductionData: true, containsProductionPii: false, unsafeSampleData: false } })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.PRODUCTION_DATA_DETECTED)]);
tests.push(['secret scan failure blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ secretsScanSnapshot: { scanned: true, secretDetected: true } })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.SECRET_DETECTED)]);
tests.push(['API scan failure blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ apiScanSnapshot: { scanned: true, apiCallDetected: true } })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.API_CALL_DETECTED)]);
tests.push(['tracking scan failure blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ trackingScanSnapshot: { scanned: true, trackingDetected: true } })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.TRACKING_DETECTED)]);
tests.push(['storage scan failure blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ storageScanSnapshot: { scanned: true, storageWriteDetected: true } })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.STORAGE_WRITE_DETECTED)]);
tests.push(['form scan failure blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ formsScanSnapshot: { scanned: true, formSubmissionDetected: true } })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.FORM_SUBMISSION_DETECTED)]);
tests.push(['service worker scan failure blocks', () => assert.strictEqual(buildStaticPreviewDeploymentBoundary(validInput({ serviceWorkerScanSnapshot: { scanned: true, serviceWorkerDetected: true } })).deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.SERVICE_WORKER_DETECTED)]);
tests.push(['actual deployment execution remains false', () => { const out = buildStaticPreviewDeploymentBoundary(validInput({ deploymentExecutionRequested: true })); assert.strictEqual(out.deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.DEPLOYMENT_EXECUTION_NOT_AUTHORIZED); assert.strictEqual(out.approvedForDeploymentExecution, false); }]);
tests.push(['GitHub Pages settings mutation remains false', () => { const out = buildStaticPreviewDeploymentBoundary(validInput({ githubPagesSettingsMutationRequested: true })); assert.strictEqual(out.deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.GITHUB_PAGES_SETTINGS_MUTATION_NOT_AUTHORIZED); assert.strictEqual(out.mutatesGitHubPagesSettings, false); }]);
tests.push(['DNS mutation remains false', () => { const out = buildStaticPreviewDeploymentBoundary(validInput({ dnsMutationRequested: true })); assert.strictEqual(out.deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.DNS_MUTATION_NOT_AUTHORIZED); assert.strictEqual(out.mutatesDns, false); }]);
tests.push(['custom domain setup remains false', () => { const out = buildStaticPreviewDeploymentBoundary(validInput({ customDomainRequested: true })); assert.strictEqual(out.deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.CUSTOM_DOMAIN_NOT_AUTHORIZED); assert.strictEqual(out.configuresCustomDomain, false); }]);
tests.push(['API auth analytics storage remain false', () => { const out = buildStaticPreviewDeploymentBoundary(validInput()); assert.strictEqual(out.callsApi, false); assert.strictEqual(out.enablesAuth, false); assert.strictEqual(out.enablesAnalytics, false); assert.strictEqual(out.writesStorage, false); }]);
tests.push(['CRM task calendar truth action remain false', () => { const out = buildStaticPreviewDeploymentBoundary(validInput()); assert.strictEqual(out.mutatesCrm, false); assert.strictEqual(out.createsTask, false); assert.strictEqual(out.createsCalendarEvent, false); assert.strictEqual(out.createsBusinessTruth, false); assert.strictEqual(out.executesAction, false); }]);
tests.push(['public surface candidate can be prepared only after all safety snapshots pass', () => { const out = buildStaticPreviewDeploymentBoundary(validInput()); assert.strictEqual(out.deploymentBoundaryStatus, STATIC_PREVIEW_DEPLOYMENT_STATUSES.APPROVED_FOR_PUBLIC_SURFACE_CANDIDATE); assert.strictEqual(out.eligibleForPublicSurfaceReview, true); assert.strictEqual(out.publicSurfaceCandidate.reviewOnly, true); }]);
tests.push(['GitHub Pages availability remains not deployment authorization', () => { const out = buildStaticPreviewDeploymentBoundary(validInput()); assert.strictEqual(out.githubPagesAvailabilityIsNotDeploymentAuthorization, true); assert.strictEqual(out.publicSurfaceCandidate.githubPagesAvailabilityIsNotDeploymentAuthorization, true); }]);
tests.push(['warnings and limitations remain visible', () => { const out = buildStaticPreviewDeploymentBoundary(validInput()); assert.ok(out.warnings.includes('public surface candidate only')); assert.ok(out.limitations.includes('no deploy execution')); }]);
tests.push(['rollback plan remains visible', () => { const out = buildStaticPreviewDeploymentBoundary(validInput()); assert.ok(out.rollbackNotes.join(' ').includes('Rollback')); }]);
tests.push(['expiration review window remains visible', () => { const out = buildStaticPreviewDeploymentBoundary(validInput()); assert.ok(out.expirationNotes.join(' ').includes('expires')); }]);
tests.push(['inputs are not mutated', () => { const input = validInput(); const before = JSON.stringify(input); buildStaticPreviewDeploymentBoundary(input); assert.strictEqual(JSON.stringify(input), before); }]);
tests.push(['Metric Economic Truth remains separate', () => { const out = buildStaticPreviewDeploymentBoundary(validInput()); assert.strictEqual(out.metricEconomicTruthRemainsSeparate, true); }]);

let passed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}
console.log(`Static Preview Deployment Boundary Contract PASS ${passed}/${tests.length}`);
