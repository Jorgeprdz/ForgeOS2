#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);
const root = path.resolve(scriptDir, '..', '..');
const functionalAutopilot = path.join(scriptDir, 'autopilot.mjs');
const functionalPolicyPath = path.join(scriptDir, 'policy.json');
const globalPolicyPath = path.join(scriptDir, 'global-policy.json');
const actionsPath = path.join(scriptDir, 'module-actions.json');
const manifestPath = path.join(root, 'forge', 'modules.json');
const globalStateRoot = path.join(root, '.forge21', 'autopilot', 'global');
const latestFunctionalAuditPath = path.join(root, '.forge21', 'autopilot', 'reports', 'latest.json');

class GlobalAutopilotError extends Error {
  constructor(code, detail = '') {
    super(detail ? `${code}:${detail}` : code);
    this.name = 'GlobalAutopilotError';
    this.code = code;
    this.detail = detail;
  }
}

function normalizeRelative(value) {
  return value.split(path.sep).join('/').replace(/^\.\//, '');
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new GlobalAutopilotError(
      'INVALID_JSON',
      `${normalizeRelative(path.relative(root, file))}:${error.message}`
    );
  }
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

function writeTextAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, value);
  fs.renameSync(temporary, file);
}

function timestamp() {
  return new Date().toISOString().replaceAll(/[:.]/g, '-');
}

function command(commandName, args, options = {}) {
  const result = spawnSync(commandName, args, {
    cwd: options.cwd ?? os.homedir(),
    env: { ...process.env, ...(options.env ?? {}) },
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe']
  });

  if (result.error) {
    throw new GlobalAutopilotError(
      'COMMAND_ERROR',
      `${options.label ?? commandName}:${result.error.message}`
    );
  }

  if (result.status !== 0 && !options.allowFailure) {
    throw new GlobalAutopilotError(
      'COMMAND_FAILED',
      `${options.label ?? commandName}:status=${result.status}:${(result.stderr || result.stdout || '').trim()}`
    );
  }

  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  };
}

function runStrict(commandText, label, options = {}) {
  console.log(`\n=== ${label} ===`);
  console.log(`COMMAND=${commandText}`);

  return command(
    'bash',
    ['-lc', `set -Eeuo pipefail\ncd ${shellQuote(root)}\n${commandText}`],
    {
      ...options,
      cwd: os.homedir(),
      label
    }
  );
}

function git(args, options = {}) {
  return command('git', ['-C', root, ...args], {
    ...options,
    cwd: os.homedir(),
    label: `git ${args.join(' ')}`
  });
}

function currentHead() {
  return git(['rev-parse', 'HEAD']).stdout.trim();
}

function currentBranch() {
  const result = git(
    ['symbolic-ref', '--quiet', '--short', 'HEAD'],
    { allowFailure: true }
  );
  const branch = result.stdout.trim();

  if (result.status !== 0 || !branch) {
    throw new GlobalAutopilotError('DETACHED_HEAD');
  }

  return branch;
}

function statusPaths() {
  const result = git([
    'status',
    '--porcelain=v1',
    '-z',
    '--untracked-files=all'
  ]);

  return result.stdout
    .split('\0')
    .filter(Boolean)
    .map(record => normalizeRelative(record.slice(3)));
}

function ensureCleanWorktree() {
  const dirty = statusPaths();
  if (dirty.length > 0) {
    throw new GlobalAutopilotError(
      'WORKTREE_NOT_CLEAN',
      dirty.join(',')
    );
  }
}

function parseArgs(argv) {
  const positional = [];
  const flags = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }

    const equal = value.indexOf('=');

    if (equal >= 0) {
      flags.set(value.slice(2, equal), value.slice(equal + 1));
      continue;
    }

    const name = value.slice(2);
    const next = argv[index + 1];

    if (next && !next.startsWith('--')) {
      flags.set(name, next);
      index += 1;
    } else {
      flags.set(name, true);
    }
  }

  return { positional, flags };
}

function positiveInteger(value, fallback, name) {
  if (value === undefined || value === null) return fallback;
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new GlobalAutopilotError(
      'INVALID_POSITIVE_INTEGER',
      `${name}:${value}`
    );
  }

  return parsed;
}

function loadInputs() {
  const required = [
    functionalAutopilot,
    functionalPolicyPath,
    globalPolicyPath,
    actionsPath,
    manifestPath
  ];

  for (const file of required) {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      throw new GlobalAutopilotError(
        'REQUIRED_FILE_MISSING',
        normalizeRelative(path.relative(root, file))
      );
    }
  }

  const functionalPolicy = readJson(functionalPolicyPath);
  const globalPolicy = readJson(globalPolicyPath);
  const actions = readJson(actionsPath);
  const manifest = readJson(manifestPath);

  if (globalPolicy.schemaVersion !== 1) {
    throw new GlobalAutopilotError(
      'GLOBAL_POLICY_SCHEMA_UNSUPPORTED',
      String(globalPolicy.schemaVersion)
    );
  }

  return {
    functionalPolicy,
    globalPolicy,
    actions,
    manifest
  };
}

function runFunctionalAudit(options = {}) {
  const result = command(
    process.execPath,
    [functionalAutopilot, 'audit'],
    {
      cwd: os.homedir(),
      inherit: options.inherit === true,
      label: 'FUNCTIONAL_AUTOPILOT_AUDIT'
    }
  );

  if (
    !fs.existsSync(latestFunctionalAuditPath)
    || !fs.statSync(latestFunctionalAuditPath).isFile()
  ) {
    throw new GlobalAutopilotError(
      'FUNCTIONAL_AUDIT_REPORT_MISSING',
      normalizeRelative(
        path.relative(root, latestFunctionalAuditPath)
      )
    );
  }

  return {
    audit: readJson(latestFunctionalAuditPath),
    output: result.stdout
  };
}

function configuredString(value) {
  return typeof value === 'string'
    && value.trim().length > 0;
}

export function actionReadiness(
  moduleEvaluation,
  action,
  globalPolicy
) {
  const missing = [];

  if (!configuredString(action?.implementationCommand)) {
    missing.push('IMPLEMENTATION_COMMAND_REQUIRED');
  }

  if (
    !Array.isArray(action?.changedPaths)
    || action.changedPaths.length === 0
  ) {
    missing.push('CHANGED_PATH_ALLOWLIST_REQUIRED');
  }

  if (
    ['runtime', 'integrations', 'productE2E']
      .includes(moduleEvaluation.area)
    && !configuredString(action?.functionalTestCommand)
  ) {
    missing.push('FUNCTIONAL_TEST_COMMAND_REQUIRED');
  }

  if (
    moduleEvaluation.area === 'runtime'
    && (
      !Array.isArray(action?.consumerTestPaths)
      || action.consumerTestPaths.length === 0
    )
  ) {
    missing.push('CONSUMER_TEST_PATH_REQUIRED');
  }

  if (
    ['integrations', 'productE2E']
      .includes(moduleEvaluation.area)
  ) {
    if (!action?.evidence || typeof action.evidence !== 'object') {
      missing.push('ACTION_EVIDENCE_REQUIRED');
    } else {
      const requiredChecks =
        globalPolicy.actionEvidenceChecks?.[
          moduleEvaluation.area
        ] ?? [];

      for (const check of requiredChecks) {
        if (action.evidence.checks?.[check] !== true) {
          missing.push(`ACTION_EVIDENCE_CHECK_REQUIRED:${check}`);
        }
      }

      if (
        !Array.isArray(action.evidence.artifactPaths)
        || action.evidence.artifactPaths.length === 0
      ) {
        missing.push('ACTION_EVIDENCE_ARTIFACTS_REQUIRED');
      }
    }
  }

  return {
    ready: missing.length === 0,
    missing
  };
}

export function scaffoldRefreshEligible(moduleEvaluation) {
  if (moduleEvaluation.area !== 'scaffolds') return false;

  const reasons = moduleEvaluation.reasons ?? [];

  if (reasons.length === 0) return false;

  const receiptOnly = reasons.every(reason =>
    /^(RECEIPT_|MISSING_FILE:\.forge21\/receipts\/)/.test(reason)
  );

  return receiptOnly
    && moduleEvaluation.tests?.negativePath === true
    && Number(moduleEvaluation.tests?.assertionCount ?? 0) >= 2
    && Number(moduleEvaluation.tests?.lines ?? 0) >= 25
    && moduleEvaluation.tests?.scaffoldOperation === true;
}

function sortCandidates(left, right) {
  return Number(right.priority ?? 0)
    - Number(left.priority ?? 0)
    || Number(right.structuralPass)
      - Number(left.structuralPass)
    || left.id.localeCompare(right.id);
}

function dependencyFirst(
  candidate,
  moduleById,
  trail = []
) {
  if (trail.includes(candidate.id)) {
    return {
      error: `DEPENDENCY_CYCLE:${[
        ...trail,
        candidate.id
      ].join('>')}`
    };
  }

  for (const dependencyId of candidate.dependencies ?? []) {
    const dependency = moduleById.get(dependencyId);

    if (!dependency) {
      return {
        error:
          `UNKNOWN_DEPENDENCY:${candidate.id}:${dependencyId}`
      };
    }

    if (!dependency.functionalPass) {
      const nested = dependencyFirst(
        dependency,
        moduleById,
        [...trail, candidate.id]
      );

      if (nested.error || nested.module) return nested;

      return { module: dependency };
    }
  }

  return { module: candidate };
}

function areaOrder(
  functionalPolicy,
  globalPolicy,
  selectedAreas
) {
  const configured =
    globalPolicy.campaignPriority
    ?? functionalPolicy.priorityOrder
    ?? [
      'runtime',
      'integrations',
      'productE2E',
      'scaffolds',
      'architecture'
    ];

  if (!selectedAreas || selectedAreas.length === 0) {
    return [...configured];
  }

  const selected = new Set(selectedAreas);
  return configured.filter(area => selected.has(area));
}

export function buildGlobalPlan({
  audit,
  manifest,
  actions,
  functionalPolicy,
  globalPolicy,
  selectedAreas = []
}) {
  const modules = audit.modules ?? [];
  const moduleById = new Map(
    modules.map(module => [module.id, module])
  );
  const areaById = new Map(
    (audit.areas ?? []).map(area => [area.area, area])
  );
  const manifestIds = new Set(
    (manifest.modules ?? []).map(record => record.id)
  );

  for (const module of modules) {
    if (!manifestIds.has(module.id)) {
      return {
        status: 'BLOCKED',
        runnable: false,
        actionType: 'MANIFEST_AUDIT_BLOCK',
        moduleId: module.id,
        area: module.area,
        reason: 'AUDIT_MODULE_NOT_IN_MANIFEST',
        blockers: [module.id]
      };
    }
  }

  for (const area of areaOrder(
    functionalPolicy,
    globalPolicy,
    selectedAreas
  )) {
    if (area === 'architecture') {
      const failedChecks =
        audit.architecture?.checks
          ?.filter(check => !check.pass)
          .map(check => `${check.id}:${check.detail}`)
        ?? [];

      if (failedChecks.length > 0) {
        return {
          status: 'BLOCKED',
          runnable: false,
          actionType: 'REPAIR_ARCHITECTURE',
          moduleId: null,
          area,
          reason: 'ARCHITECTURE_CHECKS_FAILED',
          blockers: failedChecks
        };
      }

      continue;
    }

    const areaSummary = areaById.get(area);

    if (
      globalPolicy.requiredCapabilityAreas?.includes(area)
      && Number(areaSummary?.denominator ?? 0) === 0
    ) {
      return {
        status: 'BLOCKED',
        runnable: false,
        actionType: 'DECLARE_MODULE',
        moduleId: null,
        area,
        reason:
          'REQUIRED_CAPABILITY_AREA_HAS_NO_DECLARED_MODULES',
        blockers: [
          `DECLARE_FIRST_${area.toUpperCase()}_MODULE`
        ]
      };
    }

    const candidates = modules
      .filter(module =>
        module.area === area
        && !module.functionalPass
      )
      .sort(sortCandidates);

    if (candidates.length === 0) continue;

    const dependencySelection = dependencyFirst(
      candidates[0],
      moduleById
    );

    if (dependencySelection.error) {
      return {
        status: 'BLOCKED',
        runnable: false,
        actionType: 'REPAIR_DEPENDENCY_GRAPH',
        moduleId: candidates[0].id,
        area,
        reason: 'DEPENDENCY_GRAPH_INVALID',
        blockers: [dependencySelection.error]
      };
    }

    const selected =
      dependencySelection.module ?? candidates[0];

    if (selected.area === 'scaffolds') {
      if (scaffoldRefreshEligible(selected)) {
        return {
          status: 'READY',
          runnable: true,
          actionType: 'REFRESH_SCAFFOLD_RECEIPT',
          moduleId: selected.id,
          area: selected.area,
          reason: 'SCAFFOLD_FUNCTIONAL_TESTS_PASS_RECEIPT_STALE',
          blockers: selected.reasons ?? []
        };
      }

      return {
        status: 'BLOCKED',
        runnable: false,
        actionType: 'CONFIGURE_SCAFFOLD_IMPLEMENTATION',
        moduleId: selected.id,
        area: selected.area,
        reason: 'SCAFFOLD_REQUIRES_REAL_IMPLEMENTATION_WORK',
        blockers: selected.reasons ?? []
      };
    }

    const readiness = actionReadiness(
      selected,
      actions.modules?.[selected.id],
      globalPolicy
    );

    if (!readiness.ready) {
      return {
        status: 'BLOCKED',
        runnable: false,
        actionType: 'CONFIGURE_MODULE_ACTION',
        moduleId: selected.id,
        area: selected.area,
        reason: 'MODULE_ACTION_NOT_RUNNABLE',
        blockers: readiness.missing
      };
    }

    return {
      status: 'READY',
      runnable: true,
      actionType: 'RUN_MODULE_AUTOPILOT',
      moduleId: selected.id,
      area: selected.area,
      reason: selected.falseGreen
        ? 'FALSE_GREEN_REQUIRES_FUNCTIONAL_MATERIALIZATION'
        : 'FUNCTIONAL_MODULE_INCOMPLETE',
      blockers: selected.reasons ?? []
    };
  }

  return {
    status: 'COMPLETE',
    runnable: false,
    actionType: 'NONE',
    moduleId: null,
    area: null,
    reason: 'SELECTED_GLOBAL_TARGETS_COMPLETE',
    blockers: []
  };
}

function parseSelectedAreas(flags) {
  const raw = flags.get('areas');
  if (!raw) return [];

  const areas = String(raw)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  const allowed = new Set([
    'runtime',
    'integrations',
    'productE2E',
    'scaffolds',
    'architecture'
  ]);

  for (const area of areas) {
    if (!allowed.has(area)) {
      throw new GlobalAutopilotError(
        'UNKNOWN_AREA',
        area
      );
    }
  }

  return [...new Set(areas)];
}

function buildCurrentPlan(
  inputs,
  options = {}
) {
  const result = runFunctionalAudit({
    inherit: options.inheritAudit === true
  });

  const plan = buildGlobalPlan({
    audit: result.audit,
    manifest: inputs.manifest,
    actions: inputs.actions,
    functionalPolicy: inputs.functionalPolicy,
    globalPolicy: inputs.globalPolicy,
    selectedAreas: options.selectedAreas ?? []
  });

  return {
    audit: result.audit,
    plan,
    auditOutput: result.output
  };
}

function printPlan(plan, audit = null) {
  console.log('============================================================');
  console.log('FORGE OS V2 — GLOBAL AUTOPILOT PLAN');
  console.log('============================================================');
  console.log(`GLOBAL_PLAN_STATUS=${plan.status}`);
  console.log(`GLOBAL_ACTION_TYPE=${plan.actionType}`);
  console.log(`NEXT_MODULE=${plan.moduleId ?? 'NONE'}`);
  console.log(`NEXT_AREA=${plan.area ?? 'NONE'}`);
  console.log(`NEXT_REASON=${plan.reason}`);
  console.log(`RUNNABLE=${plan.runnable ? 'YES' : 'NO'}`);

  for (const blocker of plan.blockers ?? []) {
    console.log(`BLOCKER=${blocker}`);
  }

  if (audit) {
    console.log(
      `GLOBAL_FUNCTIONAL_REAL=${
        audit.globalFunctionalPercent.toFixed(1)
      }%`
    );
    console.log(
      `GLOBAL_STRUCTURAL=${
        audit.globalStructuralPercent.toFixed(1)
      }%`
    );
    console.log(
      `FALSE_GREEN_COUNT=${
        audit.falseGreens?.length ?? 0
      }`
    );
  }
}

function acquireLock() {
  const lockDirectory = path.join(
    globalStateRoot,
    'lock'
  );

  fs.mkdirSync(globalStateRoot, { recursive: true });

  try {
    fs.mkdirSync(lockDirectory);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;

    const ownerFile = path.join(
      lockDirectory,
      'owner.json'
    );
    const owner = fs.existsSync(ownerFile)
      ? readJson(ownerFile)
      : {};

    if (Number.isInteger(owner.pid)) {
      try {
        process.kill(owner.pid, 0);
        throw new GlobalAutopilotError(
          'GLOBAL_AUTOPILOT_ALREADY_RUNNING',
          `pid=${owner.pid};runId=${owner.runId ?? 'unknown'}`
        );
      } catch (signalError) {
        if (
          signalError instanceof GlobalAutopilotError
        ) {
          throw signalError;
        }

        if (signalError.code !== 'ESRCH') {
          throw signalError;
        }
      }
    }

    fs.rmSync(lockDirectory, {
      recursive: true,
      force: true
    });
    fs.mkdirSync(lockDirectory);
  }

  const runId =
    `GLOBAL-${timestamp()}-${process.pid}`;

  writeJsonAtomic(
    path.join(lockDirectory, 'owner.json'),
    {
      schemaVersion: 1,
      runId,
      pid: process.pid,
      host: os.hostname(),
      acquiredAt: new Date().toISOString(),
      branch: currentBranch(),
      head: currentHead()
    }
  );

  return {
    runId,
    release() {
      fs.rmSync(lockDirectory, {
        recursive: true,
        force: true
      });
    }
  };
}

function campaignMarkdown(campaign) {
  const lines = [
    '# Forge OS V2 — Global Autopilot Campaign',
    '',
    `- Run ID: \`${campaign.runId}\``,
    `- Status: **${campaign.status}**`,
    `- Branch: \`${campaign.branch}\``,
    `- Started: ${campaign.startedAt}`,
    `- Updated: ${campaign.updatedAt}`,
    `- Initial HEAD: \`${campaign.initialHead}\``,
    `- Current HEAD: \`${campaign.currentHead}\``,
    `- Completed actions: ${campaign.completedActions.length}`,
    ''
  ];

  if (campaign.parentRunId) {
    lines.push(
      `- Resumed from: \`${campaign.parentRunId}\``,
      ''
    );
  }

  lines.push('## Completed actions', '');

  if (campaign.completedActions.length === 0) {
    lines.push('None.');
  }

  for (const item of campaign.completedActions) {
    lines.push(
      `- ${item.actionType} \`${item.moduleId}\`: `
      + `\`${item.headBefore}\` → \`${item.headAfter}\``
    );
  }

  lines.push('', '## Current plan', '');
  lines.push(`- Status: ${campaign.currentPlan.status}`);
  lines.push(
    `- Action: ${campaign.currentPlan.actionType}`
  );
  lines.push(
    `- Module: ${campaign.currentPlan.moduleId ?? 'NONE'}`
  );
  lines.push(
    `- Area: ${campaign.currentPlan.area ?? 'NONE'}`
  );
  lines.push(`- Reason: ${campaign.currentPlan.reason}`);

  for (const blocker of campaign.currentPlan.blockers ?? []) {
    lines.push(`- Blocker: ${blocker}`);
  }

  return `${lines.join('\n')}\n`;
}

function persistCampaign(campaign) {
  const runs = path.join(globalStateRoot, 'runs');
  const runJson = path.join(
    runs,
    `${campaign.runId}.json`
  );
  const runMarkdown = path.join(
    runs,
    `${campaign.runId}.md`
  );

  writeJsonAtomic(runJson, campaign);
  writeTextAtomic(
    runMarkdown,
    campaignMarkdown(campaign)
  );
  writeJsonAtomic(
    path.join(globalStateRoot, 'latest.json'),
    campaign
  );
  writeTextAtomic(
    path.join(globalStateRoot, 'latest.md'),
    campaignMarkdown(campaign)
  );

  console.log(
    `GLOBAL_CAMPAIGN_JSON=${
      normalizeRelative(path.relative(root, runJson))
    }`
  );
  console.log(
    `GLOBAL_CAMPAIGN_MD=${
      normalizeRelative(path.relative(root, runMarkdown))
    }`
  );
}

function verifyBranch(expected) {
  const current = currentBranch();
  if (current !== expected) {
    throw new GlobalAutopilotError(
      'BRANCH_CHANGED_DURING_CAMPAIGN',
      `expected=${expected};actual=${current}`
    );
  }
}

function moduleFromAudit(audit, moduleId) {
  return audit.modules?.find(
    module => module.id === moduleId
  );
}

function stageCommitPush(
  changedPaths,
  message,
  branch
) {
  const expected = [...new Set(changedPaths)].sort();

  runStrict(
    `git add -- ${
      expected.map(shellQuote).join(' ')
    }`,
    'STAGE_EXACT_CHANGED_PATHS'
  );

  const staged = git([
    'diff',
    '--cached',
    '--name-only',
    '-z'
  ]).stdout
    .split('\0')
    .filter(Boolean)
    .map(normalizeRelative)
    .sort();

  if (
    JSON.stringify(staged)
    !== JSON.stringify(expected)
  ) {
    runStrict('git reset', 'UNSTAGE_MISMATCH');
    throw new GlobalAutopilotError(
      'STAGED_PATH_MISMATCH',
      `expected=${expected.join(',')};actual=${staged.join(',')}`
    );
  }

  runStrict(
    'git diff --cached --check',
    'STAGED_DIFF_CHECK'
  );
  runStrict(
    `git push --dry-run origin HEAD:${shellQuote(branch)}`,
    'PUSH_DRY_RUN'
  );

  const parent = currentHead();

  runStrict(
    `git commit -m ${shellQuote(message)}`,
    'COMMIT'
  );

  const commit = currentHead();

  try {
    runStrict(
      `git push origin HEAD:${shellQuote(branch)}`,
      'PUSH'
    );
  } catch (error) {
    console.error(`PUSH_ROLLBACK_FROM=${commit}`);
    console.error(`PUSH_ROLLBACK_TO=${parent}`);
    runStrict(
      `git reset --soft ${shellQuote(parent)}`,
      'ROLLBACK_LOCAL_COMMIT'
    );
    runStrict(
      'git reset',
      'UNSTAGE_AFTER_PUSH_FAILURE'
    );
    throw error;
  }

  return { parent, commit };
}

function refreshScaffoldReceipt(
  moduleId,
  inputs,
  expectedBranch
) {
  const record = inputs.manifest.modules.find(
    module => module.id === moduleId
  );

  if (!record) {
    throw new GlobalAutopilotError(
      'UNKNOWN_MODULE',
      moduleId
    );
  }

  verifyBranch(expectedBranch);
  ensureCleanWorktree();

  const tests = record.tests ?? [];

  if (tests.length === 0) {
    throw new GlobalAutopilotError(
      'FOCUSED_TESTS_REQUIRED',
      moduleId
    );
  }

  runStrict(
    `${shellQuote(process.execPath)} --test ${
      tests.map(shellQuote).join(' ')
    }`,
    `FOCUSED_TESTS:${moduleId}`
  );
  runStrict('npm test', 'FULL_SUITE');
  runStrict('bash tools/forge doctor', 'FORGE_DOCTOR');
  runStrict(
    `bash tools/forge validate ${shellQuote(moduleId)}`,
    `MODULE_VALIDATION:${moduleId}`
  );

  const changed = statusPaths();
  const allowedPrefix =
    `.forge21/receipts/${moduleId}/`;

  if (
    changed.length === 0
    || changed.some(file =>
      !file.startsWith(allowedPrefix)
    )
  ) {
    throw new GlobalAutopilotError(
      'SCAFFOLD_REFRESH_ROUTE_AUDIT_FAILED',
      changed.join(',')
    );
  }

  runStrict('git diff --check', 'AUDIT_DIFF_CHECK');

  const post = buildCurrentPlan(inputs);
  const evaluated = moduleFromAudit(
    post.audit,
    moduleId
  );

  if (!evaluated?.functionalPass) {
    throw new GlobalAutopilotError(
      'SCAFFOLD_REFRESH_COMPLETION_FAILED',
      (evaluated?.reasons ?? []).join(',')
    );
  }

  const delivery = stageCommitPush(
    changed,
    `chore(${moduleId.toLowerCase()}): refresh governed validation receipt`,
    expectedBranch
  );

  ensureCleanWorktree();

  return delivery.commit;
}

function runModuleAutopilot(
  moduleId,
  expectedBranch
) {
  verifyBranch(expectedBranch);
  ensureCleanWorktree();

  const before = currentHead();

  runStrict(
    `bash tools/forge-autopilot run ${shellQuote(moduleId)}`,
    `MODULE_AUTOPILOT:${moduleId}`,
    { inherit: true }
  );

  verifyBranch(expectedBranch);
  ensureCleanWorktree();

  const after = currentHead();

  if (after === before) {
    throw new GlobalAutopilotError(
      'MODULE_AUTOPILOT_MADE_NO_COMMIT',
      moduleId
    );
  }

  return after;
}

function protectedBranchCheck(
  branch,
  globalPolicy,
  flags
) {
  const protectedBranches =
    globalPolicy.protectedBranches ?? [];

  if (
    protectedBranches.includes(branch)
    && flags.get('allow-protected-branch') !== true
  ) {
    throw new GlobalAutopilotError(
      'PROTECTED_BRANCH_REQUIRES_EXPLICIT_OVERRIDE',
      branch
    );
  }
}

function latestParentRunId(commandName) {
  if (commandName !== 'resume') return null;

  const latest = path.join(
    globalStateRoot,
    'latest.json'
  );

  if (!fs.existsSync(latest)) {
    throw new GlobalAutopilotError(
      'NO_GLOBAL_CAMPAIGN_TO_RESUME'
    );
  }

  return readJson(latest).runId ?? null;
}

function runCampaign(
  commandName,
  flags
) {
  const inputs = loadInputs();
  const selectedAreas = parseSelectedAreas(flags);
  const maxModules = positiveInteger(
    flags.get('max-modules'),
    inputs.globalPolicy.defaultMaxModules,
    'max-modules'
  );
  const maxMinutes = positiveInteger(
    flags.get('max-minutes'),
    inputs.globalPolicy.defaultMaxMinutes,
    'max-minutes'
  );
  const dryRun = flags.get('dry-run') === true;

  ensureCleanWorktree();

  const branch = currentBranch();
  protectedBranchCheck(
    branch,
    inputs.globalPolicy,
    flags
  );

  git(['remote', 'get-url', 'origin']);

  const lock = acquireLock();
  const started = Date.now();
  const parentRunId = latestParentRunId(
    commandName
  );

  const campaign = {
    schemaVersion: 1,
    runId: lock.runId,
    parentRunId,
    status: 'RUNNING',
    startedAt: new Date(started).toISOString(),
    updatedAt: new Date(started).toISOString(),
    branch,
    initialHead: currentHead(),
    currentHead: currentHead(),
    selectedAreas,
    limits: {
      maxModules,
      maxMinutes
    },
    dryRun,
    completedActions: [],
    currentPlan: {
      status: 'UNKNOWN',
      actionType: 'NONE',
      moduleId: null,
      area: null,
      reason: 'NOT_EVALUATED',
      blockers: []
    }
  };

  try {
    for (;;) {
      verifyBranch(branch);
      ensureCleanWorktree();

      const elapsedMinutes =
        (Date.now() - started) / 60000;

      if (
        campaign.completedActions.length
          >= maxModules
        || elapsedMinutes >= maxMinutes
      ) {
        campaign.status = 'LIMIT_REACHED';
        campaign.currentPlan = {
          status: 'BLOCKED',
          runnable: false,
          actionType: 'CAMPAIGN_LIMIT',
          moduleId: null,
          area: null,
          reason: 'CAMPAIGN_LIMIT_REACHED',
          blockers: [
            `completed=${
              campaign.completedActions.length
            }/${maxModules}`,
            `elapsedMinutes=${
              elapsedMinutes.toFixed(1)
            }/${maxMinutes}`
          ]
        };
        break;
      }

      const loopInputs = loadInputs();
      const current = buildCurrentPlan(
        loopInputs,
        { selectedAreas }
      );
      campaign.currentPlan = current.plan;
      campaign.currentHead = currentHead();
      campaign.updatedAt =
        new Date().toISOString();
      persistCampaign(campaign);
      printPlan(current.plan, current.audit);

      if (current.plan.status === 'COMPLETE') {
        campaign.status = 'COMPLETE';
        break;
      }

      if (!current.plan.runnable) {
        campaign.status = 'BLOCKED';
        break;
      }

      if (dryRun) {
        campaign.status = 'DRY_RUN';
        break;
      }

      const headBefore = currentHead();
      let headAfter;

      if (
        current.plan.actionType
          === 'RUN_MODULE_AUTOPILOT'
      ) {
        headAfter = runModuleAutopilot(
          current.plan.moduleId,
          branch
        );
      } else if (
        current.plan.actionType
          === 'REFRESH_SCAFFOLD_RECEIPT'
      ) {
        headAfter = refreshScaffoldReceipt(
          current.plan.moduleId,
          loopInputs,
          branch
        );
      } else {
        throw new GlobalAutopilotError(
          'UNSUPPORTED_RUNNABLE_ACTION',
          current.plan.actionType
        );
      }

      const verified = buildCurrentPlan(
        loadInputs(),
        { selectedAreas }
      );
      const delivered = moduleFromAudit(
        verified.audit,
        current.plan.moduleId
      );

      if (!delivered?.functionalPass) {
        throw new GlobalAutopilotError(
          'POST_ACTION_FUNCTIONAL_VERIFICATION_FAILED',
          `${current.plan.moduleId}:${
            (delivered?.reasons ?? []).join(',')
          }`
        );
      }

      campaign.completedActions.push({
        actionType: current.plan.actionType,
        moduleId: current.plan.moduleId,
        area: current.plan.area,
        headBefore,
        headAfter,
        completedAt: new Date().toISOString()
      });
      campaign.currentHead = headAfter;
      campaign.updatedAt =
        new Date().toISOString();
      campaign.currentPlan = verified.plan;
      persistCampaign(campaign);
    }

    campaign.currentHead = currentHead();
    campaign.updatedAt = new Date().toISOString();
    persistCampaign(campaign);

    console.log('============================================================');
    console.log('FORGE OS V2 — GLOBAL CAMPAIGN RESULT');
    console.log('============================================================');
    console.log(`GLOBAL_RESULT=${campaign.status}`);
    console.log(`GLOBAL_RUN_ID=${campaign.runId}`);
    console.log(
      `COMPLETED_ACTIONS=${
        campaign.completedActions.length
      }`
    );
    console.log(`HEAD=${campaign.currentHead}`);
    console.log(`BRANCH=${campaign.branch}`);
    printPlan(campaign.currentPlan);

    if (campaign.status === 'BLOCKED') {
      process.exitCode =
        inputs.globalPolicy.blockedExitCode ?? 2;
    }

    if (campaign.status === 'LIMIT_REACHED') {
      process.exitCode =
        inputs.globalPolicy.limitExitCode ?? 3;
    }
  } finally {
    lock.release();
  }
}

function doctor() {
  const inputs = loadInputs();
  git(['rev-parse', '--is-inside-work-tree']);
  git(['remote', 'get-url', 'origin']);
  const branch = currentBranch();

  const requiredAreas = new Set(
    inputs.globalPolicy.requiredCapabilityAreas
  );

  for (const area of requiredAreas) {
    if (
      ![
        'runtime',
        'integrations',
        'productE2E'
      ].includes(area)
    ) {
      throw new GlobalAutopilotError(
        'INVALID_REQUIRED_CAPABILITY_AREA',
        area
      );
    }
  }

  console.log('GLOBAL_DOCTOR=PASS');
  console.log(`FORGE_ROOT=${root}`);
  console.log(`BRANCH=${branch}`);
  console.log(`HEAD=${currentHead()}`);
  console.log(`NODE_VERSION=${process.version}`);
  console.log(
    `DEFAULT_MAX_MODULES=${
      inputs.globalPolicy.defaultMaxModules
    }`
  );
  console.log(
    `DEFAULT_MAX_MINUTES=${
      inputs.globalPolicy.defaultMaxMinutes
    }`
  );
}

function usage() {
  console.log(`Forge OS V2 Global Autopilot

Usage:
  tools/forge-global-autopilot doctor
  tools/forge-global-autopilot status [--areas LIST]
  tools/forge-global-autopilot plan [--areas LIST]
  tools/forge-global-autopilot run [--areas LIST] [--max-modules N] [--max-minutes N] [--dry-run] [--allow-protected-branch]
  tools/forge-global-autopilot resume [same flags]

Behavior:
  - recomputes the functional audit before every action;
  - resolves incomplete dependencies first;
  - invokes the existing module autopilot only for explicitly configured actions;
  - may refresh a scaffold receipt only when its real tests already pass and the receipt is the sole blocker;
  - stops on missing modules, missing hooks, architecture failures, any test failure, route drift, commit failure, or push failure;
  - commits and pushes each successful module separately;
  - stores resumable campaign journals under .forge21/autopilot/global/.`);
}

async function main() {
  const { positional, flags } = parseArgs(
    process.argv.slice(2)
  );
  const commandName = positional[0] ?? 'status';

  if (
    commandName === 'help'
    || commandName === '--help'
    || commandName === '-h'
  ) {
    usage();
    return;
  }

  if (commandName === 'doctor') {
    doctor();
    return;
  }

  if (
    commandName === 'status'
    || commandName === 'plan'
  ) {
    const inputs = loadInputs();
    const selectedAreas =
      parseSelectedAreas(flags);
    const current = buildCurrentPlan(
      inputs,
      {
        selectedAreas,
        inheritAudit: commandName === 'status'
      }
    );
    printPlan(current.plan, current.audit);
    return;
  }

  if (
    commandName === 'run'
    || commandName === 'resume'
  ) {
    runCampaign(commandName, flags);
    return;
  }

  throw new GlobalAutopilotError(
    'UNKNOWN_COMMAND',
    commandName
  );
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1])
    === path.resolve(scriptFile);

if (isMain) {
  main().catch(error => {
    const code =
      error instanceof GlobalAutopilotError
        ? error.code
        : 'UNEXPECTED_ERROR';

    console.error('GLOBAL_AUTOPILOT_RESULT=FAIL');
    console.error(`GLOBAL_AUTOPILOT_ERROR_CODE=${code}`);
    console.error(
      `GLOBAL_AUTOPILOT_ERROR=${error.message}`
    );
    process.exitCode = 1;
  });
}
