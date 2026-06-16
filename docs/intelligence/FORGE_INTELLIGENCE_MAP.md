# FORGE INTELLIGENCE MAP

## 1. Executive Summary

Forge Intelligence is a cooperative network of specialized domains designed to transform raw evidence into business decisions and, ultimately, into long-term reputation. Each domain owns a specific segment of the intelligence loop and maintains independent auditability.

**Final Principle**: Intelligence domains must cooperate, but remain independently auditable.

---

## 2. Intelligence Flow

```text
Evidence (Data Intake)
  ↓
Decision Intelligence (Recommendation)
  ↓
Action (User UI Click/Interaction)
  ↓
Outcome Intelligence (State Change Detection)
  ↓
Attribution Intelligence (Causality Mapping)
  ↓
Influence Intelligence (Contribution Weighting)
  ↓
Trust Intelligence (Relationship Capital)
  ↓
Reputation Intelligence (Network Memory)
```

---

## 3. Domain Definitions

### 3.1 Decision Intelligence
*   **Purpose**: To suggest the highest-value action based on available evidence.
*   **Inputs**: Domain evidence (Prospects, Cartera, Activity), Advisor Context.
*   **Outputs**: Recommendations, Prompts, Alerts.
*   **Time Horizon**: Immediate / Short-term.
*   **Human Override**: Yes (Dismiss/Modify).
*   **Failure Modes**: Low relevance, Alert fatigue, Logic errors.
*   **Constitutional Status**: **CONSTITUTIONAL** (Core value-add).

### 3.2 Outcome Intelligence
*   **Purpose**: To detect whether an action resulted in a business state change.
*   **Inputs**: Telemetry (Clicks), Domain state (Status changes, Point increases).
*   **Outputs**: Success/Failure signals.
*   **Time Horizon**: Short to Medium-term (Hours to Days).
*   **Human Override**: No (Observed Fact).
*   **Failure Modes**: Data lag, Missed state changes.
*   **Constitutional Status**: **CONSTITUTIONAL** (Evidence loop closure).

### 3.3 Attribution Intelligence
*   **Purpose**: To determine the degree of causality between a decision and an outcome.
*   **Inputs**: Outcomes, Decision logs, Temporal context.
*   **Outputs**: Attribution levels (0-4), Confidence scores.
*   **Time Horizon**: Medium-term.
*   **Human Override**: Yes (Explicit rejection).
*   **Failure Modes**: False correlation, Credit inflation.
*   **Constitutional Status**: **CONSTITUTIONAL** (Fairness boundary).

### 3.4 Influence Intelligence
*   **Purpose**: To distribute contribution weights across multiple actors (Humans/Systems).
*   **Inputs**: Attribution records, Actor interaction history.
*   **Outputs**: Weighted contribution ledger entries.
*   **Time Horizon**: Medium-term.
*   **Human Override**: Yes (Weight adjustment).
*   **Failure Modes**: Double counting, System bias.
*   **Constitutional Status**: **REPLACEABLE** (Strategy dependent).

### 3.5 Trust Intelligence
*   **Purpose**: To measure relationship capital within specific local contexts.
*   **Inputs**: Influence ledger, Commitment history, Follow-up rates.
*   **Outputs**: Trust indicators (Contextual).
*   **Time Horizon**: Long-term.
*   **Human Override**: Yes (Manual trust reset/override).
*   **Failure Modes**: Feedback loops, Context leakage.
*   **Constitutional Status**: **REPLACEABLE** (Relational strategy).

### 3.6 Reputation Intelligence
*   **Purpose**: To aggregate network-observed reliability over time.
*   **Inputs**: Trust history, Aggregate outcomes, Ethical markers.
*   **Outputs**: Global reliability records (Audit only).
*   **Time Horizon**: Life of the Actor.
*   **Human Override**: Indirect (Recovery model/Manager review).
*   **Failure Modes**: Permanence trap, Matthew Effect.
*   **Constitutional Status**: **REPLACEABLE** (Network policy).

---

## 4. Dependency & Failure Isolation Rules

| If this domain fails... | ...Then this happens: |
| :--- | :--- |
| **Decision** | The loop stops. No actions are prompted. |
| **Outcome** | Attribution fails. Forge cannot prove its value. |
| **Attribution** | Influence becomes Level 0 (Unknown). No credit is shared. |
| **Influence** | Trust and Reputation cannot be updated based on new evidence. |
| **Trust** | Reputation becomes stagnant but remains functional as "Historical Memory." |
| **Reputation** | The network loses long-term reliability context, but individual decisions/actions remain valid. |

**Isolation Principle**: Failure in a downstream domain (e.g., Trust) must never corrupt or block upstream logic (e.g., Decision making).

---

## 5. Status
**CANONICALIZED**
*This document serves as the master map for all Forge Intelligence modules.*
