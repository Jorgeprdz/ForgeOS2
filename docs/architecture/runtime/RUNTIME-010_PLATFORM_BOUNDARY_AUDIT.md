# RUNTIME-010 Platform Boundary Audit

Report ID: RUNTIME-010
Status: ARCHITECTURE DISCOVERY
Date: 2026-06-11

## 1. Executive Summary

This audit evaluates the ownership and consolidation potential of the Supabase-related infrastructure engines: `offline-sync.js` and `realtime-engine.js`. Currently, both engines bypass the established `SupabaseRuntime` boundary and consume the global `window.supabaseClient` directly. Consolidating these under the Platform boundary is a prerequisite for removing the legacy compatibility global and achieving true runtime modularization.

## 2. Infrastructure Inventory

| File | Responsibilities | External Dependencies | Primary Consumer | Ownership Candidate |
| --- | --- | --- | --- | --- |
| `supabase-runtime.js` | Client lifecycle, Auth, RPC, Table access | `window.supabaseClient` | `app.js`, `comisiones.js` | **Platform Infrastructure** |
| `offline-sync.js` | Sync queue management, Operation execution | `db.js`, `network-manager.js`, `window.supabaseClient` | `core-app-engine.js`, `sync-orchestrator.js` | **Platform Infrastructure** |
| `realtime-engine.js` | Channel management, PostgreSQL change subscriptions | `window.supabaseClient` | `sync-orchestrator.js` | **Platform Infrastructure** |

## 3. Engine Ownership Audits

### offline-sync.js
- **Purpose:** Manages a persistent IndexedDB queue for data mutations (UPSERT/DELETE) to ensure eventual consistency when the device is offline.
- **Dependency Profile:** Infrastructure-heavy (`IndexedDB`, `Network`, `Supabase`).
- **Domain Logic:** None. It operates on generic table names and payloads.
- **Classification:** **PLATFORM** (Generic Infrastructure).

### realtime-engine.js
- **Purpose:** Abstract layer for Supabase Realtime (PostgreSQL changes).
- **Dependency Profile:** Single dependency on `window.supabaseClient`.
- **Domain Logic:** None. It provides a generic `subscribe(table, callback)` interface.
- **Classification:** **PLATFORM** (Generic Infrastructure).

## 4. Platform Boundary Evaluation

**Consolidation Verdict: C. Client + Realtime + Offline Sync**

**Reasoning:**
All three components share the same underlying Platform provider (Supabase). Separation of "Client Access" from "Realtime Channels" and "Offline Persistence" is conceptually sound, but they all depend on the same initialized client instance. Consolidating them under the `SupabaseRuntime` boundary allows the Platform to manage the entire Supabase lifecycle (Auth -> Client -> Sync -> Realtime) as a single unit, providing a clean interface to the rest of the application.

## 5. Movement Readiness Verdict

Verdict: **LIMITED**

**Rationale:**
Consolidating the Platform boundary resolves the "Identity Leak" (global `window.supabaseClient`), but it does not fix the "Legacy Route Coupling" (static imports in `app.js`). Ownership consolidation makes the Platform *ready* to move, but the App Shell is not yet ready to *let go* of its static references.
