#!/usr/bin/env node
import { assert, exists, finish, readJson } from './lib.mjs';

const name = 'validate-owner-decision-collapse';
for (const file of [
  'scaffolds/manifest/canonical-owner-decisions.json',
  'scaffolds/reports/owner-decision-collapse-report.json',
  'docs/decisions/FORGE_CANONICAL_OWNER_DECISIONS.md',
  'docs/decisions/FORGE_OWNER_DECISION_EXECUTION_ORDER.md',
  'docs/decisions/FORGE_DECISION_DASHBOARD.md'
]) assert(exists(file), `missing ${file}`);

const original = readJson('scaffolds/manifest/owner-decision-packet.json').decisions;
const canonical = readJson('scaffolds/manifest/canonical-owner-decisions.json');
const graph = readJson('scaffolds/manifest/dependency-graph.json');
const firstWave = readJson('scaffolds/manifest/first-execution-wave.json');
const go = readJson('scaffolds/reports/rewrite-go-no-go.json');
const registryIds = new Set(readJson('scaffolds/manifest/forge-module-registry.json').modules.map(module => module.id));
const rejected = new Set(graph.rejected_modules);
const deferred = new Set(graph.deferred_modules);
const firstWaveIds = new Set(firstWave.modules.map(module => module.module_id));

const decisionIds = new Set();
for (const decision of canonical.decisions) {
  assert(!decisionIds.has(decision.decision_id), `duplicate canonical decision ${decision.decision_id}`);
  decisionIds.add(decision.decision_id);
}
assert(canonical.initial_owner_decisions === original.length, 'initial decision count mismatch');
assert(canonical.duplicates_removed === original.length - canonical.decisions.length, 'duplicate removal count mismatch');
assert(Array.isArray(canonical.resolved_original_decision_ids), 'resolved original decision ids missing');
assert(canonical.summary.first_wave_blocking_decisions === 0, 'first-wave decisions remain after collapse');
assert(go.final_decision === canonical.summary.final_decision, 'GO/NO-GO decision was not recomputed from canonical decision set');
assert(go.final_decision === 'GO', `expected GO after first-wave decision collapse, got ${go.final_decision}`);

const questionKeys = new Set();
for (const decision of canonical.decisions) {
  for (const key of ['decision_id', 'title', 'canonical_question', 'affected_modules', 'affected_contracts', 'affected_surfaces', 'reason', 'blocking_scope', 'priority', 'derived_from', 'recommended_option', 'alternative_options', 'constitutional_constraints', 'required_owner_input', 'estimated_unblocked_modules', 'estimated_unblocked_contracts']) {
    assert(key in decision, `${decision.decision_id} missing ${key}`);
  }
  const questionKey = `${decision.derived_from.stage_id}:${decision.canonical_question}`;
  assert(!questionKeys.has(questionKey), `duplicate equivalent question remains: ${questionKey}`);
  questionKeys.add(questionKey);
  for (const moduleId of decision.affected_modules) {
    assert(registryIds.has(moduleId), `${decision.decision_id} references missing module ${moduleId}`);
    assert(!rejected.has(moduleId), `${decision.decision_id} references rejected module ${moduleId}`);
    assert(!deferred.has(moduleId), `${decision.decision_id} references deferred module as blocker ${moduleId}`);
    assert(!firstWaveIds.has(moduleId), `${decision.decision_id} blocks first-wave module ${moduleId}`);
  }
  assert(decision.derived_from.original_decision_ids.length >= 1, `${decision.decision_id} lacks original decision references`);
  assert(decision.blocking_scope !== 'BLOCKING_FIRST_WAVE', `${decision.decision_id} is a first-wave blocker`);
}

const originalIds = new Set(original.map(decision => decision.decision_id));
const referencedOriginals = new Set([
  ...canonical.resolved_original_decision_ids,
  ...canonical.decisions.flatMap(decision => decision.derived_from.original_decision_ids)
]);
for (const id of originalIds) assert(referencedOriginals.has(id), `original decision not accounted for: ${id}`);

finish(name);
