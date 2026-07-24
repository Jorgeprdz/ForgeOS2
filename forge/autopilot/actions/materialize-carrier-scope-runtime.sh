#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${FORGE_REPO_ROOT:-$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../.." && pwd -P)}"

cd "$ROOT"

CONSUMER="modules/carrier-scope/carrier-applicability-consumer.mjs"
CONSUMER_TEST="modules/carrier-scope/carrier-applicability-consumer.test.mjs"

cat > "$CONSUMER" <<'CONSUMER_JS'
import {
  CarrierScopeError,
  createCarrierScope
} from './index.mjs';

export class CarrierApplicabilityDecisionError
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
      'CarrierApplicabilityDecisionError';
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
    throw new CarrierApplicabilityDecisionError(
      code
    );
  }

  return value.trim();
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

function normalizeScope(value, label) {
  try {
    return createCarrierScope(value);
  } catch (error) {
    if (error instanceof CarrierScopeError) {
      throw new CarrierApplicabilityDecisionError(
        `${label}_INVALID`,
        [error.message]
      );
    }

    throw error;
  }
}

function determineUnsupportedReason(
  requestScope,
  supportedScopes
) {
  const carrierScopes = supportedScopes.filter(
    scope =>
      scope.carrier === requestScope.carrier
  );

  if (carrierScopes.length === 0) {
    return 'CARRIER_UNSUPPORTED';
  }

  const marketScopes = carrierScopes.filter(
    scope =>
      scope.market === requestScope.market
  );

  if (marketScopes.length === 0) {
    return 'MARKET_UNSUPPORTED';
  }

  return 'PRODUCT_LINE_UNSUPPORTED';
}

export function createCarrierApplicabilityDecision(
  input
) {
  if (!isPlainObject(input)) {
    throw new CarrierApplicabilityDecisionError(
      'CARRIER_APPLICABILITY_INPUT_REQUIRED'
    );
  }

  const workflowId = requireString(
    input.workflowId,
    'WORKFLOW_ID_REQUIRED'
  );

  if (
    !Array.isArray(input.supportedScopes)
    || input.supportedScopes.length === 0
  ) {
    throw new CarrierApplicabilityDecisionError(
      'SUPPORTED_CARRIER_SCOPES_REQUIRED'
    );
  }

  const requestScope = normalizeScope(
    input.requestScope,
    'REQUEST_SCOPE'
  );

  const supportedScopes =
    input.supportedScopes.map(
      (scope, index) =>
        normalizeScope(
          scope,
          `SUPPORTED_SCOPE_${index}`
        )
    );

  const canonicalScopes = new Set();

  for (const scope of supportedScopes) {
    if (canonicalScopes.has(scope.canonical)) {
      throw new CarrierApplicabilityDecisionError(
        'DUPLICATE_SUPPORTED_SCOPE',
        [scope.canonical]
      );
    }

    canonicalScopes.add(scope.canonical);
  }

  const matchedScope = supportedScopes.find(
    scope =>
      scope.canonical === requestScope.canonical
  );

  if (matchedScope) {
    return deepFreeze({
      schemaVersion: 1,
      kind: 'CARRIER_APPLICABILITY_DECISION',
      workflowId,
      decision: 'CARRIER_SCOPE_ELIGIBLE',
      eligible: true,
      ineligible: false,
      applies: true,
      supported: true,
      rejected: false,
      reasonCode:
        'EXACT_CARRIER_SCOPE_SUPPORTED',
      requestScope,
      matchedScope,
      evaluatedScopeCount:
        supportedScopes.length,
      boundaries: {
        owner:
          'CARRIER_SCOPE_APPLICABILITY_CONSUMER',
        consumesCarrierScope: true,
        mayOverrideCarrierScope: false,
        mayInferUnsupportedScope: false,
        maySendQuote: false,
        humanDecisionRequired: true
      }
    });
  }

  return deepFreeze({
    schemaVersion: 1,
    kind: 'CARRIER_APPLICABILITY_DECISION',
    workflowId,
    decision: 'CARRIER_SCOPE_INELIGIBLE',
    eligible: false,
    ineligible: true,
    applies: false,
    supported: false,
    rejected: true,
    reasonCode: determineUnsupportedReason(
      requestScope,
      supportedScopes
    ),
    requestScope,
    matchedScope: null,
    evaluatedScopeCount:
      supportedScopes.length,
    boundaries: {
      owner:
        'CARRIER_SCOPE_APPLICABILITY_CONSUMER',
      consumesCarrierScope: true,
      mayOverrideCarrierScope: false,
      mayInferUnsupportedScope: false,
      maySendQuote: false,
      humanDecisionRequired: true
    }
  });
}
CONSUMER_JS

cat > "$CONSUMER_TEST" <<'CONSUMER_TEST_JS'
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CarrierApplicabilityDecisionError,
  createCarrierApplicabilityDecision
} from './carrier-applicability-consumer.mjs';

function supportedScopes() {
  return [
    {
      carrier: 'smnyl',
      market: 'mexico',
      productLine: 'vida-individual'
    },
    {
      carrier: 'smnyl',
      market: 'mexico',
      productLine: 'retiro'
    },
    {
      carrier: 'smnyl',
      market: 'mexico'
    },
    {
      carrier: 'smnyl',
      market: 'colombia',
      productLine: 'vida-individual'
    },
    {
      carrier: 'gnp',
      market: 'mexico',
      productLine: 'gastos-medicos'
    }
  ];
}

function request(overrides = {}) {
  return {
    workflowId:
      'QUOTE-WORKFLOW-2026-0001',
    requestScope: {
      carrier: 'SMNYL',
      market: 'Mexico',
      productLine: 'Vida-Individual'
    },
    supportedScopes: supportedScopes(),
    ...overrides
  };
}

test(
  'quote workflow marks an exact carrier scope eligible and applicable',
  () => {
    const decision =
      createCarrierApplicabilityDecision(
        request()
      );

    assert.equal(
      decision.decision,
      'CARRIER_SCOPE_ELIGIBLE'
    );
    assert.equal(decision.eligible, true);
    assert.equal(decision.ineligible, false);
    assert.equal(decision.applies, true);
    assert.equal(decision.supported, true);
    assert.equal(decision.rejected, false);
    assert.equal(
      decision.reasonCode,
      'EXACT_CARRIER_SCOPE_SUPPORTED'
    );
    assert.equal(
      decision.matchedScope.canonical,
      'smnyl:mexico:vida-individual'
    );
    assert.equal(
      decision.boundaries
        .consumesCarrierScope,
      true
    );
    assert.equal(
      decision.boundaries
        .humanDecisionRequired,
      true
    );
  }
);

test(
  'quote workflow rejects an unsupported carrier',
  () => {
    const decision =
      createCarrierApplicabilityDecision(
        request({
          requestScope: {
            carrier: 'metlife',
            market: 'mexico',
            productLine: 'vida-individual'
          }
        })
      );

    assert.equal(
      decision.decision,
      'CARRIER_SCOPE_INELIGIBLE'
    );
    assert.equal(decision.eligible, false);
    assert.equal(decision.ineligible, true);
    assert.equal(decision.applies, false);
    assert.equal(decision.supported, false);
    assert.equal(decision.rejected, true);
    assert.equal(
      decision.reasonCode,
      'CARRIER_UNSUPPORTED'
    );
  }
);

test(
  'quote workflow rejects an unsupported market for a known carrier',
  () => {
    const decision =
      createCarrierApplicabilityDecision(
        request({
          requestScope: {
            carrier: 'smnyl',
            market: 'argentina',
            productLine: 'vida-individual'
          }
        })
      );

    assert.equal(
      decision.decision,
      'CARRIER_SCOPE_INELIGIBLE'
    );
    assert.equal(
      decision.reasonCode,
      'MARKET_UNSUPPORTED'
    );
  }
);

test(
  'quote workflow rejects an unsupported product line in a supported market',
  () => {
    const decision =
      createCarrierApplicabilityDecision(
        request({
          requestScope: {
            carrier: 'smnyl',
            market: 'mexico',
            productLine: 'gastos-medicos'
          }
        })
      );

    assert.equal(
      decision.decision,
      'CARRIER_SCOPE_INELIGIBLE'
    );
    assert.equal(
      decision.reasonCode,
      'PRODUCT_LINE_UNSUPPORTED'
    );
  }
);

test(
  'quote workflow supports an explicit carrier and market scope without product line',
  () => {
    const decision =
      createCarrierApplicabilityDecision(
        request({
          requestScope: {
            carrier: 'smnyl',
            market: 'mexico'
          }
        })
      );

    assert.equal(decision.eligible, true);
    assert.equal(
      decision.matchedScope.canonical,
      'smnyl:mexico'
    );
  }
);

test(
  'consumer rejects duplicate supported scope configuration',
  () => {
    assert.throws(
      () =>
        createCarrierApplicabilityDecision(
          request({
            supportedScopes: [
              ...supportedScopes(),
              {
                carrier: 'SMNYL',
                market: 'Mexico',
                productLine:
                  'Vida-Individual'
              }
            ]
          })
        ),
      error =>
        error instanceof
          CarrierApplicabilityDecisionError
        && error.code ===
          'DUPLICATE_SUPPORTED_SCOPE'
    );
  }
);
CONSUMER_TEST_JS

node --input-type=module <<'UPDATE_MANIFEST'
import fs from 'node:fs';

const file = 'forge/modules.json';
const manifest = JSON.parse(
  fs.readFileSync(file, 'utf8')
);

const moduleRecord = manifest.modules.find(
  record =>
    record.id === 'MOD-CARRIER-SCOPE'
);

if (!moduleRecord) {
  throw new Error(
    'MOD_CARRIER_SCOPE_NOT_FOUND'
  );
}

const consumerTest =
  'modules/carrier-scope/carrier-applicability-consumer.test.mjs';

moduleRecord.tests = [
  ...new Set([
    ...(moduleRecord.tests ?? []),
    consumerTest
  ])
];

moduleRecord.description =
  'Canonical carrier scope runtime with governed applicability decisions for carrier, market and product-line quote routing.';

fs.writeFileSync(
  file,
  `${JSON.stringify(manifest, null, 2)}\n`
);
UPDATE_MANIFEST

node --check "$CONSUMER"
node --check "$CONSUMER_TEST"

printf '%s\n' \
  "CARRIER_SCOPE_IMPLEMENTATION=PASS" \
  "CONSUMER=$CONSUMER" \
  "CONSUMER_TEST=$CONSUMER_TEST"
