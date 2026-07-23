#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  BUILD_STAGE_COLORS,
  stageTone,
  stageVisual
} from '../../tools/termux/build/forge-build-stage-colors.mjs';

const expected = {
  declared: 'muted',
  architecture_ready: 'blue',
  contracts_ready: 'cyan',
  implementation_started: 'yellow',
  implementation_complete: 'orange',
  tests_added: 'magenta',
  tests_pass: 'green',
  integration_pass: 'brightGreen',
  committed: 'brightBlue',
  pushed: 'brightCyan',
  merged: 'success',
  blocked: 'red'
};

for (const [state, tone] of Object.entries(expected)) {
  assert.equal(
    stageTone(state),
    tone,
    `${state} must use ${tone}`
  );

  assert.equal(
    typeof stageVisual(state).ansi256,
    'number'
  );

  console.log(`PASS ${state} uses ${tone}`);
}

assert.equal(
  stageTone('unknown-stage'),
  BUILD_STAGE_COLORS.declared.tone
);

console.log('PASS unknown lifecycle falls back to declared');
console.log(
  `test-build-stage-colors: PASS scenarios=${Object.keys(expected).length + 1}`
);
