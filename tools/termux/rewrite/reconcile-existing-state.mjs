#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const apply = process.argv.includes('--apply');
const dryRun = process.argv.includes('--dry-run') || !apply;

const root = process.cwd();
const stateRoot = path.resolve(
  process.env.FORGE_REWRITE_STATE_ROOT ||
  path.join(root, '.forge/rewrite')
);

const manifestPath = path.join(
  root,
  'scaffolds/manifest/rewrite-stages.json'
);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const stages = Array.isArray(manifest) ? manifest : manifest.stages;

if (!Array.isArray(stages)) {
  throw new Error('RECONCILE_INVALID_STAGE_MANIFEST');
}

const sha256 = filePath =>
  crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex');

const writeJsonAtomic = (target, value) => {
  fs.mkdirSync(path.dirname(target), {recursive: true});

  const temporary =
    `${target}.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;

  fs.writeFileSync(
    temporary,
    JSON.stringify(value, null, 2) + '\n'
  );

  fs.renameSync(temporary, target);
};

const result = [];
const acceptedStages = [];
const acceptedFiles = [];
const receipts = [];

for (const stage of [...stages].sort((a, b) =>
  (a.canonical_order ?? 9999) - (b.canonical_order ?? 9999)
)) {
  const stageId = stage.id || stage.stage_id || stage.stage;
  const outputs = Array.isArray(stage.files_to_generate)
    ? stage.files_to_generate
    : [];

  const material = outputs.filter(
    item => !/^scaffolds\/reports\/.*-evidence\.json$/.test(item)
  );

  const produces = Array.isArray(stage.produces)
    ? stage.produces
    : [];

  const evidenceRelative =
    (Array.isArray(stage.evidence) && stage.evidence[0]) ||
    outputs.find(item =>
      /^scaffolds\/reports\/.*-evidence\.json$/.test(item)
    ) ||
    `scaffolds/reports/${stageId}-evidence.json`;

  const evidencePath = path.join(root, evidenceRelative);
  const reasons = [];

  if (!fs.existsSync(evidencePath)) {
    reasons.push('EVIDENCE_MISSING');
  }

  let evidence = null;

  if (reasons.length === 0) {
    try {
      evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    } catch {
      reasons.push('EVIDENCE_INVALID_JSON');
    }
  }

  if (evidence && evidence.status !== 'PASS') {
    reasons.push(`EVIDENCE_STATUS_${evidence.status || 'UNKNOWN'}`);
  }

  if (produces.length !== material.length) {
    reasons.push(
      `MAPPING_MISMATCH_PRODUCES_${produces.length}_MATERIAL_${material.length}`
    );
  }

  const stageReceipts = [];

  if (evidence && reasons.length === 0) {
    for (let index = 0; index < material.length; index += 1) {
      const relativePath = material[index];
      const absolutePath = path.join(root, relativePath);
      const artifactId = produces[index];

      if (!fs.existsSync(absolutePath)) {
        reasons.push(`MATERIAL_MISSING:${relativePath}`);
        continue;
      }

      const expectedHash = evidence.hashes?.[relativePath];

      if (!expectedHash) {
        reasons.push(`EVIDENCE_HASH_MISSING:${relativePath}`);
        continue;
      }

      const actualHash = sha256(absolutePath);

      if (actualHash !== expectedHash) {
        reasons.push(`HASH_MISMATCH:${relativePath}`);
        continue;
      }

      if (relativePath.endsWith('.json')) {
        try {
          const artifact = JSON.parse(
            fs.readFileSync(absolutePath, 'utf8')
          );

          if (
            artifact.artifact_id &&
            artifact.artifact_id !== artifactId
          ) {
            reasons.push(
              `ARTIFACT_ID_MISMATCH:${relativePath}:` +
              `expected=${artifactId}:actual=${artifact.artifact_id}`
            );
            continue;
          }
        } catch {
          reasons.push(`MATERIAL_INVALID_JSON:${relativePath}`);
          continue;
        }
      }

      stageReceipts.push({
        artifact_id: artifactId,
        producer_stage: stageId,
        materialized_path: relativePath,
        sha256: actualHash,
        evidence_path: evidenceRelative,
        validation_status: 'PASS',
        validated_at: evidence.generated_at
      });
    }
  }

  const accepted =
    reasons.length === 0 &&
    stageReceipts.length === produces.length;

  result.push({
    stage_id: stageId,
    accepted,
    artifacts: stageReceipts.length,
    reasons
  });

  if (accepted) {
    acceptedStages.push(stageId);
    acceptedFiles.push(...material);
    receipts.push(...stageReceipts);
  }
}

for (const item of result) {
  console.log(
    `RECONCILE_STAGE=${item.stage_id} ` +
    `DECISION=${item.accepted ? 'ACCEPT' : 'REJECT'} ` +
    `ARTIFACTS=${item.artifacts}`
  );

  for (const reason of item.reasons) {
    console.log(
      `RECONCILE_REASON stage=${item.stage_id} reason=${reason}`
    );
  }
}

console.log(`RECONCILE_ACCEPTED_STAGES=${acceptedStages.join(',') || 'none'}`);
console.log(`RECONCILE_RECEIPTS=${receipts.length}`);
console.log(`RECONCILE_MODE=${dryRun ? 'DRY_RUN' : 'APPLY'}`);

if (apply) {
  const receiptRoot = path.join(stateRoot, 'artifact-receipts');
  fs.mkdirSync(receiptRoot, {recursive: true});

  for (const receipt of receipts) {
    writeJsonAtomic(
      path.join(receiptRoot, `${receipt.artifact_id}.json`),
      receipt
    );
  }

  const statePath = path.join(stateRoot, 'state.json');
  let existing = {
    current_stage: null,
    completed_stages: [],
    applied_files: [],
    validation_status: 'PASS'
  };

  if (fs.existsSync(statePath)) {
    existing = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  }

  const completed = new Set([
    ...(Array.isArray(existing.completed_stages)
      ? existing.completed_stages
      : []),
    ...acceptedStages
  ]);

  const files = new Set([
    ...(Array.isArray(existing.applied_files)
      ? existing.applied_files
      : []),
    ...acceptedFiles
  ]);

  const nextState = {
    ...existing,
    current_stage: existing.current_stage ?? null,
    completed_stages: [...completed],
    applied_files: [...files],
    validation_status: 'PASS'
  };

  writeJsonAtomic(statePath, nextState);

  console.log(`RECONCILE_STATE_PATH=${statePath}`);
  console.log('RECONCILE_APPLY=PASS');
}
