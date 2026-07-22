#!/usr/bin/env node
import { assert, exists, finish, loadModel } from './lib.mjs';

const name = 'validate-traceability';
const { capabilities, boundaries, traceability, stages } = loadModel();
const capIds = new Set(capabilities.map(cap => cap.id));
const boundaryIds = new Set(boundaries.map(boundary => boundary.id));
const stageIds = new Set(stages.map(stage => stage.id));
const tracedCaps = new Set();
for (const entry of traceability) {
  tracedCaps.add(entry.capability_id);
  assert(capIds.has(entry.capability_id), `trace references missing capability ${entry.capability_id}`);
  assert(stageIds.has(entry.stage), `trace references missing stage ${entry.stage}`);
  assert(exists(entry.contract), `trace references missing contract ${entry.contract}`);
  assert(entry.acceptance.length > 0, `trace ${entry.requirement_id} missing acceptance`);
  for (const boundary of entry.boundaries) assert(boundaryIds.has(boundary), `trace references missing boundary ${boundary}`);
}
for (const cap of capabilities) assert(tracedCaps.has(cap.id), `${cap.id} has no traceability entry`);
for (const stage of stages.filter(stage => stage.status === 'READY')) {
  for (const cap of stage.capabilities) assert(tracedCaps.has(cap), `READY stage ${stage.id} capability ${cap} lacks traceability`);
}
finish(name);
