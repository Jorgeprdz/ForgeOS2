#!/usr/bin/env bash
set -euo pipefail

PHASE="067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE"
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
  sync || true
  sleep 0.2 || true
  if command -v termux-clipboard-set >/dev/null 2>&1; then
    termux-clipboard-set < "$REPORT" && pass "autocopy_report -> clipboard" || warn "autocopy_report failed"
  else
    warn "termux-clipboard-set not available; report not auto-copied"
  fi
}

hold() {
  printf "${YELLOW}HOLD:${RESET} %s\n\n" "$1"
  say_stage "HOLD"
  echo "$1"
  echo "BLOCKED BY ROBOCOP LOCK 001"
  echo "DECISION=HOLD_${PHASE}"
  echo "Reporte: $REPORT"
  autocopy_report
  exit 1
}

fail() {
  printf "${RED}NO PASS:${RESET} %s\n\n" "$1"
  say_stage "NO PASS"
  echo "$1"
  echo "DECISION=NO_PASS_${PHASE}"
  echo "Reporte: $REPORT"
  autocopy_report
  exit 1
}

run_cmd() {
  echo
  echo "========== RUN =========="
  printf '%q ' "$@"
  echo
  "$@"
}

require_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    pass "$file"
  else
    hold "missing required file: $file"
  fi
}

backup_if_present() {
  local file="$1"
  if [[ -e "$file" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp -R "$file" "$BACKUP_DIR/$file"
    pass "backup $file"
  else
    pass "new file slot clear: $file"
  fi
}

norm() {
  python3 - "$1" <<'PY'
from pathlib import Path
import sys

p = Path(sys.argv[1])
text = p.read_text()
p.write_text("\n".join(line.rstrip() for line in text.splitlines()).rstrip() + "\n")
PY
}

append_block() {
  local file="$1" start="$2" end="$3" body="$4"
  python3 - "$file" "$start" "$end" "$body" <<'PY'
from pathlib import Path
import sys

p = Path(sys.argv[1])
start = sys.argv[2]
end = sys.argv[3]
body = sys.argv[4]
text = p.read_text()
block = f"{start}\n{body.rstrip()}\n{end}\n"
if start in text and end in text:
    before, rest = text.split(start, 1)
    _, after = rest.split(end, 1)
    text = before.rstrip() + "\n\n" + block + after.lstrip("\n")
else:
    text = text.rstrip() + "\n\n" + block
p.write_text(text)
PY
}

write_rollback() {
  local rollback="$BACKUP_DIR/rollback-067b.sh"
  cat > "$rollback" <<ROLLBACK
#!/usr/bin/env bash
set -euo pipefail
REPO="/storage/emulated/0/Forge OS"
BACKUP_DIR="$BACKUP_DIR"
cd "\$REPO"

restore_or_archive() {
  local file="\$1"
  local backup="\$BACKUP_DIR/\$file"
  if [[ -e "\$backup" ]]; then
    mkdir -p "\$(dirname "\$file")"
    cp -R "\$backup" "\$file"
    echo "restored \$file"
  elif [[ -e "\$file" ]]; then
    mkdir -p ".forge-backups/rollback-archives"
    local archive=".forge-backups/rollback-archives/\$(basename "\$file").067b.\$(date +%Y%m%d_%H%M%S)"
    mv "\$file" "\$archive"
    echo "archived created file \$file -> \$archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_067B.md"
restore_or_archive "docs/evidence/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_067B.md"
restore_or_archive "docs/evidence/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_CERTIFICATE_067B.md"
restore_or_archive "docs/evidence/forge-relationship-opportunity-signal-adapter-scope-audit-067b.json"
restore_or_archive "tools/termux/forge_067b_relationship_opportunity_signal_adapter_scope.sh"
echo "rollback 067B complete"
ROLLBACK
  chmod +x "$rollback"
  pass "rollback script created: $rollback"
}

allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_067B.md"
  "docs/evidence/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_067B.md"
  "docs/evidence/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_CERTIFICATE_067B.md"
  "docs/evidence/forge-relationship-opportunity-signal-adapter-scope-audit-067b.json"
  "tools/termux/forge_067b_relationship_opportunity_signal_adapter_scope.sh"
)

say_stage "STAGE 0 HEADER"
printf "PHASE=%s\n" "$PHASE"
printf "MODE=docs/scope only relationship opportunity signal adapter\n"
printf "BOUNDARY=no UI mutation; no backend real; no CRM write; no pipeline write; no task creation; no calendar creation; no send; no auth; no provider execution; no secret access; no browser persistence; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"
printf "ROBOCOP_GATE.Applicable_Constitution=Article 0; Decision Clarity First; Advisor-first; no invented truth; AI explains / Forge decides\n"
printf "ROBOCOP_GATE.Applicable_ADRs=066B1; 066D; 067A\n"
printf "ROBOCOP_GATE.Build_Tree_Area=Opportunity Pipeline / Relationship Opportunity Signal Adapter / Source Mapping\n"
printf "ROBOCOP_GATE.Discovery_Status=067A closed; 067B requested\n"
printf "ROBOCOP_GATE.Implementation_Readiness=docs-scope only; not implementation-ready\n"
printf "ROBOCOP_GATE.Miranda_Approval=required through validation evidence\n"
printf "ROBOCOP_GATE.Board_Approval_Status=not assumed\n"
printf "ROBOCOP_GATE.Scope_Boundary=067B only\n"
printf "ROBOCOP_GATE.Prohibited_Surfaces=UI; backend connection; writes; provider runtime; auth; secrets; browser persistence; real engine execution\n"
printf "ROBOCOP_GATE.Validation_Expectation=json; markers; diff checks; safety scans; staged boundary\n"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if ! git branch --show-current | rg -qx "main"; then
  hold "expected branch main"
fi
pass "branch main confirmed"

if git log -1 --oneline | rg -q "^f62ea8c "; then
  pass "expected 067A commit observed at HEAD"
else
  warn "HEAD is not f62ea8c; continuing only if 067A evidence validates"
fi

dirty_tracked="$(mktemp)"
allowed_tracked="$(mktemp)"
outside_dirty="$(mktemp)"
{ git diff --name-only; git diff --cached --name-only; } | sort -u > "$dirty_tracked"
printf "%s\n" "${allowed_paths[@]}" | sort -u > "$allowed_tracked"
if [[ -s "$dirty_tracked" ]]; then
  warn "tracked changes already present; checking they are limited to 067B authorized paths"
  if comm -23 "$dirty_tracked" "$allowed_tracked" > "$outside_dirty" && [[ -s "$outside_dirty" ]]; then
    cat "$outside_dirty"
    rm -f "$dirty_tracked" "$allowed_tracked" "$outside_dirty"
    hold "tracked worktree has changes outside 067B authorized paths"
  fi
  pass "pre-existing tracked changes are limited to 067B authorized paths"
fi
rm -f "$dirty_tracked" "$allowed_tracked" "$outside_dirty"

say_stage "STAGE 2 REQUIRED FILE CHECK"
[[ -f AGENTS.md ]] && pass "AGENTS.md present" || warn "AGENTS.md not present; continuing because source files are authoritative"
required_files=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_CANONICAL_SOURCE_MAPPING_SCOPE_067A.md"
  "docs/evidence/forge-opportunity-pipeline-canonical-source-mapping-scope-audit-067a.json"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK_066D.md"
  "docs/evidence/forge-opportunity-pipeline-read-only-adapter-decision-audit-066d.json"
  "relationship-opportunity-engine.js"
)
for file in "${required_files[@]}"; do require_file "$file"; done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/067b-relationship-opportunity-signal-adapter-scope-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
backup_targets=(
  "${required_files[@]}"
  "${allowed_paths[@]}"
)
for file in "${backup_targets[@]}"; do backup_if_present "$file"; done
write_rollback

say_stage "STAGE 4 DISCOVER 067A / SOURCE INPUTS"
python3 - <<'PY'
import json
from pathlib import Path

def load_json(path):
    return json.loads(Path(path).read_text())

def walk_values(obj):
    if isinstance(obj, dict):
        for key, value in obj.items():
            yield key, value
            yield from walk_values(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from walk_values(value)

def has_string(obj, expected):
    return any(value == expected for _, value in walk_values(obj) if isinstance(value, str))

def collect_true_markers(obj, prefix=""):
    risky = {
        "crmWrite", "pipelineWrite", "taskCreate", "calendarCreate",
        "messageSend", "authReal", "providerRuntime", "secretAccess",
        "browserPersistence", "realEngineExecution", "realEffectsAllowed",
        "realEffectsEnabled", "backendConnection",
    }
    hits = []
    if isinstance(obj, dict):
        for key, value in obj.items():
            path = f"{prefix}.{key}" if prefix else key
            if key in risky and value is True:
                hits.append(path)
            hits.extend(collect_true_markers(value, path))
    elif isinstance(obj, list):
        for index, value in enumerate(obj):
            hits.extend(collect_true_markers(value, f"{prefix}[{index}]"))
    return hits

audit_067a = load_json("docs/evidence/forge-opportunity-pipeline-canonical-source-mapping-scope-audit-067a.json")
audit_066d = load_json("docs/evidence/forge-opportunity-pipeline-read-only-adapter-decision-audit-066d.json")

observed = {
    "067aTopLevelKeys": sorted(audit_067a.keys()),
    "067aPhase": audit_067a.get("phase"),
    "067aStatus": audit_067a.get("status"),
    "067aDecision": audit_067a.get("decision"),
    "067aPrincipalSourceCandidate": audit_067a.get("principalSourceCandidate"),
    "067aNext": audit_067a.get("next"),
    "066dPhase": audit_066d.get("phase"),
    "066dStatus": audit_066d.get("status"),
    "066dDecision": audit_066d.get("decision"),
}
print("067B discovery observed:")
print(json.dumps(observed, indent=2, sort_keys=True))

errors = []
if not isinstance(audit_067a.get("status"), str) or not audit_067a.get("status").startswith("PASS"):
    errors.append(f"067A status must start with PASS, got {audit_067a.get('status')!r}")
if audit_067a.get("phase") != "067A_OPPORTUNITY_PIPELINE_CANONICAL_SOURCE_MAPPING_SCOPE":
    errors.append(f"067A phase mismatch: {audit_067a.get('phase')!r}")
if not has_string(audit_067a, "OPPORTUNITY_PIPELINE_CANONICAL_SOURCE_MAPPING_SCOPED"):
    errors.append("067A canonical source mapping decision not found")
if not has_string(audit_067a, "relationship-opportunity-engine.js"):
    errors.append("067A principal source candidate relationship-opportunity-engine.js not found")
if not has_string(audit_067a, "067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE"):
    errors.append("067A next phase 067B not found")
if not isinstance(audit_066d.get("status"), str) or not audit_066d.get("status").startswith("PASS"):
    errors.append(f"066D status must start with PASS, got {audit_066d.get('status')!r}")

true_markers = collect_true_markers({"067A": audit_067a, "066D": audit_066d})
if true_markers:
    errors.append(f"real-effect markers must not be true: {true_markers}")

if errors:
    print("067B input discovery did not satisfy gate:")
    for error in errors:
        print(f"- {error}")
    raise SystemExit(1)

print(json.dumps({
    "status": "PASS",
    "principalSourceCandidate": "relationship-opportunity-engine.js",
    "next": "067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE"
}, indent=2, sort_keys=True))
PY
pass "067A and source inputs verified after discovery"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
mkdir -p tools/termux docs/architecture/source-truth docs/evidence
target_script="tools/termux/forge_067b_relationship_opportunity_signal_adapter_scope.sh"
source_script="$(readlink -f "$0" 2>/dev/null || printf "%s" "$0")"
target_script_abs="$(readlink -f "$target_script" 2>/dev/null || printf "%s" "$target_script")"
if [[ "$source_script" == "$target_script_abs" ]]; then
  pass "script already running from repo -> $target_script"
else
  cp "$0" "$target_script"
  pass "script copied into repo -> $target_script"
fi

cat > docs/architecture/source-truth/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_067B.md <<'MD'
# Forge Relationship Opportunity Signal Adapter Scope 067B

Status: SCOPED

Phase:
`067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE`

Decision:
`RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPED`

Base:

- `067A_OPPORTUNITY_PIPELINE_CANONICAL_SOURCE_MAPPING_SCOPE`
- `066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK`
- `066B1_OPPORTUNITY_PIPELINE_EXISTING_MODULE_RECONCILIATION`

## Purpose

067B scopes a no-effect signal adapter lane from `relationship-opportunity-engine.js` into the future Opportunity Pipeline read model normalization path.

This phase does not implement the adapter and does not replace the 066B local/static shim.

## Source Candidate

Primary source candidate:
`relationship-opportunity-engine.js`

067B treats this module as a relationship-derived opportunity signal candidate, not as canonical opportunity truth.

## Adapter Boundary

The future adapter may read relationship opportunity signals and produce normalized signal envelopes. It must not create, update, delete, merge, mutate stage, write CRM, create tasks, create calendar events, send messages, call providers, access secrets, persist browser state, or execute real engines.

## Allowed Signal Inputs

- relationship strength signal;
- referral proximity signal;
- advisor/client interaction signal;
- detected need or intent signal;
- stale follow-up signal;
- relationship risk signal;
- source evidence reference;
- source freshness metadata.

## Required Signal Envelope

| Field | Requirement |
| --- | --- |
| `signal_id` | Stable deterministic id for preview/dry-run mapping |
| `source_module` | Must be `relationship-opportunity-engine.js` |
| `source_signal_type` | Explicit signal type, never invented |
| `client_ref` | Optional until canonical client ownership is mapped |
| `opportunity_candidate_ref` | Candidate-only reference, not opportunity truth |
| `confidence_preview` | Preview estimate only; never fact |
| `priority_hint` | Derived hint only; cannot mutate pipeline priority |
| `next_action_hint` | Draft recommendation only; no task/calendar/message action |
| `risk_flags` | Evidence-backed flags only |
| `source_evidence_ids` | Required for every signal |
| `freshness_metadata` | Required freshness status and timestamp/source label |
| `audit_event` | Must map to `read_model_used` or future signal-read audit |
| `blocked_effects` | Required blocked-effect list |
| `safety_flags` | All real-effect flags must remain false |

## Explicitly Not Authorized

- canonical opportunity creation;
- source-of-truth ownership claim;
- pipeline stage mutation;
- CRM write;
- task/calendar/message creation;
- quote or policy update;
- provider/runtime execution;
- relationship score as fact without evidence;
- forecast as fact;
- money or premium as real value;
- UI projection as source truth.

## Required Before Implementation

Before implementation, Forge must define:

- relationship signal input schema;
- signal envelope output schema;
- relationship source evidence rules;
- source freshness rules;
- empty state rules;
- safe error model;
- permission/capability model;
- no-effect adapter policy;
- audit event mapping;
- mapping bridge into Opportunity Pipeline read model normalization.

## Next Phase

Recommended next phase:

`067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE`

Reason:
After signal adapter scope, Forge should define how relationship-derived signals normalize into the locked Opportunity Pipeline read model without claiming canonical opportunity truth.

## Final

DECISION=PASS_067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE

LOCKED_DECISION=RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPED

NEXT=067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE
MD

cat > docs/evidence/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_067B.md <<'MD'
# Forge Relationship Opportunity Signal Adapter Scope Evidence 067B

Phase:
`067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE`

Status:
PASS

Decision:
`RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPED`

## Evidence Summary

067B scopes the relationship opportunity signal adapter lane selected by 067A.

It confirms:

- `relationship-opportunity-engine.js` is a signal source candidate, not canonical opportunity truth;
- signal inputs must be evidence-backed;
- output must be a no-effect signal envelope;
- no pipeline mutation or CRM write is allowed;
- 066B remains a temporary local/static/read-only shim;
- implementation remains blocked until schemas, freshness, evidence, errors, capability, and audit mapping are defined.

## Result

DECISION=PASS_067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE

LOCKED_DECISION=RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPED

NEXT=067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE
MD

cat > docs/evidence/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_CERTIFICATE_067B.md <<'MD'
# Forge Relationship Opportunity Signal Adapter Scope Certificate 067B

DECISION=PASS_067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE

LOCKED_DECISION=RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPED

NEXT=067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE

Certified:

- docs/scope only;
- no adapter implementation;
- no UI mutation;
- no backend real;
- no CRM write;
- no pipeline write;
- no task creation;
- no calendar creation;
- no communication delivery;
- no auth implementation;
- no provider execution;
- no secret access;
- no browser persistence;
- no real engine execution.
MD

cat > docs/evidence/forge-relationship-opportunity-signal-adapter-scope-audit-067b.json <<'JSON'
{
  "phase": "067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE",
  "status": "PASS",
  "decision": "RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPED",
  "basePhases": [
    "067A_OPPORTUNITY_PIPELINE_CANONICAL_SOURCE_MAPPING_SCOPE",
    "066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK",
    "066B1_OPPORTUNITY_PIPELINE_EXISTING_MODULE_RECONCILIATION"
  ],
  "sourceCandidate": "relationship-opportunity-engine.js",
  "sourceCandidateRole": "relationship_derived_opportunity_signal_source_candidate",
  "canonicalTruthClaimed": false,
  "temporaryShimPreserved": true,
  "allowedSignalInputs": [
    "relationship_strength_signal",
    "referral_proximity_signal",
    "advisor_client_interaction_signal",
    "detected_need_or_intent_signal",
    "stale_followup_signal",
    "relationship_risk_signal",
    "source_evidence_reference",
    "source_freshness_metadata"
  ],
  "requiredSignalEnvelopeFields": [
    "signal_id",
    "source_module",
    "source_signal_type",
    "client_ref",
    "opportunity_candidate_ref",
    "confidence_preview",
    "priority_hint",
    "next_action_hint",
    "risk_flags",
    "source_evidence_ids",
    "freshness_metadata",
    "audit_event",
    "blocked_effects",
    "safety_flags"
  ],
  "notAuthorized": [
    "canonical_opportunity_creation",
    "source_of_truth_ownership_claim",
    "pipeline_stage_mutation",
    "crm_write",
    "task_calendar_message_creation",
    "quote_or_policy_update",
    "provider_runtime_execution",
    "relationship_score_as_fact_without_evidence",
    "forecast_as_fact",
    "money_or_premium_as_real_value",
    "ui_projection_as_source_truth"
  ],
  "requiredBeforeImplementation": [
    "relationship_signal_input_schema",
    "signal_envelope_output_schema",
    "relationship_source_evidence_rules",
    "source_freshness_rules",
    "empty_state_rules",
    "safe_error_model",
    "permission_capability_model",
    "no_effect_adapter_policy",
    "audit_event_mapping",
    "opportunity_pipeline_read_model_normalization_bridge"
  ],
  "uiMutation": false,
  "backendConnection": false,
  "crmWrite": false,
  "pipelineWrite": false,
  "taskCreate": false,
  "calendarCreate": false,
  "messageSend": false,
  "authReal": false,
  "providerRuntime": false,
  "secretAccess": false,
  "browserPersistence": false,
  "realEngineExecution": false,
  "realEffectsAllowed": false,
  "realEffectsEnabled": false,
  "next": "067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE"
}
JSON
pass "wrote 067B scope docs and audit json"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
SYNC_BODY=$(cat <<'MD'
## 067B Relationship Opportunity Signal Adapter Scope

067B scopes the relationship opportunity signal adapter lane selected by 067A.

Decision:
`RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPED`

Source candidate:
`relationship-opportunity-engine.js`

Scope:

- relationship-derived opportunity signal source candidate;
- no canonical opportunity truth claim;
- no adapter implementation yet;
- no CRM write;
- no pipeline write or stage mutation;
- no task, calendar, or message action;
- no provider, auth, secret, storage, or real engine execution.

Required signal envelope:
`signal_id`, `source_module`, `source_signal_type`, `client_ref`, `opportunity_candidate_ref`, `confidence_preview`, `priority_hint`, `next_action_hint`, `risk_flags`, `source_evidence_ids`, `freshness_metadata`, `audit_event`, `blocked_effects`, and `safety_flags`.

DECISION=PASS_067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE

LOCKED_DECISION=RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPED

NEXT=067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE
MD
)

append_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGE:067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE:START -->" "<!-- FORGE:067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE:END -->" "$SYNC_BODY"
append_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGE:067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE:START -->" "<!-- FORGE:067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE:END -->" "$SYNC_BODY"
append_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGE:067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE:START -->" "<!-- FORGE:067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE:END -->" "$SYNC_BODY"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
for file in "${allowed_paths[@]}"; do norm "$file"; done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_067b_relationship_opportunity_signal_adapter_scope.sh
run_cmd python3 -m json.tool docs/evidence/forge-relationship-opportunity-signal-adapter-scope-audit-067b.json
run_cmd rg -n "067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE|PASS_067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE|RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPED|067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE|relationship-opportunity-engine.js" \
  docs/architecture/source-truth/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_067B.md \
  docs/evidence/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_067B.md \
  docs/evidence/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_CERTIFICATE_067B.md \
  docs/evidence/forge-relationship-opportunity-signal-adapter-scope-audit-067b.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check

say_stage "STAGE 9 SAFETY SCAN"
scan_files=(
  "docs/architecture/source-truth/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_067B.md"
  "docs/evidence/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_067B.md"
  "docs/evidence/FORGE_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_CERTIFICATE_067B.md"
  "docs/evidence/forge-relationship-opportunity-signal-adapter-scope-audit-067b.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
if rg -n "localStorage|sessionStorage|fetch\\(|XMLHttpRequest|navigator\\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\\s*true|networkCallsAllowed:\\s*true|browserStorageEnabled:\\s*true|mayCreateTruth:\\s*true|maySendMessage:\\s*true|mayWriteCrm:\\s*true|mayCreateCalendarEvent:\\s*true" "${scan_files[@]}"; then
  hold "safety scan found prohibited browser/runtime/action token"
fi
if rg -n "crmWrite: true|pipelineWrite: true|taskCreate: true|calendarCreate: true|messageSend: true|authReal: true|providerRuntime: true|secretAccess: true|browserPersistence: true|realEngineExecution: true|realEffectsAllowed: true|realEffectsEnabled: true|backendConnection: true|\\\"crmWrite\\\": true|\\\"pipelineWrite\\\": true|\\\"taskCreate\\\": true|\\\"calendarCreate\\\": true|\\\"messageSend\\\": true|\\\"authReal\\\": true|\\\"providerRuntime\\\": true|\\\"secretAccess\\\": true|\\\"browserPersistence\\\": true|\\\"realEngineExecution\\\": true|\\\"realEffectsAllowed\\\": true|\\\"realEffectsEnabled\\\": true|\\\"backendConnection\\\": true" "${scan_files[@]}"; then
  hold "safety scan found enabled real-effect marker"
fi
pass "safety scan clean"

say_stage "STAGE 10 OPTIONAL SCREENSHOT EVIDENCE"
TMPDIR="${TMPDIR:-/data/data/com.termux/files/usr/tmp}"
export TMPDIR
warn "not applicable: 067B is docs/scope only with no UI mutation"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
git add "${allowed_paths[@]}"
run_cmd git diff --cached --name-only
expected="$(mktemp)"
actual="$(mktemp)"
printf "%s\n" "${allowed_paths[@]}" | sort > "$expected"
git diff --cached --name-only | sort > "$actual"
if ! diff -u "$expected" "$actual"; then
  rm -f "$expected" "$actual"
  hold "staged file set differs from authorized files"
fi
rm -f "$expected" "$actual"
pass "only authorized files staged"
run_cmd git diff --cached --check

say_stage "STAGE 12 COMMIT PUSH"
git diff --cached --quiet && hold "nothing staged for commit"
run_cmd git commit -m "docs: scope relationship opportunity signal adapter"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE_COMMIT_PUSH_COMPLETE\n"
printf "DECISION=PASS_067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE\n"
printf "LOCKED_DECISION=RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPED\n"
printf "NEXT=067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-067b.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
