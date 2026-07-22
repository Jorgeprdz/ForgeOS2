#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
};

const modules = read('scaffolds/manifest/forge-module-registry.json').modules;
const surfaces = read('scaffolds/manifest/forge-product-surfaces.json').surfaces;
const stages = read('scaffolds/manifest/rewrite-stages.json').stages;
const traces = read('scaffolds/manifest/requirements-traceability.json').entries;
const boundaries = read('scaffolds/manifest/constitutional-boundaries.json').boundaries;

const moduleById = new Map(modules.map(module => [module.id, module]));
const stageByCapability = new Map();
for (const trace of traces) stageByCapability.set(trace.capability_id, trace.stage);
const stageById = new Map(stages.map(stage => [stage.id, stage]));

function stageFor(module) {
  const stageIds = module.capabilities.map(capability => stageByCapability.get(capability)).filter(Boolean);
  return stageIds[0] || 'BLOCKED_REQUIRES_ARCHITECTURAL_DECISION';
}

function dependencyType(from, to) {
  if (to.includes('GOVERNANCE') || to.includes('APPROVAL')) return 'SECURITY';
  if (to.includes('TRUTH')) return 'DATA';
  if (to.includes('WORKSPACE')) return 'UI';
  if (to.includes('REWRITE') || to.includes('LEGACY')) return 'VALIDATION';
  return 'HARD';
}

function readiness(module) {
  if (module.disposition === 'REJECT') return 'REJECTED';
  if (module.disposition === 'DEFER') return 'DEFERRED';
  const ownerStage = stageById.get(stageFor(module));
  if (!ownerStage) return 'BLOCKED';
  if (ownerStage.status === 'REJECTED') return 'REJECTED';
  if (ownerStage.status === 'DEFERRED') return 'DEFERRED';
  if (ownerStage.status.startsWith('BLOCKED_')) return 'BLOCKED';
  const missing = module.dependencies.filter(dep => {
    const target = moduleById.get(dep);
    return !target || ['REJECT', 'DEFER'].includes(target.disposition);
  });
  if (missing.length > 0) return 'BLOCKED';
  if (module.implementation_status === 'IMPLEMENTED') return 'READY_FOR_VALIDATION';
  if (module.implementation_status === 'PARTIALLY_IMPLEMENTED') return 'READY_FOR_SCAFFOLD';
  if (module.disposition === 'BUILD_NEW') return 'READY_FOR_SCAFFOLD';
  return 'NOT_READY';
}

function eventsFor(module) {
  const forbidden = [];
  if (module.id.includes('AI') || module.id.includes('CONVERSATION') || module.id.includes('MESSAGE')) {
    forbidden.push('message.sent', 'ai.final_decision');
  }
  if (module.id.includes('MANAGER') || module.id.includes('MICK') || module.id.includes('RECRUITMENT')) {
    forbidden.push('human_consequence.applied', 'human_worth.scored');
  }
  if (module.id.includes('QUOTE')) forbidden.push('quote.bound', 'premium.invented');
  if (module.id.includes('COMPENSATION') || module.id.includes('REVENUE')) forbidden.push('payout_truth.created_without_official_evidence');
  if (module.id.includes('LEGACY')) forbidden.push('legacy_code.copied', 'legacy_path.restored');
  return {
    published: [`${module.id.toLowerCase().replaceAll('-', '.')}.contract_ready`],
    consumed: module.dependencies.map(dep => `${dep.toLowerCase().replaceAll('-', '.')}.contract_ready`),
    observed: module.evidence_sources,
    forbidden
  };
}

const consumers = new Map(modules.map(module => [module.id, []]));
for (const module of modules) {
  for (const dep of module.dependencies) {
    if (consumers.has(dep)) consumers.get(dep).push(module.id);
  }
}

const graphModules = modules.map(module => {
  const events = eventsFor(module);
  return {
    id: module.id,
    name: module.name,
    status: readiness(module),
    build_disposition: module.disposition,
    stage: stageFor(module),
    required_contracts: module.contracts,
    required_capabilities: module.capabilities,
    required_schemas: module.contracts,
    required_events: events.consumed,
    required_services: module.dependencies,
    required_infrastructure: module.id.includes('TERMUX') ? ['git', 'node', 'npm', 'bash'] : [],
    required_storage: module.id.includes('SUPABASE') ? ['supabase'] : [],
    constitutional_boundaries: [...new Set(module.capabilities.flatMap(capability => traces.find(trace => trace.capability_id === capability)?.boundaries || []))],
    adr_references: module.adr,
    producer_modules: module.dependencies,
    consumer_modules: consumers.get(module.id).sort(),
    blocking_modules: module.dependencies.filter(dep => {
      const target = moduleById.get(dep);
      return !target || ['DEFER', 'REJECT'].includes(target.disposition);
    }),
    optional_modules: [],
    future_modules: module.consumers.filter(consumer => !moduleById.has(consumer)),
    dependencies: module.dependencies.map(dep => ({
      module_id: dep,
      type: dependencyType(module.id, dep),
      direction: `${module.id}->${dep}`
    })),
    events_published: events.published,
    events_consumed: events.consumed,
    events_observed: events.observed,
    events_forbidden: events.forbidden
  };
});

function topo() {
  const indegree = new Map(modules.map(module => [module.id, 0]));
  const dependents = new Map(modules.map(module => [module.id, []]));
  for (const module of modules) {
    for (const dep of module.dependencies) {
      if (!indegree.has(dep)) continue;
      indegree.set(module.id, indegree.get(module.id) + 1);
      dependents.get(dep).push(module.id);
    }
  }
  let ready = [...indegree.entries()].filter(([, value]) => value === 0).map(([id]) => id).sort();
  const waves = [];
  const order = [];
  while (ready.length > 0) {
    const wave = ready;
    waves.push(wave);
    ready = [];
    for (const id of wave) {
      order.push(id);
      for (const next of dependents.get(id).sort()) {
        indegree.set(next, indegree.get(next) - 1);
        if (indegree.get(next) === 0) ready.push(next);
      }
    }
    ready.sort();
  }
  const cycles = [...indegree.entries()].filter(([, value]) => value > 0).map(([id]) => id);
  return { order, waves, cycles };
}

const { order, waves, cycles } = topo();
const depth = new Map(modules.map(module => [module.id, 1]));
for (const id of order) {
  const module = moduleById.get(id);
  const maxDep = module.dependencies.map(dep => depth.get(dep) || 1).reduce((a, b) => Math.max(a, b), 0);
  depth.set(id, maxDep + 1);
}
const criticalPathLength = Math.max(...depth.values());
const criticalPath = order.filter(id => depth.get(id) === criticalPathLength || moduleById.get(id).dependencies.some(dep => depth.get(dep) === depth.get(id) - 1));

const dependencyGraph = {
  schema: '../contracts/dependency-graph.schema.json',
  graph_id: 'FORGE_DEPENDENCY_GRAPH_001',
  source_artifacts: [
    'scaffolds/manifest/forge-module-registry.json',
    'scaffolds/manifest/forge-product-surfaces.json',
    'scaffolds/manifest/rewrite-stages.json',
    'scaffolds/manifest/requirements-traceability.json',
    'scaffolds/manifest/constitutional-boundaries.json'
  ],
  cycles,
  modules: graphModules,
  event_relationships: graphModules.reduce((total, module) => total + module.events_published.length + module.events_consumed.length + module.events_forbidden.length, 0)
};

const buildOrder = {
  schema: '../contracts/build-order.schema.json',
  build_order_id: 'FORGE_BUILD_ORDER_001',
  generated_from: 'scaffolds/manifest/dependency-graph.json',
  algorithm: 'deterministic_topological_sort_lexicographic_tiebreak',
  cycles,
  critical_path_length: criticalPathLength,
  critical_path: criticalPath,
  parallel_groups: waves.map((items, index) => ({ group: index + 1, modules: items })),
  modules: order.map((id, index) => {
    const module = graphModules.find(item => item.id === id);
    return {
      module_id: id,
      build_priority: index + 1,
      build_stage: module.stage,
      parallelization_group: waves.findIndex(wave => wave.includes(id)) + 1,
      blocking_conditions: module.blocking_modules,
      promotion_gate: module.status === 'READY_FOR_VALIDATION' ? 'validation_and_evidence_required' : module.status,
      rollback_dependency: module.producer_modules
    };
  })
};

const moduleDependencies = {
  schema: '../contracts/module-dependencies.schema.json',
  dependency_model_id: 'FORGE_MODULE_DEPENDENCIES_001',
  modules: graphModules.map(module => ({
    id: module.id,
    depends_on: module.producer_modules,
    depended_on_by: module.consumer_modules,
    dependencies: module.dependencies,
    contracts: module.required_contracts,
    capabilities: module.required_capabilities,
    events_published: module.events_published,
    events_consumed: module.events_consumed,
    events_observed: module.events_observed,
    events_forbidden: module.events_forbidden,
    readiness: module.status
  }))
};

const executionPlan = {
  schema: '../contracts/rewrite-execution-plan.schema.json',
  execution_plan_id: 'FORGE_REWRITE_EXECUTION_PLAN_001',
  generated_from: ['scaffolds/manifest/dependency-graph.json', 'scaffolds/manifest/build-order.json'],
  modules: buildOrder.modules.map((item, index, list) => {
    const module = graphModules.find(entry => entry.id === item.module_id);
    return {
      current_module: item.module_id,
      previous_module: index === 0 ? null : list[index - 1].module_id,
      next_module: index === list.length - 1 ? null : list[index + 1].module_id,
      required_validations: ['npm run scaffold:validate', 'npm run lint', 'git diff --check'],
      required_evidence: [`scaffolds/reports/${module.stage}-evidence.json`],
      resume_point: item.module_id,
      rollback_point: module.producer_modules,
      promotion_gate: item.promotion_gate,
      readiness: module.status
    };
  })
};

write('scaffolds/manifest/dependency-graph.json', dependencyGraph);
write('scaffolds/manifest/build-order.json', buildOrder);
write('scaffolds/manifest/module-dependencies.json', moduleDependencies);
write('scaffolds/manifest/rewrite-execution-plan.json', executionPlan);

const mdIds = ids => ids.map(id => `\`${id}\``).join(', ') || 'none';
const table = graphModules.map(module => `| \`${module.id}\` | ${module.name} | ${module.status} | ${module.build_disposition} | \`${module.stage}\` | ${mdIds(module.producer_modules)} | ${mdIds(module.consumer_modules)} |`).join('\n');
write('docs/architecture/FORGE_DEPENDENCY_GRAPH.md', `# Forge Dependency Graph\n\nGraph ID: \`FORGE_DEPENDENCY_GRAPH_001\`\n\nGenerated from canonical manifests. This graph does not implement Forge OS 2 and does not execute rewrite stages.\n\nCycles detected: ${cycles.length}.\n\nEvent relationships: ${dependencyGraph.event_relationships}.\n\n| Module | Name | Readiness | Disposition | Stage | Depends on | Depended on by |\n|---|---|---|---|---|---|---|\n${table}\n`);

write('docs/architecture/FORGE_MODULE_DEPENDENCIES.md', `# Forge Module Dependencies\n\nModel ID: \`FORGE_MODULE_DEPENDENCIES_001\`\n\nEach dependency is directional and typed. Processable source: \`scaffolds/manifest/module-dependencies.json\`.\n\n${table}\n`);

const orderLines = buildOrder.modules.map(item => `| ${item.build_priority} | ${item.parallelization_group} | \`${item.module_id}\` | \`${item.build_stage}\` | ${item.promotion_gate} |`).join('\n');
write('docs/architecture/FORGE_BUILD_ORDER.md', `# Forge Build Order\n\nBuild Order ID: \`FORGE_BUILD_ORDER_001\`\n\nAlgorithm: deterministic topological sort with lexicographic tie-breaks.\n\nCritical path length: ${criticalPathLength}.\n\n| Priority | Parallel group | Module | Stage | Promotion gate |\n|---|---:|---|---|---|\n${orderLines}\n`);

const wavesMarkdown = buildOrder.parallel_groups.map(group => `## Wave ${group.group}\n\n${group.modules.map(id => `- \`${id}\``).join('\n')}`).join('\n\n');
write('docs/rewrite/TERMUX_BUILD_STRATEGY.md', `# Termux Build Strategy\n\nStrategy ID: \`FORGE_TERMUX_BUILD_STRATEGY_001\`\n\nThe future rewrite is dependency-driven. Termux must use \`scaffolds/manifest/rewrite-execution-plan.json\` and must not guess the next module.\n\nRecommended command pattern:\n\n\`\`\`sh\n\"./tools/termux/rewrite/forge-rewrite-plan.sh\" SG-001\n\"./tools/termux/rewrite/forge-rewrite-stage.sh\" SG-001 --plan\n\"./tools/termux/rewrite/forge-rewrite-stage.sh\" SG-001 --dry-run\n\`\`\`\n\nDo not execute \`--apply\` until the owner approves the selected module/stage.\n\n${wavesMarkdown}\n`);

const dependencyCount = graphModules.reduce((total, module) => total + module.dependencies.length, 0);
const dependencyTypeCounts = graphModules.flatMap(module => module.dependencies).reduce((acc, dependency) => {
  acc[dependency.type] = (acc[dependency.type] || 0) + 1;
  return acc;
}, {});
const readinessCounts = graphModules.reduce((acc, module) => {
  acc[module.status] = (acc[module.status] || 0) + 1;
  return acc;
}, {});
const fanIn = [...graphModules].sort((a, b) => b.producer_modules.length - a.producer_modules.length).slice(0, 5);
const fanOut = [...graphModules].sort((a, b) => b.consumer_modules.length - a.consumer_modules.length).slice(0, 5);
const risks = [
  ...fanIn.map(module => `- High fan-in: \`${module.id}\` depends on ${module.producer_modules.length} modules.`),
  ...fanOut.map(module => `- High fan-out: \`${module.id}\` supports ${module.consumer_modules.length} consumers.`),
  ...graphModules.filter(module => module.status === 'BLOCKED').slice(0, 8).map(module => `- Blocked: \`${module.id}\` is owned by \`${module.stage}\`.`)
].join('\n');

write('docs/rewrite/DEPENDENCY_SUMMARY_REPORT.md', `# Dependency Summary Report\n\nReport ID: \`FORGE_DEPENDENCY_SUMMARY_REPORT_001\`\n\n- Modules analyzed: ${modules.length}.\n- Dependencies discovered: ${dependencyCount}.\n- Hard dependencies: ${dependencyTypeCounts.HARD || 0}.\n- Soft dependencies: ${dependencyTypeCounts.SOFT || 0}.\n- Event relationships: ${dependencyGraph.event_relationships}.\n- Cycles: ${cycles.length}.\n- Parallel build groups: ${buildOrder.parallel_groups.length}.\n- Critical path length: ${criticalPathLength}.\n\nDependency type counts:\n\n${Object.entries(dependencyTypeCounts).sort().map(([type, count]) => `- ${type}: ${count}`).join('\n')}\n`);

write('docs/rewrite/CRITICAL_PATH_REPORT.md', `# Critical Path Report\n\nReport ID: \`FORGE_CRITICAL_PATH_REPORT_001\`\n\nCritical path length: ${criticalPathLength}.\n\nCritical path modules:\n\n${criticalPath.map(id => `- \`${id}\``).join('\n')}\n\nHighest fan-in modules:\n\n${fanIn.map(module => `- \`${module.id}\`: ${module.producer_modules.length}`).join('\n')}\n\nHighest fan-out modules:\n\n${fanOut.map(module => `- \`${module.id}\`: ${module.consumer_modules.length}`).join('\n')}\n`);

write('docs/rewrite/PARALLEL_BUILD_REPORT.md', `# Parallel Build Report\n\nReport ID: \`FORGE_PARALLEL_BUILD_REPORT_001\`\n\nModules are grouped only when no module in the group depends on another module in the same group.\n\n${wavesMarkdown}\n`);

write('docs/rewrite/MODULE_READINESS_REPORT.md', `# Module Readiness Report\n\nReport ID: \`FORGE_MODULE_READINESS_REPORT_001\`\n\n${Object.entries(readinessCounts).sort().map(([status, count]) => `- ${status}: ${count}`).join('\n')}\n\n| Module | Readiness | Stage | Disposition |\n|---|---|---|---|\n${graphModules.map(module => `| \`${module.id}\` | ${module.status} | \`${module.stage}\` | ${module.build_disposition} |`).join('\n')}\n`);

write('docs/rewrite/ARCHITECTURAL_RISK_REPORT.md', `# Architectural Risk Report\n\nReport ID: \`FORGE_ARCHITECTURAL_RISK_REPORT_001\`\n\nPrimary risks are derived from fan-in, fan-out and blocked stage ownership. This report does not infer runtime behavior.\n\n${risks}\n`);

write('docs/rewrite/REWRITE_EXECUTION_REPORT.md', `# Rewrite Execution Report\n\nReport ID: \`FORGE_REWRITE_EXECUTION_REPORT_001\`\n\nProcessable execution plan: \`scaffolds/manifest/rewrite-execution-plan.json\`.\n\nThe future Termux rewrite must select modules by topological priority and parallel group. It must not guess the next module.\n\n| Priority | Module | Previous | Next | Readiness | Gate |\n|---:|---|---|---|---|---|\n${executionPlan.modules.map((module, index) => `| ${index + 1} | \`${module.current_module}\` | ${module.previous_module ? `\`${module.previous_module}\`` : 'none'} | ${module.next_module ? `\`${module.next_module}\`` : 'none'} | ${module.readiness} | ${module.promotion_gate} |`).join('\n')}\n`);

console.log(JSON.stringify({
  modules: modules.length,
  dependencies: dependencyCount,
  cycles: cycles.length,
  parallel_groups: buildOrder.parallel_groups.length,
  critical_path_length: criticalPathLength
}, null, 2));
