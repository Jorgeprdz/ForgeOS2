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
