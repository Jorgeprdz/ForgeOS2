#!/usr/bin/env node
import { assert, exists, finish, loadModel } from './lib.mjs';

const name = 'validate-evidence';
assert(exists('scaffolds/reports/.gitkeep'), 'versioned scaffold report directory is not tracked');
const { stages } = loadModel();
for (const stage of stages) {
  assert(stage.evidence.length > 0, `${stage.id} declares no evidence path`);
  for (const evidence of stage.evidence) {
    assert(evidence.startsWith('scaffolds/reports/'), `${stage.id} evidence must be versionable under scaffolds/reports`);
  }
}
finish(name);
