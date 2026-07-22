#!/usr/bin/env node
import { assert, exists, finish, readJson, uniqueIds } from './lib.mjs';

const name = 'validate-dependency-graph';
const requiredFiles = [
  'scaffolds/manifest/dependency-graph.json',
  'scaffolds/manifest/build-order.json',
  'scaffolds/manifest/module-dependencies.json',
  'scaffolds/manifest/rewrite-execution-plan.json',
  'scaffolds/manifest/execution-eligibility.json',
  'scaffolds/manifest/rejected-module-denylist.json',
  'scaffolds/reports/dependency-semantic-audit.json',
  'scaffolds/reports/execution-safety-report.json',
  'scaffolds/validation/generate-dependency-artifacts.mjs'
];
for (const file of requiredFiles) assert(exists(file), `missing ${file}`);

const registry = readJson('scaffolds/manifest/forge-module-registry.json').modules;
const capabilities = readJson('scaffolds/manifest/forge-product-capabilities.json').capabilities;
const stages = readJson('scaffolds/manifest/rewrite-stages.json').stages;
const graph = readJson('scaffolds/manifest/dependency-graph.json');
const order = readJson('scaffolds/manifest/build-order.json');
const deps = readJson('scaffolds/manifest/module-dependencies.json');
const plan = readJson('scaffolds/manifest/rewrite-execution-plan.json');
const eligibility = readJson('scaffolds/manifest/execution-eligibility.json');
const denylist = readJson('scaffolds/manifest/rejected-module-denylist.json');
const audit = readJson('scaffolds/reports/dependency-semantic-audit.json');

const registryIds = new Set(registry.map(module => module.id));
const graphIds = uniqueIds(graph.modules, 'dependency graph modules');
const capabilityIds = new Set(capabilities.map(capability => capability.id));
const stageIds = new Set(stages.map(stage => stage.id));
const moduleById = new Map(graph.modules.map(module => [module.id, module]));
const allowedDependencyTypes = new Set(['HARD', 'SOFT', 'OPTIONAL', 'RUNTIME', 'BUILD_TIME', 'DATA', 'EVENT', 'SECURITY', 'OBSERVABILITY', 'UI', 'DOCUMENTATION', 'VALIDATION', 'TEST']);
const allowedOperations = new Set(['SCAFFOLD', 'IMPLEMENT', 'VALIDATE', 'PROMOTE', 'RUNTIME']);
const mandatoryTypes = new Set(['HARD', 'SECURITY', 'VALIDATION', 'DATA', 'RUNTIME', 'BUILD_TIME']);
const blockedStates = new Set(['BLOCKED', 'WAITING_FOR_DEPENDENCIES', 'WAITING_FOR_DECISION', 'WAITING_FOR_EVIDENCE']);
const eventKeys = ['build_events_published', 'build_events_consumed', 'domain_events_published', 'domain_events_consumed', 'integration_events_published', 'integration_events_consumed', 'audit_events', 'forbidden_events'];
const pathLike = /\/|(^|\/)(AGENTS\.md|README(?:\.md)?)(?:$|\/)|(^|\/)(docs|platform|governance|scaffolds)\/|\.(md|json|mjs|js|ts|tsx|jsx|html|css|sh|sql|yml|yaml|toml|lock)$/i;
const promotionGateStates = new Set(['NOT_EVALUATED', 'READY', 'BLOCKED', 'PASSED', 'FAILED', 'REJECTED', 'NOT_APPLICABLE']);
const blockingTypes = new Set(['DEPENDENCY_NOT_READY', 'OWNER_DECISION_REQUIRED', 'ARCHITECTURAL_DECISION_REQUIRED', 'EVIDENCE_REQUIRED', 'CONTRACT_MISSING', 'SCHEMA_MISSING', 'CAPABILITY_UNRESOLVED', 'BOUNDARY_CONFLICT', 'GATE_NOT_PASSED', 'EXTERNAL_INPUT_REQUIRED']);

assert(Array.isArray(graph.cycles) && graph.cycles.length === 0, `dependency graph contains cycles: ${graph.cycles?.join(', ')}`);
assert(graph.modules.length === registry.length, 'dependency graph does not cover every registry module');
assert(order.modules.length === graph.active_topological_order.length, 'build order module list must cover active topological order only');
assert(deps.modules.length === registry.length, 'module dependency model does not cover every registry module');
assert(plan.active_execution_plan.modules.length === graph.active_topological_order.length, 'execution plan active modules must match active topological order');
assert(audit.dynamic_next_selection === true, 'semantic audit must confirm dynamic next selection');

for (const id of registryIds) assert(graphIds.has(id), `registry module missing from dependency graph: ${id}`);

const rejected = new Set(graph.rejected_modules);
const deferred = new Set(graph.deferred_modules);
const activeOrder = graph.active_topological_order;
const activeSet = new Set(activeOrder);
const executableLists = [
  order.active_topological_order,
  activeOrder,
  order.modules.map(entry => entry.module_id),
  ...order.active_execution_waves.map(wave => wave.modules).flatMap(items => [items]),
  plan.active_execution_plan.modules.map(entry => entry.current_module),
  plan.active_execution_plan.modules.flatMap(entry => entry.next_eligible_modules),
  plan.active_execution_plan.modules.flatMap(entry => entry.next_eligible_wave),
  plan.active_execution_plan.eligible_waves.flatMap(wave => wave.modules)
];
for (const list of executableLists) {
  for (const id of list) {
    assert(!rejected.has(id), `rejected module appears in active execution: ${id}`);
    assert(!deferred.has(id), `deferred module appears in active execution: ${id}`);
  }
}
for (const entry of denylist.rejected_modules) assert(rejected.has(entry.module_id), `denylist contains non-rejected module ${entry.module_id}`);

assert(eligibility.eligible_now && typeof eligibility.eligible_now === 'object' && !Array.isArray(eligibility.eligible_now), 'eligibility must be split by operation');
for (const op of ['SCAFFOLD', 'IMPLEMENT', 'VALIDATE', 'PROMOTE']) assert(Array.isArray(eligibility.eligible_now[op]), `missing ${op} eligibility list`);
assert(JSON.stringify(eligibility.eligible_now) === JSON.stringify(plan.active_execution_plan.eligible_now), 'execution plan and eligibility manifest disagree');
assert(!('next_module' in plan.active_execution_plan), 'execution plan must not expose a single next_module');

const topologicalPosition = new Map(graph.topological_order.map((id, index) => [id, index]));
for (const module of graph.modules) {
  assert(registryIds.has(module.id), `graph references unknown module ${module.id}`);
  assert(stageIds.has(module.stage_id), `${module.id} references invalid stage ${module.stage_id}`);
  assert(module.required_capabilities.length > 0, `${module.id} has no required capabilities`);
  for (const capability of module.required_capabilities) assert(capabilityIds.has(capability), `${module.id} references missing capability ${capability}`);
  assert(module.required_contracts.length > 0, `${module.id} has no required contracts`);
  for (const contract of module.required_contracts) assert(exists(contract), `${module.id} references missing contract ${contract}`);
  assert(promotionGateStates.has(module.promotion_gate_state), `${module.id} has invalid promotion gate state ${module.promotion_gate_state}`);
  assert(module.promotion_gate_id && !['READY', 'READY_FOR_SCAFFOLD', 'BLOCKED'].includes(module.promotion_gate_id), `${module.id} has invalid promotion gate id`);
  assert(Array.isArray(module.promotion_requirements), `${module.id} missing promotion requirements`);
  assert(module.rollback_strategy, `${module.id} missing rollback strategy`);
  assert(module.rollback_strategy !== 'NOT_DEFINED' || module.promotion_readiness === 'BLOCKED' || module.promotion_readiness === 'REJECTED' || module.promotion_readiness === 'NOT_APPLICABLE', `${module.id} has undefined rollback without blocked promotion`);
  assert(!('events_published' in module) && !('events_consumed' in module) && !('events_observed' in module), `${module.id} still uses legacy event fields`);

  if (blockedStates.has(module.execution_readiness) || module.scaffold_readiness === 'BLOCKED' || module.implementation_readiness === 'BLOCKED') {
    assert(module.blocking_conditions.length > 0, `${module.id} is blocked or waiting without blocking conditions`);
  }
  for (const condition of module.blocking_conditions) {
    assert(blockingTypes.has(condition.type), `${module.id} has invalid blocking condition type ${condition.type}`);
    for (const key of ['id', 'description', 'blocked_operation', 'required_resolution', 'resolution_owner', 'machine_checkable']) assert(key in condition, `${module.id} blocking condition missing ${key}`);
    assert(allowedOperations.has(condition.blocked_operation), `${module.id} condition blocks invalid operation ${condition.blocked_operation}`);
  }

  for (const key of eventKeys) {
    assert(Array.isArray(module[key]), `${module.id} missing ${key}`);
    for (const value of module[key]) assert(!pathLike.test(value), `${module.id} has path/document value in ${key}: ${value}`);
  }
  for (const dependency of module.dependencies) {
    assert(registryIds.has(dependency.module_id), `${module.id} depends on missing module ${dependency.module_id}`);
    assert(allowedDependencyTypes.has(dependency.type), `${module.id} has invalid dependency type ${dependency.type}`);
    assert(Array.isArray(dependency.required_for) && dependency.required_for.length > 0, `${module.id}->${dependency.module_id} missing required_for`);
    for (const op of dependency.required_for) assert(allowedOperations.has(op), `${module.id}->${dependency.module_id} invalid required_for ${op}`);
    assert(topologicalPosition.get(dependency.module_id) < topologicalPosition.get(module.id), `${module.id} appears before dependency ${dependency.module_id}`);
    if (activeSet.has(module.id) && mandatoryTypes.has(dependency.type) && dependency.required_for.some(op => ['IMPLEMENT', 'VALIDATE', 'PROMOTE'].includes(op))) {
      assert(!rejected.has(dependency.module_id), `${module.id} has mandatory active dependency on rejected module ${dependency.module_id}`);
      assert(!deferred.has(dependency.module_id), `${module.id} has mandatory active dependency on deferred module ${dependency.module_id}`);
    }
  }
}

for (const wave of order.active_execution_waves) {
  const set = new Set(wave.modules);
  for (const id of wave.modules) {
    const module = moduleById.get(id);
    assert(module.execution_readiness === 'ELIGIBLE', `${id} in active wave is not currently eligible`);
    for (const dependency of module.dependencies) assert(!set.has(dependency.module_id), `execution wave ${wave.wave} contains dependent pair ${id}/${dependency.module_id}`);
  }
}

const critical = graph.critical_path;
assert(critical.length === critical.edges.length, 'critical path length does not equal edge count');
assert(critical.modules.length === critical.edges.length + 1, 'critical path module count must equal edge count + 1');
assert(critical.modules.length !== graph.topological_order.length, 'critical path is the full topological order');
for (let index = 0; index < critical.edges.length; index += 1) {
  const edge = critical.edges[index];
  assert(edge.from === critical.modules[index] && edge.to === critical.modules[index + 1], `critical path edge ${index} does not connect consecutive modules`);
  const consumer = moduleById.get(edge.to);
  assert(consumer.dependencies.some(dep => dep.module_id === edge.from && dep.type === edge.type), `critical path edge ${edge.from}->${edge.to} is not backed by a dependency`);
}

function assertImplementationBlocked(id, dependencies) {
  const module = moduleById.get(id);
  assert(module.implementation_readiness !== 'READY', `${id} must not be implementation ready`);
  for (const dependency of dependencies) {
    assert(module.blocking_conditions.some(condition => condition.blocked_operation === 'IMPLEMENT' && condition.dependency_module === dependency), `${id} missing implementation blocking condition for ${dependency}`);
  }
}
assertImplementationBlocked('MOD-NBA-REASON-WHY', ['MOD-CONVERSATION-INTELLIGENCE', 'MOD-MICK-BEHAVIOR']);
assertImplementationBlocked('MOD-PRODUCT-CATALOG', ['MOD-CARRIER-SCOPE']);
assertImplementationBlocked('MOD-QUOTE-PREVIEW', ['MOD-PRODUCT-SOURCE-PACK', 'MOD-ELIGIBILITY-CONTRACT', 'MOD-CALCULATION-CONTRACT']);
assert(!order.active_topological_order.includes('MOD-AUTONOMOUS-AI-DECISIONING'), 'autonomous AI decisioning appears in active order');
assert(!order.active_topological_order.includes('MOD-GENERIC-CRM-CLONE'), 'generic CRM clone appears in active order');
assert(audit.blocked_without_conditions.length === 0, `audit found blocked modules without conditions: ${audit.blocked_without_conditions.join(', ')}`);
assert(audit.path_values_in_event_fields === 0, 'audit found path values in event fields');

const modulesByCapability = new Map();
for (const module of registry) {
  for (const capability of module.capabilities) {
    if (!modulesByCapability.has(capability)) modulesByCapability.set(capability, []);
    modulesByCapability.get(capability).push(module.id);
  }
}
for (const capability of capabilities) assert(modulesByCapability.has(capability.id), `orphan capability ${capability.id}`);

finish(name);
