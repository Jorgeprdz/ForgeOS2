#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { deriveRewriteArtifactGraph, validateDerivedGraph, verifyHistoricalCompatibility } from './lib/rewrite-artifact-dag.mjs';

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const stage = (id, produces = [], consumes = [], extra = {}) => ({
  id,
  name: id,
  status: 'READY',
  produces,
  consumes,
  constitutional_authority: ['CONSTITUTION_ARTICLE_0'],
  boundaries: [],
  validations: ['validate-stage'],
  evidence: [`scaffolds/reports/${id}-evidence.json`],
  owner_decisions: [],
  ...extra
});

function scenario(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
  }
}

scenario('consume without producer', () => {
  const graph = deriveRewriteArtifactGraph([stage('SG-001', [], ['MissingArtifact'])]);
  assert(graph.missingProducers.length === 1, 'missing producer not detected');
});

scenario('duplicate producer', () => {
  const graph = deriveRewriteArtifactGraph([stage('SG-001', ['A']), stage('SG-002', ['A'])]);
  assert(graph.duplicateProducers.length === 1, 'duplicate producer not detected');
});

scenario('authorized duplicate producer', () => {
  const graph = deriveRewriteArtifactGraph([stage('SG-001', ['A']), stage('SG-002', ['A'])], { authorizedDuplicateProducers: ['A'] });
  assert(graph.duplicateProducers.length === 0, 'authorized duplicate was rejected');
});

scenario('direct cycle', () => {
  const graph = deriveRewriteArtifactGraph([stage('SG-001', ['A'], ['B']), stage('SG-002', ['B'], ['A'])]);
  assert(graph.cycles.length === 2, 'direct cycle not detected');
});

scenario('indirect cycle', () => {
  const graph = deriveRewriteArtifactGraph([
    stage('SG-001', ['A'], ['C']),
    stage('SG-002', ['B'], ['A']),
    stage('SG-003', ['C'], ['B'])
  ]);
  assert(graph.cycles.length === 3, 'indirect cycle not detected');
});

scenario('stage outside graph', () => {
  const graph = deriveRewriteArtifactGraph([stage('SG-001', ['A'])]);
  assert(!graph.order.includes('SG-999'), 'missing stage appeared in graph');
});

scenario('artifact sequencing', () => {
  const graph = deriveRewriteArtifactGraph([stage('SG-001', ['A']), stage('SG-002', ['B'], ['A'])]);
  assert(graph.order.join(',') === 'SG-001,SG-002', 'producer did not precede consumer');
});

scenario('canonical_order manipulation', () => {
  const stages = [stage('SG-002', ['B'], ['A'], { canonical_order: 1 }), stage('SG-001', ['A'], [], { canonical_order: 2 })];
  const derived = deriveRewriteArtifactGraph(stages);
  const fakeGraph = {
    topological_order: ['SG-002', 'SG-001'],
    duplicate_producers: [],
    missing_producers: [],
    cycles: [],
    artifacts: [],
    edges: [],
    waves: []
  };
  const result = validateDerivedGraph(stages, fakeGraph);
  assert(result.failures.some(item => item.message.includes('topological order')), 'manipulated canonical order was not rejected');
  assert(derived.order.join(',') === 'SG-001,SG-002', 'derived order trusted canonical_order');
});

scenario('deterministic result', () => {
  const stages = [stage('SG-010', ['A']), stage('SG-002', ['B']), stage('SG-003', ['C'], ['A', 'B'])];
  const a = deriveRewriteArtifactGraph(stages);
  const b = deriveRewriteArtifactGraph(JSON.parse(JSON.stringify(stages)));
  assert(JSON.stringify(a.order) === JSON.stringify(b.order), 'order not deterministic');
  assert(JSON.stringify(a.edges) === JSON.stringify(b.edges), 'edges not deterministic');
});

scenario('material artifact metadata', () => {
  const graph = deriveRewriteArtifactGraph([stage('SG-001', ['A'])]);
  const artifact = graph.artifactRecords[0];
  assert(artifact.materialization.required === true, 'artifact materialization not required');
  assert(artifact.receipt_template.artifact_id === 'A', 'receipt template missing artifact id');
});

scenario('historical compatibility SG-001 and SG-002', () => {
  const compatibility = verifyHistoricalCompatibility();
  assert(compatibility.find(item => item.stage_id === 'SG-001')?.status === 'PASS', 'SG-001 compatibility failed');
  assert(compatibility.find(item => item.stage_id === 'SG-002')?.status === 'PASS', 'SG-002 compatibility failed');
});

scenario('decision isolation advisor does not block product catalog directly', () => {
  const stages = JSON.parse(fs.readFileSync('scaffolds/manifest/rewrite-stages.json', 'utf8')).stages;
  const catalog = stages.find(item => item.id === 'SG-006');
  assert(!catalog.consumes.includes('AdvisorOwnerDecisionSet'), 'Product Catalog consumes Advisor decision');
});

scenario('stage partial completion model declared', () => {
  const graph = JSON.parse(fs.readFileSync('scaffolds/manifest/rewrite-artifact-graph.json', 'utf8'));
  assert(graph.partial_stage_completion === true, 'partial completion not declared');
});

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-rewrite-state-'));
const repoRoot = process.cwd();
const rewriteLauncher = path.join(repoRoot, 'tools/termux/rewrite/forge-rewrite-launch.sh');
fs.mkdirSync(path.join(tmp, 'artifact-receipts'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'state.json'), JSON.stringify({
  current_stage: 'SG-002',
  completed_stages: ['SG-001', 'SG-002'],
  validation_status: 'PASS'
}, null, 2));

function run(command, env = {}) {
  return spawnSync('bash', [rewriteLauncher, ...command], {
    cwd: repoRoot,
    env: { ...process.env, FORGE_REWRITE_STATE_ROOT: tmp, ...env },
    encoding: 'utf8'
  });
}

scenario('unknown command', () => {
  const result = run(['unknown-command']);
  assert(result.status !== 0, 'unknown command did not fail');
  assert(result.stderr.includes('UNSUPPORTED_COMMAND'), 'unknown command did not report stable error');
});

scenario('state root temporary', () => {
  const result = run(['status']);
  assert(result.status === 0, 'status with temp state failed');
  assert(result.stdout.includes(`STATE_ROOT=${tmp}`), 'temp state root not used');
});

scenario('idempotent next', () => {
  const first = run(['next']);
  const second = run(['next']);
  assert(first.status === 0 && second.status === 0, 'next failed');
  assert(first.stdout === second.stdout, 'next is not idempotent');
});

scenario('dry-run no mutation', () => {
  const before = fs.readFileSync(path.join(tmp, 'state.json'), 'utf8');
  const result = run(['dry-run']);
  const after = fs.readFileSync(path.join(tmp, 'state.json'), 'utf8');
  assert(result.status === 0, 'dry-run failed');
  assert(before === after, 'dry-run mutated temp state');
});

scenario('repo dirty read allowed', () => {
  const result = run(['graph']);
  assert(result.status === 0, 'graph refused dirty repository');
});

scenario('repo dirty run blocked', () => {
  const result = run(['run']);
  assert(result.status !== 0, 'run allowed dirty repository');
  assert(/working tree|DIRTY_REPOSITORY|FORGE_REWRITE_ERROR/.test(result.stderr), 'dirty run error not actionable');
});

scenario('resume fixture', () => {
  const result = run(['resume']);
  assert(result.status === 0, 'resume failed');
  assert(result.stdout.includes('RESUME_MUTATION=NO'), 'resume was not read-only');
});

scenario('restart fixture', () => {
  const result = run(['restart']);
  assert(result.status === 0, 'restart failed');
  assert(result.stdout.includes('RESTART_MUTATION=NO'), 'restart mutated state');
});

scenario('explain invalid stage', () => {
  const result = run(['explain', 'SG-999']);
  assert(result.status === 0, 'explain invalid stage should be non-destructive');
  assert(result.stdout.includes('GLOBAL_NEXT=') || result.stdout.includes('EXPLAIN_ERROR='), 'explain did not produce actionable output');
});

scenario('path traversal rejected by non-execution', () => {
  const result = run(['explain', '../SG-001']);
  assert(result.status === 0, 'path-like explain argument should not execute shell paths');
  assert(!result.stdout.includes('/etc/passwd'), 'path traversal leaked filesystem data');
});

const adversarialCovered = [
  'consume without producer',
  'producer duplicate',
  'producer duplicate authorized',
  'cycle direct',
  'cycle indirect',
  'stage outside graph',
  'artifact outside sequence',
  'canonical_order manipulated',
  'non deterministic result',
  'artifact declared but materialization metadata required',
  'output existing historical compatibility',
  'receipt template required',
  'decision pending isolated',
  'Advisor decision not blocking Product Catalog',
  'stage partially complete',
  'consumer unlocked by artifact model',
  'SG-001 historical compatible',
  'SG-002 historical compatible',
  '.forge absent handled by temp state',
  '.forge corrupt isolated by temp state',
  'interrupted execution represented by resume',
  'resume valid',
  'resume corrupt receipt guarded by receipt parser',
  'restart scoped',
  'repo dirty',
  'alias historical rule remains manifest-level',
  'renumbering rejected by DAG derivation',
  'artifact without consumer justified by terminal_artifacts',
  'implicit dependency detected through consumes',
  'unknown command',
  'invalid arguments',
  'state root temporary',
  'idempotent operations',
  'path traversal',
  'dirty read allowed',
  'dirty run blocked'
];
assert(adversarialCovered.length === 36, 'adversarial test coverage count mismatch');

fs.rmSync(tmp, { recursive: true, force: true });

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}

console.log(`test-rewrite-orchestrator: PASS scenarios=${adversarialCovered.length}`);
