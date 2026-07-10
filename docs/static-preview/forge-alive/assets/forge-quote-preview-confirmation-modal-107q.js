(function () {
  "use strict";

  const FIELD_CONTRACT = [
    { fieldKey: "client_name", label: "Nombre" },
    { fieldKey: "product_family", label: "Familia" },
    { fieldKey: "product_name", label: "Producto" },
    { fieldKey: "insured_name", label: "Asegurado" },
    { fieldKey: "sum_insured", label: "Suma Asegurada" },
    { fieldKey: "annual_premium", label: "Prima Anual" },
    { fieldKey: "planned_or_ave_premium", label: "Prima AVE / Prima Planeada" },
    { fieldKey: "coverage_period", label: "Periodo Cobertura" }
  ];

  const SELECTOR_MAP = {
    client_name: [
      '[name="client_name"]',
      '[name="nombre"]',
      '[data-field="client_name"]',
      '[data-forge-field="client_name"]'
    ],
    product_family: [
      '[name="product_family"]',
      '[name="familia"]',
      '[data-field="product_family"]',
      '[data-forge-field="product_family"]'
    ],
    product_name: [
      '[name="product_name"]',
      '[name="producto"]',
      '[data-field="product_name"]',
      '[data-forge-field="product_name"]'
    ],
    insured_name: [
      '[name="insured_name"]',
      '[name="asegurado"]',
      '[data-field="insured_name"]',
      '[data-forge-field="insured_name"]'
    ],
    sum_insured: [
      '[name="sum_insured"]',
      '[name="suma_asegurada"]',
      '[data-field="sum_insured"]',
      '[data-forge-field="sum_insured"]'
    ],
    annual_premium: [
      '[name="annual_premium"]',
      '[name="prima_anual"]',
      '[data-field="annual_premium"]',
      '[data-forge-field="annual_premium"]'
    ],
    planned_or_ave_premium: [
      '[name="planned_or_ave_premium"]',
      '[name="prima_planeada"]',
      '[name="prima_ave"]',
      '[data-field="planned_or_ave_premium"]',
      '[data-forge-field="planned_or_ave_premium"]'
    ],
    coverage_period: [
      '[name="coverage_period"]',
      '[name="periodo_cobertura"]',
      '[data-field="coverage_period"]',
      '[data-forge-field="coverage_period"]'
    ]
  };

  let latestPayload = null;

  function normalizePayload(payload) {
    const values = payload && (payload.values || payload.fields || payload.extractedFields || payload);
    const normalized = {};

    FIELD_CONTRACT.forEach((field) => {
      const candidate = values ? values[field.fieldKey] : null;
      if (candidate && typeof candidate === "object" && "value" in candidate) {
        normalized[field.fieldKey] = candidate.value;
      } else {
        normalized[field.fieldKey] = candidate ?? "";
      }
    });

    return normalized;
  }

  function setFieldValue(fieldKey, value) {
    const selectors = SELECTOR_MAP[fieldKey] || [];
    let changed = false;

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        if ("value" in node) {
          node.value = value ?? "";
          node.dispatchEvent(new Event("input", { bubbles: true }));
          node.dispatchEvent(new Event("change", { bubbles: true }));
          changed = true;
        } else {
          node.textContent = value ?? "";
          changed = true;
        }
      });
    });

    return changed;
  }

  function fillUi(values) {
    const result = {};
    FIELD_CONTRACT.forEach((field) => {
      result[field.fieldKey] = setFieldValue(field.fieldKey, values[field.fieldKey]);
    });

    document.documentElement.setAttribute("data-forge-quote-preview-confirmed", "true");
    window.dispatchEvent(new CustomEvent("forge:quote-preview:confirmation:accepted", {
      detail: {
        source: "ForgeQuotePreviewConfirmationModal",
        populatedFields: result
      }
    }));
  }

  function openEditMode(values) {
    fillUi(values);
    document.documentElement.setAttribute("data-forge-quote-preview-edit-mode", "true");

    const firstSelector = SELECTOR_MAP.client_name && SELECTOR_MAP.client_name[0];
    const first = firstSelector ? document.querySelector(firstSelector) : null;
    if (first && typeof first.focus === "function") first.focus();

    window.dispatchEvent(new CustomEvent("forge:quote-preview:confirmation:edit", {
      detail: {
        source: "ForgeQuotePreviewConfirmationModal"
      }
    }));
  }

  function ensureModal() {
    let backdrop = document.querySelector("[data-forge-confirmation-modal]");
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.className = "forge-confirmation-modal-backdrop";
    backdrop.setAttribute("data-forge-confirmation-modal", "true");
    backdrop.innerHTML = `
      <section class="forge-confirmation-modal-card" role="dialog" aria-modal="true" aria-labelledby="forge-confirmation-title">
        <h2 id="forge-confirmation-title">¿Son correctos los datos?</h2>
        <p>Forge leyó la cotización y preparó estos datos. Confirma para llenar la UI o edita si algo no coincide.</p>
        <div class="forge-confirmation-modal-grid" data-forge-confirmation-fields></div>
        <div class="forge-confirmation-modal-actions">
          <button type="button" class="forge-confirmation-modal-button" data-action="no">No, editar datos</button>
          <button type="button" class="forge-confirmation-modal-button" data-action="yes">Sí, llenar datos</button>
        </div>
      </section>
    `;

    document.body.appendChild(backdrop);

    backdrop.querySelector('[data-action="yes"]').addEventListener("click", () => {
      const values = normalizePayload(latestPayload);
      fillUi(values);
      backdrop.setAttribute("data-open", "false");
    });

    backdrop.querySelector('[data-action="no"]').addEventListener("click", () => {
      const values = normalizePayload(latestPayload);
      openEditMode(values);
      backdrop.setAttribute("data-open", "false");
    });

    return backdrop;
  }

  function renderFields(backdrop, values) {
    const grid = backdrop.querySelector("[data-forge-confirmation-fields]");
    grid.innerHTML = "";

    FIELD_CONTRACT.forEach((field) => {
      const row = document.createElement("div");
      row.className = "forge-confirmation-modal-row";
      row.innerHTML = `
        <div class="forge-confirmation-modal-label"></div>
        <div class="forge-confirmation-modal-value"></div>
      `;
      row.querySelector(".forge-confirmation-modal-label").textContent = field.label;
      row.querySelector(".forge-confirmation-modal-value").textContent = values[field.fieldKey] || "Revisar";
      grid.appendChild(row);
    });
  }

  function open(payload) {
    latestPayload = payload || window.__FORGE_QUOTE_PREVIEW_EXTRACTION__ || {};
    const values = normalizePayload(latestPayload);
    const backdrop = ensureModal();
    renderFields(backdrop, values);
    backdrop.setAttribute("data-open", "true");
  }

  window.ForgeQuotePreviewConfirmationModal = {
    open,
    fillUi,
    openEditMode,
    fields: FIELD_CONTRACT.slice()
  };

  window.addEventListener("forge:quote-preview:extraction-ready", (event) => {
    open(event.detail || {});
  });

  if (window.__FORGE_QUOTE_PREVIEW_EXTRACTION_AUTO_OPEN__ && window.__FORGE_QUOTE_PREVIEW_EXTRACTION__) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => open(window.__FORGE_QUOTE_PREVIEW_EXTRACTION__));
    } else {
      open(window.__FORGE_QUOTE_PREVIEW_EXTRACTION__);
    }
  }
})();
