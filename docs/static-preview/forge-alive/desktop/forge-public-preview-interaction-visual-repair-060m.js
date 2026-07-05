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

  function restoreCommandInputs() {
    var candidates = Array.prototype.slice.call(
      document.querySelectorAll(".dw-command-input-056y, .command-pill-input")
    );

    candidates.forEach(function (node) {
      node.removeAttribute("data-forge-command-static-060m");
      node.removeAttribute("aria-readonly");
      node.removeAttribute("tabindex");
      node.setAttribute("inputmode", "text");
      node.setAttribute("autocomplete", "off");
      if ("readOnly" in node) {
        node.readOnly = false;
      }
      if (node.parentElement) {
        node.parentElement.removeAttribute("data-forge-command-static-wrap-060m");
      }
    });
  }

  function commandRows(root) {
    var buttons = Array.prototype.slice.call(
      root.querySelectorAll(".dw-command-suggestions-058e [data-command-value], .dw-decision-strip-058e [data-command-value]")
    );

    return buttons.map(function (button) {
      return {
        value: button.getAttribute("data-command-value") || "",
        title: button.getAttribute("data-preview-title") || button.getAttribute("data-command-value") || textOf(button),
        copy: button.getAttribute("data-preview-copy") || "Preview seguro. Requiere aprobacion humana antes de cualquier accion."
      };
    }).filter(function (row) {
      return row.value;
    });
  }

  function setPreview(root, row) {
    var title = root.querySelector("[data-command-preview-title-058e]");
    var copy = root.querySelector("[data-command-preview-copy-058e]");
    if (title && row && row.title) {
      title.textContent = row.title;
    }
    if (copy && row && row.copy) {
      copy.textContent = row.copy;
    }
  }

  function renderCommandResults(root, rows) {
    var results = root.querySelector(".dw-command-results-056y");
    if (!results) {
      return;
    }

    if (!rows.length) {
      results.hidden = true;
      results.innerHTML = "";
      root.classList.remove("is-command-active-060m");
      return;
    }

    results.innerHTML = rows.map(function (row) {
      return (
        '<button type="button" role="option" data-command-result-value="' + row.value.replace(/"/g, "&quot;") + '">' +
          '<span>' + row.title.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</span>' +
          '<strong>' + row.value.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</strong>' +
        '</button>'
      );
    }).join("");
    results.hidden = false;
    root.classList.add("is-command-active-060m");
  }

  function filterRows(rows, value) {
    var query = String(value || "").trim().toLowerCase();
    if (!query) {
      return rows.slice(0, 3);
    }
    return rows.filter(function (row) {
      return (row.value + " " + row.title + " " + row.copy).toLowerCase().indexOf(query.replace(/^\//, "")) !== -1 ||
        row.value.toLowerCase().indexOf(query) !== -1;
    }).slice(0, 5);
  }

  function setupDesktopCommandBar(root) {
    if (!root || root.dataset.ready060m === "true") {
      return;
    }
    root.dataset.ready060m = "true";

    var input = root.querySelector(".dw-command-input-056y");
    var results = root.querySelector(".dw-command-results-056y");
    var rows = commandRows(root);
    var submit = root.querySelector(".dw-command-submit-056y");
    var suggestionButtons = Array.prototype.slice.call(root.querySelectorAll(".dw-command-suggestions-058e [data-command-value], .dw-decision-strip-058e [data-command-value]"));

    if (!input || !results) {
      return;
    }

    results.hidden = true;

    function updateResults() {
      renderCommandResults(root, filterRows(rows, input.value));
    }

    function applyValue(value) {
      var row = rows.filter(function (item) {
        return item.value === value;
      })[0] || { value: value, title: value, copy: "Preview seguro. Requiere aprobacion humana antes de cualquier accion." };
      input.value = row.value;
      setPreview(root, row);
      renderCommandResults(root, [row]);
      input.focus();
    }

    input.addEventListener("focus", updateResults);
    input.addEventListener("input", updateResults);
    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        results.hidden = true;
        root.classList.remove("is-command-active-060m");
      }
    });
    input.addEventListener("blur", function () {
      window.setTimeout(function () {
        if (!root.matches(":focus-within")) {
          results.hidden = true;
          root.classList.remove("is-command-active-060m");
        }
      }, 140);
    });

    results.addEventListener("pointerdown", function (event) {
      event.preventDefault();
    });
    results.addEventListener("click", function (event) {
      var button = event.target.closest ? event.target.closest("[data-command-result-value]") : null;
      if (!button) {
        return;
      }
      applyValue(button.getAttribute("data-command-result-value") || "");
    });

    suggestionButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        applyValue(button.getAttribute("data-command-value") || "");
      });
    });

    if (submit) {
      submit.addEventListener("click", function () {
        var value = input.value.trim() || (rows[0] && rows[0].value) || "";
        if (value) {
          applyValue(value);
        }
      });
    }
  }

  function markQuoteCards() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(".dw-command-suggestions-058e button, .dw-table-056y td, .dw-table-056y th"));
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
    restoreCommandInputs();
    Array.prototype.forEach.call(document.querySelectorAll(".forge-desktop-workspace-056y"), setupDesktopCommandBar);
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
