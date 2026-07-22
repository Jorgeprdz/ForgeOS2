#!/usr/bin/env node
import { assert, exists, finish, readJson, uniqueIds } from './lib.mjs';

const name = 'validate-product-surfaces';
assert(exists('scaffolds/manifest/forge-product-surfaces.json'), 'missing product surface map');
assert(exists('scaffolds/manifest/forge-module-registry.json'), 'missing module registry');
assert(exists('scaffolds/manifest/module-gap-analysis.json'), 'missing module gap analysis');

const capabilities = readJson('scaffolds/manifest/forge-product-capabilities.json').capabilities;
const surfaces = readJson('scaffolds/manifest/forge-product-surfaces.json').surfaces;
const modules = readJson('scaffolds/manifest/forge-module-registry.json').modules;
const gap = readJson('scaffolds/manifest/module-gap-analysis.json');

const capIds = new Set(capabilities.map(cap => cap.id));
const surfaceIds = uniqueIds(surfaces, 'surfaces');
const moduleIds = uniqueIds(modules, 'modules');
assert(surfaceIds.size === surfaces.length, 'surface IDs are not unique');
assert(moduleIds.size === modules.length, 'module IDs are not unique');

for (const surface of surfaces) {
  assert(moduleIds.has(surface.responsible_module), `${surface.id} references missing module ${surface.responsible_module}`);
  assert(surface.supporting_capabilities.length > 0, `${surface.id} has no supporting capability`);
  for (const capId of surface.supporting_capabilities) assert(capIds.has(capId), `${surface.id} references missing capability ${capId}`);
}

const modulesByCapability = new Map();
for (const module of modules) {
  assert(module.capabilities.length > 0, `${module.id} has no capability`);
  assert(module.acceptance_criteria.length > 0, `${module.id} has no acceptance criteria`);
  for (const capId of module.capabilities) {
    assert(capIds.has(capId), `${module.id} references missing capability ${capId}`);
    if (!modulesByCapability.has(capId)) modulesByCapability.set(capId, []);
    modulesByCapability.get(capId).push(module.id);
  }
  for (const dep of module.dependencies) assert(moduleIds.has(dep), `${module.id} depends on missing module ${dep}`);
  if (module.implementation_status === 'NOT_IMPLEMENTED' && module.definition_status === 'CANONICALLY_DEFINED') {
    assert(['BUILD_NEW', 'DEFER'].includes(module.disposition), `${module.id} missing BUILD_NEW/DEFER disposition`);
  }
}

for (const cap of capabilities) {
  assert(modulesByCapability.has(cap.id), `${cap.id} has no responsible module`);
}

assert(gap.summary.total_modules === modules.length, 'gap summary total_modules does not match registry');
assert(gap.matrix.length === modules.length, 'gap matrix does not cover every module');
for (const row of gap.matrix) assert(moduleIds.has(row.module_id), `gap row references missing module ${row.module_id}`);

for (const required of ['MOD-HUMAN-APPROVAL-GATE', 'MOD-NBA-REASON-WHY', 'MOD-ADVISOR-LIFECYCLE', 'MOD-REVENUE-INTELLIGENCE', 'MOD-RECRUITMENT-PRECONTRACT']) {
  assert(moduleIds.has(required), `Build Tree module missing from registry: ${required}`);
}

finish(name);
