/* FORGEOS:ALFRED_RESPONSIVE_UI_056I:START */
(function () {
  const MOBILE_QUERY = "(max-width: 767px)";
  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

  function queryAny(selectors, root = document) {
    for (const selector of selectors) {
      const found = root.querySelector(selector);
      if (found) return found;
    }
    return null;
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

  function focusCommandInput(pill) {
    const input = queryAny([
      ".command-pill-input",
      "input",
      "textarea",
      "[contenteditable='true']",
      "[role='textbox']"
    ], pill);
    if (input && typeof input.focus === "function") {
      window.setTimeout(() => input.focus({ preventScroll: true }), 180);
    }
  }

  function initMobileCommandBar() {
    const layer = queryAny([".command-orb-layer", "[data-command-orb-layer]"]);
    if (!layer) return;
    const pill = queryAny([".command-pill", "[data-command-pill]"], layer) || layer;
    const trigger = queryAny([".command-pill-slash", "[data-command-trigger]", "button"], layer) || pill;
    const close = ensureCloseButton(pill);

    layer.classList.add("alfred-command-ready-056i");

    const open = () => {
      if (!isMobile()) return;
      layer.classList.add("is-open");
      layer.setAttribute("data-command-state", "open");
      focusCommandInput(pill);
    };
    const closeBar = () => {
      layer.classList.remove("is-open");
      layer.setAttribute("data-command-state", "closed");
    };
    const toggle = (event) => {
      if (!isMobile()) return;
      if (event) event.preventDefault();
      if (layer.classList.contains("is-open")) {
        closeBar();
      } else {
        open();
      }
    };

    trigger.addEventListener("click", toggle);
    close.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeBar();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeBar();
    });
  }

  function getCarouselCards(carousel) {
    return Array.from(carousel.children).filter((child) => {
      return !child.classList.contains("smart-widget-mouse-controls") &&
        !child.classList.contains("smart-widget-dots-056i");
    });
  }

  function initSmartWidgetDots() {
    const stack = queryAny([".smart-widget-stack", "#smart-widget-stack"]);
    const carousel = queryAny([".smart-widget-carousel"], stack || document);
    if (!stack || !carousel) return;

    const cards = getCarouselCards(carousel);
    if (cards.length <= 1) return;

    let dots = stack.querySelector(".smart-widget-dots-056i");
    if (!dots) {
      dots = document.createElement("div");
      dots.className = "smart-widget-dots-056i";
      dots.setAttribute("aria-label", "Indicadores de señales");
      cards.forEach((card, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "smart-widget-dot-056i";
        button.setAttribute("aria-label", `Ver señal ${index + 1}`);
        button.addEventListener("click", () => {
          carousel.scrollTo({
            left: card.offsetLeft,
            behavior: "smooth"
          });
        });
        dots.appendChild(button);
      });
      stack.appendChild(dots);
    }

    const buttons = Array.from(dots.querySelectorAll(".smart-widget-dot-056i"));
    const update = () => {
      const center = carousel.scrollLeft + carousel.clientWidth / 2;
      let active = 0;
      let distance = Number.POSITIVE_INFINITY;
      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const nextDistance = Math.abs(center - cardCenter);
        if (nextDistance < distance) {
          distance = nextDistance;
          active = index;
        }
      });
      buttons.forEach((button, index) => {
        button.classList.toggle("is-active", index === active);
        button.setAttribute("aria-current", index === active ? "true" : "false");
      });
    };

    carousel.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function initResponsiveUi056I() {
    document.documentElement.classList.add("alfred-responsive-ui-056i");
    initMobileCommandBar();
    initSmartWidgetDots();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initResponsiveUi056I);
  } else {
    initResponsiveUi056I();
  }
})();
/* FORGEOS:ALFRED_RESPONSIVE_UI_056I:END */
