#!/usr/bin/env node
import { deriveRewriteArtifactGraph, readJson, writeJson, verifyHistoricalCompatibility } from './lib/rewrite-artifact-dag.mjs';

const manifestPath = 'scaffolds/manifest/rewrite-stages.json';
const manifest = readJson(manifestPath);
const stages = manifest.stages;
const derived = deriveRewriteArtifactGraph(stages);

if (derived.errors.length || derived.duplicateProducers.length || derived.missingProducers.length || derived.cycles.length) {
  console.error(JSON.stringify({
    errors: derived.errors,
    duplicate_producers: derived.duplicateProducers,
    missing_producers: derived.missingProducers,
    cycles: derived.cycles
  }, null, 2));
  process.exit(1);
}

for (const stage of stages) {
  stage.canonical_order = derived.orderByStage.get(stage.id);
  stage.artifact_wave = derived.waveByStage.get(stage.id);
  stage.derived_depends_on_stages = [...new Set(derived.edges.filter(edge => edge.to_stage === stage.id).map(edge => edge.from_stage))]
    .sort((a, b) => derived.orderByStage.get(a) - derived.orderByStage.get(b) || a.localeCompare(b));
  delete stage.depends_on_stages;
}
stages.sort((a, b) => a.canonical_order - b.canonical_order || a.id.localeCompare(b.id));
manifest.stage_id_rule = 'stage_id is governance identity only; produces/consumes artifact dependencies define execution order.';
manifest.order_source = 'scaffolds/manifest/rewrite-artifact-graph.json';
writeJson(manifestPath, manifest);

const compatibility = verifyHistoricalCompatibility();
const artifactGraph = {
  schema: '../contracts/rewrite-artifact-graph.schema.json',
  graph_id: 'FORGE_REWRITE_ARTIFACT_GRAPH_001',
  order_source: 'produces_consumes_topological_sort',
  tie_breaker: [
    'constitutional_priority',
    'critical_path_priority',
    'downstream_unblock_count',
    'explicit_stage_priority',
    'stable_stage_id'
  ],
  stage_id_rule: 'SG identifiers are labels; artifact edges are authoritative.',
  artifact_completion_model: 'artifact-level receipts unlock consumers independently from whole-stage completion',
  partial_stage_completion: true,
  artifacts: derived.artifactRecords,
  edges: derived.edges,
  topological_order: derived.order,
  waves: derived.waves.map((stageIds, index) => ({ wave: index + 1, stages: stageIds })),
  cycles: derived.cycles,
  duplicate_producers: derived.duplicateProducers,
  authorized_duplicate_producers: [],
  missing_producers: derived.missingProducers,
  terminal_artifacts: derived.terminalArtifacts,
  historical_compatibility: compatibility,
  compatibility_status: compatibility.every(item => item.status === 'PASS') ? 'PASS' : 'FAIL'
};
writeJson('scaffolds/manifest/rewrite-artifact-graph.json', artifactGraph);

const sequence = {
  schema: '../contracts/rewrite-stage-sequence.schema.json',
  sequence_id: 'FORGE_REWRITE_STAGE_SEQUENCE_001',
  status: 'CANONICAL_DEFINITIVE_ARTIFACT_DAG',
  stage_id_rule: 'Never sort by SG number. Resolve the artifact DAG from produces and consumes.',
  tie_breaker: artifactGraph.tie_breaker,
  completion_state_source: '.forge/rewrite/state.json is local runtime state and is not versioned.',
  artifact_graph: 'scaffolds/manifest/rewrite-artifact-graph.json',
  sequence: stages.map(stage => ({
    stage_id: stage.id,
    previous_stage_id: stage.previous_stage_id ?? null,
    canonical_order: stage.canonical_order,
    artifact_wave: stage.artifact_wave,
    dependency_layer: stage.dependency_layer,
    name: stage.name,
    status: stage.status,
    produces: stage.produces || [],
    consumes: stage.consumes || [],
    derived_depends_on_stages: stage.derived_depends_on_stages || [],
    owner_decisions: stage.owner_decisions || [],
    executable_when: stage.status === 'READY'
      ? 'stage is READY and every consumed artifact is materialized by receipt, historical compatibility or validated current output'
      : 'blocked only until directly affected decision/evidence/architecture conditions are ratified',
    first_consumer_barrier: (stage.owner_decisions || []).some(decision => decision.status === 'PENDING') ? 'DIRECT_DEPENDENTS_BLOCKED_UNTIL_DECISION_RATIFIED' : 'NONE'
  })),
  barriers: [
    { barrier_id: 'BARRIER-PRODUCT-SEMANTICS', artifact: 'AdvisorOwnerDecisionSet', producer_stage: 'SG-021', scope: 'direct consumers only' },
    { barrier_id: 'BARRIER-LEGACY-EVIDENCE', artifact: 'LegacyFunctionalEvidenceClassification', producer_stage: 'SG-020', scope: 'legacy evidence consumers only' }
  ]
};
writeJson('scaffolds/manifest/canonical-rewrite-sequence.json', sequence);

console.log(JSON.stringify({
  stages: stages.length,
  artifacts: artifactGraph.artifacts.length,
  edges: derived.edges.length,
  waves: derived.waves.length,
  cycles: derived.cycles.length,
  compatibility_status: artifactGraph.compatibility_status
}, null, 2));
