import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  sha256Canonical
} from '../scaffold-contracts/index.mjs';

import {
  createScaffoldRegistry
} from '../scaffold-registry/index.mjs';

import {
  buildScaffoldPlan,
  verifyScaffoldPlanHash
} from '../scaffold-planner/index.mjs';

import {
  DEFAULT_LIMITS,
  ScaffoldRenderError,
  extractTemplateTokens,
  normalizeText,
  removeStagingDirectory,
  renderScaffoldInMemory,
  renderTextTemplate,
  sha256NormalizedText,
  stageRenderedScaffold,
  verifyStagedScaffold
} from './index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = name => path.join(here, 'fixtures', name);
const read = name => fs.readFileSync(fixturePath(name), 'utf8');
const readJson = name => JSON.parse(read(name));

const registryValue = readJson('registry.json');
const inputData = readJson('input.json');
const templateText = read('architecture-boundary.template.md');
const expectedText = read('expected-output.md');
const registry = createScaffoldRegistry(registryValue);
const definition = registry.resolve(
  'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0'
);

function createPlan(overrides = {}) {
  return buildScaffoldPlan({
    registry: registryValue,
    scaffoldReference:
      'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0',
    input: {
      path:
        '.forge21/scaffold-inputs/client-truth-boundary.json',
      data: structuredClone(inputData),
      sha256: sha256Canonical(inputData),
      schemaSha256: definition.inputSchema.sha256,
      validation: { pass: true, errors: [] }
    },
    authoritySnapshot: {
      gateId: definition.authority.gateId,
      ratified: true,
      sha256: definition.authority.snapshotSha256
    },
    sourceRef:
      '71198a8a0c4cbff51b189f95966d6e97a0b89d3b',
    registrySha256: registry.hash,
    destinationInventory: {},
    runId:
      '20260724T000000Z-CLIENT-TRUTH-BOUNDARY',
    planId: 'SPLAN-CLIENT-TRUTH-BOUNDARY',
    createdAt: '2026-07-24T00:00:00Z',
    ...overrides
  });
}

function render(overrides = {}) {
  return renderScaffoldInMemory({
    plan: createPlan(),
    registry: registryValue,
    registrySha256: registry.hash,
    inputData: structuredClone(inputData),
    templateText,
    ...overrides
  });
}

function makeRoots() {
  const base = fs.mkdtempSync(
    path.join(os.tmpdir(), 'forge-wave3-test-')
  );
  const repositoryRoot = path.join(base, 'repo');
  const stagingParent = path.join(base, 'staging');
  fs.mkdirSync(repositoryRoot);
  fs.mkdirSync(stagingParent);
  return { base, repositoryRoot, stagingParent };
}

test('normalizes BOM, CRLF, CR, and final newline', () => {
  assert.equal(
    normalizeText('\uFEFFA\r\nB\rC'),
    'A\nB\nC\n'
  );
});

test('rejects forbidden control characters', () => {
  assert.throws(
    () => normalizeText('A\u0000B'),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code === 'TEXT_HAS_CONTROL_CHARACTER'
  );
});

test('extracts unique template tokens in sorted order', () => {
  assert.deepEqual(
    extractTemplateTokens(
      '{{title}} {{status}} {{title}} {{purpose}}'
    ),
    ['purpose', 'status', 'title']
  );
});

test('rejects unsupported template syntax', () => {
  for (const candidate of [
    '{{#if title}}x{{/if}}',
    '{{ title }}',
    '{{{title}}}',
    '{{title'
  ]) {
    assert.throws(
      () => extractTemplateTokens(candidate),
      error =>
        error instanceof ScaffoldRenderError &&
        error.code === 'UNSUPPORTED_TEMPLATE_SYNTAX'
    );
  }
});

test('renders expected deterministic text', () => {
  const result = renderTextTemplate(
    templateText,
    inputData
  );
  assert.equal(result.text, expectedText);
  assert.equal(result.bytes, Buffer.byteLength(expectedText));
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
});

test('renders repeated tokens identically', () => {
  const result = renderTextTemplate(
    '{{title}} / {{title}}',
    { title: 'Forge' }
  );
  assert.equal(result.text, 'Forge / Forge\n');
});

test('supports finite number and boolean scalars', () => {
  const result = renderTextTemplate(
    '{{count}} {{enabled}}',
    { count: 3, enabled: false }
  );
  assert.equal(result.text, '3 false\n');
});

test('rejects missing tokens', () => {
  assert.throws(
    () => renderTextTemplate(
      '{{title}} {{missing}}',
      { title: 'Forge' }
    ),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code === 'TEMPLATE_TOKEN_MISSING'
  );
});

test('rejects object, array, and null substitutions', () => {
  for (const value of [{}, [], null]) {
    assert.throws(
      () => renderTextTemplate(
        '{{value}}',
        { value }
      ),
      error =>
        error instanceof ScaffoldRenderError &&
        error.code === 'TEMPLATE_VALUE_MUST_BE_SCALAR'
    );
  }
});

test('rejects non-finite numbers', () => {
  assert.throws(
    () => renderTextTemplate(
      '{{value}}',
      { value: Number.POSITIVE_INFINITY }
    ),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code === 'TEMPLATE_NUMBER_MUST_BE_FINITE'
  );
});

test('rejects placeholder injection through input values', () => {
  assert.throws(
    () => renderTextTemplate(
      '{{title}}',
      { title: '{{injected}}' }
    ),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code ===
        'UNRESOLVED_OR_INJECTED_TEMPLATE_TOKEN'
  );
});

test('rejects oversized template', () => {
  assert.throws(
    () => renderTextTemplate(
      'A'.repeat(10),
      {},
      {
        limits: {
          ...DEFAULT_LIMITS,
          templateBytes: 5
        }
      }
    ),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code === 'TEMPLATE_TOO_LARGE'
  );
});

test('rejects oversized scalar', () => {
  assert.throws(
    () => renderTextTemplate(
      '{{value}}',
      { value: 'A'.repeat(10) },
      {
        limits: {
          ...DEFAULT_LIMITS,
          scalarBytes: 5
        }
      }
    ),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code === 'TEMPLATE_VALUE_TOO_LARGE'
  );
});

test('rejects oversized rendered output', () => {
  assert.throws(
    () => renderTextTemplate(
      '{{value}}',
      { value: 'A'.repeat(10) },
      {
        limits: {
          ...DEFAULT_LIMITS,
          scalarBytes: 20,
          outputBytes: 5
        }
      }
    ),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code === 'RENDERED_OUTPUT_TOO_LARGE'
  );
});

test('normalizes template hash deterministically', () => {
  assert.equal(
    sha256NormalizedText('A\r\nB'),
    sha256NormalizedText('A\nB\n')
  );
});

test('renders a complete scaffold in memory', () => {
  const result = render();
  assert.equal(result.reproducibility, 'PASS');
  assert.equal(result.outputs.length, 1);
  assert.equal(result.outputs[0].text, expectedText);
  assert.equal(
    result.outputs[0].path,
    'docs/architecture/scaffolds/instances/' +
      'boundaries/CLIENT_TRUTH_BOUNDARY.md'
  );
});

test('finalizes the rendered plan with an output hash', () => {
  const result = render();
  assert.equal(
    result.renderedPlan.plannedOutputs[0].expectedSha256,
    result.outputs[0].sha256
  );
  assert.equal(
    verifyScaffoldPlanHash(result.renderedPlan),
    true
  );
});

test('produces the same render result twice', () => {
  const first = render();
  const second = render();
  assert.deepEqual(first, second);
});

test('rejects a tampered plan hash', () => {
  const plan = structuredClone(createPlan());
  plan.sourceRef = 'tampered-ref';
  assert.throws(
    () => renderScaffoldInMemory({
      plan,
      registry: registryValue,
      registrySha256: registry.hash,
      inputData,
      templateText
    }),
    error => error.code === 'PLAN_HASH_MISMATCH'
  );
});

test('rejects a plan containing destination conflicts', () => {
  const target =
    'docs/architecture/scaffolds/instances/' +
    'boundaries/CLIENT_TRUTH_BOUNDARY.md';

  const plan = createPlan({
    destinationInventory: {
      [target]: {
        exists: true,
        dirty: false,
        symlink: false,
        sha256: 'e'.repeat(64)
      }
    }
  });

  assert.throws(
    () => renderScaffoldInMemory({
      plan,
      registry: registryValue,
      registrySha256: registry.hash,
      inputData,
      templateText
    }),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code === 'PLAN_HAS_CONFLICTS'
  );
});

test('rejects an incorrect registry hash', () => {
  assert.throws(
    () => render({
      registrySha256: 'f'.repeat(64)
    }),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code === 'REGISTRY_HASH_MISMATCH'
  );
});

test('rejects a template that differs from its lock', () => {
  assert.throws(
    () => render({
      templateText: `${templateText}\nchanged`
    }),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code === 'DEFINITION_TEMPLATE_HASH_MISMATCH'
  );
});

test('rejects input data that differs from the plan hash', () => {
  assert.throws(
    () => render({
      inputData: {
        ...inputData,
        title: 'Tampered'
      }
    }),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code === 'PLAN_INPUT_HASH_MISMATCH'
  );
});

test('rejects plans that already contain rendered hashes', () => {
  const plan = structuredClone(createPlan());
  plan.plannedOutputs[0].expectedSha256 =
    'f'.repeat(64);
  plan.planSha256 = sha256Canonical({
    ...plan,
    planSha256: null
  });

  assert.throws(
    () => renderScaffoldInMemory({
      plan,
      registry: registryValue,
      registrySha256: registry.hash,
      inputData,
      templateText
    }),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code === 'PLAN_ALREADY_HAS_RENDERED_HASH'
  );
});

test('fails closed when a definition has multiple outputs', () => {
  const modifiedRegistry = structuredClone(registryValue);
  modifiedRegistry.definitions[0].outputs.push({
    ...modifiedRegistry.definitions[0].outputs[0],
    id: 'SECOND_DOCUMENT',
    pathPattern:
      'docs/architecture/scaffolds/instances/' +
      'boundaries/{{document_id}}-2.md'
  });

  const modified = createScaffoldRegistry(modifiedRegistry);
  const modifiedDefinition = modified.resolve(
    'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0'
  );

  const plan = buildScaffoldPlan({
    registry: modifiedRegistry,
    scaffoldReference:
      'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0',
    input: {
      path: '.forge21/scaffold-inputs/input.json',
      data: inputData,
      sha256: sha256Canonical(inputData),
      schemaSha256:
        modifiedDefinition.inputSchema.sha256,
      validation: { pass: true, errors: [] }
    },
    authoritySnapshot: {
      gateId: 'SG-001',
      ratified: true,
      sha256:
        modifiedDefinition.authority.snapshotSha256
    },
    sourceRef:
      '71198a8a0c4cbff51b189f95966d6e97a0b89d3b',
    registrySha256: modified.hash,
    destinationInventory: {},
    runId: '20260724T000000Z-MULTI',
    planId: 'SPLAN-MULTI',
    createdAt: '2026-07-24T00:00:00Z'
  });

  assert.throws(
    () => renderScaffoldInMemory({
      plan,
      registry: modifiedRegistry,
      registrySha256: modified.hash,
      inputData,
      templateText
    }),
    error =>
      error instanceof ScaffoldRenderError &&
      error.code ===
        'MULTI_OUTPUT_TEMPLATE_MAPPING_NOT_DEFINED'
  );
});

test('stages rendered bytes outside the repository', () => {
  const roots = makeRoots();

  try {
    const renderResult = render();
    const staged = stageRenderedScaffold({
      renderResult,
      stagingParent: roots.stagingParent,
      repositoryRoot: roots.repositoryRoot
    });

    assert.equal(staged.repositoryTouched, false);
    assert.equal(staged.fileCount, 1);
    assert.equal(
      fs.existsSync(staged.outputs[0].absolutePath),
      true
    );
    assert.equal(
      fs.readFileSync(
        staged.outputs[0].absolutePath,
        'utf8'
      ),
      expectedText
    );
    assert.equal(
      fs.readdirSync(roots.repositoryRoot).length,
      0
    );

    removeStagingDirectory({
      stagingDirectory: staged.stagingDirectory,
      stagingParent: roots.stagingParent
    });
  } finally {
    fs.rmSync(roots.base, {
      recursive: true,
      force: true
    });
  }
});

test('creates a unique staging directory for each run', () => {
  const roots = makeRoots();

  try {
    const result = render();

    const first = stageRenderedScaffold({
      renderResult: result,
      stagingParent: roots.stagingParent,
      repositoryRoot: roots.repositoryRoot
    });

    const second = stageRenderedScaffold({
      renderResult: result,
      stagingParent: roots.stagingParent,
      repositoryRoot: roots.repositoryRoot
    });

    assert.notEqual(
      first.stagingDirectory,
      second.stagingDirectory
    );

    removeStagingDirectory({
      stagingDirectory: first.stagingDirectory,
      stagingParent: roots.stagingParent
    });

    removeStagingDirectory({
      stagingDirectory: second.stagingDirectory,
      stagingParent: roots.stagingParent
    });
  } finally {
    fs.rmSync(roots.base, {
      recursive: true,
      force: true
    });
  }
});

test('verifies the exact staged file set', () => {
  const roots = makeRoots();

  try {
    const result = render();
    const staged = stageRenderedScaffold({
      renderResult: result,
      stagingParent: roots.stagingParent,
      repositoryRoot: roots.repositoryRoot
    });

    assert.equal(
      verifyStagedScaffold(
        result,
        staged.stagingDirectory
      ),
      true
    );

    fs.writeFileSync(
      path.join(staged.stagingDirectory, 'EXTRA.txt'),
      'extra'
    );

    assert.throws(
      () => verifyStagedScaffold(
        result,
        staged.stagingDirectory
      ),
      error =>
        error instanceof ScaffoldRenderError &&
        error.code === 'STAGING_FILE_SET_MISMATCH'
    );
  } finally {
    fs.rmSync(roots.base, {
      recursive: true,
      force: true
    });
  }
});

test('detects staged byte tampering', () => {
  const roots = makeRoots();

  try {
    const result = render();
    const staged = stageRenderedScaffold({
      renderResult: result,
      stagingParent: roots.stagingParent,
      repositoryRoot: roots.repositoryRoot
    });

    fs.writeFileSync(
      staged.outputs[0].absolutePath,
      'tampered\n'
    );

    assert.throws(
      () => verifyStagedScaffold(
        result,
        staged.stagingDirectory
      ),
      error =>
        error instanceof ScaffoldRenderError &&
        error.code === 'STAGED_OUTPUT_HASH_MISMATCH'
    );
  } finally {
    fs.rmSync(roots.base, {
      recursive: true,
      force: true
    });
  }
});

test('rejects a staging parent inside the repository', () => {
  const roots = makeRoots();
  const inside = path.join(
    roots.repositoryRoot,
    'staging'
  );
  fs.mkdirSync(inside);

  try {
    assert.throws(
      () => stageRenderedScaffold({
        renderResult: render(),
        stagingParent: inside,
        repositoryRoot: roots.repositoryRoot
      }),
      error =>
        error instanceof ScaffoldRenderError &&
        error.code ===
          'STAGING_PARENT_INSIDE_REPOSITORY'
    );
  } finally {
    fs.rmSync(roots.base, {
      recursive: true,
      force: true
    });
  }
});

test('rejects a symlink staging parent', () => {
  const roots = makeRoots();
  const symlink = path.join(roots.base, 'staging-link');
  fs.symlinkSync(roots.stagingParent, symlink);

  try {
    assert.throws(
      () => stageRenderedScaffold({
        renderResult: render(),
        stagingParent: symlink,
        repositoryRoot: roots.repositoryRoot
      }),
      error =>
        error instanceof ScaffoldRenderError &&
        error.code ===
          'STAGING_PARENT_MUST_NOT_BE_SYMLINK'
    );
  } finally {
    fs.rmSync(roots.base, {
      recursive: true,
      force: true
    });
  }
});

test('writes staged files with no executable bits', () => {
  const roots = makeRoots();

  try {
    const staged = stageRenderedScaffold({
      renderResult: render(),
      stagingParent: roots.stagingParent,
      repositoryRoot: roots.repositoryRoot
    });

    const mode =
      fs.statSync(staged.outputs[0].absolutePath).mode &
      0o777;

    assert.equal(mode & 0o111, 0);
  } finally {
    fs.rmSync(roots.base, {
      recursive: true,
      force: true
    });
  }
});

test('cleanup rejects directories without renderer prefix', () => {
  const roots = makeRoots();

  try {
    assert.throws(
      () => removeStagingDirectory({
        stagingDirectory: roots.repositoryRoot,
        stagingParent: roots.base
      }),
      error =>
        error instanceof ScaffoldRenderError &&
        error.code ===
          'STAGING_CLEANUP_PREFIX_MISMATCH'
    );
  } finally {
    fs.rmSync(roots.base, {
      recursive: true,
      force: true
    });
  }
});

test('render digest is stable and hash-shaped', () => {
  const first = render();
  const second = render();

  assert.match(
    first.renderDigest,
    /^[a-f0-9]{64}$/
  );
  assert.equal(
    first.renderDigest,
    second.renderDigest
  );
});
