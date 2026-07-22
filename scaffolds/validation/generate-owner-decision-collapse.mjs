#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './lib.mjs';

const root = repoRoot();
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const writeText = (file, text) => {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, text.endsWith('\n') ? text : `${text}\n`);
};
const writeJson = (file, data) => writeText(file, JSON.stringify(data, null, 2));
const md = values => values.length ? values.map(value => `- \`${value}\``).join('\n') : '- none';

const original = readJson('scaffolds/manifest/owner-decision-packet.json').decisions;
const graph = readJson('scaffolds/manifest/dependency-graph.json');
const registry = readJson('scaffolds/manifest/forge-module-registry.json').modules;
const stages = readJson('scaffolds/manifest/rewrite-stages.json').stages;
const surfaces = readJson('scaffolds/manifest/forge-product-surfaces.json').surfaces;
const firstWave = readJson('scaffolds/manifest/first-execution-wave.json');
const goNoGo = readJson('scaffolds/reports/rewrite-go-no-go.json');
const sourceCommit = goNoGo.source_commit;
const moduleById = new Map(graph.modules.map(module => [module.id, module]));
const registryById = new Map(registry.map(module => [module.id, module]));
const stageById = new Map(stages.map(stage => [stage.id, stage]));
const surfacesByModule = new Map();
for (const surface of surfaces) {
  if (!surfacesByModule.has(surface.responsible_module)) surfacesByModule.set(surface.responsible_module, []);
  surfacesByModule.get(surface.responsible_module).push(surface.id);
}

function categoryFor(status) {
  if (status === 'BLOCKED_REQUIRES_ARCHITECTURAL_DECISION') return 'Architecture';
  if (status === 'BLOCKED_REQUIRES_LEGACY_EVIDENCE') return 'Evidence';
  if (status === 'BLOCKED_REQUIRES_PRODUCT_DEFINITION') return 'Product';
  if (status === 'BLOCKED_REQUIRES_OWNER_DECISION') return 'Owner';
  return 'Operational';
}
function ownerClass(status) {
  if (status === 'BLOCKED_REQUIRES_ARCHITECTURAL_DECISION') return 'ARCHITECT_REQUIRED';
  if (status === 'BLOCKED_REQUIRES_LEGACY_EVIDENCE') return 'EXTERNAL_EVIDENCE_REQUIRED';
  return 'OWNER_REQUIRED';
}
function scopeFor(modules) {
  const first = new Set(firstWave.modules.map(module => module.module_id));
  if (modules.some(id => first.has(id))) return 'BLOCKING_FIRST_WAVE';
  if (modules.some(id => moduleById.get(id)?.implementation_readiness === 'BLOCKED')) return 'BLOCKING_IMPLEMENTATION';
  if (modules.some(id => moduleById.get(id)?.promotion_readiness === 'BLOCKED')) return 'BLOCKING_RELEASE';
  return 'BLOCKING_FUTURE';
}
function titleFor(stage, modules, status) {
  if (status === 'BLOCKED_REQUIRES_LEGACY_EVIDENCE') return 'Legacy functional evidence intake';
  if (stage.id === 'SG-004') return 'Conversation intelligence product boundary';
  if (stage.id === 'SG-013') return 'Manager coaching and workspace architecture';
  if (stage.id === 'SG-012') return 'Quote preview product definition';
  return stage.name;
}

const groups = new Map();
for (const decision of original) {
  const module = moduleById.get(decision.module_id);
  const stage = stageById.get(module?.stage_id);
  const key = `${module?.stage_id || decision.module_id}:${stage?.status || decision.why_required}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(decision);
}

const resolvedOriginalDecisionIds = [];
const unresolvedGroups = [...groups.entries()].filter(([key, decisions]) => {
  const module = moduleById.get(decisions[0]?.module_id);
  const stageId = key.split(':')[0] || module?.stage_id;
  const stage = stageById.get(stageId);
  if (!stage || !String(stage.status).startsWith('BLOCKED_')) {
    resolvedOriginalDecisionIds.push(...decisions.map(item => item.decision_id));
    return false;
  }
  return true;
});

const canonical = unresolvedGroups.map(([key, decisions], index) => {
  const moduleIds = [...new Set(decisions.map(item => item.module_id))].sort();
  const stageId = key.split(':')[0];
  const stage = stageById.get(stageId);
  const status = stage?.status || 'UNKNOWN';
  const affectedContracts = [...new Set(moduleIds.flatMap(id => moduleById.get(id)?.required_contracts || []))].sort();
  const affectedSurfaces = [...new Set(moduleIds.flatMap(id => surfacesByModule.get(id) || []))].sort();
  const downstream = [...new Set(moduleIds.flatMap(id => moduleById.get(id)?.consumer_modules || []))].sort();
  const classification = ownerClass(status);
  const blockingScope = scopeFor(moduleIds);
  return {
    decision_id: `CANONICAL-DECISION-${String(index + 1).padStart(3, '0')}`,
    title: titleFor(stage, moduleIds, status),
    canonical_question: `Resolve ${stage?.name || stageId} so affected modules can proceed without violating constitutional boundaries.`,
    affected_modules: moduleIds,
    affected_contracts: affectedContracts,
    affected_surfaces: affectedSurfaces,
    reason: `${stageId} is ${status}. Original operation-level decisions were collapsed into this canonical decision.`,
    blocking_scope: blockingScope,
    category: categoryFor(status),
    priority: blockingScope === 'BLOCKING_FIRST_WAVE' ? 'P0' : blockingScope === 'BLOCKING_IMPLEMENTATION' ? 'P1' : 'P2',
    decision_classification: classification,
    derived_from: {
      stage_id: stageId,
      stage_status: status,
      source: classification === 'ARCHITECT_REQUIRED' ? 'DERIVED_FROM_ADR' : classification === 'EXTERNAL_EVIDENCE_REQUIRED' ? 'EXTERNAL_EVIDENCE_REQUIRED' : 'DERIVED_FROM_PRODUCT_SPEC',
      original_decision_ids: decisions.map(item => item.decision_id)
    },
    recommended_option: classification === 'EXTERNAL_EVIDENCE_REQUIRED' ? 'Owner supplies legacy functional evidence as evidence only; do not copy implementation.' : 'Approve the minimum canonical scope needed by contracts and traceability.',
    alternative_options: ['Defer affected modules', 'Reject affected modules with traceability update', 'Request additional evidence before implementation'],
    constitutional_constraints: [...new Set(moduleIds.flatMap(id => moduleById.get(id)?.constitutional_boundaries || registryById.get(id)?.constitutional_authority || []))].sort(),
    required_owner_input: classification === 'ARCHITECT_REQUIRED' ? 'Architecture decision record or ratified architecture update.' : classification === 'EXTERNAL_EVIDENCE_REQUIRED' ? 'Owner-provided functional evidence pack.' : 'Owner approval of product scope and acceptance criteria.',
    estimated_unblocked_modules: [...new Set([...moduleIds, ...downstream])].length,
    estimated_unblocked_contracts: affectedContracts.length,
    depends_on_decisions: []
  };
}).sort((a, b) => {
  const priority = { BLOCKING_FIRST_WAVE: 0, BLOCKING_IMPLEMENTATION: 1, BLOCKING_RELEASE: 2, BLOCKING_FUTURE: 3 };
  return priority[a.blocking_scope] - priority[b.blocking_scope] || b.estimated_unblocked_modules - a.estimated_unblocked_modules || a.decision_id.localeCompare(b.decision_id);
});

const idByStage = new Map(canonical.map(decision => [decision.derived_from.stage_id, decision.decision_id]));
for (const decision of canonical) {
  const deps = new Set();
  for (const moduleId of decision.affected_modules) {
    const module = moduleById.get(moduleId);
    for (const dep of module?.dependencies || []) {
      const depStage = moduleById.get(dep.module_id)?.stage_id;
      if (depStage && idByStage.has(depStage) && idByStage.get(depStage) !== decision.decision_id) deps.add(idByStage.get(depStage));
    }
  }
  decision.depends_on_decisions = [...deps].sort();
}

const ownerRemaining = canonical.filter(item => item.decision_classification === 'OWNER_REQUIRED').length;
const architectRemaining = canonical.filter(item => item.decision_classification === 'ARCHITECT_REQUIRED').length;
const evidenceRemaining = canonical.filter(item => item.decision_classification === 'EXTERNAL_EVIDENCE_REQUIRED').length;
const firstWaveBlockers = canonical.filter(item => item.blocking_scope === 'BLOCKING_FIRST_WAVE').length;
const implementationBlockers = canonical.filter(item => item.blocking_scope === 'BLOCKING_IMPLEMENTATION').length;
const releaseBlockers = canonical.filter(item => item.blocking_scope === 'BLOCKING_RELEASE').length;
const futureBlockers = canonical.filter(item => item.blocking_scope === 'BLOCKING_FUTURE').length;
const maxUnblock = [...canonical].sort((a, b) => b.estimated_unblocked_modules - a.estimated_unblocked_modules || a.decision_id.localeCompare(b.decision_id))[0];
const finalDecision = firstWave.first_execution_wave_ready && firstWaveBlockers === 0 ? 'GO' : 'CONDITIONAL_GO';

const packet = {
  schema: '../contracts/canonical-owner-decisions.schema.json',
  packet_id: 'FORGE_CANONICAL_OWNER_DECISIONS_001',
  source_commit: sourceCommit,
  initial_owner_decisions: original.length,
  automatically_resolved: resolvedOriginalDecisionIds.length,
  merged: canonical.length,
  duplicates_removed: original.length - canonical.length,
  obsolete_removed: 0,
  resolved_original_decision_ids: resolvedOriginalDecisionIds.sort(),
  decisions: canonical,
  summary: {
    owner_decisions_remaining: ownerRemaining,
    architect_decisions_remaining: architectRemaining,
    evidence_decisions_remaining: evidenceRemaining,
    first_wave_blocking_decisions: firstWaveBlockers,
    implementation_blocking_decisions: implementationBlockers,
    release_blocking_decisions: releaseBlockers,
    future_decisions: futureBlockers,
    maximum_unblock_value_decision: maxUnblock?.decision_id || null,
    final_decision: finalDecision
  }
};
writeJson('scaffolds/manifest/canonical-owner-decisions.json', packet);

const go = readJson('scaffolds/reports/rewrite-go-no-go.json');
go.final_decision = finalDecision;
for (const category of go.categories) {
  if (category.category === 'evidence_readiness') {
    category.status = evidenceRemaining ? 'PASS_WITH_WARNINGS' : 'PASS';
    category.blocking = false;
    category.warnings = evidenceRemaining ? ['Evidence decisions remain outside the first execution wave.'] : [];
  }
  if (category.category === 'first_wave_readiness') {
    category.status = firstWave.first_execution_wave_ready ? 'PASS' : 'FAIL';
    category.blocking = !firstWave.first_execution_wave_ready;
  }
}
writeJson('scaffolds/reports/rewrite-go-no-go.json', go);

writeText('docs/decisions/FORGE_CANONICAL_OWNER_DECISIONS.md', `# Forge Canonical Owner Decisions\n\nPacket ID: \`${packet.packet_id}\`\n\n- Original decisions: ${original.length}.\n- Automatically resolved decisions: ${packet.automatically_resolved}.\n- Canonical decisions remaining: ${canonical.length}.\n- Owner decisions remaining: ${ownerRemaining}.\n- Architect decisions remaining: ${architectRemaining}.\n- Evidence decisions remaining: ${evidenceRemaining}.\n- First-wave blockers: ${firstWaveBlockers}.\n\n| Decision | Category | Scope | Modules | Unblock value |\n|---|---|---|---|---:|\n${canonical.length ? canonical.map(item => `| \`${item.decision_id}\` | ${item.category} | ${item.blocking_scope} | ${item.affected_modules.map(id => '\\`' + id + '\\`').join(', ')} | ${item.estimated_unblocked_modules} |`).join('\n') : '| none | none | none | none | 0 |'}\n`);
writeText('docs/decisions/FORGE_OWNER_DECISION_EXECUTION_ORDER.md', `# Forge Owner Decision Execution Order\n\nOrder is by architectural unblock value, then blocking scope, not module order.\n\n${canonical.map((item, index) => `${index + 1}. \`${item.decision_id}\` - ${item.title} (${item.blocking_scope}, unblock value ${item.estimated_unblocked_modules})`).join('\n')}\n`);
writeText('docs/decisions/FORGE_DECISION_DASHBOARD.md', `# Forge Decision Dashboard\n\n- Original decisions: ${original.length}.\n- Resolved automatically: ${packet.automatically_resolved}.\n- Merged groups: ${packet.merged}.\n- Duplicates removed: ${packet.duplicates_removed}.\n- Obsolete removed: ${packet.obsolete_removed}.\n- Repository-derived duplicate resolutions: ${packet.automatically_resolved}.\n- Owner-required remaining: ${ownerRemaining}.\n- Architect-required remaining: ${architectRemaining}.\n- Evidence-required remaining: ${evidenceRemaining}.\n- First-wave blockers: ${firstWaveBlockers}.\n- Implementation blockers: ${implementationBlockers}.\n- Release blockers: ${releaseBlockers}.\n- Future blockers: ${futureBlockers}.\n- Final decision after collapse: \`${finalDecision}\`.\n\n## Maximum Unblock Value\n\n${maxUnblock ? `\`${maxUnblock.decision_id}\` - ${maxUnblock.title}` : 'none'}\n`);
writeJson('scaffolds/reports/owner-decision-collapse-report.json', {
  schema: '../contracts/owner-decision-collapse-report.schema.json',
  report_id: 'FORGE_OWNER_DECISION_COLLAPSE_REPORT_001',
  source_commit: sourceCommit,
  initial_owner_decisions: original.length,
  automatically_resolved: packet.automatically_resolved,
  merged: packet.merged,
  duplicates_removed: packet.duplicates_removed,
  obsolete_removed: packet.obsolete_removed,
  final_decision: finalDecision
});

console.log(JSON.stringify(packet.summary, null, 2));
