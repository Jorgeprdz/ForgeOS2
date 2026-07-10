"use strict";

(() => {
  const api = window.ForgeQuotePreviewLive;
  const fileInput = document.getElementById("packet-file");
  const openButton = document.getElementById("open-preview");
  const status = document.getElementById("status");
  const source = document.getElementById("source");
  const result = document.getElementById("result");

  if (
    !api ||
    typeof api.createQuotePreviewPdfFlowPopupInvocation !== "function" ||
    typeof api.createMemoryBackend !== "function" ||
    typeof api.createStore !== "function"
  ) {
    throw new Error("El bundle real de Forge no está disponible.");
  }

  const backend = api.createMemoryBackend();
  const store = api.createStore({
    backend,
    now: () => Date.now(),
  });

  let packet = null;
  let sequence = 0;

  const invocation =
    api.createQuotePreviewPdfFlowPopupInvocation({
      documentLike: document,
      mountTarget: document.body,
      store,
      createPreviewResultId(preview) {
        sequence += 1;
        const hash =
          preview.source &&
          typeof preview.source.pdfSha256 === "string"
            ? preview.source.pdfSha256.slice(0, 12)
            : "local";
        return `pages-${hash}-${Date.now()}-${sequence}`;
      },
      now: () => Date.now(),
      ttlMs: 24 * 60 * 60 * 1000,
      onPersisted(persisted) {
        status.textContent =
          "Cotización aceptada y guardada en memoria.";
        result.textContent = JSON.stringify(
          persisted,
          null,
          2
        );
      },
      onEditRequested(preview) {
        status.textContent =
          "Edición solicitada. No hubo escritura ni lectura del store.";
        result.textContent = JSON.stringify(
          {
            action: "edit",
            persisted: false,
            source: preview.source,
          },
          null,
          2
        );
      },
      onError(error, context) {
        status.textContent =
          "Ocurrió un error y el pop-up permanece abierto.";
        result.textContent = JSON.stringify(
          {
            error:
              error && error.message
                ? error.message
                : String(error),
            context,
          },
          null,
          2
        );
      },
    });

  function validatePacket(value) {
    if (!value || typeof value !== "object") {
      throw new Error("El paquete debe ser un objeto JSON.");
    }
    if (
      !value.nativeResult ||
      typeof value.nativeResult !== "object"
    ) {
      throw new Error("Falta nativeResult.");
    }
    if (
      !value.context ||
      typeof value.context !== "object"
    ) {
      throw new Error("Falta context.");
    }
    return value;
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];

    packet = null;
    openButton.disabled = true;

    if (!file) {
      status.textContent = "Esperando paquete local.";
      source.textContent = "Sin cargar.";
      return;
    }

    try {
      const text = await file.text();
      packet = validatePacket(JSON.parse(text));
      openButton.disabled = false;
      status.textContent =
        "Paquete real cargado. Listo para abrir.";
      source.textContent =
        packet.source &&
        packet.source.pdfSha256
          ? `${packet.source.pdfFileName || file.name} · SHA-256 ${packet.source.pdfSha256}`
          : file.name;
      result.textContent =
        "El paquete se cargó localmente. Sus datos no se enviaron a GitHub.";
    } catch (error) {
      status.textContent = "Paquete inválido.";
      result.textContent =
        error && error.message
          ? error.message
          : String(error);
    }
  });

  openButton.addEventListener("click", () => {
    if (!packet) return;

    invocation.present({
      nativeResult: packet.nativeResult,
      context: packet.context,
      ambiguity:
        packet.ambiguity &&
        typeof packet.ambiguity === "object"
          ? packet.ambiguity
          : {},
      source:
        packet.source &&
        typeof packet.source === "object"
          ? packet.source
          : {},
    });

    status.textContent = "Pop-up abierto.";
  });
})();
