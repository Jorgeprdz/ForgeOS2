import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const uiSource = readFileSync('advisor-os/sales-pipeline/productive-prospect-ui.js', 'utf8');
const css = readFileSync('advisor-os/sales-pipeline/pipeline-ui.css', 'utf8');
const productionAcceptance = readFileSync('tests/forge-067g17b-production-browser-acceptance.mjs', 'utf8');

test('067G17B3 prospect creation uses one body-level modal authority', () => {
  assert.match(uiSource, /function openProductiveProspectCreateModal/);
  assert.match(uiSource, /openProductiveProspectCreate: openProductiveProspectCreateModal/);
  assert.match(uiSource, /openProductiveProspectCreateModal,/);
  assert.match(uiSource, /if \(add\) \{/);
  assert.match(uiSource, /openProductiveProspectCreateModal\(\{\}, add\)/);
  assert.match(uiSource, /openProductiveProspectCreateModal\(selected, event\.target\.closest\("\[data-edit-prospect\]"\)\)/);
  assert.match(uiSource, /const existing = global\.document\.querySelector\("\[data-prospect-form-modal\]"\)/);
  assert.match(uiSource, /global\.document\.body\.insertAdjacentHTML\("beforeend", formTemplate\(prospect\)\)/);
  assert.doesNotMatch(uiSource, /root\.insertAdjacentHTML\("beforeend", formTemplate/);
  assert.doesNotMatch(uiSource, /<dialog[^>]*data-prospect-form-dialog/);
});

test('067G17B3 modal follows Cotizaciones-style dialog behavior contract', () => {
  assert.match(uiSource, /class="forge-prospect-modal-backdrop"/);
  assert.match(uiSource, /role="dialog"/);
  assert.match(uiSource, /aria-modal="true"/);
  assert.match(uiSource, /aria-labelledby="prospect-form-title"/);
  assert.match(uiSource, /PROSPECTO PRODUCTIVO/);
  assert.match(uiSource, /data-prospect-form-scroll/);
  assert.match(uiSource, /global\.document\.documentElement\.dataset\.forgeProspectModalOpen = "true"/);
  assert.match(uiSource, /global\.document\.body\.style\.overflow = "hidden"/);
  assert.match(uiSource, /delete global\.document\.documentElement\.dataset\.forgeProspectModalOpen/);
  assert.match(uiSource, /event\.key === "Escape"/);
  assert.match(uiSource, /event\.key !== "Tab"/);
  assert.match(uiSource, /event\.shiftKey && global\.document\.activeElement === first/);
  assert.match(uiSource, /!event\.shiftKey && global\.document\.activeElement === last/);
  assert.match(uiSource, /createTrigger\?\.focus\?/);
  assert.match(uiSource, /Hay cambios sin guardar/);
});

test('067G17B3 modal CSS is overlayed, centered, internally scrollable and mobile-safe', () => {
  assert.match(css, /\.forge-prospect-modal-backdrop\{position:fixed;inset:0;z-index:/);
  assert.match(css, /background:rgba\(2,7,15,\.76\)/);
  assert.match(css, /backdrop-filter:blur\(7px\)/);
  assert.match(css, /place-items:center/);
  assert.match(css, /width:min\(880px,calc\(100vw - 32px\)\)/);
  assert.match(css, /max-height:min\(88dvh,900px\)/);
  assert.match(css, /\.forge-prospect-form-scroll\{min-height:0;overflow:auto/);
  assert.match(css, /grid-template-rows:auto minmax\(0,1fr\) auto/);
  assert.match(css, /position:sticky;top:0/);
  assert.match(css, /position:sticky;bottom:0/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /width:calc\(100vw - 24px\)/);
  assert.match(css, /max-height:calc\(100dvh - var\(--forge-mobile-nav-r16c5j-height/);
});

test('067G17B3 production browser acceptance validates both modal entry points', () => {
  assert.match(productionAcceptance, /top_add_opens_modal/);
  assert.match(productionAcceptance, /empty_add_opens_modal/);
  assert.match(productionAcceptance, /INLINE_FORM_EXTENSION_PRESENT/);
  assert.match(productionAcceptance, /\[data-prospect-form-modal\]/);
  assert.doesNotMatch(productionAcceptance, /\[data-prospect-form-dialog\]\[open\]/);
});

test('067G17B3 negative controls are present and non-vacuous', () => {
  assert.doesNotMatch(uiSource, /setInterval|MutationObserver|onclick=/);
  assert.doesNotMatch(uiSource, /localStorage|sessionStorage|DEMO|fixture/i);
  assert.match(uiSource, /ForgeProductiveProspectService067G17B\.create\(client\)/);
  assert.match(uiSource, /service\.createProspect\(input\)/);
  assert.match(uiSource, /service\.updateProspect\(id, input\)/);
  assert.match(uiSource, /service\.archiveProspect\(selected\.id\)/);
  assert.match(uiSource, /submitting = true/);
  assert.match(uiSource, /if \(!modal \|\| submitting\) return/);
});
