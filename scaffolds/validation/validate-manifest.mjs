#!/usr/bin/env node
import { assert, exists, finish, loadModel, readJson } from './lib.mjs';

const name = 'validate-manifest';
for (const file of [
  'scaffolds/manifest/rewrite-manifest.json',
  'scaffolds/manifest/rewrite-stages.json',
  'scaffolds/manifest/scaffold-registry.json',
  'scaffolds/manifest/path-policy.json'
]) {
  assert(exists(file), `missing ${file}`);
  readJson(file);
}
const manifest = readJson('scaffolds/manifest/rewrite-manifest.json');
for (const key of ['product_spec', 'capabilities', 'boundaries', 'traceability', 'path_policy', 'stage_manifest', 'termux_scripts']) {
  assert(exists(manifest[key]), `rewrite manifest points to missing ${key}: ${manifest[key]}`);
}
const { stages } = loadModel();
const stageIds = new Set();
for (const stage of stages) {
  assert(!stageIds.has(stage.id), `duplicate stage ${stage.id}`);
  stageIds.add(stage.id);
  for (const template of stage.templates) assert(exists(template), `${stage.id} references missing template ${template}`);
  for (const contract of stage.contracts) assert(exists(contract), `${stage.id} references missing contract ${contract}`);
  assert(stage.status === 'READY' || stage.files_to_generate.length === 0, `${stage.id} blocked/deferred stage declares generated files`);
}
finish(name);
