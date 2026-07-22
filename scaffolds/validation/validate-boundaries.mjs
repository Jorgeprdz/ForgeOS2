#!/usr/bin/env node
import { assert, ensureNoCodexPaths, exists, finish, loadModel, uniqueIds } from './lib.mjs';

const name = 'validate-boundaries';
assert(exists('scaffolds/manifest/constitutional-boundaries.json'), 'missing constitutional boundary registry');
const { capabilities, boundaries, traceability, stages } = loadModel();
const boundaryIds = uniqueIds(boundaries, 'boundaries');
for (const boundary of boundaries) {
  assert(boundary.description.length > 0, `${boundary.id} missing description`);
  assert(boundary.permitted_operations.length > 0, `${boundary.id} missing permitted operations`);
  assert(boundary.prohibited_operations.length > 0, `${boundary.id} missing prohibited operations`);
}
for (const cap of capabilities) for (const id of cap.boundaries) assert(boundaryIds.has(id), `${cap.id} references missing boundary ${id}`);
for (const entry of traceability) for (const id of entry.boundaries) assert(boundaryIds.has(id), `${entry.capability_id} trace references missing boundary ${id}`);
for (const stage of stages) for (const id of stage.boundaries) assert(boundaryIds.has(id), `${stage.id} references missing boundary ${id}`);
ensureNoCodexPaths(['scaffolds/manifest/constitutional-boundaries.json']);
finish(name);
