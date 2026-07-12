function benefitBlockKey107z15p2R9E(title) {
  const normalized = String(title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("aporta")) return "contribution";
  if (normalized.includes("protege")) return "protection";
  if (normalized.includes("dotal")) return "endowments";
  if (normalized.includes("recuper")) return "recovery";
  if (normalized.includes("pcf") || normalized.includes("enfermedad")) return "women_health";
  if (normalized.includes("recomend")) return "recommended";
  return "other";
}

function normalizeBenefitLayout107z15p2R9E() {
  const summaries = Array.from(document.querySelectorAll(".fq-benefit-summary-107z15p2"));
  if (!summaries.length) return;

  document.body.setAttribute("data-forge-benefit-layout-expanded", "true");

  for (const summary of summaries) {
    const panel = summary.closest("dl");
    if (panel) panel.setAttribute("data-forge-benefit-panel", "true");

    const valueCell = summary.closest("dd");
    if (valueCell) valueCell.setAttribute("data-forge-benefit-panel-value", "true");

    for (const block of summary.querySelectorAll(".fq-benefit-block-107z15p2")) {
      if (block.dataset.forgeBenefitBlock) continue;
      const title = block.querySelector(".fq-benefit-title-107z15p2")?.textContent || "";
      block.dataset.forgeBenefitBlock = benefitBlockKey107z15p2R9E(title);
    }
  }
}

function installBenefitLayoutObserver107z15p2R9E() {
  // The renderer owns structure and calls normalization after each render.
  // Kept as a compatibility entry point for older imports; no observer is needed.
  normalizeBenefitLayout107z15p2R9E();
}

function installBenefitSummaryStyles107z15p2R11K() {
  if (document.getElementById("forge-107z15p2-r11k-benefit-layout")) return;
  const style = document.createElement("style");
  style.id = "forge-107z15p2-r11k-benefit-layout";
  style.textContent = `
    :root {
      --forge-benefit-title: #f4dc65;
      --forge-benefit-label: rgba(226, 232, 240, .76);
      --forge-benefit-udi: #ffe66d;
      --forge-benefit-mxn: #7dd3fc;
      --forge-benefit-good: #86efac;
      --forge-benefit-muted: rgba(148, 163, 184, .78);
      --forge-benefit-line: rgba(132, 222, 245, .15);
      --forge-benefit-card: rgba(255, 255, 255, .035);
      --forge-benefit-tile: rgba(125, 211, 252, .045);
    }

    body[data-forge-benefit-layout-expanded="true"] .fq-quote-summary-105dr {
      width: min(1480px, calc(100vw - 40px)) !important;
      max-width: none !important;
      margin-inline: auto !important;
      overflow: visible !important;
    }

    body[data-forge-benefit-layout-expanded="true"] [data-forge-benefit-panel="true"],
    body[data-forge-benefit-layout-expanded="true"] [data-forge-benefit-panel-value="true"] {
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
      overflow: visible !important;
    }

    .fq-benefit-summary-107z15p2 {
      display: grid !important;
      grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
      gap: 16px !important;
      align-items: start !important;
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
      overflow: visible !important;
    }

    .fq-benefit-block-107z15p2 {
      grid-column: span 4 !important;
      min-width: 0 !important;
      width: auto !important;
      max-width: none !important;
      padding: 18px !important;
      overflow: hidden !important;
      background: linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.025)) !important;
      border: 1px solid var(--forge-benefit-line) !important;
      border-radius: 16px !important;
      box-shadow: none !important;
    }

    .fq-benefit-block-107z15p2[data-forge-benefit-block="contribution"] { grid-column: span 7 !important; }
    .fq-benefit-block-107z15p2[data-forge-benefit-block="protection"] { grid-column: span 5 !important; }
    .fq-benefit-block-107z15p2[data-forge-benefit-block="endowments"],
    .fq-benefit-block-107z15p2[data-forge-benefit-block="other"] { grid-column: 1 / -1 !important; }

    .fq-benefit-title-107z15p2 {
      margin: 0 0 14px !important;
      color: var(--forge-benefit-title) !important;
      font-size: 1rem !important;
      line-height: 1.25 !important;
    }

    .fq-benefit-tile-grid-107z15p2 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .fq-benefit-tile-107z15p2,
    .fq-endowment-chip-107z15p2,
    .fq-endowment-summary-card-107z15p2 {
      min-width: 0;
      padding: 11px 12px;
      border: 1px solid var(--forge-benefit-line);
      border-radius: 12px;
      background: var(--forge-benefit-tile);
    }

    .fq-benefit-concept-107z15p2,
    .fq-benefit-table-107z15p2 th,
    .fq-endowment-year-107z15p2 {
      color: var(--forge-benefit-label) !important;
      font-size: .76rem !important;
      font-weight: 800 !important;
      line-height: 1.25 !important;
      overflow-wrap: break-word !important;
    }

    .fq-benefit-value-107z15p2,
    .fq-benefit-token-udi-107z15p2,
    .fq-endowment-udi-107z15p2 {
      color: var(--forge-benefit-udi) !important;
      font-weight: 900 !important;
    }

    .fq-benefit-token-mxn-107z15p2,
    .fq-endowment-mxn-107z15p2 {
      color: var(--forge-benefit-mxn) !important;
      font-weight: 850 !important;
    }

    .fq-benefit-token-good-107z15p2 { color: var(--forge-benefit-good) !important; font-weight: 850 !important; }
    .fq-benefit-token-muted-107z15p2 { color: var(--forge-benefit-muted) !important; }

    .fq-benefit-table-wrap-107z15p2 { width: 100% !important; overflow: visible !important; }
    .fq-benefit-table-107z15p2 { width: 100% !important; table-layout: fixed !important; }
    .fq-benefit-table-107z15p2 th { width: 43% !important; padding-right: 12px !important; }
    .fq-benefit-table-107z15p2 td { color: var(--forge-benefit-udi) !important; overflow-wrap: break-word !important; }

    [data-forge-benefit-block="women_health"] .fq-benefit-table-107z15p2 tbody,
    [data-forge-benefit-block="recommended"] .fq-benefit-table-107z15p2 tbody {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 9px !important;
    }

    [data-forge-benefit-block="women_health"] .fq-benefit-table-107z15p2 tr,
    [data-forge-benefit-block="recommended"] .fq-benefit-table-107z15p2 tr {
      display: grid !important;
      grid-template-columns: minmax(105px, .8fr) minmax(0, 1.2fr) !important;
      gap: 8px !important;
      min-width: 0 !important;
      padding: 9px !important;
      border: 1px solid var(--forge-benefit-line) !important;
      border-radius: 11px !important;
      background: var(--forge-benefit-tile) !important;
    }

    [data-forge-benefit-block="women_health"] .fq-benefit-table-107z15p2 th,
    [data-forge-benefit-block="recommended"] .fq-benefit-table-107z15p2 th { width: auto !important; }

    .fq-endowment-schedule-107z15p2 { display: grid !important; gap: 12px !important; }
    .fq-endowment-chips-107z15p2 {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 9px;
    }
    .fq-endowment-chip-107z15p2 { text-align: center; }
    .fq-endowment-chip-107z15p2 > * { display: block; }
    .fq-endowment-udi-107z15p2 { margin-top: 5px; font-size: .88rem; }
    .fq-endowment-mxn-107z15p2 { margin-top: 3px; font-size: .72rem; }
    .fq-endowment-summary-107z15p2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .fq-endowment-summary-card-107z15p2 { display: grid; gap: 5px; }

    @media (max-width: 1180px) and (min-width: 761px) {
      .fq-benefit-summary-107z15p2 { grid-template-columns: repeat(8, minmax(0, 1fr)) !important; }
      .fq-benefit-block-107z15p2[data-forge-benefit-block="contribution"],
      .fq-benefit-block-107z15p2[data-forge-benefit-block="protection"] { grid-column: span 4 !important; }
      .fq-benefit-block-107z15p2[data-forge-benefit-block="endowments"],
      .fq-benefit-block-107z15p2[data-forge-benefit-block="other"] { grid-column: 1 / -1 !important; }
      .fq-benefit-block-107z15p2[data-forge-benefit-block="recovery"],
      .fq-benefit-block-107z15p2[data-forge-benefit-block="women_health"],
      .fq-benefit-block-107z15p2[data-forge-benefit-block="recommended"] { grid-column: span 4 !important; }
      .fq-benefit-tile-grid-107z15p2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .fq-endowment-chips-107z15p2 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      [data-forge-benefit-block="women_health"] .fq-benefit-table-107z15p2 tbody,
      [data-forge-benefit-block="recommended"] .fq-benefit-table-107z15p2 tbody { grid-template-columns: 1fr !important; }
    }

    @media (max-width: 760px) {
      /* Mobile presentation remains parked; preserve the existing single-column contract. */
      .fq-benefit-summary-107z15p2 { grid-template-columns: 1fr !important; }
      .fq-benefit-block-107z15p2[data-forge-benefit-block] { grid-column: 1 / -1 !important; }
      .fq-benefit-tile-grid-107z15p2,
      .fq-endowment-chips-107z15p2,
      .fq-endowment-summary-107z15p2 { grid-template-columns: 1fr !important; }
      [data-forge-benefit-block="women_health"] .fq-benefit-table-107z15p2 tbody,
      [data-forge-benefit-block="recommended"] .fq-benefit-table-107z15p2 tbody { display: table-row-group !important; }
    }
  `;
  document.head.appendChild(style);
}

const api = Object.freeze({
  benefitBlockKey107z15p2R9E,
  normalizeBenefitLayout107z15p2R9E,
  installBenefitLayoutObserver107z15p2R9E
});

globalThis.ForgeBenefitSummaryLayout = api;
installBenefitSummaryStyles107z15p2R11K();

export {
  benefitBlockKey107z15p2R9E,
  normalizeBenefitLayout107z15p2R9E,
  installBenefitLayoutObserver107z15p2R9E
};
