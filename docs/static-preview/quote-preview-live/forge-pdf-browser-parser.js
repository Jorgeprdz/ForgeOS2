// FORGE:107Z15P2_R11C_HARDEN_VIDA_MUJER_BROWSER_PDF_EXTRACTION:START
const PDFJS_CDN_VERSION_107Z15P2_R11C = "4.10.38";
const PDFJS_MODULE_URL_107Z15P2_R11C = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_CDN_VERSION_107Z15P2_R11C}/build/pdf.mjs`;
const PDFJS_WORKER_URL_107Z15P2_R11C = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_CDN_VERSION_107Z15P2_R11C}/build/pdf.worker.mjs`;

let pdfjsPromise107z15p2R11C = null;

function normalizeText107z15p2R11C(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

function compactText107z15p2R11C(value) {
  return normalizeText107z15p2R11C(value).replace(/\s+/g, " ").trim();
}

function numberFromText107z15p2R11C(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).replace(/[^\d,.\-]/g, "");
  if (!raw) return null;

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  let normalized = raw;

  if (lastComma > -1 && lastDot > -1) {
    normalized = lastComma > lastDot
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw.replace(/,/g, "");
  } else if (lastComma > -1 && lastDot === -1) {
    const tail = raw.length - lastComma - 1;
    normalized = tail === 2 ? raw.replace(",", ".") : raw.replace(/,/g, "");
  } else {
    normalized = raw.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundNumber107z15p2R11C(value) {
  const parsed = numberFromText107z15p2R11C(value);
  return parsed === null ? null : Math.round(parsed);
}

function uniqueSorted107z15p2R11C(values) {
  return [...new Set(values.filter((value) => Number.isFinite(value)))].sort((a, b) => a - b);
}

function decimalCandidates107z15p2R11C(text) {
  const source = compactText107z15p2R11C(text);
  const matches = source.match(/\b\d{1,3}(?:,\d{3})*\.\d{2,5}\b|\b\d+\.\d{2,5}\b/g) || [];
  return matches.map(numberFromText107z15p2R11C).filter((value) => value !== null);
}

function integerCandidates107z15p2R11C(text) {
  const source = compactText107z15p2R11C(text);
  const matches = source.match(/\b\d{1,3}(?:,\d{3})+\b|\b\d{4,6}\b/g) || [];
  return matches.map(numberFromText107z15p2R11C).filter((value) => value !== null);
}

function matchNumber107z15p2R11C(text, patterns) {
  const source = compactText107z15p2R11C(text);
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (!match) continue;
    const value = numberFromText107z15p2R11C(match[1] ?? match[0]);
    if (value !== null) return value;
  }
  return null;
}

function matchText107z15p2R11C(text, patterns) {
  const source = compactText107z15p2R11C(text);
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/\s{2,}/g, " ");
  }
  return null;
}

function findCurrentUdiValue107z15p2R11C() {
  const globalCandidates = [
    globalThis?.ForgeQuoteCalculators?.currentUdiValue,
    globalThis?.ForgeQuoteCalculators?.udiValue,
    globalThis?.ForgeQuoteCalculators?.state?.currentUdiValue,
    globalThis?.ForgeUdi?.currentUdiValue,
    globalThis?.FORGE_CURRENT_UDI_VALUE,
    globalThis?.FORGE_QUOTE_CURRENT_UDI_VALUE
  ];

  for (const candidate of globalCandidates) {
    const parsed = numberFromText107z15p2R11C(candidate);
    if (parsed !== null && parsed > 1) return parsed;
  }

  if (typeof localStorage !== "undefined") {
    for (const key of Object.keys(localStorage)) {
      if (!/udi/i.test(key)) continue;
      const parsed = numberFromText107z15p2R11C(localStorage.getItem(key));
      if (parsed !== null && parsed > 1) return parsed;
    }
  }

  return null;
}

function chooseSumAssured107z15p2R11C(text) {
  const source = compactText107z15p2R11C(text);

  const direct = matchNumber107z15p2R11C(source, [
    /Suma\s+Asegurada\s+B[aá]sico[\s\S]{0,120}?([0-9]{1,3}(?:,[0-9]{3})+)/i,
    /Suma\s+Asegurada[\s\S]{0,120}?([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:UDI|UDIS)/i,
    /Vida\s+Mujer[\s\S]{0,220}?([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:UDI|UDIS)?/i
  ]);

  if (direct !== null && direct >= 1000) return direct;

  const candidates = integerCandidates107z15p2R11C(source)
    .filter((value) => value >= 1000 && value <= 500000);

  const coverageLike = candidates.filter((value) => value >= 10000 && value <= 250000);
  if (!coverageLike.length) return null;

  const counts = new Map();
  for (const value of coverageLike) counts.set(value, (counts.get(value) || 0) + 1);

  return [...counts.entries()]
    .sort((a, b) => {
      const countScore = b[1] - a[1];
      if (countScore) return countScore;
      const basicPreference = Math.abs(a[0] - 50000) - Math.abs(b[0] - 50000);
      if (basicPreference) return basicPreference;
      return a[0] - b[0];
    })[0][0];
}

function choosePremiums107z15p2R11C(text) {
  const source = compactText107z15p2R11C(text);

  let annualPremiumRaw = matchNumber107z15p2R11C(source, [
    /Prima\s+Total\s+Anual(?!\s+con)[\s\S]{0,140}?([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/i,
    /Prima\s+Anual\s+Total(?!\s+con)[\s\S]{0,140}?([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/i
  ]);

  let annualPremiumWithRecommendedRaw = matchNumber107z15p2R11C(source, [
    /Prima\s+Total\s+con\s+Recomendad[oa]s[\s\S]{0,160}?([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/i,
    /Prima\s+Total\s+Anual\s+con\s+Recomendad[oa]s[\s\S]{0,160}?([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/i
  ]);

  const decimals = uniqueSorted107z15p2R11C(decimalCandidates107z15p2R11C(source));
  const largePremiums = decimals.filter((value) => value >= 1000 && value <= 10000);

  if (annualPremiumWithRecommendedRaw === null && largePremiums.length) {
    annualPremiumWithRecommendedRaw = largePremiums[largePremiums.length - 1];
  }

  if (annualPremiumRaw === null && largePremiums.length >= 2) {
    annualPremiumRaw = largePremiums[largePremiums.length - 2];
  } else if (annualPremiumRaw === null && largePremiums.length === 1) {
    annualPremiumRaw = largePremiums[0];
  }

  return {
    annualPremiumRaw,
    annualPremium: roundNumber107z15p2R11C(annualPremiumRaw),
    annualPremiumWithRecommended: roundNumber107z15p2R11C(annualPremiumWithRecommendedRaw)
  };
}

function chooseFinalValues107z15p2R11C(text, sumAssured) {
  const source = compactText107z15p2R11C(text);
  const integers = uniqueSorted107z15p2R11C(
    integerCandidates107z15p2R11C(source).filter((value) => value >= 1000 && value <= 600000)
  );

  let totalContributed = matchNumber107z15p2R11C(source, [
    /Prima\s+Anual\s+Acumulada\s+con\s+AVE[\s\S]{0,140}?([0-9]{1,3}(?:,[0-9]{3})+)/i,
    /Acumulada\s+con\s+AVE[\s\S]{0,140}?([0-9]{1,3}(?:,[0-9]{3})+)/i
  ]);

  let aveSurrenderValue = matchNumber107z15p2R11C(source, [
    /Valor\s+de\s+Rescate\s+AVE[\s\S]{0,140}?([0-9]{1,3}(?:,[0-9]{3})+)/i
  ]);

  let cashValue = matchNumber107z15p2R11C(source, [
    /Valor\s+en\s+Efectivo[\s\S]{0,140}?([0-9]{1,3}(?:,[0-9]{3})+)/i
  ]);

  let recoveryTotal = matchNumber107z15p2R11C(source, [
    /Recuperaci[oó]n\s+Total[\s\S]{0,140}?([0-9]{1,3}(?:,[0-9]{3})+)/i
  ]);

  const recoveryPercentage = matchNumber107z15p2R11C(source, [
    /(?:Porcentaje|%)\s+Recuperaci[oó]n[\s\S]{0,80}?([0-9]{1,3}(?:\.[0-9]+)?)/i,
    /([0-9]{1,3}(?:\.[0-9]+)?)\s*%\s*Recuperaci[oó]n/i
  ]);

  if (totalContributed === null) {
    const plausibleTotals = integers.filter((value) => value >= 100000 && value <= 500000);
    if (plausibleTotals.length) totalContributed = plausibleTotals[plausibleTotals.length - 1];
  }

  if (cashValue === null && sumAssured) {
    cashValue = Math.round(sumAssured * 0.8);
  }

  if (recoveryTotal === null) {
    const plausibleRecoveries = integers
      .filter((value) => value >= 80000 && value <= 400000)
      .filter((value) => totalContributed === null || value < totalContributed)
      .filter((value) => !cashValue || value !== cashValue);
    if (plausibleRecoveries.length) recoveryTotal = plausibleRecoveries[plausibleRecoveries.length - 1];
  }

  if (aveSurrenderValue === null && recoveryTotal !== null && cashValue !== null) {
    const derived = recoveryTotal - cashValue;
    if (derived > 0) aveSurrenderValue = derived;
  }

  if (aveSurrenderValue === null) {
    const plausibleAve = integers
      .filter((value) => value >= 50000 && value <= 300000)
      .filter((value) => value !== totalContributed && value !== recoveryTotal && value !== cashValue && value !== sumAssured);
    if (plausibleAve.length) aveSurrenderValue = plausibleAve[0];
  }

  return {
    totalContributed,
    aveSurrenderValue,
    cashValue,
    recoveryTotal,
    recoveryPercentage
  };
}

function parseCoveragePremium107z15p2R11C(text, code) {
  const source = compactText107z15p2R11C(text);
  const rx = new RegExp(String.raw`\b${code}\b[\s\S]{0,220}?([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})`, "i");
  const match = source.match(rx);
  return match ? numberFromText107z15p2R11C(match[1]) : null;
}

function parseCoverageAmount107z15p2R11C(text, code) {
  const source = compactText107z15p2R11C(text);
  const rx = new RegExp(String.raw`\b${code}\b[\s\S]{0,220}?([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:UDI|UDIS)?`, "i");
  const match = source.match(rx);
  const parsed = match ? numberFromText107z15p2R11C(match[1]) : null;
  return parsed !== null && parsed >= 1000 ? parsed : null;
}

function parseRecommendedCoverages107z15p2R11C(text) {
  const definitions = [
    { code: "ADAPTA", label: "ADAPTA 5 REN" },
    { code: "BMA", label: "BMA" },
    { code: "PEP", label: "PEP A" },
    { code: "CLP", label: "CLP 1 REN" }
  ];

  return definitions
    .map((item) => {
      const annualPremium = parseCoveragePremium107z15p2R11C(text, item.code);
      const sumAssured = parseCoverageAmount107z15p2R11C(text, item.code);
      if (annualPremium === null && sumAssured === null) return null;
      return { code: item.code, label: item.label, sumAssured, annualPremium };
    })
    .filter(Boolean);
}

function parseBaseCoverages107z15p2R11C(text, sumAssured) {
  const definitions = [
    { code: "BAM", label: "BAM UI 1 REN" },
    { code: "BAIT", label: "BAIT 60 P" },
    { code: "AV", label: "AV UI 1 REN" },
    { code: "BIT", label: "BIT 60 P" },
    { code: "PCF", label: "PCF A" }
  ];

  return definitions
    .map((item) => {
      const annualPremium = parseCoveragePremium107z15p2R11C(text, item.code);
      const parsedSumAssured = parseCoverageAmount107z15p2R11C(text, item.code);
      if (annualPremium === null && parsedSumAssured === null && item.code !== "PCF") return null;
      return {
        code: item.code,
        label: item.label,
        sumAssured: parsedSumAssured ?? (item.code === "PCF" ? sumAssured : null),
        annualPremium
      };
    })
    .filter(Boolean);
}

function buildVidaMujerAcceptedQuotePacketFromText107z15p2R11C(text, options = {}) {
  const rawText = normalizeText107z15p2R11C(text);
  const source = compactText107z15p2R11C(rawText);
  const product = /vida\s+mujer/i.test(source) ? "Vida Mujer" : null;
  const missingInformation = [];

  if (!product) missingInformation.push("No se detectó producto Vida Mujer en el PDF.");

  const insured = matchText107z15p2R11C(source, [
    /(?:Nombre|Titular|Asegurad[ao])\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ.\s]{4,80}?)(?=\s+(?:Edad|Sexo|Fuma|Producto|Plan|RFC|Fecha|Vida\s+Mujer)\b)/i
  ]) || "Prospecto Vida Mujer";

  const age = matchNumber107z15p2R11C(source, [
    /(?:Edad|Edad real)\s*:?\s*(\d{1,3})/i
  ]);

  const sumAssured = chooseSumAssured107z15p2R11C(source);
  const premiums = choosePremiums107z15p2R11C(source);
  const paymentYears = matchNumber107z15p2R11C(source, [
    /Plazo\s+de\s+pago[\s\S]{0,80}?(\d{1,2})\s*años/i,
    /Vida\s+Mujer[\s\S]{0,80}?(\d{1,2})\s*años/i
  ]) ?? 20;

  const policyTerm = matchText107z15p2R11C(source, [
    /Vida\s+Mujer[\s\S]{0,80}?(\d{1,2}\s*años)/i,
    /(?:Periodo|Per[ií]odo|Plazo)\s+de\s+cobertura[\s\S]{0,80}?(\d{1,2}\s*años)/i
  ]) || `${paymentYears} años`;

  const finalValues = chooseFinalValues107z15p2R11C(source, sumAssured);

  if (sumAssured === null || sumAssured < 1000) missingInformation.push("Suma asegurada básica.");
  if (premiums.annualPremium === null) missingInformation.push("Prima total anual.");
  if (finalValues.totalContributed === null) missingInformation.push("Prima anual acumulada con AVE.");

  const currentUdiValue = numberFromText107z15p2R11C(options.currentUdiValue) ?? findCurrentUdiValue107z15p2R11C();
  const plannedOrAvePremium = finalValues.totalContributed && paymentYears
    ? Math.round(finalValues.totalContributed / paymentYears)
    : null;

  const guaranteedFinalRow = {
    year: paymentYears,
    policyYear: paymentYears,
    annualPremiumAccumulatedWithAve: finalValues.totalContributed,
    primaAnualAcumuladaConAve: finalValues.totalContributed,
    aveSurrenderValue: finalValues.aveSurrenderValue,
    valorRescateAve: finalValues.aveSurrenderValue,
    cashValue: finalValues.cashValue,
    valorEnEfectivo: finalValues.cashValue,
    recoveryTotal: finalValues.recoveryTotal,
    recuperacionTotal: finalValues.recoveryTotal,
    recoveryPercentage: finalValues.recoveryPercentage,
    porcentajeRecuperacion: finalValues.recoveryPercentage
  };

  const recommendedCoverages = parseRecommendedCoverages107z15p2R11C(source);

  const nativeResult = {
    source: "browser_pdf_parser",
    extractionVersion: "107z15p2_R11C",
    product,
    productFamily: "life",
    currency: "UDI",
    prospect: insured,
    insured,
    age,
    gender: /femenino|mujer/i.test(source) ? "Femenino" : undefined,
    smokingStatus: /no\s+fum/i.test(source) ? "No fumador" : undefined,
    sumInsured: sumAssured,
    sumAssured,
    basicSumAssured: sumAssured,
    policyTerm,
    coveragePeriod: policyTerm,
    paymentYears,
    premiumTable: {
      annual: premiums.annualPremium,
      plannedAnnual: plannedOrAvePremium,
      annualWithRecommended: premiums.annualPremiumWithRecommended
    },
    totalAnnualPremium: premiums.annualPremium,
    totalAnnualPremiumWithRecommended: premiums.annualPremiumWithRecommended,
    totalContributed: finalValues.totalContributed,
    primaTotalAcumuladaConAve: finalValues.totalContributed,
    aveSurrenderValue: finalValues.aveSurrenderValue,
    valorRescateAve: finalValues.aveSurrenderValue,
    cashValue: finalValues.cashValue,
    valorEnEfectivo: finalValues.cashValue,
    recoveryTotal: finalValues.recoveryTotal,
    recuperacionTotal: finalValues.recoveryTotal,
    recoveryPercentage: finalValues.recoveryPercentage,
    porcentajeRecuperacion: finalValues.recoveryPercentage,
    coverages: parseBaseCoverages107z15p2R11C(source, sumAssured),
    recommendedCoverages,
    guaranteedValues: [guaranteedFinalRow],
    guaranteedValueRows: [guaranteedFinalRow],
    missing_information: missingInformation,
    rawText
  };

  return {
    schemaVersion: "forge.accepted_quote_packet.v1",
    source: "browser_pdf_parser",
    extractionVersion: "107z15p2_R11C",
    fileName: options.fileName || null,
    name: insured,
    family: "life",
    productFamily: "life",
    product_family: "life",
    product,
    insured,
    age,
    currency: "UDI",
    sumAssured,
    sumInsured: sumAssured,
    annualPremium: premiums.annualPremium,
    annualPremiumWithRecommended: premiums.annualPremiumWithRecommended,
    plannedOrAvePremium,
    coveragePeriod: policyTerm,
    paymentYears,
    context: {
      name: insured,
      family: "life",
      productFamily: "life",
      product_family: "life",
      product,
      insured
    },
    currencyMetadata: {
      currentUdiValue,
      source: currentUdiValue ? "browser_cache_or_global" : "not_available"
    },
    nativeResult,
    missing_information: missingInformation
  };
}

async function loadPdfJs107z15p2R11C() {
  if (!pdfjsPromise107z15p2R11C) {
    pdfjsPromise107z15p2R11C = import(PDFJS_MODULE_URL_107Z15P2_R11C).then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL_107Z15P2_R11C;
      return pdfjsLib;
    });
  }
  return pdfjsPromise107z15p2R11C;
}

export async function extractTextFromPdfFile107z15p2R11C(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Archivo PDF inválido o no compatible con arrayBuffer().");
  }

  const pdfjsLib = await loadPdfJs107z15p2R11C();
  const arrayBuffer = await file.arrayBuffer();
  const documentTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await documentTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => item.str || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

export function parseVidaMujerPdfTextToAcceptedQuotePacket(text, options = {}) {
  return buildVidaMujerAcceptedQuotePacketFromText107z15p2R11C(text, options);
}

export async function parsePdfFileToAcceptedQuotePacket(file, options = {}) {
  const text = await extractTextFromPdfFile107z15p2R11C(file);
  return parseVidaMujerPdfTextToAcceptedQuotePacket(text, {
    ...options,
    fileName: options.fileName || file?.name || null
  });
}

function isPdfFile107z15p2R11C(file) {
  return Boolean(file) && (
    file.type === "application/pdf" ||
    /\.pdf$/i.test(file.name || "")
  );
}

function ensurePdfStatusBox107z15p2R11C(input) {
  if (!input || typeof document === "undefined") return null;
  const existing = input.closest("label, section, div")?.querySelector?.("[data-forge-pdf-status='true']");
  if (existing) return existing;

  const box = document.createElement("div");
  box.setAttribute("data-forge-pdf-status", "true");
  box.style.marginTop = "10px";
  box.style.fontSize = "0.86rem";
  box.style.lineHeight = "1.35";
  box.style.color = "#2563eb";
  box.textContent = "";
  input.insertAdjacentElement("afterend", box);
  return box;
}

function setPdfStatus107z15p2R11C(input, message, tone = "info") {
  const box = ensurePdfStatusBox107z15p2R11C(input);
  if (!box) return;
  box.textContent = message;
  box.dataset.tone = tone;
  box.style.color = tone === "error" ? "#b91c1c" : tone === "success" ? "#047857" : "#2563eb";
}

async function convertPdfInputToJsonChange107z15p2R11C(input, file) {
  setPdfStatus107z15p2R11C(input, "PDF recibido. Extrayendo campos en el navegador…", "info");

  const packet = await parsePdfFileToAcceptedQuotePacket(file, { fileName: file.name });

  if (packet?.missing_information?.length) {
    setPdfStatus107z15p2R11C(
      input,
      `PDF convertido con datos faltantes: ${packet.missing_information.join(", ")}.`,
      "error"
    );
  } else {
    setPdfStatus107z15p2R11C(input, "PDF convertido a cotización aceptada. Abriendo modal…", "success");
  }

  if (typeof File === "undefined" || typeof DataTransfer === "undefined") {
    globalThis.dispatchEvent?.(new CustomEvent("forge:accepted-quote-packet-ready", { detail: { packet } }));
    return;
  }

  const jsonFileName = `${(file.name || "cotizacion").replace(/\.pdf$/i, "")}.accepted-quote.json`;
  const jsonFile = new File(
    [JSON.stringify(packet, null, 2)],
    jsonFileName,
    { type: "application/json" }
  );

  const transfer = new DataTransfer();
  transfer.items.add(jsonFile);
  input.files = transfer.files;

  const event = new Event("change", { bubbles: true });
  input.dispatchEvent(event);
}

function installPdfInputInterceptor107z15p2R11C() {
  if (typeof document === "undefined") return;
  if (globalThis.__FORGE_107Z15P2_R11C_PDF_INTERCEPTOR__) return;
  globalThis.__FORGE_107Z15P2_R11C_PDF_INTERCEPTOR__ = true;

  document.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.type !== "file") return;
    const file = input.files?.[0];
    if (!isPdfFile107z15p2R11C(file)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    convertPdfInputToJsonChange107z15p2R11C(input, file).catch((error) => {
      console.error("[FORGE R11C] PDF browser parser failed", error);
      setPdfStatus107z15p2R11C(
        input,
        `No pude extraer la cotización del PDF: ${error?.message || error}`,
        "error"
      );
    });
  }, true);
}

globalThis.ForgePdfBrowserParser = {
  parsePdfFileToAcceptedQuotePacket,
  parseVidaMujerPdfTextToAcceptedQuotePacket,
  extractTextFromPdfFile107z15p2R11C
};

installPdfInputInterceptor107z15p2R11C();
// FORGE:107Z15P2_R11C_HARDEN_VIDA_MUJER_BROWSER_PDF_EXTRACTION:END
