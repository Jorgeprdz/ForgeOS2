import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORED_DIRS = new Set(['.git', 'node_modules']);
const MARKDOWN_LINK = /!?\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function isSkippable(target) {
  return (
    target.startsWith('#')
    || /^[a-z][a-z0-9+.-]*:/i.test(target)
    || target.startsWith('mailto:')
  );
}

function stripAnchor(target) {
  return target.split('#')[0];
}

const broken = [];

for (const file of walk(ROOT)) {
  const content = fs.readFileSync(file, 'utf8');
  MARKDOWN_LINK.lastIndex = 0;
  let match;

  while ((match = MARKDOWN_LINK.exec(content))) {
    const rawTarget = match[1].replace(/^<|>$/g, '');

    if (isSkippable(rawTarget)) {
      continue;
    }

    const targetWithoutAnchor = stripAnchor(decodeURI(rawTarget));

    if (!targetWithoutAnchor) {
      continue;
    }

    const resolved = path.resolve(path.dirname(file), targetWithoutAnchor);

    if (!fs.existsSync(resolved)) {
      broken.push({
        file: path.relative(ROOT, file),
        target: rawTarget
      });
    }
  }
}

if (broken.length > 0) {
  console.error('Broken Markdown links found:');
  for (const item of broken) {
    console.error(`- ${item.file} -> ${item.target}`);
  }
  process.exit(1);
}

console.log('Markdown link validation passed.');
