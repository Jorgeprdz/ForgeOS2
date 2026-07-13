import assert from "node:assert/strict";
import http from "node:http";
import { createReadStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const playwrightPath = process.env.FORGE_PLAYWRIGHT_PATH;
assert.ok(playwrightPath, "FORGE_PLAYWRIGHT_PATH is required");
const { webkit } = await import(playwrightPath);
const root = process.cwd();
const output = process.env.FORGE_VISUAL_OUTPUT || "";

const server = http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const candidate = normalize(join(root, pathname.replace(/^\/+/, "")));
  if (!candidate.startsWith(root)) return response.writeHead(403).end();
  try {
    const info = await stat(candidate);
    const file = info.isDirectory() ? join(candidate, "index.html") : candidate;
    const type = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".json":"application/json" }[extname(file)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type":type, "Cache-Control":"no-store" });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
if (output) await mkdir(output, { recursive:true });

const browser = await webkit.launch({ headless:true });
try {
  const page = await browser.newPage({ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, colorScheme:"dark" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const url = `http://127.0.0.1:${server.address().port}/docs/static-preview/forge-alive/index.html`;
  await page.goto(url, { waitUntil:"networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.forgeHomeR16c === "ready");
  await page.locator(".command-orb").click({ force:true });
  await page.waitForTimeout(460);

  const audit = await page.evaluate(() => {
    const layer = document.querySelector("[data-command-orb-layer]");
    const input = layer.querySelector(".command-pill-input");
    const close = layer.querySelector(".command-pill-close");
    const send = layer.querySelector(".command-pill-send");
    const orb = layer.querySelector(".command-orb");
    const nav = document.querySelector(".bottom-nav");
    const cta = document.querySelector(".primary-card .fake-cta");
    const card = document.querySelector(".primary-card");
    const visible = (node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && box.width > 0 && box.height > 0;
    };
    return {
      overflow:document.documentElement.scrollWidth > document.documentElement.clientWidth,
      layerCount:document.querySelectorAll("[data-command-orb-layer]").length,
      orbCount:document.querySelectorAll(".command-orb").length,
      navCount:document.querySelectorAll(".bottom-nav").length,
      closeVisible:visible(close),
      sendVisible:visible(send),
      placeholder:input.placeholder,
      halo:getComputedStyle(orb, "::before").animationName,
      haloPointer:getComputedStyle(orb, "::before").pointerEvents,
      blur:getComputedStyle(nav).backdropFilter || getComputedStyle(nav).getPropertyValue("-webkit-backdrop-filter"),
      ctaWidth:cta.getBoundingClientRect().width,
      cardWidth:card.getBoundingClientRect().width,
    };
  });

  assert.equal(audit.overflow, false);
  assert.equal(audit.layerCount, 1);
  assert.equal(audit.orbCount, 1);
  assert.equal(audit.navCount, 1);
  assert.equal(audit.closeVisible, true);
  assert.equal(audit.sendVisible, true);
  assert.equal(audit.placeholder, "/quick actions");
  assert.match(audit.halo, /forge-r16c1-orb-halo-pulse/);
  assert.equal(audit.haloPointer, "none");
  assert.match(audit.blur, /blur\(/);
  assert.equal(audit.ctaWidth >= audit.cardWidth - 42, true);

  if (output) await page.screenshot({ path:join(output, "06_webkit_390_command_bar_open_empty.png") });
  await page.locator(".command-pill-close").click({ force:true });
  await page.waitForTimeout(700);
  const closedOrb = await page.locator(".command-orb").evaluate((node) => {
    const style = getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return { visible:style.visibility !== "hidden" && Number(style.opacity) > 0 && box.width > 0 && box.height > 0, visibility:style.visibility, opacity:style.opacity, box:box.toJSON(), expanded:node.closest("[data-command-orb-layer]")?.classList.contains("is-expanded") };
  });
  assert.equal(closedOrb.visible, true, `WebKit close restores the orb ${JSON.stringify(closedOrb)}`);
  if (output) await page.screenshot({ path:join(output, "07_webkit_390_orb_halo_nav_blur.png") });

  await page.emulateMedia({ reducedMotion:"reduce" });
  await page.reload({ waitUntil:"networkidle" });
  const reduced = await page.locator(".command-orb").evaluate((node) => getComputedStyle(node, "::before").animationName);
  assert.equal(reduced, "none");
  assert.deepEqual(errors, []);
  console.log("PASS R16C1 command bar WebKit visual-effects contract", audit);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
