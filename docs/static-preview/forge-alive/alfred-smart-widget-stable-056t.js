/* FORGEOS:ALFRED_STABLE_SMART_WIDGET_MOUNT_056T */
(function () {
  "use strict";

  var cards = [
    ["Seguimiento", "86", "Por qué ahora", "Juan necesita revisión antes de que se enfríe.", "Hay señales de seguimiento pendiente. El humano decide tono y momento."],
    ["Decisión", "78", "Señales para decidir", "Forge ordena contexto antes de sugerir acción.", "Señal no es decisión. Contexto no es verdad."],
    ["Juicio", "92", "Falta contexto", "Primero mejora el juicio; luego decide.", "Unknown no es cero."],
    ["Revisión", "80", "Abrir plan de acción", "Usa Alfred para revisar /Follow Juan.", "Preview only. Requiere aprobación."]
  ];

  function isMobile() {
    return window.matchMedia("(max-width: 767px), (max-width: 900px) and (orientation: landscape)").matches;
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function text(node) {
    return String(node && node.textContent || "").replace(/\s+/g, " ").trim();
  }

  function has(node, needle) {
    return normalize(text(node)).indexOf(normalize(needle)) !== -1;
  }

  function el(tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof content === "string") node.textContent = content;
    return node;
  }

  function bowtieSvg() {
    return [
      '<svg viewBox="0 0 96 58" role="img" aria-label="Alfred">',
      '<path d="M9 17C21 8 35 11 45 25C35 41 21 48 9 40C15 32 15 25 9 17Z" fill="#061326"/>',
      '<path d="M87 17C75 8 61 11 51 25C61 41 75 48 87 40C81 32 81 25 87 17Z" fill="#061326"/>',
      '<path d="M12 18C23 11 35 14 43 26" fill="none" stroke="#F2CF75" stroke-width="3" stroke-linecap="round"/>',
      '<path d="M84 18C73 11 61 14 53 26" fill="none" stroke="#76DBFF" stroke-width="3" stroke-linecap="round"/>',
      '<rect x="42" y="22" width="12" height="14" rx="5" fill="#F5F8FF"/>',
      '</svg>'
    ].join("");
  }

  function findPlanCard() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("article, section, div"));
    var matches = nodes.filter(function (node) {
      if (!has(node, "Plan de hoy")) return false;
      if (!has(node, "Iniciar revision") && !has(node, "Prioridad alta")) return false;
      var rect = node.getBoundingClientRect();
      return rect.width >= 260 && rect.height >= 130 && rect.height <= 430;
    });
    matches.sort(function (a, b) {
      var ar = a.getBoundingClientRect();
      var br = b.getBoundingClientRect();
      var aScore = Math.abs(ar.width - (window.innerWidth - 32)) + Math.abs(ar.height - 210);
      var bScore = Math.abs(br.width - (window.innerWidth - 32)) + Math.abs(br.height - 210);
      return aScore - bScore;
    });
    return matches[0] || null;
  }

  function setIndex(root, index) {
    index = Math.max(0, Math.min(cards.length - 1, index));
    root.dataset.index056t = String(index);
    root.style.setProperty("--forge-stable-index-056t", String(index));
    var dots = root.querySelector(".forge-smart-widget-stable-dots-056t");
    if (dots) dots.style.setProperty("--forge-dot-index-056t", String(index));
    Array.prototype.forEach.call(root.querySelectorAll(".forge-smart-widget-stable-dot-056t"), function (dot, dotIndex) {
      dot.classList.toggle("is-active-056t", dotIndex === index);
      dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
    });
  }

  function buildWidget() {
    var root = el("section", "forge-smart-widget-stable-056t");
    root.setAttribute("aria-label", "Alfred Smart Widgets");
    root.style.setProperty("--forge-stable-index-056t", "0");

    var head = el("div", "forge-smart-widget-stable-head-056t");
    var mark = el("div", "forge-smart-widget-stable-mark-056t");
    mark.innerHTML = bowtieSvg();
    head.appendChild(mark);
    var copy = el("div");
    copy.appendChild(el("div", "forge-smart-widget-stable-eyebrow-056t", "Siguiente mejor acción"));
    copy.appendChild(el("h2", "forge-smart-widget-stable-title-056t", "Seguimiento prioritario"));
    copy.appendChild(el("div", "forge-smart-widget-stable-subtitle-056t", "Juan necesita revisión antes de que se enfríe."));
    head.appendChild(copy);
    root.appendChild(head);

    var viewport = el("div", "forge-smart-widget-stable-viewport-056t");
    var track = el("div", "forge-smart-widget-stable-track-056t");
    cards.forEach(function (cardData) {
      var card = el("article", "forge-smart-widget-stable-card-056t");
      var top = el("div", "forge-smart-widget-stable-top-056t");
      top.appendChild(el("div", "forge-smart-widget-stable-kicker-056t", cardData[0]));
      top.appendChild(el("div", "forge-smart-widget-stable-score-056t", cardData[1]));
      card.appendChild(top);
      card.appendChild(el("h3", "", cardData[2]));
      card.appendChild(el("p", "", cardData[3]));
      card.appendChild(el("p", "", cardData[4]));
      track.appendChild(card);
    });
    viewport.appendChild(track);
    root.appendChild(viewport);

    var dots = el("div", "forge-smart-widget-stable-dots-056t");
    dots.appendChild(el("span", "forge-smart-widget-stable-glider-056t"));
    cards.forEach(function (_card, index) {
      var dot = el("button", "forge-smart-widget-stable-dot-056t");
      dot.type = "button";
      dot.setAttribute("aria-label", "Ver Smart Widget " + (index + 1));
      dot.addEventListener("click", function () {
        setIndex(root, index);
      });
      dots.appendChild(dot);
    });
    root.appendChild(dots);

    var startX = 0;
    viewport.addEventListener("touchstart", function (event) {
      if (event.touches && event.touches.length) startX = event.touches[0].clientX;
    }, { passive: true });
    viewport.addEventListener("touchend", function (event) {
      if (!event.changedTouches || !event.changedTouches.length) return;
      var delta = event.changedTouches[0].clientX - startX;
      if (Math.abs(delta) < 34) return;
      var current = Number(root.dataset.index056t || "0");
      setIndex(root, current + (delta < 0 ? 1 : -1));
    }, { passive: true });

    setIndex(root, 0);
    return root;
  }

  function mount() {
    if (!isMobile()) return;
    document.documentElement.classList.add("forge-smart-widget-stable-mounted-056t");
    var plan = findPlanCard();
    if (!plan || !plan.parentElement) return;
    var root = document.querySelector(".forge-smart-widget-stable-056t") || buildWidget();
    if (root.parentElement !== plan.parentElement || root.previousElementSibling !== plan) {
      plan.insertAdjacentElement("afterend", root);
    }
    root.style.display = "block";
    root.removeAttribute("hidden");
    root.removeAttribute("aria-hidden");
    setIndex(root, Number(root.dataset.index056t || "0"));
  }

  function schedule() {
    [40, 120, 260, 520, 900, 1600, 2600, 4200, 6500].forEach(function (delay) {
      window.setTimeout(mount, delay);
    });
  }

  document.addEventListener("DOMContentLoaded", schedule);
  window.addEventListener("load", schedule);
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });
})();
