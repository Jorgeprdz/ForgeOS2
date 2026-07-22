#!/usr/bin/env node
import { assert, exists, finish, readJson } from './lib.mjs';

const name = 'validate-rewrite-sequence';
const sequencePath = 'scaffolds/manifest/canonical-rewrite-sequence.json';
assert(exists(sequencePath), `missing ${sequencePath}`);

const stages = readJson('scaffolds/manifest/rewrite-stages.json').stages;
const sequence = readJson(sequencePath).sequence;
const artifactGraph = readJson('scaffolds/manifest/rewrite-artifact-graph.json');
const stageIds = new Set(stages.map(stage => stage.id));
const sequenceIds = new Set(sequence.map(stage => stage.stage_id));
const byId = new Map(sequence.map(stage => [stage.stage_id, stage]));
const orderById = new Map(sequence.map(stage => [stage.stage_id, stage.canonical_order]));

assert(sequence.length === stages.length, 'canonical sequence must cover every rewrite stage');
for (const stage of stages) assert(sequenceIds.has(stage.id), `${stage.id} missing from canonical sequence`);

const orders = new Set();
for (const stage of sequence) {
  assert(stageIds.has(stage.stage_id), `${stage.stage_id} does not exist in rewrite-stages`);
  assert(Number.isInteger(stage.canonical_order), `${stage.stage_id} missing integer canonical_order`);
  assert(!orders.has(stage.canonical_order), `duplicate canonical_order ${stage.canonical_order}`);
  orders.add(stage.canonical_order);
  assert(stage.executable_when, `${stage.stage_id} missing executable_when`);
  for (const dependency of stage.derived_depends_on_stages) {
    assert(stageIds.has(dependency), `${stage.stage_id} depends on missing stage ${dependency}`);
    assert(orderById.get(dependency) < stage.canonical_order, `${stage.stage_id} consumes future dependency ${dependency}`);
  }
  for (const decision of stage.owner_decisions || []) {
    assert(decision.id && decision.status && decision.contract_affected && decision.unlock_criteria, `${stage.stage_id} has incomplete owner decision`);
  }
}

const visiting = new Set();
const visited = new Set();
const cycles = [];
function visit(id, path = []) {
  if (visiting.has(id)) {
    cycles.push([...path, id].join(' -> '));
    return;
  }
  if (visited.has(id)) return;
  visiting.add(id);
  for (const dep of byId.get(id).derived_depends_on_stages) visit(dep, [...path, id]);
  visiting.delete(id);
  visited.add(id);
}
for (const id of sequenceIds) visit(id);
assert(cycles.length === 0, `rewrite sequence contains cycles: ${cycles.join('; ')}`);

const pendingDecisionStages = sequence.filter(stage => (stage.owner_decisions || []).some(decision => decision.status === 'PENDING'));
for (const producer of pendingDecisionStages) {
  for (const decision of producer.owner_decisions) {
    for (const blocked of decision.stages_blocked || []) {
      if (!byId.has(blocked)) continue;
      const consumer = byId.get(blocked);
      assert(consumer.canonical_order > producer.canonical_order, `${blocked} is not after pending decision producer ${producer.stage_id}`);
      assert(consumer.status !== 'READY', `${blocked} is READY while pending decision ${decision.id} remains unresolved`);
    }
  }
}

const stageById = new Map(stages.map(stage => [stage.id, stage]));
for (const item of sequence) {
  const stage = stageById.get(item.stage_id);
  assert(stage.canonical_order === item.canonical_order, `${item.stage_id} canonical_order differs between manifest and sequence`);
  assert(JSON.stringify(stage.derived_depends_on_stages || []) === JSON.stringify(item.derived_depends_on_stages), `${item.stage_id} derived_depends_on_stages differs between manifest and sequence`);
}
assert(JSON.stringify(artifactGraph.topological_order) === JSON.stringify(sequence.map(stage => stage.stage_id)), 'canonical sequence must be derived from artifact graph topological order');

finish(name);
