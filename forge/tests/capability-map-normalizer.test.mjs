import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  buildCapabilityMap,
  renderCapabilityMapMarkdown
} from '../migration/capability-map-normalizer.mjs';

const testDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);
const root = path.resolve(
  testDirectory,
  '..',
  '..'
);
const wrapper = path.join(
  root,
  'tools',
  'forge-capability-map'
);

function discoveryFixture() {
  return {
    schemaVersion: 1,
    kind:
      'FORGE_LEGACY_FUNCTIONAL_PARITY_BASELINE',
    reportHash: 'a'.repeat(64),
    legacy: {
      head: 'b'.repeat(40)
    },
    v2: {
      head: 'c'.repeat(40)
    },
    parity: {
      verifiedCapabilities: 0
    },
    inventory: {
      surfaces: [
        {
          key:
            'partner-quarterly-bonus-calculator',
          domain: 'compensation',
          codeFiles: [
            'compensation/partner-quarterly-bonus-calculator.js'
          ],
          testFiles: [],
          ruleArtifacts: [],
          documents: [],
          entrypointCandidates: [],
          riskTags: ['FINANCIAL_TRUTH'],
          orchestratorCount: 0,
          priorityScore: 10
        },
        {
          key:
            'partner-quarterly-bonus-orchestrator',
          domain: 'compensation',
          codeFiles: [
            'compensation/partner-quarterly-bonus-orchestrator.js'
          ],
          testFiles: [
            'tests/partner-quarterly-bonus-test.js'
          ],
          ruleArtifacts: [
            'compensation/rules/partner-quarterly-bonus-rule-pack.json'
          ],
          documents: [],
          entrypointCandidates: [{
            path:
              'compensation/partner-quarterly-bonus-orchestrator.js',
            score: 3
          }],
          riskTags: ['FINANCIAL_TRUTH'],
          orchestratorCount: 1,
          priorityScore: 20
        },
        {
          key: 'gmm-quote-adapter',
          domain: 'integrations',
          codeFiles: [
            'integrations/gmm-quote-adapter.js'
          ],
          testFiles: [
            'tests/gmm-quote-adapter-test.js'
          ],
          ruleArtifacts: [],
          documents: [],
          entrypointCandidates: [],
          riskTags: ['EXTERNAL_BOUNDARY'],
          orchestratorCount: 0,
          priorityScore: 8
        },
        {
          key: 'misc',
          domain: 'unclassified',
          codeFiles: ['misc.js'],
          testFiles: [],
          ruleArtifacts: [],
          documents: [],
          entrypointCandidates: [],
          riskTags: [],
          orchestratorCount: 0,
          priorityScore: 1
        }
      ]
    }
  };
}

test(
  'merges calculator and orchestrator surfaces into one business capability',
  () => {
    const report = buildCapabilityMap({
      discoveryReport:
        discoveryFixture(),
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });

    const capability =
      report.capabilities.find(item =>
        item.key ===
          'partner-quarterly-bonus'
      );

    assert.ok(capability);
    assert.equal(
      capability.domain,
      'compensation'
    );
    assert.equal(
      capability.kind,
      'BUSINESS'
    );
    assert.equal(
      capability.mergedSurfaceCount,
      2
    );
    assert.equal(
      capability.codeFiles.length,
      2
    );
    assert.equal(
      capability.testFiles.length,
      1
    );
    assert.equal(
      capability.ruleArtifacts.length,
      1
    );
    assert.equal(
      capability.verifiedParity,
      false
    );
  }
);

test(
  'separates business, infrastructure and unclassified capabilities',
  () => {
    const report = buildCapabilityMap({
      discoveryReport:
        discoveryFixture(),
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });

    assert.equal(
      report.counts.businessCapabilities,
      1
    );
    assert.equal(
      report.counts.infrastructureCapabilities,
      1
    );
    assert.equal(
      report.counts.unclassifiedCapabilities,
      1
    );
  }
);

test(
  'never grants parity from normalization',
  () => {
    const report = buildCapabilityMap({
      discoveryReport:
        discoveryFixture(),
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });

    assert.equal(
      report.parity.verifiedCapabilities,
      0
    );
    assert.equal(
      report.parity.verifiedPercentage,
      null
    );
    assert.equal(
      report.parity.silentEquivalenceClaims,
      0
    );
    assert.equal(
      report.parity.status,
      'CAPABILITY_MAP_CANDIDATE_NOT_LOCKED'
    );
  }
);

test(
  'unclassified and untested surfaces enter the human review queue',
  () => {
    const report = buildCapabilityMap({
      discoveryReport:
        discoveryFixture(),
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });

    const misc =
      report.capabilities.find(item =>
        item.key === 'misc'
      );

    assert.ok(misc);
    assert.equal(
      misc.requiresHumanReview,
      true
    );
    assert.ok(
      misc.ambiguityReasons.includes(
        'DOMAIN_UNCLASSIFIED'
      )
    );
    assert.ok(
      misc.ambiguityReasons.includes(
        'NO_LEGACY_TESTS'
      )
    );
  }
);

test(
  'normalization hash is deterministic across generation times',
  () => {
    const first = buildCapabilityMap({
      discoveryReport:
        discoveryFixture(),
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });
    const second = buildCapabilityMap({
      discoveryReport:
        discoveryFixture(),
      generatedAt:
        '2026-07-25T00:00:00.000Z'
    });

    assert.equal(
      first.reportHash,
      second.reportHash
    );
  }
);

test(
  'CLI writes JSON and Markdown reports',
  () => {
    const directory = fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        'forge-capability-map-'
      )
    );
    const input = path.join(
      directory,
      'discovery.json'
    );
    const json = path.join(
      directory,
      'map.json'
    );
    const markdown = path.join(
      directory,
      'map.md'
    );

    fs.writeFileSync(
      input,
      `${JSON.stringify(
        discoveryFixture(),
        null,
        2
      )}\n`
    );

    const result = spawnSync(
      'bash',
      [
        wrapper,
        'normalize',
        '--input',
        input,
        '--json',
        json,
        '--markdown',
        markdown
      ],
      { encoding: 'utf8' }
    );

    assert.equal(
      result.status,
      0,
      `${result.stdout}\n${result.stderr}`
    );
    assert.equal(fs.existsSync(json), true);
    assert.equal(
      fs.existsSync(markdown),
      true
    );
    assert.match(
      result.stdout,
      /CAPABILITY_MAP_NORMALIZATION=PASS/u
    );

    const report = JSON.parse(
      fs.readFileSync(json, 'utf8')
    );
    const text = fs.readFileSync(
      markdown,
      'utf8'
    );

    assert.equal(
      report.parity.verifiedCapabilities,
      0
    );
    assert.match(
      text,
      /does not grant legacy parity/u
    );
  }
);

test(
  'Markdown renderer exposes counts and the next governed action',
  () => {
    const report = buildCapabilityMap({
      discoveryReport:
        discoveryFixture(),
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });
    const markdown =
      renderCapabilityMapMarkdown(report);

    assert.match(
      markdown,
      /Raw technical surfaces/u
    );
    assert.match(
      markdown,
      /LOCK_CAPABILITY_MAP_AND_SELECT_PARITY_SCENARIOS/u
    );
  }
);
