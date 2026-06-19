# FORGE HOME SMART WIDGETS CONTEXTUAL RULE 001

## Status

LOCK CANDIDATE

## Purpose

Forge Home / Mi Día must not behave as a static dashboard.

Mi Día is the advisor's contextual operating cockpit. Its job is not to show everything Forge knows. Its job is to answer:

> What should I do now?

## Core rule

Forge Home is adaptive.  
Revenue is contextual.  
Alfred chooses what matters now.

## Product principle

Mi Día must show the right widget at the right moment, not every widget at once.

The same widgets may exist in the system, but their priority, order, visibility, collapsed state and expanded state must change based on context.

## Implementation principle

Forge Home should use intelligent, stackable widgets inspired by iOS Smart Stack and Samsung One UI widget stacks.

Widgets are reusable modules. The home layer ranks them.

The advisor should see:

1. The highest-impact action now.
2. The reason why it matters.
3. The next action button or command.
4. Optional detail one tap deeper.

## What Mi Día must avoid

Mi Día must not become:

- a static BI dashboard
- a CRM homepage full of cards
- a revenue statement
- a carrier comparison screen
- a wall of numbers
- an Excel summary with blur

Detail belongs one tap deeper.

## Alfred-first hierarchy

Alfred remains the operational star.

Revenue, pipeline, calendar, activity and evidence widgets support Alfred's recommendation. They should not compete with it.

The primary card should explain:

- what matters now
- why it matters
- what action to take
- expected impact

## Time-aware behavior

### 8:00 AM — Morning kickoff

Primary goal:

Start the day with the highest-leverage plan.

Preferred widgets:

- Alfred briefing
- first best action
- goal gap
- top follow-up
- calendar / citas
- Green Owl daily target

Example:

> Juan puede acercarte $6,000 a tu meta. Haz follow-up antes de las 11:00.

### 11:00 AM — Execution / opportunity window

Primary goal:

Push live opportunities and follow-ups.

Preferred widgets:

- hot opportunity
- WhatsApp / message action
- pending calls
- pipeline movement
- commission potential

Example:

> Sigue con Juan ahora. Está caliente. Si cierra, suma $6,000 potenciales.

### 4:00 PM — Afternoon recovery / control

Primary goal:

Rescue or accelerate the day.

Preferred widgets:

- activity points
- remaining actions
- revenue gap
- missed follow-ups
- next best call
- Green Owl cause/effect nudge

Example:

> Haz 3 llamadas más y puedes sumar 12 puntos: 3 por llamadas y 9 por citas agendadas.

### 9:00 PM — Daily wrap-up

Primary goal:

Confirm activity and prepare tomorrow.

Preferred widgets:

- activity confirmation
- payment / policy confirmation if pending
- tomorrow's first priority
- streak status
- revenue changes from today

Example:

> Hoy registré 3 referidos, 2 citas iniciales y 1 cierre. ¿Tuviste más actividad?

## Smart widget ranking inputs

The home ranking engine should consider:

- time of day
- calendar events
- pending follow-ups
- opportunity value
- revenue gap
- payment confirmations
- policy evidence confirmations
- commission statement confirmations
- activity points
- streak risk
- manager / coaching relevance
- advisor focus mode
- single-carrier vs multi-carrier mode

## Revenue widget rule

Revenue widgets appear when they change what the advisor should do next.

Revenue should not dominate Mi Día unless revenue urgency is the main next action.

Examples of valid revenue-driven widgets:

- goal gap alert
- high-value opportunity follow-up
- payment confirmation blocking earned revenue
- commission statement confirmation blocking paid confirmed revenue
- renewal revenue risk
- bonus condition close to threshold

## Evidence-first widget rule

Evidence and confirmation widgets appear when missing confirmation blocks operational truth.

Examples:

- policy detected but not confirmed
- payment evidence uploaded but missing amount
- payment confirmed but initial / renewal classification blocked
- commission statement uploaded but payout rows need confirmation

Forge must never show unconfirmed evidence as generated revenue.

## Carrier visibility rule

Single-carrier advisor:

- show clean direct totals
- do not show carrier clutter
- do not show empty carrier placeholders
- do not show AXA / GNP / Other if not connected

Multi-carrier advisor:

- show carrier breakdown only when relevant
- show only connected / authorized carriers
- not_modeled is not zero
- hidden_by_scope is not zero

## Widget stack behavior

Widgets may have these states:

- primary
- stacked_preview
- collapsed
- expanded
- hidden
- blocked_by_missing_evidence
- hidden_by_scope

The home screen should normally show:

- one primary Alfred card
- one or two supporting smart widgets
- one command bar

Additional details should be available through drill-down.

## Examples of widget categories

- Alfred briefing
- Next Best Economic Action
- Revenue gap
- Opportunity follow-up
- Policy confirmation
- Payment confirmation
- Commission statement confirmation
- Green Owl activity nudge
- Calendar / citas
- Daily wrap-up
- Tomorrow setup
- Streak / activity points

## Final rule

Mi Día is not the state of results.

Mi Día tells the advisor what to do now to improve the state of results.

Forge knows many things, but Alfred chooses what matters now.
