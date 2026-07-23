#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  contractRegistry,
  validateRegistry
} from '../../platform/contracts/generated/index.mjs';

const root = process.cwd();
const reportPath = path.join(
  root,
  'scaffolds',
  'reports',
  'contract-codegen-report.json'
);

if (!fs.existsSync(reportPath)) {
  throw new Error('CONTRACT_CODEGEN_REPORT_MISSING');
}

const report = JSON.parse(
  fs.readFileSync(reportPath, 'utf8')
);

if (contractRegistry.size !== report.artifact_count) {
  throw new Error(
    `CONTRACT_REGISTRY_COUNT_MISMATCH ` +
    `registry=${contractRegistry.size} ` +
    `report=${report.artifact_count}`
  );
}

const validation = validateRegistry();

if (!validation.valid) {
  console.error(JSON.stringify(validation, null, 2));
  throw new Error('CONTRACT_RUNTIME_VALIDATION_FAILED');
}

for (const entry of report.generated) {
  const sourcePath = path.join(root, entry.source_path);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `CONTRACT_SOURCE_MISSING artifact=${entry.artifact_id}`
    );
  }

  const module = contractRegistry.get(entry.artifact_id);

  if (!module) {
    throw new Error(
      `CONTRACT_REGISTRY_ENTRY_MISSING ` +
      `artifact=${entry.artifact_id}`
    );
  }

  if (module.sourceDigest !== entry.source_digest) {
    throw new Error(
      `CONTRACT_DIGEST_MISMATCH artifact=${entry.artifact_id}`
    );
  }
}

console.log(
  `CONTRACT_RUNTIME_VALIDATE=PASS ` +
  `contracts=${contractRegistry.size}`
);
