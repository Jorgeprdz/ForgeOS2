#!/usr/bin/env bash
set -euo pipefail

PHASE="064C_BACKEND_DOMAIN_CONTRACTS_SCOPE"
REPO="/storage/emulated/0/Forge OS"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_$(date +%Y%m%d_%H%M%S).md"
mkdir -p "$(dirname "$REPORT")"
exec > >(tee "$REPORT") 2>&1

CYAN="\033[1;36m"
GREEN="\033[1;38;5;46m"
YELLOW="\033[1;93m"
RED="\033[1;91m"
RESET="\033[0m"

say_stage() { printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass() { printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn() { printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }

autocopy_report() {
  if command -v termux-clipboard-set >/dev/null 2>&1; then
    termux-clipboard-set < "$REPORT" || true
    pass "report copied to clipboard"
  else
    warn "termux-clipboard-set not available; report left at $REPORT"
  fi
}

hold() {
  printf "${YELLOW}HOLD:${RESET} %s\n" "$1"
  autocopy_report
  exit 1
}

fail() {
  printf "${RED}FAIL:${RESET} %s\n" "$1"
  autocopy_report
  exit 1
}

run_cmd() {
  printf "\n========== RUN ==========\n"
  printf "%s " "$@"
  printf "\n"
  "$@"
}

require_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    pass "$file"
  else
    fail "missing required file: $file"
  fi
}

backup_file() {
  local file="$1"
  local dest="$BACKUP_DIR/$file"
  mkdir -p "$(dirname "$dest")"
  cp "$file" "$dest"
  pass "backup $file"
}

normalize_file() {
  local file="$1"
  python3 - "$file" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
path.write_text("\n".join(line.rstrip() for line in text.splitlines()) + "\n")
PY
}

append_sync_block() {
  local file="$1"
  local start="$2"
  local end="$3"
  local body="$4"
  python3 - "$file" "$start" "$end" "$body" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
start = sys.argv[2]
end = sys.argv[3]
body = sys.argv[4]
text = path.read_text()
block = f"{start}\n{body.rstrip()}\n{end}\n"
if start in text and end in text:
    before, rest = text.split(start, 1)
    _, after = rest.split(end, 1)
    text = before.rstrip() + "\n\n" + block + after.lstrip("\n")
else:
    text = text.rstrip() + "\n\n" + block
path.write_text(text)
PY
}

write_rollback() {
  local rollback="$BACKUP_DIR/rollback-064c.sh"
  cat > "$rollback" <<'ROLLBACK'
#!/usr/bin/env bash
set -euo pipefail

REPO="/storage/emulated/0/Forge OS"
BACKUP_DIR_PLACEHOLDER
cd "$REPO"

restore_or_archive() {
  local file="$1"
  local backup="$BACKUP_DIR/$file"
  if [[ -f "$backup" ]]; then
    mkdir -p "$(dirname "$file")"
    cp "$backup" "$file"
    echo "restored $file"
  elif [[ -e "$file" ]]; then
    mkdir -p ".forge-backups/rollback-archives"
    local archive=".forge-backups/rollback-archives/$(basename "$file").064c.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md"
restore_or_archive "docs/evidence/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md"
restore_or_archive "docs/evidence/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_CERTIFICATE_064C.md"
restore_or_archive "docs/evidence/forge-backend-domain-contracts-scope-audit-064c.json"
restore_or_archive "tools/termux/forge_064c_backend_domain_contracts_scope.sh"

echo "rollback 064C complete"
ROLLBACK
  python3 - "$rollback" "$BACKUP_DIR" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
backup = sys.argv[2]
text = path.read_text().replace("BACKUP_DIR_PLACEHOLDER", f'BACKUP_DIR="{backup}"')
path.write_text(text)
PY
  chmod +x "$rollback"
  pass "rollback script created: $rollback"
}

say_stage "STAGE 0 HEADER"
printf "PHASE=%s\n" "$PHASE"
printf "MODE=backend domain contracts scope documentation\n"
printf "BOUNDARY=docs/scope only; no UI mutation; no backend connection; no CRM; no calendar; no send; no auth; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to write 064C over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/architecture/source-truth/FORGE_BACKEND_MODULE_OWNERSHIP_MAP_064B.md"
  "docs/evidence/FORGE_BACKEND_MODULE_OWNERSHIP_MAP_064B.md"
  "docs/evidence/forge-backend-module-ownership-map-audit-064b.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/064c-backend-domain-contracts-scope-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for file in "${required_files[@]}"; do
  backup_file "$file"
done
write_rollback

say_stage "STAGE 4 APPLY DOCS"
mkdir -p tools/termux docs/architecture/source-truth docs/evidence
SCRIPT_SOURCE="$0"
if [[ -n "${BASH_SOURCE+x}" && -n "${BASH_SOURCE[0]:-}" ]]; then
  SCRIPT_SOURCE="${BASH_SOURCE[0]}"
fi
if [[ ! -f "$SCRIPT_SOURCE" ]]; then
  fail "runner source not found: $SCRIPT_SOURCE"
fi
cp "$SCRIPT_SOURCE" "tools/termux/forge_064c_backend_domain_contracts_scope.sh"
pass "copied runner into tools/termux"

cat > docs/architecture/source-truth/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md <<'MD'
# Forge Backend Domain Contracts Scope 064C

Status: SCOPED

Date: 2026-07-06

Phase:
`064C_BACKEND_DOMAIN_CONTRACTS_SCOPE`

Base:
`064B_BACKEND_MODULE_OWNERSHIP_MAP`

## Purpose

064C defines the backend domain contract scope required before Forge connects any real module adapter.

The scope converts the 064B ownership map into domain-level contracts for the business modules that the premium static preview already presents: clients, opportunities, quotes, policies, documents, follow-up, communications, calendar intent, profile/auth, settings, command actions, and supporting platform domains.

This phase is documentation and scope only. It does not connect a backend, mutate UI, run providers, write CRM records, create calendar items, deliver messages, authenticate users, or execute a real engine.

## Global Domain Contract Rule

No domain can be connected to a real backend until it has all of the following:

- canonical entity schema;
- read model envelope;
- write model envelope, even when writes remain blocked;
- action contract references;
- approval gate requirement;
- audit event schema;
- capability requirement;
- error envelope;
- freshness/source evidence policy;
- empty-state semantics;
- adapter boundary;
- blocked effects list;
- QA path.

## Domain Contract Inventory

| Domain | Scope Status | Canonical Entities | Required Read Contract | Required Action/Write Contract | Approval/Audit Requirement | Connection Rule |
|---|---|---|---|---|---|---|
| Client / CRM | DESIGN_REQUIRED | client, household, contact channel, consent, relationship, segment | client summary, client detail, client risk context, dedupe hints | create/update client remain blocked until CRM write model exists | required for every mutation or merge | read-only adapter can come only after client source ownership and freshness are defined |
| Opportunity / Pipeline | DESIGN_REQUIRED | opportunity, stage, probability, source, next action, owner, timeline | opportunity list, priority opportunity, pipeline stage read model | stage change, next action, close/lost, reassignment remain blocked | required for any stage or next-action mutation | no pipeline adapter until stage taxonomy is canonical |
| Quote / Cotizacion | DESIGN_REQUIRED | quote request, quote workspace, product, coverage, premium, assumptions, carrier evidence | quote preview read model, quote comparison, quote status | prepare quote preview allowed only as no-effect contract; issue/submit blocked | approval required before carrier-facing action | quote adapter must separate preview from carrier truth |
| Policy / Poliza | DESIGN_REQUIRED | policy, insured, coverage, premium, renewal, beneficiary, evidence link | policy summary, policy detail, renewal list, policy timeline | policy update, beneficiary update, renewal action blocked | approval and evidence required for any official-policy mutation | read-only first; write adapter later |
| Document / Evidence | DESIGN_REQUIRED | document, evidence item, extraction, OCR confidence, provenance, source file | document list, extraction summary, confidence report, source evidence | upload/import/classify contracts scoped separately; truth creation blocked | audit required for every evidence claim | no document truth until provenance registry is defined |
| Follow-up / Task | DESIGN_REQUIRED | task, reminder, follow-up reason, due date, owner, contact method | task list, risk follow-up, due/overdue summary | snooze, complete, reschedule, assign blocked until task write contract exists | approval required when task affects external workflow | read-only task view before task write adapter |
| Calendar Intent | DESIGN_REQUIRED | calendar intent, availability window, meeting draft, attendee, location | upcoming appointment read model, meeting draft preview | create/update/delete event blocked until adapter contract exists | explicit human approval required before external calendar mutation | design with approval/audit before adapter |
| Communication | DESIGN_REQUIRED | message draft, channel, recipient, template, approval artifact, delivery state | message draft preview, communication history read model | send/deliver blocked; draft generation preview-only until approval/delivery contract | approval artifact required before any delivery | no channel adapter until delivery gate is locked |
| Profile / Auth | DESIGN_REQUIRED | user, profile, role, tenant, session, identity provider, avatar | profile read model, role/capability context, account menu context | sign out/theme/settings actions remain preview-only until auth/settings contract | audit required for identity and capability changes | do not connect profile menu to real auth yet |
| Settings / Preferences | DESIGN_REQUIRED | setting, preference, theme, notification preference, workspace preference | settings read model, theme read model | update preference blocked until persistence and auth policy exist | audit optional for low-risk settings, required for security settings | design separately from auth |
| Command / Action Router | PARTIAL_FROM_PREVIEW | command, command result, action id, target, preview payload | command catalog, action registry, preview payload | action selection routes to preview payload until backend contracts exist | audit event required for real routing | keep preview-only until domain contracts are locked |
| Approval / Audit | PARTIAL_FROM_PREVIEW | approval request, approval artifact, audit event, evidence hash, decision | approval status, audit trail, blocked reason | approve/reject/revoke scoped in 064E | mandatory for any real effect | must be complete before write adapters |
| Capability / Permission | DESIGN_REQUIRED | capability, role, policy, module permission, effect type | capability context, allowed/blocked effects | capability evaluation contract only; no grants in 064C | audit required for permission changes | must be central, not per-widget |
| Backend API Boundary | DESIGN_REQUIRED | route, request, response, error, idempotency key, correlation id | API read response envelope | write response envelope with no-effect default | audit/correlation required | no route implementation until 064F |
| Error / Empty State | DESIGN_REQUIRED | error code, severity, recoverability, empty reason, stale reason | safe error read model, empty-state read model | retry/action hints preview-only | audit required for backend/action failures | define before first adapter |
| Sync / Freshness | DESIGN_REQUIRED | source timestamp, freshness status, sync status, conflict, stale warning | freshness envelope, source evidence envelope | sync write queue blocked | audit required for conflict resolution | define before backend read adapter |

## Required Contract Shape

Each backend domain contract should eventually define:

```text
domainId
domainName
owner
sourceOfTruth
canonicalEntities
readModels
writeModels
actionContracts
approvalPolicy
auditEvents
capabilities
errors
emptyStates
freshnessPolicy
adapterBoundary
blockedEffects
qaEvidence
```

## Explicit Non-Scope

064C does not authorize:

- UI mutation;
- backend route implementation;
- database schema implementation;
- CRM mutation;
- calendar creation;
- message delivery;
- authentication changes;
- provider execution;
- browser persistence behavior;
- browser request behavior;
- real engine execution.

## Recommended Next Work

064D should define backend read model contracts. It should turn these domain contracts into concrete read model envelopes for workspace, client, opportunity, quote, policy, task, document, communication, profile, settings, capability, error, empty-state, and freshness reads.

064E should then define approval and audit contracts.

064F should define backend API and adapter boundaries.

Only after those phases should Forge attempt a read-only backend adapter dry run.

## Final Decision

064C scopes the backend domain contracts required before real module connection.

DECISION=PASS_064C_BACKEND_DOMAIN_CONTRACTS_SCOPE

NEXT=064D_BACKEND_READ_MODEL_CONTRACTS_SCOPE
MD

cat > docs/evidence/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md <<'MD'
# Forge Backend Domain Contracts Scope 064C

Status: PASS

Phase:
`064C_BACKEND_DOMAIN_CONTRACTS_SCOPE`

## Result

064C converts the 064B backend ownership map into a scoped set of domain contracts.

Domains covered:

- Client / CRM
- Opportunity / Pipeline
- Quote / Cotizacion
- Policy / Poliza
- Document / Evidence
- Follow-up / Task
- Calendar Intent
- Communication
- Profile / Auth
- Settings / Preferences
- Command / Action Router
- Approval / Audit
- Capability / Permission
- Backend API Boundary
- Error / Empty State
- Sync / Freshness

## Boundary

This phase is documentation-only. No UI, backend adapter, provider, CRM, calendar, message, authentication, browser persistence, browser request, or real engine behavior was changed.

## Decision

DECISION=PASS_064C_BACKEND_DOMAIN_CONTRACTS_SCOPE

NEXT=064D_BACKEND_READ_MODEL_CONTRACTS_SCOPE
MD

cat > docs/evidence/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_CERTIFICATE_064C.md <<'MD'
# Forge Backend Domain Contracts Scope Certificate 064C

Status: CERTIFIED

Phase:
`064C_BACKEND_DOMAIN_CONTRACTS_SCOPE`

064C certifies that Forge backend domains now have a scoped contract inventory before any real module connection.

This certificate covers scope only. It does not certify backend implementation, data adapter behavior, CRM writes, calendar writes, message delivery, authentication, provider execution, browser persistence, browser request behavior, or real engine execution.

DECISION=PASS_064C_BACKEND_DOMAIN_CONTRACTS_SCOPE

NEXT=064D_BACKEND_READ_MODEL_CONTRACTS_SCOPE
MD

cat > docs/evidence/forge-backend-domain-contracts-scope-audit-064c.json <<'JSON'
{
  "phase": "064C_BACKEND_DOMAIN_CONTRACTS_SCOPE",
  "status": "PASS",
  "basePhase": "064B_BACKEND_MODULE_OWNERSHIP_MAP",
  "domainsScoped": [
    "client_crm",
    "opportunity_pipeline",
    "quote",
    "policy",
    "document_evidence",
    "followup_task",
    "calendar_intent",
    "communication",
    "profile_auth",
    "settings_preferences",
    "command_action_router",
    "approval_audit",
    "capability_permission",
    "backend_api_boundary",
    "error_empty_state",
    "sync_freshness"
  ],
  "requiredContractFields": [
    "domainId",
    "domainName",
    "owner",
    "sourceOfTruth",
    "canonicalEntities",
    "readModels",
    "writeModels",
    "actionContracts",
    "approvalPolicy",
    "auditEvents",
    "capabilities",
    "errors",
    "emptyStates",
    "freshnessPolicy",
    "adapterBoundary",
    "blockedEffects",
    "qaEvidence"
  ],
  "scopeOnly": true,
  "uiMutation": false,
  "backendConnection": false,
  "realEffectsEnabled": false,
  "next": "064D_BACKEND_READ_MODEL_CONTRACTS_SCOPE"
}
JSON
pass "wrote 064C docs and audit json"

say_stage "STAGE 5 UPDATE BUILD TREE / ROADMAP"
sync_body="## 064C Backend Domain Contracts Scope

Status: PASS / SCOPED.

064C converts the 064B backend module ownership map into a domain contract inventory before any real module connection.

Domains scoped:

- Client / CRM
- Opportunity / Pipeline
- Quote / Cotizacion
- Policy / Poliza
- Document / Evidence
- Follow-up / Task
- Calendar Intent
- Communication
- Profile / Auth
- Settings / Preferences
- Command / Action Router
- Approval / Audit
- Capability / Permission
- Backend API Boundary
- Error / Empty State
- Sync / Freshness

Global rule:

No real backend module connection is allowed until a domain has canonical entities, read model envelope, write model envelope, action contracts, approval policy, audit events, capabilities, error handling, empty-state semantics, freshness policy, adapter boundary, blocked effects, and QA evidence.

Artifacts:

- \`docs/architecture/source-truth/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md\`
- \`docs/evidence/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md\`
- \`docs/evidence/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_CERTIFICATE_064C.md\`
- \`docs/evidence/forge-backend-domain-contracts-scope-audit-064c.json\`

Boundary:

Documentation-only scope. No UI, backend connection, CRM, calendar, message, auth, provider, browser persistence, browser request, or real engine behavior is changed.

DECISION=PASS_064C_BACKEND_DOMAIN_CONTRACTS_SCOPE

NEXT=064D_BACKEND_READ_MODEL_CONTRACTS_SCOPE"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:BACKEND_DOMAIN_CONTRACTS_SCOPE_064C:START -->" "<!-- FORGEOS:BACKEND_DOMAIN_CONTRACTS_SCOPE_064C:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:BACKEND_DOMAIN_CONTRACTS_SCOPE_064C:START -->" "<!-- FORGEOS:BACKEND_DOMAIN_CONTRACTS_SCOPE_064C:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:BACKEND_DOMAIN_CONTRACTS_SCOPE_064C:START -->" "<!-- FORGEOS:BACKEND_DOMAIN_CONTRACTS_SCOPE_064C:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 6 NORMALIZE FILES"
changed_files=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md"
  "docs/evidence/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md"
  "docs/evidence/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_CERTIFICATE_064C.md"
  "docs/evidence/forge-backend-domain-contracts-scope-audit-064c.json"
  "tools/termux/forge_064c_backend_domain_contracts_scope.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 7 VALIDATION"
run_cmd bash -n tools/termux/forge_064c_backend_domain_contracts_scope.sh
run_cmd python3 -m json.tool docs/evidence/forge-backend-domain-contracts-scope-audit-064c.json
run_cmd rg -n "DECISION=PASS_064C_BACKEND_DOMAIN_CONTRACTS_SCOPE|NEXT=064D_BACKEND_READ_MODEL_CONTRACTS_SCOPE|client_crm|backend_api_boundary" docs/architecture/source-truth/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md docs/evidence/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md docs/evidence/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_CERTIFICATE_064C.md docs/evidence/forge-backend-domain-contracts-scope-audit-064c.json FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for documentation-only backend domain contracts scope"

say_stage "STAGE 8 SAFETY SCAN"
safety_files=(
  "docs/architecture/source-truth/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md"
  "docs/evidence/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md"
  "docs/evidence/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_CERTIFICATE_064C.md"
  "docs/evidence/forge-backend-domain-contracts-scope-audit-064c.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
safety_scan_file="$BACKUP_DIR/safety-scan-064c.txt"

for token in \
  "localStorage" \
  "sessionStorage" \
  "fetch(" \
  "XMLHttpRequest" \
  "navigator.mediaDevices" \
  "SpeechRecognition" \
  "providerRuntimeEnabled: true" \
  "networkCallsAllowed: true" \
  "browserStorageEnabled: true" \
  "mayCreateTruth: true" \
  "maySendMessage: true" \
  "mayWriteCrm: true" \
  "mayCreateCalendarEvent: true"
do
  if rg -n --fixed-strings "$token" "${safety_files[@]}" >> "$safety_scan_file" 2>/dev/null; then
    cat "$safety_scan_file"
    fail "safety scan found forbidden token: $token"
  fi
done
pass "safety scan clean"

say_stage "STAGE 9 STAGE AUTHORIZED FILES"
git add "${changed_files[@]}"

expected="$(mktemp)"
actual="$(mktemp)"
printf "%s\n" "${changed_files[@]}" | sort > "$expected"
git diff --cached --name-only | sort > "$actual"
run_cmd git diff --cached --name-only
if ! diff -u "$expected" "$actual"; then
  fail "staged files differ from authorized 064C file set"
fi
pass "only authorized files staged"
run_cmd git diff --cached --check

say_stage "STAGE 10 COMMIT PUSH"
run_cmd git commit -m "docs: scope backend domain contracts"
run_cmd git push origin HEAD:main

say_stage "STAGE 11 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_064C_BACKEND_DOMAIN_CONTRACTS_SCOPE_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=064D_BACKEND_READ_MODEL_CONTRACTS_SCOPE\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-064c.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
