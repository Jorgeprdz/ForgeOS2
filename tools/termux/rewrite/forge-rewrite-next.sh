#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib/common.sh"
usage(){ cat <<'EOF'
Usage: forge-rewrite-next.sh [--help]
Prints the current dynamic eligible set and first execution wave. Does not execute stages.
EOF
}
[ "${1:-}" = "--help" ] && { usage; exit 0; }
forge_cd_root
node - <<'NODE'
const fs = require('fs');
const roadmap = JSON.parse(fs.readFileSync('scaffolds/manifest/final-rewrite-roadmap.json','utf8'));
const wave = JSON.parse(fs.readFileSync('scaffolds/manifest/first-execution-wave.json','utf8'));
console.log('NEXT_OPERATION=SCAFFOLD');
console.log(`NEXT_ELIGIBLE_MODULES=${roadmap.eligible_now.SCAFFOLD.join(',')}`);
console.log(`NEXT_ELIGIBLE_WAVE=${wave.modules.map(module => module.module_id).join(',')}`);
console.log(`WAITING_FOR_DECISION=${roadmap.waiting_for_decision.join(',')}`);
console.log(`WAITING_FOR_EVIDENCE=${roadmap.waiting_for_evidence.join(',')}`);
NODE
