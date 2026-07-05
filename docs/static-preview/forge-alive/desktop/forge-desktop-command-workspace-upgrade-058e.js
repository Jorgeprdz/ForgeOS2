/* FORGEOS:DESKTOP_COMMAND_WORKSPACE_UPGRADE_058E */
(function () {
  "use strict";

  function isDesktop() {
    return window.matchMedia("(min-width: 901px)").matches;
  }

  function setPreview(root, button, shouldFillInput) {
    var title = root.querySelector("[data-command-preview-title-058e]");
    var copy = root.querySelector("[data-command-preview-copy-058e]");
    var input = root.querySelector(".dw-command-input-056y");
    if (!title || !copy || !button) return;
    var value = button.getAttribute("data-command-value") || "";
    title.textContent = button.getAttribute("data-preview-title") || value || "/llamar Lariza ahora";
    copy.textContent = button.getAttribute("data-preview-copy") || "Alfred prepara un preview seguro con contexto y aprobacion humana.";
    if (input && value && shouldFillInput) input.value = value;
  }

  function bootWorkspace(root) {
    if (!root || root.dataset.ready058e === "true") return;
    root.dataset.ready058e = "true";

    var buttons = Array.prototype.slice.call(root.querySelectorAll(".dw-command-suggestions-058e [data-command-value], .dw-decision-strip-058e [data-command-value]"));
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (item) {
          item.classList.toggle("is-selected", item === button);
        });
        setPreview(root, button, true);
      });
      button.addEventListener("focus", function () {
        setPreview(root, button, false);
      });
    });

    var selected = root.querySelector(".dw-command-suggestions-058e .is-selected") || buttons[0];
    if (selected) setPreview(root, selected, false);
  }

  function boot() {
    if (!isDesktop()) return;
    Array.prototype.forEach.call(document.querySelectorAll(".forge-desktop-workspace-056y"), bootWorkspace);
  }

  document.addEventListener("DOMContentLoaded", boot);
  window.addEventListener("load", boot);
  window.addEventListener("resize", boot, { passive: true });
})();
/* FORGEOS:DESKTOP_COMMAND_WORKSPACE_UPGRADE_058E:END */
