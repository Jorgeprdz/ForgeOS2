# Forge OS 2.1

Forge OS 2.1 is a clean, deterministic rewrite of the Forge runtime.

The repository keeps the ratified governance, ADR, constitutional, architectural,
contract, and owner-decision record. The previous runtime, rewrite machinery,
generated scaffolds, reports, adapters, and application implementation are removed
from this branch.

## Commands

```bash
bash tools/forge doctor
bash tools/forge status
bash tools/forge plan MOD-CARRIER-SCOPE
bash tools/forge run MOD-CARRIER-SCOPE
bash tools/forge advance MOD-CARRIER-SCOPE implementation_complete
bash tools/forge validate MOD-CARRIER-SCOPE
npm test
```

## Runtime rules

- One canonical manifest: `forge/modules.json`
- One state file per module: `.forge21/state/<MODULE>.json`
- Sequential state transitions only
- Timestamped validation receipts under `.forge21/receipts/`
- No hidden `FORGE_ROOT` prerequisite
- Governance is never mutated by runtime commands
