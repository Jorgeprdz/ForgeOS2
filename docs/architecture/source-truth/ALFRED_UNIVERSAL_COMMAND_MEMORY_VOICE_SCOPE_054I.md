# Alfred Universal Command Memory Voice Scope 054I

`054I_ALFRED_UNIVERSAL_COMMAND_MEMORY_VOICE_SCOPE`

## Product Definition

Alfred is Forge's universal operator layer.

Alfred is not only a search bar and not only a UI command box. Alfred is the entry point that connects Forge's indexed read models, human memory capture, product intelligence preparation, follow-up preparation, message drafting, and future voice capture.

Alfred is inspired by the Mac Alfred / Spotlight interaction model, but Forge-specific:

- fewer clicks
- natural-language capture
- slash commands
- universal index
- memory ledger
- action preparation
- human review before writes or execution

## Core Principle

Alfred may connect wires, prepare artifacts, and route context.

Alfred must not silently approve, send, write CRM, create calendar/task objects, create revenue/commission/payout truth, or execute provider/runtime actions.

## Command Families

Alfred command families are scoped as:

- `ALFRED_INDEX`
- `ALFRED_MEMORY`
- `ALFRED_VOICE_CAPTURE`
- `ALFRED_ACTION_PREP`
- `ALFRED_PRODUCT_INTELLIGENCE`
- `ALFRED_CALENDAR_PREP`
- `ALFRED_MESSAGE_DRAFT`
- `ALFRED_REFERRAL_CAPTURE`
- `ALFRED_FOLLOW_UP_PREP`
- `ALFRED_CHATBOT_ENTRY`

## Slash Commands

Initial command examples:

- `/Juan`
- `/Follow`
- `/Comisiones`
- `/Bonos`
- `/Cotizar`
- `/Cotiza`
- `/Proyectar`
- `/Proyección`
- `/Presentación`
- `/Propuesta`
- `/Memoria`
- `/Registro`
- `/Referido`
- `/Agenda`
- `/Crear evento`
- `/Mejora este mensaje`
- `/Chatbot`

## Memory Command

Preferred product label:

`/Memoria`

Rationale:

- more natural than `/bitácora`
- aligned with Forge's assistant identity
- short enough for command use
- broad enough for meeting notes, call notes, referrals, follow-up signals, product interests, and human context

Example:

`/Memoria Hoy vi a Juan. Me dijo que sí le interesa retiro, pero quiere revisarlo con su esposa. Me pidió que le hable el martes. También me refirió a Luis Pérez, compañero de trabajo.`

Expected read model:

- person: Juan
- conversation outcome: interested
- product interest: retiro
- decision context: review with spouse
- follow-up: next Tuesday
- referral: Luis Pérez
- referral source: Juan
- referral relationship: coworker
- output status: preview only / review only

## Referral Command

Example:

`/Referido Luis Pérez es referido de Giovanni Islas, compañero del trabajo.`

Expected read model:

- referral: Luis Pérez
- source: Giovanni Islas
- source relationship: coworker
- status: pending human review
- next suggested action: prepare first-contact context

## Agenda / Calendar Prep

Example:

`/Agenda Tengo cita con María el viernes a las 11.`

Expected read model:

- person: María
- event candidate: appointment
- date candidate: Friday
- time candidate: 11:00
- action candidate: prepare calendar event
- calendar create: requires explicit human confirmation

Forbidden in this scope:

- automatic Google Calendar creation
- automatic task creation
- automatic CRM write
- automatic confirmation

## Product Intelligence Prep

Alfred must route product intelligence requests into review artifacts first.

Examples:

- `/Cotizar Lariza y su novio retiro y Vida Mujer`
- `/Proyectar comisión de Juan`
- `/Presentación de venta para María`
- `/Propuesta para Lariza`

Expected statuses:

- preview only
- review only
- not approved
- not sendable
- not payout truth
- not compensation truth
- not CRM truth

## Voice Capture

Code name:

`ALFRED_VOICE_CAPTURE`

UI intent:

- microphone button in or adjacent to the Alfred command bar
- WhatsApp-like quick voice capture behavior
- listening state with Forge glow / voice animation
- transcription preview
- extracted memory preview
- edit / discard / confirm options

Voice capture must be scoped as preparation only:

- transcriptionPreviewOnly: true
- memoryWriteRequiresReview: true
- calendarCreateRequiresConfirmation: true
- crmWriteRequiresConfirmation: true
- sendMessageRequiresConfirmation: true

No audio runtime or speech engine is implemented in 054I.

## Read Model Result Shape

Alfred read-model results must include safety boundaries:

- `previewOnly: true`
- `reviewOnly: true`
- `notApproved: true`
- `notSendable: true`
- `createsTruth: false`
- `executesRuntime: false`
- `requiresHumanConfirmation: true`

## Article 0 Alignment

Alfred exists to reduce click burden while increasing human judgment quality.

It supports Article 0 by:

- preserving human final authority
- showing uncertainty
- showing extracted reasoning
- making missing context visible
- turning raw notes into reviewable structure
- preventing silent execution

## Implementation Gate

Next implementation should start with read-model only:

1. `ALFRED_UNIVERSAL_INDEX_READ_MODEL`
2. `ALFRED_MEMORY_CAPTURE_READ_MODEL`
3. `ALFRED_VOICE_CAPTURE_PREP_READ_MODEL`

No UI implementation is required by this scope.

## Next Phase

`054J_ALFRED_UNIVERSAL_COMMAND_MEMORY_READ_MODEL_IMPLEMENTATION`
