import crypto from 'node:crypto';

import {
  createCarrierApplicabilityDecision
} from '../carrier-scope/carrier-applicability-consumer.mjs';

import {
  GmmQuoteEvidenceAdapterError,
  ingestGmmQuoteEvidence
} from '../gmm-quote-evidence-adapter/index.mjs';

import {
  QuotePreparationDecisionError,
  createQuotePreparationDecision
} from '../product-intelligence/quote-preparation-consumer.mjs';

export class GmmQuotePreparationE2EError
  extends Error {
  constructor(code, details = []) {
    super(
      `${code}${
        details.length
          ? `:${details.join('|')}`
          : ''
      }`
    );
    this.name =
      'GmmQuotePreparationE2EError';
    this.code = code;
    this.details = Object.freeze([...details]);
  }
}

function isPlainObject(value) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value);
}

function requireString(value, code) {
  if (
    typeof value !== 'string'
    || value.trim().length === 0
  ) {
    throw new GmmQuotePreparationE2EError(
      code
    );
  }

  return value.trim();
}

function normalizeJson(value) {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new GmmQuotePreparationE2EError(
        'NON_FINITE_VALUE_FORBIDDEN'
      );
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeJson);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [
          key,
          normalizeJson(value[key])
        ])
    );
  }

  throw new GmmQuotePreparationE2EError(
    'UNSUPPORTED_VALUE'
  );
}

function canonicalJson(value) {
  return JSON.stringify(normalizeJson(value));
}

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

function deepFreeze(value) {
  if (
    value === null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) {
    return value;
  }

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }

  return Object.freeze(value);
}

function normalizeRequest(input) {
  if (!isPlainObject(input)) {
    throw new GmmQuotePreparationE2EError(
      'WORKFLOW_REQUEST_REQUIRED'
    );
  }

  if (input.schemaVersion !== 1) {
    throw new GmmQuotePreparationE2EError(
      'WORKFLOW_SCHEMA_UNSUPPORTED',
      [String(input.schemaVersion)]
    );
  }

  if (
    input.kind !==
      'GMM_QUOTE_PREPARATION_E2E_REQUEST'
  ) {
    throw new GmmQuotePreparationE2EError(
      'WORKFLOW_KIND_INVALID'
    );
  }

  if (!isPlainObject(input.product)) {
    throw new GmmQuotePreparationE2EError(
      'PRODUCT_CONTEXT_REQUIRED'
    );
  }

  if (
    !Array.isArray(input.requestedClaims)
    || input.requestedClaims.length === 0
  ) {
    throw new GmmQuotePreparationE2EError(
      'REQUESTED_CLAIMS_REQUIRED'
    );
  }

  if (
    !Array.isArray(input.officialEvidence)
  ) {
    throw new GmmQuotePreparationE2EError(
      'OFFICIAL_EVIDENCE_COLLECTION_REQUIRED'
    );
  }

  return {
    schemaVersion: 1,
    kind:
      'GMM_QUOTE_PREPARATION_E2E_REQUEST',
    workflowId: requireString(
      input.workflowId,
      'WORKFLOW_ID_REQUIRED'
    ),
    requestScope: structuredClone(
      input.requestScope
    ),
    supportedScopes: structuredClone(
      input.supportedScopes
    ),
    quoteFixturePath:
      input.quoteFixturePath ?? null,
    product: {
      productName: requireString(
        input.product.productName,
        'PRODUCT_NAME_REQUIRED'
      ),
      productFamily: requireString(
        input.product.productFamily,
        'PRODUCT_FAMILY_REQUIRED'
      ),
      effectiveAt: requireString(
        input.product.effectiveAt,
        'EFFECTIVE_AT_REQUIRED'
      ),
      productEffectiveFrom:
        input.product.productEffectiveFrom
        ?? input.product.effectiveAt,
      productEffectiveTo:
        input.product.productEffectiveTo
        ?? null,
      rulePackId:
        input.product.rulePackId ?? null,
      currency:
        input.product.currency ?? null
    },
    requestedClaims: [
      ...new Set(
        input.requestedClaims.map(
          (claim, index) =>
            requireString(
              claim,
              `REQUESTED_CLAIM_${index}_INVALID`
            )
        )
      )
    ].sort(),
    officialEvidence:
      structuredClone(input.officialEvidence)
  };
}

function traceStep(
  step,
  status,
  detail
) {
  return {
    sequence: null,
    step,
    status,
    detail
  };
}

function finalizeTrace(steps) {
  return steps.map(
    (step, index) => ({
      ...step,
      sequence: index + 1
    })
  );
}

function deterministicRunId(
  workflowId,
  fixtureFingerprint,
  request
) {
  const digest = sha256(
    canonicalJson({
      workflowId,
      fixtureFingerprint,
      requestedClaims:
        request.requestedClaims,
      officialEvidence:
        request.officialEvidence
    })
  );

  return `GMM-E2E-${digest
    .slice(0, 24)
    .toUpperCase()}`;
}

function blockedResult({
  request,
  runId,
  code,
  summary,
  carrierDecision,
  quoteEvidence,
  quotePreparationDecision,
  trace,
  recoveryActions,
  errorCode = null
}) {
  return deepFreeze({
    schemaVersion: 1,
    kind:
      'GMM_QUOTE_PREPARATION_E2E_RESULT',
    runId,
    workflowId: request.workflowId,
    status: 'BLOCKED',
    readyForHumanReview: false,
    visibleOutcome: {
      code,
      title:
        'Preparación de cotización bloqueada',
      summary
    },
    errorCode,
    carrierDecision,
    quoteEvidence,
    quotePreparationDecision,
    humanGate: {
      required: true,
      status: 'NOT_REACHED',
      action:
        'RESOLVE_BLOCKERS_BEFORE_HUMAN_REVIEW'
    },
    recoveryActions:
      [...recoveryActions],
    trace: finalizeTrace(trace),
    manualSteps: [],
    boundaries: {
      sendsQuote: false,
      evaluatesClientSuitability: false,
      overridesProductTruth: false,
      humanApprovalRequired: true
    }
  });
}

export function runGmmQuotePreparationWorkflow(
  input
) {
  if (!isPlainObject(input)) {
    throw new GmmQuotePreparationE2EError(
      'WORKFLOW_INPUT_REQUIRED'
    );
  }

  const request = normalizeRequest(
    input.request
  );

  const trace = [];

  const carrierDecision =
    createCarrierApplicabilityDecision({
      workflowId: request.workflowId,
      requestScope: request.requestScope,
      supportedScopes:
        request.supportedScopes
    });

  trace.push(
    traceStep(
      'CARRIER_SCOPE',
      carrierDecision.eligible
        ? 'PASS'
        : 'BLOCKED',
      carrierDecision.reasonCode
    )
  );

  if (!carrierDecision.eligible) {
    return blockedResult({
      request,
      runId:
        `GMM-E2E-${sha256(
          canonicalJson(request)
        ).slice(0, 24).toUpperCase()}`,
      code: 'BLOCKED_CARRIER_SCOPE',
      summary:
        'El carrier, mercado o línea de producto no está soportado.',
      carrierDecision,
      quoteEvidence: null,
      quotePreparationDecision: null,
      trace,
      recoveryActions: [
        'VERIFY_CARRIER_MARKET_PRODUCT_LINE',
        'DECLARE_SUPPORTED_SCOPE_BEFORE_RETRY'
      ]
    });
  }

  let quoteEvidenceBatch;

  try {
    quoteEvidenceBatch =
      ingestGmmQuoteEvidence(
        input.quoteFixture
      );
  } catch (error) {
    if (
      error instanceof
        GmmQuoteEvidenceAdapterError
    ) {
      trace.push(
        traceStep(
          'EXTERNAL_QUOTE_INGESTION',
          'BLOCKED',
          error.code
        )
      );

      return blockedResult({
        request,
        runId:
          `GMM-E2E-${sha256(
            canonicalJson(request)
          ).slice(0, 24).toUpperCase()}`,
        code: 'BLOCKED_EXTERNAL_QUOTE',
        summary:
          'La cotización externa no cumple el contrato de integración.',
        carrierDecision,
        quoteEvidence: null,
        quotePreparationDecision: null,
        trace,
        recoveryActions: [
          'CORRECT_EXTERNAL_QUOTE_CONTRACT',
          'RETRY_WITH_SUPPORTED_CONTRACT_VERSION'
        ],
        errorCode: error.code
      });
    }

    throw error;
  }

  trace.push(
    traceStep(
      'EXTERNAL_QUOTE_INGESTION',
      'PASS',
      quoteEvidenceBatch.fixtureFingerprint
    )
  );

  if (
    quoteEvidenceBatch
      .sourceSnapshot
      .carrierScope
      .canonical
    !== carrierDecision
      .requestScope
      .canonical
  ) {
    trace.push(
      traceStep(
        'CARRIER_QUOTE_ALIGNMENT',
        'BLOCKED',
        'QUOTE_SCOPE_MISMATCH'
      )
    );

    return blockedResult({
      request,
      runId: deterministicRunId(
        request.workflowId,
        quoteEvidenceBatch.fixtureFingerprint,
        request
      ),
      code: 'BLOCKED_QUOTE_SCOPE_MISMATCH',
      summary:
        'La cotización recibida pertenece a un alcance distinto del solicitado.',
      carrierDecision,
      quoteEvidence: {
        fixtureFingerprint:
          quoteEvidenceBatch.fixtureFingerprint,
        sourceId:
          quoteEvidenceBatch
            .sourceSnapshot.sourceId,
        recordCount:
          quoteEvidenceBatch.records.length
      },
      quotePreparationDecision: null,
      trace,
      recoveryActions: [
        'REQUEST_QUOTE_FOR_EXACT_CARRIER_SCOPE',
        'DO_NOT_REUSE_CROSS_SCOPE_EVIDENCE'
      ]
    });
  }

  trace.push(
    traceStep(
      'CARRIER_QUOTE_ALIGNMENT',
      'PASS',
      carrierDecision
        .requestScope
        .canonical
    )
  );

  let quotePreparationDecision;

  try {
    quotePreparationDecision =
      createQuotePreparationDecision({
        productId:
          quoteEvidenceBatch
            .sourceSnapshot.productId,
        carrierId:
          quoteEvidenceBatch
            .sourceSnapshot.carrierId,
        productName:
          request.product.productName,
        productVersion:
          quoteEvidenceBatch
            .sourceSnapshot.productVersion,
        productFamily:
          request.product.productFamily,
        effectiveAt:
          request.product.effectiveAt,
        productEffectiveFrom:
          request.product
            .productEffectiveFrom,
        productEffectiveTo:
          request.product
            .productEffectiveTo,
        rulePackId:
          request.product.rulePackId,
        currency:
          request.product.currency
          ?? quoteEvidenceBatch
            .sourceSnapshot.currency,
        country:
          quoteEvidenceBatch
            .sourceSnapshot.country,
        channel:
          quoteEvidenceBatch
            .sourceSnapshot.channel,
        requestedClaims:
          request.requestedClaims,
        evidence: [
          ...quoteEvidenceBatch.records,
          ...request.officialEvidence
        ]
      });
  } catch (error) {
    if (
      error instanceof
        QuotePreparationDecisionError
    ) {
      trace.push(
        traceStep(
          'PRODUCT_TRUTH_RESOLUTION',
          'BLOCKED',
          error.code
        )
      );

      return blockedResult({
        request,
        runId: deterministicRunId(
          request.workflowId,
          quoteEvidenceBatch
            .fixtureFingerprint,
          request
        ),
        code:
          'BLOCKED_PRODUCT_TRUTH_INPUT',
        summary:
          'La evidencia no permite construir una decisión de Product Truth.',
        carrierDecision,
        quoteEvidence: {
          fixtureFingerprint:
            quoteEvidenceBatch
              .fixtureFingerprint,
          sourceId:
            quoteEvidenceBatch
              .sourceSnapshot.sourceId,
          recordCount:
            quoteEvidenceBatch
              .records.length
        },
        quotePreparationDecision: null,
        trace,
        recoveryActions: [
          'ADD_INDEPENDENT_OFFICIAL_EVIDENCE',
          'CORRECT_PRODUCT_VERSION_AND_CONTEXT'
        ],
        errorCode: error.code
      });
    }

    throw error;
  }

  trace.push(
    traceStep(
      'PRODUCT_TRUTH_RESOLUTION',
      quotePreparationDecision.allowed
        ? 'PASS'
        : 'BLOCKED',
      quotePreparationDecision.decision
    )
  );

  const runId = deterministicRunId(
    request.workflowId,
    quoteEvidenceBatch.fixtureFingerprint,
    request
  );

  const quoteEvidence = {
    fixtureFingerprint:
      quoteEvidenceBatch.fixtureFingerprint,
    sourceId:
      quoteEvidenceBatch
        .sourceSnapshot.sourceId,
    quoteId:
      quoteEvidenceBatch
        .sourceSnapshot.quoteId,
    recordCount:
      quoteEvidenceBatch.records.length,
    trace:
      quoteEvidenceBatch.trace
  };

  if (!quotePreparationDecision.allowed) {
    return blockedResult({
      request,
      runId,
      code: 'BLOCKED_PRODUCT_TRUTH',
      summary:
        'Product Intelligence detectó evidencia parcial, desconocida, vencida o conflictiva.',
      carrierDecision,
      quoteEvidence,
      quotePreparationDecision,
      trace,
      recoveryActions: [
        'RESOLVE_PRODUCT_TRUTH_BLOCKED_CLAIMS',
        'OBTAIN_CURRENT_OFFICIAL_EVIDENCE',
        'RETRY_WITHOUT_OVERRIDING_PRODUCT_TRUTH'
      ]
    });
  }

  trace.push(
    traceStep(
      'HUMAN_REVIEW_GATE',
      'PENDING',
      'HUMAN_APPROVAL_REQUIRED'
    )
  );

  return deepFreeze({
    schemaVersion: 1,
    kind:
      'GMM_QUOTE_PREPARATION_E2E_RESULT',
    runId,
    workflowId: request.workflowId,
    status:
      'READY_FOR_HUMAN_QUOTE_REVIEW',
    readyForHumanReview: true,
    visibleOutcome: {
      code:
        'READY_FOR_HUMAN_QUOTE_REVIEW',
      title:
        'Cotización lista para revisión humana',
      summary:
        'El alcance aplica, la cotización fue ingerida y Product Truth es accionable.'
    },
    carrierDecision,
    quoteEvidence,
    quotePreparationDecision,
    humanGate: {
      required: true,
      status: 'PENDING',
      action:
        'HUMAN_REVIEW_AND_APPROVE_QUOTE_PREPARATION'
    },
    recoveryActions: [],
    trace: finalizeTrace(trace),
    manualSteps: [],
    boundaries: {
      sendsQuote: false,
      evaluatesClientSuitability: false,
      overridesProductTruth: false,
      humanApprovalRequired: true
    }
  });
}

export function assertGmmQuotePreparationResult(
  value
) {
  if (
    !isPlainObject(value)
    || value.schemaVersion !== 1
    || value.kind !==
      'GMM_QUOTE_PREPARATION_E2E_RESULT'
    || typeof value.runId !== 'string'
    || !value.runId.startsWith('GMM-E2E-')
    || !Array.isArray(value.trace)
    || !Array.isArray(value.manualSteps)
    || value.manualSteps.length !== 0
    || value.boundaries
      ?.humanApprovalRequired !== true
    || value.boundaries
      ?.sendsQuote !== false
  ) {
    throw new GmmQuotePreparationE2EError(
      'WORKFLOW_RESULT_INVALID'
    );
  }

  return true;
}
