# Forge Genesis Profile Intake + Nash Conversation Intelligence Lock 001

Source commit at documentation time: 1f55a7e86eebd057d3b353d825d01b84102d9f9e

## Declaration

~~~text
FORGE_GENESIS_PROFILE_INTAKE=DOCUMENTED
FORGE_GENESIS_NASH_CONVERSATION_LAYER=DOCUMENTED
MANAGER_OS_CANDIDATE_READER=FUTURE_SCOPE
ADVISOR_OS_PROSPECT_READER=FUTURE_SCOPE
MESSAGE_GENERATION_RUNTIME=NOT_IMPLEMENTED
HUMAN_APPROVAL_REQUIRED=true
~~~

## Core Idea

Forge Genesis must not begin by writing messages.

Forge must first read protected context, identify missing evidence, preserve uncertainty, choose a legitimate conversation angle, consume Nash for conversation safety, and only then prepare a message draft for human approval.

~~~text
signal -> protected context -> compatibility signal -> Nash conversation layer -> prompt builder -> draft -> human approval
~~~

## Two Sibling Paths

| OS | Reads | Purpose | Output |
| --- | --- | --- | --- |
| Manager OS | Candidate profile, LinkedIn, CV, manager notes, referrals | Career compatibility and recruitment approach | Recruitment message draft |
| Advisor OS | Prospect social profile, Facebook, Instagram, LinkedIn, advisor notes, referrals | Protection/financial conversation opportunity | Appointment message draft |

## Manager OS Candidate Intelligence

Manager OS may consume candidate profile context such as LinkedIn, CV, referral notes, work history, and manager-entered context.

Example:

~~~text
Emilia Perez
Referida por Areli.
Trabajaban juntas.
Pauso su vida laboral para cuidar a su hija.
Ahora quiere retomar actividad profesional.
~~~

Allowed outputs:

- Career compatibility estimate.
- Confidence level.
- Missing evidence.
- Interview questions.
- Recruitment approach strategy.
- Message variants.
- Follow-up variants.

Forbidden outputs:

- Candidate approval truth.
- Candidate rejection truth.
- Human ranking truth.
- Hiring decision truth.
- Promotion truth.
- Pressure based on motherhood, unemployment, age, family, or economic need.

## Advisor OS Prospect Intelligence

Advisor OS may consume prospect context such as Facebook, Instagram, LinkedIn, referrals, advisor notes, life-stage notes, and conversation history.

Example:

~~~text
Juan Perez
Referido por Marce.
Casado, con hijos.
33 anos.
~~~

Allowed outputs:

- Conversation compatibility estimate.
- Confidence level.
- Missing evidence.
- Protection/retirement/savings/education angle.
- Appointment message variants.
- Follow-up variants.
- Reply suggestions when the prospect says 'mandame info' or 'no tengo tiempo'.

Forbidden outputs:

- Insurance need diagnosis as truth.
- Sales truth.
- Capacity-to-pay truth.
- Fear-based family pressure.
- Automatic selling.
- Automatic message send.

## Nash Consumption

Nash is consumed as the Conversation Intelligence Layer.

Nash turns protected context into respectful conversation. Nash does not create truth, execute actions, send messages, approve candidates, reject candidates, diagnose prospects, or decide sales action.

Nash helps with:

- Tone.
- Clarity.
- Opening questions.
- Follow-up language.
- Objection-safe wording.
- Avoiding pressure.
- Avoiding manipulation.
- Avoiding invented intent.

## Constitutional Rules

~~~text
Profile data is context, not truth.
Social media is signal, not diagnosis.
CV and LinkedIn are evidence inputs, not absolute truth.
Life context is not pressure.
Family context is not fear leverage.
Missing evidence is not negative evidence.
Candidate compatibility is not hiring truth.
Prospect compatibility is not sales truth.
Nash turns protected context into conversation.
Nash does not decide.
Forge recommends.
Human approves before action.
~~~

## Future Module Names

Manager OS:

~~~text
MANAGER_OS_CANDIDATE_PROFILE_INTAKE
MANAGER_OS_CANDIDATE_CONTEXT_READER
MANAGER_OS_CAREER_COMPATIBILITY_SIGNAL
MANAGER_OS_RECRUITMENT_APPROACH_STRATEGY
MANAGER_OS_NASH_RECRUITMENT_CONVERSATION_LAYER
MANAGER_OS_RECRUITMENT_MESSAGE_PROMPT_BUILDER
~~~

Advisor OS:

~~~text
ADVISOR_OS_PROSPECT_PROFILE_INTAKE
ADVISOR_OS_SOCIAL_CONTEXT_READER
ADVISOR_OS_PROTECTION_CONVERSATION_SIGNAL
ADVISOR_OS_APPROACH_STRATEGY_BUILDER
ADVISOR_OS_NASH_PROSPECT_CONVERSATION_LAYER
ADVISOR_OS_MESSAGE_PROMPT_BUILDER
~~~

## What Forge Learned

Forge learned that its Genesis is not just message generation.

Forge Genesis is a protected chain: read context, preserve uncertainty, consume Nash for conversation safety, generate a draft, and require human approval.

Forge is learning to read people carefully without turning people into scores, judgments, pressure points, or automatic actions.
