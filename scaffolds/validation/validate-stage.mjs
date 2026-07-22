#!/usr/bin/env node
import { assert, exists, finish, loadModel } from './lib.mjs';

const name = 'validate-stage';
const allowedStatuses = new Set(['READY', 'BLOCKED_REQUIRES_PRODUCT_DEFINITION', 'BLOCKED_REQUIRES_OWNER_DECISION', 'BLOCKED_REQUIRES_ARCHITECTURAL_DECISION', 'BLOCKED_REQUIRES_LEGACY_EVIDENCE', 'BLOCKED_CONSTITUTIONAL_VIOLATION', 'DEFERRED', 'REJECTED', 'COMPLETED']);
const { capabilities, traceability, stages } = loadModel();
const capById = new Map(capabilities.map(cap => [cap.id, cap]));
const traceByCap = new Map(traceability.map(entry => [entry.capability_id, entry]));
for (const stage of stages) {
  assert(allowedStatuses.has(stage.status), `${stage.id} has invalid status ${stage.status}`);
  assert(exists(`scaffolds/stages/${stage.id}/README.md`), `${stage.id} missing stage directory README`);
  for (const capId of stage.capabilities) {
    const cap = capById.get(capId);
    assert(cap, `${stage.id} references missing capability ${capId}`);
    assert(traceByCap.has(capId), `${stage.id} capability ${capId} lacks traceability`);
    if (stage.status === 'READY') {
      assert(!['DEFER', 'REJECT', 'REQUIRES_OWNER_DECISION'].includes(cap.classification), `${stage.id} READY stage contains blocked classification ${cap.classification}`);
    }
  }
}
finish(name);
