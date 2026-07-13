import assert from "node:assert/strict";
import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const puppeteerPath = process.env.FORGE_PUPPETEER_CORE_PATH;
const chromiumPath = process.env.FORGE_CHROMIUM_PATH;
assert.ok(puppeteerPath, "FORGE_PUPPETEER_CORE_PATH is required");
assert.ok(chromiumPath, "FORGE_CHROMIUM_PATH is required");
const puppeteer = (await import(puppeteerPath)).default;
const root = process.cwd();

const server = http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const candidate = normalize(join(root, relative));
  if (!candidate.startsWith(root)) return response.writeHead(403).end();
  try {
    const info = await stat(candidate);
    const file = info.isDirectory() ? join(candidate, "index.html") : candidate;
    const type = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json" }[extname(file)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});

const source = `UDI SeguBeca 18
Titular Menor Sintético No 25/06/2022 4 4 Masculino No
Contratante Contratante Sintético No 29/09/1992 33 31 Masculino No
SeguBeca 18 (SeguBeca 18) 14 años 30,000 2,284.33
Protección por Fallecimiento e Invalidez del Contratante (PIM 18 CT UI) 14 años Amparado 73.06
Prima Total Anual 2,524.19
ADAPTA (ADAPTA) 5 REN 100,000 418.73
Prima total con beneficios recomendados 3,080.09
0.00 % 4 2,524 2,524 0 0 0 2,284
84.89 % 17 2,524 35,339 0 30,000 30,000 30,000
La tasa de interes para entrega mensual es estimada a 1.0% anual vigente al momento de la cotización.
1 18 30,000 637 7,647 22,819 24,979
4 21 7,612 637 30,588 - 6,702
Todas las cantidades están expresadas en Unidades de Inversión (UDI).`;

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const browser = await puppeteer.launch({
  executablePath: chromiumPath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-zygote", "--single-process"],
});

try {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/docs/static-preview/forge-alive/nueva-cotizacion/`, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => globalThis.ForgeAcceptedQuoteBridge && globalThis.ForgePdfBrowserParser);
  await page.evaluate(async (sourceText) => {
    const packet = globalThis.ForgePdfBrowserParser.parsePdfTextToAcceptedQuotePacket(sourceText, { fileName: "fixture-publica.pdf" });
    const input = document.querySelector("#fq-solution-online-pdf-105dr");
    const transfer = new DataTransfer();
    transfer.items.add(new File([JSON.stringify(packet)], "fixture-publica.json", { type: "application/json" }));
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    document.querySelector(".fq-send-pdf-105dr").click();
    await new Promise((resolve) => setTimeout(resolve, 100));
    document.querySelector('[data-quote-preview-action="accept"]').click();
  }, source);
  await page.waitForFunction(() => document.querySelector('[data-forge-product-type="segubeca"] [data-forge-hero-metric="true"]'));

  const audits = [];
  for (const viewport of [
    { width: 320, height: 844, columns: 1 },
    { width: 360, height: 844, columns: 1 },
    { width: 390, height: 844, columns: 1 },
    { width: 1024, height: 1366, columns: 8 },
    { width: 1440, height: 1200, columns: 12 },
  ]) {
    await page.setViewport(viewport);
    audits.push(await page.evaluate(({ width, columns }) => {
      const dashboard = document.querySelector('[data-forge-product-type="segubeca"]');
      const cards = [...dashboard.querySelectorAll(":scope > .fq-benefit-card-107z15p2")];
      const summary = dashboard.querySelector('[data-forge-product-section="summary"]');
      const hero = dashboard.querySelector('[data-forge-hero-metric="true"]');
      const metadata = summary?.querySelector('[data-forge-compact-metadata="true"]');
      const templateColumns = getComputedStyle(dashboard).gridTemplateColumns.split(/\s+/).filter(Boolean).length;
      const rowGroups = new Map();
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const key = Math.round(rect.top);
        if (!rowGroups.has(key)) rowGroups.set(key, []);
        rowGroups.get(key).push(rect.height);
      }
      const rowHeightDelta = [...rowGroups.values()]
        .filter((heights) => heights.length > 1)
        .map((heights) => Math.max(...heights) - Math.min(...heights));
      return {
        width,
        expectedColumns: columns,
        templateColumns,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        heroBeforeMetadata: hero && summary ? [...dashboard.children].indexOf(hero) < [...dashboard.children].indexOf(summary) : false,
        heroLabel: hero?.querySelector(".fq-benefit-hero-label-r16b")?.textContent.trim(),
        heroValue: hero?.querySelector(".fq-benefit-hero-value-r16b")?.textContent.trim(),
        metadataPresent: Boolean(metadata),
        summaryMiniCards: summary?.querySelectorAll(".fq-benefit-mini-card-107z15p2").length ?? -1,
        allCardsSpanned: cards.every((card) => card.dataset.forgeDesktopSpan && card.dataset.forgeTabletSpan),
        rowHeightDelta,
      };
    }, viewport));
  }

  assert.deepEqual(pageErrors, []);
  for (const audit of audits) {
    assert.equal(audit.templateColumns, audit.expectedColumns, `${audit.width}px grid columns`);
    assert.equal(audit.overflow, false, `${audit.width}px overflow`);
    assert.equal(audit.heroBeforeMetadata, true, `${audit.width}px hero order`);
    assert.equal(audit.heroLabel, "Meta educativa", `${audit.width}px semantic hero label`);
    assert.match(audit.heroValue, /30,000 UDI/, `${audit.width}px hero value`);
    assert.equal(audit.metadataPresent, true, `${audit.width}px compact metadata`);
    assert.equal(audit.summaryMiniCards, 0, `${audit.width}px nested summary cards`);
    assert.equal(audit.allCardsSpanned, true, `${audit.width}px explicit spans`);
    assert.equal(audit.rowHeightDelta.every((delta) => delta <= 1.5), true, `${audit.width}px aligned row heights`);
  }

  console.log("PASS R16B unified product dashboard responsive browser contract", audits);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
