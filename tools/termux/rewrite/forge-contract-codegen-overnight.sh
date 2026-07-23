#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

FORGE_ROOT="${FORGE_ROOT:-/mnt/sdcard/Forge OS v2}"
EXPORT_ROOT="${EXPORT_ROOT:-/storage/emulated/0/ForgeGemini}"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$EXPORT_ROOT/forge-contract-codegen-$STAMP.log"

cd "$FORGE_ROOT"
mkdir -p "$EXPORT_ROOT"

exec > >(tee -a "$LOG_FILE") 2>&1

printf '=== FORGE CONTRACT CODEGEN OVERNIGHT ===\n'
printf 'STARTED_AT=%s\n' "$(date --iso-8601=seconds)"
printf 'BRANCH=%s\n' "$(git branch --show-current)"
printf 'HEAD=%s\n' "$(git rev-parse --short HEAD)"
printf 'LOG_FILE=%s\n' "$LOG_FILE"

if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  printf 'CODEGEN_RESULT=STOPPED\n'
  printf 'STOP_REASON=DIRTY_WORKTREE\n'
  git status --short --untracked-files=all
  exit 20
fi

bash tools/termux/rewrite/forge-rewrite-launch.sh validate

node tools/codegen/generate-contract-runtime.mjs
node tools/codegen/validate-contract-runtime.mjs
node --test tests/contracts/contract-runtime.test.mjs

npm test
npm run lint
npm run scaffold:validate

git add \
  platform/contracts/generated \
  tools/codegen \
  tools/termux/rewrite/forge-contract-codegen-overnight.sh \
  tests/contracts \
  scaffolds/reports/contract-codegen-report.json

if git diff --cached --quiet; then
  printf 'CODEGEN_COMMIT=NOT_REQUIRED\n'
else
  git commit -m \
    "feat(codegen): generate constitutional contract runtime"

  git push origin "$(git branch --show-current)"

  printf 'CODEGEN_COMMIT=%s\n' "$(git rev-parse --short HEAD)"
fi

bash tools/termux/rewrite/forge-rewrite-launch.sh validate

printf 'CODEGEN_RESULT=COMPLETE\n'
printf 'GENERATED_RUNTIME=platform/contracts/generated\n'
printf 'READINESS_REPORT=scaffolds/reports/contract-codegen-report.json\n'
printf 'FINAL_HEAD=%s\n' "$(git rev-parse --short HEAD)"
printf 'COMPLETED_AT=%s\n' "$(date --iso-8601=seconds)"
printf 'SESSION_REMAINS_OPEN=YES\n'
