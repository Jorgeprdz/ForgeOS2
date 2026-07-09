# Forge Quote Preview Location Decision Router Gate Evidence 106V

PHASE=106V_QUOTE_PREVIEW_LOCATION_DECISION_ROUTER_GATE
STATUS=PASS
DECISION=PASS_106V_QUOTE_PREVIEW_LOCATION_DECISION_ROUTER_GATE
LOCKED_DECISION=LOCATION_DECISION_ROUTER_GATE_LOCKED_TO_MANUAL_PDF_LOOKUP_GATE_NO_VALUES_NO_TRUTH
NEXT=106W_QUOTE_PREVIEW_MANUAL_PDF_LOOKUP_GATE

## Router JSON

{
  "phase": "106V_QUOTE_PREVIEW_LOCATION_DECISION_ROUTER_GATE",
  "status": "PASS",
  "decision": "PASS_106V_QUOTE_PREVIEW_LOCATION_DECISION_ROUTER_GATE",
  "lockedDecision": "LOCATION_DECISION_ROUTER_GATE_LOCKED_TO_MANUAL_PDF_LOOKUP_GATE_NO_VALUES_NO_TRUTH",
  "basePhase": "106U_QUOTE_PREVIEW_HUMAN_REVIEW_DECISION_DRY_RUN",
  "schemaVersion": "106C.1",
  "testUrl": "https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/nueva-cotizacion/?v=105dr5",
  "routerType": "location_decision_router_gate_only",
  "sourceUiChanged": false,
  "fastTrackMode": {
    "manualOperatorTokenRequired": false,
    "internalDryRunGuard": "ROUTE_PENDING_LOCATION_DECISIONS_ONLY",
    "reason": "106V is a safe router phase and reads only committed pending decision evidence."
  },
  "inputSummary": {
    "decisionRecordCount": 28,
    "criticalTargetCount": 6,
    "keepPendingDecisionCount": 28,
    "recommendedManualPdfLookupCount": 27,
    "recommendedBlockedAmbiguousCount": 1
  },
  "routeDecision": {
    "selectedRoute": "manual_pdf_lookup_gate_with_pending_location_decisions",
    "nextPhase": "106W_QUOTE_PREVIEW_MANUAL_PDF_LOOKUP_GATE",
    "reason": "All current decisions are pending. Manual PDF lookup is recommended later, but not executed now.",
    "allDryRunDispositionsKeepPending": true,
    "hasManualPdfLookupRecommendations": true,
    "hasBlockedAmbiguousRecommendations": true,
    "humanDecisionExecuted": false,
    "actualHumanReviewed": false,
    "rawPdfAccessed": false,
    "rawTextAccessed": false,
    "rawValueExtracted": false,
    "realValueExtracted": false,
    "realValueApprovalExecuted": false,
    "candidateApprovalAsTruthExecuted": false,
    "quoteTruthCreated": false,
    "uiPopulated": false,
    "presentationGenerated": false
  },
  "fieldRoutes": [
    {
      "fieldKey": "plan_sum_insured_and_premium",
      "decisionRecordCount": 11,
      "pendingDecisionCount": 11,
      "recommendedManualPdfLookupCount": 11,
      "recommendedBlockedAmbiguousCount": 0,
      "fieldRoute": "manual_pdf_lookup_required_later",
      "realValueLookupExecuted": false,
      "realValueApprovalExecuted": false,
      "quoteTruthCreated": false,
      "uiPopulationExecuted": false,
      "humanReviewRequired": true
    },
    {
      "fieldKey": "payment_form_currency_and_validity",
      "decisionRecordCount": 6,
      "pendingDecisionCount": 6,
      "recommendedManualPdfLookupCount": 5,
      "recommendedBlockedAmbiguousCount": 1,
      "fieldRoute": "manual_pdf_lookup_required_later",
      "realValueLookupExecuted": false,
      "realValueApprovalExecuted": false,
      "quoteTruthCreated": false,
      "uiPopulationExecuted": false,
      "humanReviewRequired": true
    },
    {
      "fieldKey": "total_aportado",
      "decisionRecordCount": 2,
      "pendingDecisionCount": 2,
      "recommendedManualPdfLookupCount": 2,
      "recommendedBlockedAmbiguousCount": 0,
      "fieldRoute": "manual_pdf_lookup_required_later",
      "realValueLookupExecuted": false,
      "realValueApprovalExecuted": false,
      "quoteTruthCreated": false,
      "uiPopulationExecuted": false,
      "humanReviewRequired": true
    },
    {
      "fieldKey": "total_recuperacion",
      "decisionRecordCount": 2,
      "pendingDecisionCount": 2,
      "recommendedManualPdfLookupCount": 2,
      "recommendedBlockedAmbiguousCount": 0,
      "fieldRoute": "manual_pdf_lookup_required_later",
      "realValueLookupExecuted": false,
      "realValueApprovalExecuted": false,
      "quoteTruthCreated": false,
      "uiPopulationExecuted": false,
      "humanReviewRequired": true
    },
    {
      "fieldKey": "values_benefits_or_scenarios_relevant_to_plan",
      "decisionRecordCount": 1,
      "pendingDecisionCount": 1,
      "recommendedManualPdfLookupCount": 1,
      "recommendedBlockedAmbiguousCount": 0,
      "fieldRoute": "manual_pdf_lookup_required_later",
      "realValueLookupExecuted": false,
      "realValueApprovalExecuted": false,
      "quoteTruthCreated": false,
      "uiPopulationExecuted": false,
      "humanReviewRequired": true
    },
    {
      "fieldKey": "missing_items_before_presentation",
      "decisionRecordCount": 6,
      "pendingDecisionCount": 6,
      "recommendedManualPdfLookupCount": 6,
      "recommendedBlockedAmbiguousCount": 0,
      "fieldRoute": "manual_pdf_lookup_required_later",
      "realValueLookupExecuted": false,
      "realValueApprovalExecuted": false,
      "quoteTruthCreated": false,
      "uiPopulationExecuted": false,
      "humanReviewRequired": true
    }
  ],
  "manualPdfLookupGateDefinitionFor106W": {
    "nextPhase": "106W_QUOTE_PREVIEW_MANUAL_PDF_LOOKUP_GATE",
    "purpose": "Define a safe gate for later manual PDF lookup by a human operator.",
    "gateOnly": true,
    "manualOperatorTokenRequired": false,
    "rawPdfAccessAllowedIn106W": false,
    "rawTextAccessAllowedIn106W": false,
    "realValueExtractionAllowedIn106W": false,
    "realValueApprovalAllowedIn106W": false,
    "quoteTruthAllowedIn106W": false,
    "uiPopulationAllowedIn106W": false,
    "presentationGenerationAllowedIn106W": false,
    "futureActualLookupWouldRequireExplicitLaterGate": true
  },
  "blockedActionsRemainBlocked": [
    "raw_pdf_access",
    "raw_text_access",
    "raw_value_extraction",
    "real_value_extraction",
    "real_value_approval",
    "candidate_approval_as_truth",
    "quote_truth",
    "ui_population",
    "presentation_generation",
    "parser_execution",
    "ocr_execution",
    "calculator_execution",
    "backend_connection",
    "crm_write"
  ],
  "rulesConfirmed": {
    "locationDecisionRouterGateOnly": true,
    "manualOperatorTokenRequired": false,
    "routeIsBasedOnPendingLocationDecisionsOnly": true,
    "allDryRunDispositionsKeepPending": true,
    "manualPdfLookupRecommendedLater": true,
    "manualPdfLookupExecutedNow": false,
    "humanDecisionExecuted": false,
    "actualHumanReviewed": false,
    "rawPdfAccessed": false,
    "rawTextAccessed": false,
    "rawValueExtracted": false,
    "realValueExtracted": false,
    "realValueApprovalExecuted": false,
    "candidateApprovalAsTruthExecuted": false,
    "parserExecuted": false,
    "ocrExecuted": false,
    "calculatorExecuted": false,
    "quoteTruthCreated": false,
    "uiPopulated": false,
    "presentationGenerated": false
  },
  "safetyFlags": {
    "crmWrite": false,
    "pipelineWrite": false,
    "policyWrite": false,
    "quoteWrite": false,
    "taskCreate": false,
    "calendarCreate": false,
    "messageSend": false,
    "authReal": false,
    "providerRuntime": false,
    "secretAccess": false,
    "browserPersistence": false,
    "realEngineExecution": false,
    "realEffectsAllowed": false,
    "realEffectsEnabled": false,
    "backendConnection": false,
    "pdfRead": false,
    "ocrExecution": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false,
    "testExecution": false,
    "officialQuoteAllowed": false,
    "providerRuntimeAllowed": false,
    "calculatorExecutionAllowed": false,
    "parserExecutionAllowed": false,
    "backendConnectionAllowed": false,
    "quoteTruthAllowed": false,
    "presentationGenerationAllowed": false,
    "promptGenerationAllowed": false,
    "pdfSubmitAllowed": false,
    "printAutomation": false
  },
  "next": "106W_QUOTE_PREVIEW_MANUAL_PDF_LOOKUP_GATE"
}

## Validation JSON

{
  "phase": "106V_QUOTE_PREVIEW_LOCATION_DECISION_ROUTER_GATE",
  "status": "PASS",
  "decision": "PASS_106V_QUOTE_PREVIEW_LOCATION_DECISION_ROUTER_GATE",
  "lockedDecision": "LOCATION_DECISION_ROUTER_GATE_LOCKED_TO_MANUAL_PDF_LOOKUP_GATE_NO_VALUES_NO_TRUTH",
  "routerType": "location_decision_router_gate_only",
  "manualOperatorTokenRequired": false,
  "internalDryRunGuard": "ROUTE_PENDING_LOCATION_DECISIONS_ONLY",
  "decisionRecordCount": 28,
  "criticalTargetCount": 6,
  "keepPendingDecisionCount": 28,
  "recommendedManualPdfLookupCount": 27,
  "recommendedBlockedAmbiguousCount": 1,
  "selectedRoute": "manual_pdf_lookup_gate_with_pending_location_decisions",
  "next": "106W_QUOTE_PREVIEW_MANUAL_PDF_LOOKUP_GATE",
  "allDryRunDispositionsKeepPending": true,
  "manualPdfLookupRecommendedLater": true,
  "manualPdfLookupExecutedNow": false,
  "humanDecisionExecuted": false,
  "actualHumanReviewed": false,
  "rawPdfAccessed": false,
  "rawTextAccessed": false,
  "rawValueExtracted": false,
  "realValueExtracted": false,
  "realValueApprovalExecuted": false,
  "candidateApprovalAsTruthExecuted": false,
  "parserExecuted": false,
  "ocrExecuted": false,
  "calculatorExecuted": false,
  "quoteTruthCreated": false,
  "uiPopulated": false,
  "presentationGenerated": false,
  "sourceUiChanged": false,
  "allSafetyFlagsFalse": true,
  "errors": []
}

## Confirmed

- Location decision router gate locked.
- Manual operator token is not required.
- Selected route was created.
- Next phase is 106W.
- All dry-run dispositions remain keep_pending.
- Manual PDF lookup is recommended later.
- Manual PDF lookup was not executed now.
- Human decision was not executed.
- Actual human review was not completed.
- Raw PDF was not accessed.
- Raw text was not accessed.
- Raw value was not extracted.
- Real value was not extracted.
- Real value approval was not executed.
- Candidate truth is forbidden.
- Parser was not executed.
- OCR was not executed.
- Calculator was not executed.
- Quote truth was not created.
- UI was not populated.
- Presentation was not generated.
- Source UI was not changed.
