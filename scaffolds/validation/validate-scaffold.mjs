#!/usr/bin/env node
import { assert, exists, finish, loadModel, readJson } from './lib.mjs';

const name = 'validate-scaffold';
const registry = readJson('scaffolds/manifest/scaffold-registry.json').scaffolds;
const { capabilities, boundaries, stages } = loadModel();
const capIds = new Set(capabilities.map(cap => cap.id));
const boundaryIds = new Set(boundaries.map(boundary => boundary.id));
const stageIds = new Set(stages.map(stage => stage.id));
for (const scaffold of registry) {
  assert(stageIds.has(scaffold.stage), `${scaffold.id} references missing stage ${scaffold.stage}`);
  assert(capIds.has(scaffold.capability_id), `${scaffold.id} references missing capability ${scaffold.capability_id}`);
  for (const boundary of scaffold.boundaries) assert(boundaryIds.has(boundary), `${scaffold.id} references missing boundary ${boundary}`);
  for (const file of scaffold.files) assert(exists(file), `${scaffold.id} references missing file ${file}`);
}
finish(name);
