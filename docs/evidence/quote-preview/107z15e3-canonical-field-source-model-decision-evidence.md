# 107Z15E3 — Canonical field source model evidence

Status: **PASS**

```json
{
  "status": "PASS",
  "decision": {
    "IMPLEMENTATION_SCOPE_ID": "QUOTE_PREVIEW_PDF_RESULT_PERSISTENCE_V1",
    "DECISION_ID": "CANONICAL_FIELD_SOURCE_MODEL_DECISION_V1",
    "FIELD_MODEL_REVIEW_COMPLETE": true,
    "FINAL_DECISION_PACKET_READY": true,
    "CANONICAL_FIELD_COUNT": 8,
    "PROVEN_FIELD_COUNT": 1,
    "PROVEN_FIELDS": [
      "product"
    ],
    "ARCHITECTURE_APPROVAL_FIELD_COUNT": 7,
    "ARCHITECTURE_APPROVAL_FIELDS": [
      "name",
      "family",
      "insured",
      "sumAssured",
      "annualPremium",
      "plannedOrAvePremium",
      "coveragePeriod"
    ],
    "CONTRACT_REPAIR_FIELD_COUNT": 0,
    "CONTRACT_REPAIR_FIELDS": [],
    "FIELD_SOURCE_MODEL_RESOLVED": false,
    "VERDICT": "FIELD_SOURCE_MODEL_REQUIRES_ARCHITECTURE_APPROVAL",
    "MAPPING_APPROVED": false,
    "BRIDGE_IMPLEMENTATION_AUTHORIZED": false,
    "SOURCE_CHANGE_AUTHORIZED": false,
    "SOURCE_CODE_WRITTEN": false,
    "SCHEMA_CHANGED": false,
    "REAL_ENGINE_EXECUTION": false,
    "PARSER_EXECUTED": false,
    "CONTROLLED_BROWSER_EXECUTION": false,
    "PDF_READ_EXECUTED": false,
    "BACKEND_CONNECTION": false,
    "QUOTE_TRUTH_ALLOWED": false,
    "NEXT_GATE": "107Z15E3A_CANONICAL_FIELD_SOURCE_MODEL_APPROVAL_GATE"
  },
  "fieldModels": {
    "name": {
      "previousAuthorizationStatus": "AMBIGUOUS_EXPLICIT_MAPPINGS",
      "contractPresenceRequired": true,
      "modalEditableEvidence": true,
      "contextMentions": [],
      "derivedMentions": [],
      "rankedSourceCandidates": [
        {
          "sourceExpression": "nativeResult.prospect",
          "enginePath": "prospect",
          "engineExpression": "insuredLine ? cleanValue(insuredLine.replace(/Asegurado:/i, '')) : null",
          "score": 55,
          "evidence": {
            "engineExpression": "insuredLine ? cleanValue(insuredLine.replace(/Asegurado:/i, '')) : null",
            "repoFileCount": 20,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.sumInsured",
          "enginePath": "sumInsured",
          "engineExpression": "productMatch ? formatUdi(productMatch[3]) : null",
          "score": 35,
          "evidence": {
            "engineExpression": "productMatch ? formatUdi(productMatch[3]) : null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        }
      ],
      "recommendedOwnershipClass": "AMBIGUOUS_ENGINE_CANDIDATES",
      "recommendedSourceExpression": null,
      "decisionStatus": "ARCHITECTURE_APPROVAL_REQUIRED",
      "decisionReason": "multiple plausible engine sources remain"
    },
    "family": {
      "previousAuthorizationStatus": "AMBIGUOUS_EXPLICIT_MAPPINGS",
      "contractPresenceRequired": true,
      "modalEditableEvidence": false,
      "contextMentions": [
        {
          "owner": "modal",
          "hint": "product_family"
        }
      ],
      "derivedMentions": [],
      "rankedSourceCandidates": [
        {
          "sourceExpression": "nativeResult.product",
          "enginePath": "product",
          "engineExpression": "'IMAGINA SER'",
          "score": 55,
          "evidence": {
            "engineExpression": "'IMAGINA SER'",
            "repoFileCount": 0,
            "contextMentions": [
              {
                "owner": "modal",
                "hint": "product_family"
              }
            ],
            "derivedMentions": []
          }
        }
      ],
      "recommendedOwnershipClass": "RUNTIME_CONTEXT",
      "recommendedSourceExpression": null,
      "decisionStatus": "ARCHITECTURE_APPROVAL_REQUIRED",
      "decisionReason": "field appears to belong to runtime context, but exact context property is not proven"
    },
    "product": {
      "previousAuthorizationStatus": "RESOLVED_EXACT_SAME_NAME_ENGINE_TOP_LEVEL",
      "contractPresenceRequired": true,
      "modalEditableEvidence": false,
      "contextMentions": [],
      "derivedMentions": [],
      "rankedSourceCandidates": [
        {
          "sourceExpression": "nativeResult.product",
          "enginePath": "product",
          "engineExpression": "'IMAGINA SER'",
          "score": 155,
          "evidence": {
            "engineExpression": "'IMAGINA SER'",
            "repoFileCount": 22,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.plan",
          "enginePath": "plan",
          "engineExpression": "planText || 'IMAGINA SER'",
          "score": 55,
          "evidence": {
            "engineExpression": "planText || 'IMAGINA SER'",
            "repoFileCount": 10,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.premiumTable.plannedAnnual",
          "enginePath": "premiumTable.plannedAnnual",
          "engineExpression": "plannedPremiumValues[3] ?? null",
          "score": 35,
          "evidence": {
            "engineExpression": "plannedPremiumValues[3] ?? null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.premiumTable.plannedMonthly",
          "enginePath": "premiumTable.plannedMonthly",
          "engineExpression": "plannedPremiumValues[0] ?? null",
          "score": 35,
          "evidence": {
            "engineExpression": "plannedPremiumValues[0] ?? null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.premiumTable.plannedQuarterly",
          "enginePath": "premiumTable.plannedQuarterly",
          "engineExpression": "plannedPremiumValues[1] ?? null",
          "score": 35,
          "evidence": {
            "engineExpression": "plannedPremiumValues[1] ?? null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.premiumTable.plannedSemiannual",
          "enginePath": "premiumTable.plannedSemiannual",
          "engineExpression": "plannedPremiumValues[2] ?? null",
          "score": 35,
          "evidence": {
            "engineExpression": "plannedPremiumValues[2] ?? null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        }
      ],
      "recommendedOwnershipClass": "ENGINE_DIRECT",
      "recommendedSourceExpression": "nativeResult.product",
      "decisionStatus": "PROVEN",
      "decisionReason": "exact same-name top-level engine output"
    },
    "insured": {
      "previousAuthorizationStatus": "AMBIGUOUS_EXPLICIT_MAPPINGS",
      "contractPresenceRequired": true,
      "modalEditableEvidence": false,
      "contextMentions": [],
      "derivedMentions": [],
      "rankedSourceCandidates": [
        {
          "sourceExpression": "nativeResult.prospect",
          "enginePath": "prospect",
          "engineExpression": "insuredLine ? cleanValue(insuredLine.replace(/Asegurado:/i, '')) : null",
          "score": 120,
          "evidence": {
            "engineExpression": "insuredLine ? cleanValue(insuredLine.replace(/Asegurado:/i, '')) : null",
            "repoFileCount": 23,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.sumInsured",
          "enginePath": "sumInsured",
          "engineExpression": "productMatch ? formatUdi(productMatch[3]) : null",
          "score": 35,
          "evidence": {
            "engineExpression": "productMatch ? formatUdi(productMatch[3]) : null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        }
      ],
      "recommendedOwnershipClass": "ENGINE_SEMANTIC_CANDIDATE",
      "recommendedSourceExpression": "nativeResult.prospect",
      "decisionStatus": "ARCHITECTURE_APPROVAL_REQUIRED",
      "decisionReason": "one evidence-backed engine candidate leads, but no explicit mapping exists"
    },
    "sumAssured": {
      "previousAuthorizationStatus": "AMBIGUOUS_EXPLICIT_MAPPINGS",
      "contractPresenceRequired": true,
      "modalEditableEvidence": false,
      "contextMentions": [],
      "derivedMentions": [],
      "rankedSourceCandidates": [
        {
          "sourceExpression": "nativeResult.sumInsured",
          "enginePath": "sumInsured",
          "engineExpression": "productMatch ? formatUdi(productMatch[3]) : null",
          "score": 94,
          "evidence": {
            "engineExpression": "productMatch ? formatUdi(productMatch[3]) : null",
            "repoFileCount": 2,
            "contextMentions": [],
            "derivedMentions": []
          }
        }
      ],
      "recommendedOwnershipClass": "ENGINE_SEMANTIC_CANDIDATE",
      "recommendedSourceExpression": "nativeResult.sumInsured",
      "decisionStatus": "ARCHITECTURE_APPROVAL_REQUIRED",
      "decisionReason": "one evidence-backed engine candidate leads, but no explicit mapping exists"
    },
    "annualPremium": {
      "previousAuthorizationStatus": "AMBIGUOUS_EXPLICIT_MAPPINGS",
      "contractPresenceRequired": true,
      "modalEditableEvidence": false,
      "contextMentions": [],
      "derivedMentions": [],
      "rankedSourceCandidates": [
        {
          "sourceExpression": "nativeResult.baseAnnualPremium",
          "enginePath": "baseAnnualPremium",
          "engineExpression": "productMatch ? formatUdi(productMatch[4]) : null",
          "score": 60,
          "evidence": {
            "engineExpression": "productMatch ? formatUdi(productMatch[4]) : null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.premiumTable.annual",
          "enginePath": "premiumTable.annual",
          "engineExpression": "basicPremiumValues[3] ?? totalTablePremiumValues[3] ?? totalPremiumValues[totalPremiumValues.length - 1] ?? null",
          "score": 60,
          "evidence": {
            "engineExpression": "basicPremiumValues[3] ?? totalTablePremiumValues[3] ?? totalPremiumValues[totalPremiumValues.length - 1] ?? null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.totalAnnualPremium",
          "enginePath": "totalAnnualPremium",
          "engineExpression": "totalPremiumValues.length ? formatUdi(totalPremiumValues[totalPremiumValues.length - 1]) : null",
          "score": 60,
          "evidence": {
            "engineExpression": "totalPremiumValues.length ? formatUdi(totalPremiumValues[totalPremiumValues.length - 1]) : null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.premium",
          "enginePath": "premium",
          "engineExpression": "totalPremiumValues.length ? formatUdi(totalPremiumValues[totalPremiumValues.length - 1]) : null",
          "score": 55,
          "evidence": {
            "engineExpression": "totalPremiumValues.length ? formatUdi(totalPremiumValues[totalPremiumValues.length - 1]) : null",
            "repoFileCount": 15,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.premiumTable",
          "enginePath": "premiumTable",
          "engineExpression": "{ monthly: basicPremiumValues[0] ?? totalTablePremiumValues[0] ?? null, quarterly: basicPremiumValues[1] ?? totalTablePremiumValues[1] ?? null, semiannual: basicPremiumValues[2] ?? totalTablePremiumValues[2] ?? null, annual: basicPremiumValues[3] ?? totalTablePremiumValues[3] ?? totalPremiumValues[totalPremiumValues.length - 1] ?? null, plannedMonthly: plannedPremiumValues[0] ?? null, plannedQuarterly: plannedPremiumValues[1] ?? null, plannedSemiannual: plannedPremiumValues[2] ?? null, plannedAnnual: plannedPremiumValues[3] ?? null }",
          "score": 35,
          "evidence": {
            "engineExpression": "{ monthly: basicPremiumValues[0] ?? totalTablePremiumValues[0] ?? null, quarterly: basicPremiumValues[1] ?? totalTablePremiumValues[1] ?? null, semiannual: basicPremiumValues[2] ?? totalTablePremiumValues[2] ?? null, annual: basicPremiumValues[3] ?? totalTablePremiumValues[3] ?? totalPremiumValues[totalPremiumValues.length - 1] ?? null, plannedMonthly: plannedPremiumValues[0] ?? null, plannedQuarterly: plannedPremiumValues[1] ?? null, plannedSemiannual: plannedPremiumValues[2] ?? null, plannedAnnual: plannedPremiumValues[3] ?? null }",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.premiumTable.monthly",
          "enginePath": "premiumTable.monthly",
          "engineExpression": "basicPremiumValues[0] ?? totalTablePremiumValues[0] ?? null",
          "score": 35,
          "evidence": {
            "engineExpression": "basicPremiumValues[0] ?? totalTablePremiumValues[0] ?? null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.premiumTable.plannedAnnual",
          "enginePath": "premiumTable.plannedAnnual",
          "engineExpression": "plannedPremiumValues[3] ?? null",
          "score": 35,
          "evidence": {
            "engineExpression": "plannedPremiumValues[3] ?? null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        },
        {
          "sourceExpression": "nativeResult.premiumTable.plannedMonthly",
          "enginePath": "premiumTable.plannedMonthly",
          "engineExpression": "plannedPremiumValues[0] ?? null",
          "score": 35,
          "evidence": {
            "engineExpression": "plannedPremiumValues[0] ?? null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": []
          }
        }
      ],
      "recommendedOwnershipClass": "AMBIGUOUS_ENGINE_CANDIDATES",
      "recommendedSourceExpression": null,
      "decisionStatus": "ARCHITECTURE_APPROVAL_REQUIRED",
      "decisionReason": "multiple plausible engine sources remain"
    },
    "plannedOrAvePremium": {
      "previousAuthorizationStatus": "UNRESOLVED_NO_EXPLICIT_SOURCE_CONTRACT",
      "contractPresenceRequired": true,
      "modalEditableEvidence": false,
      "contextMentions": [],
      "derivedMentions": [
        {
          "owner": "engine",
          "hint": "fallback"
        },
        {
          "owner": "engine",
          "hint": "plannedAnnual"
        }
      ],
      "rankedSourceCandidates": [
        {
          "sourceExpression": "nativeResult.premiumTable.plannedAnnual",
          "enginePath": "premiumTable.plannedAnnual",
          "engineExpression": "plannedPremiumValues[3] ?? null",
          "score": 70,
          "evidence": {
            "engineExpression": "plannedPremiumValues[3] ?? null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": [
              {
                "owner": "engine",
                "hint": "fallback"
              },
              {
                "owner": "engine",
                "hint": "plannedAnnual"
              }
            ]
          }
        },
        {
          "sourceExpression": "nativeResult.age",
          "enginePath": "age",
          "engineExpression": "birthMatch ? birthMatch[2] : null",
          "score": 35,
          "evidence": {
            "engineExpression": "birthMatch ? birthMatch[2] : null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": [
              {
                "owner": "engine",
                "hint": "fallback"
              },
              {
                "owner": "engine",
                "hint": "plannedAnnual"
              }
            ]
          }
        },
        {
          "sourceExpression": "nativeResult.plan",
          "enginePath": "plan",
          "engineExpression": "planText || 'IMAGINA SER'",
          "score": 35,
          "evidence": {
            "engineExpression": "planText || 'IMAGINA SER'",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": [
              {
                "owner": "engine",
                "hint": "fallback"
              },
              {
                "owner": "engine",
                "hint": "plannedAnnual"
              }
            ]
          }
        },
        {
          "sourceExpression": "nativeResult.premium",
          "enginePath": "premium",
          "engineExpression": "totalPremiumValues.length ? formatUdi(totalPremiumValues[totalPremiumValues.length - 1]) : null",
          "score": 35,
          "evidence": {
            "engineExpression": "totalPremiumValues.length ? formatUdi(totalPremiumValues[totalPremiumValues.length - 1]) : null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": [
              {
                "owner": "engine",
                "hint": "fallback"
              },
              {
                "owner": "engine",
                "hint": "plannedAnnual"
              }
            ]
          }
        },
        {
          "sourceExpression": "nativeResult.premiumTable",
          "enginePath": "premiumTable",
          "engineExpression": "{ monthly: basicPremiumValues[0] ?? totalTablePremiumValues[0] ?? null, quarterly: basicPremiumValues[1] ?? totalTablePremiumValues[1] ?? null, semiannual: basicPremiumValues[2] ?? totalTablePremiumValues[2] ?? null, annual: basicPremiumValues[3] ?? totalTablePremiumValues[3] ?? totalPremiumValues[totalPremiumValues.length - 1] ?? null, plannedMonthly: plannedPremiumValues[0] ?? null, plannedQuarterly: plannedPremiumValues[1] ?? null, plannedSemiannual: plannedPremiumValues[2] ?? null, plannedAnnual: plannedPremiumValues[3] ?? null }",
          "score": 35,
          "evidence": {
            "engineExpression": "{ monthly: basicPremiumValues[0] ?? totalTablePremiumValues[0] ?? null, quarterly: basicPremiumValues[1] ?? totalTablePremiumValues[1] ?? null, semiannual: basicPremiumValues[2] ?? totalTablePremiumValues[2] ?? null, annual: basicPremiumValues[3] ?? totalTablePremiumValues[3] ?? totalPremiumValues[totalPremiumValues.length - 1] ?? null, plannedMonthly: plannedPremiumValues[0] ?? null, plannedQuarterly: plannedPremiumValues[1] ?? null, plannedSemiannual: plannedPremiumValues[2] ?? null, plannedAnnual: plannedPremiumValues[3] ?? null }",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": [
              {
                "owner": "engine",
                "hint": "fallback"
              },
              {
                "owner": "engine",
                "hint": "plannedAnnual"
              }
            ]
          }
        }
      ],
      "recommendedOwnershipClass": "ENGINE_SEMANTIC_CANDIDATE",
      "recommendedSourceExpression": "nativeResult.premiumTable.plannedAnnual",
      "decisionStatus": "ARCHITECTURE_APPROVAL_REQUIRED",
      "decisionReason": "one evidence-backed engine candidate leads, but no explicit mapping exists"
    },
    "coveragePeriod": {
      "previousAuthorizationStatus": "UNRESOLVED_NO_EXPLICIT_SOURCE_CONTRACT",
      "contractPresenceRequired": true,
      "modalEditableEvidence": false,
      "contextMentions": [],
      "derivedMentions": [
        {
          "owner": "engine",
          "hint": "policyTerm"
        },
        {
          "owner": "engine",
          "hint": "paymentTerm"
        },
        {
          "owner": "engine",
          "hint": "guaranteePeriod"
        }
      ],
      "rankedSourceCandidates": [
        {
          "sourceExpression": "nativeResult.guaranteePeriod",
          "enginePath": "guaranteePeriod",
          "engineExpression": "(guaranteeLine.match(/garant[ií]a de\\s+([0-9]+\\s+a[nñ]os)/i) || [])[1] || null",
          "score": 60,
          "evidence": {
            "engineExpression": "(guaranteeLine.match(/garant[ií]a de\\s+([0-9]+\\s+a[nñ]os)/i) || [])[1] || null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": [
              {
                "owner": "engine",
                "hint": "policyTerm"
              },
              {
                "owner": "engine",
                "hint": "paymentTerm"
              },
              {
                "owner": "engine",
                "hint": "guaranteePeriod"
              }
            ]
          }
        },
        {
          "sourceExpression": "nativeResult.paymentTerm",
          "enginePath": "paymentTerm",
          "engineExpression": "paymentTermMatch ? `${paymentTermMatch[1]} años` : null",
          "score": 60,
          "evidence": {
            "engineExpression": "paymentTermMatch ? `${paymentTermMatch[1]} años` : null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": [
              {
                "owner": "engine",
                "hint": "policyTerm"
              },
              {
                "owner": "engine",
                "hint": "paymentTerm"
              },
              {
                "owner": "engine",
                "hint": "guaranteePeriod"
              }
            ]
          }
        },
        {
          "sourceExpression": "nativeResult.policyTerm",
          "enginePath": "policyTerm",
          "engineExpression": "productMatch ? cleanValue(productMatch[2]) : null",
          "score": 60,
          "evidence": {
            "engineExpression": "productMatch ? cleanValue(productMatch[2]) : null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": [
              {
                "owner": "engine",
                "hint": "policyTerm"
              },
              {
                "owner": "engine",
                "hint": "paymentTerm"
              },
              {
                "owner": "engine",
                "hint": "guaranteePeriod"
              }
            ]
          }
        },
        {
          "sourceExpression": "nativeResult.age",
          "enginePath": "age",
          "engineExpression": "birthMatch ? birthMatch[2] : null",
          "score": 35,
          "evidence": {
            "engineExpression": "birthMatch ? birthMatch[2] : null",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": [
              {
                "owner": "engine",
                "hint": "policyTerm"
              },
              {
                "owner": "engine",
                "hint": "paymentTerm"
              },
              {
                "owner": "engine",
                "hint": "guaranteePeriod"
              }
            ]
          }
        },
        {
          "sourceExpression": "nativeResult.optionalCoverages",
          "enginePath": "optionalCoverages",
          "engineExpression": "additionalCoverages",
          "score": 35,
          "evidence": {
            "engineExpression": "additionalCoverages",
            "repoFileCount": 0,
            "contextMentions": [],
            "derivedMentions": [
              {
                "owner": "engine",
                "hint": "policyTerm"
              },
              {
                "owner": "engine",
                "hint": "paymentTerm"
              },
              {
                "owner": "engine",
                "hint": "guaranteePeriod"
              }
            ]
          }
        }
      ],
      "recommendedOwnershipClass": "PRODUCT_DEPENDENT_DERIVED_RULE",
      "recommendedSourceExpression": null,
      "decisionStatus": "ARCHITECTURE_APPROVAL_REQUIRED",
      "decisionReason": "field requires a documented product-aware selection or fallback rule"
    }
  },
  "constitutionalFlags": {
    "NEW_ENGINE_CREATED": false,
    "NEW_CACHE_CREATED": false,
    "DUPLICATE_BRIDGE_CREATED": false,
    "SCHEMA_CHANGED": false,
    "SOURCE_UI_CHANGED": false,
    "SOURCE_CODE_WRITTEN": false,
    "REAL_ENGINE_EXECUTION": false,
    "PARSER_EXECUTED": false,
    "CONTROLLED_BROWSER_EXECUTION": false,
    "PDF_READ_EXECUTED": false,
    "BACKEND_CONNECTION": false,
    "QUOTE_TRUTH_ALLOWED": false,
    "STATIC_SOURCE_INSPECTION_EXECUTED": true,
    "TARGETED_REPO_EVIDENCE_INSPECTION_EXECUTED": true,
    "TEST_EXECUTION": true
  }
}
```
