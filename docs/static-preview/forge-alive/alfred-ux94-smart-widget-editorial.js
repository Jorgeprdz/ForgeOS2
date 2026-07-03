/* FORGEOS:ALFRED_SMART_WIDGET_EDITORIAL_HIERARCHY_056S */
(function () {
  "use strict";

  function isMobile() {
    return window.matchMedia("(max-width: 767px), (max-width: 900px) and (orientation: landscape)").matches;
  }

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function setDefaultIndex(root) {
    var dots = root.querySelector(".forge-ux99-dots-056q");
    if (!dots) return;
    root.dataset.index056q2 = "0";
    root.style.setProperty("--ux99-index-056q", "0");
    dots.style.setProperty("--ux99-dot-index-056q", "0");
    Array.prototype.forEach.call(dots.querySelectorAll(".forge-ux99-dot-056q"), function (dot, index) {
      dot.classList.toggle("is-active-056q", index === 0);
      dot.setAttribute("aria-current", index === 0 ? "true" : "false");
    });
  }

  function tuneFirstCard(root) {
    var title = root.querySelector(".forge-ux99-title-056q");
    var subtitle = root.querySelector(".forge-ux99-subtitle-056q");
    setText(title, "Seguimiento prioritario");
    setText(subtitle, "Juan necesita revisión antes de que se enfríe.");

    var first = root.querySelector(".forge-ux99-card-056q");
    if (!first) return;
    setText(first.querySelector(".forge-ux99-kicker-056q"), "Seguimiento");
    setText(first.querySelector(".forge-ux99-score-056q"), "86");
    var heading = first.querySelector("h3");
    var paragraphs = first.querySelectorAll("p");
    setText(heading, "Por qué ahora");
    setText(paragraphs[0], "Juan necesita revisión antes de que se enfríe.");
    setText(paragraphs[1], "Hay señales de seguimiento pendiente. El humano decide tono y momento.");
  }

  function mount() {
    if (!isMobile()) return;
    var root = document.querySelector(".forge-ux99-focus-056q");
    if (!root) return;
    root.classList.add("forge-ux94-editorial-056s");
    tuneFirstCard(root);
    setDefaultIndex(root);
  }

  function schedule() {
    [60, 180, 420, 900, 1600, 2600, 4200, 6500].forEach(function (delay) {
      window.setTimeout(mount, delay);
    });
  }

  document.addEventListener("DOMContentLoaded", schedule);
  window.addEventListener("load", schedule);
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });
})();
