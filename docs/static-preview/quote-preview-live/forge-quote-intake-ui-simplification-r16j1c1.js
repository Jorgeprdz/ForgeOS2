(() => {
  "use strict";

  const VERSION = "R16J1C1_INTAKE_UI_03A1";
  const BETA_ATTR = "data-forge-beta-pill-r16j1c1";
  const NOISE_ATTR = "data-forge-intake-noise-card-r16j1c1";
  const INLINE_ATTR = "data-forge-review-inline-r16j1c1";

  const WRAPPER_SELECTOR =
    '[data-forge-quote-acceptance-r16j0a="true"]';
  const BUTTON_SELECTOR =
    'button[data-forge-confirm-quote-r16j0a="true"]';
  const STATUS_SELECTOR =
    '[data-forge-pdf-status="true"]';
  const INPUT_SELECTOR =
    '[data-forge-local-packet-input="true"]';

  const LABELS = Object.freeze({
    READY: "Revisar PDF",
    CONFIRMING: "Revisando PDF…",
    ACCEPTED: "PDF revisado",
    ERROR: "Reintentar revisión",
  });

  const VISIBLE_STATES = new Set(Object.keys(LABELS));
  const refreshedAcceptanceWrappers = new WeakSet();

  let framePending = false;
  let observer = null;

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function textIncludes(element, token) {
    return normalizeText(element?.textContent)
      .toLocaleLowerCase("es")
      .includes(token.toLocaleLowerCase("es"));
  }

  function isQuoteRoutePresent() {
    const params = new URLSearchParams(location.search);

    if (params.get("module") === "cotizaciones") {
      return true;
    }

    return Array.from(
      document.querySelectorAll("h1, h2, h3"),
    ).some(
      (heading) =>
        textIncludes(heading, "Nueva cotización") ||
        textIncludes(heading, "Nuevo borrador de cotización") ||
        textIncludes(heading, "Carga tu cotización"),
    );
  }

  function findHeadingByText(token) {
    return (
      Array.from(document.querySelectorAll("h1, h2, h3"))
        .find((heading) => textIncludes(heading, token)) ||
      null
    );
  }

  function findNoiseCard() {
    const heading =
      findHeadingByText("Nuevo borrador de cotización");

    if (!heading) return null;

    let candidate = heading.parentElement;
    let best = null;

    for (let depth = 0; candidate && depth < 7; depth += 1) {
      const text = normalizeText(candidate.textContent);
      const hasBadges =
        text.includes("Preview") &&
        text.includes("Requiere revisión humana") &&
        text.includes("Sin efectos reales");
      const containsUpload =
        text.includes("Carga tu cotización");

      if (hasBadges && !containsUpload) {
        best = candidate;
      }

      if (containsUpload) break;
      candidate = candidate.parentElement;
    }

    return best || heading.parentElement;
  }

  function installBetaPill() {
    const existing = document.querySelector(
      `[${BETA_ATTR}="true"]`,
    );
    if (existing) return existing;

    const noiseCard = findNoiseCard();
    if (!noiseCard?.parentElement) return null;

    const pill = document.createElement("div");
    pill.setAttribute(BETA_ATTR, "true");
    pill.setAttribute("role", "status");
    pill.setAttribute(
      "aria-label",
      "Función en versión beta",
    );
    pill.textContent = "Beta";

    if (!noiseCard.hasAttribute(NOISE_ATTR)) {
      noiseCard.setAttribute(NOISE_ATTR, "true");
    }
    if (!noiseCard.hidden) noiseCard.hidden = true;
    if (noiseCard.getAttribute("aria-hidden") !== "true") {
      noiseCard.setAttribute("aria-hidden", "true");
    }

    noiseCard.parentElement.insertBefore(pill, noiseCard);
    return pill;
  }

  function findUploadCard() {
    const input = document.querySelector(INPUT_SELECTOR);
    if (!input) return null;

    let candidate = input.parentElement;
    let best = null;

    for (let depth = 0; candidate && depth < 8; depth += 1) {
      if (textIncludes(candidate, "Carga tu cotización")) {
        best = candidate;
      }

      if (
        best &&
        candidate.querySelector?.(STATUS_SELECTOR) &&
        candidate.querySelector?.(INPUT_SELECTOR)
      ) {
        best = candidate;
        break;
      }

      candidate = candidate.parentElement;
    }

    return best || input.parentElement;
  }

  function getReviewState(button, wrapper) {
    return String(
      button?.dataset?.forgeQuoteAcceptanceStateR16j0a ||
      wrapper?.dataset?.forgeQuoteAcceptanceStateR16j0a ||
      "",
    ).toUpperCase();
  }

  function applyLabel(button, state) {
    const label = LABELS[state];
    if (!button || !label) return;

    if (normalizeText(button.textContent) !== label) {
      button.textContent = label;
    }

    const ariaLabel =
      state === "READY"
        ? "Revisar el PDF extraído"
        : label;

    if (button.getAttribute("aria-label") !== ariaLabel) {
      button.setAttribute("aria-label", ariaLabel);
    }

    if (
      button.dataset.forgeReviewUiStateR16j1c1 !== state
    ) {
      button.dataset.forgeReviewUiStateR16j1c1 = state;
    }
  }

  function placeReviewAction() {
    const wrapper = document.querySelector(WRAPPER_SELECTOR);
    const button = document.querySelector(BUTTON_SELECTOR);
    const uploadCard = findUploadCard();
    const pdfStatus =
      uploadCard?.querySelector?.(STATUS_SELECTOR);

    if (!wrapper || !button || !uploadCard) return false;

    if (!wrapper.hasAttribute(INLINE_ATTR)) {
      wrapper.setAttribute(INLINE_ATTR, "true");
    }

    const target =
      pdfStatus?.parentElement ||
      uploadCard.querySelector?.(
        '[data-forge-pdf-upload-zone="true"]',
      ) ||
      uploadCard;

    if (wrapper.parentElement !== target) {
      target.appendChild(wrapper);
    }

    return true;
  }

  function refreshAcceptanceRuntimeOnce() {
    const wrapper = document.querySelector(WRAPPER_SELECTOR);

    if (
      !wrapper ||
      refreshedAcceptanceWrappers.has(wrapper)
    ) {
      return;
    }

    refreshedAcceptanceWrappers.add(wrapper);

    try {
      globalThis.ForgeQuoteAcceptanceEntrypointR16J0A
        ?.refresh?.();
    } catch {}
  }

  function syncReviewAction() {
    const wrapper = document.querySelector(WRAPPER_SELECTOR);
    const button = document.querySelector(BUTTON_SELECTOR);

    if (!wrapper || !button) return false;

    const state = getReviewState(button, wrapper);
    const visible = VISIBLE_STATES.has(state);
    const hidden = !visible;
    const ariaHidden = String(hidden);

    if (wrapper.hidden !== hidden) {
      wrapper.hidden = !visible;
    }
    if (wrapper.getAttribute("aria-hidden") !== ariaHidden) {
      wrapper.setAttribute("aria-hidden", ariaHidden);
    }

    if (visible) applyLabel(button, state);
    return visible;
  }

  function syncQuoteUi() {
    if (!isQuoteRoutePresent()) return;

    installBetaPill();
    placeReviewAction();
    refreshAcceptanceRuntimeOnce();
    syncReviewAction();
  }

  function scheduleSync() {
    if (framePending) return;

    framePending = true;
    requestAnimationFrame(() => {
      framePending = false;
      syncQuoteUi();
    });
  }

  function syncBurst() {
    scheduleSync();
    window.setTimeout(scheduleSync, 80);
    window.setTimeout(scheduleSync, 320);
  }

  function getPublicState() {
    const wrapper = document.querySelector(WRAPPER_SELECTOR);
    const button = document.querySelector(BUTTON_SELECTOR);

    return Object.freeze({
      betaVisible: Boolean(
        document.querySelector(`[${BETA_ATTR}="true"]`),
      ),
      reviewState: getReviewState(button, wrapper),
      reviewVisible: Boolean(wrapper && !wrapper.hidden),
      reviewLabel: normalizeText(button?.textContent),
      navigationSyncPending: framePending,
      automaticCalculation: false,
      automaticAcceptance: false,
    });
  }

  function boot() {
    if (
      globalThis.ForgeQuoteIntakeUiR16J1C1?.version ===
      VERSION
    ) {
      return;
    }

    globalThis.addEventListener("popstate", syncBurst);
    globalThis.addEventListener("hashchange", syncBurst);
    globalThis.addEventListener(
      "forge:accepted-quote-packet-ready",
      syncBurst,
    );
    globalThis.addEventListener(
      "forge:quote-acceptance-state",
      syncBurst,
    );
    globalThis.addEventListener(
      "forge:accepted-quote-confirmed",
      syncBurst,
    );
    globalThis.addEventListener(
      "forge:accepted-quote-confirmation-error",
      syncBurst,
    );

    observer = new MutationObserver(scheduleSync);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    globalThis.ForgeQuoteIntakeUiR16J1C1 = Object.freeze({
      version: VERSION,
      refresh: syncBurst,
      getState: getPublicState,
      disconnect() {
        observer?.disconnect();
        observer = null;
      },
    });

    syncBurst();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      { once: true },
    );
  } else {
    boot();
  }
})();
