# 107Z14P — Controlled browser harness provisioning evidence

Status: **PASS**

```json
{
  "chain": "107Z14P_CONTROLLED_BROWSER_HARNESS_PROVISIONING_GATE",
  "status": "PASS",
  "generated_at_local_stamp": "20260710_115152",
  "provisioning": {
    "IMPLEMENTATION_SCOPE_ID": "QUOTE_PREVIEW_PDF_RESULT_PERSISTENCE_V1",
    "PROVISIONING_COMPLETE": true,
    "TERMUX_X11_REPOSITORY_AVAILABLE": true,
    "TERMUX_CHROMIUM_AVAILABLE": true,
    "PUPPETEER_CORE_AVAILABLE": true,
    "HOME_MODULE_RESOLUTION_AVAILABLE": true,
    "ACTUAL_BROWSER_SMOKE_TEST_PASS": true,
    "LOCALHOST_SERVER_USED": true,
    "SYNTHETIC_DATA_USED": true,
    "EPHEMERAL_LOCAL_STORAGE_EFFECT_EXECUTED": true,
    "EPHEMERAL_STORAGE_CLEARED_AFTER_TEST": true,
    "TEMP_BROWSER_PROFILE_REMOVED": true,
    "TOOL_ROOT": "/data/data/com.termux/files/home/.forge-tools/quote-preview-browser-harness-v1",
    "ENVIRONMENT_FILE": "/data/data/com.termux/files/home/.forge-tools/quote-preview-browser-harness-v1/environment.sh",
    "BROWSER_EXECUTABLE": "/data/data/com.termux/files/usr/bin/chromium-browser",
    "BROWSER_VERSION": "Chromium 149.0.7827.155 ",
    "PUPPETEER_RESOLVED_PATH": "/data/data/com.termux/files/home/.forge-tools/quote-preview-browser-harness-v1/npm/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js",
    "PUPPETEER_VERSION": "25.3.0",
    "X11_REPO_INSTALLED_BY_GATE": false,
    "CHROMIUM_INSTALLED_BY_GATE": true,
    "NODEJS_INSTALLED_BY_GATE": false,
    "PUPPETEER_INSTALLED_BY_GATE": true,
    "PUPPETEER_LINK_CREATED_BY_GATE": true,
    "NEXT_GATE": "107Z14R_QUOTE_PREVIEW_PDF_RUNTIME_PERSISTENCE_CONTROLLED_BROWSER_INTEGRATION_RETRY_GATE"
  },
  "smoke_test": {
    "status": "PASS",
    "reason": null,
    "browserPath": "/data/data/com.termux/files/usr/bin/chromium-browser",
    "browserVersion": "Chrome/149.0.7827.155",
    "result": {
      "domReady": true,
      "storageValue": "ok",
      "storageCountBeforeClear": 1,
      "storageCountAfterClear": 0,
      "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.0.0 Safari/537.36"
    },
    "externalRequests": [],
    "pageErrors": []
  },
  "authorization": {
    "CONTROLLED_BROWSER_INTEGRATION_RETRY_AUTHORIZED": true,
    "REPO_SOURCE_WRITE_AUTHORIZED": false,
    "LIVE_APPLICATION_RUNTIME_AUTHORIZED": false,
    "PDF_READ_AUTHORIZED": false,
    "OCR_EXECUTION_AUTHORIZED": false,
    "PARSER_EXECUTION_AUTHORIZED": false,
    "BACKEND_CONNECTION_AUTHORIZED": false,
    "OFFICIAL_QUOTE_WRITE_AUTHORIZED": false,
    "QUOTE_TRUTH_AUTHORIZED": false,
    "REAL_CUSTOMER_DATA_AUTHORIZED": false,
    "REAL_EFFECTS_AUTHORIZED": false
  },
  "constitutional_flags": {
    "NEW_ENGINE_CREATED": false,
    "NEW_CACHE_CREATED": false,
    "DUPLICATE_BRIDGE_CREATED": false,
    "SOURCE_UI_CHANGED": false,
    "PDF_READ_EXECUTED": false,
    "OCR_EXECUTED": false,
    "PARSER_EXECUTED": false,
    "BACKEND_CONNECTION": false,
    "QUOTE_TRUTH_ALLOWED": false,
    "TEST_EXECUTION": true,
    "EXTERNAL_TOOLING_PROVISIONED": true,
    "CONTROLLED_BROWSER_EXECUTION": true,
    "EPHEMERAL_STORAGE_EFFECT_EXECUTED": true
  },
  "input_validation": {
    "CHAIN": "107Z13_QUOTE_PREVIEW_PDF_RUNTIME_PERSISTENCE_SOURCE_VALIDATION_AND_DRY_RUN_GATE",
    "STATUS": "PASS"
  }
}
```
