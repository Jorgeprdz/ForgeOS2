# ADR-0019 — Process Advancement Intelligence

## Status

LOCKED

## Context

Los CRM tradicionales suelen generar acciones utilizando:

- tiempo transcurrido
- tareas pendientes
- etapas del pipeline
- ausencia de respuesta

Este enfoque produce dos fallas recurrentes:

### Abandono

El proceso queda completamente en manos del prospecto.

Ejemplos:

- Avísame.
- Me escribes.
- Quedo pendiente.

### Persecución

El sistema recomienda actividad que no aumenta la probabilidad de avance.

Ejemplos:

- ¿Ya lo revisaste?
- ¿Ya decidiste?
- Follow-up automático por antigüedad.

Los procesos humanos no avanzan por actividad.

Los procesos humanos avanzan cuando ocurre el siguiente movimiento correcto en el momento correcto.

---

## Decision

Forge optimizará para avance real del proceso, no para actividad.

Antes de generar cualquier Next Best Action (NBA), Forge deberá evaluar tres dimensiones:

### Ownership

¿Quién posee la decisión?

¿Quién posee la siguiente acción?

¿Quién posee el proceso?

### Dependencies

¿Qué condición debe resolverse para que exista avance?

Ejemplos:

- Prospecto debe decidir.
- Pareja debe revisar.
- Documento debe enviarse.
- Referido debe contactar.
- Underwriter debe emitir dictamen.
- Fecha efectiva debe llegar.

### Commitments

¿Qué acuerdos explícitos o implícitos existen actualmente?

Ejemplos:

- Te escribo el lunes.
- Lo retomamos la próxima semana.
- Después de tu viaje lo revisamos.
- Estoy esperando documentos.
- El referido te contactará.

---

## Core Principle

El prospecto puede ser dueño de la decisión.

El asesor debe seguir siendo dueño del proceso.

---

## NBA Principle

Forge no recomendará acciones únicamente porque pasó tiempo.

Forge no recomendará acciones únicamente porque existe silencio.

Forge recomendará la acción que tenga mayor probabilidad de producir avance real del proceso con la menor fricción posible.

---

## Valid Outcomes

Todos los siguientes resultados son válidos:

- Follow-up
- Waiting State
- Generate Agreement
- Request Information
- No Action Required

La validez dependerá del contexto del proceso, no del tiempo transcurrido.

---

## Waiting States

Waiting es un resultado válido.

Waiting no implica:

- rechazo
- abandono
- pérdida del prospecto
- falta de interés

Waiting puede ser el NBA correcto cuando:

- existe una dependencia externa activa
- existe un compromiso vigente
- otro actor posee la siguiente acción

---

## Prohibited Behaviors

Forge no deberá:

### Perseguir actores que ya cumplieron

Ejemplo:

Referral Delivered.

Si el recomendador ya cumplió su obligación, no recomendar seguimiento adicional al recomendador.

### Confundir silencio con rechazo

Silencio y rechazo son conceptos diferentes.

### Recomendar seguimiento únicamente por antigüedad

El tiempo transcurrido por sí solo no justifica intervención.

### Abandonar procesos

No transferir completamente el ownership del proceso al prospecto sin un acuerdo explícito.

Evitar:

- Avísame.
- Me escribes.
- Quedo pendiente.

salvo que exista una razón explícita para hacerlo.

---

## Ownership Hierarchy

### Decision Ownership

Quién tiene autoridad para decidir.

### Action Ownership

Quién posee la siguiente acción necesaria para avanzar.

### Process Ownership

Quién mantiene continuidad en el proceso.

Estas tres dimensiones pueden pertenecer a actores distintos.

Forge deberá distinguirlas explícitamente.

---

## Examples

### Adrián

Decision Owner:
Referred Person

Action Owner:
Referred Person

Process Owner:
Advisor

NBA:
No Action Required

---

### Lariza

Decision Owner:
Lariza + Edwin

Action Owner:
Lariza + Edwin

Process Owner:
Advisor

NBA:
Generate Agreement / Wait

---

### Doris

Decision Owner:
Doris

Action Owner:
Doris

Process Owner:
Advisor

NBA:
Waiting State

---

### Adriana

Decision Owner:
Adriana

Action Owner:
Adriana

Process Owner:
Advisor

NBA:
Fulfill Commitment → Wait

---

## Guiding Statement

Forge no optimiza actividad.

Forge optimiza avance.

---

## Architectural Consequences

Este ADR habilita:

- Action Ownership Detection
- Waiting States
- Progressive Commitment Engine
- Follow-up Intelligence
- Relationship Intelligence
- Next Best Action Engine
- Anti-Coppel Rules

Todos los motores futuros deberán respetar este ADR antes de recomendar acciones comerciales.
