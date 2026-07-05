/* FORGEOS:LOCAL_READ_MODEL_SOURCE_ADAPTER_060I:START */
(function () {
  "use strict";

  var SOURCE_TYPE = "repo_local_read_model_source";
  var SOURCE_PATH = "docs/evidence/forge-selected-engine-dry-run-audit-060e.json";
  var SOURCE_SNAPSHOT = {
  "phase": "060E_SELECTED_ENGINE_DRY_RUN_EVIDENCE_LOCK",
  "status": "PASS",
  "adapter": "forge-report-read-model-dry-run-adapter-060d.js",
  "acceptedPacket": {
    "packetVersion": "059B.static.preview",
    "packetId": "forge-report-preview-060e",
    "actionId": "report.open.preview",
    "sourceSurface": "desktop.command_workspace",
    "sourcePlatform": "desktop",
    "sourceModule": "reportes",
    "humanLabel": "Ver preview de reporte",
    "previewMode": true,
    "requiresHumanApproval": true,
    "selectedCandidate": "selected.report_read_model_preview"
  },
  "accepted": {
    "dryRunStatus": "DRY_RUN_ACCEPTED",
    "actionId": "report.open.preview",
    "adapterCandidate": "report_read_model_dry_run",
    "selectedCandidate": "selected.report_read_model_preview",
    "previewMode": true,
    "requiresHumanApproval": true,
    "executionAllowed": false,
    "writesAllowed": false,
    "sendAllowed": false,
    "calendarAllowed": false,
    "crmAllowed": false,
    "evidence": {
      "source": "060D static report read-model dry-run adapter",
      "decision": "accepted_preview_only"
    },
    "reportPreview": {
      "title": "Preview de reporte",
      "summary": "Lectura segura preparada para revision humana.",
      "sourceModule": "reportes",
      "sourceSurface": "desktop.command_workspace",
      "rows": [
        {
          "label": "Estado",
          "value": "Preview sin ejecucion"
        },
        {
          "label": "Motor",
          "value": "Dry-run estatico"
        },
        {
          "label": "Aprobacion",
          "value": "Humana requerida"
        }
      ]
    }
  },
  "refusedPacket": {
    "packetVersion": "059B.static.preview",
    "packetId": "forge-report-refusal-060e",
    "actionId": "client.follow.preview",
    "sourceSurface": "desktop.command_workspace",
    "sourcePlatform": "desktop",
    "sourceModule": "clientes",
    "humanLabel": "Follow preview",
    "previewMode": true,
    "requiresHumanApproval": true,
    "selectedCandidate": "selected.report_read_model_preview"
  },
  "refused": {
    "dryRunStatus": "DRY_RUN_REFUSED",
    "actionId": "client.follow.preview",
    "adapterCandidate": "report_read_model_dry_run",
    "selectedCandidate": "selected.report_read_model_preview",
    "previewMode": true,
    "requiresHumanApproval": true,
    "executionAllowed": false,
    "writesAllowed": false,
    "sendAllowed": false,
    "calendarAllowed": false,
    "crmAllowed": false,
    "evidence": {
      "source": "060D static report read-model dry-run adapter",
      "decision": "refused_preview_only"
    },
    "refusal": {
      "reason": "UNKNOWN_ACTION_ID",
      "message": "Only report.open.preview is accepted."
    }
  },
  "dispatched": [
    {
      "type": "forge:report-read-model-dry-run:060d",
      "detail": {
        "dryRunStatus": "DRY_RUN_ACCEPTED",
        "actionId": "report.open.preview",
        "adapterCandidate": "report_read_model_dry_run",
        "selectedCandidate": "selected.report_read_model_preview",
        "previewMode": true,
        "requiresHumanApproval": true,
        "executionAllowed": false,
        "writesAllowed": false,
        "sendAllowed": false,
        "calendarAllowed": false,
        "crmAllowed": false,
        "evidence": {
          "source": "060D static report read-model dry-run adapter",
          "decision": "accepted_preview_only"
        },
        "reportPreview": {
          "title": "Preview de reporte",
          "summary": "Lectura segura preparada para revision humana.",
          "sourceModule": "reportes",
          "sourceSurface": "desktop.command_workspace",
          "rows": [
            {
              "label": "Estado",
              "value": "Preview sin ejecucion"
            },
            {
              "label": "Motor",
              "value": "Dry-run estatico"
            },
            {
              "label": "Aprobacion",
              "value": "Humana requerida"
            }
          ]
        }
      }
    }
  ],
  "safety": {
    "providerExecution": false,
    "realEngineExecution": false,
    "messageSend": false,
    "crmWrite": false,
    "calendarCreate": false,
    "browserStorageMutation": false,
    "liveExternalData": false
  }
};

  function baseOutput(status) {
    return {
      readModelStatus: status,
      sourceType: SOURCE_TYPE,
      sourcePath: SOURCE_PATH,
      previewMode: true,
      requiresHumanApproval: true,
      executionAllowed: false,
      writesAllowed: false,
      sendAllowed: false,
      calendarAllowed: false,
      crmAllowed: false
    };
  }

  function refusal(reason, message) {
    var output = baseOutput("LOCAL_READ_MODEL_REFUSED");
    output.refusal = {
      reason: reason,
      message: message
    };
    return output;
  }

  function runLocalSource() {
    var accepted = SOURCE_SNAPSHOT && SOURCE_SNAPSHOT.accepted;
    if (!accepted) {
      return refusal("SOURCE_NOT_ACCEPTED", "Selected local source has no accepted dry-run path.");
    }
    if (accepted.dryRunStatus !== "DRY_RUN_ACCEPTED") {
      return refusal("SOURCE_NOT_ACCEPTED", "Selected local source is not accepted.");
    }
    if (accepted.actionId !== "report.open.preview") {
      return refusal("WRONG_ACTION_ID", "Selected local source is not for report.open.preview.");
    }
    if (!accepted.reportPreview) {
      return refusal("MISSING_REPORT_PREVIEW", "Selected local source has no report preview.");
    }

    var output = baseOutput("LOCAL_READ_MODEL_READY");
    output.actionId = accepted.actionId;
    output.adapterCandidate = "local_read_model_source_adapter";
    output.selectedCandidate = accepted.selectedCandidate || "selected.report_read_model_preview";
    output.reportPreview = accepted.reportPreview;
    output.evidence = {
      source: "060I static local read-model source adapter",
      sourceAuditPhase: SOURCE_SNAPSHOT.phase || "",
      decision: "local_source_ready_preview_only"
    };
    return output;
  }

  function handleReportDryRun(event) {
    var detail = event && event.detail ? event.detail : null;
    if (!detail || detail.dryRunStatus !== "DRY_RUN_ACCEPTED") return;
    window.dispatchEvent(new CustomEvent("forge:local-read-model-source:060i", { detail: runLocalSource() }));
  }

  if (typeof window !== "undefined") {
    window.__forgeRunLocalReadModelSourceAdapter060I = runLocalSource;
    window.addEventListener("forge:report-read-model-dry-run:060d", handleReportDryRun);
  }
})();
/* FORGEOS:LOCAL_READ_MODEL_SOURCE_ADAPTER_060I:END */
