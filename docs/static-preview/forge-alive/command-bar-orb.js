const layer = document.querySelector("[data-command-orb-layer]");

const localCommandResults = {
  juan: [
    ["Juan Orozco", "Poliza ABC · revisión"],
    ["Juan Martinez", "Prospecto · revisar"],
    ["Juan Perez", "Ultimo contacto hace 76 dias · seguimiento"],
  ],
  follow: [
    ["Seguimiento prioritario", "Solo revisión · sin envío"],
    ["Maria", "Necesita razón clara · 8 dias"],
    ["Octavio", "Falta confirmar cita · 5 dias"],
  ],
  agenda: [
    ["Agenda de la mañana", "Solo revisión"],
    ["Revision 16:00", "Punto de revisión"],
  ],
};

function normalizeCommand(value) {
  return value.trim().replace(/^\//, "").toLowerCase();
}

function openLayer() {
  if (!layer) return;
  layer.classList.add("is-expanded");
  const input = layer.querySelector(".command-pill-input");
  if (input) {
    window.requestAnimationFrame(() => input.focus());
  }
}

function closeLayer() {
  if (!layer) return;
  const input = layer.querySelector(".command-pill-input");
  const results = layer.querySelector(".command-orb-results");
  if (input) input.value = "";
  if (results) results.hidden = true;
  layer.classList.remove("is-expanded", "is-typing");
}

function renderResults(value) {
  if (!layer) return;
  const results = layer.querySelector(".command-orb-results");
  if (!results) return;

  const key = normalizeCommand(value);
  const rows = localCommandResults[key] || (key ? localCommandResults.juan : []);

  results.hidden = rows.length === 0;
  results.innerHTML = rows
    .map(([title, meta]) => `<article><strong>${title}</strong><span>${meta}</span></article>`)
    .join("");

  layer.classList.toggle("is-typing", key.length > 0);
}

if (layer) {
  const orb = layer.querySelector(".command-orb");
  const pill = layer.querySelector(".command-pill");
  const close = layer.querySelector(".command-pill-close");
  const input = layer.querySelector(".command-pill-input");

  if (orb) {
    orb.addEventListener("click", openLayer);
  }

  if (pill) {
    pill.addEventListener("click", (event) => {
      if (close && close.contains(event.target)) return;
      openLayer();
    });
  }

  if (close) {
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      closeLayer();
    });
  }

  if (input) {
    input.addEventListener("focus", openLayer);
    input.addEventListener("input", (event) => renderResults(event.target.value));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeLayer();
      }
    });
    input.addEventListener("blur", () => {
      window.setTimeout(() => {
        if (!input.value.trim() && !layer.matches(":focus-within")) {
          closeLayer();
        }
      }, 120);
    });
  }
}

// FORGEOS:DESKTOP_CONTEXT_DRAWER_054F:START
(() => {
  const initDesktopContextDrawer = () => {
    const toggle = document.querySelector(".desktop-context-toggle");
    const panel = document.querySelector(".desktop-context-rail");
    const close = document.querySelector(".desktop-context-close");

    if (!toggle || !panel) {
      return;
    }

    const setOpen = (isOpen) => {
      document.body.classList.toggle("desktop-context-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      panel.setAttribute("aria-hidden", String(!isOpen));
    };

    toggle.addEventListener("click", () => {
      setOpen(!document.body.classList.contains("desktop-context-open"));
    });

    if (close) {
      close.addEventListener("click", () => setOpen(false));
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDesktopContextDrawer, { once: true });
  } else {
    initDesktopContextDrawer();
  }
})();
// FORGEOS:DESKTOP_CONTEXT_DRAWER_054F:END
