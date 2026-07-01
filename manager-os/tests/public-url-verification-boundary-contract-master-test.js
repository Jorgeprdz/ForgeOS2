const assert = require('assert');
const {
  buildPublicUrlVerificationBoundary,
  PUBLIC_URL_VERIFICATION_STATUSES,
  PUBLIC_URL_VERIFICATION_ALLOWED_USES,
  PUBLIC_URL_VERIFICATION_FORBIDDEN_USES,
} = require('../public-url-verification/public-url-verification-boundary-contract');

function futureDate() {
  return new Date(Date.now() + 86400000).toISOString();
}

function validInput(overrides = {}) {
  return {
    publicUrlVerificationRequestId: 'public-url-verification-1',
    ownerPublicSurfaceDecisionSnapshot: {
      reviewed: true,
      approvedForPublicSurfaceDecision: true,
      ownerDecisionRecordOnly: true,
      approvedForDeploymentExecution: false,
      approvedForGitHubPagesSettingsMutation: false,
      createsPublicUrl: false,
      verifiesPublicUrl: false,
      warnings: ['owner decision only'],
      limitations: ['not deployment'],
    },
    publicUrlEvidenceSnapshot: {
      reviewed: true,
      evidenceOnly: true,
      claimedUrl: 'https://example.invalid/forge-preview',
      claimsStaticPreviewPath: true,
      claimedStaticPreviewPath: 'docs/static-preview/forge-alive/',
      warnings: ['manual evidence only'],
      limitations: ['no live call'],
    },
    evidenceFreshnessSnapshot: {
      reviewed: true,
      fresh: true,
      stale: false,
      evidenceCapturedAt: new Date().toISOString(),
    },
    sourceOwnershipSnapshot: {
      reviewed: true,
      sourceOwned: true,
      sourceOwner: 'Forge Owner',
    },
    staticPreviewLabelEvidenceSnapshot: {
      reviewed: true,
      staticPreviewLabelVisible: true,
      readOnlyLabelVisible: true,
      notProductionLabelVisible: true,
    },
    sampleDataEvidenceSnapshot: {
      reviewed: true,
      sampleDataOnly: true,
      unsafeSampleData: false,
    },
    noSecretsEvidenceSnapshot: {
      reviewed: true,
      secretDetected: false,
    },
    noApiEvidenceSnapshot: {
      reviewed: true,
      apiCallDetected: false,
    },
    noTrackingEvidenceSnapshot: {
      reviewed: true,
      trackingDetected: false,
    },
    noStorageEvidenceSnapshot: {
      reviewed: true,
      storageWriteDetected: false,
    },
    noFormsEvidenceSnapshot: {
      reviewed: true,
      formSubmissionDetected: false,
    },
    noServiceWorkerEvidenceSnapshot: {
      reviewed: true,
      serviceWorkerDetected: false,
    },
    repositoryVisibilitySnapshot: {
      reviewed: true,
      visibility: 'PRIVATE',
    },
    githubPagesConfigurationSnapshot: {
      reviewed: true,
      available: true,
      settingsMutationRequested: false,
      publishRequested: false,
      deploymentRequested: false,
      publicUrlCreationRequested: false,
      warnings: ['availability is not deployment authorization'],
    },
    rollbackPlanSnapshot: {
      reviewed: true,
      planAvailable: true,
      steps: ['rollback by removing public surface claim'],
    },
    expirationWindowSnapshot: {
      reviewed: true,
      reviewWindowVisible: true,
      expiresAt: futureDate(),
      notes: ['review window visible'],
    },
    evidenceRefs: ['046B-certificate', '046B-certificate'],
    sourceEvidenceIds: ['3448f0a', '3448f0a'],
    sourceOwners: ['Forge Architecture', 'Forge Architecture'],
    idempotencyKey: 'public-url-verification-idem-1',
    requestedUse: 'PUBLIC_URL_VERIFICATION_REVIEW',
    now: new Date().toISOString(),
    ...overrides,
  };
}

function assertAllForbiddenRemainFalse(output) {
  const flags = [
    'performsNetworkCall',
    'callsUrl',
    'performsHttpRequest',
    'performsDnsLookup',
    'createsPublicUrl',
    'verifiesLiveUrlDirectly',
    'approvedForDeploymentExecution',
    'approvedForGitHubPagesSettingsMutation',
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
tests.push(['missing owner public surface decision blocks', () => {
  assert.ok(PUBLIC_URL_VERIFICATION_ALLOWED_USES.includes('PUBLIC_URL_VERIFICATION_REVIEW'));
  assert.ok(PUBLIC_URL_VERIFICATION_FORBIDDEN_USES.includes('NETWORK_CALL'));
  const out = buildPublicUrlVerificationBoundary(validInput({ ownerPublicSurfaceDecisionSnapshot: null }));
  assert.strictEqual(out.publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_OWNER_PUBLIC_SURFACE_DECISION);
  assertAllForbiddenRemainFalse(out);
}]);
tests.push(['missing public URL evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ publicUrlEvidenceSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_PUBLIC_URL_EVIDENCE)]);
tests.push(['missing evidence freshness blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ evidenceFreshnessSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_EVIDENCE_FRESHNESS)]);
tests.push(['missing source ownership blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ sourceOwnershipSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_SOURCE_OWNERSHIP)]);
tests.push(['missing static preview label evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ staticPreviewLabelEvidenceSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_STATIC_PREVIEW_LABEL_EVIDENCE)]);
tests.push(['missing sample data evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ sampleDataEvidenceSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_SAMPLE_DATA_EVIDENCE)]);
tests.push(['missing no-secrets evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ noSecretsEvidenceSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_NO_SECRETS_EVIDENCE)]);
tests.push(['missing no-API evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ noApiEvidenceSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_NO_API_EVIDENCE)]);
tests.push(['missing no-tracking evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ noTrackingEvidenceSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_NO_TRACKING_EVIDENCE)]);
tests.push(['missing no-storage evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ noStorageEvidenceSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_NO_STORAGE_EVIDENCE)]);
tests.push(['missing no-forms evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ noFormsEvidenceSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_NO_FORMS_EVIDENCE)]);
tests.push(['missing no-service-worker evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ noServiceWorkerEvidenceSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_NO_SERVICE_WORKER_EVIDENCE)]);
tests.push(['missing repository visibility review blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ repositoryVisibilitySnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_REPOSITORY_VISIBILITY_REVIEW)]);
tests.push(['missing GitHub Pages configuration blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ githubPagesConfigurationSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_GITHUB_PAGES_CONFIGURATION)]);
tests.push(['missing rollback plan blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ rollbackPlanSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_ROLLBACK_PLAN)]);
tests.push(['missing expiration window blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ expirationWindowSnapshot: null })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_EXPIRATION_WINDOW)]);
tests.push(['missing evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ evidenceRefs: [] })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_EVIDENCE)]);
tests.push(['missing source owner blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ sourceOwners: [] })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_SOURCE_OWNER)]);
tests.push(['missing idempotency key blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ idempotencyKey: '' })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NEEDS_IDEMPOTENCY_KEY)]);
tests.push(['stale evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ evidenceFreshnessSnapshot: { reviewed: true, fresh: false, stale: true, evidenceCapturedAt: '2020-01-01T00:00:00.000Z' } })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.STALE_EVIDENCE)]);
tests.push(['unsafe sample data evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ sampleDataEvidenceSnapshot: { reviewed: true, sampleDataOnly: true, unsafeSampleData: true } })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.UNSAFE_SAMPLE_DATA)]);
tests.push(['secret evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ noSecretsEvidenceSnapshot: { reviewed: true, secretDetected: true } })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.SECRET_DETECTED)]);
tests.push(['API evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ noApiEvidenceSnapshot: { reviewed: true, apiCallDetected: true } })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.API_CALL_DETECTED)]);
tests.push(['tracking evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ noTrackingEvidenceSnapshot: { reviewed: true, trackingDetected: true } })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.TRACKING_DETECTED)]);
tests.push(['storage write evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ noStorageEvidenceSnapshot: { reviewed: true, storageWriteDetected: true } })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.STORAGE_WRITE_DETECTED)]);
tests.push(['form evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ noFormsEvidenceSnapshot: { reviewed: true, formSubmissionDetected: true } })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.FORM_SUBMISSION_DETECTED)]);
tests.push(['service worker evidence blocks', () => assert.strictEqual(buildPublicUrlVerificationBoundary(validInput({ noServiceWorkerEvidenceSnapshot: { reviewed: true, serviceWorkerDetected: true } })).publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.SERVICE_WORKER_DETECTED)]);
tests.push(['network call remains false', () => { const out = buildPublicUrlVerificationBoundary(validInput({ networkCallRequested: true })); assert.strictEqual(out.publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.NETWORK_CALL_NOT_AUTHORIZED); assert.strictEqual(out.performsNetworkCall, false); }]);
tests.push(['HTTP request remains false', () => { const out = buildPublicUrlVerificationBoundary(validInput({ httpRequestRequested: true })); assert.strictEqual(out.publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.HTTP_REQUEST_NOT_AUTHORIZED); assert.strictEqual(out.performsHttpRequest, false); }]);
tests.push(['DNS lookup remains false', () => { const out = buildPublicUrlVerificationBoundary(validInput({ dnsLookupRequested: true })); assert.strictEqual(out.publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.DNS_LOOKUP_NOT_AUTHORIZED); assert.strictEqual(out.performsDnsLookup, false); }]);
tests.push(['public URL creation remains false', () => { const out = buildPublicUrlVerificationBoundary(validInput({ publicUrlCreationRequested: true })); assert.strictEqual(out.publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.PUBLIC_URL_CREATION_NOT_AUTHORIZED); assert.strictEqual(out.createsPublicUrl, false); }]);
tests.push(['live URL direct verification remains false', () => { const out = buildPublicUrlVerificationBoundary(validInput({ liveUrlDirectVerificationRequested: true })); assert.strictEqual(out.publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.LIVE_URL_DIRECT_VERIFICATION_NOT_AUTHORIZED); assert.strictEqual(out.verifiesLiveUrlDirectly, false); }]);
tests.push(['deployment execution remains false', () => { const out = buildPublicUrlVerificationBoundary(validInput({ deploymentExecutionRequested: true })); assert.strictEqual(out.publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.DEPLOYMENT_EXECUTION_NOT_AUTHORIZED); assert.strictEqual(out.approvedForDeploymentExecution, false); }]);
tests.push(['GitHub Pages settings mutation remains false', () => { const out = buildPublicUrlVerificationBoundary(validInput({ githubPagesSettingsMutationRequested: true })); assert.strictEqual(out.publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.GITHUB_PAGES_SETTINGS_MUTATION_NOT_AUTHORIZED); assert.strictEqual(out.approvedForGitHubPagesSettingsMutation, false); }]);
tests.push(['DNS custom domain remains false', () => { const out = buildPublicUrlVerificationBoundary(validInput({ dnsMutationRequested: true })); assert.strictEqual(out.publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.DNS_MUTATION_NOT_AUTHORIZED); assert.strictEqual(out.mutatesDns, false); assert.strictEqual(out.configuresCustomDomain, false); }]);
tests.push(['API auth analytics storage remain false', () => { const out = buildPublicUrlVerificationBoundary(validInput()); assert.strictEqual(out.callsApi, false); assert.strictEqual(out.enablesAuth, false); assert.strictEqual(out.enablesAnalytics, false); assert.strictEqual(out.writesStorage, false); }]);
tests.push(['CRM task calendar truth action remain false', () => { const out = buildPublicUrlVerificationBoundary(validInput()); assert.strictEqual(out.mutatesCrm, false); assert.strictEqual(out.createsTask, false); assert.strictEqual(out.createsCalendarEvent, false); assert.strictEqual(out.createsBusinessTruth, false); assert.strictEqual(out.executesAction, false); }]);
tests.push(['URL verification record can be prepared from evidence only', () => { const out = buildPublicUrlVerificationBoundary(validInput()); assert.strictEqual(out.publicUrlVerificationStatus, PUBLIC_URL_VERIFICATION_STATUSES.VERIFIED_FROM_EVIDENCE); assert.strictEqual(out.verifiedFromEvidence, true); assert.strictEqual(out.publicUrlVerificationRecord.evidenceOnly, true); assert.strictEqual(out.publicUrlVerificationRecord.performsNetworkCall, false); }]);
tests.push(['warnings limitations rollback expiration remain visible', () => { const out = buildPublicUrlVerificationBoundary(validInput()); assert.ok(out.warnings.includes('manual evidence only')); assert.ok(out.limitations.includes('no live call')); assert.ok(out.rollbackNotes.join(' ').includes('Rollback')); assert.ok(out.expirationNotes.join(' ').includes('expires')); }]);
tests.push(['Evidence refs source evidence IDs source owners dedupe', () => { const out = buildPublicUrlVerificationBoundary(validInput()); assert.deepStrictEqual(out.evidenceRefs, ['046B-certificate']); assert.deepStrictEqual(out.sourceEvidenceIds, ['3448f0a']); assert.deepStrictEqual(out.sourceOwners, ['Forge Architecture']); }]);
tests.push(['inputs are not mutated', () => { const input = validInput(); const before = JSON.stringify(input); buildPublicUrlVerificationBoundary(input); assert.strictEqual(JSON.stringify(input), before); }]);
tests.push(['Metric Economic Truth remains separate', () => { const out = buildPublicUrlVerificationBoundary(validInput()); assert.strictEqual(out.metricEconomicTruthRemainsSeparate, true); }]);

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
console.log(`Public URL Verification Boundary Contract PASS ${passed}/${tests.length}`);
