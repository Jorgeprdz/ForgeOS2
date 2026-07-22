#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
. "$SCRIPT_DIR/lib/manifest.sh"
usage(){ cat <<'EOF'
Usage: forge-rewrite-status.sh [--help]
Shows local rewrite state, architecture freeze, GO/NO-GO and declared stages.
EOF
}
[ "${1:-}" = "--help" ] && { usage; exit 0; }
forge_cd_root
if [ -f "$FORGE_ROOT/.forge/rewrite/state.json" ]; then cat "$FORGE_ROOT/.forge/rewrite/state.json"; else printf 'No local rewrite state.\n'; fi
node - <<'NODE'
const fs = require('fs');
for (const file of ['scaffolds/manifest/architecture-freeze.json','scaffolds/reports/rewrite-go-no-go.json','scaffolds/manifest/first-execution-wave.json']) {
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file,'utf8'));
  if (data.freeze_id) console.log(`ARCHITECTURE_FREEZE=${data.freeze_id} ${data.freeze_state}`);
  if (data.final_decision) console.log(`FINAL_DECISION=${data.final_decision}`);
  if (data.wave_id) console.log(`FIRST_WAVE_READY=${data.first_execution_wave_ready ? 'YES' : 'NO'} MODULES=${data.modules.map(module => module.module_id).join(',')}`);
}
NODE
forge_list_stages
exit 0
