import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const loaderPath = 'docs/static-preview/forge-alive/forge-alive-public-config-067g17a1.js';
const loader = readFileSync(loaderPath, 'utf8');
const html = readFileSync('docs/static-preview/forge-alive/index.html', 'utf8');
const sampleData = readFileSync('docs/static-preview/forge-alive/sample-data.js', 'utf8');
const mobileHtml = readFileSync('docs/10-gui/mobile-daily/index.html', 'utf8');
const mobileApp = readFileSync('docs/10-gui/mobile-daily/app.js', 'utf8');
const workflow = readFileSync('.github/workflows/pages.yml', 'utf8');

function execute(env) {
  const context = { __ENV__: env };
  context.globalThis = context;
  vm.runInNewContext(loader, context, { filename: loaderPath });
  return context;
}

const missing = execute(undefined);
assert.equal(missing.__FORGE_PUBLIC_CONFIG_STATE__.state, 'BLOCKED');
assert.equal(missing.__FORGE_PUBLIC_CONFIG_STATE__.canInitializePublicClient, false);
assert.equal(missing.ForgeAlivePublicConfig067G17A1.allowsDemoFixtures(), false);

const incomplete = execute({ SUPABASE_URL: 'https://public.example.invalid', DEMO_MODE: 'false' });
assert.equal(incomplete.__FORGE_PUBLIC_CONFIG_STATE__.state, 'BLOCKED');
assert.equal(incomplete.__FORGE_PUBLIC_CONFIG_STATE__.reason, 'PUBLIC_CONFIG_INCOMPLETE');

const demo = execute({ DEMO_MODE: 'true' });
assert.equal(demo.__FORGE_PUBLIC_CONFIG_STATE__.state, 'DEMO_EXPLICIT');
assert.equal(demo.ForgeAlivePublicConfig067G17A1.allowsDemoFixtures(), true);
assert.equal(demo.ForgeAlivePublicConfig067G17A1.allowsPublicClientInitialization(), false);

const ready = execute({
  SUPABASE_URL: 'https://public.example.invalid',
  SUPABASE_KEY: 'public-anon-placeholder',
  DEMO_MODE: 'false'
});
assert.equal(ready.__FORGE_PUBLIC_CONFIG_STATE__.state, 'READY');
assert.equal(ready.ForgeAlivePublicConfig067G17A1.allowsDemoFixtures(), false);
assert.equal(ready.ForgeAlivePublicConfig067G17A1.allowsPublicClientInitialization(), true);
assert.equal(ready.ForgeAlivePublicConfig067G17A1.allowsProductiveProspectCrud(), false);
assert.deepEqual(Array.from(ready.ForgeAlivePublicConfig067G17A1.allowedKeys), [
  'SUPABASE_URL', 'SUPABASE_KEY', 'DEMO_MODE'
]);

assert.match(html, /<script src="\.\.\/\.\.\/env\.js\?v=__FORGE_BUILD_SHA__"><\/script>[\s\S]*forge-alive-public-config-067g17a1\.js\?v=__FORGE_BUILD_SHA__[\s\S]*sample-data\.js/);
assert.match(sampleData, /allowsDemoFixtures\(\) === true/);
assert.match(mobileHtml, /\.\.\/\.\.\/env\.js\?v=__FORGE_BUILD_SHA__[\s\S]*forge-alive-public-config-067g17a1\.js\?v=__FORGE_BUILD_SHA__[\s\S]*app\.js/);
assert.match(mobileApp, /__FORGE_PUBLIC_CONFIG_STATE__/);
assert.match(mobileApp, /canInitializePublicClient !== true/);
assert.match(loader, /role', result\.state === 'BLOCKED' \? 'alert' : 'status'/);
assert.match(loader, /Forge está bloqueado: falta la configuración pública requerida/);
assert.match(loader, /No se usarán datos demo ni acceso productivo/);
assert.match(workflow, /SUPABASE_URL: \$\{\{ secrets\.SUPABASE_URL \}\}/);
assert.match(workflow, /SUPABASE_ANON_KEY: \$\{\{ secrets\.SUPABASE_ANON_KEY \}\}/);
assert.match(workflow, /SUPABASE_KEY: process\.env\.SUPABASE_ANON_KEY \|\| ""/);
assert.doesNotMatch(workflow, /secrets\.SUPABASE_KEY/);
assert.match(workflow, /rmlxigxysujsuwzgoimv\.supabase\.co/);
assert.match(workflow, /replaceAll\('__FORGE_BUILD_SHA__', process\.env\.GITHUB_SHA\)/);
assert.doesNotMatch(workflow, /console\.log\([^\n]*(SUPABASE_URL|SUPABASE_KEY|SUPABASE_ANON_KEY)/);

for (const prohibited of [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_PASSWORD',
  'GITHUB_TOKEN',
  'TEST_USER_PASSWORD'
]) {
  assert.equal(loader.includes(prohibited), false, `${prohibited} must not enter the browser loader`);
  assert.equal(mobileApp.includes(prohibited), false, `${prohibited} must not enter Mobile Daily`);
}

const builtForgeAlive = html.replaceAll('__FORGE_BUILD_SHA__', 'a'.repeat(40));
const builtMobile = mobileHtml.replaceAll('__FORGE_BUILD_SHA__', 'a'.repeat(40));
assert.doesNotMatch(builtForgeAlive, /__FORGE_BUILD_SHA__/);
assert.doesNotMatch(builtMobile, /__FORGE_BUILD_SHA__/);
assert.match(builtForgeAlive, /env\.js\?v=a{40}/);
assert.match(builtMobile, /env\.js\?v=a{40}/);

console.log('067G17A1 PUBLIC CONFIG: PASS');
