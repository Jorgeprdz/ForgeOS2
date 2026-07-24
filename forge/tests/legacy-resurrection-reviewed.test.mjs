import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

import {
  assertCatalog,
  buildCatalog,
  exportPreviewDirectory,
  isAllowedPreviewHost,
  renderDashboard,
  runCli,
  securityHeaders
} from '../compatibility/legacy-resurrection-reviewed.mjs';

function createFixture() {
  const root = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      'forge-reviewed-'
    )
  );

  fs.mkdirSync(
    path.join(root, 'tools'),
    { recursive: true }
  );
  fs.mkdirSync(
    path.join(
      root,
      'docs/static-preview/safe'
    ),
    { recursive: true }
  );
  fs.mkdirSync(
    path.join(
      root,
      'docs/static-preview/risky'
    ),
    { recursive: true }
  );

  fs.writeFileSync(
    path.join(
      root,
      'tools/forge-status.sh'
    ),
    '#!/usr/bin/env bash\nprintf "MUTATED\\n" > /tmp/should-never-execute\n'
  );
  fs.writeFileSync(
    path.join(
      root,
      'tools/deploy-production.sh'
    ),
    '#!/usr/bin/env bash\nsupabase functions deploy demo\n'
  );
  fs.writeFileSync(
    path.join(
      root,
      'docs/static-preview/safe/index.html'
    ),
    '<!doctype html><html><body>safe preview</body></html>\n'
  );
  fs.writeFileSync(
    path.join(
      root,
      'docs/static-preview/risky/index.html'
    ),
    '<!doctype html><script>fetch("https://example.test")</script>\n'
  );

  spawnSync(
    'git',
    ['-C', root, 'init'],
    { encoding: 'utf8' }
  );
  spawnSync(
    'git',
    [
      '-C',
      root,
      'config',
      'user.name',
      'Forge Test'
    ],
    { encoding: 'utf8' }
  );
  spawnSync(
    'git',
    [
      '-C',
      root,
      'config',
      'user.email',
      'forge@example.test'
    ],
    { encoding: 'utf8' }
  );
  spawnSync(
    'git',
    ['-C', root, 'add', '.'],
    { encoding: 'utf8' }
  );
  const commit = spawnSync(
    'git',
    [
      '-C',
      root,
      'commit',
      '-m',
      'fixture'
    ],
    { encoding: 'utf8' }
  );

  assert.equal(
    commit.status,
    0,
    `${commit.stdout}\n${commit.stderr}`
  );

  return root;
}

test(
  'catalogues commands but never authorizes their execution',
  () => {
    const root = createFixture();
    const catalog = buildCatalog({
      legacyRoot: root,
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });
    const status =
      catalog.entries.find(item =>
        item.path ===
          'tools/forge-status.sh'
      );

    assert.equal(
      status.launchPolicy,
      'COMMAND_CATALOG_ONLY'
    );
    assert.equal(
      status.runtimeExecutionAllowed,
      false
    );
    assert.equal(
      catalog.counts
        .legacyCommandsExecuted,
      0
    );
  }
);

test(
  'high-risk commands remain catalog-only',
  () => {
    const root = createFixture();
    const catalog = buildCatalog({
      legacyRoot: root,
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });
    const deploy =
      catalog.entries.find(item =>
        item.path ===
          'tools/deploy-production.sh'
      );

    assert.equal(
      deploy.launchPolicy,
      'HIGH_RISK_CATALOG_ONLY'
    );
  }
);

test(
  'allows inert previews and blocks network-active previews',
  () => {
    const root = createFixture();
    const catalog = buildCatalog({
      legacyRoot: root,
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });
    const safe =
      catalog.entries.find(item =>
        item.path.endsWith(
          'safe/index.html'
        )
      );
    const risky =
      catalog.entries.find(item =>
        item.path.endsWith(
          'risky/index.html'
        )
      );

    assert.equal(
      safe.launchPolicy,
      'ALLOW_SANDBOXED_PREVIEW'
    );
    assert.equal(
      risky.launchPolicy,
      'PREVIEW_REVIEW_REQUIRED'
    );
  }
);

test(
  'preview export uses committed Git bytes rather than modified working-tree bytes',
  () => {
    const root = createFixture();
    const catalog = buildCatalog({
      legacyRoot: root,
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });
    const safe =
      catalog.entries.find(item =>
        item.path.endsWith(
          'safe/index.html'
        )
      );

    fs.writeFileSync(
      path.join(root, safe.path),
      '<html>WORKTREE MUTATION</html>\n'
    );
    fs.writeFileSync(
      path.join(
        root,
        'docs/static-preview/safe/untracked-secret.txt'
      ),
      'secret\n'
    );

    const exported =
      exportPreviewDirectory({
        legacyRoot: root,
        entry: safe
      });

    try {
      const content =
        fs.readFileSync(
          path.join(
            exported.serveRoot,
            exported.entryFile
          ),
          'utf8'
        );

      assert.match(
        content,
        /safe preview/u
      );
      assert.doesNotMatch(
        content,
        /WORKTREE MUTATION/u
      );
      assert.equal(
        fs.existsSync(
          path.join(
            exported.serveRoot,
            'untracked-secret.txt'
          )
        ),
        false
      );
    } finally {
      fs.rmSync(
        exported.temporaryRoot,
        {
          recursive: true,
          force: true
        }
      );
    }
  }
);

test(
  'run command fails closed without executing legacy code',
  () => {
    const root = createFixture();
    const catalog = buildCatalog({
      legacyRoot: root,
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });
    const directory =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          'forge-reviewed-cli-'
        )
      );
    const catalogFile =
      path.join(
        directory,
        'catalog.json'
      );

    fs.writeFileSync(
      catalogFile,
      `${JSON.stringify(
        catalog,
        null,
        2
      )}\n`
    );

    const output = [];
    const errors = [];
    const rc = runCli(
      [
        '--catalog',
        catalogFile,
        '--legacy-root',
        root,
        'run',
        'anything'
      ],
      {
        stdout: {
          write(value) {
            output.push(value);
          }
        },
        stderr: {
          write(value) {
            errors.push(value);
          }
        }
      }
    );

    assert.equal(rc, 1);
    assert.match(
      errors.join(''),
      /LEGACY_COMMAND_EXECUTION_DISABLED/u
    );
    assert.equal(
      fs.existsSync(
        '/tmp/should-never-execute'
      ),
      false
    );
  }
);

test(
  'catalog hash is deterministic and verifies exact HEAD',
  () => {
    const root = createFixture();
    const first = buildCatalog({
      legacyRoot: root,
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });
    const second = buildCatalog({
      legacyRoot: root,
      generatedAt:
        '2026-07-25T00:00:00.000Z'
    });

    assert.equal(
      first.catalogHash,
      second.catalogHash
    );
    assert.equal(
      assertCatalog(first, root),
      true
    );
  }
);

test(
  'skips oversized tracked blobs before reading their contents',
  () => {
    const root = createFixture();
    const oversizedPath = path.join(
      root,
      'assets',
      'oversized.txt'
    );

    fs.mkdirSync(
      path.dirname(oversizedPath),
      { recursive: true }
    );
    fs.writeFileSync(
      oversizedPath,
      'x'.repeat(6 * 1024 * 1024)
    );
    spawnSync(
      'git',
      ['-C', root, 'add', '.'],
      { encoding: 'utf8' }
    );
    const commit = spawnSync(
      'git',
      [
        '-C',
        root,
        'commit',
        '-m',
        'oversized fixture'
      ],
      { encoding: 'utf8' }
    );

    assert.equal(
      commit.status,
      0,
      `${commit.stdout}\n${commit.stderr}`
    );

    const catalog = buildCatalog({
      legacyRoot: root,
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });

    assert.equal(
      catalog.counts
        .oversizedBlobsSkipped,
      1
    );
  }
);

test(
  'preview server rejects foreign Host headers and uses an opaque sandbox origin',
  () => {
    assert.equal(
      isAllowedPreviewHost(
        '127.0.0.1:8765',
        8765
      ),
      true
    );
    assert.equal(
      isAllowedPreviewHost(
        'attacker.example:8765',
        8765
      ),
      false
    );

    const headers = securityHeaders();

    assert.match(
      headers['Content-Security-Policy'],
      /sandbox allow-scripts(?:;|$)/u
    );
    assert.doesNotMatch(
      headers['Content-Security-Policy'],
      /allow-same-origin/u
    );
    assert.match(
      headers['Permissions-Policy'],
      /camera=\(\)/u
    );
  }
);

test(
  'dashboard renderer emits no trailing whitespace',
  () => {
    const root = createFixture();
    const catalog = buildCatalog({
      legacyRoot: root,
      generatedAt:
        '2026-07-24T00:00:00.000Z'
    });
    const html = renderDashboard(catalog);

    assert.equal(
      /[ \t]+$/mu.test(html),
      false
    );
    assert.equal(
      html.endsWith('\n'),
      true
    );
  }
);
