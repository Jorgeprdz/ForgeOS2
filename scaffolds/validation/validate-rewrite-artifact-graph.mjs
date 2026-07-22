#!/usr/bin/env node
import { assert, exists, finish, readJson } from './lib.mjs';
import { validateDerivedGraph } from './lib/rewrite-artifact-dag.mjs';

const name = 'validate-rewrite-artifact-graph';
const graphPath = 'scaffolds/manifest/rewrite-artifact-graph.json';
assert(exists(graphPath), `missing ${graphPath}`);

const stages = readJson('scaffolds/manifest/rewrite-stages.json').stages;
const graph = readJson(graphPath);
const stageIds = new Set(stages.map(stage => stage.id));
const orderIndex = new Map(graph.topological_order.map((stageId, index) => [stageId, index]));
const producerByArtifact = new Map();

const { failures } = validateDerivedGraph(stages, graph);
for (const failure of failures) assert(false, `${failure.code}:${failure.message}${failure.detail ? ` ${JSON.stringify(failure.detail)}` : ''}`);

assert(graph.order_source === 'produces_consumes_topological_sort', 'artifact graph order_source must be produces/consumes');
assert(graph.artifact_completion_model === 'artifact-level receipts unlock consumers independently from whole-stage completion', 'artifact completion model missing');
assert(graph.partial_stage_completion === true, 'partial stage completion must be supported');
assert(Array.isArray(graph.tie_breaker) && graph.tie_breaker.length >= 5, 'deterministic tie breaker must be declared');
assert(graph.duplicate_producers.length === 0, `duplicate artifact producers: ${JSON.stringify(graph.duplicate_producers)}`);
assert(graph.missing_producers.length === 0, `missing artifact producers: ${JSON.stringify(graph.missing_producers)}`);
assert(graph.cycles.length === 0, `artifact DAG contains cycles: ${graph.cycles.join(', ')}`);
assert(graph.topological_order.length === stages.length, 'artifact topological order must cover every stage');
assert(graph.compatibility_status === 'PASS', 'historical compatibility must pass');

for (const id of graph.topological_order) assert(stageIds.has(id), `topological order references missing stage ${id}`);
for (const stage of stages) {
  assert(!('depends_on_stages' in stage), `${stage.id} declares direct depends_on_stages; use consumes artifacts`);
  assert(Array.isArray(stage.produces), `${stage.id} missing produces array`);
  assert(Array.isArray(stage.consumes), `${stage.id} missing consumes array`);
  for (const artifact of stage.produces) {
    assert(!producerByArtifact.has(artifact), `${artifact} has duplicate producers ${producerByArtifact.get(artifact)} and ${stage.id}`);
    producerByArtifact.set(artifact, stage.id);
  }
}

for (const stage of stages) {
  for (const artifact of stage.consumes) {
    const producer = producerByArtifact.get(artifact);
    assert(producer, `${stage.id} consumes ${artifact} without producer`);
    assert(orderIndex.get(producer) < orderIndex.get(stage.id), `${stage.id} consumes ${artifact} before producer ${producer}`);
    assert(graph.edges.some(edge => edge.from_stage === producer && edge.to_stage === stage.id && edge.artifact === artifact), `${stage.id} missing graph edge for ${artifact}`);
  }
}

for (const artifact of graph.artifacts) {
  for (const key of ['artifact_id', 'artifact_type', 'produced_by', 'materialization', 'consumed_by', 'version', 'status', 'constitution_refs', 'owner_decision_refs', 'receipt_template']) {
    assert(key in artifact, `${artifact.artifact || artifact.artifact_id} missing artifact metadata ${key}`);
  }
  assert(producerByArtifact.get(artifact.artifact_id) === artifact.producer_stage, `${artifact.artifact_id} producer mismatch`);
  assert(artifact.produced_by === artifact.producer_stage, `${artifact.artifact_id} produced_by mismatch`);
  assert(artifact.materialization.required === true, `${artifact.artifact_id} materialization must be required`);
  assert(Array.isArray(artifact.materialization.paths), `${artifact.artifact_id} materialization paths must be an array`);
  assert(artifact.receipt_template.artifact_id === artifact.artifact_id, `${artifact.artifact_id} receipt template mismatch`);
  for (const consumer of artifact.consumer_stages) {
    assert(stageIds.has(consumer), `${artifact.artifact_id} references missing consumer ${consumer}`);
    assert(orderIndex.get(artifact.producer_stage) < orderIndex.get(consumer), `${artifact.artifact_id} consumer ${consumer} appears before producer`);
  }
}

const terminalArtifacts = new Set((graph.terminal_artifacts || []).map(item => item.artifact));
const orphanArtifacts = graph.artifacts
  .filter(artifact => artifact.consumer_stages.length === 0)
  .filter(artifact => !terminalArtifacts.has(artifact.artifact_id));
assert(orphanArtifacts.length === 0, `non-terminal artifacts without consumers: ${orphanArtifacts.map(item => item.artifact_id).join(', ')}`);

for (const compatibility of graph.historical_compatibility || []) {
  assert(compatibility.status === 'PASS', `historical compatibility failed for ${compatibility.stage_id}`);
  assert(compatibility.missing_paths.length === 0, `historical compatibility missing paths for ${compatibility.stage_id}`);
}

finish(name);
