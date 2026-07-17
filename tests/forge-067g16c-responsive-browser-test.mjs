import assert from 'node:assert/strict';
import http from 'node:http';
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const puppeteerPath = process.env.FORGE_PUPPETEER_CORE_PATH;
const chromiumPath = process.env.FORGE_CHROMIUM_PATH;
const evidenceDir = process.env.FORGE_067G16C_EVIDENCE_DIR || '/data/data/com.termux/files/usr/tmp/067g16c-evidence';
assert.ok(puppeteerPath && chromiumPath);
const puppeteer = (await import(puppeteerPath)).default;
const root = process.cwd();
mkdirSync(evidenceDir, { recursive:true });

const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const server = http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const candidate = normalize(join(root, relative));
  if (!candidate.startsWith(root)) return response.writeHead(403).end();
  try {
    const info = await stat(candidate);
    const file = info.isDirectory() ? join(candidate, 'index.html') : candidate;
    response.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    createReadStream(file).pipe(response);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/docs/static-preview/forge-alive/`;

const viewports = [
  {key:'mobile_390',width:390,height:844,mode:'mobile'},
  {key:'mobile_360',width:360,height:800,mode:'mobile'},
  {key:'tablet_768',width:768,height:1024,mode:'tablet'},
  {key:'desktop_1366',width:1366,height:768,mode:'desktop'},
  {key:'desktop_1440',width:1440,height:900,mode:'desktop'},
];

const intersects = (a,b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
async function openPipeline(page, viewport) {
  await page.setViewport({width:viewport.width,height:viewport.height,deviceScaleFactor:1,isMobile:viewport.mode === 'mobile',hasTouch:viewport.mode !== 'desktop'});
  await page.goto(baseUrl, {waitUntil:'networkidle0',timeout:30000});
  await page.waitForFunction(() => Boolean(globalThis.ForgeAliveStaticView067G16A));
  if (viewport.mode === 'desktop') {
    const controls = await page.$$('[data-forge-static-view="pipeline"]');
    let clicked = false;
    for (const control of controls) {
      const box = await control.boundingBox();
      if (box?.width > 0 && box?.height > 0) { await control.click(); clicked = true; break; }
    }
    assert.equal(clicked, true, 'visible desktop Pipeline control');
  } else {
    const control = await page.$('[data-forge-nav-key="pipeline"]');
    const box = await control.boundingBox();
    assert.ok(box, 'visible mobile/tablet Pipeline control');
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  }
  await page.waitForFunction(() => globalThis.ForgeAliveStaticView067G16A.current() === 'pipeline');
  await new Promise(resolve => setTimeout(resolve, 180));
}

async function assertPipelineHydrated(page, label) {
  await page.waitForFunction(() => globalThis.ForgeAliveStaticView067G16A?.current() === 'pipeline');
  await page.waitForSelector('#forge-pipeline-title');
  const result = await page.evaluate(() => {
    const visible = node => Boolean(node?.getClientRects().length) && getComputedStyle(node).visibility !== 'hidden';
    const bodyText = document.body.innerText;
    return {
      activeNav:document.querySelector('[data-forge-nav-key="pipeline"]')?.getAttribute('aria-current'),
      heading:visible(document.querySelector('#forge-pipeline-title')),
      filters:visible(document.querySelector('.forge-pipeline-toolbar')),
      body:visible(document.querySelector('.forge-pipeline-state,.forge-pipeline-layout')),
      homeCopyVisible:['Buenos días, Jorge','Plan de hoy','Seguimiento prioritario'].some(copy => bodyText.includes(copy)),
      route:globalThis.ForgeAliveStaticView067G16A.current(),
    };
  });
  assert.deepEqual(result, {activeNav:'page',heading:true,filters:true,body:true,homeCopyVisible:false,route:'pipeline'}, label);
  return result;
}

async function deepLinkAcceptance(page) {
  await page.setViewport({width:390,height:844,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await page.goto(`${baseUrl}?nav=pipeline&v=067g16c-1`, {waitUntil:'networkidle0',timeout:30000});
  const fresh = await assertPipelineHydrated(page, 'fresh direct link');
  await page.reload({waitUntil:'networkidle0',timeout:30000});
  const reload = await assertPipelineHydrated(page, 'hard reload');
  await page.goto(baseUrl, {waitUntil:'networkidle0',timeout:30000});
  await page.waitForFunction(() => globalThis.ForgeAliveStaticView067G16A?.current() === 'inicio');
  const control = await page.$('[data-forge-nav-key="pipeline"]');
  const box = await control.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  const click = await assertPipelineHydrated(page, 'click from Home');
  await page.goBack({waitUntil:'networkidle0',timeout:30000});
  await page.waitForFunction(() => globalThis.ForgeAliveStaticView067G16A?.current() === 'inicio');
  assert.equal((await page.evaluate(() => document.body.innerText.includes('Buenos días, Jorge'))), true, 'back restores Home');
  await page.goForward({waitUntil:'networkidle0',timeout:30000});
  const forward = await assertPipelineHydrated(page, 'forward restores Pipeline');
  return {fresh,reload,click,back:'HOME',forward};
}

async function audit(page, viewport) {
  const before = await page.evaluate(() => {
    const rect = selector => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
    };
    const style = selector => {
      const s = getComputedStyle(document.querySelector(selector));
      return {background:s.backgroundColor,color:s.color,border:s.borderColor,display:s.display,position:s.position,gridTemplateColumns:s.gridTemplateColumns};
    };
    const controls = Array.from(document.querySelectorAll('.forge-pipeline-toolbar input, .forge-pipeline-toolbar select')).map(node => {
      const r = node.getBoundingClientRect();
      const p = node.parentElement.getBoundingClientRect();
      return {name:node.name,left:r.left,right:r.right,width:r.width,parentLeft:p.left,parentRight:p.right,parentWidth:p.width};
    });
    const visualLayers = Array.from(document.querySelectorAll('body *')).flatMap(node => {
      const r = node.getBoundingClientRect();
      const own = getComputedStyle(node);
      const before = getComputedStyle(node, '::before');
      const after = getComputedStyle(node, '::after');
      const decorated = [own, before, after].some(s => s.backgroundImage !== 'none' || s.boxShadow !== 'none');
      if (!decorated || r.width < 80 || r.height < 40 || r.bottom < 0 || r.top > innerHeight) return [];
      return [{tag:node.tagName.toLowerCase(),id:node.id,className:String(node.className),rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},display:own.display,visibility:own.visibility,backgroundImage:own.backgroundImage,before:{display:before.display,content:before.content,backgroundImage:before.backgroundImage,boxShadow:before.boxShadow},after:{display:after.display,content:after.content,backgroundImage:after.backgroundImage,boxShadow:after.boxShadow}}];
    });
    return {
      documentWidth:document.documentElement.scrollWidth,
      viewportWidth:document.documentElement.clientWidth,
      pageHeight:document.documentElement.scrollHeight,
      pipeline:rect('.forge-pipeline'),header:rect('.forge-pipeline-header'),filters:rect('.forge-pipeline-toolbar'),body:rect('.forge-pipeline-state, .forge-pipeline-layout'),
      stateHeading:rect('.forge-pipeline-state h2'),stateDescription:rect('.forge-pipeline-state p'),nav:rect('.forge-mobile-nav-r16c5j'),
      controls,
      visualLayers,
      styles:{pipeline:style('.forge-pipeline'),header:style('.forge-pipeline-header'),filters:style('.forge-pipeline-toolbar'),body:style('.forge-pipeline-state, .forge-pipeline-layout'),field:style('.forge-pipeline-toolbar input')},
      counts:{primary:document.querySelectorAll('[data-forge-alive-primary-outlet-067g16a][data-active-static-view="pipeline"]').length,heading:Array.from(document.querySelectorAll('h1')).filter(n=>n.textContent.trim()==='Pipeline de ventas'&&n.getClientRects().length).length,filters:document.querySelectorAll('.forge-pipeline-toolbar[role="search"]').length,body:document.querySelectorAll('.forge-pipeline-state, .forge-pipeline-layout').length},
      homeMetricsVisible:Array.from(document.querySelectorAll('.forge-mobile-context-nav-057d,.forge-mobile-widget-grid-057j')).some(n=>n.getClientRects().length),
      homePrimaryCopyVisible:['Buenos días, Jorge','Plan de hoy','Seguimiento prioritario','Haz esto ahora','Comando recomendado'].some(copy => document.body.innerText.includes(copy)),
    };
  });
  assert.ok(before.pipeline && before.header && before.filters && before.body && before.stateHeading && before.stateDescription);
  assert.deepEqual(before.counts, {primary:1,heading:1,filters:1,body:1});
  assert.equal(before.homeMetricsVisible, false);
  assert.equal(before.homePrimaryCopyVisible, false, 'Home primary copy absent from Pipeline route');
  assert.equal(before.documentWidth <= before.viewportWidth, true, 'no horizontal overflow');
  assert.equal(intersects(before.filters,before.body), false, 'filters/body do not intersect');
  assert.equal(intersects(before.header,before.filters), false, 'header/filters do not intersect');
  assert.equal(before.body.left >= 0 && before.body.right <= viewport.width + 1, true, 'body within viewport');
  assert.equal(before.stateHeading.top >= before.body.top && before.stateHeading.bottom <= before.body.bottom, true, 'state heading visible');
  assert.equal(before.stateDescription.top >= before.body.top && before.stateDescription.bottom <= before.body.bottom, true, 'state description visible');
  for (const control of before.controls) {
    assert.equal(control.left >= control.parentLeft - 1 && control.right <= control.parentRight + 1, true, `${control.name} fits parent: ${JSON.stringify(control)}`);
  }
  if (viewport.mode === 'mobile') {
    assert.equal(before.filters.top > before.header.bottom, true, 'mobile header/filter separation');
    assert.equal(before.body.top > before.filters.bottom, true, 'mobile filter/body separation');
    assert.equal(before.styles.filters.gridTemplateColumns.split(' ').length, 1, 'mobile filters stacked');
    assert.equal(before.body.bottom < before.nav.top, true, 'mobile final content clears fixed nav before scrolling');
  } else if (viewport.mode === 'tablet') {
    assert.equal(before.body.width >= before.pipeline.width * .9, true, 'tablet body uses width');
    assert.equal(before.filters.top > before.header.bottom, true, 'tablet deliberate stacked rows');
  } else {
    assert.equal(Math.abs(before.header.top - before.filters.top) <= 1, true, 'desktop header/filter common row');
    assert.equal(Math.abs(before.header.height - before.filters.height) <= 1, true, 'desktop row aligned');
    assert.equal(Math.abs(before.body.left - before.header.left) <= 1, true, 'desktop body left grid line');
    assert.equal(Math.abs(before.body.right - before.filters.right) <= 1, true, 'desktop body right grid line');
    assert.equal(before.body.width >= before.pipeline.width * .9, true, 'desktop body uses content region');
    assert.equal(before.controls.filter(control => control.name !== 'search').every(control => control.width >= 220), true, 'desktop selectors preserve readable option width');
  }
  await page.screenshot({path:join(evidenceDir,`${viewport.key}_viewport.png`)});
  await page.screenshot({path:join(evidenceDir,`${viewport.key}_fullpage.png`),fullPage:true});
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await new Promise(resolve => setTimeout(resolve, 120));
  const bottom = await page.evaluate(() => {
    const state = document.querySelector('.forge-pipeline-state, .forge-pipeline-layout').getBoundingClientRect();
    const navNode = document.querySelector('.forge-mobile-nav-r16c5j');
    const nav = navNode && getComputedStyle(navNode).display !== 'none' ? navNode.getBoundingClientRect() : null;
    return {bodyBottom:state.bottom,navTop:nav?.top ?? null,scrollY,scrollHeight:document.documentElement.scrollHeight,innerHeight};
  });
  if (viewport.mode !== 'desktop') assert.equal(bottom.bodyBottom < bottom.navTop, true, 'final content clears fixed nav at scroll end');
  return {...before,overlap:{headerFilters:false,filtersBody:false},bottomClearance:viewport.mode === 'desktop' ? 'NOT_APPLICABLE' : bottom.navTop - bottom.bodyBottom,result:'PASS'};
}

const results = [];
try {
  for (const viewport of viewports) {
    const browser = await puppeteer.launch({executablePath:chromiumPath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote','--disable-breakpad','--disable-crash-reporter']});
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      if (viewport.key === 'mobile_390') results.deepLink = await deepLinkAcceptance(page);
      await openPipeline(page, viewport);
      results.push({viewport,...await audit(page,viewport)});
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  }
  writeFileSync(join(evidenceDir,'067g16c-browser-acceptance.json'), JSON.stringify({status:'PASS',deepLink:results.deepLink,results}, null, 2));
  console.log(JSON.stringify({status:'PASS',viewports:results.map(r=>({key:r.viewport.key,result:r.result,bottomClearance:r.bottomClearance}))},null,2));
} finally { server.close(); }
