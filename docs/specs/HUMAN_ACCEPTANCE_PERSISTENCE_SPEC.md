# Human Acceptance Persistence Specification v0.1

Status: DRAFT
Date: 2026-06-17
Version: 0.1

## 1. Purpose
This specification defines the schema and operational rules for persisting human adjudication decisions (Accept/Reject) on semantic candidates within Supabase.

**Crucial Directive:** This persistence layer exists strictly for UI state recovery and human auditability. Data persisted here **MUST NOT** be interpreted as canonical truth and **MUST NOT** be written to the Event Ledger until explicitly promoted through the Truth Resolution engine.

## 2. Constitutional Guardrails
- **Ledger Separation:** This table is NOT the Event Ledger. It is a transient storage for adjudication status.
- **Human Accountability:** Every decision must be traceable to the human actor.
- **Immutability of Intent:** Once a decision is made and persisted, it should not be silently overwritten. Subsequent changes must create new records.
- **Truth Resolution Boundary:** Persistence here does not make a candidate "canonical". Promotion to canonical truth is a separate event triggered by the resolution engine after processing this adjudication.

## 3. Database Schema (`human_adjudication_log`)

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK, default gen_random_uuid() | Unique identifier for the decision. |
| `candidate_id` | text | NOT NULL | Deterministic ID of the candidate (e.g., `cand_001`). |
| `note_hash` | text | NOT NULL | Hash of the original note for context integrity. |
| `decision` | text | NOT NULL | 'ACCEPTED' or 'REJECTED'. |
| `reason` | text | NULL | Rationale for rejection (mandatory if rejected). |
| `actor_id` | text | NOT NULL | ID of the advisor making the decision. |
| `timestamp` | timestamptz | default now() | When the decision was made. |
| `raw_candidate` | jsonb | NOT NULL | The snapshot of the candidate as proposed. |

## 4. Operational Rules
1. **Adjudication Flow:**
   - GUI displays `proposed` candidates from `semantic-extract`.
   - User performs Accept/Reject.
   - GUI performs `POST` to a new `adjudicate-candidate` Edge Function.
   - Edge Function persists record to `human_adjudication_log`.
2. **Access Control:**
   - Policies must be Row Level Security (RLS) enabled.
   - Only authenticated advisors can insert/read their own logs.
3. **Data Lifecycle:**
   - This table is append-only.
   - Records are NOT to be deleted, adhering to audit requirements.

## 5. Relationship to Truth Resolution
Persistence of an `ACCEPTED` decision in this table acts as a **prerequisite** for Truth Resolution. The resolution engine SHOULD poll or listen to this table to determine when a candidate is ready for canonical promotion, provided other corroboration criteria are met.
