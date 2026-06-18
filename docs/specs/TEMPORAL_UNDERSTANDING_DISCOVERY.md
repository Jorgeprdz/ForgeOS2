# Temporal Understanding Discovery

Status: DISCOVERY CLOSED / IMPLEMENTATION DEFERRED
Date: 2026-06-18

## Purpose

Document the current understanding of human temporal language in Forge semantic extraction, without expanding the v0.8 runtime contract.

This discovery exists to prevent accidental overreach: Forge may recognize some temporal forms today, but broader temporal interpretation requires a separate governed engine.

## Conclusion

Human temporal language contains at least six temporal categories:

| Type | Name | Description | Example |
| --- | --- | --- | --- |
| T1 | Exact Temporal | A direct date, month, day, or named temporal point. | `martes`, `julio` |
| T2 | Relative Temporal | A relative temporal expression that can be normalized or resolved. | `próximo año`, `dentro de 2 meses` |
| T3 | Numeric Range | A numeric approximate range that should remain human-facing. | `2 o 3 semanas` |
| T4 | Alternative Set | Multiple possible temporal targets. | `agosto o septiembre` |
| T5 | Temporal Window | A bounded or fuzzy period/window. | `entre agosto y septiembre`, `fin de mes o el que sigue` |
| T6 | Conditional Temporal | A time that depends on another event or condition. | `cuando me confirme`, `después de que pague` |

## Current Forge Support

Semantic Extract v0.8 supports:

- T1 Exact Temporal
- T2 Relative Temporal
- T3 Numeric Range

T3 numeric ranges must preserve the human-facing range and must not be collapsed into a single exact month or date.

Example:

```text
Input: Escribeme en 2 o 3 semanas
due: 2 o 3 semanas
quality: medium
```

## Deferred Temporal Categories

The following categories are not part of the current v0.8 implementation contract:

- T4 Alternative Set
- T5 Temporal Window
- T6 Conditional Temporal

These categories should remain discovery/backlog material until a separate temporal resolution design is approved.

## Future Candidate

Future candidate engine:

```text
Temporal Set Resolution Engine
```

Potential responsibility:

- Preserve multiple possible temporal targets without silent collapse.
- Represent alternatives, windows, and conditions explicitly.
- Separate human-facing text from machine-resolved scheduling logic.
- Return uncertainty and review requirements when the temporal expression cannot be safely resolved.

## Boundary

This discovery does not authorize implementation of T4-T6.

It does not change:

- Semantic Extract v0.8 runtime behavior.
- Candidate evidence rules.
- Human review requirements.
- Ledger write policy.
- Database write policy.

Implementation remains deferred.
