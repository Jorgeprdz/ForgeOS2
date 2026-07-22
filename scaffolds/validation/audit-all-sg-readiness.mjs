#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const manifestPath = 'scaffolds/manifest/rewrite-stages.json';
const sequencePath = 'scaffolds/manifest/canonical-rewrite-sequence.json';
const reportJsonPath = 'scaffolds/reports/all-sg-readiness-audit.json';
const reportTextPath = 'scaffolds/reports/all-sg-readiness-audit.txt';

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sequence = JSON.parse(fs.readFileSync(sequencePath, 'utf8')).sequence;
const stages = manifest.stages;
const sequenceById = new Map(sequence.map(stage => [stage.stage_id, stage]));
const issues = [];
const warnings = [];
const notes = [];
const generatedPathOwners = new Map();

function active(stage) {
  return stage.status === 'READY';
}

function evidencePath(file) {
  return /^scaffolds\/reports\/.+-evidence\.json$/.test(file);
}

function allowedByStage(stage, file) {
  return (stage.allowed_paths || []).some(prefix => file.startsWith(prefix));
}

function runnerPath(stage) {
  return `tools/termux/rewrite/generators/${stage.id}.sh`;
}

function bashRunnable(file) {
  if (!fs.existsSync(file)) return { exists: false, regular: false, readable: false, syntax_valid: false, runnable: false };
  const stat = fs.statSync(file);
  const regular = stat.isFile();
  let readable = false;
  try {
    fs.accessSync(file, fs.constants.R_OK);
    readable = true;
  } catch {
    readable = false;
  }
  const syntax = regular && readable
    ? spawnSync('bash', ['-n', file], { encoding: 'utf8' })
    : { status: 1, stderr: '' };
  return {
    exists: true,
    regular,
    readable,
    syntax_valid: syntax.status === 0,
    runnable: regular && readable && syntax.status === 0,
    syntax_error: syntax.status === 0 ? null : (syntax.stderr || '').trim()
  };
}

function issue(stage, code, detail) {
  issues.push({ stage_id: stage.id, code, detail });
}

function warning(stage, code, detail) {
  warnings.push({ stage_id: stage.id, code, detail });
}

function note(stage, code, detail) {
  notes.push({ stage_id: stage.id, code, detail });
}

const stageRows = stages
  .slice()
  .sort((a, b) => (a.canonical_order || 9999) - (b.canonical_order || 9999) || a.id.localeCompare(b.id))
  .map(stage => {
    const files = Array.isArray(stage.files_to_generate) ? stage.files_to_generate : [];
    const materialFiles = files.filter(file => !evidencePath(file));
    const evidenceFiles = files.filter(evidencePath);
    const needsRunner = active(stage) && files.length > 0;
    const runner = runnerPath(stage);
    const runnerCheck = bashRunnable(runner);
    const seq = sequenceById.get(stage.id);

    if (!seq) issue(stage, 'STAGE_MISSING_FROM_SEQUENCE', stage.id);
    if (stage.previous_stage_id === stage.id) {
      note(stage, 'SELF_PREVIOUS_STAGE_METADATA_ONLY', 'ignored for runtime; artifact DAG derives order from produces/consumes');
    }
    if (!active(stage) && files.length > 0) issue(stage, 'INACTIVE_STAGE_GENERATES_FILES', files.join(','));
    if (needsRunner && !runnerCheck.exists) issue(stage, 'RUNNER_NOT_FOUND', runner);
    if (needsRunner && runnerCheck.exists && !runnerCheck.regular) issue(stage, 'RUNNER_NOT_REGULAR_FILE', runner);
    if (needsRunner && runnerCheck.exists && !runnerCheck.readable) issue(stage, 'RUNNER_NOT_READABLE', runner);
    if (needsRunner && runnerCheck.exists && runnerCheck.readable && !runnerCheck.syntax_valid) issue(stage, 'RUNNER_SYNTAX_INVALID', runnerCheck.syntax_error || runner);
    if (active(stage) && (stage.produces || []).length > 0 && materialFiles.length === 0) issue(stage, 'NO_MATERIAL_FILES_FOR_PRODUCED_ARTIFACTS', `produces=${stage.produces.length}`);
    if (active(stage) && evidenceFiles.length !== 1) issue(stage, 'EVIDENCE_OUTPUT_COUNT_INVALID', `evidence_files=${evidenceFiles.length}`);

    for (const file of files) {
      if (!allowedByStage(stage, file)) issue(stage, 'GENERATED_PATH_NOT_ALLOWED', file);
      const owner = generatedPathOwners.get(file);
      if (owner && active(stage) && active(owner.stage)) {
        issue(stage, 'GENERATED_OUTPUT_COLLISION', `${file}:previous=${owner.stage.id}`);
      } else if (!owner) {
        generatedPathOwners.set(file, { stage });
      }
    }

    if ((stage.produces || []).length !== materialFiles.length) {
      note(stage, 'PRODUCES_FILE_COUNT_NOT_ONE_TO_ONE', `produces=${(stage.produces || []).length} material_files=${materialFiles.length}`);
    }
    if (!needsRunner && runnerCheck.exists) warning(stage, 'INACTIVE_OR_FILELESS_STAGE_HAS_RUNNER', runner);

    return {
      stage_id: stage.id,
      canonical_order: stage.canonical_order,
      artifact_wave: stage.artifact_wave,
      status: stage.status,
      produces_count: (stage.produces || []).length,
      consumes_count: (stage.consumes || []).length,
      material_file_count: materialFiles.length,
      evidence_declared: evidenceFiles.length > 0,
      runner_required: needsRunner,
      runner_path: runner,
      runner_exists: runnerCheck.exists,
      runner_regular: runnerCheck.regular,
      runner_readable: runnerCheck.readable,
      runner_syntax_valid: runnerCheck.syntax_valid,
      runner_bash_runnable: runnerCheck.runnable,
      executable_bit_required: false,
      previous_stage_id: stage.previous_stage_id ?? null
    };
  });

const report = {
  schema: 'FORGE_ALL_SG_READINESS_AUDIT_V2',
  runner_policy: 'Termux/Android shared storage may not preserve executable bits. Runners are valid when regular, readable and bash -n passes; runtime invokes bash <runner>.',
  manifest: manifestPath,
  stage_count: stages.length,
  issue_count: issues.length,
  warning_count: warnings.length,
  note_count: notes.length,
  stages: stageRows,
  issues,
  warnings,
  notes
};

fs.mkdirSync(path.dirname(reportJsonPath), { recursive: true });
fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`);

const lines = [];
lines.push('FORGE ALL SG READINESS AUDIT');
lines.push(`STAGES=${report.stage_count}`);
lines.push(`ISSUES=${report.issue_count}`);
lines.push(`WARNINGS=${report.warning_count}`);
lines.push(`NOTES=${report.note_count}`);
lines.push(`RUNNER_POLICY=${report.runner_policy}`);
lines.push('');
for (const row of stageRows) {
  lines.push(`${row.stage_id} order=${row.canonical_order} wave=${row.artifact_wave} status=${row.status} produces=${row.produces_count} material=${row.material_file_count} evidence=${row.evidence_declared ? 'YES' : 'NO'} runner=${row.runner_exists ? 'YES' : 'NO'} bash_runnable=${row.runner_bash_runnable ? 'YES' : 'NO'} executable_bit_required=NO`);
}
if (issues.length) {
  lines.push('');
  lines.push('ISSUES');
  for (const item of issues) lines.push(`ERROR stage=${item.stage_id} code=${item.code} detail=${item.detail}`);
}
if (warnings.length) {
  lines.push('');
  lines.push('WARNINGS');
  for (const item of warnings) lines.push(`WARNING stage=${item.stage_id} code=${item.code} detail=${item.detail}`);
}
if (notes.length) {
  lines.push('');
  lines.push('NOTES');
  for (const item of notes) lines.push(`NOTE stage=${item.stage_id} code=${item.code} detail=${item.detail}`);
}
fs.writeFileSync(reportTextPath, `${lines.join('\n')}\n`);

console.log(JSON.stringify({
  stages: report.stage_count,
  issues: report.issue_count,
  warnings: report.warning_count,
  notes: report.note_count
}, null, 2));

if (issues.length > 0) process.exit(1);
