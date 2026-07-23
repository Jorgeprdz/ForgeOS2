#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());
const stateFile = path.join(root, '.forge/overnight/state.json');
try {
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  console.log(JSON.stringify(state, null, 2));
  console.log(`OVERNIGHT_STATUS=${state.result ?? state.status}`);
  console.log(`RUN_ID=${state.run_id}`);
  console.log(`CURRENT_JOB=${state.current_job ?? ''}`);
  console.log(`CURRENT_STEP=${state.current_step ?? ''}`);
  console.log(`UPDATED_AT=${state.updated_at}`);
} catch (error) {
  console.error(`STATE_INSPECTION=FAIL\nSTATE_FILE=${stateFile}\nSTATE_ERROR=${error.message}`);
  process.exit(2);
}
