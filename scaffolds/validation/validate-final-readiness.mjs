#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { assert, exists, finish, readJson, repoRoot, uniqueIds } from './lib.mjs';

const name = 'validate-final-readiness';
const root = repoRoot();
const files = [
  'scaffolds/manifest/architecture-freeze.json',
  'scaffolds/manifest/canonical-build-tree.json',
  'scaffolds/manifest/final-rewrite-roadmap.json',
  'scaffolds/reports/weighted-architectural-analysis.json',
  'scaffolds/manifest/contract-baseline.json',
  'scaffolds/manifest/first-execution-wave.json',
  'scaffolds/manifest/owner-decision-packet.json',
  'scaffolds/reports/rewrite-go-no-go.json'
];
for (const file of files) {
  assert(exists(file), `missing ${file}`);
  readJson(file);
}

const freeze = readJson('scaffolds/manifest/architecture-freeze.json');
const tree = readJson('scaffolds/manifest/canonical-build-tree.json');
const roadmap = readJson('scaffolds/manifest/final-rewrite-roadmap.json');
const weighted = readJson('scaffolds/reports/weighted-architectural-analysis.json');
const contracts = readJson('scaffolds/manifest/contract-baseline.json');
const firstWave = readJson('scaffolds/manifest/first-execution-wave.json');
const decisions = readJson('scaffolds/manifest/owner-decision-packet.json');
const go = readJson('scaffolds/reports/rewrite-go-no-go.json');
const registry = readJson('scaffolds/manifest/forge-module-registry.json').modules;
const graph = readJson('scaffolds/manifest/dependency-graph.json');
const eligibility = readJson('scaffolds/manifest/execution-eligibility.json');
const semanticAudit = readJson('scaffolds/reports/dependency-semantic-audit.json');

assert(freeze.freeze_state === 'FROZEN', `architecture is not frozen: ${freeze.freeze_state}`);
assert(freeze.source_commit === go.source_commit, 'freeze and GO/NO-GO source commits differ');
assert(freeze.unresolved_conflicts.length === 0, `architecture freeze conflicts remain: ${freeze.unresolved_conflicts.join(', ')}`);
assert(freeze.module_ids.length === registry.length, 'freeze module count differs from registry');
assert(freeze.dependency_graph_id === graph.graph_id, 'freeze references wrong dependency graph');

uniqueIds(tree.nodes, 'canonical build tree nodes');
const nodeIds = new Set(tree.nodes.map(node => node.id));
for (const node of tree.nodes) {
  if (node.parent_id) assert(nodeIds.has(node.parent_id), `tree node ${node.id} has missing parent ${node.parent_id}`);
}
const placements = tree.nodes.filter(node => node.module_id).map(node => node.module_id);
assert(new Set(placements).size === placements.length, 'duplicate module placement in build tree');
for (const module of registry) assert(placements.includes(module.id), `module missing from build tree: ${module.id}`);
assert(tree.validation.orphan_nodes.length === 0, 'build tree has orphan nodes');
assert(tree.validation.active_modules_missing_from_tree.length === 0, 'active modules missing from build tree');
assert(tree.validation.rejected_inside_active_branches.length === 0, 'rejected modules inside active branches');
assert(tree.validation.deferred_inside_active_branches.length === 0, 'deferred modules inside active branches');

assert(roadmap.stage_id_rule.includes('not execution order'), 'roadmap does not document SG order rule');
assert(JSON.stringify(roadmap.eligible_now) === JSON.stringify(eligibility.eligible_now), 'roadmap eligibility differs from source eligibility');
for (const module of roadmap.modules) {
  assert(module.required_contracts.length > 0, `${module.module_id} roadmap entry missing contracts`);
  assert(module.promotion_gate_id, `${module.module_id} roadmap entry missing promotion gate`);
}

assert(weighted.mandatory_critical_path.length === graph.critical_path.length, 'mandatory critical path changed in weighted report');
assert(weighted.weighted_architectural_path.modules.length > 0, 'weighted architectural path is empty');
assert(Number.isInteger(weighted.weighted_architectural_path.score), 'weighted path score must be deterministic integer');

assert(contracts.summary.missing === 0, 'contract baseline has missing contracts');
assert(contracts.summary.conflicted === 0, 'contract baseline has conflicted contracts');
for (const entry of contracts.contracts) {
  assert(fs.existsSync(path.join(root, entry.contract_path)), `contract does not exist: ${entry.contract_path}`);
  assert(entry.breaking_change_policy, `${entry.contract_path} missing breaking change policy`);
  assert(entry.migration_policy, `${entry.contract_path} missing migration policy`);
}

assert(firstWave.first_execution_wave_ready === true, 'first execution wave is not ready');
assert(firstWave.modules.length > 0, 'first execution wave is empty');
const firstWaveIds = firstWave.modules.map(module => module.module_id);
for (const module of firstWave.modules) {
  assert(eligibility.eligible_now.SCAFFOLD.includes(module.module_id), `${module.module_id} is not scaffold eligible`);
  assert(module.rollback_checkpoint, `${module.module_id} missing rollback checkpoint`);
  assert(module.dependencies_satisfied, `${module.module_id} dependencies are not satisfied`);
  assert(module.contracts_satisfied, `${module.module_id} contracts are not satisfied`);
  assert(module.decisions_satisfied, `${module.module_id} decisions are not satisfied`);
  assert(module.evidence_satisfied, `${module.module_id} evidence is not satisfied`);
}
for (const id of firstWaveIds) {
  const module = graph.modules.find(item => item.id === id);
  for (const dependency of module.dependencies) assert(!firstWaveIds.includes(dependency.module_id), `first wave has dependent pair ${id}/${dependency.module_id}`);
}

assert(decisions.decisions.length > 0, 'owner decision packet should record existing blockers');
for (const decision of decisions.decisions) {
  for (const key of ['decision_id', 'module_id', 'question', 'why_required', 'available_options', 'recommended_option', 'tradeoffs', 'constitutional_constraints', 'affected_modules', 'operations_blocked', 'evidence_needed', 'default_if_unresolved']) {
    assert(key in decision, `${decision.decision_id || 'decision'} missing ${key}`);
  }
}

assert(semanticAudit.rejected_in_active_order === 0, 'rejected modules in active execution');
assert(semanticAudit.deferred_in_active_order === 0, 'deferred modules in active execution');
assert(semanticAudit.blocked_without_conditions.length === 0, 'blocked modules without conditions');
assert(semanticAudit.path_values_in_event_fields === 0, 'path values in event fields');
assert(go.final_decision === 'GO' || go.final_decision === 'CONDITIONAL_GO' || go.final_decision === 'NO_GO', 'invalid final decision');
const blockingFailures = go.categories.filter(category => category.blocking && category.status !== 'PASS');
if (go.final_decision !== 'NO_GO') assert(blockingFailures.length === 0, `GO decision has blocking failures: ${blockingFailures.map(item => item.category).join(', ')}`);
if (go.final_decision === 'GO') assert(go.categories.every(category => category.status === 'PASS'), 'GO requires every category PASS');
if (go.final_decision === 'CONDITIONAL_GO') assert(firstWave.first_execution_wave_ready === true, 'CONDITIONAL_GO requires first wave readiness');

finish(name);
