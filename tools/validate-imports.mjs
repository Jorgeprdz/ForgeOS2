import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORED_DIRS = new Set(['.git', 'node_modules']);
const CHECKED_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.html',
  '.css',
  '.json',
  '.yml',
  '.yaml',
  '.md'
]);

const REF_PATTERNS = [
  /import\s+(?:[^'"]+?\s+from\s+)?["']([^"']+)["']/g,
  /require\(\s*["']([^"']+)["']\s*\)/g,
  /importScripts\(\s*["']([^"']+)["']\s*\)/g,
  /(?:src|href)="([^"]+)"/g
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (CHECKED_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function isLocalReference(specifier) {
  return specifier.startsWith('.') || specifier.startsWith('/');
}

function resolveReference(baseFile, specifier) {
  const normalized = specifier.startsWith('/')
    ? path.join(ROOT, specifier.slice(1))
    : path.resolve(path.dirname(baseFile), specifier);

  const candidates = [
    normalized,
    `${normalized}.js`,
    `${normalized}.mjs`,
    `${normalized}.cjs`,
    `${normalized}.ts`,
    `${normalized}.tsx`,
    `${normalized}.css`,
    `${normalized}.json`,
    `${normalized}.html`,
    path.join(normalized, 'index.js')
  ];

  return candidates.some(candidate => fs.existsSync(candidate));
}

const missing = [];

for (const file of walk(ROOT)) {
  const content = fs.readFileSync(file, 'utf8');

  for (const pattern of REF_PATTERNS) {
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(content))) {
      const specifier = match[1];

      if (!isLocalReference(specifier)) {
        continue;
      }

      if (!resolveReference(file, specifier)) {
        missing.push({
          file: path.relative(ROOT, file),
          specifier
        });
      }
    }
  }
}

const actionableMissing = missing.filter(ref =>
  !(ref.file === 'docs/migration/FORGE_REPOSITORY_MIGRATION_PLAN.md' && ref.specifier === './x')
);

if (actionableMissing.length > 0) {
  console.error('Broken local references found:');
  for (const ref of actionableMissing) {
    console.error(`- ${ref.file} -> ${ref.specifier}`);
  }
  process.exit(1);
}

console.log(`Local reference validation passed (${missing.length} historical example references ignored).`);
