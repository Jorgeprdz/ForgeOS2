import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  buildCapabilityGroupingV2,
  renderGroupingMarkdown
} from '../migration/capability-grouping-v2.mjs';

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
  'forge-capability-grouping-v2'
);

function fixtures() {
  const quarterlyCalculator = {
    id:
      'CAP-COMPENSATION-PARTNER-QUARTERLY-BONUS-CALCULATOR',
    key:
      'partner-quarterly-bonus-calculator',
    domain: 'compensation',
    kind: 'BUSINESS',
    sourceSurfaceKeys: [
      'partner-quarterly-bonus-calculator'
    ],
    codeFiles: [
      'compensation/partner-manager/partner-quarterly-bonus-calculator.js'
    ],
    testFiles: [],
    ruleArtifacts: [],
    documents: [],
    entrypointCandidates: [],
    riskTags: ['FINANCIAL_TRUTH'],
    migrationPriority: 20
  };

  const quarterlyOrchestrator = {
    id:
      'CAP-COMPENSATION-PARTNER-QUARTERLY-BONUS-ORCHESTRATOR',
    key:
      'partner-quarterly-bonus-orchestrator',
    domain: 'compensation',
    kind: 'BUSINESS',
    sourceSurfaceKeys: [
      'partner-quarterly-bonus-orchestrator'
    ],
    codeFiles: [
      'compensation/partner-manager/partner-quarterly-bonus-orchestrator.js'
    ],
    testFiles: [
      'tests/partner-quarterly-bonus-orchestrator-test.js'
    ],
    ruleArtifacts: [
      'compensation/partner-manager/rule-data/partner-quarterly-bonus-rule-pack.json'
    ],
    documents: [],
    entrypointCandidates: [{
      path:
        'compensation/partner-manager/partner-quarterly-bonus-orchestrator.js',
      score: 3
    }],
    riskTags: ['FINANCIAL_TRUTH'],
    migrationPriority: 30
  };

  const unknownRecruitment = {
    id:
      'CAP-UNCLASSIFIED-CANDIDATE-ONBOARDING',
    key: 'candidate-onboarding',
    domain: 'unclassified',
    kind: 'UNCLASSIFIED',
    sourceSurfaceKeys: [
      'candidate-onboarding'
    ],
    codeFiles: [
      'recruitment/candidate-onboarding-workflow.js'
    ],
    testFiles: [
      'tests/candidate-onboarding-test.js'
    ],
    ruleArtifacts: [],
    documents: [],
    entrypointCandidates: [],
    riskTags: [],
    migrationPriority: 10
  };

  const quoteAdapter = {
    id:
      'CAP-INTEGRATIONS-GMM-QUOTE-ADAPTER',
    key: 'gmm-quote-adapter',
    domain: 'integrations',
    kind: 'INFRASTRUCTURE',
    sourceSurfaceKeys: [
      'gmm-quote-adapter'
    ],
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
    migrationPriority: 15
  };

  const candidateMap = {
    kind:
      'FORGE_LEGACY_CAPABILITY_MAP_CANDIDATE',
    reportHash: 'a'.repeat(64),
    source: {
      legacyHead: 'b'.repeat(40),
      v2Head: 'c'.repeat(40)
    },
    parity: {
      verifiedCapabilities: 0
    },
    counts: {
      rawSurfaces: 4
    },
    capabilities: [
      quarterlyCalculator,
      quarterlyOrchestrator,
      unknownRecruitment,
      quoteAdapter
    ]
  };

  const discoveryReport = {
    kind:
      'FORGE_LEGACY_FUNCTIONAL_PARITY_BASELINE',
    reportHash: 'd'.repeat(64),
    legacy: {
      head: 'b'.repeat(40)
    },
    v2: {
      head: 'c'.repeat(40)
    },
    inventory: {
      dependencies: [{
        source:
          quarterlyOrchestrator.codeFiles[0],
        target:
          quarterlyCalculator.codeFiles[0],
        sourceDomain: 'compensation',
        targetDomain: 'compensation'
      }]
    }
  };

  return {
    candidateMap,
    discoveryReport
  };
}

test(
  'groups calculator and orchestrator through import and functional evidence',
  () => {
    const {
      candidateMap,
      discoveryReport
    } = fixtures();

    const report =
      buildCapabilityGroupingV2({
        discoveryReport,
        candidateMap,
        generatedAt:
          '2026-07-24T00:00:00.000Z'
      });

    const group = report.groups.find(
      item =>
        item.name.includes(
          'partner-quarterly-bonus'
        )
        && item.memberCount === 2
    );

    assert.ok(group);
    assert.equal(
      group.effectiveDomain,
      'compensation'
    );
    assert.equal(
      group.testFiles.length,
      1
    );
    assert.equal(
      group.ruleArtifacts.length,
      1
    );
    assert.equal(
      group.parityVerified,
      false
    );
  }
);

test(
  'infers recruitment from path and name evidence',
  () => {
    const {
      candidateMap,
      discoveryReport
    } = fixtures();

    const report =
      buildCapabilityGroupingV2({
        discoveryReport,
        candidateMap,
        generatedAt:
          '2026-07-24T00:00:00.000Z'
      });

    const inferred =
      report.inferredDomains.find(
        item =>
          item.capabilityId ===
            'CAP-UNCLASSIFIED-CANDIDATE-ONBOARDING'
      );

    assert.ok(inferred);
    assert.equal(
      inferred.inferredDomain,
      'recruitment'
    );
  }
);

test(
  'does not cross-merge business and integration boundaries',
  () => {
    const {
      candidateMap,
      discoveryReport
    } = fixtures();

    const report =
      buildCapabilityGroupingV2({
        discoveryReport,
        candidateMap,
        generatedAt:
          '2026-07-24T00:00:00.000Z'
      });

    assert.equal(
      report.groups.some(group =>
        group.memberCapabilityIds.includes(
          'CAP-INTEGRATIONS-GMM-QUOTE-ADAPTER'
        )
        && group.memberCapabilityIds.includes(
          'CAP-COMPENSATION-PARTNER-QUARTERLY-BONUS-CALCULATOR'
        )
      ),
      false
    );
  }
);

test(
  'never credits parity or retirement',
  () => {
    const {
      candidateMap,
      discoveryReport
    } = fixtures();

    const report =
      buildCapabilityGroupingV2({
        discoveryReport,
        candidateMap,
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
      report.safety.grantsParity,
      false
    );
    assert.equal(
      report.safety.retiresCapabilities,
      false
    );
  }
);

test(
  'report hash is deterministic across generation times',
  () => {
    const {
      candidateMap,
      discoveryReport
    } = fixtures();

    const first =
      buildCapabilityGroupingV2({
        discoveryReport,
        candidateMap,
        generatedAt:
          '2026-07-24T00:00:00.000Z'
      });
    const second =
      buildCapabilityGroupingV2({
        discoveryReport,
        candidateMap,
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
  'CLI writes JSON and Markdown artifacts',
  () => {
    const {
      candidateMap,
      discoveryReport
    } = fixtures();
    const directory = fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        'forge-grouping-v2-'
      )
    );
    const discovery = path.join(
      directory,
      'discovery.json'
    );
    const candidate = path.join(
      directory,
      'candidate.json'
    );
    const json = path.join(
      directory,
      'grouping.json'
    );
    const markdown = path.join(
      directory,
      'grouping.md'
    );

    fs.writeFileSync(
      discovery,
      `${JSON.stringify(
        discoveryReport,
        null,
        2
      )}\n`
    );
    fs.writeFileSync(
      candidate,
      `${JSON.stringify(
        candidateMap,
        null,
        2
      )}\n`
    );

    const result = spawnSync(
      'bash',
      [
        wrapper,
        'group',
        '--discovery',
        discovery,
        '--candidate',
        candidate,
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
      /CAPABILITY_GROUPING_V2=PASS/u
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
      /Grouping proposals are not parity claims/u
    );
  }
);

test(
  'Markdown uses one final newline',
  () => {
    const {
      candidateMap,
      discoveryReport
    } = fixtures();

    const report =
      buildCapabilityGroupingV2({
        discoveryReport,
        candidateMap,
        generatedAt:
          '2026-07-24T00:00:00.000Z'
      });
    const markdown =
      renderGroupingMarkdown(report);

    assert.equal(
      markdown.endsWith('\n'),
      true
    );
    assert.equal(
      markdown.endsWith('\n\n'),
      false
    );
  }
);
test(
  'reconstructs dependency edges from immutable legacy Git blobs when discovery omits them',
  () => {
    const { candidateMap, discoveryReport } = fixtures();
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'forge-grouping-legacy-')
    );

    spawnSync('git', ['-C', directory, 'init'], { encoding: 'utf8' });
    spawnSync(
      'git',
      ['-C', directory, 'config', 'user.name', 'Forge Test'],
      { encoding: 'utf8' }
    );
    spawnSync(
      'git',
      ['-C', directory, 'config', 'user.email', 'forge@example.test'],
      { encoding: 'utf8' }
    );

    const calculator =
      'compensation/partner-manager/partner-quarterly-bonus-calculator.js';
    const orchestrator =
      'compensation/partner-manager/partner-quarterly-bonus-orchestrator.js';

    fs.mkdirSync(
      path.join(directory, path.dirname(calculator)),
      { recursive: true }
    );
    fs.writeFileSync(
      path.join(directory, calculator),
      'export const calculate = value => value;\n'
    );
    fs.writeFileSync(
      path.join(directory, orchestrator),
      "import { calculate } from './partner-quarterly-bonus-calculator.js';\nexport const run = calculate;\n"
    );

    spawnSync('git', ['-C', directory, 'add', '.'], { encoding: 'utf8' });
    const commit = spawnSync(
      'git',
      ['-C', directory, 'commit', '-m', 'fixture'],
      { encoding: 'utf8' }
    );

    assert.equal(
      commit.status,
      0,
      `${commit.stdout}\n${commit.stderr}`
    );

    delete discoveryReport.inventory.dependencies;

    const report = buildCapabilityGroupingV2({
      discoveryReport,
      candidateMap,
      legacyRepository: directory,
      generatedAt: '2026-07-24T00:00:00.000Z'
    });

    assert.equal(
      report.source.dependencyGraphSource,
      'LEGACY_GIT_HEAD_BLOBS'
    );
    assert.equal(report.source.dependencyEdgeCount, 1);
    assert.ok(
      report.groups.some(group =>
        group.memberCount === 2
        && group.name.includes('partner-quarterly-bonus')
      )
    );
  }
);
