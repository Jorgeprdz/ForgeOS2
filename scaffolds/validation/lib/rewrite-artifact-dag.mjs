import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

export const ACTIVE_STATUSES = new Set([
  'READY',
  'BLOCKED_REQUIRES_OWNER_DECISION',
  'BLOCKED_REQUIRES_PRODUCT_DEFINITION',
  'BLOCKED_REQUIRES_ARCHITECTURAL_DECISION',
  'BLOCKED_REQUIRES_LEGACY_EVIDENCE'
]);

const ARTIFACT_TYPE_RULES = [
  [/Decision|Contract|Model|Framework|Envelope|Taxonomy|Boundary|Scope|Eligibility|Calculation|Preview|ReadModel|Context/, 'contract'],
  [/Registry|Ownership|SourceOfTruth/, 'registry'],
  [/Policy|Guard|Denylist|Forbidden|Allowed/, 'policy'],
  [/Receipt/, 'receipt'],
  [/Evidence|Provenance|Claim/, 'evidence'],
  [/Manifest/, 'manifest']
];

const TERMINAL_ARTIFACT_REASONS = new Map([
  ['RejectedCapabilityDenylist', 'negative validation guard consumed by governance checks'],
  ['RejectedRuntimeAbsencePolicy', 'negative validation guard consumed by governance checks'],
  ['LegacyFunctionalEvidenceClassification', 'historical evidence intake consumed only after owner-supplied legacy evidence'],
  ['RecruitmentPrecontractLifecycleContract', 'deferred domain contract'],
  ['CompensationEconomicEvidenceContract', 'deferred domain contract'],
  ['AdvisorWorkspaceReadModel', 'terminal workspace surface contract'],
  ['ManagerWorkspaceReadModel', 'terminal workspace surface contract']
]);

const HISTORICAL_COMPATIBILITY = {
  'SG-001': [
    'ConstitutionalRuntimeConstraints',
    'RobocopGateContract',
    'BlockedStatePolicy'
  ],
  'SG-002': [
    'DecisionContractSkeleton',
    'ActionPlanContractSkeleton',
    'ReadOnlyAdapterContractSkeleton',
    'EvidenceEnvelope',
    'ClaimContract',
    'ProvenanceModel',
    'UnknownStatePolicy'
  ]
};

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

export function stableCompareStage(a, b, stageById, downstreamCount = new Map()) {
  const left = stageById.get(a);
  const right = stageById.get(b);
  return constitutionalPriority(right) - constitutionalPriority(left)
    || Number(Boolean(right?.critical_path_priority)) - Number(Boolean(left?.critical_path_priority))
    || (downstreamCount.get(b) || 0) - (downstreamCount.get(a) || 0)
    || (right?.stage_priority || 0) - (left?.stage_priority || 0)
    || a.localeCompare(b);
}

function constitutionalPriority(stage) {
  if (!stage) return 0;
  const refs = new Set([...(stage.constitutional_authority || []), ...(stage.boundaries || [])]);
  let score = 0;
  if (refs.has('CONSTITUTION_ARTICLE_0')) score += 100;
  if (refs.has('BOUND-ROBOCOP-GATE')) score += 50;
  if (refs.has('BOUND-EVIDENCE-OWNERSHIP')) score += 25;
  if (refs.has('BOUND-HUMAN-AUTHORITY')) score += 20;
  return score;
}

export function artifactType(artifactId) {
  for (const [pattern, type] of ARTIFACT_TYPE_RULES) if (pattern.test(artifactId)) return type;
  return 'contract';
}

function materializationFor(stage, artifactId) {
  const evidencePaths = Array.isArray(stage.evidence) ? stage.evidence : [];
  const generatedPaths = Array.isArray(stage.files_to_generate) ? stage.files_to_generate : [];
  const paths = [...new Set([...generatedPaths, ...evidencePaths])].filter(Boolean);
  const historical = HISTORICAL_COMPATIBILITY[stage.id]?.includes(artifactId);
  return {
    kind: historical ? 'historical_compatibility' : (paths.length ? 'file' : 'manifest_entry'),
    paths,
    validator: stage.validations?.[0] || null,
    required: true
  };
}

function artifactStatus(stage, artifactId) {
  if (HISTORICAL_COMPATIBILITY[stage.id]?.includes(artifactId)) return 'historical_compatibility';
  if (stage.status === 'READY') return 'planned';
  if (stage.status === 'COMPLETED') return 'validated';
  if (stage.status === 'REJECTED' || stage.status === 'DEFERRED') return 'planned';
  return 'planned';
}

function receiptTemplate(stage, artifactId) {
  return {
    artifact_id: artifactId,
    stage_id: stage.id,
    version: '1',
    materialized_at: 'GENERATED_AT_RUNTIME',
    evidence: materializationFor(stage, artifactId).paths,
    validators: stage.validations || [],
    validation_status: 'PENDING_RUNTIME_VALIDATION',
    content_hash: 'GENERATED_AT_RUNTIME',
    constitution_refs: stage.constitutional_authority || [],
    decision_refs: (stage.owner_decisions || []).map(decision => decision.id)
  };
}

function makeArtifact(stage, artifactId, consumerStages) {
  return {
    artifact: artifactId,
    artifact_id: artifactId,
    artifact_type: artifactType(artifactId),
    producer_stage: stage.id,
    produced_by: stage.id,
    consumer_stages: consumerStages,
    consumed_by: consumerStages,
    materialization: materializationFor(stage, artifactId),
    version: '1',
    status: artifactStatus(stage, artifactId),
    constitution_refs: stage.constitutional_authority || [],
    owner_decision_refs: (stage.owner_decisions || []).map(decision => decision.id),
    receipt_template: receiptTemplate(stage, artifactId)
  };
}

function validateStageShape(stages) {
  const errors = [];
  for (const stage of stages) {
    if (!stage.id) errors.push({ code: 'CONFIG_ERROR', message: 'stage missing id' });
    if ('depends_on_stages' in stage) errors.push({ code: 'GRAPH_ERROR', stage_id: stage.id, message: 'stage declares direct depends_on_stages' });
    if (!Array.isArray(stage.produces)) errors.push({ code: 'CONFIG_ERROR', stage_id: stage.id, message: 'stage missing produces array' });
    if (!Array.isArray(stage.consumes)) errors.push({ code: 'CONFIG_ERROR', stage_id: stage.id, message: 'stage missing consumes array' });
  }
  return errors;
}

export function deriveRewriteArtifactGraph(stages, options = {}) {
  const errors = validateStageShape(stages);
  const stageById = new Map(stages.map(stage => [stage.id, stage]));
  const producerByArtifact = new Map();
  const duplicateProducers = [];
  const authorizedDuplicateProducers = new Set(options.authorizedDuplicateProducers || []);

  for (const stage of stages) {
    for (const artifact of stage.produces || []) {
      if (producerByArtifact.has(artifact) && !authorizedDuplicateProducers.has(artifact)) {
        duplicateProducers.push({ artifact, producers: [producerByArtifact.get(artifact), stage.id] });
      }
      if (!producerByArtifact.has(artifact)) producerByArtifact.set(artifact, stage.id);
    }
  }

  const missingProducers = [];
  const edges = [];
  for (const stage of stages) {
    for (const artifact of stage.consumes || []) {
      const producer = producerByArtifact.get(artifact);
      if (!producer) {
        missingProducers.push({ stage_id: stage.id, artifact });
        continue;
      }
      if (producer !== stage.id) {
        edges.push({ from_stage: producer, to_stage: stage.id, artifact, required_for: ['SCAFFOLD', 'VALIDATE'] });
      }
    }
  }

  const downstreamCount = new Map(stages.map(stage => [stage.id, 0]));
  for (const edge of edges) downstreamCount.set(edge.from_stage, (downstreamCount.get(edge.from_stage) || 0) + 1);

  const stageIds = stages.map(stage => stage.id);
  const indegree = new Map(stageIds.map(id => [id, 0]));
  const outgoing = new Map(stageIds.map(id => [id, []]));
  for (const edge of edges) {
    indegree.set(edge.to_stage, indegree.get(edge.to_stage) + 1);
    outgoing.get(edge.from_stage).push(edge);
  }

  let ready = [...indegree.entries()]
    .filter(([, value]) => value === 0)
    .map(([id]) => id)
    .sort((a, b) => stableCompareStage(a, b, stageById, downstreamCount));
  const order = [];
  const waves = [];
  while (ready.length > 0) {
    const wave = ready;
    waves.push(wave);
    ready = [];
    for (const id of wave) {
      order.push(id);
      for (const edge of outgoing.get(id).sort((a, b) => stableCompareStage(a.to_stage, b.to_stage, stageById, downstreamCount) || a.artifact.localeCompare(b.artifact))) {
        indegree.set(edge.to_stage, indegree.get(edge.to_stage) - 1);
        if (indegree.get(edge.to_stage) === 0) ready.push(edge.to_stage);
      }
    }
    ready.sort((a, b) => stableCompareStage(a, b, stageById, downstreamCount));
  }

  const cycles = [...indegree.entries()].filter(([, value]) => value > 0).map(([id]) => id);
  const orderByStage = new Map(order.map((id, index) => [id, index + 1]));
  const waveByStage = new Map();
  for (const [index, wave] of waves.entries()) for (const id of wave) waveByStage.set(id, index + 1);

  const artifactConsumers = new Map();
  for (const edge of edges) {
    if (!artifactConsumers.has(edge.artifact)) artifactConsumers.set(edge.artifact, []);
    artifactConsumers.get(edge.artifact).push(edge.to_stage);
  }

  const artifactRecords = [...producerByArtifact.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([artifactId, producerStage]) => {
      const stage = stageById.get(producerStage);
      const consumers = [...new Set(artifactConsumers.get(artifactId) || [])]
        .sort((a, b) => (orderByStage.get(a) || 9999) - (orderByStage.get(b) || 9999) || a.localeCompare(b));
      return makeArtifact(stage, artifactId, consumers);
    });

  const terminalArtifacts = artifactRecords
    .filter(artifact => artifact.consumer_stages.length === 0)
    .map(artifact => ({
      artifact: artifact.artifact_id,
      producer_stage: artifact.producer_stage,
      reason: TERMINAL_ARTIFACT_REASONS.get(artifact.artifact_id) || 'terminal stage output or externally consumed contract'
    }))
    .sort((a, b) => a.artifact.localeCompare(b.artifact));

  return {
    errors,
    stageById,
    order,
    waves,
    edges,
    cycles,
    duplicateProducers,
    missingProducers,
    orderByStage,
    waveByStage,
    artifactRecords,
    terminalArtifacts,
    downstreamCount
  };
}

export function materializedArtifactIds(root = process.cwd(), stateRoot = '.forge/rewrite') {
  const ids = new Set();
  const stateFile = `${root}/${stateRoot}/state.json`;
  if (fs.existsSync(stateFile)) {
    try {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      if (Array.isArray(state.completed_stages) && state.completed_stages.includes('SG-001') && state.validation_status === 'PASS') {
        for (const artifact of HISTORICAL_COMPATIBILITY['SG-001']) ids.add(artifact);
      }
      if (Array.isArray(state.completed_stages) && state.completed_stages.includes('SG-002') && state.validation_status === 'PASS') {
        for (const artifact of HISTORICAL_COMPATIBILITY['SG-002']) ids.add(artifact);
      }
    } catch {
      return ids;
    }
  }
  return ids;
}

export function verifyHistoricalCompatibility(root = process.cwd()) {
  const checks = [
    { stage_id: 'SG-001', artifact_ids: HISTORICAL_COMPATIBILITY['SG-001'], required_paths: ['scaffolds/reports/SG-001-evidence.json'] },
    {
      stage_id: 'SG-002',
      artifact_ids: HISTORICAL_COMPATIBILITY['SG-002'],
      required_paths: [
        'scaffolds/reports/SG-002-evidence.json',
        'platform/core/generated/decision-contract.mjs',
        'platform/actions/generated/action-contract.mjs',
        'platform/read-models/generated/read-only-adapter-contract.mjs'
      ]
    }
  ];
  return checks.map(check => {
    const missing_paths = check.required_paths.filter(file => !fs.existsSync(`${root}/${file}`));
    const content_hashes = Object.fromEntries(check.required_paths
      .filter(file => fs.existsSync(`${root}/${file}`))
      .map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(`${root}/${file}`)).digest('hex')]));
    return {
      ...check,
      status: missing_paths.length === 0 ? 'PASS' : 'FAIL',
      missing_paths,
      content_hashes
    };
  });
}

export function validateDerivedGraph(stages, graph) {
  const derived = deriveRewriteArtifactGraph(stages);
  const failures = [...derived.errors];
  if (derived.duplicateProducers.length > 0) failures.push({ code: 'GRAPH_ERROR', message: 'duplicate artifact producers', detail: derived.duplicateProducers });
  if (derived.missingProducers.length > 0) failures.push({ code: 'ARTIFACT_MISSING', message: 'missing artifact producers', detail: derived.missingProducers });
  if (derived.cycles.length > 0) failures.push({ code: 'GRAPH_ERROR', message: 'artifact DAG contains cycles', detail: derived.cycles });
  if (JSON.stringify(derived.order) !== JSON.stringify(graph.topological_order)) failures.push({ code: 'GRAPH_ERROR', message: 'topological order is not deterministic or not regenerated' });
  return { failures, derived };
}
