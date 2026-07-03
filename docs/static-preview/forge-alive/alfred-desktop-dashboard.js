const app = document.querySelector(".alfred-desktop-app-056g7");

function setActiveButton(buttons, selected) {
  buttons.forEach((button) => {
    button.classList.toggle("active", button === selected);
  });
}

function initAlfredDesktopDashboard056G7() {
  if (!app) return;

  const navButtons = [...app.querySelectorAll(".alfred-nav-056g7 button")];
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveButton(navButtons, button);
      app.dataset.section = button.dataset.section || "inicio";
    });
  });

  const kpiButtons = [...app.querySelectorAll(".alfred-kpi-056g7")];
  kpiButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveButton(kpiButtons, button);
      app.dataset.kpi = button.dataset.kpi || "meta";
    });
  });

  const selectedClient = app.querySelector("#alfred-selected-client-056g7");
  const clientButtons = [...app.querySelectorAll("[data-client]")];
  clientButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveButton(clientButtons, button);
      if (selectedClient) selectedClient.textContent = button.dataset.client || "Cliente";
    });
  });

  const commandInput = app.querySelector(".alfred-command-dock-056g7 input");
  app.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.dataset.command || "";
      if (!commandInput) return;
      if (command === "plan") commandInput.value = "Preparar plan de seguimiento de hoy";
      if (command === "voice") commandInput.value = "Vista de voz bloqueada: solo revisión";
      if (command === "send") commandInput.value = "Envío bloqueado hasta aprobación humana";
      commandInput.focus();
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAlfredDesktopDashboard056G7);
} else {
  initAlfredDesktopDashboard056G7();
}
