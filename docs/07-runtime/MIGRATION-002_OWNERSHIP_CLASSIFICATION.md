# MIGRATION-002 Ownership Classification

Status: DISCOVERY COMPLETE

## Scope

Generated from remaining top-level `.js` assets after MIGRATION-001. Archived `comisiones.js.bk`, docs, scripts, tests folders, and already migrated folders are outside this root-runtime count.

No files were moved. No imports were rewritten. No runtime files were modified.

## Root Inventory

Remaining root runtime assets: 655

## Ownership Distribution

| Ownership | File Count | Avg Confidence | Coupling Estimate | Movement Readiness |
|---|---:|---:|---|---|
| Platform | 62 | 0.82 | MEDIUM | READY_WITH_IMPORT_REWRITE |
| Shared | 61 | 0.74 | MEDIUM | READY_WITH_IMPORT_REWRITE |
| Advisor OS | 135 | 0.89 | MEDIUM | READY_WITH_IMPORT_REWRITE |
| Manager OS | 38 | 0.88 | MEDIUM | READY_WITH_IMPORT_REWRITE |
| Product Intelligence | 78 | 0.86 | MEDIUM | READY_WITH_IMPORT_REWRITE |
| Policy Operations | 133 | 0.86 | LOW | READY_WITH_IMPORT_REWRITE |
| Compensation | 16 | 0.87 | MEDIUM | NEEDS_DISCOVERY |
| Rule Packs | 46 | 0.90 | MEDIUM | READY_WITH_IMPORT_REWRITE |
| Legacy | 9 | 0.99 | HIGH | BLOCKED |
| Unknown | 77 | 0.35 | MEDIUM | NEEDS_DISCOVERY |

## Classification Rules

This discovery uses filename-level ownership evidence and known legacy boundary findings. Weak matches remain `Unknown` by design.

Priority of ownership classification:

1. Legacy shell and known route surfaces
2. Rule pack naming
3. Compensation/economic naming
4. Policy operations naming
5. Product intelligence naming
6. Manager/recruitment naming
7. Advisor/client/sales naming
8. Platform/runtime infrastructure naming
9. Shared utility/evidence/decision naming
10. Unknown

## Unknown Ownership Review Queue

Top 25 unknowns requiring review:

| # | File | Likely Domain | Confidence | Review Priority |
|---:|---|---|---:|---|
| 1 | `ai-orb-widget.js` | Unknown | 0.35 | MEDIUM |
| 2 | `daily-points-engine.js` | Unknown | 0.35 | MEDIUM |
| 3 | `future-currency-value-engine.js` | Unknown | 0.35 | MEDIUM |
| 4 | `in-app-notification-engine.js` | Platform or Shared | 0.35 | HIGH |
| 5 | `lead-temperature-engine.js` | Advisor OS | 0.35 | HIGH |
| 6 | `life-event-engine.js` | Unknown | 0.35 | MEDIUM |
| 7 | `life-event-master-test.js` | Unknown | 0.35 | MEDIUM |
| 8 | `line-of-business-engine.js` | Product Intelligence or Rule Packs | 0.35 | HIGH |
| 9 | `live-dashboard-engine.js` | Unknown | 0.35 | MEDIUM |
| 10 | `live-notification-engine.js` | Platform or Shared | 0.35 | HIGH |
| 11 | `market-data-master-test.js` | Advisor OS | 0.35 | HIGH |
| 12 | `maternity-intelligence-engine.js` | Product Intelligence or Rule Packs | 0.35 | HIGH |
| 13 | `maternity-smoke-test.js` | Product Intelligence or Rule Packs | 0.35 | HIGH |
| 14 | `momentum-engine.js` | Advisor OS | 0.35 | HIGH |
| 15 | `monthly-revenue-engine.js` | Advisor OS | 0.35 | HIGH |
| 16 | `multi-label-event-engine.js` | Unknown | 0.35 | MEDIUM |
| 17 | `multi-label-event-smoke-test.js` | Unknown | 0.35 | MEDIUM |
| 18 | `mutation-engine.js` | Unknown | 0.35 | MEDIUM |
| 19 | `notification-orchestrator.js` | Platform or Shared | 0.35 | HIGH |
| 20 | `notification-queue-engine.js` | Platform or Shared | 0.35 | HIGH |
| 21 | `offline-sync.js` | Platform or Shared | 0.35 | HIGH |
| 22 | `orvi-event-engine.js` | Unknown | 0.35 | MEDIUM |
| 23 | `orvi-master-test.js` | Unknown | 0.35 | MEDIUM |
| 24 | `orvi-mxn-master-test.js` | Unknown | 0.35 | MEDIUM |
| 25 | `orvi-wait-vs-cancel-engine.js` | Unknown | 0.35 | MEDIUM |

## Full Root Classification Appendix

| File | Ownership | Confidence | Local Imports | Root Consumers | Evidence |
|---|---|---:|---:|---:|---|
| `accessibility-engine.js` | Platform | 0.82 | 0 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `accident-intelligence-engine.js` | Product Intelligence | 0.86 | 0 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `accident-smoke-test.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `action-resolver-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `actividad.js` | Legacy | 0.99 | 5 | 1 | known shell or legacy route surface |
| `activity-feed-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `activity-feed.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `activity-stream-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `adaptive-message-builder.js` | Advisor OS | 0.89 | 2 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `adaptive-outreach-prompt-builder.js` | Advisor OS | 0.89 | 3 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `adaptive-question-engine.js` | Shared | 0.74 | 2 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `adaptive-script-builder.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `advisor-activity-timeline.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `advisor-alert-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `advisor-monitor-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `advisor-performance-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `advisor-sales-dna.entity.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `advisor-score-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `advisor-style-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `ai-context-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `ai-first-contact-message-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `ai-orb-widget.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `ai-prompt-builder.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `ai-sales-coach-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `ai-service.js` | Platform | 0.82 | 1 | 3 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `ai-task-suggestion-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `analytics-engine.js` | Shared | 0.74 | 0 | 4 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `app-shell-manager.js` | Manager OS | 0.88 | 0 | 1 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `app.js` | Legacy | 0.99 | 20 | 0 | known shell or legacy route surface |
| `appointment-calendar-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `appointment-followup-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `appointment-opportunity-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `assistant-memory-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `auth-guard.js` | Platform | 0.82 | 1 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `auto-task-generator-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `base-repository.js` | Platform | 0.82 | 1 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `buying-signals-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `cache-runtime.js` | Platform | 0.82 | 0 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `candidate-assessment-engine.js` | Manager OS | 0.88 | 4 | 1 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `candidate-assessment-master-test.js` | Manager OS | 0.88 | 1 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `candidate-coachability-engine.js` | Manager OS | 0.88 | 0 | 2 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `candidate-coachability-master-test.js` | Manager OS | 0.88 | 1 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `candidate-hard-factors-engine.js` | Manager OS | 0.88 | 0 | 2 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `candidate-hard-factors-master-test.js` | Manager OS | 0.88 | 1 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `candidate-market-quality-engine.js` | Manager OS | 0.88 | 0 | 2 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `candidate-market-quality-master-test.js` | Manager OS | 0.88 | 1 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `candidate-vital-factors-engine.js` | Manager OS | 0.88 | 0 | 2 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `candidate-vital-factors-master-test.js` | Manager OS | 0.88 | 1 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `cartera-events.js` | Policy Operations | 0.86 | 0 | 1 | policy, operational event, task, calendar, import, or document naming |
| `cartera-import-engine.js` | Policy Operations | 0.86 | 1 | 0 | policy, operational event, task, calendar, import, or document naming |
| `cartera-normalizer.js` | Policy Operations | 0.86 | 1 | 1 | policy, operational event, task, calendar, import, or document naming |
| `cartera-repository.js` | Policy Operations | 0.86 | 2 | 0 | policy, operational event, task, calendar, import, or document naming |
| `cartera-service.js` | Policy Operations | 0.86 | 5 | 1 | policy, operational event, task, calendar, import, or document naming |
| `cartera-state.js` | Policy Operations | 0.86 | 0 | 1 | policy, operational event, task, calendar, import, or document naming |
| `cartera-utils.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `cartera-validator.js` | Policy Operations | 0.86 | 0 | 1 | policy, operational event, task, calendar, import, or document naming |
| `cartera-view.js` | Policy Operations | 0.86 | 1 | 0 | policy, operational event, task, calendar, import, or document naming |
| `cartera.js` | Legacy | 0.99 | 8 | 1 | known shell or legacy route surface |
| `catastrophic-illness-engine.js` | Product Intelligence | 0.86 | 0 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `catastrophic-illness-smoke-test.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `center-of-influence-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `channel-adaptation-engine.js` | Advisor OS | 0.89 | 0 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `channel-performance-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `client-engagement-engine.js` | Advisor OS | 0.89 | 0 | 3 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `client-engagement-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `clipboard-action-engine.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `close-prompt-builder.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `close-readiness-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `close-strategy-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `comisiones-rules-gmm.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `comisiones-utils.js` | Compensation | 0.87 | 0 | 0 | economic, commission, production, projection, or currency naming |
| `comisiones.js` | Legacy | 0.99 | 5 | 1 | known shell or legacy route surface |
| `command-execution-engine.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `command-palette-engine.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `command-palette-ui.js` | Platform | 0.82 | 0 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `command-palette.js` | Platform | 0.82 | 1 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `command-palette.store.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `command-parser-engine.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `command-registry.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `command-search-engine.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `command-shortcuts-engine.js` | Platform | 0.82 | 1 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `command-suggestion-engine.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `commission-projection-engine.js` | Compensation | 0.87 | 0 | 0 | economic, commission, production, projection, or currency naming |
| `commissionable-amount-engine.js` | Compensation | 0.87 | 0 | 0 | economic, commission, production, projection, or currency naming |
| `communication-channel-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `communication-mismatch-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `communication-style-engine.js` | Advisor OS | 0.89 | 0 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `concursos.js` | Legacy | 0.99 | 1 | 0 | known shell or legacy route surface |
| `contact-attempt-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `contact-response-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `contextual-suggestion-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `conversion-metrics-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `copilot-suggestion-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `core-app-engine.js` | Platform | 0.82 | 10 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `core-event-bus.js` | Platform | 0.82 | 0 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `core_domain-events.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `core_event-bus.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `coverage-evaluation-foundation-engine.js` | Product Intelligence | 0.86 | 0 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `coverage-foundation-smoke-test.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `coverage-intelligence-orchestrator.js` | Product Intelligence | 0.86 | 10 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `coverage-orchestrator-smoke-test.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `crash-runtime.js` | Platform | 0.82 | 1 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `csv-parser-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `currency-normalization-engine.js` | Shared | 0.74 | 0 | 1 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `daily-points-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `dashboard-executive.js` | Legacy | 0.99 | 1 | 0 | known shell or legacy route surface |
| `dashboard-priority-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `dashboard.js` | Legacy | 0.99 | 6 | 1 | known shell or legacy route surface |
| `db.js` | Platform | 0.82 | 1 | 11 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `decision-appendix-master-test.js` | Shared | 0.74 | 7 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `discovery-insights-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `discovery-priority-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `discovery-product-alignment-engine.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `discovery-summary-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `discovery-to-presentation-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `dna-coaching-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `dna-script-strategy-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `document-classification-engine.js` | Policy Operations | 0.86 | 0 | 1 | policy, operational event, task, calendar, import, or document naming |
| `dom-sanitizer.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `domain-events.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `domain-runtime.js` | Platform | 0.82 | 2 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `domain-store.js` | Platform | 0.82 | 0 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `drag-drop-policy-zone.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `dynamic-cash-value-projection-engine.js` | Compensation | 0.87 | 2 | 1 | economic, commission, production, projection, or currency naming |
| `education-cost-master-test.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `education-paths-master-test.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `entity-resolver-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `error-boundary.js` | Platform | 0.82 | 1 | 2 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `event-advisor-review-engine.js` | Advisor OS | 0.89 | 1 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `event-advisor-review-smoke-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `event-benefit-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `event-bus-engine.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `event-classification-engine.js` | Shared | 0.74 | 0 | 3 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `event-classification-smoke-test.js` | Shared | 0.74 | 1 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `event-client-review-engine.js` | Advisor OS | 0.89 | 1 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `event-client-review-smoke-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `event-log-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `event-system.js` | Policy Operations | 0.86 | 0 | 9 | policy, operational event, task, calendar, import, or document naming |
| `evidence-collection-engine.js` | Shared | 0.74 | 1 | 2 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `evidence-collection-smoke-test.js` | Shared | 0.74 | 1 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `excel-parser-engine.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `exchange-rate-cache-engine.js` | Product Intelligence | 0.86 | 1 | 10 | product, coverage, financial product, or health/insurance knowledge naming |
| `false-confidence-protection-engine.js` | Shared | 0.74 | 0 | 1 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `false-confidence-smoke-test.js` | Shared | 0.74 | 1 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `feature-flags.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `field-confidence-engine.js` | Shared | 0.74 | 0 | 1 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `financial-pyramid-engine.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `financial-pyramid-priority-engine.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `financial-pyramid-story-engine.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `financial-responsibility-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `financial-responsibility-smoke-test.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `financial-risk-score-engine.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `financial-story-task-builder.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `financial-utils.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `first-contact-ai-suggestion-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `first-contact-dashboard.viewmodel.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `first-contact-delivery-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `first-contact-options-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `first-contact-script-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `first-contact-tone-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `first-contact.entity.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `fixture-validation-test.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `followup-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `followup-message-context-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `followup-next-date-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `followup-overdue-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `followup-priority-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `followup-recommendation-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `followup-reminder-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `followup.entity.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `forge-ai-connector-master-test.js` | Platform | 0.82 | 3 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `forge-ai-connector.js` | Platform | 0.82 | 2 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `forge-ai-guardrails-engine.js` | Platform | 0.82 | 0 | 3 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `forge-ai-prompt-builder.js` | Platform | 0.82 | 1 | 2 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `forge-build-tree-status.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `forge-global-master-test.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `forge-gmm-real-case-smoke-test.js` | Product Intelligence | 0.86 | 3 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `forge-gmm-sprint-2-smoke-test.js` | Product Intelligence | 0.86 | 3 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `forge-gmm-sprint-3-smoke-test.js` | Product Intelligence | 0.86 | 4 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `forge-gmm-sprint-4-smoke-test.js` | Product Intelligence | 0.86 | 5 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `forge-imagina-ser-client-presentation-test.js` | Product Intelligence | 0.86 | 10 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `forge-master-acceptance-test.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `forge-presentation-engine.js` | Platform | 0.82 | 0 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `forge-schema-reporter.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `forge-semantic-risk-report.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `forge-shared-ave-master-test.js` | Platform | 0.82 | 7 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `forge-vida-mujer-advisor-report.js` | Advisor OS | 0.89 | 2 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `future-currency-value-engine.js` | Unknown | 0.35 | 0 | 1 | insufficient ownership evidence from filename-level discovery |
| `ghosting-prompt-builder.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `ghosting-status-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `gmm-advisor-review-engine.js` | Product Intelligence | 0.86 | 0 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `gmm-client-review-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `gmm-out-of-pocket-engine.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `gmm-policy-caratula-summary-engine.js` | Policy Operations | 0.86 | 0 | 4 | policy, operational event, task, calendar, import, or document naming |
| `gmm-quote-parser.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `gmm-quote-summary-engine.js` | Product Intelligence | 0.86 | 0 | 4 | product, coverage, financial product, or health/insurance knowledge naming |
| `google-calendar-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `health-runtime.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `hospitalization-intelligence-engine.js` | Product Intelligence | 0.86 | 0 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `hospitalization-smoke-test.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `hot-market-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `human-review-routing-engine.js` | Shared | 0.74 | 0 | 2 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `human-review-routing-smoke-test.js` | Shared | 0.74 | 1 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `idle-runtime.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `imagina-ser-advisor-analysis-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-article-151-engine.js` | Rule Packs | 0.90 | 0 | 2 | rule or rule-pack naming |
| `imagina-ser-article-185-engine.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `imagina-ser-banxico-integration-test.js` | Compensation | 0.87 | 5 | 0 | economic, commission, production, projection, or currency naming |
| `imagina-ser-client-presentation-engine.js` | Product Intelligence | 0.86 | 1 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-contribution-engine.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-decision-engine.js` | Product Intelligence | 0.86 | 0 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-fiscal-bag-engine.js` | Product Intelligence | 0.86 | 0 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-fiscal-master-test.js` | Product Intelligence | 0.86 | 4 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-fiscal-router-engine.js` | Product Intelligence | 0.86 | 3 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-fiscal-slide-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-future-mxn-bridge.js` | Product Intelligence | 0.86 | 1 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-happy-numbers-engine.js` | Compensation | 0.87 | 0 | 2 | economic, commission, production, projection, or currency naming |
| `imagina-ser-human-language-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-master-test.js` | Product Intelligence | 0.86 | 9 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-objection-engine.js` | Product Intelligence | 0.86 | 0 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-ocr-extractor.js` | Policy Operations | 0.86 | 1 | 4 | policy, operational event, task, calendar, import, or document naming |
| `imagina-ser-presentation-prompt-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-real-quote-validation.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-retirement-fund-engine.js` | Product Intelligence | 0.86 | 0 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-scenario-engine.js` | Product Intelligence | 0.86 | 0 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-variant-engine.js` | Product Intelligence | 0.86 | 0 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `imagina-ser-variant-fiscal-master-test.js` | Product Intelligence | 0.86 | 3 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `import-progress-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `in-app-notification-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `interview-evidence-fixture-test.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `introduction-message-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `lead-temperature-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `life-event-engine.js` | Unknown | 0.35 | 3 | 3 | insufficient ownership evidence from filename-level discovery |
| `life-event-master-test.js` | Unknown | 0.35 | 1 | 0 | insufficient ownership evidence from filename-level discovery |
| `life-expectancy-projection-engine.js` | Compensation | 0.87 | 0 | 0 | economic, commission, production, projection, or currency naming |
| `line-of-business-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `live-communication-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `live-dashboard-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `live-notification-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `live-operational-state-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `logger.js` | Platform | 0.82 | 0 | 4 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `manager-alert-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `manager-broadcast-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `manager-coaching-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `manager-feed-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `manager-notification-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `manager-role-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `market-data-master-test.js` | Unknown | 0.35 | 2 | 0 | insufficient ownership evidence from filename-level discovery |
| `market-evidence-fixture-test.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `mass-import-mapping-engine.js` | Policy Operations | 0.86 | 1 | 0 | policy, operational event, task, calendar, import, or document naming |
| `mass-import-preview-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `mass-import-validation-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `maternity-intelligence-engine.js` | Unknown | 0.35 | 0 | 2 | insufficient ownership evidence from filename-level discovery |
| `maternity-smoke-test.js` | Unknown | 0.35 | 1 | 0 | insufficient ownership evidence from filename-level discovery |
| `memory-manager.js` | Manager OS | 0.88 | 0 | 5 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `module-lifecycle.js` | Platform | 0.82 | 1 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `momentum-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `monthly-revenue-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `multi-label-event-engine.js` | Unknown | 0.35 | 0 | 1 | insufficient ownership evidence from filename-level discovery |
| `multi-label-event-smoke-test.js` | Unknown | 0.35 | 1 | 0 | insufficient ownership evidence from filename-level discovery |
| `mutation-engine.js` | Unknown | 0.35 | 2 | 0 | insufficient ownership evidence from filename-level discovery |
| `nano-banana-icon-system-prompt.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `nash-advisor-performance-engine.js` | Advisor OS | 0.89 | 1 | 3 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-advisor-performance-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-coaching-insight-engine.js` | Manager OS | 0.88 | 0 | 3 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `nash-coaching-insight-master-test.js` | Manager OS | 0.88 | 1 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `nash-combat-intelligence-report-engine.js` | Advisor OS | 0.89 | 3 | 2 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-combat-intelligence-report-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-combat-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-combat-orchestrator.js` | Advisor OS | 0.89 | 0 | 3 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-core-engine.js` | Advisor OS | 0.89 | 7 | 4 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-council-orchestrator.js` | Advisor OS | 0.89 | 0 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-followup-engine.js` | Policy Operations | 0.86 | 0 | 1 | policy, operational event, task, calendar, import, or document naming |
| `nash-integration-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-intent-engine.js` | Advisor OS | 0.89 | 0 | 5 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-intent-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-learning-engine.js` | Advisor OS | 0.89 | 0 | 4 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-learning-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-manager-alert-engine.js` | Manager OS | 0.88 | 0 | 3 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `nash-manager-alert-master-test.js` | Manager OS | 0.88 | 1 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `nash-master-acceptance-test.js` | Advisor OS | 0.89 | 12 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-master-intelligence-engine.js` | Advisor OS | 0.89 | 10 | 2 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-master-intelligence-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-memory-engine.js` | Advisor OS | 0.89 | 0 | 4 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-memory-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-message-recommendation-engine.js` | Advisor OS | 0.89 | 0 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-next-best-action-engine.js` | Advisor OS | 0.89 | 0 | 4 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-next-best-action-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-personality-engine.js` | Advisor OS | 0.89 | 0 | 4 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-personality-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-prospect-context-builder.js` | Advisor OS | 0.89 | 0 | 3 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-team-intelligence-engine.js` | Manager OS | 0.88 | 0 | 3 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `nash-team-intelligence-master-test.js` | Manager OS | 0.88 | 1 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `nash-v03-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `nash-v04-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `needs-discovery-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `network-manager.js` | Manager OS | 0.88 | 2 | 2 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `next-best-question-engine.js` | Shared | 0.74 | 0 | 3 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `next-best-question-smoke-test.js` | Shared | 0.74 | 1 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `notification-orchestrator.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `notification-priority-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `notification-queue-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `objection-battle-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `objection-classifier-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `objection-intent-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `objection-memory-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `objection-prompt-builder.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `objection-resolution-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `objection-response-strategy-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `ocr-result-cache.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `offline-sync.js` | Unknown | 0.35 | 2 | 2 | insufficient ownership evidence from filename-level discovery |
| `operational-dashboard-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `operational-feed-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `operational-sync-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `opportunity-detector-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `optimistic-mutation-runtime.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `optional-coverage-intelligence-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `optional-coverage-smoke-test.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `organization-rules-fixture-validation-test.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `orvi-client-presentation-engine.js` | Advisor OS | 0.89 | 0 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `orvi-client-report-test.js` | Advisor OS | 0.89 | 7 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `orvi-decision-engine.js` | Shared | 0.74 | 0 | 1 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `orvi-event-engine.js` | Unknown | 0.35 | 0 | 1 | insufficient ownership evidence from filename-level discovery |
| `orvi-guaranteed-value-timeline-engine.js` | Policy Operations | 0.86 | 0 | 3 | policy, operational event, task, calendar, import, or document naming |
| `orvi-master-test.js` | Unknown | 0.35 | 6 | 0 | insufficient ownership evidence from filename-level discovery |
| `orvi-mxn-conversion-engine.js` | Advisor OS | 0.89 | 1 | 2 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `orvi-mxn-master-test.js` | Unknown | 0.35 | 5 | 0 | insufficient ownership evidence from filename-level discovery |
| `orvi-objection-engine.js` | Advisor OS | 0.89 | 0 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `orvi-ocr-extractor.js` | Policy Operations | 0.86 | 0 | 3 | policy, operational event, task, calendar, import, or document naming |
| `orvi-wait-vs-cancel-engine.js` | Unknown | 0.35 | 0 | 3 | insufficient ownership evidence from filename-level discovery |
| `outreach-prompt-builder.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `ovelay-manager.js` | Manager OS | 0.88 | 0 | 1 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `overdue-task-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `overlay-manager.js` | Manager OS | 0.88 | 0 | 1 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `payment-frequency-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `payment-mode-coaching-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `performance-monitor.js` | Unknown | 0.35 | 1 | 1 | insufficient ownership evidence from filename-level discovery |
| `performance-runtime.js` | Platform | 0.82 | 1 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `phone-call-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `pipeline-stage-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `policy-activity-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-ai-insights-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-ai-parser.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-auto-approval-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-auto-save-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-batch-processing-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-client-summary-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-context-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-core-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-detail-alert-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-detail-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-detail-view-model.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-document-classifier.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-document-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-duplicate-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-field-confidence-map.js` | Policy Operations | 0.86 | 1 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-filter-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-financial-summary-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-followup-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-human-review-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-import-dashboard-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-import-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-import-errors-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-import-metrics-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-import-queue.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-import-summary.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-indexing-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-ingestion-orchestrator.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-last-contact-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-live-state-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-metadata-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-normalization-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-ocr-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-operational-center-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-quick-actions-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-relationship-score-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-renewal-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-renewal-status-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-review-priority-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-review-ui-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-risk-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-schema-validator-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-search-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-side-by-side-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-smart-sort-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-staging-cache.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-staging-status-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-status-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-storage-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-summary-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-task-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-task-priority-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-timeline-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-timeline-event.factory.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-timeline-group-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-timeline-query-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-timeline-view-model.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-timeline.repository.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-timeline.types.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-validation-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `policy-workspace-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `precontract-activity-fixture-test.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `presentation-input-context-builder.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `presentation-input-pipeline.js` | Advisor OS | 0.89 | 5 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `primary-risk-engine.js` | Compensation | 0.87 | 0 | 0 | economic, commission, production, projection, or currency naming |
| `product-detection-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `product-knowledge-link-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `product-schema-engine.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `projection-engine.js` | Compensation | 0.87 | 0 | 1 | economic, commission, production, projection, or currency naming |
| `projection-milestone-engine.js` | Compensation | 0.87 | 0 | 1 | economic, commission, production, projection, or currency naming |
| `proposal-family-engine.js` | Unknown | 0.35 | 0 | 1 | insufficient ownership evidence from filename-level discovery |
| `proposal-family-smoke-test.js` | Unknown | 0.35 | 1 | 0 | insufficient ownership evidence from filename-level discovery |
| `prospeccion.js` | Legacy | 0.99 | 3 | 1 | known shell or legacy route surface |
| `prospect-next-action-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `prospect-personality-engine.js` | Advisor OS | 0.89 | 0 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `prospect-pipeline-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `prospect-profile-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `prospect-score-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `prospect-segment-performance-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `prospect.entity.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `prospecting-dashboard.viewmodel.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `push-notification-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `query-cache.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `query-runtime.js` | Platform | 0.82 | 1 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `question-answer-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `question-session-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `question-style-match-engine.js` | Shared | 0.74 | 0 | 1 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `quick-action-executor-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `quick-actions-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `quotation-currency-bridge.js` | Unknown | 0.35 | 1 | 1 | insufficient ownership evidence from filename-level discovery |
| `quotation-extraction-result.entity.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `quotation-field-normalizer.js` | Policy Operations | 0.86 | 0 | 1 | policy, operational event, task, calendar, import, or document naming |
| `quotation-input.entity.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `quote-to-policy-comparison-engine.js` | Policy Operations | 0.86 | 0 | 3 | policy, operational event, task, calendar, import, or document naming |
| `ranking-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `reactivation-strategy-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `realtime-engine.js` | Unknown | 0.35 | 0 | 1 | insufficient ownership evidence from filename-level discovery |
| `realtime-task-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `recruitment-fixture-validation-test.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `referidos.js` | Legacy | 0.99 | 3 | 1 | known shell or legacy route surface |
| `referral-ai-followup.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `referral-card-ui.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `referral-color-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `referral-followup-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `referral-opportunity-engine.js` | Advisor OS | 0.89 | 0 | 3 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `referral-opportunity-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `referral-priority-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `referral-prompt-builder.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `referral-score-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `referral-smart-actions.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `referral-temperature-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `referral-timeline-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `referrals-board-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `referrals-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `relationship-health-engine.js` | Product Intelligence | 0.86 | 0 | 3 | product, coverage, financial product, or health/insurance knowledge naming |
| `relationship-health-master-test.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `relationship-master-acceptance-test.js` | Advisor OS | 0.89 | 9 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `relationship-master-engine.js` | Advisor OS | 0.89 | 8 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `relationship-memory-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `relationship-next-action-engine.js` | Advisor OS | 0.89 | 0 | 4 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `relationship-next-action-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `relationship-opportunity-engine.js` | Advisor OS | 0.89 | 1 | 4 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `relationship-opportunity-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `relationship-review-engine.js` | Advisor OS | 0.89 | 0 | 3 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `relationship-review-master-test.js` | Advisor OS | 0.89 | 1 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `relationship-timeline-engine.js` | Policy Operations | 0.86 | 0 | 4 | policy, operational event, task, calendar, import, or document naming |
| `relationship-timeline-master-test.js` | Policy Operations | 0.86 | 1 | 0 | policy, operational event, task, calendar, import, or document naming |
| `render-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `renewal-intelligence-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `responsive-engine.js` | Unknown | 0.35 | 1 | 1 | insufficient ownership evidence from filename-level discovery |
| `retirement-future-udi-projection-engine.js` | Compensation | 0.87 | 0 | 2 | economic, commission, production, projection, or currency naming |
| `retirement-future-udi-projection-smoke-test.js` | Compensation | 0.87 | 2 | 0 | economic, commission, production, projection, or currency naming |
| `retirement-presentation-scenario-engine.js` | Product Intelligence | 0.86 | 1 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `retry-runtime.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `revenue-forecast-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `revenue-optimization-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `risk-story-context-engine.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `route-transition-manager.js` | Manager OS | 0.88 | 1 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `runtime.js` | Platform | 0.82 | 0 | 2 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `sales-coach-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `sales-context-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `sales-dna-evolution-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `sales-dna-insight-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `sales-dna-learning-event.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `sales-dna-match-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `sales-dna-profile-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `sales-dna-recommendation-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `sales-dna-stage-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `sales-learning-event.entity.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `schema-field-engine.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `script-adaptation-engine.js` | Advisor OS | 0.89 | 0 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `search-index-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `search-quick-actions-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `search-ranking-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `secure-storage.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `seen-but-no-reply-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `segu-beca-client-presentation-engine.js` | Advisor OS | 0.89 | 0 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `segu-beca-decision-engine.js` | Shared | 0.74 | 0 | 1 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `segu-beca-education-comparison-engine.js` | Unknown | 0.35 | 1 | 1 | insufficient ownership evidence from filename-level discovery |
| `segu-beca-education-options-engine.js` | Unknown | 0.35 | 1 | 1 | insufficient ownership evidence from filename-level discovery |
| `segu-beca-master-test.js` | Unknown | 0.35 | 4 | 0 | insufficient ownership evidence from filename-level discovery |
| `segu-beca-meaningful-numbers-report.js` | Unknown | 0.35 | 3 | 0 | insufficient ownership evidence from filename-level discovery |
| `segu-beca-mxn-appendix-report.js` | Shared | 0.74 | 3 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `segu-beca-mxn-timeline-clean-report.js` | Policy Operations | 0.86 | 4 | 0 | policy, operational event, task, calendar, import, or document naming |
| `segu-beca-ocr-intake-report.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `service-worker.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `shared-ave-confidence-engine.js` | Shared | 0.74 | 0 | 2 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-ave-confidence-report.js` | Shared | 0.74 | 2 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-ave-death-benefit-engine.js` | Product Intelligence | 0.86 | 1 | 3 | product, coverage, financial product, or health/insurance knowledge naming |
| `shared-ave-death-benefit-report.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `shared-ave-eligibility-engine.js` | Shared | 0.74 | 0 | 3 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-ave-growth-engine.js` | Shared | 0.74 | 0 | 5 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-ave-growth-report.js` | Shared | 0.74 | 1 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-ave-portfolio-engine.js` | Shared | 0.74 | 3 | 3 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-ave-portfolio-report.js` | Shared | 0.74 | 1 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-ave-rescue-engine.js` | Shared | 0.74 | 0 | 4 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-ave-rescue-report.js` | Shared | 0.74 | 1 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-ave-type-inference-engine.js` | Shared | 0.74 | 2 | 3 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-ave-type-inference-report.js` | Shared | 0.74 | 1 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-banxico-rate-engine.js` | Compensation | 0.87 | 0 | 2 | economic, commission, production, projection, or currency naming |
| `shared-banxico-rate-report.js` | Compensation | 0.87 | 1 | 0 | economic, commission, production, projection, or currency naming |
| `shared-benefit-hierarchy-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `shared-client-language-engine.js` | Advisor OS | 0.89 | 0 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `shared-clp-engine.js` | Shared | 0.74 | 0 | 1 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-clp-master-test.js` | Shared | 0.74 | 1 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-currency-projection-engine.js` | Compensation | 0.87 | 0 | 5 | economic, commission, production, projection, or currency naming |
| `shared-decision-appendix-engine.js` | Shared | 0.74 | 0 | 1 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-decision-clarity-engine.js` | Shared | 0.74 | 0 | 1 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-decision-score-engine.js` | Shared | 0.74 | 0 | 2 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-document-priority-engine.js` | Policy Operations | 0.86 | 0 | 1 | policy, operational event, task, calendar, import, or document naming |
| `shared-education-cost-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `shared-education-paths-engine.js` | Product Intelligence | 0.86 | 0 | 2 | product, coverage, financial product, or health/insurance knowledge naming |
| `shared-financial-return-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `shared-human-financial-language-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `shared-meaningful-numbers-engine.js` | Shared | 0.74 | 1 | 1 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-mxn-timeline-engine.js` | Policy Operations | 0.86 | 1 | 1 | policy, operational event, task, calendar, import, or document naming |
| `shared-objection-shield-engine.js` | Advisor OS | 0.89 | 0 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `shared-policy-currency-timeline-engine.js` | Policy Operations | 0.86 | 0 | 1 | policy, operational event, task, calendar, import, or document naming |
| `shared-policy-currency-timeline-smoke-test.js` | Policy Operations | 0.86 | 1 | 0 | policy, operational event, task, calendar, import, or document naming |
| `shared-premium-growth-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `shared-price-placement-engine.js` | Shared | 0.74 | 0 | 5 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-projection-scenarios-engine.js` | Compensation | 0.87 | 0 | 3 | economic, commission, production, projection, or currency naming |
| `shared-protection-efficiency-engine.js` | Shared | 0.74 | 0 | 1 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-recovery-analysis-engine.js` | Shared | 0.74 | 0 | 1 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `shared-tax-profile-engine.js` | Shared | 0.74 | 0 | 2 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `smart-agenda-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `smart-field-detection-engine.js` | Unknown | 0.35 | 0 | 1 | insufficient ownership evidence from filename-level discovery |
| `smart-followup-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `smart-followup-message-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `smart-notification-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `smart-outreach-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `smart-priority-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `smart-referrals-engine.js` | Advisor OS | 0.89 | 0 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `smnyl-ai-coach-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-ai-presence-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-alerts-engine.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-anomaly-engine.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-automation-engine.js` | Rule Packs | 0.90 | 3 | 1 | rule or rule-pack naming |
| `smnyl-bonos-engine.js` | Rule Packs | 0.90 | 1 | 1 | rule or rule-pack naming |
| `smnyl-cancelaciones-engine.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-comisiones-engine.js` | Rule Packs | 0.90 | 1 | 0 | rule or rule-pack naming |
| `smnyl-comisiones-gmm.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-comisiones-vida.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-command-center-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-command-palette-engine.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-concursos-engine.js` | Rule Packs | 0.90 | 4 | 1 | rule or rule-pack naming |
| `smnyl-conteo-engine.js` | Rule Packs | 0.90 | 1 | 0 | rule or rule-pack naming |
| `smnyl-cross-sell-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-decision-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-executive-dashboard-engine.js` | Rule Packs | 0.90 | 3 | 1 | rule or rule-pack naming |
| `smnyl-followup-engine.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-forecast-engine.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-goals-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-health-score-engine.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-insights-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-kpi-engine.js` | Rule Packs | 0.90 | 3 | 1 | rule or rule-pack naming |
| `smnyl-leaderboard-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-neural-glow-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-operating-system-engine.js` | Rule Packs | 0.90 | 4 | 1 | rule or rule-pack naming |
| `smnyl-opportunity-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-performance-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-persistencia-engine.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-pipeline-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-prima-engine.js` | Rule Packs | 0.90 | 2 | 3 | rule or rule-pack naming |
| `smnyl-produccion-engine.js` | Rule Packs | 0.90 | 1 | 1 | rule or rule-pack naming |
| `smnyl-productividad-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-productos-gmm.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-productos-vida.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-reminders-engine.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-renovaciones-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-retencion-engine.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-risk-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-streak-engine.js` | Rule Packs | 0.90 | 0 | 0 | rule or rule-pack naming |
| `smnyl-time-block-engine.js` | Rule Packs | 0.90 | 0 | 1 | rule or rule-pack naming |
| `smnyl-training-allowance-engine.js` | Rule Packs | 0.90 | 1 | 1 | rule or rule-pack naming |
| `solucionline-retirement-parser.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `source-ownership-registry-validation-test.js` | Platform | 0.82 | 1 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `source-ownership-registry.js` | Platform | 0.82 | 0 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `staging-cleanup-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `staging-review-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `state-manager.js` | Manager OS | 0.88 | 1 | 6 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `storage-engine.js` | Platform | 0.82 | 2 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `storage-queue.js` | Platform | 0.82 | 0 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `storage-validator.js` | Policy Operations | 0.86 | 0 | 1 | policy, operational event, task, calendar, import, or document naming |
| `store.js` | Platform | 0.82 | 0 | 1 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `supabase-runtime.js` | Platform | 0.82 | 0 | 2 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `surgery-intelligence-engine.js` | Unknown | 0.35 | 0 | 2 | insufficient ownership evidence from filename-level discovery |
| `surgery-smoke-test.js` | Unknown | 0.35 | 1 | 0 | insufficient ownership evidence from filename-level discovery |
| `sw-cache-config.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `sync-engine.js` | Unknown | 0.35 | 1 | 1 | insufficient ownership evidence from filename-level discovery |
| `sync-orchestrator.js` | Unknown | 0.35 | 4 | 2 | insufficient ownership evidence from filename-level discovery |
| `sync-queue-runtime.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `task-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `task-feed-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `task-priority-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `task-quick-action-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `team-activity-engine.js` | Policy Operations | 0.86 | 0 | 0 | policy, operational event, task, calendar, import, or document naming |
| `team-dashboard-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `team-momentum-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `team-structure-engine.js` | Manager OS | 0.88 | 0 | 0 | candidate, recruitment, team, manager, coaching, or behavior naming |
| `telemetry.js` | Platform | 0.82 | 0 | 4 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `territoriality-intelligence-engine.js` | Unknown | 0.35 | 0 | 2 | insufficient ownership evidence from filename-level discovery |
| `territoriality-smoke-test.js` | Unknown | 0.35 | 1 | 0 | insufficient ownership evidence from filename-level discovery |
| `tone-performance-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `tone-profile-engine.js` | Unknown | 0.35 | 0 | 1 | insufficient ownership evidence from filename-level discovery |
| `ui-render-engine.js` | Platform | 0.82 | 0 | 3 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `universal-command-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `universal-filters-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `universal-search-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `utils.js` | Shared | 0.74 | 2 | 7 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `vida-mujer-client-explanation-report.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `vida-mujer-client-presentation-engine.js` | Advisor OS | 0.89 | 0 | 1 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `vida-mujer-client-presentation-test.js` | Advisor OS | 0.89 | 3 | 0 | advisor, client, relationship, prospecting, sales, conversation, or referral naming |
| `vida-mujer-coverage-status-engine.js` | Product Intelligence | 0.86 | 0 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `vida-mujer-coverage-status-report.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `vida-mujer-event-benefits-report.js` | Product Intelligence | 0.86 | 1 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `vida-mujer-financial-correction-report.js` | Product Intelligence | 0.86 | 5 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `vida-mujer-financial-fixture-report.js` | Product Intelligence | 0.86 | 2 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `vida-mujer-knowledge-extractor-report.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `vida-mujer-knowledge-extractor.js` | Unknown | 0.35 | 0 | 3 | insufficient ownership evidence from filename-level discovery |
| `vida-mujer-master-test.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `vida-mujer-pdf-ave-integration-report.js` | Unknown | 0.35 | 3 | 0 | insufficient ownership evidence from filename-level discovery |
| `vida-mujer-pdf-intake-report.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `vida-mujer-protected-diseases-engine.js` | Product Intelligence | 0.86 | 1 | 1 | product, coverage, financial product, or health/insurance knowledge naming |
| `vida-mujer-protected-diseases-report.js` | Product Intelligence | 0.86 | 0 | 0 | product, coverage, financial product, or health/insurance knowledge naming |
| `vida-mujer-rule-consistency-report.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `vida-mujer-status.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `vida-mujer-survival-schedule-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `virtual-list-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `virtual-list.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `visibility-runtime.js` | Platform | 0.82 | 0 | 0 | runtime infrastructure, repository, command, schema, shell, service, or test-harness naming |
| `warm-market-segmentation-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
| `whatsapp-action-engine.js` | Shared | 0.74 | 0 | 0 | cross-domain utility, evidence, decision, prompt, scoring, or builder naming |
| `whatsapp-link-engine.js` | Unknown | 0.35 | 0 | 0 | insufficient ownership evidence from filename-level discovery |
