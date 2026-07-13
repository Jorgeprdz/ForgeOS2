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
  await page.waitForFunction(() => globalThis.ForgeQuoteIntakeState && globalThis.ForgeAcceptedQuoteBridge);

  const empty = await page.evaluate(() => {
    const rootElement = document.querySelector('[data-forge-module="dedicated-new-quote-static-route"]');
    const results = document.querySelector("[data-forge-intake-results]");
    const upload = document.querySelector(".fq-upload-105dr");
    const shell = document.querySelector(".fq-shell-105dr");
    const submit = document.querySelector(".fq-send-pdf-105dr");
    return {
      state: rootElement.dataset.forgeIntakeState,
      resultsHidden: results.hidden,
      resultsHeight: results.getBoundingClientRect().height,
      visibleLowerCards: [...results.querySelectorAll(".fq-card-105dr")].filter((card) => card.getClientRects().length).length,
      submitHidden: submit.hidden,
      trailingHeight: shell.getBoundingClientRect().bottom - upload.getBoundingClientRect().bottom,
      headingVisible: document.querySelector("#nueva-cotizacion-title").getClientRects().length > 0,
      uploadVisible: upload.getClientRects().length > 0,
    };
  });
  assert.equal(empty.state, "empty");
  assert.equal(empty.resultsHidden, true);
  assert.equal(empty.resultsHeight, 0);
  assert.equal(empty.visibleLowerCards, 0);
  assert.equal(empty.submitHidden, true);
  assert.ok(empty.trailingHeight <= 30);
  assert.equal(empty.headingVisible, true);
  assert.equal(empty.uploadVisible, true);

  const mobile = [];
  for (const width of [320, 360, 390]) {
    await page.setViewport({ width, height: 844, deviceScaleFactor: 1 });
    mobile.push(await page.evaluate(() => {
      const label = document.querySelector(".fq-file-label-105dr");
      const rect = label.getBoundingClientRect();
      return {
        width: document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        label: label.textContent.trim(),
        labelInside: rect.left >= 0 && rect.right <= document.documentElement.clientWidth,
        touchHeight: rect.height,
        wordBreak: getComputedStyle(label).wordBreak,
        associatedInput: label.getAttribute("for") === "fq-solution-online-pdf-105dr",
      };
    }));
  }
  assert.equal(mobile.every((entry) => !entry.overflow), true);
  assert.equal(mobile.every((entry) => entry.label === "Seleccionar PDF"), true);
  assert.equal(mobile.every((entry) => entry.labelInside), true);
  assert.equal(mobile.every((entry) => entry.touchHeight >= 44), true);
  assert.equal(mobile.every((entry) => entry.wordBreak === "normal"), true);
  assert.equal(mobile.every((entry) => entry.associatedInput), true);

  const stateChecks = await page.evaluate(() => {
    const api = globalThis.ForgeQuoteIntakeState;
    const results = document.querySelector("[data-forge-intake-results]");
    const submit = document.querySelector(".fq-send-pdf-105dr");
    const label = document.querySelector(".fq-file-label-105dr");
    const status = document.querySelector(".fq-file-status-105dr");
    const input = document.querySelector("#fq-solution-online-pdf-105dr");
    api.setState("LOADING");
    const loading = {
      state: api.getState(),
      resultsHidden: results.hidden,
      submitHidden: submit.hidden,
      busy: document.querySelector(".fq-upload-105dr").getAttribute("aria-busy"),
      labelDisabled: label.getAttribute("aria-disabled"),
      status: status.textContent,
    };
    const invalidTransfer = new DataTransfer();
    invalidTransfer.items.add(new File(["not a pdf"], "invalido.pdf", { type: "application/pdf" }));
    input.files = invalidTransfer.files;
    api.setState("ERROR", { message: "Archivo inválido.", resetResults: true });
    const error = {
      state: api.getState(),
      resultsHidden: results.hidden,
      submitHidden: submit.hidden,
      labelDisabled: label.getAttribute("aria-disabled"),
      role: status.getAttribute("role"),
      status: status.textContent,
      fileName: input.files[0]?.name,
      fileType: input.files[0]?.type,
    };
    let clickCount = 0;
    input.click = () => { clickCount += 1; };
    label.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    return { loading, error, clickCount };
  });
  assert.deepEqual(stateChecks.loading, {
    state: "LOADING",
    resultsHidden: true,
    submitHidden: true,
    busy: "true",
    labelDisabled: "true",
    status: "Procesando archivo localmente…",
  });
  assert.deepEqual(stateChecks.error, {
    state: "ERROR",
    resultsHidden: true,
    submitHidden: true,
    labelDisabled: "false",
    role: "alert",
    status: "Archivo inválido.",
    fileName: "invalido.pdf",
    fileType: "application/pdf",
  });
  assert.equal(stateChecks.clickCount, 1);

  const validPacket = {
    nativeResult: {
      prospect: "Fixture pública",
      product: "Producto sintético",
      sumInsured: "100 UDI",
      premiumTable: { annual: 10 },
      paymentTerm: "1 año",
      policyTerm: "1 año",
      currency: "UDI",
    },
    context: { productFamily: "fixture" },
  };
  await page.evaluate((packet) => {
    const input = document.querySelector("#fq-solution-online-pdf-105dr");
    const transfer = new DataTransfer();
    transfer.items.add(new File([JSON.stringify(packet)], "fixture-publica.json", { type: "application/json" }));
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, validPacket);
  await page.waitForFunction(() => globalThis.ForgeQuoteIntakeState.getState() === "READY");
  const ready = await page.evaluate(() => ({
    resultsHidden: document.querySelector("[data-forge-intake-results]").hidden,
    submitHidden: document.querySelector(".fq-send-pdf-105dr").hidden,
    submitDisabled: document.querySelector(".fq-send-pdf-105dr").disabled,
    status: document.querySelector(".fq-file-status-105dr").textContent,
    clientValue: document.querySelector("#fq-client-105dr")?.value,
  }));
  assert.equal(ready.resultsHidden, false);
  assert.equal(ready.submitHidden, false);
  assert.equal(ready.submitDisabled, false);
  assert.match(ready.status, /fixture-publica\.json cargado/);
  assert.equal(ready.clientValue, "Fixture pública");

  const reset = await page.evaluate(() => {
    globalThis.ForgeQuoteIntakeState.reset();
    const results = document.querySelector("[data-forge-intake-results]");
    return {
      state: globalThis.ForgeQuoteIntakeState.getState(),
      resultsHidden: results.hidden,
      submitHidden: document.querySelector(".fq-send-pdf-105dr").hidden,
      staleClient: document.querySelector("#fq-client-105dr")?.value,
      runtimeGrids: results.querySelectorAll('[data-forge-runtime-grid="true"]').length,
    };
  });
  assert.deepEqual(reset, {
    state: "EMPTY",
    resultsHidden: true,
    submitHidden: true,
    staleClient: "",
    runtimeGrids: 0,
  });

  const invalidPdf = {
    resultsHidden: stateChecks.error.resultsHidden,
    submitHidden: stateChecks.error.submitHidden,
    statusRole: stateChecks.error.role,
  };
  assert.deepEqual(invalidPdf, { resultsHidden: true, submitHidden: true, statusRole: "alert" });
  assert.deepEqual(pageErrors, []);

  console.log("PASS R16A Forge Alive quote intake browser integration", {
    empty,
    mobile,
    loading: stateChecks.loading,
    error: stateChecks.error,
    ready: { lowerCardsVisible: true, jsonMessage: true },
    reset,
    invalidPdf,
  });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
