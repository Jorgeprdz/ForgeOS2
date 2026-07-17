import assert from 'node:assert/strict';
import http from 'node:http';
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const puppeteerPath = process.env.FORGE_PUPPETEER_CORE_PATH;
const chromiumPath = process.env.FORGE_CHROMIUM_PATH;
const evidenceDir = process.env.FORGE_067G16E_EVIDENCE_DIR;
assert.ok(puppeteerPath && chromiumPath && evidenceDir, 'browser paths and evidence directory are required');
const puppeteer = (await import(puppeteerPath)).default;
const root = process.cwd();
mkdirSync(evidenceDir, { recursive: true });

const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  if (pathname === '/env.js') {
    response.writeHead(200, { 'Content-Type':'text/javascript', 'Cache-Control':'no-store' });
    response.end("window.__ENV__={DEMO_MODE:'true',SUPABASE_URL:'',SUPABASE_KEY:''};");
    return;
  }
  const publicPath = pathname === '/' ? 'static-preview/forge-alive/index.html' : pathname.replace(/^\/+/, '');
  const relative = publicPath.startsWith('advisor-os/') ? publicPath : join('docs', publicPath);
  const candidate = normalize(join(root, relative));
  if (!candidate.startsWith(root)) return response.writeHead(403).end();
  try {
    const info = await stat(candidate);
    const file = info.isDirectory() ? join(candidate, 'index.html') : candidate;
    response.writeHead(200, { 'Content-Type':mime[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    createReadStream(file).pipe(response);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const directUrl = `http://127.0.0.1:${server.address().port}/static-preview/forge-alive/?nav=pipeline&v=067g16e`;

const viewports = [
  ['mobile_360',360,800,'mobile'], ['mobile_390',390,844,'mobile'], ['tablet_768',768,1024,'tablet'],
  ['tablet_landscape_1024',1024,768,'desktop'], ['tablet_landscape_1180',1180,820,'desktop'],
  ['desktop_1280',1280,800,'desktop'], ['desktop_1366',1366,768,'desktop'],
  ['desktop_1440',1440,900,'desktop'], ['desktop_1536',1536,864,'desktop']
];

function selectorFor(node) {
  if (node.id) return `#${node.id}`;
  const classes = Array.from(node.classList || []).slice(0, 3);
  return `${node.tagName.toLowerCase()}${classes.map(name => `.${name}`).join('')}`;
}

async function measure(page, zoomPercent) {
  await page.waitForFunction(() => globalThis.ForgeAliveStaticView067G16A?.current() === 'pipeline');
  await page.waitForSelector('#forge-pipeline-title');
  await page.evaluate(percent => { document.documentElement.style.zoom = String(percent / 100); }, zoomPercent);
  await new Promise(resolve => setTimeout(resolve, 180));
  return page.evaluate(() => {
    const visible = node => Boolean(node?.getClientRects().length) && getComputedStyle(node).visibility !== 'hidden';
    const box = node => {
      if (!node || !visible(node)) return null;
      const r = node.getBoundingClientRect();
      const s = getComputedStyle(node);
      return { selector: node.id ? `#${node.id}` : `${node.tagName.toLowerCase()}.${String(node.className).trim().split(/\s+/).slice(0,3).join('.')}`, left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height, clientWidth:node.clientWidth, scrollWidth:node.scrollWidth, computedWidth:s.width, minWidth:s.minWidth, maxWidth:s.maxWidth, marginLeft:s.marginLeft, marginRight:s.marginRight, transform:s.transform, position:s.position, boxSizing:s.boxSizing, paddingLeft:s.paddingLeft, paddingRight:s.paddingRight };
    };
    const sidebarNode = document.querySelector('.dw-sidebar-056y');
    const mainNode = document.querySelector('[data-forge-alive-primary-outlet-067g16a]');
    const headerNode = document.querySelector('.forge-pipeline-header');
    const filtersNode = document.querySelector('.forge-pipeline-toolbar');
    const bodyNode = document.querySelector('.forge-pipeline-state,.forge-pipeline-layout');
    const footerNode = document.querySelector('footer') || document.querySelector('.forge-mobile-nav-r16c5j');
    const pipelineNode = document.querySelector('.forge-pipeline');
    const primaryNodes = [mainNode, pipelineNode, headerNode, filtersNode, bodyNode, footerNode].filter(Boolean);
    const contributors = Array.from(document.body.querySelectorAll('*')).flatMap(node => {
      if (!visible(node)) return [];
      const r = node.getBoundingClientRect();
      const p = node.parentElement?.getBoundingClientRect();
      const s = getComputedStyle(node);
      const parentWidth = p?.width || 0;
      const fixedWidth = /px$/.test(s.width) && parseFloat(s.width) > parentWidth + 1;
      const minExceeds = /px$/.test(s.minWidth) && parseFloat(s.minWidth) > parentWidth + 1;
      const usesViewportWidth = s.width === `${innerWidth}px` && mainNode?.contains(node);
      const translated = s.transform !== 'none' && (primaryNodes.includes(node) || mainNode?.contains(node));
      const outside = r.right > innerWidth + 1 || r.left < -1;
      const selfOverflow = node.scrollWidth > node.clientWidth + 1;
      if (!(outside || selfOverflow || minExceeds || usesViewportWidth || translated || fixedWidth)) return [];
      return [{ element:node.tagName, selector:node.id ? `#${node.id}` : `${node.tagName.toLowerCase()}.${String(node.className).trim().split(/\s+/).slice(0,3).join('.')}`, boundingBox:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}, clientWidth:node.clientWidth, scrollWidth:node.scrollWidth, computedWidth:s.width, minWidth:s.minWidth, maxWidth:s.maxWidth, marginLeft:s.marginLeft, marginRight:s.marginRight, transform:s.transform, position:s.position, parentSelector:node.parentElement ? (node.parentElement.id ? `#${node.parentElement.id}` : node.parentElement.tagName.toLowerCase()) : null, parentWidth, rootCauseClassification: usesViewportWidth?'VIEWPORT_WIDTH_INSIDE_MAIN':translated?'HORIZONTAL_TRANSFORM':minExceeds?'MIN_WIDTH_EXCEEDS_PARENT':fixedWidth?'FIXED_WIDTH_EXCEEDS_PARENT':outside?'BOUNDING_BOX_OUTSIDE_VIEWPORT':'INTERNAL_SCROLL_OVERFLOW' }];
    });
    const controls = Array.from(document.querySelectorAll('.forge-pipeline-toolbar input,.forge-pipeline-toolbar select')).map(node => ({ control:box(node), parent:box(node.parentElement) }));
    return {
      windowInnerWidth:innerWidth,
      documentClientWidth:document.documentElement.clientWidth,
      documentScrollWidth:document.documentElement.scrollWidth,
      bodyScrollWidth:document.body.scrollWidth,
      sidebar:box(sidebarNode), main:box(mainNode), pipeline:box(pipelineNode), header:box(headerNode), filters:box(filtersNode), pipelineBody:box(bodyNode), footer:box(footerNode), controls, contributors,
      activeNav:Boolean(document.querySelector('[data-forge-static-view="pipeline"][aria-current="page"], [data-forge-nav-key="pipeline"][aria-current="page"]')),
      homeVisible:['Buenos días, Jorge','Plan de hoy','Seguimiento prioritario'].some(text => document.body.innerText.includes(text))
    };
  });
}

function assertGeometry(result, label, mode) {
  const tolerance = 1;
  assert.equal(result.activeNav, true, `${label}: Pipeline nav active`);
  assert.equal(result.homeVisible, false, `${label}: Home absent`);
  assert.ok(result.main && result.pipeline && result.header && result.filters && result.pipelineBody, `${label}: primary boxes`);
  assert.ok(result.documentScrollWidth <= result.documentClientWidth + tolerance, `${label}: document overflow ${result.documentScrollWidth}/${result.documentClientWidth}`);
  assert.ok(result.bodyScrollWidth <= result.windowInnerWidth + tolerance, `${label}: body overflow ${result.bodyScrollWidth}/${result.windowInnerWidth}`);
  assert.ok(result.main.width > 0 && result.main.right <= result.windowInnerWidth + tolerance, `${label}: main contained`);
  assert.ok(result.pipeline.right <= result.main.right + tolerance, `${label}: Pipeline contained by main`);
  for (const key of ['header','filters','pipelineBody']) assert.ok(result[key].right <= result.main.right + tolerance, `${label}: ${key} contained`);
  assert.equal(result.pipeline.transform, 'none', `${label}: no Pipeline transform`);
  assert.equal(result.main.transform, 'none', `${label}: no main transform`);
  for (const { control, parent } of result.controls) assert.ok(control.right <= parent.right + tolerance && control.left >= parent.left - tolerance, `${label}: filter control contained`);
  if (mode === 'mobile') {
    assert.ok(result.footer, `${label}: mobile navigation present`);
    assert.ok(result.footer.right <= result.windowInnerWidth + tolerance && result.footer.left >= -tolerance, `${label}: mobile navigation contained`);
    assert.ok(result.pipelineBody.bottom < result.footer.top, `${label}: content clears bottom navigation`);
  }
  if (mode === 'desktop') {
    assert.ok(result.sidebar && result.main.left >= result.sidebar.right - tolerance, `${label}: sidebar offset once`);
    assert.ok(Math.abs(result.pipelineBody.left - result.header.left) <= tolerance, `${label}: body/header left grid`);
    assert.ok(Math.abs(result.pipelineBody.right - result.filters.right) <= tolerance, `${label}: body/filters right grid`);
  }
  const primarySelectors = new Set([result.main.selector,result.pipeline.selector,result.header.selector,result.filters.selector,result.pipelineBody.selector]);
  assert.equal(result.contributors.filter(item => primarySelectors.has(item.selector)).length, 0, `${label}: primary overflow contributors ${JSON.stringify(result.contributors.filter(item => primarySelectors.has(item.selector)))}`);
}

const report = { status:'PASS', directUrl, results:[], zoom:[] };
try {
  for (const [key,width,height,mode] of viewports) {
    const browser = await puppeteer.launch({ executablePath:chromiumPath, headless:true, args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote','--disable-breakpad','--disable-crash-reporter'] });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor:1, isMobile:mode === 'mobile', hasTouch:mode !== 'desktop' });
      await page.goto(directUrl, { waitUntil:'networkidle0', timeout:30000 });
      const result = await measure(page, 100);
      report.results.push({ key,width,height,mode,result,status:'MEASURED' });
      assertGeometry(result, key, mode);
      await page.screenshot({ path:join(evidenceDir,`${key}_viewport.png`) });
      await page.screenshot({ path:join(evidenceDir,`${key}_fullpage.png`), fullPage:true });
      report.results.at(-1).status = 'PASS';
    } finally { await browser.close(); }
  }
  for (const zoomPercent of [100,125]) {
    const browser = await puppeteer.launch({ executablePath:chromiumPath, headless:true, args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote'] });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width:1366,height:768,deviceScaleFactor:1 });
      await page.goto(directUrl, { waitUntil:'networkidle0', timeout:30000 });
      const result = await measure(page, zoomPercent);
      report.zoom.push({ zoomPercent,result,status:'MEASURED' });
      assertGeometry(result, `zoom_${zoomPercent}`, 'desktop');
      await page.screenshot({ path:join(evidenceDir,`zoom_${zoomPercent}_viewport.png`) });
      report.zoom.at(-1).status = 'PASS';
    } finally { await browser.close(); }
  }
} catch (error) {
  report.status = 'FAIL';
  report.error = { name:error.name, message:error.message, stack:error.stack };
  throw error;
} finally {
  writeFileSync(join(evidenceDir,'067g16e-geometry-browser.json'), JSON.stringify(report,null,2));
  server.close();
}
console.log('067G16E GEOMETRY BROWSER: PASS');
