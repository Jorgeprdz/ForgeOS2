import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  ContractValidationError,
  assertScaffoldExecutionPlan,
  isSafeRepositoryPath,
  sha256Canonical
} from '../scaffold-contracts/index.mjs';

import {
  ScaffoldRegistryError,
  createScaffoldRegistry,
  scaffoldRef
} from '../scaffold-registry/index.mjs';

import {
  ScaffoldPlanError,
  hashScaffoldPlan,
  verifyScaffoldPlanHash
} from '../scaffold-planner/index.mjs';

const VALID_TOKEN_RE = /\{\{([a-z][a-z0-9_]*)\}\}/g;
const ANY_BRACE_TOKEN_RE = /\{\{[^{}]*\}\}/g;
const SHA256_RE = /^[a-f0-9]{64}$/;
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;

const DEFAULT_LIMITS = Object.freeze({
  templateBytes: 1024 * 1024,
  scalarBytes: 256 * 1024,
  outputBytes: 2 * 1024 * 1024
});

export class ScaffoldRenderError extends Error {
  constructor(code, details = []) {
    super(`${code}${details.length ? `:${details.join('|')}` : ''}`);
    this.name = 'ScaffoldRenderError';
    this.code = code;
    this.details = [...details];
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value, code) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ScaffoldRenderError(code, [String(value)]);
  }
  return value;
}

function requireSha(value, code) {
  if (typeof value !== 'string' || !SHA256_RE.test(value)) {
    throw new ScaffoldRenderError(code, [String(value)]);
  }
  return value;
}

function byteLength(value) {
  return Buffer.byteLength(value, 'utf8');
}

function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function assertNoControlCharacters(value, code) {
  if (CONTROL_RE.test(value)) {
    throw new ScaffoldRenderError(code);
  }
}

function normalizeScalar(value, limits) {
  if (
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    typeof value !== 'boolean'
  ) {
    throw new ScaffoldRenderError('TEMPLATE_VALUE_MUST_BE_SCALAR');
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new ScaffoldRenderError('TEMPLATE_NUMBER_MUST_BE_FINITE');
  }

  const normalized = String(value)
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n');

  assertNoControlCharacters(normalized, 'TEMPLATE_VALUE_HAS_CONTROL_CHARACTER');

  if (byteLength(normalized) > limits.scalarBytes) {
    throw new ScaffoldRenderError('TEMPLATE_VALUE_TOO_LARGE');
  }

  return normalized;
}

export function normalizeText(value, { finalNewline = true } = {}) {
  if (typeof value !== 'string') {
    throw new ScaffoldRenderError('TEXT_VALUE_REQUIRED');
  }

  let normalized = value
    .replace(/^\uFEFF/u, '')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n');

  assertNoControlCharacters(normalized, 'TEXT_HAS_CONTROL_CHARACTER');

  if (finalNewline) {
    normalized = normalized.replace(/\n*$/u, '\n');
  }

  return normalized;
}

export function sha256NormalizedText(value) {
  return sha256Bytes(Buffer.from(normalizeText(value), 'utf8'));
}

export function extractTemplateTokens(templateText) {
  const normalized = normalizeText(templateText);
  const tokens = [];
  let match;

  VALID_TOKEN_RE.lastIndex = 0;
  while ((match = VALID_TOKEN_RE.exec(normalized)) !== null) {
    tokens.push(match[1]);
  }

  const withoutValidTokens = normalized.replace(VALID_TOKEN_RE, '');

  if (
    withoutValidTokens.includes('{{') ||
    withoutValidTokens.includes('}}') ||
    /\{\{\{|\}\}\}/u.test(normalized)
  ) {
    throw new ScaffoldRenderError('UNSUPPORTED_TEMPLATE_SYNTAX');
  }

  return Object.freeze([...new Set(tokens)].sort());
}

export function renderTextTemplate(
  templateText,
  data,
  { limits = DEFAULT_LIMITS } = {}
) {
  if (!isPlainObject(data)) {
    throw new ScaffoldRenderError('TEMPLATE_DATA_OBJECT_REQUIRED');
  }

  const normalizedTemplate = normalizeText(templateText);

  if (byteLength(normalizedTemplate) > limits.templateBytes) {
    throw new ScaffoldRenderError('TEMPLATE_TOO_LARGE');
  }

  const tokens = extractTemplateTokens(normalizedTemplate);
  const replacements = new Map();

  for (const token of tokens) {
    if (!Object.hasOwn(data, token)) {
      throw new ScaffoldRenderError('TEMPLATE_TOKEN_MISSING', [token]);
    }
    replacements.set(token, normalizeScalar(data[token], limits));
  }

  const rendered = normalizedTemplate.replace(
    VALID_TOKEN_RE,
    (_, token) => replacements.get(token)
  );

  if (
    rendered.includes('{{') ||
    rendered.includes('}}') ||
    ANY_BRACE_TOKEN_RE.test(rendered)
  ) {
    throw new ScaffoldRenderError('UNRESOLVED_OR_INJECTED_TEMPLATE_TOKEN');
  }

  const text = normalizeText(rendered);

  if (byteLength(text) > limits.outputBytes) {
    throw new ScaffoldRenderError('RENDERED_OUTPUT_TOO_LARGE');
  }

  return Object.freeze({
    text,
    bytes: byteLength(text),
    sha256: sha256Bytes(Buffer.from(text, 'utf8')),
    tokens
  });
}

function assertPlanReadyForRendering(plan) {
  assertScaffoldExecutionPlan(plan);
  verifyScaffoldPlanHash(plan);

  if (plan.conflicts.length !== 0) {
    throw new ScaffoldRenderError('PLAN_HAS_CONFLICTS', plan.conflicts);
  }

  for (const output of plan.plannedOutputs) {
    const expectedState =
      output.operation === 'CREATE' ? 'CLEAR_CREATE' : 'CLEAR_MODIFY';

    if (output.conflictState !== expectedState) {
      throw new ScaffoldRenderError(
        'PLAN_OUTPUT_NOT_CLEAR',
        [output.outputId, output.conflictState]
      );
    }

    if (output.expectedSha256 !== null) {
      throw new ScaffoldRenderError(
        'PLAN_ALREADY_HAS_RENDERED_HASH',
        [output.outputId]
      );
    }
  }
}

function assertDefinitionMatchesPlan(definition, plan) {
  if (scaffoldRef(definition) !== plan.scaffold) {
    throw new ScaffoldRenderError('DEFINITION_PLAN_REFERENCE_MISMATCH');
  }

  if (definition.status !== 'AUTHORIZED') {
    throw new ScaffoldRenderError(
      'SCAFFOLD_NOT_AUTHORIZED',
      [definition.status]
    );
  }

  if (definition.outputs.length !== 1 || plan.plannedOutputs.length !== 1) {
    throw new ScaffoldRenderError(
      'MULTI_OUTPUT_TEMPLATE_MAPPING_NOT_DEFINED'
    );
  }

  const definitionOutput = definition.outputs[0];
  const plannedOutput = plan.plannedOutputs[0];
  const expectedOperation =
    definitionOutput.operation === 'CREATE_ONLY' ? 'CREATE' : 'MODIFY';

  if (definitionOutput.id !== plannedOutput.outputId) {
    throw new ScaffoldRenderError('OUTPUT_ID_MISMATCH');
  }

  if (expectedOperation !== plannedOutput.operation) {
    throw new ScaffoldRenderError('OUTPUT_OPERATION_MISMATCH');
  }
}

function finalizeRenderedPlan(plan, output) {
  const renderedPlan = structuredClone(plan);
  renderedPlan.plannedOutputs[0].expectedSha256 = output.sha256;
  renderedPlan.planSha256 = hashScaffoldPlan(renderedPlan);
  assertScaffoldExecutionPlan(renderedPlan);
  verifyScaffoldPlanHash(renderedPlan);
  return Object.freeze(renderedPlan);
}

export function renderScaffoldInMemory({
  plan,
  registry: registryValue,
  registrySha256,
  inputData,
  templateText,
  softwareGateRatified = false,
  limits = DEFAULT_LIMITS
}) {
  assertPlanReadyForRendering(plan);
  requireSha(registrySha256, 'REGISTRY_HASH_INVALID');

  const registry = createScaffoldRegistry(
    registryValue,
    { softwareGateRatified }
  );

  if (registry.hash !== registrySha256) {
    throw new ScaffoldRenderError(
      'REGISTRY_HASH_MISMATCH',
      [registry.hash, registrySha256]
    );
  }

  if (plan.locks.registrySha256 !== registrySha256) {
    throw new ScaffoldRenderError('PLAN_REGISTRY_LOCK_MISMATCH');
  }

  const definition = registry.resolve(plan.scaffold);
  assertDefinitionMatchesPlan(definition, plan);

  const definitionHash = sha256Canonical(definition);
  if (plan.locks.definitionSha256 !== definitionHash) {
    throw new ScaffoldRenderError('PLAN_DEFINITION_LOCK_MISMATCH');
  }

  if (!isPlainObject(inputData)) {
    throw new ScaffoldRenderError('INPUT_DATA_OBJECT_REQUIRED');
  }

  const inputHash = sha256Canonical(inputData);
  if (inputHash !== plan.input.sha256) {
    throw new ScaffoldRenderError(
      'PLAN_INPUT_HASH_MISMATCH',
      [inputHash, plan.input.sha256]
    );
  }

  if (definition.template.sha256 === null) {
    throw new ScaffoldRenderError('DEFINITION_TEMPLATE_NOT_LOCKED');
  }

  const templateSha256 = sha256NormalizedText(templateText);

  if (templateSha256 !== definition.template.sha256) {
    throw new ScaffoldRenderError(
      'DEFINITION_TEMPLATE_HASH_MISMATCH',
      [templateSha256, definition.template.sha256]
    );
  }

  if (plan.locks.templateSha256 !== templateSha256) {
    throw new ScaffoldRenderError('PLAN_TEMPLATE_LOCK_MISMATCH');
  }

  const first = renderTextTemplate(templateText, inputData, { limits });
  const second = renderTextTemplate(templateText, inputData, { limits });

  if (
    first.sha256 !== second.sha256 ||
    first.bytes !== second.bytes ||
    first.text !== second.text
  ) {
    throw new ScaffoldRenderError('NON_DETERMINISTIC_RENDER');
  }

  const plannedOutput = plan.plannedOutputs[0];
  const output = Object.freeze({
    outputId: plannedOutput.outputId,
    path: plannedOutput.path,
    operation: plannedOutput.operation,
    mediaType: definition.outputs[0].mediaType,
    text: first.text,
    bytes: first.bytes,
    sha256: first.sha256,
    tokens: first.tokens
  });

  const renderedPlan = finalizeRenderedPlan(plan, output);

  return Object.freeze({
    schemaVersion: 1,
    scaffold: plan.scaffold,
    renderer: 'FORGE_TEXT_V1',
    reproducibility: 'PASS',
    inputSha256: inputHash,
    templateSha256,
    renderedPlan,
    outputs: Object.freeze([output]),
    renderDigest: sha256Canonical([
      {
        outputId: output.outputId,
        path: output.path,
        bytes: output.bytes,
        sha256: output.sha256
      }
    ])
  });
}

function realDirectory(value, code) {
  requireString(value, code);

  if (!path.isAbsolute(value)) {
    throw new ScaffoldRenderError(`${code}_MUST_BE_ABSOLUTE`, [value]);
  }

  const stat = fs.lstatSync(value);

  if (stat.isSymbolicLink()) {
    throw new ScaffoldRenderError(`${code}_MUST_NOT_BE_SYMLINK`, [value]);
  }

  if (!stat.isDirectory()) {
    throw new ScaffoldRenderError(`${code}_MUST_BE_DIRECTORY`, [value]);
  }

  return fs.realpathSync(value);
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
}

function listStagedFiles(rootDirectory) {
  const result = [];

  function visit(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(rootDirectory, absolute)
        .split(path.sep)
        .join('/');

      const stat = fs.lstatSync(absolute);

      if (stat.isSymbolicLink()) {
        throw new ScaffoldRenderError('STAGING_SYMLINK_DETECTED', [relative]);
      }

      if (stat.isDirectory()) {
        visit(absolute);
      } else if (stat.isFile()) {
        result.push(relative);
      } else {
        throw new ScaffoldRenderError(
          'STAGING_SPECIAL_FILE_DETECTED',
          [relative]
        );
      }
    }
  }

  visit(rootDirectory);
  return result;
}

export function verifyStagedScaffold(renderResult, stagingDirectory) {
  const realStaging = realDirectory(
    stagingDirectory,
    'STAGING_DIRECTORY'
  );

  const expectedPaths = renderResult.outputs
    .map(output => output.path)
    .sort();

  const actualPaths = listStagedFiles(realStaging);

  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    throw new ScaffoldRenderError(
      'STAGING_FILE_SET_MISMATCH',
      [
        `expected=${expectedPaths.join(',')}`,
        `actual=${actualPaths.join(',')}`
      ]
    );
  }

  for (const output of renderResult.outputs) {
    if (!isSafeRepositoryPath(output.path)) {
      throw new ScaffoldRenderError(
        'STAGED_OUTPUT_PATH_UNSAFE',
        [output.path]
      );
    }

    const absolute = path.resolve(realStaging, output.path);

    if (!isInside(realStaging, absolute)) {
      throw new ScaffoldRenderError(
        'STAGED_OUTPUT_ESCAPES_ROOT',
        [output.path]
      );
    }

    const bytes = fs.readFileSync(absolute);
    const hash = sha256Bytes(bytes);

    if (hash !== output.sha256) {
      throw new ScaffoldRenderError(
        'STAGED_OUTPUT_HASH_MISMATCH',
        [output.path, hash, output.sha256]
      );
    }

    if (bytes.length !== output.bytes) {
      throw new ScaffoldRenderError(
        'STAGED_OUTPUT_SIZE_MISMATCH',
        [output.path]
      );
    }
  }

  return true;
}

export function stageRenderedScaffold({
  renderResult,
  stagingParent = os.tmpdir(),
  repositoryRoot
}) {
  if (
    !isPlainObject(renderResult) ||
    renderResult.reproducibility !== 'PASS' ||
    !Array.isArray(renderResult.outputs) ||
    renderResult.outputs.length === 0
  ) {
    throw new ScaffoldRenderError('VALID_RENDER_RESULT_REQUIRED');
  }

  verifyScaffoldPlanHash(renderResult.renderedPlan);

  const realParent = realDirectory(stagingParent, 'STAGING_PARENT');
  const realRepository = realDirectory(repositoryRoot, 'REPOSITORY_ROOT');

  if (isInside(realRepository, realParent)) {
    throw new ScaffoldRenderError(
      'STAGING_PARENT_INSIDE_REPOSITORY',
      [realParent]
    );
  }

  const stagingDirectory = fs.mkdtempSync(
    path.join(realParent, 'forge-scaffold-render-')
  );

  try {
    for (const output of renderResult.outputs) {
      if (!isSafeRepositoryPath(output.path)) {
        throw new ScaffoldRenderError(
          'STAGED_OUTPUT_PATH_UNSAFE',
          [output.path]
        );
      }

      const destination = path.resolve(stagingDirectory, output.path);

      if (!isInside(stagingDirectory, destination)) {
        throw new ScaffoldRenderError(
          'STAGED_OUTPUT_ESCAPES_ROOT',
          [output.path]
        );
      }

      fs.mkdirSync(path.dirname(destination), {
        recursive: true,
        mode: 0o755
      });

      fs.writeFileSync(
        destination,
        Buffer.from(output.text, 'utf8'),
        {
          flag: 'wx',
          mode: 0o644
        }
      );
    }

    verifyStagedScaffold(renderResult, stagingDirectory);

    return Object.freeze({
      schemaVersion: 1,
      stagingDirectory,
      repositoryTouched: false,
      fileCount: renderResult.outputs.length,
      outputs: Object.freeze(
        renderResult.outputs.map(output => Object.freeze({
          path: output.path,
          absolutePath: path.resolve(stagingDirectory, output.path),
          bytes: output.bytes,
          sha256: output.sha256
        }))
      )
    });
  } catch (error) {
    fs.rmSync(stagingDirectory, { recursive: true, force: true });
    throw error;
  }
}

export function removeStagingDirectory({
  stagingDirectory,
  stagingParent
}) {
  const realParent = realDirectory(stagingParent, 'STAGING_PARENT');
  const realStaging = realDirectory(
    stagingDirectory,
    'STAGING_DIRECTORY'
  );

  if (!isInside(realParent, realStaging) || realParent === realStaging) {
    throw new ScaffoldRenderError('STAGING_CLEANUP_OUTSIDE_PARENT');
  }

  if (!path.basename(realStaging).startsWith('forge-scaffold-render-')) {
    throw new ScaffoldRenderError('STAGING_CLEANUP_PREFIX_MISMATCH');
  }

  fs.rmSync(realStaging, { recursive: true, force: false });
  return true;
}

export {
  ContractValidationError,
  ScaffoldPlanError,
  ScaffoldRegistryError,
  DEFAULT_LIMITS
};
