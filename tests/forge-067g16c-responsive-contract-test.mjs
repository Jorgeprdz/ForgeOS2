import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('advisor-os/sales-pipeline/pipeline-ui.css', 'utf8');
const mount = readFileSync('docs/static-preview/forge-alive/forge-alive-pipeline-view-067g16a.css', 'utf8');
const renderer = readFileSync('advisor-os/sales-pipeline/pipeline-ui.js', 'utf8');
const controller = readFileSync('docs/static-preview/forge-alive/forge-alive-pipeline-view-067g16a.js', 'utf8');
const html = readFileSync('docs/static-preview/forge-alive/index.html', 'utf8');
const pipelineCss = css.slice(0, css.indexOf('.forge-prospect-detail'));

for (const token of [
  '--pipeline-bg:var(--forge-bg,var(--bg))',
  '--pipeline-surface:var(--forge-glass,var(--panel))',
  '--pipeline-surface-strong:var(--forge-panel-2,var(--panel-strong))',
  '--pipeline-text:var(--forge-text,var(--text))',
  '--pipeline-muted:var(--forge-muted,var(--muted))',
  '--pipeline-border:var(--forge-border,var(--line))',
  '--pipeline-accent:var(--forge-gold,var(--gold))',
  '--pipeline-accent-soft:var(--forge-cyan,var(--gold-soft))',
]) assert.ok(pipelineCss.includes(token), token);

assert.doesNotMatch(pipelineCss, /#[0-9a-f]{3,8}|rgba?\(|hsla?\(|\b(?:black|white|red|blue|yellow)\b/i);
assert.match(pipelineCss, /grid-template-areas:"header toolbar" "body body"/);
assert.match(pipelineCss, /@media\(min-width:600px\) and \(max-width:900px\)/);
assert.match(pipelineCss, /@media\(max-width:599px\)/);
assert.match(pipelineCss, /grid-template-areas:"header" "toolbar" "body"/);
assert.match(pipelineCss, /position:static/);
assert.doesNotMatch(pipelineCss, /position:(?:absolute|fixed|sticky)|margin:-|transform:translate/);
assert.match(pipelineCss, /var\(--forge-mobile-nav-r16c5j-height\) \+ var\(--forge-mobile-nav-r16c5j-bottom\)/);
assert.match(mount, /overflow: auto/);
assert.ok(renderer.includes('ForgePipelineUI=PipelineUI'));
assert.ok(renderer.includes('<h1 id="forge-pipeline-title">Pipeline de ventas</h1>'));
assert.equal((renderer.match(/function renderPipelineUI/g) || []).length, 1);
assert.ok(controller.includes("const VERSION = '067G16C_FORGE_ALIVE_STATIC_VIEW_V3'"));
assert.ok(controller.includes("document.documentElement.setAttribute('data-forge-alive-static-view-067g16a', requestedView())"));
assert.ok(controller.includes("addEventListener('popstate'"));
assert.ok(controller.includes("addEventListener('pageshow'"));
assert.ok(controller.includes("addEventListener('load'"));
assert.ok(controller.includes("historyMode:'push'"));
assert.ok(html.includes('pipeline-ui.css?v=067g16c-2'));
assert.ok(html.includes('forge-alive-pipeline-view-067g16a.css?v=067g16c-2'));
assert.ok(html.includes('forge-alive-pipeline-view-067g16a.js?v=067g16c-2'));

console.log('067G16C RESPONSIVE LAYOUT AND CANONICAL TOKEN CONTRACT: PASS');
