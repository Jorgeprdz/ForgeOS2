/* FORGEOS:STATIC_ENGINE_ADAPTER_DRY_RUN_059E:START */
(function () {
  "use strict";

  var outputs = [];
  var sequence = 0;

  var adapters = {
    "quote.create.preview": "static.quote_preview",
    "policy.upload.preview": "static.document_intake",
    "client.follow.preview": "static.follow_up_draft",
    "client.call.preview": "static.call_prep",
    "client.message.preview": "static.message_draft",
    "client.search.preview": "static.client_read",
    "policy.open.preview": "static.policy_read",
    "report.open.preview": "static.report_read",
    "pipeline.review.preview": "static.pipeline_review",
    "day.review.preview": "static.daily_review"
  };

  var knownSurfaces = {
    "desktop.command_workspace": true,
    "desktop.table_row": true,
    "desktop.decision_strip": true,
    "desktop.right_rail": true,
    "mobile.command_card": true,
    "mobile.widget_grid": true,
    "mobile.bottom_nav": true
  };

  function baseOutput(packet, status) {
    sequence += 1;
    return {
      dryRunVersion: "059E.static.preview",
      dryRunId: "forge-dry-run-" + String(sequence).padStart(4, "0"),
      dryRunStatus: status,
      actionId: packet && packet.actionId ? packet.actionId : "unknown",
      packetId: packet && packet.packetId ? packet.packetId : "missing",
      adapterCandidate: "none",
      previewMode: true,
      requiresHumanApproval: true,
      executionAllowed: false,
      writesAllowed: false,
      sendAllowed: false,
      calendarAllowed: false,
      crmAllowed: false,
      auditTrace: {
        source: "059B_STATIC_ACTION_PACKET_BRIDGE",
        contract: "059D_ENGINE_ADAPTER_RECONNECT_DRY_RUN_CONTRACT",
        implementation: "059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION",
        decision: status === "DRY_RUN_ACCEPTED" ? "accepted_preview_only" : "refused"
      }
    };
  }

  function refusal(packet, reason, message) {
    var output = baseOutput(packet || {}, "DRY_RUN_REFUSED");
    output.refusal = {
      reason: reason,
      message: message
    };
    return output;
  }

  function validate(packet) {
    if (!packet || typeof packet !== "object") return refusal(packet, "MISSING_REQUIRED_FIELD", "Packet is missing.");
    if (!packet.packetVersion || String(packet.packetVersion).indexOf("059B.") !== 0) return refusal(packet, "MISSING_REQUIRED_FIELD", "packetVersion must start with 059B.");
    if (!packet.packetId) return refusal(packet, "MISSING_REQUIRED_FIELD", "packetId is required.");
    if (!packet.actionId) return refusal(packet, "MISSING_REQUIRED_FIELD", "actionId is required.");
    if (!adapters[packet.actionId]) return refusal(packet, "UNKNOWN_ACTION_ID", "Action id is not allowlisted.");
    if (!packet.sourceSurface || !knownSurfaces[packet.sourceSurface]) return refusal(packet, "UNSUPPORTED_SURFACE", "Source surface is unknown.");
    if (packet.previewMode !== true) return refusal(packet, "PREVIEW_MODE_REQUIRED", "Packet must be preview-only.");
    if (packet.requiresHumanApproval !== true) return refusal(packet, "HUMAN_APPROVAL_REQUIRED", "Human approval is required.");
    if (!packet.safeIntent) return refusal(packet, "MISSING_REQUIRED_FIELD", "safeIntent is required.");
    return null;
  }

  function accept(packet) {
    var output = baseOutput(packet, "DRY_RUN_ACCEPTED");
    output.adapterCandidate = adapters[packet.actionId];
    output.previewPayload = {
      title: packet.previewPayload && packet.previewPayload.title ? packet.previewPayload.title : "Preparar preview",
      body: packet.previewPayload && packet.previewPayload.body ? packet.previewPayload.body : packet.safeIntent,
      safety: "Sin envio, sin CRM, sin calendario.",
      nextStep: "Revisar preview y conservar aprobacion humana."
    };
    return output;
  }

  function publish(output) {
    outputs.push(output);
    window.__forgeStaticEngineDryRuns059E = outputs.slice();
    document.documentElement.setAttribute("data-forge-dry-run-059e", output.dryRunStatus);
    document.documentElement.setAttribute("data-forge-dry-run-count-059e", String(outputs.length));
    window.dispatchEvent(new CustomEvent("forge:static-engine-dry-run:059e", { detail: output }));
  }

  function runDry(packet) {
    var refused = validate(packet);
    var output = refused || accept(packet);
    publish(output);
    return output;
  }

  function init() {
    if (window.__forgeStaticEngineDryRun059EReady) return;
    window.__forgeStaticEngineDryRun059EReady = true;
    window.__forgeStaticEngineDryRuns059E = outputs;
    window.__forgeRunStaticEngineDryRun059E = runDry;
    window.addEventListener("forge:static-action-packet:059b", function (event) {
      runDry(event.detail);
    });
    document.documentElement.setAttribute("data-forge-engine-dry-run-059e", "ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
/* FORGEOS:STATIC_ENGINE_ADAPTER_DRY_RUN_059E:END */
