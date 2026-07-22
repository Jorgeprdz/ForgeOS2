#!/usr/bin/env node
import { assert, ensureNoCodexPaths, ensureNoSecretAssignments, finish, listFiles, loadModel } from './lib.mjs';

const name = 'validate-paths';
const files = [
  ...listFiles('docs/product'),
  ...listFiles('docs/rewrite'),
  ...listFiles('scaffolds'),
  ...listFiles('tools/termux/rewrite')
].filter(file => !file.endsWith('.gitkeep'));
const { pathPolicy, stages } = loadModel();
for (const stage of stages) {
  for (const file of stage.files_to_generate) {
    assert(!pathPolicy.prohibited_files.includes(file), `${stage.id} attempts prohibited file ${file}`);
    for (const root of pathPolicy.prohibited_roots) assert(!file.startsWith(root), `${stage.id} attempts prohibited root ${root}`);
  }
}
ensureNoCodexPaths(files);
ensureNoSecretAssignments(files);
finish(name);
