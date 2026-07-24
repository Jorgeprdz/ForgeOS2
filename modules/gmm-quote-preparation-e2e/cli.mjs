#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  GmmQuotePreparationE2EError,
  assertGmmQuotePreparationResult,
  runGmmQuotePreparationWorkflow
} from './index.mjs';

function parseArgs(argv) {
  const values = new Map();

  for (
    let index = 0;
    index < argv.length;
    index += 1
  ) {
    const token = argv[index];

    if (
      token === '--help'
      || token === '-h'
    ) {
      values.set('help', true);
      continue;
    }

    if (
      token !== '--input'
      && token !== '--output'
    ) {
      throw new GmmQuotePreparationE2EError(
        'UNKNOWN_CLI_OPTION',
        [token]
      );
    }

    if (values.has(token.slice(2))) {
      throw new GmmQuotePreparationE2EError(
        'DUPLICATE_CLI_OPTION',
        [token]
      );
    }

    const value = argv[index + 1];

    if (
      !value
      || value.startsWith('--')
    ) {
      throw new GmmQuotePreparationE2EError(
        'CLI_OPTION_VALUE_REQUIRED',
        [token]
      );
    }

    values.set(token.slice(2), value);
    index += 1;
  }

  return values;
}

function usage() {
  return `Forge OS V2 — GMM Quote Preparation E2E

Usage:
  tools/forge-gmm-quote-flow --input FILE [--output FILE]

Behavior:
  - evaluates Carrier Scope;
  - ingests the versioned GMM quote contract;
  - resolves Product Truth with independent official evidence;
  - emits READY_FOR_HUMAN_QUOTE_REVIEW or a governed BLOCKED result;
  - never sends a quote and never bypasses human review.
`;
}

function readJson(file) {
  try {
    return JSON.parse(
      fs.readFileSync(file, 'utf8')
    );
  } catch (error) {
    throw new GmmQuotePreparationE2EError(
      'JSON_INPUT_INVALID',
      [file, error.message]
    );
  }
}

function existingJsonPath(
  value,
  baseDirectory
) {
  const target = path.resolve(
    baseDirectory,
    value
  );

  if (
    path.extname(target).toLowerCase()
      !== '.json'
    || !fs.existsSync(target)
    || !fs.statSync(target).isFile()
  ) {
    throw new GmmQuotePreparationE2EError(
      'JSON_FILE_NOT_FOUND',
      [target]
    );
  }

  return target;
}

export function runCli(
  argv = process.argv.slice(2),
  io = {
    stdout: process.stdout,
    stderr: process.stderr,
    cwd: process.cwd()
  }
) {
  try {
    const args = parseArgs(argv);

    if (args.get('help') === true) {
      io.stdout.write(usage());
      return 0;
    }

    const inputValue = args.get('input');

    if (!inputValue) {
      throw new GmmQuotePreparationE2EError(
        'INPUT_FILE_REQUIRED'
      );
    }

    const inputFile = existingJsonPath(
      inputValue,
      io.cwd
    );
    const request = readJson(inputFile);

    if (
      typeof request.quoteFixturePath
        !== 'string'
      || request.quoteFixturePath
        .trim().length === 0
    ) {
      throw new GmmQuotePreparationE2EError(
        'QUOTE_FIXTURE_PATH_REQUIRED'
      );
    }

    const quoteFixtureFile =
      existingJsonPath(
        request.quoteFixturePath,
        path.dirname(inputFile)
      );

    const result =
      runGmmQuotePreparationWorkflow({
        request,
        quoteFixture:
          readJson(quoteFixtureFile)
      });

    assertGmmQuotePreparationResult(result);

    const serialized =
      `${JSON.stringify(result, null, 2)}\n`;

    const outputValue = args.get('output');

    if (outputValue) {
      const outputFile = path.resolve(
        io.cwd,
        outputValue
      );

      fs.mkdirSync(
        path.dirname(outputFile),
        { recursive: true }
      );
      fs.writeFileSync(
        outputFile,
        serialized
      );

      io.stdout.write(
        `OUTPUT_FILE=${outputFile}\n`
      );
      io.stdout.write(
        `WORKFLOW_STATUS=${result.status}\n`
      );
      io.stdout.write(
        `RUN_ID=${result.runId}\n`
      );
    } else {
      io.stdout.write(serialized);
    }

    return 0;
  } catch (error) {
    const code =
      error instanceof
        GmmQuotePreparationE2EError
        ? error.code
        : 'UNEXPECTED_ERROR';

    io.stderr.write(
      `GMM_QUOTE_FLOW_RESULT=FAIL\n`
    );
    io.stderr.write(
      `GMM_QUOTE_FLOW_ERROR_CODE=${code}\n`
    );
    io.stderr.write(
      `GMM_QUOTE_FLOW_ERROR=${error.message}\n`
    );

    return 1;
  }
}

const isMain =
  process.argv[1]
  && path.resolve(process.argv[1])
    === path.resolve(
      fileURLToPath(import.meta.url)
    );

if (isMain) {
  process.exitCode = runCli();
}
