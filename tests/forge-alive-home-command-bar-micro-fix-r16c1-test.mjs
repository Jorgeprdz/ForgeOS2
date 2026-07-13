import assert from "node:assert/strict";
import http from "node:http";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const puppeteerPath = process.env.FORGE_PUPPETEER_CORE_PATH;
const chromiumPath = process.env.FORGE_CHROMIUM_PATH;
assert.ok(puppeteerPath, "FORGE_PUPPETEER_CORE_PATH is required");
assert.ok(chromiumPath, "FORGE_CHROMIUM_PATH is required");
const puppeteer = (await import(puppeteerPath)).default;
const root = process.cwd();
const output = process.env.FORGE_VISUAL_OUTPUT || "";

const [html, runtime, css] = await Promise.all([
  readFile(join(root, "docs/static-preview/forge-alive/index.html"), "utf8"),
  readFile(join(root, "docs/static-preview/forge-alive/command-bar-orb.js"), "utf8"),
  readFile(join(root, "docs/static-preview/forge-alive/forge-alive-home-command-bar-micro-fix-r16c1.css"), "utf8"),
]);
assert.match(html, /placeholder="\/quick actions"/);
assert.match(html, /class="command-pill-close"/);
assert.match(html, /class="command-pill-send"/);
assert.match(runtime, /event\.key === "Enter"/);
assert.match(runtime, /event\.key === "Escape"/);
assert.match(runtime, /forgeCommandBarR16c1Bound/);
assert.match(css, /forge-r16c1-orb-halo-pulse/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /-webkit-backdrop-filter: blur\(30px\)/);
assert.match(css, /backdrop-filter: blur\(30px\)/);
assert.match(css, /primary-card\.glass \.fake-cta[\s\S]*?width: 100%/);

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

const browser = await puppeteer.launch({
  executablePath:chromiumPath,
  headless:true,
  args:["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process", "--no-zygote", "--disable-breakpad", "--disable-crash-reporter"],
});

try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const url = `http://127.0.0.1:${server.address().port}/docs/static-preview/forge-alive/index.html`;
  const audits = [];

  for (const width of [320, 390, 430, 1440]) {
    await page.setViewport({ width, height:width === 1440 ? 1200 : 844, deviceScaleFactor:1 });
    await page.goto(url, { waitUntil:"networkidle0", timeout:30000 });
    await page.waitForFunction(() => document.documentElement.dataset.forgeHomeR16c === "ready");
    await page.evaluate(() => {
      window.__r16c1SubmitCount = 0;
      document.querySelector("[data-command-orb-layer]")?.addEventListener("forge:home-command-submit", () => {
        window.__r16c1SubmitCount += 1;
      });
      document.querySelector(".command-orb")?.click();
    });
    await page.waitForFunction(() => document.querySelector("[data-command-orb-layer]")?.classList.contains("is-expanded"));
    await new Promise((resolve) => setTimeout(resolve, 460));

    const open = await page.evaluate(() => {
      const layer = document.querySelector("[data-command-orb-layer]");
      const input = layer.querySelector(".command-pill-input");
      const close = layer.querySelector(".command-pill-close");
      const send = layer.querySelector(".command-pill-send");
      const pill = layer.querySelector(".command-pill");
      const orb = layer.querySelector(".command-orb");
      const nav = document.querySelector(".bottom-nav");
      const cta = document.querySelector(".primary-card .fake-cta");
      const card = document.querySelector(".primary-card");
      const visible = (node) => {
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && box.width > 0 && box.height > 0;
      };
      const box = (node) => node.getBoundingClientRect().toJSON();
      const pillStyle = getComputedStyle(pill);
      const orbBefore = getComputedStyle(orb, "::before");
      const navStyle = getComputedStyle(nav);
      return {
        overflow:document.documentElement.scrollWidth > document.documentElement.clientWidth,
        layerCount:document.querySelectorAll("[data-command-orb-layer]").length,
        orbCount:document.querySelectorAll(".command-orb").length,
        navCount:document.querySelectorAll(".bottom-nav").length,
        bound:layer.dataset.forgeCommandBarR16c1Bound,
        expanded:layer.getAttribute("aria-expanded"),
        closeVisible:visible(close),
        sendVisible:visible(send),
        layerBox:box(layer),
        pillBox:box(pill),
        pillDisplay:pillStyle.display,
        pillVisibility:pillStyle.visibility,
        pillOpacity:pillStyle.opacity,
        ancestors:Array.from((function*(){ let node=layer; while(node && node !== document.body){ yield { tag:node.tagName, className:node.className, display:getComputedStyle(node).display }; node=node.parentElement; } }()) ),
        closeBox:box(close),
        sendBox:box(send),
        placeholder:input.placeholder,
        inputBox:box(input),
        inputDisplay:getComputedStyle(input).display,
        inputOpacity:getComputedStyle(input).opacity,
        inputColor:getComputedStyle(input).color,
        inputTextFill:getComputedStyle(input).webkitTextFillColor,
        inputFontSize:getComputedStyle(input).fontSize,
        placeholderColor:getComputedStyle(input, "::placeholder").color,
        placeholderOpacity:getComputedStyle(input, "::placeholder").opacity,
        inputValue:input.value,
        sendDisabled:send.disabled,
        transitionDuration:pillStyle.transitionDuration,
        transitionProperty:pillStyle.transitionProperty,
        haloAnimation:orbBefore.animationName,
        haloPointerEvents:orbBefore.pointerEvents,
        backdrop:navStyle.backdropFilter || navStyle.getPropertyValue("-webkit-backdrop-filter"),
        ctaBox:box(cta),
        cardBox:box(card),
      };
    });

    assert.equal(open.overflow, false, `${width}px overflow`);
    assert.equal(open.layerCount, 1, `${width}px layer count`);
    assert.equal(open.orbCount, 1, `${width}px orb count`);
    assert.equal(open.navCount, 1, `${width}px nav count`);
    assert.equal(open.bound, "true", `${width}px idempotent bind`);
    assert.equal(open.expanded, "true", `${width}px expanded state`);
    assert.equal(open.closeVisible, true, `${width}px close visible ${JSON.stringify(open)}`);
    assert.equal(open.sendVisible, true, `${width}px send visible`);
    assert.equal(open.closeBox.height >= 40, true, `${width}px close target ${JSON.stringify(open.closeBox)}`);
    assert.equal(open.sendBox.height >= 40, true, `${width}px send target ${JSON.stringify(open.sendBox)}`);
    assert.equal(open.placeholder, "/quick actions", `${width}px placeholder`);
    assert.equal(open.inputValue, "", `${width}px input initially empty`);
    assert.equal(open.sendDisabled, true, `${width}px empty send disabled`);
    assert.notEqual(open.transitionDuration, "0s", `${width}px smooth transition`);
    assert.match(open.transitionProperty, /opacity|transform/, `${width}px transition properties`);
    assert.match(open.haloAnimation, /forge-r16c1-orb-halo-pulse/, `${width}px halo animation`);
    assert.equal(open.haloPointerEvents, "none", `${width}px halo does not capture clicks`);
    if (width <= 900) {
      assert.match(open.backdrop, /blur\(/, `${width}px navigation blur`);
      assert.equal(open.ctaBox.width >= open.cardBox.width - 42, true, `${width}px restored full CTA width`);
      assert.equal(open.ctaBox.height >= 46, true, `${width}px restored CTA height ${JSON.stringify(open.ctaBox)}`);
    }

    if (output) {
      const name = String(audits.length + 1).padStart(2, "0") + `_${width}_command_bar_open_empty.png`;
      await page.screenshot({ path:join(output, name) });
    }

    await page.type(".command-pill-input", "juan");
    assert.equal(await page.$eval(".command-pill-input", (node) => node.value), "juan", `${width}px input value`);
    assert.equal(await page.$eval(".command-pill-send", (node) => node.disabled), false, `${width}px send enabled`);
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => window.__r16c1SubmitCount), 1, `${width}px Enter submit`);

    await page.keyboard.press("Escape");
    await new Promise((resolve) => setTimeout(resolve, 460));
    assert.equal(await page.$eval("[data-command-orb-layer]", (node) => node.classList.contains("is-expanded")), false, `${width}px Escape close`);
    assert.equal(await page.$eval(".command-orb", (node) => getComputedStyle(node).visibility !== "hidden"), true, `${width}px orb restored`);
    if (output && width === 390) {
      await page.screenshot({ path:join(output, "05_390_closed_cta_restored.png") });
    }

    await page.evaluate(() => document.querySelector(".command-orb")?.click());
    await new Promise((resolve) => setTimeout(resolve, 460));
    assert.equal(await page.$eval(".command-pill-input", (node) => node.value), "", `${width}px reopen remains empty`);
    assert.equal(await page.$eval(".command-pill-send", (node) => node.disabled), true, `${width}px reopen send disabled`);
    await page.evaluate(() => document.querySelector(".command-pill-close")?.click());
    await new Promise((resolve) => setTimeout(resolve, 460));
    assert.equal(await page.$eval("[data-command-orb-layer]", (node) => node.classList.contains("is-expanded")), false, `${width}px close button closes`);
    audits.push({ width, ...open });
  }

  await page.emulateMediaFeatures([{ name:"prefers-reduced-motion", value:"reduce" }]);
  await page.setViewport({ width:390, height:844, deviceScaleFactor:1 });
  await page.goto(url, { waitUntil:"networkidle0" });
  const reduced = await page.$eval(".command-orb", (node) => getComputedStyle(node, "::before").animationName);
  assert.equal(reduced, "none", "reduced motion disables halo pulse");
  assert.deepEqual(errors, []);
  console.log("PASS R16C1 command bar micro-fix browser contract", audits);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
