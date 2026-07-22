import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function repoRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  }
}

export function readJson(relativePath) {
  const fullPath = path.join(repoRoot(), relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

export function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot(), relativePath), 'utf8');
}

export function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot(), relativePath));
}

export function listFiles(relativePath) {
  const root = path.join(repoRoot(), relativePath);
  const out = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(path.relative(repoRoot(), full).replaceAll(path.sep, '/'));
    }
  }
  walk(root);
  return out;
}

export function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

export function assert(condition, message) {
  if (!condition) fail(message);
}

export function finish(name) {
  if (process.exitCode) {
    console.error(`${name}: FAIL`);
  } else {
    console.log(`${name}: PASS`);
  }
}

export function uniqueIds(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) fail(`${label} has duplicate id ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

export function loadModel() {
  const capabilities = readJson('scaffolds/manifest/forge-product-capabilities.json').capabilities;
  const boundaries = readJson('scaffolds/manifest/constitutional-boundaries.json').boundaries;
  const traceability = readJson('scaffolds/manifest/requirements-traceability.json').entries;
  const stages = readJson('scaffolds/manifest/rewrite-stages.json').stages;
  const pathPolicy = readJson('scaffolds/manifest/path-policy.json');
  return { capabilities, boundaries, traceability, stages, pathPolicy };
}

export function ensureNoCodexPaths(files) {
  const patterns = [/\/tmp\/codex/i, /\/mnt\/data/i, /\/home\/oai/i, /\/data\/data\/.*codex/i];
  for (const file of files) {
    const text = readText(file);
    for (const pattern of patterns) {
      if (pattern.test(text)) fail(`${file} contains environment-specific Codex path ${pattern}`);
    }
  }
}

export function ensureNoSecretAssignments(files) {
  const pattern = /(sk-[A-Za-z0-9]{12,}|OPENAI_API_KEY\s*=|SUPABASE_KEY\s*=|PASSWORD\s*=|SECRET\s*=|TOKEN\s*=)/;
  for (const file of files) {
    if (pattern.test(readText(file))) fail(`${file} appears to contain a secret assignment or token`);
  }
}
