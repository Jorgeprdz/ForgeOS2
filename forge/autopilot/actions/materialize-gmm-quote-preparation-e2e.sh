#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${FORGE_REPO_ROOT:-$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../.." && pwd -P)}"

cd "$ROOT"

MODULE_DIR="modules/gmm-quote-preparation-e2e"
ENTRYPOINT="$MODULE_DIR/index.mjs"
CLI="$MODULE_DIR/cli.mjs"
MODULE_TEST="$MODULE_DIR/index.test.mjs"
REQUEST_FIXTURE="$MODULE_DIR/fixtures/gmm-quote-preparation-request-v1.json"
USER_TOOL="tools/forge-gmm-quote-flow"

test -f "$REQUEST_FIXTURE"
test -x "$USER_TOOL"

cat > "$ENTRYPOINT" <<'E2E_JS'
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
E2E_JS

cat > "$CLI" <<'E2E_CLI_JS'
#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  GmmQuotePreparationE2EError,
  assertGmmQuotePreparationResult,
  runGmmQuotePreparationWorkflow
} from './index.mjs';

function parseArgs(argv) {
  const values = new Map();

  for (
    let index = 0;
    index < argv.length;
    index += 1
  ) {
    const token = argv[index];

    if (
      token === '--help'
      || token === '-h'
    ) {
      values.set('help', true);
      continue;
    }

    if (
      token !== '--input'
      && token !== '--output'
    ) {
      throw new GmmQuotePreparationE2EError(
        'UNKNOWN_CLI_OPTION',
        [token]
      );
    }

    if (values.has(token.slice(2))) {
      throw new GmmQuotePreparationE2EError(
        'DUPLICATE_CLI_OPTION',
        [token]
      );
    }

    const value = argv[index + 1];

    if (
      !value
      || value.startsWith('--')
    ) {
      throw new GmmQuotePreparationE2EError(
        'CLI_OPTION_VALUE_REQUIRED',
        [token]
      );
    }

    values.set(token.slice(2), value);
    index += 1;
  }

  return values;
}

function usage() {
  return `Forge OS V2 — GMM Quote Preparation E2E

Usage:
  tools/forge-gmm-quote-flow --input FILE [--output FILE]

Behavior:
  - evaluates Carrier Scope;
  - ingests the versioned GMM quote contract;
  - resolves Product Truth with independent official evidence;
  - emits READY_FOR_HUMAN_QUOTE_REVIEW or a governed BLOCKED result;
  - never sends a quote and never bypasses human review.
`;
}

function readJson(file) {
  try {
    return JSON.parse(
      fs.readFileSync(file, 'utf8')
    );
  } catch (error) {
    throw new GmmQuotePreparationE2EError(
      'JSON_INPUT_INVALID',
      [file, error.message]
    );
  }
}

function existingJsonPath(
  value,
  baseDirectory
) {
  const target = path.resolve(
    baseDirectory,
    value
  );

  if (
    path.extname(target).toLowerCase()
      !== '.json'
    || !fs.existsSync(target)
    || !fs.statSync(target).isFile()
  ) {
    throw new GmmQuotePreparationE2EError(
      'JSON_FILE_NOT_FOUND',
      [target]
    );
  }

  return target;
}

export function runCli(
  argv = process.argv.slice(2),
  io = {
    stdout: process.stdout,
    stderr: process.stderr,
    cwd: process.cwd()
  }
) {
  try {
    const args = parseArgs(argv);

    if (args.get('help') === true) {
      io.stdout.write(usage());
      return 0;
    }

    const inputValue = args.get('input');

    if (!inputValue) {
      throw new GmmQuotePreparationE2EError(
        'INPUT_FILE_REQUIRED'
      );
    }

    const inputFile = existingJsonPath(
      inputValue,
      io.cwd
    );
    const request = readJson(inputFile);

    if (
      typeof request.quoteFixturePath
        !== 'string'
      || request.quoteFixturePath
        .trim().length === 0
    ) {
      throw new GmmQuotePreparationE2EError(
        'QUOTE_FIXTURE_PATH_REQUIRED'
      );
    }

    const quoteFixtureFile =
      existingJsonPath(
        request.quoteFixturePath,
        path.dirname(inputFile)
      );

    const result =
      runGmmQuotePreparationWorkflow({
        request,
        quoteFixture:
          readJson(quoteFixtureFile)
      });

    assertGmmQuotePreparationResult(result);

    const serialized =
      `${JSON.stringify(result, null, 2)}\n`;

    const outputValue = args.get('output');

    if (outputValue) {
      const outputFile = path.resolve(
        io.cwd,
        outputValue
      );

      fs.mkdirSync(
        path.dirname(outputFile),
        { recursive: true }
      );
      fs.writeFileSync(
        outputFile,
        serialized
      );

      io.stdout.write(
        `OUTPUT_FILE=${outputFile}\n`
      );
      io.stdout.write(
        `WORKFLOW_STATUS=${result.status}\n`
      );
      io.stdout.write(
        `RUN_ID=${result.runId}\n`
      );
    } else {
      io.stdout.write(serialized);
    }

    return 0;
  } catch (error) {
    const code =
      error instanceof
        GmmQuotePreparationE2EError
        ? error.code
        : 'UNEXPECTED_ERROR';

    io.stderr.write(
      `GMM_QUOTE_FLOW_RESULT=FAIL\n`
    );
    io.stderr.write(
      `GMM_QUOTE_FLOW_ERROR_CODE=${code}\n`
    );
    io.stderr.write(
      `GMM_QUOTE_FLOW_ERROR=${error.message}\n`
    );

    return 1;
  }
}

const isMain =
  process.argv[1]
  && path.resolve(process.argv[1])
    === path.resolve(
      fileURLToPath(import.meta.url)
    );

if (isMain) {
  process.exitCode = runCli();
}
E2E_CLI_JS

cat > "$MODULE_TEST" <<'E2E_TEST_JS'
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  assertGmmQuotePreparationResult,
  runGmmQuotePreparationWorkflow
} from './index.mjs';

const testDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);
const root = path.resolve(
  testDirectory,
  '..',
  '..'
);
const requestFile = path.join(
  testDirectory,
  'fixtures',
  'gmm-quote-preparation-request-v1.json'
);
const quoteFile = path.join(
  root,
  'modules',
  'gmm-quote-evidence-adapter',
  'fixtures',
  'gmm-quote-contract-v1.json'
);
const userTool = path.join(
  root,
  'tools',
  'forge-gmm-quote-flow'
);

function readJson(file) {
  return JSON.parse(
    fs.readFileSync(file, 'utf8')
  );
}

function scenario() {
  return {
    request: readJson(requestFile),
    quoteFixture: readJson(quoteFile)
  };
}

test(
  'real CLI executes the complete GMM quote preparation journey and prints a visible outcome',
  () => {
    const result = spawnSync(
      'bash',
      [
        userTool,
        '--input',
        requestFile
      ],
      {
        cwd: root,
        encoding: 'utf8'
      }
    );

    assert.equal(
      result.status,
      0,
      `${result.stdout}\n${result.stderr}`
    );

    const output = JSON.parse(result.stdout);

    assert.equal(
      output.status,
      'READY_FOR_HUMAN_QUOTE_REVIEW'
    );
    assert.equal(
      output.readyForHumanReview,
      true
    );
    assert.equal(
      output.visibleOutcome.code,
      'READY_FOR_HUMAN_QUOTE_REVIEW'
    );
    assert.equal(
      output.trace.length >= 4,
      true
    );
    assert.deepEqual(
      output.manualSteps,
      []
    );
  }
);

test(
  'workflow crosses Carrier Scope, external adapter and Product Intelligence',
  () => {
    const result =
      runGmmQuotePreparationWorkflow(
        scenario()
      );

    assert.equal(
      assertGmmQuotePreparationResult(
        result
      ),
      true
    );
    assert.equal(
      result.carrierDecision.eligible,
      true
    );
    assert.equal(
      result.quoteEvidence.recordCount,
      3
    );
    assert.equal(
      result.quotePreparationDecision
        .productTruth.actionable,
      true
    );
    assert.equal(
      result.humanGate.status,
      'PENDING'
    );
    assert.equal(
      result.boundaries.sendsQuote,
      false
    );
    assert.equal(
      result.boundaries
        .humanApprovalRequired,
      true
    );
  }
);

test(
  'unsupported carrier scope returns a recoverable visible block',
  () => {
    const input = scenario();

    input.request.requestScope = {
      carrier: 'gnp',
      market: 'mexico',
      productLine:
        'gastos-medicos-mayores'
    };

    const result =
      runGmmQuotePreparationWorkflow(input);

    assert.equal(result.status, 'BLOCKED');
    assert.equal(
      result.visibleOutcome.code,
      'BLOCKED_CARRIER_SCOPE'
    );
    assert.ok(
      result.recoveryActions.includes(
        'VERIFY_CARRIER_MARKET_PRODUCT_LINE'
      )
    );
    assert.equal(
      result.humanGate.status,
      'NOT_REACHED'
    );
  }
);

test(
  'external contract failure is converted into an actionable recovery result',
  () => {
    const input = scenario();

    input.quoteFixture.contractVersion =
      '2.0.0';

    const result =
      runGmmQuotePreparationWorkflow(input);

    assert.equal(result.status, 'BLOCKED');
    assert.equal(
      result.visibleOutcome.code,
      'BLOCKED_EXTERNAL_QUOTE'
    );
    assert.equal(
      result.errorCode,
      'GMM_QUOTE_CONTRACT_VERSION_UNSUPPORTED'
    );
    assert.ok(
      result.recoveryActions.includes(
        'RETRY_WITH_SUPPORTED_CONTRACT_VERSION'
      )
    );
  }
);

test(
  'conflicting official evidence blocks Product Truth instead of silently preparing a quote',
  () => {
    const input = scenario();

    const deductible =
      input.request.officialEvidence.find(
        record =>
          record.claimPath ===
            'costSharing.deductible'
      );

    deductible.claimValue.amount = 30000;

    const result =
      runGmmQuotePreparationWorkflow(input);

    assert.equal(result.status, 'BLOCKED');
    assert.equal(
      result.visibleOutcome.code,
      'BLOCKED_PRODUCT_TRUTH'
    );
    assert.equal(
      result.quotePreparationDecision
        .blockedClaims
        .some(
          claim =>
            claim.evidenceState ===
              'CONFLICTED'
        ),
      true
    );
    assert.ok(
      result.recoveryActions.includes(
        'RESOLVE_PRODUCT_TRUTH_BLOCKED_CLAIMS'
      )
    );
  }
);

test(
  'same governed inputs produce the same traceable run identity',
  () => {
    const first =
      runGmmQuotePreparationWorkflow(
        scenario()
      );
    const second =
      runGmmQuotePreparationWorkflow(
        scenario()
      );

    assert.equal(
      first.runId,
      second.runId
    );
    assert.deepEqual(first, second);
    assert.match(
      first.runId,
      /^GMM-E2E-[A-F0-9]{24}$/u
    );
  }
);

test(
  'CLI can persist the visible outcome outside the repository',
  () => {
    const temporary = fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        'forge-gmm-e2e-'
      )
    );
    const outputFile = path.join(
      temporary,
      'result.json'
    );

    const result = spawnSync(
      'bash',
      [
        userTool,
        '--input',
        requestFile,
        '--output',
        outputFile
      ],
      {
        cwd: root,
        encoding: 'utf8'
      }
    );

    assert.equal(
      result.status,
      0,
      `${result.stdout}\n${result.stderr}`
    );
    assert.equal(
      fs.existsSync(outputFile),
      true
    );

    const output = readJson(outputFile);

    assert.equal(
      output.status,
      'READY_FOR_HUMAN_QUOTE_REVIEW'
    );
    assert.match(
      result.stdout,
      /OUTPUT_FILE=/
    );
  }
);
E2E_TEST_JS

chmod +x "$CLI"
chmod +x "$USER_TOOL"

node --check "$ENTRYPOINT"
node --check "$CLI"
node --check "$MODULE_TEST"
bash -n "$USER_TOOL"

printf '%s\n' \
  "GMM_QUOTE_PREPARATION_E2E_IMPLEMENTATION=PASS" \
  "ENTRYPOINT=$ENTRYPOINT" \
  "CLI=$CLI" \
  "TEST=$MODULE_TEST" \
  "USER_TOOL=$USER_TOOL"
