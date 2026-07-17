import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pipeline = readFileSync('advisor-os/sales-pipeline/pipeline-ui.css', 'utf8');
const host = readFileSync('docs/static-preview/forge-alive/forge-alive-pipeline-view-067g16a.css', 'utf8');
const renderer = readFileSync('advisor-os/sales-pipeline/pipeline-ui.js', 'utf8');

assert.match(pipeline, /main\.forge-pipeline\s*\{[\s\S]*box-sizing:\s*border-box;[\s\S]*width:\s*min\(100%,\s*1200px\)\s*!important;[\s\S]*max-width:\s*100%\s*!important;[\s\S]*margin:\s*0 auto\s*!important;/);
assert.match(pipeline, /grid-auto-flow:\s*row\s*!important/);
assert.match(pipeline, /@media \(min-width:\s*1181px\)[\s\S]*grid-template-columns:\s*minmax\(0,\s*0\.72fr\)\s*minmax\(0,\s*1\.28fr\)\s*!important/);
assert.match(pipeline, /@media \(min-width:\s*901px\) and \(max-width:\s*1180px\)[\s\S]*grid-template-areas:[\s\S]*"header"[\s\S]*"toolbar"[\s\S]*"body"\s*!important/);
assert.match(pipeline, /\.forge-pipeline input,[\s\S]*\.forge-pipeline select,[\s\S]*\.forge-pipeline button\s*\{[\s\S]*max-width:\s*100%/);
assert.match(pipeline, /overflow-wrap:\s*anywhere/);
assert.doesNotMatch(pipeline.slice(pipeline.indexOf('067G16E:')), /overflow-x:\s*hidden/);
assert.doesNotMatch(pipeline.slice(pipeline.indexOf('067G16E:')), /transform:\s*translate/);
assert.doesNotMatch(pipeline.slice(pipeline.indexOf('067G16E:')), /margin-(left|right):\s*-/);

assert.match(host, /\.forge-alive-primary-view-067g16a\s*\{[\s\S]*box-sizing:\s*border-box;[\s\S]*width:\s*100%;[\s\S]*max-width:\s*100%;/);
assert.match(host, /grid-column:\s*2\s*\/\s*-1;[\s\S]*width:\s*100%;[\s\S]*max-width:\s*100%;[\s\S]*overflow:\s*visible;/);
assert.doesNotMatch(host, /forge-alive-primary-view-067g16a[\s\S]{0,300}overflow-x:\s*hidden/);

assert.match(renderer, /globalThis\.ForgePipelineUI=PipelineUI/);
assert.match(renderer, /class="forge-pipeline"/);
console.log('067G16E LAYOUT CONTRACT: PASS');
