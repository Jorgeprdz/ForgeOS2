import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createScaffoldRegistry
} from '../scaffold-registry/index.mjs';

import {
  buildScaffoldPlan
} from '../scaffold-planner/index.mjs';

import {
  renderScaffoldInMemory,
  stageRenderedScaffold
} from '../scaffold-renderer/index.mjs';

import {
  validateRenderedScaffoldBundle
} from '../scaffold-validator/index.mjs';

import {
  applyApprovedScaffold,
  createApprovalRecord,
  createFinalReceipt,
  snapshotRepositoryTree,
  verifyFinalReceipt
} from '../scaffold-applier/index.mjs';

import {
  EXPECTED_REFS,
  SECTION_ORDER,
  assertCanonicalCatalog,
  catalogSummary,
  createCanonicalInputEnvelope,
  loadCanonicalCatalog,
  validateCanonicalCatalog,
  validateCanonicalInput
} from './index.mjs';

const here = path.dirname(
  fileURLToPath(import.meta.url)
);
const overlayRoot = path.resolve(
  here,
  '..',
  '..'
);

function copyDirectory(source, destination) {
  fs.cpSync(source, destination, {
    recursive: true
  });
}

function makeCatalogCopy() {
  const base = fs.mkdtempSync(
    path.join(os.tmpdir(), 'forge-catalog-copy-')
  );
  copyDirectory(
    path.join(overlayRoot, 'forge'),
    path.join(base, 'forge')
  );
  return base;
}

function makeRuntimeRoots(prefix) {
  const base = fs.mkdtempSync(
    path.join(os.tmpdir(), prefix)
  );
  const repositoryRoot = path.join(base, 'repo');
  const stagingParent = path.join(base, 'staging');
  const evidenceParent = path.join(base, 'evidence');
  fs.mkdirSync(repositoryRoot);
  fs.mkdirSync(stagingParent);
  fs.mkdirSync(evidenceParent);

  return {
    base,
    repositoryRoot,
    stagingParent,
    evidenceParent
  };
}

test('canonical catalog validates', () => {
  assert.deepEqual(
    validateCanonicalCatalog(overlayRoot),
    { pass: true, errors: [] }
  );
});

test('catalog contains exactly four canonical references', () => {
  const loaded = assertCanonicalCatalog(
    overlayRoot
  );

  assert.deepEqual(
    loaded.assets.map(asset => asset.ref).sort(),
    [...EXPECTED_REFS].sort()
  );
});

test('every template preserves the exact thirteen-section order', () => {
  const loaded = assertCanonicalCatalog(
    overlayRoot
  );

  for (const asset of loaded.assets) {
    const headings = asset.templateText
      .split(/\r?\n/u)
      .filter(line => line.startsWith('## '))
      .map(line => line.slice(3).trim());

    assert.deepEqual(
      headings,
      [...SECTION_ORDER],
      asset.ref
    );
  }
});

test('dependency relationship remains reference-only', () => {
  const loaded = assertCanonicalCatalog(
    overlayRoot
  );
  const asset = loaded.assets.find(
    candidate =>
      candidate.ref ===
      'SCF-DOC-DEPENDENCY-RELATIONSHIP@1.0.0'
  );

  assert.equal(
    asset.definition.status,
    'REFERENCE_ONLY'
  );
  assert.equal(
    asset.definition.authority.gateId,
    'SG-001'
  );
});

test('the three SG-002 instance families are authorized', () => {
  const loaded = assertCanonicalCatalog(
    overlayRoot
  );

  for (const asset of loaded.assets) {
    if (
      asset.ref ===
      'SCF-DOC-DEPENDENCY-RELATIONSHIP@1.0.0'
    ) {
      continue;
    }

    assert.equal(
      asset.definition.status,
      'AUTHORIZED',
      asset.ref
    );
    assert.equal(
      asset.definition.authority.gateId,
      'SG-002',
      asset.ref
    );
  }
});

test('all packaged example inputs validate', () => {
  const loaded = assertCanonicalCatalog(
    overlayRoot
  );

  for (const asset of loaded.assets) {
    assert.deepEqual(
      validateCanonicalInput({
        rootDirectory: overlayRoot,
        scaffoldReference: asset.ref,
        input: asset.exampleInput
      }),
      { pass: true, errors: [] },
      asset.ref
    );
  }
});

test('input validation rejects missing required fields', () => {
  const loaded = assertCanonicalCatalog(
    overlayRoot
  );
  const asset = loaded.assets[0];
  const input = structuredClone(
    asset.exampleInput
  );
  delete input.purpose;

  const result = validateCanonicalInput({
    rootDirectory: overlayRoot,
    scaffoldReference: asset.ref,
    input
  });

  assert.equal(result.pass, false);
  assert.equal(
    result.errors.includes(
      'MISSING_FIELD:$.purpose'
    ),
    true
  );
});

test('input validation rejects unknown fields', () => {
  const loaded = assertCanonicalCatalog(
    overlayRoot
  );
  const asset = loaded.assets[0];
  const input = {
    ...asset.exampleInput,
    invented: 'blocked'
  };

  const result = validateCanonicalInput({
    rootDirectory: overlayRoot,
    scaffoldReference: asset.ref,
    input
  });

  assert.equal(result.pass, false);
  assert.equal(
    result.errors.includes(
      'UNKNOWN_FIELD:$.invented'
    ),
    true
  );
});

test('input validation rejects invalid document IDs', () => {
  const loaded = assertCanonicalCatalog(
    overlayRoot
  );
  const asset = loaded.assets[0];
  const input = {
    ...asset.exampleInput,
    document_id: '../escape'
  };

  const result = validateCanonicalInput({
    rootDirectory: overlayRoot,
    scaffoldReference: asset.ref,
    input
  });

  assert.equal(result.pass, false);
  assert.equal(
    result.errors.includes(
      'PATTERN_MISMATCH:$.document_id'
    ),
    true
  );
});

test('input validation blocks token injection', () => {
  const loaded = assertCanonicalCatalog(
    overlayRoot
  );
  const asset = loaded.assets[0];
  const input = {
    ...asset.exampleInput,
    purpose: '{{injected}}'
  };

  const result = validateCanonicalInput({
    rootDirectory: overlayRoot,
    scaffoldReference: asset.ref,
    input
  });

  assert.equal(result.pass, false);
  assert.equal(
    result.errors.includes(
      'TOKEN_INJECTION_BLOCKED:$.purpose'
    ),
    true
  );
});

test('template tampering invalidates the catalog', () => {
  const copy = makeCatalogCopy();

  try {
    const template = path.join(
      copy,
      'forge/scaffolds/templates/' +
        'architecture-boundary.template.md'
    );
    fs.appendFileSync(template, '\nchanged\n');

    const result = validateCanonicalCatalog(
      copy
    );

    assert.equal(result.pass, false);
    assert.equal(
      result.errors.some(
        error =>
          error.startsWith(
            'TEMPLATE_HASH_MISMATCH:'
          )
      ),
      true
    );
  } finally {
    fs.rmSync(copy, {
      recursive: true,
      force: true
    });
  }
});

test('input-schema tampering invalidates the catalog', () => {
  const copy = makeCatalogCopy();

  try {
    const filename = path.join(
      copy,
      'forge/scaffolds/input-schemas/' +
        'domain-responsibility.schema.json'
    );
    const schema = JSON.parse(
      fs.readFileSync(filename, 'utf8')
    );
    schema.properties.title.minLength = 999;
    fs.writeFileSync(
      filename,
      `${JSON.stringify(schema, null, 2)}\n`
    );

    const result = validateCanonicalCatalog(
      copy
    );

    assert.equal(result.pass, false);
    assert.equal(
      result.errors.some(
        error =>
          error.startsWith(
            'INPUT_SCHEMA_HASH_MISMATCH:'
          )
      ),
      true
    );
  } finally {
    fs.rmSync(copy, {
      recursive: true,
      force: true
    });
  }
});

test('definition drift from registry is detected', () => {
  const copy = makeCatalogCopy();

  try {
    const filename = path.join(
      copy,
      'forge/scaffolds/definitions/' +
        'source-of-truth.definition.json'
    );
    const definition = JSON.parse(
      fs.readFileSync(filename, 'utf8')
    );
    definition.title = 'Drifted';
    fs.writeFileSync(
      filename,
      `${JSON.stringify(definition, null, 2)}\n`
    );

    const result = validateCanonicalCatalog(
      copy
    );

    assert.equal(result.pass, false);
    assert.equal(
      result.errors.some(
        error =>
          error.startsWith(
            'REGISTRY_DEFINITION_MISMATCH:'
          )
      ),
      true
    );
  } finally {
    fs.rmSync(copy, {
      recursive: true,
      force: true
    });
  }
});

test('authority snapshot tampering is detected', () => {
  const copy = makeCatalogCopy();

  try {
    const filename = path.join(
      copy,
      'forge/scaffolds/authority-snapshot.json'
    );
    const snapshot = JSON.parse(
      fs.readFileSync(filename, 'utf8')
    );
    snapshot.targetCommit = 'tampered';
    fs.writeFileSync(
      filename,
      `${JSON.stringify(snapshot, null, 2)}\n`
    );

    const result = validateCanonicalCatalog(
      copy
    );

    assert.equal(result.pass, false);
    assert.equal(
      result.errors.includes(
        'AUTHORITY_SNAPSHOT_HASH_MISMATCH'
      ),
      true
    );
  } finally {
    fs.rmSync(copy, {
      recursive: true,
      force: true
    });
  }
});

test('catalog summary is deterministic', () => {
  assert.deepEqual(
    catalogSummary(overlayRoot),
    catalogSummary(overlayRoot)
  );
});

test('dependency relationship cannot enter planning', () => {
  const loaded = assertCanonicalCatalog(
    overlayRoot
  );
  const registry = createScaffoldRegistry(
    loaded.registryValue
  );
  const asset = loaded.assets.find(
    candidate =>
      candidate.ref ===
      'SCF-DOC-DEPENDENCY-RELATIONSHIP@1.0.0'
  );
  const input = createCanonicalInputEnvelope({
    rootDirectory: overlayRoot,
    scaffoldReference: asset.ref,
    input: asset.exampleInput,
    path: '.forge21/scaffold-inputs/dependency.json'
  });

  assert.throws(
    () => buildScaffoldPlan({
      registry: loaded.registryValue,
      scaffoldReference: asset.ref,
      input,
      authoritySnapshot: {
        gateId:
          asset.definition.authority.gateId,
        ratified: true,
        sha256:
          asset.definition.authority
            .snapshotSha256
      },
      sourceRef:
        '71198a8a0c4cbff51b189f95966d6e97a0b89d3b',
      registrySha256: registry.hash,
      destinationInventory: {},
      runId: '20260724T040000Z-DEPENDENCY',
      planId: 'SPLAN-DEPENDENCY',
      createdAt: '2026-07-24T04:00:00Z'
    }),
    error =>
      error.code === 'SCAFFOLD_NOT_AUTHORIZED'
  );
});

for (const ref of [
  'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0',
  'SCF-DOC-DOMAIN-RESPONSIBILITY@1.0.0',
  'SCF-DOC-SOURCE-OF-TRUTH@1.0.0'
]) {
  test(`complete controlled lifecycle passes for ${ref}`, () => {
    const runtime = makeRuntimeRoots(
      'forge-wave6-lifecycle-'
    );

    try {
      const loaded = assertCanonicalCatalog(
        overlayRoot
      );
      const registry = createScaffoldRegistry(
        loaded.registryValue
      );
      const asset = loaded.assets.find(
        candidate => candidate.ref === ref
      );
      const identity =
        asset.exampleInput.document_id
          .replaceAll('_', '-');

      const input = createCanonicalInputEnvelope({
        rootDirectory: overlayRoot,
        scaffoldReference: ref,
        input: asset.exampleInput,
        path:
          `.forge21/scaffold-inputs/` +
          `${asset.exampleInput.document_id}.json`
      });

      assert.equal(input.validation.pass, true);

      const plan = buildScaffoldPlan({
        registry: loaded.registryValue,
        scaffoldReference: ref,
        input,
        authoritySnapshot: {
          gateId:
            asset.definition.authority.gateId,
          ratified: true,
          sha256:
            asset.definition.authority
              .snapshotSha256
        },
        sourceRef:
          '71198a8a0c4cbff51b189f95966d6e97a0b89d3b',
        registrySha256: registry.hash,
        destinationInventory: {},
        runId:
          '20260724T040000Z-' +
          identity,
        planId:
          'SPLAN-' +
          identity,
        createdAt:
          '2026-07-24T04:00:00Z'
      });

      const renderResult =
        renderScaffoldInMemory({
          plan,
          registry: loaded.registryValue,
          registrySha256: registry.hash,
          inputData: asset.exampleInput,
          templateText: asset.templateText
        });

      const staged = stageRenderedScaffold({
        renderResult,
        stagingParent:
          runtime.stagingParent,
        repositoryRoot:
          runtime.repositoryRoot
      });

      const before = snapshotRepositoryTree(
        runtime.repositoryRoot
      );

      const validationReport =
        validateRenderedScaffoldBundle({
          reportId:
            'SVRPT-' +
            identity,
          createdAt:
            '2026-07-24T04:00:05Z',
          renderResult,
          stagingDirectory:
            staged.stagingDirectory,
          registry: loaded.registryValue,
          registrySha256: registry.hash,
          inputData: asset.exampleInput,
          templateText: asset.templateText,
          repositoryRoot:
            runtime.repositoryRoot,
          upstreamValidations: [
            {
              id: 'SCV-001',
              status: 'PASS',
              evidence: [
                'SG001_SG002_GATE_COMPLETE'
              ]
            },
            {
              id: 'SCV-006',
              status: 'PASS',
              evidence: [
                'CANONICAL_INPUT_SCHEMA_PASS'
              ]
            }
          ],
          sideEffectSnapshot: {
            repositoryBefore:
              before.treeSha256,
            repositoryAfter:
              before.treeSha256,
            repositoryWrites: false,
            gitOperations: false,
            networkOperations: false,
            providerOperations: false
          }
        });

      assert.equal(
        validationReport.status,
        'PASS'
      );

      const approval = createApprovalRecord({
        approvalId:
          'SAPPR-' +
          identity,
        actor: 'PROJECT_OWNER',
        approvedAt:
          '2026-07-24T04:00:06Z',
        expiresAt: null,
        validationReport,
        renderResult,
        repositorySnapshot: before,
        decision: 'APPROVE_EXACT_PLAN'
      });

      const applyResult =
        applyApprovedScaffold({
          applyId:
            'SAPPLY-' +
            identity,
          approval,
          validationReport,
          renderResult,
          stagingDirectory:
            staged.stagingDirectory,
          repositoryRoot:
            runtime.repositoryRoot,
          appliedAt:
            '2026-07-24T04:00:07Z'
        });

      const receipt = createFinalReceipt({
        receiptId:
          'SRCPT-' +
          identity,
        validationReport,
        renderResult,
        approval,
        applyResult,
        repositoryRoot:
          runtime.repositoryRoot,
        environment: {
          engineVersion: '2.1.0',
          nodeVersion: process.version,
          platform: process.platform,
          sourceRef:
            '71198a8a0c4cbff51b189f95966d6e97a0b89d3b',
          workingTreeCleanBefore: true
        },
        startedAt:
          '2026-07-24T04:00:00Z',
        finishedAt:
          '2026-07-24T04:00:08Z'
      });

      assert.equal(receipt.status, 'PASS');
      assert.equal(
        verifyFinalReceipt(receipt),
        true
      );

      const target = path.join(
        runtime.repositoryRoot,
        renderResult.outputs[0].path
      );

      assert.equal(
        fs.existsSync(target),
        true
      );

      const generatedHeadings =
        fs.readFileSync(target, 'utf8')
          .split(/\r?\n/u)
          .filter(line => line.startsWith('## '))
          .map(line => line.slice(3).trim());

      assert.deepEqual(
        generatedHeadings,
        [...SECTION_ORDER]
      );
    } finally {
      fs.rmSync(runtime.base, {
        recursive: true,
        force: true
      });
    }
  });
}
