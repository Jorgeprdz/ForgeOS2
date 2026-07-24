#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export class LegacyCompatibilityError extends Error {
  constructor(code, details = []) {
    super(
      `${code}${
        details.length > 0
          ? `:${details.join('|')}`
          : ''
      }`
    );
    this.name = 'LegacyCompatibilityError';
    this.code = code;
    this.details = Object.freeze([...details]);
  }
}

const SHELL_EXTENSIONS = new Set([
  '.sh',
  '.bash'
]);

const NODE_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs'
]);

const PREVIEW_TEXT_EXTENSIONS = new Set([
  '.html',
  '.htm',
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.json',
  '.svg',
  '.txt'
]);

const PREVIEW_BLOCK_PATTERNS = Object.freeze([
  /\bfetch\s*\(/iu,
  /\bXMLHttpRequest\b/iu,
  /\bWebSocket\b/iu,
  /\bEventSource\b/iu,
  /\bnavigator\.sendBeacon\b/iu,
  /<form\b/iu,
  /http-equiv\s*=\s*['"]?refresh/iu,
  /\bwindow\.location\s*=/iu,
  /\blocation\.href\s*=/iu,
  /(?:secret|password|private[-_ ]key|service[-_ ]role)/iu
]);

const HIGH_RISK_PATTERNS = Object.freeze([
  /(?:^|[-_/])(compensation|commission|bonus|payout|cashflow|payment)(?:[-_.\/]|$)/iu,
  /(?:^|[-_/])(policy|underwriting|beneficiary|premium|issuance)(?:[-_.\/]|$)/iu,
  /(?:^|[-_/])(auth|identity|security|permission|role)(?:[-_.\/]|$)/iu,
  /(?:^|[-_/])(deploy|migration|production|release)(?:[-_.\/]|$)/iu,
  /(?:product[-_/ ]truth|financial[-_/ ]truth|source[-_/ ]of[-_/ ]truth)/iu,
  /(?:secret|token|password|private[-_ ]key|service[-_ ]role)/iu
]);

const DOMAIN_HINTS = Object.freeze([
  ['compensation', /compensation|commission|bonus|payout|cashflow/iu],
  ['policyOperations', /policy|underwriting|premium|beneficiary|issuance/iu],
  ['productIntelligence', /product[-_/ ]?(?:truth|evidence|intelligence)/iu],
  ['quoting', /quote|quotation|proposal|illustration|gmm/iu],
  ['advisorDevelopment', /advisor|training|coaching|career|development/iu],
  ['recruitment', /recruit|candidate|talent|hiring|onboarding/iu],
  ['managerTeam', /manager|leadership|team/iu],
  ['crmClient', /crm|client|prospect|lead|follow[-_ ]?up/iu],
  ['analyticsPlanning', /analytics|forecast|goal|metric|planning|dashboard/iu],
  ['integrations', /integration|adapter|provider|connector|webhook|external/iu],
  ['persistence', /database|storage|repository|supabase|cache/iu],
  ['identitySecurity', /auth|identity|security|permission|role/iu],
  ['userExperience', /ui|ux|screen|page|component|preview|frontend/iu],
  ['governance', /governance|constitution|architecture|adr|ratification/iu],
  ['tooling', /tool|script|cli|doctor|audit|test/iu]
]);

const MIME_TYPES = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
});

function isPlainObject(value) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value);
}

function canonicalize(value) {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new LegacyCompatibilityError(
        'NON_FINITE_VALUE'
      );
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter(
          key => value[key] !== undefined
        )
        .map(key => [
          key,
          canonicalize(value[key])
        ])
    );
  }

  throw new LegacyCompatibilityError(
    'UNSUPPORTED_VALUE'
  );
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

function runGit(
  repository,
  args,
  {
    encoding = 'utf8',
    maxBuffer =
      128 * 1024 * 1024
  } = {}
) {
  const result = spawnSync(
    'git',
    ['-C', repository, ...args],
    {
      encoding,
      maxBuffer
    }
  );

  if (
    result.error
    || result.status !== 0
  ) {
    throw new LegacyCompatibilityError(
      'LEGACY_GIT_COMMAND_FAILED',
      [
        args.join(' '),
        result.error?.message
          ?? String(result.stderr ?? '').trim()
      ]
    );
  }

  return result.stdout;
}

function legacyHead(repository) {
  return String(
    runGit(
      repository,
      ['rev-parse', 'HEAD']
    )
  ).trim();
}

const MAX_TEXT_BLOB_BYTES =
  2 * 1024 * 1024;

function treeEntries(repository) {
  const output = runGit(
    repository,
    [
      'ls-tree',
      '-r',
      '-l',
      '-z',
      'HEAD'
    ],
    {
      encoding: 'buffer'
    }
  );

  return Buffer.from(output)
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .map(record => {
      const match =
        /^(\d+)\s+(blob|commit)\s+([a-f0-9]+)\s+([0-9-]+)\t(.+)$/u
          .exec(record);

      if (!match) {
        throw new LegacyCompatibilityError(
          'LEGACY_TREE_RECORD_INVALID',
          [record]
        );
      }

      const sizeBytes =
        match[4] === '-'
          ? null
          : Number(match[4]);

      if (
        sizeBytes !== null
        && !Number.isSafeInteger(sizeBytes)
      ) {
        throw new LegacyCompatibilityError(
          'LEGACY_BLOB_SIZE_INVALID',
          [record]
        );
      }

      return {
        mode: match[1],
        type: match[2],
        blobSha: match[3],
        sizeBytes,
        path: match[5]
      };
    })
    .filter(item =>
      item.type === 'blob'
    );
}

function readBlob(
  repository,
  blobSha,
  sizeBytes
) {
  if (
    Number.isSafeInteger(sizeBytes)
    && sizeBytes > MAX_TEXT_BLOB_BYTES
  ) {
    return null;
  }

  const output = runGit(
    repository,
    [
      'cat-file',
      '-p',
      blobSha
    ],
    {
      encoding: 'buffer',
      maxBuffer:
        MAX_TEXT_BLOB_BYTES
        + 256 * 1024
    }
  );

  const buffer = Buffer.from(output);

  if (
    buffer.length > MAX_TEXT_BLOB_BYTES
    || buffer.includes(0)
  ) {
    return null;
  }

  return buffer;
}

function normalize(value) {
  return String(value ?? '')
    .replace(/([a-z0-9])([A-Z])/gu, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

function entryId(file) {
  const base = normalize(
    path.posix.basename(
      file,
      path.posix.extname(file)
    )
  ).slice(0, 56);

  return `${base || 'legacy-entry'}-${sha256(file).slice(0, 10)}`;
}

function classifyDomain(
  file,
  text
) {
  const haystack =
    `${file}\n${text.slice(0, 12000)}`;

  for (
    const [domain, pattern]
    of DOMAIN_HINTS
  ) {
    if (pattern.test(haystack)) {
      return domain;
    }
  }

  return 'unclassified';
}

function candidateType(
  file,
  text
) {
  const extension =
    path.posix.extname(file).toLowerCase();
  const basename =
    path.posix.basename(file).toLowerCase();

  if (
    file.startsWith('docs/static-preview/')
    && (
      extension === '.html'
      || extension === '.htm'
    )
  ) {
    return 'STATIC_PREVIEW';
  }

  if (
    SHELL_EXTENSIONS.has(extension)
    && (
      text.startsWith('#!')
      || file.startsWith('tools/')
      || file.startsWith('scripts/')
    )
  ) {
    return 'SHELL';
  }

  if (
    NODE_EXTENSIONS.has(extension)
    && !/(?:^|\/)(?:test|tests|fixtures)(?:\/|$)/u
      .test(file)
    && (
      text.startsWith('#!/usr/bin/env node')
      || /\bprocess\.argv\b/u.test(text)
      || /\bprocess\.exit(?:Code)?\b/u.test(text)
      || /\bimport\.meta\.url\b/u.test(text)
      || basename.includes('cli')
    )
  ) {
    return 'NODE';
  }

  return null;
}

function syntaxProbe({
  file,
  type,
  bytes
}) {
  if (type === 'STATIC_PREVIEW') {
    const text = bytes.toString('utf8');

    return {
      status:
        /<html|<!doctype\s+html/iu.test(text)
          ? 'PASS'
          : 'FAIL',
      command: null,
      exitCode: null,
      output:
        'Immutable HTML blob inspected.'
    };
  }

  const directory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        'forge-compat-syntax-'
      )
    );
  const temporary = path.join(
    directory,
    path.basename(file)
  );

  try {
    fs.writeFileSync(
      temporary,
      bytes,
      { mode: 0o600 }
    );

    const command =
      type === 'SHELL'
        ? ['bash', '-n', temporary]
        : ['node', '--check', temporary];

    const result = spawnSync(
      command[0],
      command.slice(1),
      {
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer:
          2 * 1024 * 1024
      }
    );

    const logicalCommand =
      type === 'SHELL'
        ? `bash -n ${file}`
        : `node --check ${file}`;
    const rawOutput = [
      result.stdout ?? '',
      result.stderr ?? '',
      result.error?.message ?? ''
    ].join('\n');

    return {
      status:
        result.status === 0
          ? 'PASS'
          : 'FAIL',
      command: logicalCommand,
      exitCode:
        Number.isInteger(result.status)
          ? result.status
          : null,
      output: rawOutput
        .replaceAll(temporary, file)
        .replace(/\s+/gu, ' ')
        .trim()
        .slice(0, 600)
    };
  } finally {
    fs.rmSync(
      directory,
      {
        recursive: true,
        force: true
      }
    );
  }
}

function highRiskEvidence(
  file,
  text
) {
  const haystack =
    `${file}\n${text.slice(0, 50000)}`;

  return HIGH_RISK_PATTERNS
    .filter(pattern =>
      pattern.test(haystack)
    )
    .map(pattern =>
      pattern.source
    );
}

function previewEvidence({
  repository,
  directory,
  entries
}) {
  const evidence = [];

  for (
    const entry of entries.filter(item =>
      item.path === directory
      || item.path.startsWith(
        `${directory}/`
      )
    )
  ) {
    const extension =
      path.posix.extname(
        entry.path
      ).toLowerCase();

    if (
      !PREVIEW_TEXT_EXTENSIONS.has(
        extension
      )
    ) {
      continue;
    }

    const bytes = readBlob(
      repository,
      entry.blobSha,
      entry.sizeBytes
    );

    if (bytes === null) {
      continue;
    }

    const text =
      bytes.toString('utf8');

    for (
      const pattern
      of PREVIEW_BLOCK_PATTERNS
    ) {
      if (pattern.test(text)) {
        evidence.push({
          path: entry.path,
          pattern: pattern.source
        });
      }
    }
  }

  return evidence
    .sort((left, right) =>
      left.path.localeCompare(
        right.path
      )
      || left.pattern.localeCompare(
        right.pattern
      )
    );
}

function launchPolicy({
  file,
  type,
  text,
  syntax,
  previewRisk
}) {
  if (syntax.status !== 'PASS') {
    return {
      policy: 'BLOCKED_SYNTAX',
      reasons: [
        'SYNTAX_OR_DOCUMENT_PROBE_FAILED'
      ]
    };
  }

  if (type === 'STATIC_PREVIEW') {
    if (previewRisk.length > 0) {
      return {
        policy:
          'PREVIEW_REVIEW_REQUIRED',
        reasons: [
          'ACTIVE_OR_NETWORK_PREVIEW_PATTERN_DETECTED'
        ]
      };
    }

    return {
      policy:
        'ALLOW_SANDBOXED_PREVIEW',
      reasons: [
        'IMMUTABLE_STATIC_PREVIEW',
        'LOCALHOST_ONLY',
        'CSP_SANDBOXED'
      ]
    };
  }

  const highRisk =
    highRiskEvidence(file, text);

  return {
    policy:
      highRisk.length > 0
        ? 'HIGH_RISK_CATALOG_ONLY'
        : 'COMMAND_CATALOG_ONLY',
    reasons:
      highRisk.length > 0
        ? [
          'HIGH_RISK_BOUNDARY',
          'LEGACY_EXECUTION_DISABLED'
        ]
        : [
          'LEGACY_EXECUTION_DISABLED'
        ]
  };
}

export function buildCatalog({
  legacyRoot,
  generatedAt =
    new Date().toISOString(),
  onProgress = null
}) {
  const head =
    legacyHead(legacyRoot);
  const tracked =
    treeEntries(legacyRoot);
  const entries = [];
  let scannedFiles = 0;

  for (const trackedEntry of tracked) {
    scannedFiles += 1;

    if (
      typeof onProgress === 'function'
      && (
        scannedFiles === 1
        || scannedFiles % 250 === 0
        || scannedFiles === tracked.length
      )
    ) {
      onProgress({
        scannedFiles,
        totalFiles: tracked.length
      });
    }
    const bytes = readBlob(
      legacyRoot,
      trackedEntry.blobSha,
      trackedEntry.sizeBytes
    );

    if (bytes === null) {
      continue;
    }

    const text =
      bytes.toString('utf8');
    const type = candidateType(
      trackedEntry.path,
      text
    );

    if (!type) continue;

    const syntax = syntaxProbe({
      file: trackedEntry.path,
      type,
      bytes
    });
    const previewDirectory =
      type === 'STATIC_PREVIEW'
        ? path.posix.dirname(
          trackedEntry.path
        )
        : null;
    const previewRisk =
      type === 'STATIC_PREVIEW'
        ? previewEvidence({
          repository: legacyRoot,
          directory:
            previewDirectory,
          entries: tracked
        })
        : [];
    const policy = launchPolicy({
      file: trackedEntry.path,
      type,
      text,
      syntax,
      previewRisk
    });

    entries.push({
      id:
        entryId(trackedEntry.path),
      path:
        trackedEntry.path,
      type,
      domain:
        classifyDomain(
          trackedEntry.path,
          text
        ),
      mode:
        trackedEntry.mode,
      blobSha:
        trackedEntry.blobSha,
      sizeBytes:
        trackedEntry.sizeBytes,
      syntax,
      launchPolicy:
        policy.policy,
      policyReasons:
        policy.reasons,
      previewDirectory,
      previewRisk,
      runtimeExecutionAllowed: false,
      parityStatus:
        'LEGACY_CATALOG_ONLY_NOT_NATIVE_V2_PARITY'
    });
  }

  entries.sort((left, right) =>
    left.launchPolicy.localeCompare(
      right.launchPolicy
    )
    || left.domain.localeCompare(
      right.domain
    )
    || left.path.localeCompare(
      right.path
    )
  );

  const catalog = {
    schemaVersion: 2,
    kind:
      'FORGE_LEGACY_COMPATIBILITY_CATALOG_REVIEWED',
    generatedAt,
    source: {
      legacyHead: head,
      bytesPolicy:
        'IMMUTABLE_GIT_BLOBS_ONLY'
    },
    safety: {
      executesLegacyCommands: false,
      servesWorkingTreeBytes: false,
      servesUntrackedFiles: false,
      previewBindAddress:
        '127.0.0.1',
      previewHostValidation: true,
      previewOpaqueOrigin: true,
      previewCspSandbox: true,
      grantsV2Parity: false
    },
    counts: {
      trackedFiles:
        tracked.length,
      oversizedBlobsSkipped:
        tracked.filter(item =>
          Number.isSafeInteger(
            item.sizeBytes
          )
          && item.sizeBytes
            > MAX_TEXT_BLOB_BYTES
        ).length,
      discoveredEntrypoints:
        entries.length,
      shellCommands:
        entries.filter(item =>
          item.type === 'SHELL'
        ).length,
      nodeCommands:
        entries.filter(item =>
          item.type === 'NODE'
        ).length,
      staticPreviews:
        entries.filter(item =>
          item.type ===
            'STATIC_PREVIEW'
        ).length,
      sandboxedPreviews:
        entries.filter(item =>
          item.launchPolicy ===
            'ALLOW_SANDBOXED_PREVIEW'
        ).length,
      previewReviewRequired:
        entries.filter(item =>
          item.launchPolicy ===
            'PREVIEW_REVIEW_REQUIRED'
        ).length,
      commandCatalogOnly:
        entries.filter(item =>
          item.launchPolicy ===
            'COMMAND_CATALOG_ONLY'
          || item.launchPolicy ===
            'HIGH_RISK_CATALOG_ONLY'
        ).length,
      blockedSyntax:
        entries.filter(item =>
          item.launchPolicy ===
            'BLOCKED_SYNTAX'
        ).length,
      legacyCommandsExecuted: 0,
      parityVerified: 0
    },
    entries,
    parity: {
      verifiedCapabilities: 0,
      compatibilityIsNotParity: true
    }
  };

  catalog.catalogHash = sha256(
    canonicalJson({
      ...catalog,
      generatedAt: null,
      catalogHash: undefined
    })
  );

  return catalog;
}

export function assertCatalog(
  catalog,
  legacyRoot
) {
  if (
    catalog.kind !==
      'FORGE_LEGACY_COMPATIBILITY_CATALOG_REVIEWED'
  ) {
    throw new LegacyCompatibilityError(
      'CATALOG_KIND_INVALID'
    );
  }

  if (
    catalog.source?.legacyHead
      !== legacyHead(legacyRoot)
  ) {
    throw new LegacyCompatibilityError(
      'LEGACY_HEAD_MISMATCH'
    );
  }

  const expected = sha256(
    canonicalJson({
      ...catalog,
      generatedAt: null,
      catalogHash: undefined
    })
  );

  if (
    catalog.catalogHash !== expected
  ) {
    throw new LegacyCompatibilityError(
      'CATALOG_HASH_MISMATCH'
    );
  }

  if (
    catalog.counts
      ?.legacyCommandsExecuted !== 0
    || catalog.parity
      ?.verifiedCapabilities !== 0
  ) {
    throw new LegacyCompatibilityError(
      'UNPROVEN_EXECUTION_OR_PARITY'
    );
  }

  return true;
}

function entryById(
  catalog,
  id
) {
  const entry =
    catalog.entries.find(item =>
      item.id === id
    );

  if (!entry) {
    throw new LegacyCompatibilityError(
      'ENTRY_NOT_FOUND',
      [id]
    );
  }

  return entry;
}

function assertEntryBlob({
  legacyRoot,
  entry
}) {
  const actual = String(
    runGit(
      legacyRoot,
      [
        'rev-parse',
        `HEAD:${entry.path}`
      ]
    )
  ).trim();

  if (actual !== entry.blobSha) {
    throw new LegacyCompatibilityError(
      'ENTRY_BLOB_MISMATCH',
      [
        entry.path,
        entry.blobSha,
        actual
      ]
    );
  }

  return true;
}

function rejectSymlinks(root) {
  const queue = [root];

  while (queue.length > 0) {
    const current = queue.pop();
    const stat = fs.lstatSync(current);

    if (stat.isSymbolicLink()) {
      throw new LegacyCompatibilityError(
        'PREVIEW_SYMLINK_REJECTED',
        [current]
      );
    }

    if (!stat.isDirectory()) {
      continue;
    }

    for (
      const child
      of fs.readdirSync(current)
    ) {
      queue.push(
        path.join(current, child)
      );
    }
  }
}

export function exportPreviewDirectory({
  legacyRoot,
  entry
}) {
  assertEntryBlob({
    legacyRoot,
    entry
  });

  if (
    entry.launchPolicy !==
      'ALLOW_SANDBOXED_PREVIEW'
    || entry.type !==
      'STATIC_PREVIEW'
  ) {
    throw new LegacyCompatibilityError(
      'ENTRY_NOT_PREVIEWABLE',
      [entry.id]
    );
  }

  const directory =
    entry.previewDirectory;
  const destination =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        'forge-preview-'
      )
    );

  try {
    const archive = runGit(
      legacyRoot,
      [
        'archive',
        '--format=tar',
        'HEAD',
        '--',
        directory
      ],
      {
        encoding: 'buffer',
        maxBuffer:
          256 * 1024 * 1024
      }
    );

    const extract = spawnSync(
      'tar',
      [
        '-xf',
        '-',
        '-C',
        destination
      ],
      {
        input: archive,
        encoding: 'buffer',
        maxBuffer:
          16 * 1024 * 1024
      }
    );

    if (
      extract.error
      || extract.status !== 0
    ) {
      throw new LegacyCompatibilityError(
        'PREVIEW_ARCHIVE_EXTRACTION_FAILED',
        [
          extract.error?.message
            ?? Buffer.from(
              extract.stderr ?? []
            ).toString('utf8')
        ]
      );
    }

    const root = path.join(
      destination,
      directory
    );

    rejectSymlinks(root);

    return {
      temporaryRoot:
        destination,
      serveRoot: root,
      entryFile:
        path.basename(entry.path)
    };
  } catch (error) {
    fs.rmSync(
      destination,
      {
        recursive: true,
        force: true
      }
    );
    throw error;
  }
}

function contentType(file) {
  return MIME_TYPES[
    path.extname(file).toLowerCase()
  ] ?? 'application/octet-stream';
}

function safeRequestFile({
  serveRoot,
  entryFile,
  requestUrl
}) {
  const url = new URL(
    requestUrl,
    'http://127.0.0.1'
  );
  let pathname;

  try {
    pathname =
      decodeURIComponent(url.pathname);
  } catch {
    throw new LegacyCompatibilityError(
      'REQUEST_PATH_INVALID'
    );
  }

  if (
    pathname.includes('\0')
    || pathname.includes('\\')
  ) {
    throw new LegacyCompatibilityError(
      'REQUEST_PATH_INVALID'
    );
  }

  const relative =
    pathname === '/'
      ? entryFile
      : pathname.replace(/^\/+/u, '');
  let resolved = path.resolve(
    serveRoot,
    relative
  );
  const rootPrefix =
    `${path.resolve(serveRoot)}${path.sep}`;

  if (
    resolved !== path.resolve(serveRoot)
    && !resolved.startsWith(rootPrefix)
  ) {
    throw new LegacyCompatibilityError(
      'REQUEST_PATH_ESCAPE'
    );
  }

  if (
    fs.existsSync(resolved)
    && fs.statSync(resolved)
      .isDirectory()
  ) {
    resolved = path.join(
      resolved,
      'index.html'
    );
  }

  return resolved;
}

export function securityHeaders() {
  return {
    'Cache-Control': 'no-store',
    'Content-Security-Policy': [
      "sandbox allow-scripts",
      "default-src 'self' data: blob:",
      "connect-src 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      "script-src 'self' 'unsafe-inline'"
    ].join('; '),
    'Cross-Origin-Opener-Policy':
      'same-origin',
    'Cross-Origin-Resource-Policy':
      'same-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Referrer-Policy':
      'no-referrer',
    'X-Content-Type-Options':
      'nosniff',
    'X-Frame-Options':
      'DENY'
  };
}

export function isAllowedPreviewHost(
  host,
  port
) {
  return host === `127.0.0.1:${port}`;
}

function servePreview({
  legacyRoot,
  catalog,
  id,
  port
}) {
  assertCatalog(
    catalog,
    legacyRoot
  );
  const entry =
    entryById(catalog, id);
  const exported =
    exportPreviewDirectory({
      legacyRoot,
      entry
    });

  const cleanup = () => {
    fs.rmSync(
      exported.temporaryRoot,
      {
        recursive: true,
        force: true
      }
    );
  };

  const server = http.createServer(
    (request, response) => {
      try {
        if (
          !isAllowedPreviewHost(
            request.headers.host ?? '',
            port
          )
        ) {
          response.writeHead(
            421,
            securityHeaders()
          );
          response.end('Misdirected request\n');
          return;
        }

        if (
          request.method !== 'GET'
          && request.method !== 'HEAD'
        ) {
          response.writeHead(
            405,
            {
              ...securityHeaders(),
              Allow: 'GET, HEAD'
            }
          );
          response.end();
          return;
        }

        const file = safeRequestFile({
          serveRoot:
            exported.serveRoot,
          entryFile:
            exported.entryFile,
          requestUrl:
            request.url ?? '/'
        });

        if (
          !fs.existsSync(file)
          || !fs.statSync(file)
            .isFile()
        ) {
          response.writeHead(
            404,
            securityHeaders()
          );
          response.end('Not found\n');
          return;
        }

        response.writeHead(
          200,
          {
            ...securityHeaders(),
            'Content-Type':
              contentType(file)
          }
        );

        if (
          request.method === 'HEAD'
        ) {
          response.end();
          return;
        }

        fs.createReadStream(file)
          .pipe(response);
      } catch {
        response.writeHead(
          400,
          securityHeaders()
        );
        response.end('Bad request\n');
      }
    }
  );

  server.on('error', error => {
    cleanup();
    process.stderr.write(
      `PREVIEW_SERVER_ERROR=${error.message}\n`
    );
    process.exitCode = 1;
  });

  for (
    const signal
    of ['SIGINT', 'SIGTERM']
  ) {
    process.once(signal, () => {
      server.close(() => {
        cleanup();
        process.exit(0);
      });
    });
  }

  process.once('exit', cleanup);

  server.listen(
    port,
    '127.0.0.1',
    () => {
      process.stdout.write(
        'FORGE_PREVIEW_SERVER=PASS\n'
      );
      process.stdout.write(
        `ENTRY_ID=${entry.id}\n`
      );
      process.stdout.write(
        `URL=http://127.0.0.1:${port}/\n`
      );
      process.stdout.write(
        'SOURCE=IMMUTABLE_GIT_ARCHIVE\n'
      );
      process.stdout.write(
        'UNTRACKED_FILES_SERVED=0\n'
      );
    }
  );
}

function renderMarkdown(catalog) {
  const lines = [];

  lines.push(
    '# Forge Original Compatibility Catalog — Reviewed'
  );
  lines.push('');
  lines.push(
    `- Legacy HEAD: \`${catalog.source.legacyHead}\``
  );
  lines.push(
    `- Catalog hash: \`${catalog.catalogHash}\``
  );
  lines.push(
    `- Entrypoints catalogued: ${catalog.counts.discoveredEntrypoints}`
  );
  lines.push(
    `- Sandboxed previews: ${catalog.counts.sandboxedPreviews}`
  );
  lines.push(
    `- Commands catalog-only: ${catalog.counts.commandCatalogOnly}`
  );
  lines.push(
    '- Legacy commands executed automatically: 0'
  );
  lines.push(
    '- Native V2 parity verified: 0'
  );
  lines.push('');
  lines.push(
    'Shell and Node entrypoints are discoverable but intentionally non-executable until each one receives a governed adapter.'
  );
  lines.push('');
  lines.push('## Available sandboxed previews');
  lines.push('');
  lines.push(
    '| ID | Domain | Legacy path |'
  );
  lines.push(
    '|---|---|---|'
  );

  for (
    const entry of catalog.entries
      .filter(item =>
        item.launchPolicy ===
          'ALLOW_SANDBOXED_PREVIEW'
      )
  ) {
    lines.push(
      `| \`${entry.id}\` | ${entry.domain} | \`${entry.path}\` |`
    );
  }

  lines.push('');
  lines.push('## Commands');
  lines.push('');
  lines.push('```bash');
  lines.push(
    'forge-original-reviewed doctor'
  );
  lines.push(
    'forge-original-reviewed list'
  );
  lines.push(
    'forge-original-reviewed describe ENTRY_ID'
  );
  lines.push(
    'forge-original-reviewed serve ENTRY_ID 8765'
  );
  lines.push('```');

  return `${lines.join('\n')}\n`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderDashboard(catalog) {
  const rows = catalog.entries
    .map(entry => [
      '      <tr>',
      `        <td><code>${escapeHtml(entry.id)}</code></td>`,
      `        <td>${escapeHtml(entry.type)}</td>`,
      `        <td>${escapeHtml(entry.domain)}</td>`,
      `        <td>${escapeHtml(entry.launchPolicy)}</td>`,
      `        <td><code>${escapeHtml(entry.path)}</code></td>`,
      '      </tr>'
    ].join('\n'))
    .join('\n');

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Forge Compatibility — Reviewed</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, sans-serif; }
    body { max-width: 1280px; margin: auto; padding: 24px; background: #111; color: #eee; }
    .hero, .card { border: 1px solid #444; border-radius: 16px; background: #191919; }
    .hero { padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 12px; margin: 18px 0; }
    .card { padding: 16px; }
    .number { font-size: 2rem; font-weight: 700; }
    .warning { color: #ffd479; }
    table { width: 100%; border-collapse: collapse; margin-top: 22px; }
    th, td { padding: 10px; border-bottom: 1px solid #333; text-align: left; vertical-align: top; }
    code { overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <section class="hero">
    <h1>Forge Original — Compatibility Reviewed</h1>
    <p>Legacy HEAD <code>${escapeHtml(catalog.source.legacyHead)}</code></p>
    <p class="warning">Los comandos legacy se catalogan, pero no se ejecutan. Solo previews aprobados se sirven desde blobs Git inmutables, en localhost y con CSP.</p>
  </section>
  <section class="grid">
    <div class="card"><div class="number">${catalog.counts.discoveredEntrypoints}</div><div>Entrypoints catalogados</div></div>
    <div class="card"><div class="number">${catalog.counts.sandboxedPreviews}</div><div>Previews aislados</div></div>
    <div class="card"><div class="number">${catalog.counts.commandCatalogOnly}</div><div>Comandos sin ejecución</div></div>
    <div class="card"><div class="number">0</div><div>Comandos legacy autoejecutados</div></div>
  </section>
  <table>
    <thead><tr><th>ID</th><th>Tipo</th><th>Dominio</th><th>Política</th><th>Ruta</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  return `${html
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n*$/u, '')}\n`;
}

function parseArgs(argv) {
  const positional = [];
  const flags = new Map();

  for (
    let index = 0;
    index < argv.length;
    index += 1
  ) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }

    const value = argv[index + 1];

    if (
      !value
      || value.startsWith('--')
    ) {
      throw new LegacyCompatibilityError(
        'CLI_OPTION_VALUE_REQUIRED',
        [token]
      );
    }

    if (
      flags.has(token.slice(2))
    ) {
      throw new LegacyCompatibilityError(
        'DUPLICATE_CLI_OPTION',
        [token]
      );
    }

    flags.set(
      token.slice(2),
      value
    );
    index += 1;
  }

  return {
    positional,
    flags
  };
}

function required(flags, name) {
  const value = flags.get(name);

  if (!value) {
    throw new LegacyCompatibilityError(
      'CLI_OPTION_REQUIRED',
      [`--${name}`]
    );
  }

  return path.resolve(value);
}

function writeAtomic(file, content) {
  fs.mkdirSync(
    path.dirname(file),
    { recursive: true }
  );
  const temporary =
    `${file}.${process.pid}.${Date.now()}.tmp`;

  fs.writeFileSync(
    temporary,
    content,
    { mode: 0o600 }
  );
  fs.renameSync(
    temporary,
    file
  );
}

export function runCli(
  argv = process.argv.slice(2),
  io = {
    stdout: process.stdout,
    stderr: process.stderr
  }
) {
  try {
    const {
      positional,
      flags
    } = parseArgs(argv);
    const command =
      positional[0] ?? 'help';

    if (command === 'scan') {
      const legacyRoot =
        required(flags, 'legacy-root');
      const catalogFile =
        required(flags, 'catalog');
      const markdownFile =
        required(flags, 'markdown');
      const dashboardFile =
        required(flags, 'dashboard');
      const catalog =
        buildCatalog({
          legacyRoot,
          onProgress({
            scannedFiles,
            totalFiles
          }) {
            io.stdout.write(
              `SCAN_PROGRESS=${scannedFiles}/${totalFiles}\n`
            );
          }
        });

      writeAtomic(
        catalogFile,
        `${JSON.stringify(
          catalog,
          null,
          2
        )}\n`
      );
      writeAtomic(
        markdownFile,
        renderMarkdown(catalog)
      );
      writeAtomic(
        dashboardFile,
        renderDashboard(catalog)
      );

      io.stdout.write(
        'REVIEWED_COMPATIBILITY_SCAN=PASS\n'
      );

      for (
        const [key, value]
        of Object.entries(
          catalog.counts
        )
      ) {
        io.stdout.write(
          `${key.replace(/([A-Z])/gu, '_$1').toUpperCase()}=${value}\n`
        );
      }

      io.stdout.write(
        `CATALOG_HASH=${catalog.catalogHash}\n`
      );

      return 0;
    }

    const legacyRoot =
      required(flags, 'legacy-root');
    const catalogFile =
      required(flags, 'catalog');
    const catalog =
      JSON.parse(
        fs.readFileSync(
          catalogFile,
          'utf8'
        )
      );

    if (command === 'doctor') {
      assertCatalog(
        catalog,
        legacyRoot
      );

      io.stdout.write(
        'FORGE_ORIGINAL_REVIEWED_DOCTOR=PASS\n'
      );
      io.stdout.write(
        `LEGACY_HEAD=${catalog.source.legacyHead}\n`
      );
      io.stdout.write(
        `SANDBOXED_PREVIEWS=${catalog.counts.sandboxedPreviews}\n`
      );
      io.stdout.write(
        'LEGACY_COMMAND_EXECUTION=DISABLED\n'
      );
      io.stdout.write(
        'NATIVE_V2_PARITY_VERIFIED=0\n'
      );

      return 0;
    }

    if (command === 'list') {
      assertCatalog(
        catalog,
        legacyRoot
      );

      for (
        const entry
        of catalog.entries
      ) {
        io.stdout.write(
          `${entry.id}\t${entry.type}\t${entry.domain}\t${entry.launchPolicy}\t${entry.path}\n`
        );
      }

      return 0;
    }

    if (command === 'describe') {
      assertCatalog(
        catalog,
        legacyRoot
      );
      const id = positional[1];

      if (!id) {
        throw new LegacyCompatibilityError(
          'ENTRY_ID_REQUIRED'
        );
      }

      const entry =
        entryById(catalog, id);
      assertEntryBlob({
        legacyRoot,
        entry
      });

      io.stdout.write(
        `${JSON.stringify(
          entry,
          null,
          2
        )}\n`
      );

      return 0;
    }

    if (command === 'serve') {
      const id = positional[1];
      const port = Number(
        positional[2] ?? 8765
      );

      if (!id) {
        throw new LegacyCompatibilityError(
          'ENTRY_ID_REQUIRED'
        );
      }

      if (
        !Number.isInteger(port)
        || port < 1024
        || port > 65535
      ) {
        throw new LegacyCompatibilityError(
          'PORT_INVALID'
        );
      }

      servePreview({
        legacyRoot,
        catalog,
        id,
        port
      });

      return 0;
    }

    if (command === 'run') {
      throw new LegacyCompatibilityError(
        'LEGACY_COMMAND_EXECUTION_DISABLED',
        [
          'Create a governed native adapter before execution.'
        ]
      );
    }

    io.stdout.write(
      'Forge Original Compatibility — Reviewed\n\n'
    );
    io.stdout.write(
      'Commands:\n'
    );
    io.stdout.write(
      '  doctor\n'
    );
    io.stdout.write(
      '  list\n'
    );
    io.stdout.write(
      '  describe ENTRY_ID\n'
    );
    io.stdout.write(
      '  serve ENTRY_ID [PORT]\n'
    );
    io.stdout.write(
      '\nLegacy shell and Node execution is disabled.\n'
    );

    return 0;
  } catch (error) {
    const code =
      error instanceof LegacyCompatibilityError
        ? error.code
        : 'UNEXPECTED_ERROR';

    io.stderr.write(
      'FORGE_ORIGINAL_REVIEWED_RESULT=FAIL\n'
    );
    io.stderr.write(
      `FORGE_ORIGINAL_REVIEWED_ERROR_CODE=${code}\n`
    );
    io.stderr.write(
      `FORGE_ORIGINAL_REVIEWED_ERROR=${error.message}\n`
    );

    return 1;
  }
}

const isMain =
  process.argv[1]
  && path.resolve(process.argv[1])
    === path.resolve(
      fileURLToPath(import.meta.url)
    );

if (isMain) {
  process.exitCode = runCli();
}
