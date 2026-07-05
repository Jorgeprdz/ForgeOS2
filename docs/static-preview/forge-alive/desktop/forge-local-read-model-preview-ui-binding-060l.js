/* FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_060L:START */
(function () {
  "use strict";

  var EVENT_NAME = "forge:local-read-model-source:060i";
  var DESKTOP_QUERY = "(min-width: 901px)";
  var CARD_ID = "forge-local-read-model-preview-060l";

  function isDesktop() {
    return !window.matchMedia || window.matchMedia(DESKTOP_QUERY).matches;
  }

  function text(value, fallback) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    return fallback;
  }

  function cleanRows(rows) {
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .filter(function (row) {
        return row && (row.label || row.value);
      })
      .slice(0, 3)
      .map(function (row) {
        return {
          label: text(row.label, "Dato"),
          value: text(row.value, "Sin dato")
        };
      });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function findMount() {
    return (
      document.querySelector("[data-forge-command-preview]") ||
      document.querySelector(".forge-desktop-command-workspace-058e") ||
      document.querySelector(".forge-command-workspace-058e") ||
      document.querySelector(".forge-desktop-workspace-056y") ||
      document.querySelector("main") ||
      document.body
    );
  }

  function ensureCard() {
    var existing = document.getElementById(CARD_ID);
    if (existing) {
      return existing;
    }

    var card = document.createElement("section");
    card.id = CARD_ID;
    card.className = "forge-local-read-model-preview-060l";
    card.setAttribute("aria-label", "Preview local de reporte");
    card.hidden = true;

    var mount = findMount();
    if (mount.firstElementChild && mount !== document.body) {
      mount.appendChild(card);
    } else {
      mount.appendChild(card);
    }
    return card;
  }

  function render(detail) {
    if (!isDesktop() || !detail || detail.readModelStatus !== "LOCAL_READ_MODEL_READY") {
      return null;
    }

    var preview = detail.reportPreview || {};
    var rows = cleanRows(preview.rows);
    if (!rows.length) {
      rows = [
        { label: "Estado", value: "Preview sin ejecucion" },
        { label: "Motor", value: "Fuente local auditada" },
        { label: "Aprobacion", value: "Humana requerida" }
      ];
    }

    var rowHtml = rows.map(function (row) {
      return (
        '<div class="forge-local-read-model-preview-060l__row">' +
          '<p class="forge-local-read-model-preview-060l__label">' + escapeHtml(row.label) + '</p>' +
          '<p class="forge-local-read-model-preview-060l__value">' + escapeHtml(row.value) + '</p>' +
        '</div>'
      );
    }).join("");

    var sourcePath = text(detail.sourcePath, "docs/evidence/forge-selected-engine-dry-run-audit-060e.json");
    var card = ensureCard();
    card.innerHTML =
      '<div class="forge-local-read-model-preview-060l__header">' +
        '<div>' +
          '<p class="forge-local-read-model-preview-060l__eyebrow">Preview local</p>' +
          '<h2 class="forge-local-read-model-preview-060l__title">' + escapeHtml(text(preview.title, "Preview de reporte")) + '</h2>' +
          '<p class="forge-local-read-model-preview-060l__summary">' + escapeHtml(text(preview.summary, "Lectura auditada preparada para revision humana.")) + '</p>' +
        '</div>' +
        '<span class="forge-local-read-model-preview-060l__status">Requiere revision humana</span>' +
      '</div>' +
      '<div class="forge-local-read-model-preview-060l__body">' +
        '<div class="forge-local-read-model-preview-060l__rows">' + rowHtml + '</div>' +
        '<div class="forge-local-read-model-preview-060l__guards">' +
          '<span class="forge-local-read-model-preview-060l__guard">Sin envio</span>' +
          '<span class="forge-local-read-model-preview-060l__guard">Sin CRM</span>' +
          '<span class="forge-local-read-model-preview-060l__guard">Sin calendario</span>' +
        '</div>' +
      '</div>' +
      '<div class="forge-local-read-model-preview-060l__evidence">' +
        'Lectura auditada desde ' + escapeHtml(sourcePath) + '. No ejecuta motor real ni escribe datos.' +
      '</div>';
    card.hidden = false;
    return card;
  }

  function onLocalReadModel(event) {
    render(event && event.detail);
  }

  function boot() {
    window.addEventListener(EVENT_NAME, onLocalReadModel);
    window.__forgeRenderLocalReadModelPreview060L = render;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
/* FORGEOS:LOCAL_READ_MODEL_PREVIEW_UI_BINDING_060L:END */
