/* FORGEOS:ALFRED_RESPONSIVE_UI_056J:START */
(function () {
  const MOBILE_QUERY = "(max-width: 767px), (max-width: 900px) and (orientation: landscape)";

  function isMobileSurface() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function queryAny(selectors, root = document) {
    for (const selector of selectors) {
      const found = root.querySelector(selector);
      if (found) return found;
    }
    return null;
  }

  function ensureCommandInput(pill) {
    let input = queryAny([".command-pill-input", "input", "[role='textbox']", "[contenteditable='true']"], pill);
    if (!input) {
      input = document.createElement("div");
      input.className = "command-pill-input";
      input.setAttribute("role", "textbox");
      input.setAttribute("tabindex", "0");
      input.textContent = "Buscar o pedir a Alfred...";
      pill.appendChild(input);
    }
    return input;
  }

  function ensureCloseButton(pill) {
    let close = queryAny([".command-pill-close", "[data-command-close]"], pill);
    if (!close) {
      close = document.createElement("button");
      close.type = "button";
      close.className = "command-pill-close";
      close.setAttribute("aria-label", "Cerrar barra de Alfred");
      close.textContent = "×";
      pill.appendChild(close);
    }
    return close;
  }

  function initCommandBar() {
    const layer = queryAny([".command-orb-layer", "[data-command-orb-layer]"]);
    if (!layer) return;

    const pill = queryAny([".command-pill", "[data-command-pill]"], layer) || layer;
    const trigger = queryAny([".command-pill-slash", "[data-command-trigger]", "button"], layer) || pill;
    const input = ensureCommandInput(pill);
    const close = ensureCloseButton(pill);

    layer.classList.add("alfred-command-ready-056j");
    layer.setAttribute("data-command-state", "closed");

    function open() {
      if (!isMobileSurface()) return;
      layer.classList.add("is-open");
      layer.setAttribute("data-command-state", "open");
      window.setTimeout(() => {
        if (typeof input.focus === "function") input.focus({ preventScroll: true });
      }, 260);
    }

    function closeBar() {
      layer.classList.remove("is-open");
      layer.setAttribute("data-command-state", "closed");
      if (typeof input.blur === "function") input.blur();
    }

    function toggle(event) {
      if (!isMobileSurface()) return;
      if (event) event.preventDefault();
      if (layer.classList.contains("is-open")) {
        closeBar();
      } else {
        open();
      }
    }

    trigger.addEventListener("click", toggle);
    close.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeBar();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeBar();
    });

    window.addEventListener("resize", () => {
      if (!isMobileSurface()) closeBar();
    });
  }

  function getCards(carousel) {
    return Array.from(carousel.children).filter((child) => {
      return !child.classList.contains("smart-widget-mouse-controls") &&
        !child.classList.contains("smart-widget-dots-056i") &&
        !child.classList.contains("smart-widget-dots-056j");
    });
  }

  function ensureSmartWidgetDots() {
    const stack = queryAny([".smart-widget-stack", "#smart-widget-stack"]);
    const carousel = queryAny([".smart-widget-carousel"], stack || document);
    if (!stack || !carousel) return;

    stack.hidden = false;
    carousel.hidden = false;

    const cards = getCards(carousel);
    cards.forEach((card) => {
      card.hidden = false;
      card.removeAttribute("aria-hidden");
    });
    if (cards.length <= 1) return;

    let dots = stack.querySelector(".smart-widget-dots-056j");
    if (!dots) {
      dots = document.createElement("div");
      dots.className = "smart-widget-dots-056j";
      dots.setAttribute("aria-label", "Indicadores de contexto vivo");
      cards.forEach((card, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "smart-widget-dot-056j";
        button.setAttribute("aria-label", `Ver señal ${index + 1}`);
        button.addEventListener("click", () => {
          carousel.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
        });
        dots.appendChild(button);
      });
      stack.appendChild(dots);
    }

    const buttons = Array.from(dots.querySelectorAll(".smart-widget-dot-056j"));
    function update() {
      const center = carousel.scrollLeft + carousel.clientWidth / 2;
      let active = 0;
      let best = Number.POSITIVE_INFINITY;
      cards.forEach((card, index) => {
        const distance = Math.abs(center - (card.offsetLeft + card.offsetWidth / 2));
        if (distance < best) {
          best = distance;
          active = index;
        }
      });
      buttons.forEach((button, index) => {
        button.classList.toggle("is-active", index === active);
        button.setAttribute("aria-current", index === active ? "true" : "false");
      });
    }

    carousel.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function addBottomNavIcons() {
    const nav = queryAny([".bottom-nav"]);
    if (!nav) return;
    const icons = ["⌂", "◇", "◎", "⌘", "•••"];
    Array.from(nav.children).forEach((item, index) => {
      if (!item.getAttribute("data-icon")) {
        item.setAttribute("data-icon", icons[index] || "•");
      }
    });
  }

  function init() {
    document.documentElement.classList.add("alfred-responsive-ui-056j");
    initCommandBar();
    ensureSmartWidgetDots();
    addBottomNavIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
/* FORGEOS:ALFRED_RESPONSIVE_UI_056J:END */
