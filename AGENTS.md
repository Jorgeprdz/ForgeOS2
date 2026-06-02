# Forge OS Agent Guide

## Project Identity

Forge OS is a sales operating system for financial advisors.

It is not a generic CRM, not a chatbot, and not a simple lead database. The repository contains product intelligence, sales conversion, conversation intelligence, relationship intelligence, policy operations, manager/team intelligence foundations, UI modules, and local master tests.

The product direction is decision intelligence: Forge should help an advisor decide who to contact, why, what to say, what risk or opportunity exists, and what action should happen next.

## Mission

Help financial advisors sell more, retain more clients, generate more referrals, serve clients better, and make clearer commercial decisions.

Every engine should move information toward action. A report is only useful if it improves prioritization, trust, conversion, retention, or execution.

## Vision

Forge OS should become the operating layer for advisor productivity and commercial intelligence:

- Revenue generation identifies market, referral, reactivation, and opportunity signals.
- Sales conversion helps turn prospects into meetings and clients.
- NASH explains conversation context, intent, objection, psychology, and next best action.
- Relationship Intelligence identifies who to contact, why, and when.
- Product Intelligence turns quotes and product documents into useful recommendations.
- Policy Operations maintains operational clarity around policies, renewals, tasks, timelines, and service.
- Manager and Team Intelligence help managers coach advisors and spot performance risks.

## Prime Directives

1. Make Forge better than the competition.
2. Make the advisor better than the competition.
3. Help the advisor sell 50% more.
4. Every conversation should make Forge smarter.
5. Intelligence without action is just information.

## Architecture Principles

- Prefer small focused engines over large mixed-purpose modules.
- Orchestrators consume existing engines; they should not duplicate business logic.
- Tests are mandatory for every PAQ or foundation milestone.
- Keep UI changes separate from engine work unless explicitly requested.
- Do not touch `app.js` unless explicitly requested.
- Do not make external API calls in engines that are currently rule/data based.
- Do not add OpenAI, embeddings, or AI calls unless a PAQ explicitly asks for them.
- Do not invent financial values, product assumptions, or relationship facts.
- Preserve existing module style in the area being touched.
- New NASH and Relationship engines currently use CommonJS `module.exports`.
- Some legacy/Product/Policy modules still use ESM `export function`; do not convert them casually.
- Outputs should be structured, actionable, and testable.
- If a feature does not increase sales, clarity, retention, trust, or competitive advantage, question it.

## Workflow

Required working flow:

1. Analyze
2. Propose
3. Approve
4. Implement
5. Test
6. Commit
7. Push

Operational rules:

- Read the relevant files before changing them.
- Do not modify unrelated systems.
- Do not change UI, `app.js`, or tests outside the requested scope unless explicitly approved.
- Before commit, run the relevant master tests.
- Before commit, inspect `git status --short`.
- Do not commit without explicit user instruction.
- Do not push without explicit user instruction.

## Forge Council

The Forge Council is a product and engineering decision framework, not roleplay.

### Miranda

- Role: Quality, priority, product discipline.
- Main question: Does this actually create value?
- Optimizes: Clarity, focus, correctness, useful scope.
- Rejects: Feature bloat, weak tests, unclear value, unnecessary complexity.

### Nash

- Role: Conversation intelligence, intent, next best action.
- Main question: What is really happening inside the conversation?
- Optimizes: Context, personality, intent, objection handling, next best action.
- Rejects: Generating messages without context, personality, intent, and action.

### Joy Mangano

- Role: Business value and real-world usefulness.
- Main question: Does this solve a real advisor problem?
- Optimizes: Adoption, simplicity, usefulness, practical workflows.
- Rejects: Clever features that do not help advisors work better.

### Arqui Juve

- Role: Architecture, scalability, technical systems, maintainability.
- Main question: Will this system remain understandable as it grows?
- Optimizes: Boundaries, contracts, tests, maintainable orchestration.
- Rejects: Fragile coupling, duplicated logic, unclear contracts.

### Jurgen Klaric

- Role: Behavioral psychology and buying motivation.
- Main question: What emotional driver exists behind this behavior?
- Optimizes: Motivation, trust, resistance, urgency, decision psychology.
- Rejects: Treating every objection as a rational product question.

### Jordan Belfort

- Role: Sales conversion, persuasion, urgency, objections, closing.
- Main question: What moves the prospect forward?
- Optimizes: Commitment, momentum, objection handling, conversion.
- Rejects: Passive followup and messages without a commercial next step.

### Hitch

- Role: Rapport, first contact, social timing, non-salesy openings.
- Main question: How do we start or continue without creating resistance?
- Optimizes: Warmth, timing, opening messages, social fit.
- Rejects: Aggressive or tone-deaf outreach.

### Patch Adams

- Role: Empathy, human trust, warmth, emotional safety.
- Main question: Does this feel human and safe?
- Optimizes: Trust, validation, emotional safety, respectful communication.
- Rejects: Pressure, guilt, coldness, manipulative tone.

### Chris Gardner

- Role: Execution, prospecting discipline, persistence, activity.
- Main question: Is there enough activity to create outcomes?
- Optimizes: Consistent prospecting, followup volume, daily execution.
- Rejects: Strategy without activity.

### Rocky

- Role: Grit, consistency, resilience, doing the hard reps.
- Main question: What hard action needs to happen repeatedly?
- Optimizes: Discipline, consistency, repetition, resilience.
- Rejects: Avoidance and inconsistent execution.

### Mick

- Role: Coaching, correction, training, skill improvement.
- Main question: What skill should be trained next?
- Optimizes: Practice, feedback, correction, drills.
- Rejects: Vague coaching without a drill or behavior change.

### Nicky Spurgeon

- Role: Networking, referrals, centers of influence, warm market.
- Main question: Where is the relationship leverage?
- Optimizes: Referral timing, introductions, trust networks, warm opportunities.
- Rejects: Asking for referrals without trust or timing.

## Current Project Status

As of the current repository state:

- `FORGE_MASTER_BUILD_TREE.md` exists.
- `AGENTS.md` was missing before this file was created.
- Branch status after the latest push was clean and aligned with `origin/main`.
- Recent commits include:
  - `995a434 Implement Relationship Intelligence foundation`
  - `a245378 Implement Nash master intelligence foundation`
  - `d3cb62f Implement Nash v0.7 Coaching Insight Bridge`
  - `20a3e24 Implement Nash v0.6 Advisor Performance Engine`
  - `acbba5e Add Forge build tree and Nash learning reports`
  - `4b84032 Implement Nash v0.4 Intent Engine`
- The repository has many small engine files and 37 `*-master-test.js` files.
- `forge-global-master-test.js` exists, but it is currently focused mainly on Product Intelligence and several PDF-dependent flows.
- NASH and Relationship Intelligence are more advanced in code than the previous build tree indicated.

## NASH Conversation Intelligence

NASH is the conversation intelligence system.

It should explain:

- What happened in the conversation.
- What the prospect likely means.
- What objection or intent is present.
- What psychology may be driving the response.
- What next action should happen.
- What the advisor or manager should improve.

Implemented NASH files include:

- `nash-prospect-context-builder.js`
- `nash-personality-engine.js`
- `nash-council-orchestrator.js`
- `nash-message-recommendation-engine.js`
- `nash-followup-engine.js`
- `nash-combat-orchestrator.js`
- `nash-combat-intelligence-report-engine.js`
- `nash-intent-engine.js`
- `nash-memory-engine.js`
- `nash-learning-engine.js`
- `nash-next-best-action-engine.js`
- `nash-advisor-performance-engine.js`
- `nash-coaching-insight-engine.js`
- `nash-manager-alert-engine.js`
- `nash-team-intelligence-engine.js`
- `nash-master-intelligence-engine.js`

The master orchestrator is `nash-master-intelligence-engine.js`. It consumes existing engines and returns:

- advisor
- prospect
- personality
- intent
- objection
- psychology
- recommendedResponse
- nextBestAction
- advisorInsight
- coachingInsight
- managerInsight
- teamInsight
- confidence

NASH memory is local under `nash-memory/`.

Current NASH limitation: it is rule/data based. It does not use OpenAI, embeddings, or external APIs.

## Relationship Intelligence

Relationship Intelligence answers:

- Who should the advisor contact?
- Why now?
- What relationship opportunity exists?
- Is there a relevant life event?
- Is it a good moment to ask for a referral?

Implemented Relationship Intelligence files include:

- `relationship-timeline-engine.js`
- `relationship-next-action-engine.js`
- `relationship-opportunity-engine.js`
- `life-event-engine.js`
- `referral-opportunity-engine.js`
- `relationship-health-engine.js`
- `client-engagement-engine.js`
- `relationship-review-engine.js`
- `relationship-master-engine.js`

The master orchestrator is `relationship-master-engine.js`. It consumes:

- Timeline
- Next Action
- Opportunity
- Life Event
- Referral
- Health
- Engagement
- Review

It returns:

- clientId
- nextAction
- opportunities
- lifeEvents
- referralOpportunity
- relationshipHealth
- engagement
- reviewRecommendation
- confidence

Relationship Intelligence v1.0 is implemented as a functional foundation. It is still heuristic and data-driven.

## Product Intelligence

Product Intelligence is marked advanced in `FORGE_MASTER_BUILD_TREE.md`.

Observed product-related areas include:

- OCR and quote intake flows.
- Product detection.
- Product family and specialized parser/rule/presentation architecture.
- Imagina Ser.
- Vida Mujer.
- SeguBeca.
- Shared AVE Library.
- Shared CLP Library.
- Decision clarity and client presentation helpers.

Representative files include:

- `product-detection-engine.js`
- `policy-ocr-engine.js`
- `imagina-ser-master-test.js`
- `vida-mujer-master-test.js`
- `segu-beca-master-test.js`
- `forge-shared-ave-master-test.js`
- `shared-clp-master-test.js`
- `forge-global-master-test.js`

Important limitation: Product Intelligence contains some ESM-style modules. Do not assume CommonJS across this subsystem.

## Policy & Sales Operations

Policy Operations contains many `policy-*` engines and `cartera-*` operational files.

Representative files include:

- `policy-detail-engine.js`
- `policy-timeline-engine.js`
- `policy-renewal-engine.js`
- `policy-task-engine.js`
- `policy-followup-engine.js`
- `policy-operational-center-engine.js`
- `policy-relationship-score-engine.js`
- `policy-ingestion-orchestrator.js`
- `policy-ocr-engine.js`
- `cartera-service.js`
- `cartera-repository.js`
- `cartera-validator.js`

The build tree marks Policy Detail and Policy Timeline as closed, Policy Renewal as building, and several operational bridges as planned.

Important limitation: Policy Operations includes legacy ESM-style modules and many related files. Read the exact target files before changing anything.

## Testing Strategy

The repository relies heavily on local master tests.

Known master tests include NASH, Relationship, Product, Shared libraries, and some global tests. For engine PAQs, run the relevant `node *-master-test.js` files before committing.

For NASH changes, prefer running the directly affected test plus compatibility tests around:

- intent
- learning
- advisor performance
- coaching
- manager alert
- team intelligence
- master intelligence
- master acceptance

For Relationship changes, prefer running:

- `node relationship-timeline-master-test.js`
- `node relationship-next-action-master-test.js`
- `node relationship-opportunity-master-test.js`
- `node life-event-master-test.js`
- `node referral-opportunity-master-test.js`
- `node relationship-health-master-test.js`
- `node client-engagement-master-test.js`
- `node relationship-review-master-test.js`
- `node relationship-master-acceptance-test.js`

`forge-global-master-test.js` may require local PDF files and should not be assumed portable without checking its commands.

## Git Rules

- Do not commit unless the user explicitly asks.
- Do not push unless the user explicitly asks.
- Never use destructive commands like `git reset --hard` unless explicitly requested.
- Do not revert user changes.
- Before staging, inspect `git status --short`.
- Stage only files relevant to the requested PAQ.
- Use clear commit messages tied to the PAQ or functional milestone.
- After push, verify the branch status when useful.

## Known Gaps / Do Not Assume

- `AGENTS.md` did not exist before this file.
- Build tree statuses can lag behind implemented code; verify with files and tests.
- NASH and Relationship Intelligence are rule/data based foundations, not AI systems yet.
- There is no central schema layer for shared inputs/outputs.
- There are no shared fixtures across all subsystems.
- There is no single complete test runner for every current subsystem.
- Module style is mixed: CommonJS in newer NASH/Relationship, ESM in several older Product/Policy modules.
- Relationship Intelligence has a functional v1.0 foundation, but separate Birthday/Renewal/Payment Reminder engines are not standalone files yet.
- Product Intelligence appears advanced, but product documentation is not consolidated in one agent-facing file.
- Policy Operations has many engines, but ownership and closed/building boundaries require file-level verification.
- Do not invent product features, financial values, client facts, relationship signals, or roadmap completion.

## Known Limitations

- Many engines use heuristics and pattern matching. Treat outputs as decision support, not final truth.
- NASH memory is local JSON under `nash-memory/`.
- Some tests depend on local files outside the repository, especially PDF-based product tests.
- The build tree is strategic documentation, not a guaranteed implementation map.
- Several modules are very small and may represent placeholders, foundations, or early PAQ artifacts.
- Future agents must verify current state with `rg`, `find`, `git status`, and relevant tests before acting.
