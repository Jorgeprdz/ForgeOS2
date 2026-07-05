/* FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_060M:START */
(function () {
  "use strict";

  var DESKTOP_QUERY = "(min-width: 901px)";
  var PREVIEW_CARD_ID = "forge-local-read-model-preview-060l";

  function isDesktop() {
    return !window.matchMedia || window.matchMedia(DESKTOP_QUERY).matches;
  }

  function textOf(node) {
    if (!node) {
      return "";
    }
    return String(node.value || node.textContent || node.getAttribute("aria-label") || "").trim();
  }

  function visibleRect(node) {
    if (!node || typeof node.getBoundingClientRect !== "function") {
      return null;
    }
    var rect = node.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    return rect;
  }

  function markStaticCommandInputs() {
    var candidates = Array.prototype.slice.call(
      document.querySelectorAll("input, textarea, [contenteditable='true'], [role='textbox']")
    );

    candidates.forEach(function (node) {
      var content = textOf(node).toLowerCase();
      var parentText = textOf(node.parentElement).toLowerCase();
      var looksCommand = content.indexOf("/cotizar") !== -1 ||
        parentText.indexOf("preparar preview") !== -1 ||
        parentText.indexOf("preview seguro") !== -1;

      if (!looksCommand) {
        return;
      }

      node.setAttribute("data-forge-command-static-060m", "true");
      node.setAttribute("inputmode", "none");
      node.setAttribute("autocomplete", "off");
      node.setAttribute("aria-readonly", "true");
      node.setAttribute("tabindex", "-1");
      if ("readOnly" in node) {
        node.readOnly = true;
      }
      if (node.getAttribute("contenteditable") === "true") {
        node.setAttribute("contenteditable", "false");
      }

      if (node.parentElement) {
        node.parentElement.setAttribute("data-forge-command-static-wrap-060m", "true");
      }

      node.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        node.blur();
      });
      node.addEventListener("focus", function () {
        window.setTimeout(function () {
          node.blur();
        }, 0);
      });
    });
  }

  function markQuoteCards() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("div, article, section, li, button"));
    nodes.forEach(function (node) {
      var rect = visibleRect(node);
      if (!rect || rect.width < 120 || rect.height < 36 || rect.height > 180) {
        return;
      }

      var content = textOf(node).toLowerCase();
      if (content.indexOf("cotizar") !== -1 && content.indexOf("/cotizar") !== -1) {
        node.classList.add("forge-visual-repair-060m-quote-card");
      }
    });
  }

  function findCommandSurface() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll("button, [role='button']"));
    var prepare = buttons.filter(function (node) {
      return textOf(node).toLowerCase().indexOf("preparar preview") !== -1;
    })[0];

    var node = prepare;
    while (node && node !== document.body) {
      var rect = visibleRect(node);
      if (rect && rect.width >= 620 && rect.height >= 120 && rect.height <= 360) {
        return node;
      }
      node = node.parentElement;
    }

    return null;
  }

  function findWideContentMount() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("main, section, div"));
    var options = nodes.map(function (node) {
      return { node: node, rect: visibleRect(node) };
    }).filter(function (entry) {
      return entry.rect &&
        entry.rect.width >= 640 &&
        entry.rect.height >= 240 &&
        entry.rect.left >= 220 &&
        entry.node !== document.body &&
        entry.node !== document.documentElement;
    }).sort(function (a, b) {
      return (b.rect.width * b.rect.height) - (a.rect.width * a.rect.height);
    });

    return options.length ? options[0].node : null;
  }

  function repairPreviewCardMount() {
    var card = document.getElementById(PREVIEW_CARD_ID);
    if (!card) {
      return;
    }

    var commandSurface = findCommandSurface();
    if (commandSurface && commandSurface.parentElement) {
      commandSurface.insertAdjacentElement("afterend", card);
      return;
    }

    var mount = findWideContentMount();
    if (mount) {
      mount.appendChild(card);
    }
  }

  function runRepair() {
    if (!isDesktop()) {
      return;
    }
    markStaticCommandInputs();
    markQuoteCards();
    repairPreviewCardMount();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runRepair, { once: true });
  } else {
    runRepair();
  }

  window.addEventListener("load", runRepair);
  window.addEventListener("forge:local-read-model-source:060i", function () {
    window.setTimeout(runRepair, 0);
  });
  window.__forgeRunPublicPreviewInteractionVisualRepair060M = runRepair;
})();
/* FORGEOS:PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_060M:END */
