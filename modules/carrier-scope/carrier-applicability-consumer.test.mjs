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
