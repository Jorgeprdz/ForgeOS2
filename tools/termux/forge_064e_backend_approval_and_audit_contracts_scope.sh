#!/usr/bin/env bash
set -euo pipefail

PHASE="064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE"
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
  local rollback="$BACKUP_DIR/rollback-064e.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").064e.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md"
restore_or_archive "docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md"
restore_or_archive "docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_CERTIFICATE_064E.md"
restore_or_archive "docs/evidence/forge-backend-approval-and-audit-contracts-scope-audit-064e.json"
restore_or_archive "tools/termux/forge_064e_backend_approval_and_audit_contracts_scope.sh"

echo "rollback 064E complete"
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
printf "MODE=backend approval and audit contracts scope documentation\n"
printf "BOUNDARY=docs/scope only; no UI mutation; no backend connection; no CRM; no calendar; no send; no auth; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to write 064E over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/architecture/source-truth/FORGE_BACKEND_READ_MODEL_CONTRACTS_SCOPE_064D.md"
  "docs/evidence/FORGE_BACKEND_READ_MODEL_CONTRACTS_SCOPE_064D.md"
  "docs/evidence/forge-backend-read-model-contracts-scope-audit-064d.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/064e-backend-approval-and-audit-contracts-scope-$(date +%Y%m%d_%H%M%S)"
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
cp "$SCRIPT_SOURCE" "tools/termux/forge_064e_backend_approval_and_audit_contracts_scope.sh"
pass "copied runner into tools/termux"

cat > docs/architecture/source-truth/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md <<'MD'
# Forge Backend Approval And Audit Contracts Scope 064E

Status: SCOPED

Date: 2026-07-06

Phase:
`064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE`

Base:
`064D_BACKEND_READ_MODEL_CONTRACTS_SCOPE`

## Purpose

064E defines the backend approval and audit contract layer required before Forge can connect any write-capable adapter or external-effect adapter.

064C scoped backend domains. 064D scoped backend read models. 064E scopes the approval, audit, evidence, capability, and idempotency rules that must surround any real effect.

This phase is documentation and scope only. It does not implement adapters, mutate UI, write CRM records, create calendar items, deliver messages, authenticate users, execute providers, or run a real engine.

## Global Approval Rule

Any action that can change truth, contact an external system, create an official artifact, schedule an event, deliver a message, or alter identity/settings must be blocked until it has:

- action contract id;
- target entity;
- current read model snapshot;
- proposed effect summary;
- required capability;
- approval requirement;
- approval artifact;
- audit correlation id;
- idempotency key;
- rollback or remediation note;
- blocked reason if not approved;
- immutable evidence link.

## Approval Request Contract

Every approval request must define:

```text
approvalRequestId
schemaVersion
actionId
domainId
targetType
targetId
requestedBy
requestedAt
readModelSnapshotId
proposedEffect
requiresHumanApproval
capabilityRequired
blockedReasons
previewPayload
approvalArtifact
expiresAt
status
auditCorrelationId
```

Allowed statuses:

- `draft`
- `preview_only`
- `requires_approval`
- `approved`
- `rejected`
- `expired`
- `revoked`
- `blocked`
- `executed`
- `failed`

## Approval Artifact Contract

Approval artifacts must be stable and reviewable:

```text
approvalArtifactId
approvalRequestId
humanReadableSummary
sourceEvidence
riskSummary
beforeSnapshot
afterPreview
blockedEffects
allowedEffect
reviewerId
decision
decisionAt
decisionReason
artifactHash
```

Rules:

- Any change to proposed effect invalidates prior approval.
- Any change to target entity invalidates prior approval.
- Any stale read model requires re-approval.
- Approval cannot be inferred from viewing, clicking, hovering, or opening a preview.
- Approval must be explicit.

## Audit Event Contract

Every meaningful read/action transition must emit an audit event shape:

```text
auditEventId
schemaVersion
correlationId
domainId
actionId
actorId
actorType
targetType
targetId
eventType
eventAt
sourceReadModelId
approvalRequestId
effectType
effectAllowed
effectExecuted
idempotencyKey
resultStatus
safeSummary
evidenceRefs
errorRef
```

Event types:

- `preview_created`
- `approval_requested`
- `approval_granted`
- `approval_rejected`
- `approval_revoked`
- `effect_blocked`
- `effect_attempted`
- `effect_succeeded`
- `effect_failed`
- `read_model_used`
- `stale_source_detected`
- `capability_denied`

## Idempotency Contract

Any future write/external-effect action must carry:

- idempotency key;
- target id;
- action id;
- actor id;
- requested effect hash;
- approval artifact id;
- expiration policy;
- duplicate handling policy.

No write-capable adapter can be connected without idempotency.

## Capability Contract

Approval is not permission.

Any effect requires both:

- required capability is present;
- human approval is present when the action requires it.

Capability evaluation must include:

- actor;
- role;
- tenant/workspace;
- domain;
- action id;
- target;
- effect type;
- blocked reasons.

## Domain Approval Matrix

| Domain | Effect Type | Approval Required | Audit Required | Capability Required | Connection Rule |
|---|---|---|---|---|---|
| Client / CRM | create/update/merge client | yes | yes | `client.write` | blocked until CRM write adapter and audit store exist |
| Opportunity / Pipeline | stage change, owner change, next action update | yes | yes | `opportunity.write` | blocked until stage taxonomy and approval artifact exist |
| Quote / Cotizacion | submit quote, issue official quote, send quote | yes | yes | `quote.prepare` or `quote.submit` | preview-only until carrier boundary exists |
| Policy / Poliza | policy update, renewal action, beneficiary update | yes | yes | `policy.write` | blocked until official evidence and remediation policy exist |
| Document / Evidence | create evidence truth, accept extraction | yes for truth creation | yes | `document.evidence.accept` | extraction alone is not truth |
| Follow-up / Task | complete, snooze, reassign, create task | conditional | yes | `task.write` | read-only until task write model exists |
| Calendar Intent | create/update/delete event | yes | yes | `calendar.write` | blocked until external calendar adapter is locked |
| Communication | deliver message or send notification | yes | yes | `message.send` | draft is allowed; delivery is blocked |
| Profile / Auth | identity/session/role change | yes for security changes | yes | `identity.write` | profile preview cannot mutate auth |
| Settings / Preferences | update preference | conditional | yes for persisted settings | `settings.write` | low-risk preferences still need persistence policy |
| Command / Action Router | route to real effect | yes if effectful | yes | per-domain capability | preview route remains default |
| Approval / Audit | approve/reject/revoke | yes by definition | yes | `approval.decide` | approval decisions are audited |
| Capability / Permission | grant/revoke capability | yes | yes | `capability.admin` | blocked until identity/auth contract |
| Backend API Boundary | execute write route | yes if effectful | yes | route capability | route cannot bypass approval/audit |
| Error / Empty State | retry effect | depends on effect | yes | original action capability | retries require idempotency |
| Sync / Freshness | resolve conflict | yes | yes | `sync.resolve` | stale/conflict actions blocked |

## Audit Storage Requirement

Real effects require a durable audit store. Until that exists:

- effects remain preview-only;
- approval artifacts remain documentation contracts;
- audit events can be shaped but not treated as durable truth;
- no external-effect adapter can be locked.

## Explicit Non-Scope

064E does not authorize:

- adapter implementation;
- audit database implementation;
- approval UI mutation;
- backend route implementation;
- CRM mutation;
- calendar creation;
- message delivery;
- authentication changes;
- provider execution;
- browser persistence behavior;
- browser request behavior;
- real engine execution.

## Recommended Next Work

064F should define backend API and adapter boundaries, including how routes prove capability, approval, idempotency, and audit.

064G should define a read-only backend adapter dry run only after write/external effects remain explicitly blocked.

## Final Decision

064E scopes backend approval and audit contracts for all domains.

DECISION=PASS_064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE

NEXT=064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE
MD

cat > docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md <<'MD'
# Forge Backend Approval And Audit Contracts Scope 064E

Status: PASS

Phase:
`064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE`

## Result

064E defines the approval and audit contract layer required before any write-capable or external-effect backend adapter can be connected.

Contracts scoped:

- approval request;
- approval artifact;
- audit event;
- idempotency;
- capability evaluation;
- domain approval matrix;
- audit storage requirement.

## Boundary

This phase is documentation-only. No UI, backend adapter, provider, CRM, calendar, message, authentication, browser persistence, browser request, or real engine behavior was changed.

## Decision

DECISION=PASS_064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE

NEXT=064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE
MD

cat > docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_CERTIFICATE_064E.md <<'MD'
# Forge Backend Approval And Audit Contracts Scope Certificate 064E

Status: CERTIFIED

Phase:
`064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE`

064E certifies that approval and audit contracts are scoped before Forge connects any write-capable or external-effect backend adapter.

This certificate covers scope only. It does not certify adapter implementation, backend route behavior, CRM writes, calendar writes, message delivery, authentication, provider execution, browser persistence, browser request behavior, or real engine execution.

DECISION=PASS_064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE

NEXT=064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE
MD

cat > docs/evidence/forge-backend-approval-and-audit-contracts-scope-audit-064e.json <<'JSON'
{
  "phase": "064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE",
  "status": "PASS",
  "basePhase": "064D_BACKEND_READ_MODEL_CONTRACTS_SCOPE",
  "contractsScoped": [
    "approval_request",
    "approval_artifact",
    "audit_event",
    "idempotency",
    "capability_evaluation",
    "domain_approval_matrix",
    "audit_storage_requirement"
  ],
  "approvalStatuses": [
    "draft",
    "preview_only",
    "requires_approval",
    "approved",
    "rejected",
    "expired",
    "revoked",
    "blocked",
    "executed",
    "failed"
  ],
  "auditEventTypes": [
    "preview_created",
    "approval_requested",
    "approval_granted",
    "approval_rejected",
    "approval_revoked",
    "effect_blocked",
    "effect_attempted",
    "effect_succeeded",
    "effect_failed",
    "read_model_used",
    "stale_source_detected",
    "capability_denied"
  ],
  "scopeOnly": true,
  "uiMutation": false,
  "backendConnection": false,
  "realEffectsEnabled": false,
  "next": "064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE"
}
JSON
pass "wrote 064E docs and audit json"

say_stage "STAGE 5 UPDATE BUILD TREE / ROADMAP"
sync_body="## 064E Backend Approval And Audit Contracts Scope

Status: PASS / SCOPED.

064E defines the approval and audit contract layer required before Forge can connect any write-capable or external-effect backend adapter.

Contracts scoped:

- approval request
- approval artifact
- audit event
- idempotency
- capability evaluation
- domain approval matrix
- audit storage requirement

Global rule:

Any real effect requires both capability and approval when approval is required. Approval is explicit and cannot be inferred from viewing, clicking, hovering, or opening a preview.

Artifacts:

- \`docs/architecture/source-truth/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md\`
- \`docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md\`
- \`docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_CERTIFICATE_064E.md\`
- \`docs/evidence/forge-backend-approval-and-audit-contracts-scope-audit-064e.json\`

Boundary:

Documentation-only scope. No UI, backend connection, CRM, calendar, message, auth, provider, browser persistence, browser request, or real engine behavior is changed.

DECISION=PASS_064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE

NEXT=064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E:START -->" "<!-- FORGEOS:BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E:START -->" "<!-- FORGEOS:BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E:START -->" "<!-- FORGEOS:BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 6 NORMALIZE FILES"
changed_files=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md"
  "docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md"
  "docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_CERTIFICATE_064E.md"
  "docs/evidence/forge-backend-approval-and-audit-contracts-scope-audit-064e.json"
  "tools/termux/forge_064e_backend_approval_and_audit_contracts_scope.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 7 VALIDATION"
run_cmd bash -n tools/termux/forge_064e_backend_approval_and_audit_contracts_scope.sh
run_cmd python3 -m json.tool docs/evidence/forge-backend-approval-and-audit-contracts-scope-audit-064e.json
run_cmd rg -n "DECISION=PASS_064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE|NEXT=064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE|approvalRequestId|auditEventId|capability_denied" docs/architecture/source-truth/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_CERTIFICATE_064E.md docs/evidence/forge-backend-approval-and-audit-contracts-scope-audit-064e.json FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for documentation-only backend approval/audit contracts scope"

say_stage "STAGE 8 SAFETY SCAN"
safety_files=(
  "docs/architecture/source-truth/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md"
  "docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md"
  "docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_CERTIFICATE_064E.md"
  "docs/evidence/forge-backend-approval-and-audit-contracts-scope-audit-064e.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
safety_scan_file="$BACKUP_DIR/safety-scan-064e.txt"

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
  fail "staged files differ from authorized 064E file set"
fi
pass "only authorized files staged"
run_cmd git diff --cached --check

say_stage "STAGE 10 COMMIT PUSH"
run_cmd git commit -m "docs: scope backend approval and audit contracts"
run_cmd git push origin HEAD:main

say_stage "STAGE 11 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-064e.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
