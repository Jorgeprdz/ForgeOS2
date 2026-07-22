#!/usr/bin/env node
import { assert, exists, finish, readJson, uniqueIds } from './lib.mjs';

const name = 'validate-dependency-graph';
for (const file of [
  'scaffolds/manifest/dependency-graph.json',
  'scaffolds/manifest/build-order.json',
  'scaffolds/manifest/module-dependencies.json',
  'scaffolds/manifest/rewrite-execution-plan.json'
]) assert(exists(file), `missing ${file}`);

const registry = readJson('scaffolds/manifest/forge-module-registry.json').modules;
const capabilities = readJson('scaffolds/manifest/forge-product-capabilities.json').capabilities;
const stages = readJson('scaffolds/manifest/rewrite-stages.json').stages;
const graph = readJson('scaffolds/manifest/dependency-graph.json');
const order = readJson('scaffolds/manifest/build-order.json');
const deps = readJson('scaffolds/manifest/module-dependencies.json');
const plan = readJson('scaffolds/manifest/rewrite-execution-plan.json');

const registryIds = new Set(registry.map(module => module.id));
const graphIds = uniqueIds(graph.modules, 'dependency graph modules');
const capabilityIds = new Set(capabilities.map(capability => capability.id));
const stageIds = new Set(stages.map(stage => stage.id));
const allowedDependencyTypes = new Set(['HARD', 'SOFT', 'OPTIONAL', 'RUNTIME', 'BUILD_TIME', 'DATA', 'EVENT', 'SECURITY', 'OBSERVABILITY', 'UI', 'DOCUMENTATION', 'VALIDATION', 'TEST']);

assert(graph.cycles.length === 0, `dependency graph contains cycles: ${graph.cycles.join(', ')}`);
assert(graph.modules.length === registry.length, 'dependency graph does not cover every registry module');
assert(order.modules.length === registry.length, 'build order does not cover every registry module');
assert(deps.modules.length === registry.length, 'module dependency model does not cover every registry module');
assert(plan.modules.length === registry.length, 'execution plan does not cover every registry module');

for (const id of registryIds) assert(graphIds.has(id), `registry module missing from dependency graph: ${id}`);

const position = new Map(order.modules.map((entry, index) => [entry.module_id, index]));
for (const module of graph.modules) {
  assert(registryIds.has(module.id), `graph references unknown module ${module.id}`);
  assert(stageIds.has(module.stage) || module.stage === 'BLOCKED_REQUIRES_ARCHITECTURAL_DECISION', `${module.id} references invalid stage ${module.stage}`);
  assert(module.required_capabilities.length > 0, `${module.id} has no required capabilities`);
  for (const capability of module.required_capabilities) assert(capabilityIds.has(capability), `${module.id} references missing capability ${capability}`);
  assert(module.required_contracts.length > 0, `${module.id} has no required contracts`);
  for (const contract of module.required_contracts) assert(exists(contract), `${module.id} references missing contract ${contract}`);
  for (const dependency of module.dependencies) {
    assert(registryIds.has(dependency.module_id), `${module.id} depends on missing module ${dependency.module_id}`);
    assert(allowedDependencyTypes.has(dependency.type), `${module.id} has invalid dependency type ${dependency.type}`);
    assert(position.get(dependency.module_id) < position.get(module.id), `${module.id} appears before dependency ${dependency.module_id}`);
  }
  for (const producer of module.producer_modules) assert(registryIds.has(producer), `${module.id} has missing producer ${producer}`);
  for (const consumer of module.consumer_modules) assert(registryIds.has(consumer), `${module.id} has missing consumer ${consumer}`);
  assert(Array.isArray(module.events_published), `${module.id} missing published events`);
  assert(Array.isArray(module.events_consumed), `${module.id} missing consumed events`);
  assert(Array.isArray(module.events_observed), `${module.id} missing observed events`);
  assert(Array.isArray(module.events_forbidden), `${module.id} missing forbidden events`);
}

for (const group of order.parallel_groups) {
  const set = new Set(group.modules);
  for (const moduleId of group.modules) {
    const module = graph.modules.find(item => item.id === moduleId);
    for (const dependency of module.producer_modules) assert(!set.has(dependency), `parallel group ${group.group} contains dependent pair ${moduleId}/${dependency}`);
  }
}

const modulesByCapability = new Map();
for (const module of registry) {
  for (const capability of module.capabilities) {
    if (!modulesByCapability.has(capability)) modulesByCapability.set(capability, []);
    modulesByCapability.get(capability).push(module.id);
  }
}
for (const capability of capabilities) assert(modulesByCapability.has(capability.id), `orphan capability ${capability.id}`);

finish(name);
