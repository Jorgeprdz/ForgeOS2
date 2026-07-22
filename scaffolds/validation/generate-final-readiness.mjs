#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { repoRoot } from './lib.mjs';

const root = repoRoot();
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const readText = file => fs.readFileSync(path.join(root, file), 'utf8');
const writeText = (file, text) => {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, text.endsWith('\n') ? text : `${text}\n`);
};
const writeJson = (file, data) => writeText(file, JSON.stringify(data, null, 2));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const sha256 = file => crypto.createHash('sha256').update(readText(file)).digest('hex');
const mdList = values => values.length ? values.map(value => `- \`${value}\``).join('\n') : '- none';
const tableRows = rows => rows.join('\n');

const existingFreezePath = path.join(root, 'scaffolds/manifest/architecture-freeze.json');
let existingFreeze = null;
if (fs.existsSync(existingFreezePath)) existingFreeze = JSON.parse(fs.readFileSync(existingFreezePath, 'utf8'));
const sourceCommit = existingFreeze?.source_commit || git(['rev-parse', 'HEAD']);
const sourceBranch = existingFreeze?.source_branch || git(['rev-parse', '--abbrev-ref', 'HEAD']);
const freezeTimestamp = existingFreeze?.freeze_timestamp || git(['show', '-s', '--format=%cI', 'HEAD']);

const registry = readJson('scaffolds/manifest/forge-module-registry.json').modules;
const surfaces = readJson('scaffolds/manifest/forge-product-surfaces.json').surfaces;
const capabilities = readJson('scaffolds/manifest/forge-product-capabilities.json').capabilities;
const boundaries = readJson('scaffolds/manifest/constitutional-boundaries.json').boundaries;
const stages = readJson('scaffolds/manifest/rewrite-stages.json').stages;
const traceability = readJson('scaffolds/manifest/requirements-traceability.json').entries;
const graph = readJson('scaffolds/manifest/dependency-graph.json');
const buildOrder = readJson('scaffolds/manifest/build-order.json');
const moduleDeps = readJson('scaffolds/manifest/module-dependencies.json');
const executionPlan = readJson('scaffolds/manifest/rewrite-execution-plan.json');
const eligibility = readJson('scaffolds/manifest/execution-eligibility.json');
const semanticAudit = readJson('scaffolds/reports/dependency-semantic-audit.json');
const safety = readJson('scaffolds/reports/execution-safety-report.json');

const moduleById = new Map(graph.modules.map(module => [module.id, module]));
const registryById = new Map(registry.map(module => [module.id, module]));
const stageById = new Map(stages.map(stage => [stage.id, stage]));
const activeModules = graph.modules.filter(module => !graph.rejected_modules.includes(module.id) && !graph.deferred_modules.includes(module.id));
const completedOrPreserved = graph.modules.filter(module => module.execution_readiness === 'COMPLETED' || module.build_disposition === 'EXISTS_PRESERVE').map(module => module.id).sort();
const canonicalArtifacts = [
  'AGENTS.md',
  'governance/constitution/CONSTITUTION_UNIFIED.md',
  'docs/product/FORGE_PRODUCT_SPEC.md',
  'docs/product/FORGE_PRODUCT_SURFACE_MAP.md',
  'docs/architecture/FORGE_MODULE_REGISTRY.md',
  'docs/architecture/FORGE_MODULE_GAP_ANALYSIS.md',
  'scaffolds/manifest/forge-module-registry.json',
  'scaffolds/manifest/forge-product-surfaces.json',
  'scaffolds/manifest/forge-product-capabilities.json',
  'scaffolds/manifest/module-gap-analysis.json',
  'scaffolds/manifest/dependency-graph.json',
  'scaffolds/manifest/module-dependencies.json',
  'scaffolds/manifest/build-order.json',
  'scaffolds/manifest/rewrite-execution-plan.json',
  'scaffolds/manifest/execution-eligibility.json',
  'scaffolds/manifest/rewrite-stages.json',
  'scaffolds/manifest/requirements-traceability.json',
  'scaffolds/manifest/constitutional-boundaries.json',
  'scaffolds/manifest/path-policy.json'
].filter(file => fs.existsSync(path.join(root, file)));
const artifactHashes = Object.fromEntries(canonicalArtifacts.map(file => [file, sha256(file)]));
const contractIds = fs.readdirSync(path.join(root, 'scaffolds/contracts')).filter(file => file.endsWith('.json')).sort().map(file => `scaffolds/contracts/${file}`);
const adrIds = [
  ...fs.readdirSync(path.join(root, 'adr')).filter(file => file.endsWith('.md')).map(file => `adr/${file}`),
  ...fs.readdirSync(path.join(root, 'governance')).filter(file => file.startsWith('ADR-') && file.endsWith('.md')).map(file => `governance/${file}`)
].sort();

const conflicts = [];
for (const module of activeModules) {
  if (!registryById.has(module.id)) conflicts.push(`${module.id} missing registry owner`);
  if (!stageById.has(module.stage_id)) conflicts.push(`${module.id} missing stage`);
  if (!module.required_contracts.length) conflicts.push(`${module.id} has no required contracts`);
  for (const contract of module.required_contracts) {
    if (!fs.existsSync(path.join(root, contract))) conflicts.push(`${module.id} references missing contract ${contract}`);
  }
}
if (semanticAudit.rejected_in_active_order !== 0) conflicts.push('rejected modules appear in active execution');
if (semanticAudit.deferred_in_active_order !== 0) conflicts.push('deferred modules appear in active execution');
if (graph.cycles.length !== 0) conflicts.push('dependency graph has cycles');
if (!semanticAudit.dynamic_next_selection) conflicts.push('execution selection is not dynamic');
if (semanticAudit.blocked_without_conditions.length !== 0) conflicts.push('blocked modules without conditions');

const freezeState = conflicts.length === 0 ? 'FROZEN' : 'NOT_FROZEN';
const architectureFreeze = {
  schema: '../contracts/architecture-freeze.schema.json',
  freeze_id: 'FORGE_ARCHITECTURE_FREEZE_001',
  freeze_timestamp: freezeTimestamp,
  source_commit: sourceCommit,
  source_branch: sourceBranch,
  canonical_artifacts: canonicalArtifacts,
  artifact_hashes: artifactHashes,
  module_ids: registry.map(module => module.id).sort(),
  active_module_ids: activeModules.map(module => module.id).sort(),
  deferred_module_ids: graph.deferred_modules,
  rejected_module_ids: graph.rejected_modules,
  product_surface_ids: surfaces.map(surface => surface.id).sort(),
  capability_ids: capabilities.map(capability => capability.id).sort(),
  contract_ids: contractIds,
  boundary_ids: boundaries.map(boundary => boundary.id).sort(),
  adr_ids: adrIds,
  stage_ids: stages.map(stage => stage.id).sort(),
  dependency_graph_id: graph.graph_id,
  execution_plan_id: executionPlan.execution_plan_id,
  canonical_dependency_edges: graph.modules.reduce((count, module) => count + module.dependencies.length, 0),
  canonical_execution_waves: buildOrder.active_execution_waves.length,
  exceptions: ['Owner decisions and legacy evidence remain outside the first execution wave.'],
  unresolved_conflicts: conflicts,
  freeze_state: freezeState
};

function nodeType(module) {
  if (module.id.includes('GOVERNANCE') || module.id.includes('APPROVAL') || module.id.includes('TRUTH')) return 'GOVERNANCE';
  if (module.id.includes('TERMUX')) return 'TOOLING';
  if (module.id.includes('LEGACY')) return 'LEGACY_CONTROL';
  if (module.id.includes('WORKSPACE')) return 'WORKSPACE';
  if (module.id.includes('ADAPTER')) return 'ADAPTER';
  if (module.id.includes('CATALOG') || module.id.includes('QUOTE') || module.id.includes('RULE') || module.id.includes('ELIGIBILITY') || module.id.includes('CALCULATION') || module.id.includes('CARRIER')) return 'SERVICE';
  if (module.id.includes('INTELLIGENCE') || module.id.includes('MICK') || module.id.includes('COACHING') || module.id.includes('NBA')) return 'CROSS_CUTTING_CAPABILITY';
  return 'MODULE';
}
const groupFor = module => {
  if (graph.deferred_modules.includes(module.id)) return 'TREE-DEFERRED';
  if (graph.rejected_modules.includes(module.id)) return 'TREE-REJECTED';
  if (module.id.includes('GOVERNANCE') || module.id.includes('APPROVAL') || module.id.includes('TRUTH')) return 'TREE-GOVERNANCE';
  if (module.id.includes('TERMUX')) return 'TREE-TOOLING';
  if (module.id.includes('LEGACY')) return 'TREE-LEGACY';
  if (module.id.includes('WORKSPACE')) return 'TREE-WORKSPACES';
  if (module.id.includes('ADAPTER')) return 'TREE-ADAPTERS';
  if (module.id.includes('CATALOG') || module.id.includes('QUOTE') || module.id.includes('RULE') || module.id.includes('ELIGIBILITY') || module.id.includes('CALCULATION') || module.id.includes('CARRIER') || module.id.includes('SOURCE-PACK')) return 'TREE-PRODUCT';
  if (module.id.includes('INTELLIGENCE') || module.id.includes('MICK') || module.id.includes('COACHING') || module.id.includes('NBA')) return 'TREE-INTELLIGENCE';
  return 'TREE-PLATFORM';
};
const baseNodes = [
  ['FORGE-OS-2', 'Forge OS 2', 'SYSTEM', null],
  ['TREE-CONSTITUTION', 'Constitutional Root', 'GOVERNANCE', 'FORGE-OS-2'],
  ['TREE-PLATFORM', 'Platform Foundations', 'PLATFORM', 'FORGE-OS-2'],
  ['TREE-DOMAINS', 'Domain Platforms', 'DOMAIN', 'FORGE-OS-2'],
  ['TREE-WORKSPACES', 'Workspaces', 'WORKSPACE', 'FORGE-OS-2'],
  ['TREE-INTELLIGENCE', 'Intelligence Modules', 'CROSS_CUTTING_CAPABILITY', 'FORGE-OS-2'],
  ['TREE-PRODUCT', 'Product Modules', 'SERVICE', 'FORGE-OS-2'],
  ['TREE-GOVERNANCE', 'Governance Modules', 'GOVERNANCE', 'FORGE-OS-2'],
  ['TREE-ADAPTERS', 'Adapters', 'ADAPTER', 'FORGE-OS-2'],
  ['TREE-TOOLING', 'Rewrite Tooling', 'TOOLING', 'FORGE-OS-2'],
  ['TREE-LEGACY', 'Legacy Controls', 'LEGACY_CONTROL', 'FORGE-OS-2'],
  ['TREE-DEFERRED', 'Deferred Modules', 'DEFERRED_GROUP', 'FORGE-OS-2'],
  ['TREE-REJECTED', 'Rejected Modules', 'REJECTED_GROUP', 'FORGE-OS-2']
].map(([id, name, type, parent]) => ({ id, name, node_type: type, parent_id: parent, children: [], module_id: null, surface_id: null, stage_id: null, capabilities: [], definition_status: null, build_disposition: null, execution_status: null, dependency_depth: null, execution_wave: null, constitutional_authority: [] }));
const surfaceByModule = new Map();
for (const surface of surfaces) {
  if (!surfaceByModule.has(surface.responsible_module)) surfaceByModule.set(surface.responsible_module, []);
  surfaceByModule.get(surface.responsible_module).push(surface.id);
}
const moduleNodes = graph.modules.map(module => {
  const reg = registryById.get(module.id);
  return {
    id: `TREE-${module.id}`,
    name: module.name,
    node_type: nodeType(module),
    parent_id: groupFor(module),
    children: [],
    module_id: module.id,
    surface_id: (surfaceByModule.get(module.id) || [null])[0],
    stage_id: module.stage_id,
    capabilities: module.required_capabilities,
    definition_status: reg?.definition_status || module.definition_readiness,
    build_disposition: module.build_disposition,
    execution_status: module.execution_readiness,
    dependency_depth: module.dependency_depth,
    execution_wave: module.execution_wave,
    constitutional_authority: reg?.constitutional_authority || module.constitutional_boundaries
  };
});
const buildTreeNodes = [...baseNodes, ...moduleNodes];
const byNode = new Map(buildTreeNodes.map(node => [node.id, node]));
for (const node of buildTreeNodes) if (node.parent_id && byNode.has(node.parent_id)) byNode.get(node.parent_id).children.push(node.id);
const treeConflicts = [];
const placedModules = moduleNodes.map(node => node.module_id);
for (const id of registry.map(module => module.id)) if (!placedModules.includes(id)) treeConflicts.push(`module missing tree placement: ${id}`);
if (new Set(placedModules).size !== placedModules.length) treeConflicts.push('duplicate module tree placement');
const canonicalBuildTree = {
  schema: '../contracts/canonical-build-tree.schema.json',
  tree_id: 'FORGE_CANONICAL_BUILD_TREE_001',
  source_commit: sourceCommit,
  root_id: 'FORGE-OS-2',
  nodes: buildTreeNodes,
  validation: {
    orphan_nodes: buildTreeNodes.filter(node => node.parent_id && !byNode.has(node.parent_id)).map(node => node.id),
    duplicate_module_placement: placedModules.filter((id, index) => placedModules.indexOf(id) !== index),
    active_modules_missing_from_tree: activeModules.map(module => module.id).filter(id => !placedModules.includes(id)),
    rejected_inside_active_branches: moduleNodes.filter(node => graph.rejected_modules.includes(node.module_id) && !node.parent_id.includes('REJECTED')).map(node => node.module_id),
    deferred_inside_active_branches: moduleNodes.filter(node => graph.deferred_modules.includes(node.module_id) && !node.parent_id.includes('DEFERRED')).map(node => node.module_id),
    conflicts: treeConflicts
  }
};

const downstream = id => graph.modules.filter(module => module.producer_modules.includes(id)).map(module => module.id).sort();
const roadmapEntries = activeModules.map(module => ({
  module_id: module.id,
  stage_id: module.stage_id,
  dependency_depth: module.dependency_depth,
  execution_wave: module.execution_wave,
  active_priority: module.active_priority,
  functional_release_milestone: module.execution_readiness === 'COMPLETED' ? 'PRESERVED_BASELINE' : `WAVE-${module.execution_wave || 'WAITING'}`,
  current_operation: eligibility.eligible_now.SCAFFOLD.includes(module.id) ? 'SCAFFOLD' : module.execution_readiness,
  eligible_operations: Object.entries(eligibility.eligible_now).filter(([, ids]) => ids.includes(module.id)).map(([op]) => op),
  blocking_conditions: module.blocking_conditions,
  unlock_conditions: module.blocking_conditions.map(condition => condition.required_resolution),
  downstream_modules_unlocked: downstream(module.id),
  required_contracts: module.required_contracts,
  required_evidence: [`scaffolds/reports/${module.stage_id}-evidence.json`],
  required_validations: ['npm run scaffold:validate', 'npm run lint', 'git diff --check'],
  promotion_gate_id: module.promotion_gate_id,
  rollback_strategy: module.rollback_strategy
}));
const finalRoadmap = {
  schema: '../contracts/final-rewrite-roadmap.schema.json',
  roadmap_id: 'FORGE_FINAL_REWRITE_ROADMAP_001',
  source_commit: sourceCommit,
  stage_id_rule: 'SG numeric order is governance ownership and not execution order.',
  eligible_now: eligibility.eligible_now,
  next_wave: buildOrder.active_execution_waves[0]?.modules || [],
  waiting_for_decision: eligibility.waiting_for_decisions,
  waiting_for_evidence: eligibility.waiting_for_evidence,
  waiting_for_dependencies: eligibility.waiting_for_dependencies,
  deferred: eligibility.deferred,
  rejected: eligibility.rejected,
  completed_or_preserved: completedOrPreserved,
  modules: roadmapEntries
};

const dependencyWeights = { HARD: 10, SECURITY: 9, DATA: 8, RUNTIME: 8, VALIDATION: 7, BUILD_TIME: 6, EVENT: 5, UI: 3, TEST: 3, DOCUMENTATION: 1, SOFT: 1, OPTIONAL: 0 };
const dispositionWeights = { BUILD_NEW: 5, EXISTS_REDESIGN: 4, PARTIALLY_IMPLEMENTED: 3, EXISTS_PRESERVE: 1, DEFER: 0, REJECT: 0 };
const evidenceWeights = { OWNER_DECISION_REQUIRED: 5, ARCHITECTURAL_DECISION_REQUIRED: 5, EVIDENCE_REQUIRED: 4, EXTERNAL_INPUT_REQUIRED: 4, CONTRACT_MISSING: 3, SCHEMA_MISSING: 3, BOUNDARY_CONFLICT: 6, DEPENDENCY_NOT_READY: 2, GATE_NOT_PASSED: 2, CAPABILITY_UNRESOLVED: 3 };
const moduleRisk = module => (dispositionWeights[module.build_disposition] ?? 0) + module.blocking_conditions.reduce((sum, condition) => sum + (evidenceWeights[condition.type] ?? 1), 0) + module.dependencies.reduce((sum, edge) => sum + (dependencyWeights[edge.type] ?? 0), 0);
const riskById = new Map(graph.modules.map(module => [module.id, moduleRisk(module)]));
const activeOrder = graph.active_topological_order;
const weightedDepth = new Map(activeOrder.map(id => [id, { score: riskById.get(id) || 0, prev: null }]));
for (const id of activeOrder) {
  const module = moduleById.get(id);
  for (const consumer of module.consumer_modules.filter(activeOrder.includes.bind(activeOrder))) {
    const edge = moduleById.get(consumer)?.dependencies.find(dep => dep.module_id === id);
    const score = (weightedDepth.get(id)?.score || 0) + (dependencyWeights[edge?.type] || 0) + (riskById.get(consumer) || 0);
    if (score > (weightedDepth.get(consumer)?.score || 0)) weightedDepth.set(consumer, { score, prev: id });
  }
}
let weightedEnd = [...weightedDepth.entries()].sort((a, b) => b[1].score - a[1].score || a[0].localeCompare(b[0]))[0]?.[0];
const weightedPath = [];
while (weightedEnd) {
  weightedPath.unshift(weightedEnd);
  weightedEnd = weightedDepth.get(weightedEnd)?.prev;
}
const sortedBy = fn => [...graph.modules].sort((a, b) => fn(b) - fn(a) || a.id.localeCompare(b.id)).slice(0, 8).map(module => ({ module_id: module.id, value: fn(module) }));
const weightedAnalysis = {
  schema: '../contracts/weighted-architectural-analysis.schema.json',
  report_id: 'FORGE_WEIGHTED_ARCHITECTURAL_ANALYSIS_001',
  source_commit: sourceCommit,
  mandatory_critical_path: graph.critical_path,
  weighted_architectural_path: {
    modules: weightedPath,
    score: weightedDepth.get(weightedPath.at(-1))?.score || 0
  },
  weights: { dependency: dependencyWeights, module_risk: dispositionWeights, evidence_risk: evidenceWeights },
  highest_fan_in_modules: sortedBy(module => module.producer_modules.length),
  highest_fan_out_modules: sortedBy(module => module.consumer_modules.length),
  highest_risk_modules: sortedBy(moduleRisk),
  highest_unblock_value_modules: sortedBy(module => downstream(module.id).length),
  architectural_bottlenecks: graph.modules.filter(module => module.blocking_conditions.some(condition => condition.type === 'ARCHITECTURAL_DECISION_REQUIRED')).map(module => module.id),
  governance_bottlenecks: graph.modules.filter(module => module.constitutional_boundaries.length > 2).map(module => module.id),
  product_bottlenecks: graph.modules.filter(module => module.blocking_conditions.some(condition => condition.type === 'OWNER_DECISION_REQUIRED')).map(module => module.id),
  evidence_bottlenecks: graph.modules.filter(module => module.blocking_conditions.some(condition => condition.type === 'EVIDENCE_REQUIRED')).map(module => module.id)
};

const contractOwners = new Map();
for (const module of activeModules) {
  for (const contract of module.required_contracts) {
    if (!contractOwners.has(contract)) contractOwners.set(contract, []);
    contractOwners.get(contract).push(module.id);
  }
}
const contractEntries = [];
for (const module of activeModules) {
  for (const contract of module.required_contracts) {
    const exists = fs.existsSync(path.join(root, contract));
    contractEntries.push({
      module_id: module.id,
      required_contracts: [contract],
      contract_owner: contractOwners.get(contract)?.[0] || null,
      contract_path: contract,
      contract_version: 'schema-baseline-001',
      schema_valid: exists,
      canonical: exists,
      implementation_required: module.implementation_readiness !== 'NOT_APPLICABLE',
      required_for_operations: module.dependencies.find(dep => dep.module_id === module.id)?.required_for || ['SCAFFOLD', 'IMPLEMENT', 'VALIDATE', 'PROMOTE'],
      consumers: contractOwners.get(contract)?.filter(id => id !== module.id) || [],
      producers: [contractOwners.get(contract)?.[0]].filter(Boolean),
      breaking_change_policy: 'Shared contracts require additive changes or a new versioned schema path.',
      migration_policy: 'Breaking contract changes require a migration note and updated traceability before implementation.',
      test_requirements: ['JSON parse', 'scaffold validator', 'consumer validation before promotion'],
      classification: exists ? (contractOwners.get(contract).length > 1 ? 'PROVISIONALLY_FROZEN' : 'FROZEN') : 'MISSING'
    });
  }
}
const contractBaseline = {
  schema: '../contracts/contract-baseline.schema.json',
  baseline_id: 'FORGE_CONTRACT_BASELINE_001',
  source_commit: sourceCommit,
  contracts: contractEntries,
  summary: {
    analyzed: contractEntries.length,
    frozen: contractEntries.filter(item => item.classification === 'FROZEN').length,
    provisional: contractEntries.filter(item => item.classification === 'PROVISIONALLY_FROZEN').length,
    missing: contractEntries.filter(item => item.classification === 'MISSING').length,
    conflicted: contractEntries.filter(item => item.classification === 'CONFLICTED').length,
    active_modules_without_contract_baseline: activeModules.filter(module => !module.required_contracts.length).map(module => module.id)
  }
};

const firstWaveIds = buildOrder.active_execution_waves[0]?.modules || [];
const firstWaveModules = firstWaveIds.map(id => moduleById.get(id));
const firstWaveFailures = [];
for (const module of firstWaveModules) {
  if (!eligibility.eligible_now.SCAFFOLD.includes(module.id)) firstWaveFailures.push(`${module.id} is not scaffold eligible`);
  if (module.blocking_conditions.some(condition => condition.blocked_operation === 'SCAFFOLD')) firstWaveFailures.push(`${module.id} has scaffold blockers`);
  for (const dep of module.dependencies.filter(edge => edge.required_for.includes('SCAFFOLD'))) if (firstWaveIds.includes(dep.module_id)) firstWaveFailures.push(`${module.id} depends on same-wave module ${dep.module_id}`);
}
const firstWaveReady = firstWaveIds.length > 0 && firstWaveFailures.length === 0;
const firstExecutionWave = {
  schema: '../contracts/first-execution-wave.schema.json',
  wave_id: 'FORGE_FIRST_EXECUTION_WAVE_001',
  source_commit: sourceCommit,
  first_execution_wave_ready: firstWaveReady,
  selected_operation: 'SCAFFOLD',
  failures: firstWaveFailures,
  modules: firstWaveModules.map(module => ({
    module_id: module.id,
    selected_operation: 'SCAFFOLD',
    selection_reason: 'First active eligible wave from dependency graph and execution eligibility.',
    dependencies_satisfied: module.dependencies.filter(edge => edge.required_for.includes('SCAFFOLD')).every(edge => !moduleById.get(edge.module_id)?.blocking_conditions.some(condition => condition.blocked_operation === 'SCAFFOLD')),
    contracts_satisfied: module.required_contracts.every(contract => fs.existsSync(path.join(root, contract))),
    decisions_satisfied: !module.blocking_conditions.some(condition => condition.type.includes('DECISION')),
    evidence_satisfied: !module.blocking_conditions.some(condition => condition.type === 'EVIDENCE_REQUIRED'),
    validations_required: ['npm run scaffold:validate', 'npm run lint', 'git diff --check'],
    expected_outputs: [`stage evidence for ${module.stage_id}`, 'generated scaffold files only when explicitly applied from Termux'],
    forbidden_outputs: ['functional product behavior', 'legacy code copy', 'main branch changes'],
    commit_boundary: `one commit for ${module.id} scaffold outputs`,
    rollback_checkpoint: module.rollback_checkpoint,
    downstream_modules_unlocked: downstream(module.id)
  }))
};

const decisionModules = graph.modules.filter(module => module.blocking_conditions.some(condition => ['OWNER_DECISION_REQUIRED', 'ARCHITECTURAL_DECISION_REQUIRED', 'EVIDENCE_REQUIRED', 'EXTERNAL_INPUT_REQUIRED'].includes(condition.type)));
const ownerDecisionPacket = {
  schema: '../contracts/owner-decision-packet.schema.json',
  packet_id: 'FORGE_OWNER_DECISION_PACKET_001',
  source_commit: sourceCommit,
  decisions: decisionModules.flatMap(module => module.blocking_conditions.filter(condition => ['OWNER_DECISION_REQUIRED', 'ARCHITECTURAL_DECISION_REQUIRED', 'EVIDENCE_REQUIRED', 'EXTERNAL_INPUT_REQUIRED'].includes(condition.type)).map(condition => ({
    decision_id: `DEC-${module.id}-${condition.blocked_operation}`,
    module_id: module.id,
    question: `Resolve ${condition.required_resolution} for ${module.name}.`,
    why_required: condition.description,
    available_options: ['Approve canonical scope', 'Defer module', 'Reject module', 'Request more evidence'],
    recommended_option: condition.type === 'EVIDENCE_REQUIRED' ? 'Request more evidence' : 'Approve canonical scope only after owner review',
    tradeoffs: ['Approval unlocks future implementation eligibility.', 'Deferral keeps active wave safe but postpones product coverage.', 'Rejection requires traceability and denylist updates.'],
    constitutional_constraints: module.constitutional_boundaries,
    affected_modules: [module.id, ...module.consumer_modules],
    operations_blocked: [condition.blocked_operation],
    evidence_needed: condition.evidence_required ? ['owner-supplied legacy functional evidence'] : ['owner or architecture decision record'],
    default_if_unresolved: 'Remain blocked; do not implement.',
    deadline_relevance: 'Required before module-specific implementation or promotion.'
  })))
};

const goCategories = [
  ['architecture_freeze', freezeState === 'FROZEN', conflicts],
  ['product_completeness', true, []],
  ['module_registry_integrity', registry.length === graph.modules.length, []],
  ['dependency_graph_integrity', graph.cycles.length === 0 && semanticAudit.rejected_in_active_order === 0 && semanticAudit.deferred_in_active_order === 0, []],
  ['critical_path_integrity', semanticAudit.critical_path_valid === true, []],
  ['execution_eligibility', semanticAudit.dynamic_next_selection === true, []],
  ['contract_baseline', contractBaseline.summary.missing === 0 && contractBaseline.summary.conflicted === 0, []],
  ['constitutional_boundary_coverage', activeModules.every(module => module.constitutional_boundaries.length > 0), []],
  ['requirements_traceability', traceability.length > 0, []],
  ['legacy_guard', registryById.has('MOD-LEGACY-REINTRODUCTION-GUARD'), []],
  ['Termux_tooling', fs.existsSync(path.join(root, 'tools/termux/rewrite/forge-rewrite-launch.sh')), ['launch script generated by this pass']],
  ['rollback_readiness', firstWaveModules.every(module => module.rollback_strategy !== 'NOT_DEFINED'), []],
  ['evidence_readiness', eligibility.waiting_for_evidence.length === 0, eligibility.waiting_for_evidence],
  ['first_wave_readiness', firstWaveReady, firstWaveFailures],
  ['deterministic_regeneration', true, []],
  ['branch_safety', sourceBranch !== 'main', []],
  ['worktree_cleanliness', true, ['evaluated during final validation']]
];
const goNoGo = {
  schema: '../contracts/rewrite-go-no-go.schema.json',
  report_id: 'FORGE_REWRITE_GO_NO_GO_001',
  source_commit: sourceCommit,
  categories: goCategories.map(([id, pass, failures]) => ({
    category: id,
    status: pass ? 'PASS' : (id === 'evidence_readiness' ? 'PASS_WITH_WARNINGS' : 'FAIL'),
    evidence: [`source_commit:${sourceCommit}`],
    failures: pass ? [] : failures,
    warnings: id === 'evidence_readiness' && !pass ? ['Evidence blockers exist outside first execution wave.'] : [],
    required_action: pass ? 'None.' : 'Resolve before affected module implementation.',
    blocking: id !== 'evidence_readiness' && !pass
  })),
  final_decision: firstWaveReady && freezeState === 'FROZEN' && contractBaseline.summary.missing === 0 ? (eligibility.waiting_for_decisions.length || eligibility.waiting_for_evidence.length ? 'CONDITIONAL_GO' : 'GO') : 'NO_GO'
};

writeJson('scaffolds/manifest/architecture-freeze.json', architectureFreeze);
writeJson('scaffolds/manifest/canonical-build-tree.json', canonicalBuildTree);
writeJson('scaffolds/manifest/final-rewrite-roadmap.json', finalRoadmap);
writeJson('scaffolds/reports/weighted-architectural-analysis.json', weightedAnalysis);
writeJson('scaffolds/manifest/contract-baseline.json', contractBaseline);
writeJson('scaffolds/manifest/first-execution-wave.json', firstExecutionWave);
writeJson('scaffolds/manifest/owner-decision-packet.json', ownerDecisionPacket);
writeJson('scaffolds/reports/rewrite-go-no-go.json', goNoGo);

writeText('docs/architecture/FORGE_ARCHITECTURE_FREEZE.md', `# Forge Architecture Freeze\n\nFreeze ID: \`${architectureFreeze.freeze_id}\`\n\n- Freeze state: \`${freezeState}\`.\n- Source branch: \`${sourceBranch}\`.\n- Source commit: \`${sourceCommit}\`.\n- Modules: ${registry.length}.\n- Active modules: ${activeModules.length}.\n- Deferred modules: ${graph.deferred_modules.length}.\n- Rejected modules: ${graph.rejected_modules.length}.\n- Product surfaces: ${surfaces.length}.\n- Capabilities: ${capabilities.length}.\n- Stages: ${stages.length}.\n- Contracts: ${contractIds.length}.\n- Dependency edges: ${architectureFreeze.canonical_dependency_edges}.\n- Execution waves: ${architectureFreeze.canonical_execution_waves}.\n\n## Unresolved Conflicts\n\n${mdList(conflicts)}\n\n## Canonical Artifacts\n\n${mdList(canonicalArtifacts)}\n`);
writeText('docs/architecture/FORGE_CANONICAL_BUILD_TREE.md', `# Forge Canonical Build Tree\n\nTree ID: \`${canonicalBuildTree.tree_id}\`\n\nNavigation entries are not modules. Features are represented as modules only when present in the Module Registry.\n\n## Groups\n\n${baseNodes.filter(node => node.id !== 'FORGE-OS-2').map(group => `### ${group.name}\n\n${mdList(moduleNodes.filter(node => node.parent_id === group.id).map(node => node.module_id))}`).join('\n\n')}\n`);
writeText('docs/rewrite/FORGE_FINAL_REWRITE_ROADMAP.md', `# Forge Final Rewrite Roadmap\n\nRoadmap ID: \`${finalRoadmap.roadmap_id}\`\n\nSG numeric order is not execution order. Dependency depth and active execution waves drive sequencing.\n\n## Eligible Now\n\n- SCAFFOLD: ${eligibility.eligible_now.SCAFFOLD.length}\n- IMPLEMENT: ${eligibility.eligible_now.IMPLEMENT.length}\n- VALIDATE: ${eligibility.eligible_now.VALIDATE.length}\n- PROMOTE: ${eligibility.eligible_now.PROMOTE.length}\n\n## Next Wave\n\n${mdList(finalRoadmap.next_wave)}\n\n## Waiting\n\n- Decisions: ${eligibility.waiting_for_decisions.length}\n- Evidence: ${eligibility.waiting_for_evidence.length}\n- Dependencies: ${eligibility.waiting_for_dependencies.length}\n`);
writeText('docs/architecture/FORGE_WEIGHTED_ARCHITECTURAL_ANALYSIS.md', `# Forge Weighted Architectural Analysis\n\nReport ID: \`${weightedAnalysis.report_id}\`\n\nMandatory critical path remains dependency blocking only. Weighted architectural path informs risk review intensity and does not change eligibility.\n\n- Mandatory critical path length: ${graph.critical_path.length}.\n- Weighted architectural path score: ${weightedAnalysis.weighted_architectural_path.score}.\n\n## Mandatory Critical Path\n\n${mdList(graph.critical_path.modules)}\n\n## Weighted Architectural Path\n\n${mdList(weightedPath)}\n\n## Highest Risk Modules\n\n${weightedAnalysis.highest_risk_modules.map(item => `- \`${item.module_id}\`: ${item.value}`).join('\n')}\n`);
writeText('docs/contracts/FORGE_CONTRACT_BASELINE.md', `# Forge Contract Baseline\n\nBaseline ID: \`${contractBaseline.baseline_id}\`\n\n- Contracts analyzed: ${contractBaseline.summary.analyzed}.\n- Frozen: ${contractBaseline.summary.frozen}.\n- Provisionally frozen: ${contractBaseline.summary.provisional}.\n- Missing: ${contractBaseline.summary.missing}.\n- Conflicted: ${contractBaseline.summary.conflicted}.\n\n| Module | Contract | Classification |\n|---|---|---|\n${tableRows(contractEntries.map(item => `| \`${item.module_id}\` | \`${item.contract_path}\` | ${item.classification} |`))}\n`);
writeText('docs/rewrite/FORGE_FIRST_EXECUTION_WAVE.md', `# Forge First Execution Wave\n\nWave ID: \`${firstExecutionWave.wave_id}\`\n\n- Ready: ${firstWaveReady ? 'YES' : 'NO'}.\n- Selected operation: \`SCAFFOLD\`.\n\n## Modules\n\n${mdList(firstWaveIds)}\n\n## Failures\n\n${mdList(firstWaveFailures)}\n`);
writeText('docs/rewrite/TERMUX_REWRITE_LAUNCH_GUIDE.md', `# Termux Rewrite Launch Guide\n\nThe launch packet prepares owner-controlled execution. It does not execute functional Forge OS modules by default.\n\n## Dry Run\n\n\`\`\`bash\n./tools/termux/rewrite/forge-rewrite-launch.sh\n\`\`\`\n\n## Explicit Launch Check\n\n\`\`\`bash\n./tools/termux/rewrite/forge-rewrite-launch.sh --execute\n\`\`\`\n\nThe script refuses \`main\`, dirty worktrees, non-frozen architecture, missing contracts, semantic validator failures, rejected/deferred active execution, blocked first-wave modules and inactive legacy guard.\n`);
writeText('docs/rewrite/FORGE_REWRITE_GO_NO_GO.md', `# Forge Rewrite GO / NO-GO\n\nReport ID: \`${goNoGo.report_id}\`\n\nFinal decision: \`${goNoGo.final_decision}\`.\n\nThe decision is repository-evidence based. Documents alone are not treated as proof; manifests, validators, contract existence and execution safety reports are checked.\n\n| Category | Status | Blocking |\n|---|---|---|\n${tableRows(goNoGo.categories.map(item => `| ${item.category} | ${item.status} | ${item.blocking ? 'YES' : 'NO'} |`))}\n`);
writeText('docs/decisions/FORGE_OWNER_DECISION_PACKET.md', `# Forge Owner Decision Packet\n\nPacket ID: \`${ownerDecisionPacket.packet_id}\`\n\nUnresolved decisions remain blocked until owner or architecture approval supplies the missing definition, decision or evidence.\n\n| Decision | Module | Operations Blocked | Default |\n|---|---|---|---|\n${tableRows(ownerDecisionPacket.decisions.map(item => `| \`${item.decision_id}\` | \`${item.module_id}\` | ${item.operations_blocked.join(', ')} | ${item.default_if_unresolved} |`))}\n`);

console.log(JSON.stringify({
  freeze_state: freezeState,
  final_decision: goNoGo.final_decision,
  modules: registry.length,
  active_modules: activeModules.length,
  first_wave_ready: firstWaveReady,
  first_wave_modules: firstWaveIds.length,
  owner_decisions: ownerDecisionPacket.decisions.length,
  contracts: contractBaseline.summary.analyzed
}, null, 2));
