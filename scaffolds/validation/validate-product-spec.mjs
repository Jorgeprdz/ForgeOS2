#!/usr/bin/env node
import { assert, ensureNoCodexPaths, exists, finish, loadModel, readText, uniqueIds } from './lib.mjs';

const name = 'validate-product-spec';
assert(exists('docs/product/FORGE_PRODUCT_SPEC.md'), 'missing product spec');
assert(exists('scaffolds/manifest/forge-product-capabilities.json'), 'missing capabilities manifest');

const spec = readText('docs/product/FORGE_PRODUCT_SPEC.md');
for (const heading of ['Product Identity', 'Users And Roles', 'Functional Domains', 'Capabilities', 'Critical Flows', 'Non-Functional Requirements', 'Out Of Scope']) {
  assert(spec.includes(`## ${heading}`), `product spec missing section ${heading}`);
}

const { capabilities } = loadModel();
const ids = uniqueIds(capabilities, 'capabilities');
assert(capabilities.length >= 1, 'no capabilities declared');
for (const cap of capabilities) {
  assert(spec.includes(cap.id), `product spec does not document ${cap.id}`);
  assert(Array.isArray(cap.boundaries) && cap.boundaries.length > 0, `${cap.id} has no boundaries`);
  assert(Array.isArray(cap.acceptance) && cap.acceptance.length > 0, `${cap.id} missing acceptance`);
}
assert(ids.size === capabilities.length, 'capability IDs are not unique');
ensureNoCodexPaths(['docs/product/FORGE_PRODUCT_SPEC.md', 'scaffolds/manifest/forge-product-capabilities.json']);
finish(name);
