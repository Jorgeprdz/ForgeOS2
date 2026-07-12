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
    response.writeHead(200, { "Content-Type": type });
    createReadStream(file).pipe(response);
  } catch { response.writeHead(404).end(); }
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const browser = await puppeteer.launch({
  executablePath: chromiumPath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-zygote", "--single-process"]
});

const source = `UDI SeguBeca 18
Titular Menor Prueba No 25/06/2022 4 4 Masculino No
Contratante Contratante Prueba No 29/09/1992 33 31 Masculino No
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
const viewports = [{ width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1366, height: 768 }, { width: 1536, height: 864 }];

function rectanglesOverlap(a, b) {
  const horizontal = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const vertical = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return horizontal > 1 && vertical > 1;
}

try {
  for (const viewport of viewports) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/docs/static-preview/forge-alive/nueva-cotizacion/`, { waitUntil: "networkidle0" });
    const result = await page.evaluate(async sourceText => {
      const packet = window.ForgePdfBrowserParser.parsePdfTextToAcceptedQuotePacket(sourceText, { fileName: "segubeca-prueba.pdf" });
      const input = document.querySelector("#fq-solution-online-pdf-105dr");
      const transfer = new DataTransfer();
      transfer.items.add(new File([JSON.stringify(packet)], "segubeca-prueba.accepted-quote.json", { type: "application/json" }));
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 100));
      document.querySelector(".fq-send-pdf-105dr").click();
      await new Promise(resolve => setTimeout(resolve, 100));
      document.querySelector('[data-quote-preview-action="accept"]').click();
      await new Promise(resolve => setTimeout(resolve, 1200));
      const dashboard = document.querySelector('[data-forge-product-type="segubeca"]');
      const contentGrid = dashboard.closest(".fq-grid-105dr");
      const summary = dashboard.closest(".fq-quote-summary-105dr");
      const cards = [...dashboard.querySelectorAll(":scope > .fq-benefit-card-107z15p2")];
      const primaryMetrics = [...dashboard.querySelectorAll(".fq-benefit-mini-card-107z15p2")];
      const visibleTextNodes = [...dashboard.querySelectorAll(".fq-benefit-label-107z15p2, .fq-benefit-card-title-107z15p2")];
      const rect = node => { const value = node.getBoundingClientRect(); return { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height }; };
      const bodyText = document.body.innerText;
      return {
        dashboard: rect(dashboard), contentGrid: rect(contentGrid), summary: rect(summary), cards: cards.map(rect),
        cardOverflow: cards.map(card => card.scrollWidth - card.clientWidth), primaryMetricWidths: primaryMetrics.map(metric => rect(metric).width),
        wrapping: visibleTextNodes.map(node => ({ text: node.textContent.trim(), rect: rect(node), wordBreak: getComputedStyle(node).wordBreak, overflowWrap: getComputedStyle(node).overflowWrap })),
        documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        productType: dashboard.dataset.forgeProductType,
        placeholders: bodyText.includes("Dependiente del plan") || bodyText.includes("Se mostrarán según el plan detectado"),
        objectObject: bodyText.includes("[object Object]"),
        status: document.querySelector(".fq-file-status-105dr")?.textContent || ""
      };
    }, source);

    assert.deepEqual(pageErrors, [], `${viewport.width}px page errors`);
    assert.equal(result.productType, "segubeca");
    assert.ok(result.dashboard.width / result.summary.width >= 0.9, `${viewport.width}px dashboard must use quote-summary width`);
    assert.ok(result.dashboard.width / result.contentGrid.width >= 0.9, `${viewport.width}px dashboard must not leave an artificial right rail`);
    assert.ok(Math.min(...result.cards.map(card => card.width)) >= 240, `${viewport.width}px cards must remain legible`);
    assert.ok(Math.min(...result.primaryMetricWidths) >= 120, `${viewport.width}px primary metrics must remain legible`);
    assert.equal(result.documentOverflow <= 1, true, `${viewport.width}px document overflow`);
    assert.equal(result.cardOverflow.every(value => value <= 2), true, `${viewport.width}px card overflow`);
    assert.equal(result.wrapping.every(item => item.wordBreak !== "break-all" && item.overflowWrap !== "anywhere"), true, `${viewport.width}px character wrapping`);
    assert.equal(result.wrapping.some(item => item.text.length > 8 && item.rect.width < 35 && item.rect.height > item.rect.width * 2.5), false, `${viewport.width}px vertical text`);
    assert.equal(result.cards.some((card, index) => result.cards.slice(index + 1).some(other => rectanglesOverlap(card, other))), false, `${viewport.width}px card overlap`);
    assert.equal(result.placeholders, false);
    assert.equal(result.objectObject, false);
    assert.match(result.status, /Cotización calculada y guardada/);
    await page.close();
  }
  console.log("PASS SeguBeca desktop responsive layout R14I");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
