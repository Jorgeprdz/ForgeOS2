import assert from 'node:assert/strict';
import fs from 'node:fs';

export const EXPECTED_FUNCTION_VERSION = 'semantic-extract-v0.8-hdl-semantic-frame-lite';

export function validateSemanticSmoke(rawResponse) {
  assert.equal(typeof rawResponse, 'string', 'SEMANTIC_RESPONSE_STRING_REQUIRED');
  assert.ok(rawResponse.trim(), 'SEMANTIC_RESPONSE_EMPTY');
  const response = JSON.parse(rawResponse);
  assert.equal(response.function_version, EXPECTED_FUNCTION_VERSION, 'SEMANTIC_FUNCTION_VERSION_MISMATCH');
  assert.ok(response.summary && Number.isInteger(response.summary.candidate_count), 'SEMANTIC_SUMMARY_REQUIRED');
  assert.ok(Array.isArray(response.candidates), 'SEMANTIC_CANDIDATES_REQUIRED');
  assert.equal(response.candidates.length, response.summary.candidate_count, 'SEMANTIC_CANDIDATE_COUNT_MISMATCH');
  assert.ok(response.candidates.length > 0, 'SEMANTIC_PAYLOAD_REQUIRED');
  assert.ok(response.candidates.every((candidate) => candidate && typeof candidate.owner === 'string' && candidate.type), 'SEMANTIC_CANDIDATE_SCHEMA_INVALID');
  return response;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const responsePath = process.argv[2];
  assert.ok(responsePath, 'RESPONSE_PATH_REQUIRED');
  validateSemanticSmoke(fs.readFileSync(responsePath, 'utf8'));
  console.log(`SEMANTIC EXTRACT SMOKE: PASS ${EXPECTED_FUNCTION_VERSION}`);
}
