/* FORGEOS:ALFRED_STATIC_SMART_WIDGET_IN_INDEX_056U */
(function () {
  "use strict";

  function setIndex(root, index) {
    var max = 3;
    index = Math.max(0, Math.min(max, index));
    root.dataset.index056u = String(index);
    root.style.setProperty("--forge-static-index-056u", String(index));
    var dots = root.querySelector(".forge-smart-widget-static-dots-056u");
    if (dots) dots.style.setProperty("--forge-dot-index-056u", String(index));
    Array.prototype.forEach.call(root.querySelectorAll(".forge-smart-widget-static-dot-056u"), function (dot, dotIndex) {
      dot.classList.toggle("is-active-056u", dotIndex === index);
      dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
    });
  }

  function boot(root) {
    if (!root || root.dataset.ready056u === "true") return;
    root.dataset.ready056u = "true";
    var startX = 0;
    var viewport = root.querySelector(".forge-smart-widget-static-viewport-056u");
    Array.prototype.forEach.call(root.querySelectorAll(".forge-smart-widget-static-dot-056u"), function (dot, index) {
      dot.addEventListener("click", function () {
        setIndex(root, index);
      });
    });
    if (viewport) {
      viewport.addEventListener("touchstart", function (event) {
        if (event.touches && event.touches.length) startX = event.touches[0].clientX;
      }, { passive: true });
      viewport.addEventListener("touchend", function (event) {
        if (!event.changedTouches || !event.changedTouches.length) return;
        var delta = event.changedTouches[0].clientX - startX;
        if (Math.abs(delta) < 34) return;
        var current = Number(root.dataset.index056u || "0");
        setIndex(root, current + (delta < 0 ? 1 : -1));
      }, { passive: true });
    }
    setIndex(root, 0);
  }

  function mount() {
    Array.prototype.forEach.call(document.querySelectorAll(".forge-smart-widget-static-056u"), boot);
  }

  document.addEventListener("DOMContentLoaded", mount);
  window.addEventListener("load", mount);
  window.addEventListener("resize", mount, { passive: true });
  window.addEventListener("orientationchange", mount, { passive: true });
})();
