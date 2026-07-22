# ForgeOS2 Foundational Axioms

**Status:** Ratified
**Version:** 1.0
**Type:** Governance
**Authority:** Constitution

---

# Purpose

This document defines the immutable foundational axioms that govern ForgeOS2.

These axioms are normative. Every governance document, Architecture Decision Record (ADR), implementation, workflow, and contribution MUST comply with them.

---

# Axiom 001 — Constitution Supremacy

The Constitution is the highest normative authority of ForgeOS2.

No governance document, ADR, implementation, workflow, automation, or contributor may contradict it.

In case of conflict, the Constitution prevails.

---

# Axiom 002 — Governance by Ratification

Rules exist only after ratification.

Practices, habits, discussions, conventions, or undocumented behavior SHALL NOT be considered governance.

Every normative rule MUST exist inside a ratified governance document.

---

# Axiom 003 — Architecture by Decision

Architecture is defined by documented decisions.

Every significant architectural change MUST be accompanied by an Architecture Decision Record (ADR).

Code implements architecture.

ADRs define architecture.

---

# Axiom 004 — Documentary Immutability

Ratified governance documents and Architecture Decision Records are immutable historical artifacts.

Once ratified they SHALL NOT be modified.

Architectural evolution MUST occur by creating new documents that explicitly:

- supersede;
- amend;
- complement; or
- replace

previous documents.

Historical records are never rewritten.

Editorial corrections that do not alter meaning (such as spelling, formatting, or broken links) are the only permitted post-ratification modifications.

---

# Axiom 005 — Implementation Must Obey

Implementation is subordinate to architecture and governance.

If implementation conflicts with a ratified ADR, governance document, or the Constitution, the implementation is considered incorrect.

The implementation MUST be corrected.

---

# Principle of Complete Traceability

Every significant artifact MUST answer three questions:

1. Why does it exist?
2. Which authority authorizes it?
3. Where is it implemented?

Traceability SHALL exist in both directions.

Implementation
↑
ADR
↑
Governance
↑
Constitution

A missing traceability chain constitutes architectural debt.

---

# Document Lifecycle

Every normative document SHALL have one of the following states:

- Draft
- Review
- Ratified
- Superseded
- Archived

Only Draft and Review documents may change.

Ratified, Superseded, and Archived documents are immutable except for editorial corrections that do not alter meaning.

---

# Enforcement

Future governance automation and CI workflows SHOULD verify compliance with these axioms whenever technically feasible.

Violations SHALL be treated as governance violations rather than implementation defects.

