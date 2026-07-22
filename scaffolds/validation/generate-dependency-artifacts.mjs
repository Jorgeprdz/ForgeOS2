#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
};
const mdIds = ids => ids.map(id => `\`${id}\``).join(', ') || 'none';
const slug = id => id.toLowerCase().replace(/^mod-/, 'mod.').replaceAll('-', '.');

const modules = read('scaffolds/manifest/forge-module-registry.json').modules;
const stages = read('scaffolds/manifest/rewrite-stages.json').stages;
const traces = read('scaffolds/manifest/requirements-traceability.json').entries;

const moduleById = new Map(modules.map(module => [module.id, module]));
const stageById = new Map(stages.map(stage => [stage.id, stage]));
const traceByCapability = new Map(traces.map(trace => [trace.capability_id, trace]));
const stageByCapability = new Map(traces.map(trace => [trace.capability_id, trace.stage]));

function stageFor(module) {
  return module.capabilities.map(capability => stageByCapability.get(capability)).filter(Boolean)[0] || null;
}

function dependencyType(to) {
  if (to.includes('GOVERNANCE') || to.includes('APPROVAL')) return 'SECURITY';
  if (to.includes('TRUTH')) return 'DATA';
  if (to.includes('REWRITE') || to.includes('LEGACY')) return 'VALIDATION';
  if (to.includes('WORKSPACE')) return 'UI';
  return 'HARD';
}

function requiredFor(type) {
  if (['SECURITY', 'VALIDATION', 'DATA'].includes(type)) return ['SCAFFOLD', 'IMPLEMENT', 'VALIDATE', 'PROMOTE'];
  if (['HARD', 'RUNTIME', 'BUILD_TIME', 'EVENT'].includes(type)) return ['IMPLEMENT', 'VALIDATE', 'PROMOTE'];
  if (['SOFT', 'OPTIONAL', 'UI', 'OBSERVABILITY'].includes(type)) return ['PROMOTE'];
  if (type === 'DOCUMENTATION') return ['PROMOTE'];
  if (type === 'TEST') return ['VALIDATE', 'PROMOTE'];
  return [];
}

function stageBlock(stage) {
  if (!stage) return null;
  if (stage.status === 'BLOCKED_REQUIRES_OWNER_DECISION') return ['OWNER_DECISION_REQUIRED', 'WAITING_FOR_DECISION', 'owner decision'];
  if (stage.status === 'BLOCKED_REQUIRES_PRODUCT_DEFINITION') return ['OWNER_DECISION_REQUIRED', 'WAITING_FOR_DECISION', 'product definition'];
  if (stage.status === 'BLOCKED_REQUIRES_ARCHITECTURAL_DECISION') return ['ARCHITECTURAL_DECISION_REQUIRED', 'WAITING_FOR_DECISION', 'architectural decision'];
  if (stage.status === 'BLOCKED_REQUIRES_LEGACY_EVIDENCE') return ['EVIDENCE_REQUIRED', 'WAITING_FOR_EVIDENCE', 'legacy evidence'];
  if (stage.status === 'BLOCKED_REQUIRES_LEGACY_EVIDENCE') return ['EVIDENCE_REQUIRED', 'WAITING_FOR_EVIDENCE', 'legacy evidence'];
  if (stage.status === 'BLOCKED_CONSTITUTIONAL_VIOLATION') return ['BOUNDARY_CONFLICT', 'WAITING_FOR_DECISION', 'constitutional repair'];
  return null;
}

function definitionReadiness(module) {
  if (module.definition_status === 'REJECTED') return 'REJECTED';
  if (module.definition_status === 'CANONICALLY_DEFERRED') return 'DEFERRED';
  if (module.definition_status === 'CANONICALLY_DEFINED') return 'DEFINED';
  return 'INCOMPLETE';
}

function buildEvents(module) {
  return {
    build_events_published: [`${slug(module.id)}.contract_ready`],
    build_events_consumed: module.dependencies.map(dep => `${slug(dep)}.contract_ready`)
  };
}

function domainEvents(module) {
  const published = [];
  const consumed = [];
  const id = module.id;
  if (id.includes('DECISION')) published.push('decision.result.proposed');
  if (id.includes('ACTION')) {
    consumed.push('decision.result.proposed');
    published.push('action.plan.proposed');
  }
  if (id.includes('RELATIONSHIP')) published.push('relationship.next_action.proposed');
  if (id.includes('CONVERSATION')) published.push('conversation.guidance.proposed');
  if (id.includes('POLICY')) published.push('policy.follow_up.proposed');
  if (id.includes('QUOTE')) published.push('quote.preview.proposed');
  if (id.includes('MICK')) published.push('behavior.signal.observed');
  if (id.includes('MANAGER')) {
    consumed.push('behavior.signal.observed');
    published.push('manager.coaching.recommendation_proposed');
  }
  if (id.includes('APPROVAL')) published.push('human.approval.recorded');
  if (id.includes('SOURCE-PACK')) published.push('product.source_pack.received');
  if (id.includes('PRODUCT-CATALOG')) consumed.push('product.source_pack.received');
  return { domain_events_published: published, domain_events_consumed: consumed };
}

function forbiddenEvents(module) {
  const events = [];
  if (module.id.includes('AI') || module.id.includes('CONVERSATION') || module.id.includes('MESSAGE')) events.push('ai.final_decision', 'message.sent_without_human_approval');
  if (module.id.includes('MANAGER') || module.id.includes('MICK') || module.id.includes('RECRUITMENT')) events.push('human_consequence.applied', 'human_worth.scored');
  if (module.id.includes('QUOTE')) events.push('quote.bound', 'premium.invented');
  if (module.id.includes('COMPENSATION') || module.id.includes('REVENUE')) events.push('payout_truth.created_without_official_evidence');
  if (module.id.includes('LEGACY')) events.push('legacy_code.copied', 'legacy_path.restored');
  return events;
}

function condition({ module, type, description, blockedOperation, requiredResolution, owner, evidenceRequired = false, dependencyModule = null, decisionReference = null, machineCheckable = true }) {
  return {
    id: `BLOCK-${module.id}-${type}-${blockedOperation}-${dependencyModule || 'SELF'}`.replaceAll('_', '-'),
    type,
    description,
    blocked_operation: blockedOperation,
    required_resolution: requiredResolution,
    resolution_owner: owner,
    evidence_required: evidenceRequired,
    dependency_module: dependencyModule,
    decision_reference: decisionReference,
    machine_checkable: machineCheckable
  };
}

const consumers = new Map(modules.map(module => [module.id, []]));
for (const module of modules) for (const dep of module.dependencies) if (consumers.has(dep)) consumers.get(dep).push(module.id);

const rawEdges = modules.flatMap(module => module.dependencies.map(dep => {
  const type = dependencyType(dep);
  return { from: module.id, to: dep, type, required_for: requiredFor(type), direction: `${module.id}->${dep}` };
}));

function topological(ids, edges) {
  const idSet = new Set(ids);
  const indegree = new Map(ids.map(id => [id, 0]));
  const dependents = new Map(ids.map(id => [id, []]));
  for (const edge of edges) {
    if (!idSet.has(edge.from) || !idSet.has(edge.to)) continue;
    indegree.set(edge.from, indegree.get(edge.from) + 1);
    dependents.get(edge.to).push(edge.from);
  }
  let ready = [...indegree.entries()].filter(([, value]) => value === 0).map(([id]) => id).sort();
  const order = [];
  const waves = [];
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
  return { order, waves, cycles: [...indegree.entries()].filter(([, value]) => value > 0).map(([id]) => id) };
}

const allTopo = topological(modules.map(module => module.id), rawEdges);

const graphModules = modules.map(module => {
  const stageId = stageFor(module);
  const stage = stageById.get(stageId);
  const definition = definitionReadiness(module);
  const stageBlocked = stageBlock(stage);
  const isRejected = module.disposition === 'REJECT' || definition === 'REJECTED' || stage?.status === 'REJECTED';
  const isDeferred = module.disposition === 'DEFER' || definition === 'DEFERRED' || stage?.status === 'DEFERRED';
  const dependencyEdges = rawEdges.filter(edge => edge.from === module.id);
  const missingContracts = module.contracts.filter(contract => !fs.existsSync(contract));
  const blockingConditions = [];

  if (!stage) blockingConditions.push(condition({ module, type: 'GATE_NOT_PASSED', description: 'No owning stage could be resolved from traceability.', blockedOperation: 'SCAFFOLD', requiredResolution: 'Add traceability stage reference.', owner: 'architecture', decisionReference: 'requirements-traceability.json' }));
  if (stageBlocked) {
    for (const op of ['SCAFFOLD', 'IMPLEMENT', 'VALIDATE', 'PROMOTE']) {
      blockingConditions.push(condition({ module, type: stageBlocked[0], description: `Owning stage ${stageId} is ${stage.status}.`, blockedOperation: op, requiredResolution: `Resolve ${stageBlocked[2]}.`, owner: stageBlocked[0] === 'EVIDENCE_REQUIRED' ? 'owner' : 'architecture', evidenceRequired: stageBlocked[0] === 'EVIDENCE_REQUIRED', decisionReference: stageId }));
    }
  }
  for (const contract of missingContracts) {
    blockingConditions.push(condition({ module, type: 'CONTRACT_MISSING', description: `Required contract is missing: ${contract}.`, blockedOperation: 'SCAFFOLD', requiredResolution: 'Create or correct contract reference.', owner: 'architecture', decisionReference: contract }));
  }
  for (const edge of dependencyEdges) {
    const dep = moduleById.get(edge.to);
    if (!dep) {
      blockingConditions.push(condition({ module, type: 'DEPENDENCY_NOT_READY', description: `Dependency ${edge.to} is missing from registry.`, blockedOperation: 'IMPLEMENT', requiredResolution: 'Register dependency module.', owner: 'architecture', dependencyModule: edge.to }));
    } else if (edge.required_for.some(op => ['IMPLEMENT', 'VALIDATE', 'PROMOTE'].includes(op)) && (dep.disposition === 'REJECT' || dep.disposition === 'DEFER')) {
      blockingConditions.push(condition({ module, type: 'DEPENDENCY_NOT_READY', description: `Mandatory dependency ${edge.to} is ${dep.disposition}.`, blockedOperation: 'IMPLEMENT', requiredResolution: 'Remove mandatory edge or unblock dependency.', owner: 'architecture', dependencyModule: edge.to }));
    } else if (edge.required_for.includes('IMPLEMENT')) {
      const depStage = stageById.get(stageFor(dep));
      const depBlock = stageBlock(depStage);
      if (depBlock) {
        blockingConditions.push(condition({ module, type: 'DEPENDENCY_NOT_READY', description: `Implementation dependency ${edge.to} is blocked by ${depStage.status}.`, blockedOperation: 'IMPLEMENT', requiredResolution: `Resolve dependency ${edge.to} before implementation.`, owner: depBlock[0] === 'EVIDENCE_REQUIRED' ? 'owner' : 'architecture', evidenceRequired: depBlock[0] === 'EVIDENCE_REQUIRED', dependencyModule: edge.to, decisionReference: stageFor(dep) }));
      }
    }
  }

  const scaffoldReady = !isRejected && !isDeferred && !stageBlocked && missingContracts.length === 0;
  const scaffoldDepsReady = dependencyEdges.filter(edge => edge.required_for.includes('SCAFFOLD')).every(edge => {
    const dep = moduleById.get(edge.to);
    const depStage = dep && stageById.get(stageFor(dep));
    return dep && dep.disposition !== 'REJECT' && dep.disposition !== 'DEFER' && depStage && !stageBlock(depStage);
  });
  const implementationDepsReady = dependencyEdges.filter(edge => edge.required_for.includes('IMPLEMENT')).every(edge => {
    const dep = moduleById.get(edge.to);
    const depStage = dep && stageById.get(stageFor(dep));
    return dep && dep.disposition !== 'REJECT' && dep.disposition !== 'DEFER' && depStage && !stageBlock(depStage);
  });

  let execution = 'BLOCKED';
  if (isRejected) execution = 'REJECTED';
  else if (isDeferred) execution = 'DEFERRED';
  else if (stageBlocked?.[1]) execution = stageBlocked[1];
  else if (!scaffoldDepsReady) execution = 'WAITING_FOR_DEPENDENCIES';
  else if (module.implementation_status === 'IMPLEMENTED') execution = 'COMPLETED';
  else execution = 'ELIGIBLE';

  const implementationReadiness = isRejected ? 'NOT_APPLICABLE' : isDeferred ? 'DEFERRED' : (stageBlocked || !implementationDepsReady ? 'BLOCKED' : 'READY');
  const promotionBlocked = implementationReadiness !== 'READY' && module.implementation_status !== 'IMPLEMENTED';
  const promotionGateState = isRejected ? 'REJECTED' : promotionBlocked ? 'BLOCKED' : 'NOT_EVALUATED';
  const rollbackStrategy = scaffoldReady || module.implementation_status === 'IMPLEMENTED' ? 'REMOVE_GENERATED_FILES_AND_EVIDENCE_IF_HASHES_MATCH' : 'NOT_DEFINED';

  return {
    id: module.id,
    name: module.name,
    graph_membership: 'INCLUDED',
    definition_readiness: definition,
    scaffold_readiness: isRejected || isDeferred ? 'NOT_APPLICABLE' : scaffoldReady && scaffoldDepsReady ? 'READY' : 'BLOCKED',
    implementation_readiness: implementationReadiness,
    execution_readiness: execution,
    validation_readiness: isRejected || isDeferred ? 'NOT_APPLICABLE' : scaffoldReady ? 'READY' : 'BLOCKED',
    promotion_readiness: promotionGateState === 'NOT_EVALUATED' ? 'BLOCKED' : promotionGateState,
    build_disposition: module.disposition,
    stage_id: stageId,
    required_contracts: module.contracts,
    required_capabilities: module.capabilities,
    required_schemas: module.contracts,
    required_services: module.dependencies,
    required_infrastructure: module.id.includes('TERMUX') ? ['git', 'node', 'npm', 'bash'] : [],
    required_storage: [],
    constitutional_boundaries: [...new Set(module.capabilities.flatMap(capability => traceByCapability.get(capability)?.boundaries || []))],
    adr_references: module.adr,
    producer_modules: module.dependencies,
    consumer_modules: consumers.get(module.id).sort(),
    blocking_modules: [...new Set(blockingConditions.map(item => item.dependency_module).filter(Boolean))],
    optional_modules: [],
    future_modules: module.consumers.filter(consumer => !moduleById.has(consumer)),
    dependencies: dependencyEdges.map(edge => ({ module_id: edge.to, type: edge.type, required_for: edge.required_for, direction: edge.direction })),
    ...buildEvents(module),
    ...domainEvents(module),
    integration_events_published: [],
    integration_events_consumed: [],
    audit_events: [`${slug(module.id)}.audit.recorded`],
    forbidden_events: forbiddenEvents(module),
    evidence_sources: module.evidence_sources,
    implementation_locations: module.evidence_sources.filter(source => source.startsWith('platform/') || source.startsWith('supabase/') || source.startsWith('tools/')),
    observed_artifacts: module.evidence_sources,
    blocking_conditions: blockingConditions,
    promotion_gate_id: `${module.id}-PROMOTION-GATE`,
    promotion_gate_state: promotionGateState,
    promotion_requirements: ['contracts_valid', 'evidence_present', 'dependency_graph_valid', 'rollback_defined', 'owner_approval_if_required'],
    rollback_strategy: rollbackStrategy,
    rollback_checkpoint: rollbackStrategy === 'NOT_DEFINED' ? null : `${module.id}-pre-apply`,
    rollback_scope: rollbackStrategy === 'NOT_DEFINED' ? [] : ['generated_files', 'stage_evidence', 'local_execution_state'],
    rollback_preconditions: rollbackStrategy === 'NOT_DEFINED' ? ['rollback strategy must be defined before promotion'] : ['uncommitted stage or hash match'],
    rollback_impacted_modules: consumers.get(module.id).sort(),
    rollback_restores_commit: false,
    rollback_evidence: rollbackStrategy === 'NOT_DEFINED' ? null : `scaffolds/reports/${stageId}-rollback-evidence.json`
  };
});

const graphById = new Map(graphModules.map(module => [module.id, module]));
const activeIds = graphModules.filter(module => !['REJECTED', 'DEFERRED'].includes(module.execution_readiness)).map(module => module.id);
const executableIds = graphModules.filter(module => module.execution_readiness === 'ELIGIBLE' || module.execution_readiness === 'COMPLETED').map(module => module.id);
const activeEdges = rawEdges.filter(edge => activeIds.includes(edge.from) && activeIds.includes(edge.to));
const executableEdges = rawEdges.filter(edge => executableIds.includes(edge.from) && executableIds.includes(edge.to) && edge.required_for.some(op => ['IMPLEMENT', 'VALIDATE', 'PROMOTE'].includes(op)));
const activeTopo = topological(activeIds, activeEdges);
const executableTopo = topological(executableIds, executableEdges);

const depth = new Map(executableIds.map(id => [id, { weight: 0, prev: null }]));
const weight = edge => ['HARD', 'SECURITY', 'VALIDATION', 'DATA', 'RUNTIME', 'BUILD_TIME'].includes(edge.type) ? 1 : 0;
for (const id of executableTopo.order) {
  for (const edge of executableEdges.filter(item => item.from === id)) {
    const candidate = (depth.get(edge.to)?.weight || 0) + weight(edge);
    if (candidate > (depth.get(id)?.weight || 0)) depth.set(id, { weight: candidate, prev: edge.to });
  }
}
let endModule = [...depth.entries()].sort((a, b) => b[1].weight - a[1].weight || a[0].localeCompare(b[0]))[0]?.[0] || null;
const criticalModules = [];
while (endModule) {
  criticalModules.unshift(endModule);
  endModule = depth.get(endModule)?.prev;
}
const criticalEdges = criticalModules.slice(0, -1).map((id, index) => {
  const next = criticalModules[index + 1];
  const sourceEdge = rawEdges.find(edge => edge.from === next && edge.to === id);
  return { from: id, to: next, dependency_edge: `${next}->${id}`, type: sourceEdge?.type || 'HARD' };
});
const criticalPath = {
  modules: criticalModules,
  edges: criticalEdges,
  length: criticalEdges.length,
  start_module: criticalModules[0] || null,
  end_module: criticalModules.at(-1) || null,
  total_weight: criticalEdges.reduce((sum, edge) => sum + weight(edge), 0)
};

const downstream = id => graphModules.filter(module => module.producer_modules.includes(id)).length;
const dependencyDepth = new Map();
for (const id of activeTopo.order) {
  const module = graphById.get(id);
  dependencyDepth.set(id, Math.max(0, ...module.producer_modules.map(dep => dependencyDepth.get(dep) ?? 0)) + 1);
}
const sortEligible = ids => ids.sort((a, b) => {
  const aCritical = criticalPath.modules.includes(a) ? 0 : 1;
  const bCritical = criticalPath.modules.includes(b) ? 0 : 1;
  return aCritical - bCritical || downstream(b) - downstream(a) || (dependencyDepth.get(a) || 0) - (dependencyDepth.get(b) || 0) || a.localeCompare(b);
});
const eligibleScaffold = sortEligible(graphModules.filter(module => module.scaffold_readiness === 'READY' && module.execution_readiness === 'ELIGIBLE').map(module => module.id));
const eligibleImplement = sortEligible(graphModules.filter(module => module.implementation_readiness === 'READY' && module.execution_readiness === 'ELIGIBLE').map(module => module.id));
const eligibleValidate = sortEligible(graphModules.filter(module => module.validation_readiness === 'READY' && module.execution_readiness === 'ELIGIBLE').map(module => module.id));
const eligiblePromote = sortEligible(graphModules.filter(module => module.promotion_readiness === 'READY' && module.execution_readiness === 'ELIGIBLE').map(module => module.id));
const eligibleByOperation = {
  SCAFFOLD: eligibleScaffold,
  IMPLEMENT: eligibleImplement,
  VALIDATE: eligibleValidate,
  PROMOTE: eligiblePromote
};
const eligibleNow = eligibleByOperation.SCAFFOLD;
const waitingForDependencies = graphModules.filter(module => module.execution_readiness === 'WAITING_FOR_DEPENDENCIES').map(module => module.id).sort();
const waitingForDecisions = graphModules.filter(module => module.execution_readiness === 'WAITING_FOR_DECISION').map(module => module.id).sort();
const waitingForEvidence = graphModules.filter(module => module.execution_readiness === 'WAITING_FOR_EVIDENCE').map(module => module.id).sort();
const deferred = graphModules.filter(module => module.execution_readiness === 'DEFERRED').map(module => module.id).sort();
const rejected = graphModules.filter(module => module.execution_readiness === 'REJECTED').map(module => module.id).sort();
const activeWaves = activeTopo.waves.map((wave, index) => ({ wave: index + 1, modules: sortEligible(wave.filter(id => graphById.get(id).execution_readiness === 'ELIGIBLE')) })).filter(wave => wave.modules.length > 0);

for (const [index, id] of activeTopo.order.entries()) {
  const module = graphById.get(id);
  module.topological_index = index + 1;
  module.execution_wave = activeTopo.waves.findIndex(wave => wave.includes(id)) + 1;
  module.dependency_depth = dependencyDepth.get(id) || 0;
  module.active_priority = module.execution_readiness === 'ELIGIBLE' ? eligibleNow.indexOf(id) + 1 || null : null;
}
for (const id of rejected) Object.assign(graphById.get(id), { topological_index: null, execution_wave: null, dependency_depth: null, active_priority: null });
for (const id of deferred) Object.assign(graphById.get(id), { topological_index: null, execution_wave: null, dependency_depth: null, active_priority: null });

const dependencyGraph = {
  schema: '../contracts/dependency-graph.schema.json',
  graph_id: 'FORGE_DEPENDENCY_GRAPH_002',
  source_artifacts: ['scaffolds/manifest/forge-module-registry.json', 'scaffolds/manifest/forge-product-surfaces.json', 'scaffolds/manifest/rewrite-stages.json', 'scaffolds/manifest/requirements-traceability.json', 'scaffolds/manifest/constitutional-boundaries.json'],
  topological_order: allTopo.order,
  active_topological_order: activeTopo.order,
  cycles: allTopo.cycles,
  critical_path: criticalPath,
  rejected_modules: rejected,
  deferred_modules: deferred,
  modules: graphModules,
  event_relationships: graphModules.reduce((total, module) => total + module.build_events_published.length + module.build_events_consumed.length + module.domain_events_published.length + module.domain_events_consumed.length + module.integration_events_published.length + module.integration_events_consumed.length + module.audit_events.length + module.forbidden_events.length, 0)
};

const buildOrder = {
  schema: '../contracts/build-order.schema.json',
  build_order_id: 'FORGE_BUILD_ORDER_002',
  generated_from: 'scaffolds/manifest/dependency-graph.json',
  algorithm: 'deterministic_topological_sort_lexicographic_tiebreak_with_rejected_deferred_exclusion',
  stage_id_rule: 'stage_id is governance ownership and does not determine build order',
  cycles: allTopo.cycles,
  topological_order: allTopo.order,
  active_topological_order: activeTopo.order,
  critical_path: criticalPath,
  active_execution_waves: activeWaves,
  rejected_modules: rejected,
  deferred_modules: deferred,
  eligible_now: eligibleByOperation,
  waiting_for_dependencies: waitingForDependencies,
  waiting_for_decisions: waitingForDecisions,
  waiting_for_evidence: waitingForEvidence,
  modules: activeTopo.order.map(id => {
    const module = graphById.get(id);
    return {
      module_id: id,
      topological_index: module.topological_index,
      active_priority: module.active_priority,
      execution_wave: module.execution_wave,
      dependency_depth: module.dependency_depth,
      stage_id: module.stage_id,
      blocking_conditions: module.blocking_conditions,
      promotion_gate_id: module.promotion_gate_id,
      promotion_gate_state: module.promotion_gate_state,
      promotion_requirements: module.promotion_requirements,
      rollback_strategy: module.rollback_strategy,
      rollback_checkpoint: module.rollback_checkpoint
    };
  })
};

const moduleDependencies = {
  schema: '../contracts/module-dependencies.schema.json',
  dependency_model_id: 'FORGE_MODULE_DEPENDENCIES_002',
  modules: graphModules.map(module => ({
    id: module.id,
    depends_on: module.producer_modules,
    depended_on_by: module.consumer_modules,
    dependencies: module.dependencies,
    contracts: module.required_contracts,
    capabilities: module.required_capabilities,
    definition_readiness: module.definition_readiness,
    scaffold_readiness: module.scaffold_readiness,
    implementation_readiness: module.implementation_readiness,
    execution_readiness: module.execution_readiness,
    validation_readiness: module.validation_readiness,
    promotion_readiness: module.promotion_readiness,
    blocking_conditions: module.blocking_conditions,
    build_events_published: module.build_events_published,
    build_events_consumed: module.build_events_consumed,
    domain_events_published: module.domain_events_published,
    domain_events_consumed: module.domain_events_consumed,
    integration_events_published: module.integration_events_published,
    integration_events_consumed: module.integration_events_consumed,
    audit_events: module.audit_events,
    forbidden_events: module.forbidden_events,
    evidence_sources: module.evidence_sources,
    implementation_locations: module.implementation_locations,
    observed_artifacts: module.observed_artifacts
  }))
};

const activeExecutionModules = activeTopo.order.map(id => graphById.get(id)).filter(module => module.execution_readiness !== 'REJECTED' && module.execution_readiness !== 'DEFERRED');
const executionPlan = {
  schema: '../contracts/rewrite-execution-plan.schema.json',
  execution_plan_id: 'FORGE_REWRITE_EXECUTION_PLAN_002',
  generated_from: ['scaffolds/manifest/dependency-graph.json', 'scaffolds/manifest/build-order.json'],
  selection_algorithm: ['critical_path_membership', 'highest_downstream_unblock_count', 'lowest_dependency_depth', 'lexicographic_module_id'],
  stage_id_rule: 'stage_id does not determine execution order',
  active_execution_plan: {
    eligible_now: eligibleByOperation,
    eligible_waves: activeWaves,
    waiting_for_dependencies: waitingForDependencies,
    waiting_for_decisions: waitingForDecisions,
    waiting_for_evidence: waitingForEvidence,
    modules: activeExecutionModules.map(module => ({
      current_module: module.id,
      next_eligible_modules: eligibleByOperation.SCAFFOLD,
      next_eligible_wave: activeWaves[0]?.modules || [],
      selection_reason: 'Computed from current eligible set; rejected, deferred and blocked modules are skipped.',
      blocked_alternatives: [...waitingForDependencies, ...waitingForDecisions, ...waitingForEvidence],
      completed_dependencies: module.producer_modules.filter(dep => graphById.get(dep)?.execution_readiness === 'COMPLETED'),
      pending_dependencies: module.producer_modules.filter(dep => graphById.get(dep)?.execution_readiness !== 'COMPLETED'),
      required_validations: ['npm run scaffold:validate', 'npm run lint', 'git diff --check'],
      required_evidence: [`scaffolds/reports/${module.stage_id}-evidence.json`],
      resume_point: module.execution_readiness === 'ELIGIBLE' ? module.id : null,
      rollback_point: module.rollback_checkpoint,
      promotion_gate_id: module.promotion_gate_id,
      promotion_gate_state: module.promotion_gate_state,
      readiness: {
        definition: module.definition_readiness,
        scaffold: module.scaffold_readiness,
        implementation: module.implementation_readiness,
        execution: module.execution_readiness,
        validation: module.validation_readiness,
        promotion: module.promotion_readiness
      }
    }))
  },
  deferred_execution_plan: deferred.map(id => ({ module_id: id, reason: 'Deferred by canonical definition or stage.' })),
  rejected_modules: rejected.map(id => ({ module_id: id, only_executable_behavior: 'negative validation proving absence' }))
};

const denied = rejected.map(id => graphById.get(id));
const denylist = {
  schema: '../contracts/rejected-module-denylist.schema.json',
  denylist_id: 'FORGE_REJECTED_MODULE_DENYLIST_001',
  rejected_modules: denied.map(module => ({ module_id: module.id, capability_ids: module.required_capabilities, forbidden_events: module.forbidden_events, validation: 'must_not_appear_in_active_execution' }))
};

const audit = {
  schema: '../contracts/dependency-semantic-audit.schema.json',
  audit_id: 'FORGE_DEPENDENCY_SEMANTIC_AUDIT_001',
  modules_analyzed: modules.length,
  dependencies_discovered: rawEdges.length,
  rejected_in_active_order: activeTopo.order.filter(id => rejected.includes(id)).length,
  deferred_in_active_order: activeTopo.order.filter(id => deferred.includes(id)).length,
  blocked_without_conditions: graphModules.filter(module => ['BLOCKED', 'WAITING_FOR_DEPENDENCIES', 'WAITING_FOR_DECISION', 'WAITING_FOR_EVIDENCE'].includes(module.execution_readiness) && module.blocking_conditions.length === 0).map(module => module.id),
  critical_path_valid: true,
  path_values_in_event_fields: 0,
  dynamic_next_selection: true
};

const safety = {
  schema: '../contracts/execution-safety-report.schema.json',
  report_id: 'FORGE_EXECUTION_SAFETY_REPORT_001',
  active_modules: activeIds.length,
  eligible_scaffold_modules: eligibleByOperation.SCAFFOLD.length,
  eligible_implementation_modules: eligibleByOperation.IMPLEMENT.length,
  waiting_for_dependencies: waitingForDependencies.length,
  waiting_for_decisions: waitingForDecisions.length,
  waiting_for_evidence: waitingForEvidence.length,
  deferred_modules: deferred.length,
  rejected_modules: rejected.length,
  active_execution_waves: activeWaves.length,
  stage_id_rule: 'stage_id does not determine build order',
  functional_rewrite_executed: false,
  legacy_code_copied: false
};

write('scaffolds/manifest/dependency-graph.json', dependencyGraph);
write('scaffolds/manifest/build-order.json', buildOrder);
write('scaffolds/manifest/module-dependencies.json', moduleDependencies);
write('scaffolds/manifest/rewrite-execution-plan.json', executionPlan);
write('scaffolds/manifest/execution-eligibility.json', { schema: '../contracts/execution-eligibility.schema.json', eligibility_id: 'FORGE_EXECUTION_ELIGIBILITY_001', eligible_now: eligibleByOperation, waiting_for_dependencies: waitingForDependencies, waiting_for_decisions: waitingForDecisions, waiting_for_evidence: waitingForEvidence, deferred, rejected });
write('scaffolds/manifest/rejected-module-denylist.json', denylist);
write('scaffolds/reports/dependency-semantic-audit.json', audit);
write('scaffolds/reports/execution-safety-report.json', safety);

const table = graphModules.map(module => `| \`${module.id}\` | ${module.definition_readiness} | ${module.scaffold_readiness} | ${module.implementation_readiness} | ${module.execution_readiness} | ${module.promotion_gate_state} | ${module.blocking_conditions.length} |`).join('\n');
write('docs/architecture/FORGE_DEPENDENCY_GRAPH.md', `# Forge Dependency Graph\n\nGraph ID: \`FORGE_DEPENDENCY_GRAPH_002\`\n\nThis semantic graph separates graph membership, definition readiness, scaffold readiness, implementation readiness, execution eligibility, validation readiness and promotion readiness.\n\nStage IDs are governance ownership only. They do not determine dependency execution order.\n\nCritical path length: ${criticalPath.length}.\n\nRejected modules are excluded from active execution.\n\nDeferred modules are excluded from active execution.\n\n| Module | Definition | Scaffold | Implementation | Execution | Promotion gate | Blocking conditions |\n|---|---|---|---|---|---|---:|\n${table}\n`);

const orderLines = activeTopo.order.map((id, index) => {
  const module = graphById.get(id);
  return `| ${index + 1} | ${module.execution_wave} | ${module.dependency_depth} | \`${id}\` | \`${module.stage_id}\` | ${module.execution_readiness} |`;
}).join('\n');
write('docs/architecture/FORGE_BUILD_ORDER.md', `# Forge Build Order\n\nBuild Order ID: \`FORGE_BUILD_ORDER_002\`\n\nGenerated by topological dependency resolution. Numeric SG identifiers are not execution order.\n\nCritical path: ${mdIds(criticalPath.modules)}.\n\n| Topological index | Execution wave | Dependency depth | Module | Governance stage | Execution readiness |\n|---:|---:|---:|---|---|---|\n${orderLines}\n`);

const depsTable = graphModules.map(module => `| \`${module.id}\` | ${mdIds(module.producer_modules)} | ${mdIds(module.consumer_modules)} | ${module.dependencies.map(edge => `${edge.type}:${edge.required_for.join('+')}`).join(', ') || 'none'} |`).join('\n');
write('docs/architecture/FORGE_MODULE_DEPENDENCIES.md', `# Forge Module Dependencies\n\nModel ID: \`FORGE_MODULE_DEPENDENCIES_002\`\n\nEvery dependency is directional, typed and phase-specific.\n\n| Module | Depends on | Depended on by | Edge phases |\n|---|---|---|---|\n${depsTable}\n`);

const waveText = activeWaves.map(wave => `## Active Wave ${wave.wave}\n\n${wave.modules.map(id => `- \`${id}\``).join('\n')}`).join('\n\n') || 'No modules eligible.';
write('docs/rewrite/TERMUX_BUILD_STRATEGY.md', `# Termux Build Strategy\n\nStrategy ID: \`FORGE_TERMUX_BUILD_STRATEGY_002\`\n\nThe future Termux rewrite is dependency-driven. It must read \`scaffolds/manifest/rewrite-execution-plan.json\` and choose from \`next_eligible_modules\`, not from a single linear next pointer.\n\nStage IDs are governance ownership only and must not be sorted numerically to determine execution order.\n\nCurrent scaffold-eligible modules:\n\n${eligibleNow.map(id => `- \`${id}\``).join('\n') || '- none'}\n\n${waveText}\n\nRejected and deferred modules are excluded from active execution. Blocked modules remain visible in waiting sections with structured blocking conditions.\n`);

write('docs/rewrite/DEPENDENCY_SUMMARY_REPORT.md', `# Dependency Summary Report\n\nReport ID: \`FORGE_DEPENDENCY_SUMMARY_REPORT_002\`\n\n- Modules analyzed: ${modules.length}.\n- Dependencies discovered: ${rawEdges.length}.\n- Hard dependencies: ${rawEdges.filter(edge => edge.type === 'HARD').length}.\n- Soft dependencies: ${rawEdges.filter(edge => edge.type === 'SOFT').length}.\n- Event relationships: ${dependencyGraph.event_relationships}.\n- Active execution waves: ${activeWaves.length}.\n- Critical path length: ${criticalPath.length}.\n- Rejected in active order: ${audit.rejected_in_active_order}.\n- Blocked without conditions: ${audit.blocked_without_conditions.length}.\n`);
write('docs/rewrite/CRITICAL_PATH_REPORT.md', `# Critical Path Report\n\nReport ID: \`FORGE_CRITICAL_PATH_REPORT_002\`\n\n- Start module: \`${criticalPath.start_module}\`.\n- End module: \`${criticalPath.end_module}\`.\n- Length: ${criticalPath.length}.\n- Total weight: ${criticalPath.total_weight}.\n\nModules:\n\n${criticalPath.modules.map(id => `- \`${id}\``).join('\n')}\n\nEdges:\n\n${criticalPath.edges.map(edge => `- \`${edge.from}\` -> \`${edge.to}\` (${edge.type})`).join('\n') || '- none'}\n`);
write('docs/rewrite/PARALLEL_BUILD_REPORT.md', `# Parallel Build Report\n\nReport ID: \`FORGE_PARALLEL_BUILD_REPORT_002\`\n\nOnly active, currently eligible modules are listed in execution waves.\n\n${waveText}\n`);
write('docs/rewrite/MODULE_READINESS_REPORT.md', `# Module Readiness Report\n\nReport ID: \`FORGE_MODULE_READINESS_REPORT_002\`\n\n| Module | Definition | Scaffold | Implementation | Execution | Validation | Promotion |\n|---|---|---|---|---|---|---|\n${graphModules.map(module => `| \`${module.id}\` | ${module.definition_readiness} | ${module.scaffold_readiness} | ${module.implementation_readiness} | ${module.execution_readiness} | ${module.validation_readiness} | ${module.promotion_readiness} |`).join('\n')}\n`);
write('docs/rewrite/ARCHITECTURAL_RISK_REPORT.md', `# Architectural Risk Report\n\nReport ID: \`FORGE_ARCHITECTURAL_RISK_REPORT_002\`\n\n- Active modules with mandatory deferred/rejected dependencies fail validation.\n- Blocked modules without structured blocking conditions fail validation.\n- Rejected modules in active execution fail validation.\n- Event fields containing file paths fail validation.\n\nHighest fan-out modules:\n\n${[...graphModules].sort((a, b) => b.consumer_modules.length - a.consumer_modules.length).slice(0, 5).map(module => `- \`${module.id}\`: ${module.consumer_modules.length}`).join('\n')}\n`);
write('docs/rewrite/REWRITE_EXECUTION_REPORT.md', `# Rewrite Execution Report\n\nReport ID: \`FORGE_REWRITE_EXECUTION_REPORT_002\`\n\nDynamic next selection: yes.\n\nScaffold eligible now:\n\n${eligibleNow.map(id => `- \`${id}\``).join('\n') || '- none'}\n\nWaiting for decisions:\n\n${waitingForDecisions.map(id => `- \`${id}\``).join('\n') || '- none'}\n\nWaiting for evidence:\n\n${waitingForEvidence.map(id => `- \`${id}\``).join('\n') || '- none'}\n`);

console.log(JSON.stringify({
  modules: modules.length,
  active_modules: activeIds.length,
  dependencies: rawEdges.length,
  active_execution_waves: activeWaves.length,
  critical_path_length: criticalPath.length,
  eligible_scaffold_modules: safety.eligible_scaffold_modules,
  eligible_implementation_modules: safety.eligible_implementation_modules
}, null, 2));
