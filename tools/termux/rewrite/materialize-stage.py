#!/usr/bin/env python3
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

root = Path(os.environ["FORGE_ROOT"]).resolve()
stage_id = os.environ["FORGE_STAGE"]
manifest_path = root / "scaffolds/manifest/rewrite-stages.json"

def slug(value: str) -> str:
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", value)
    value = re.sub(r"[^A-Za-z0-9]+", "-", value)
    return value.strip("-").lower()

data = json.loads(manifest_path.read_text())
stages = data if isinstance(data, list) else data["stages"]
stage = next((s for s in stages if s.get("id") == stage_id), None)
if stage is None:
    raise SystemExit(f"MATERIALIZER_STAGE_NOT_FOUND stage={stage_id}")

outputs = [
    p for p in stage.get("files_to_generate", [])
    if p != f"scaffolds/reports/{stage_id}-evidence.json"
]

if not outputs:
    raise SystemExit(
        f"MATERIALIZER_NO_DECLARED_OUTPUTS stage={stage_id}"
    )

produces = stage.get("produces", [])
if len(outputs) != len(produces):
    raise SystemExit(
        f"MATERIALIZER_MAPPING_MISMATCH stage={stage_id} "
        f"produces={len(produces)} outputs={len(outputs)}"
    )

generated = []
for artifact_id, relative_path in zip(produces, outputs):
    target = (root / relative_path).resolve()
    if root not in target.parents:
        raise SystemExit(f"MATERIALIZER_PATH_ESCAPE path={relative_path}")

    target.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "artifact_id": artifact_id,
        "artifact_slug": slug(artifact_id),
        "stage_id": stage_id,
        "stage_name": stage.get("name"),
        "dependency_layer": stage.get("dependency_layer"),
        "artifact_wave": stage.get("artifact_wave"),
        "version": "1.0.0",
        "status": "ACTIVE",
        "generated_by": "forge-rewrite-materializer",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "constitutional_authority": stage.get("constitutional_authority", []),
        "capabilities": stage.get("capabilities", []),
        "functional_requirements": stage.get("functional_requirements", []),
        "boundaries": stage.get("boundaries", []),
        "adr": stage.get("adr", []),
        "contracts": stage.get("contracts", []),
        "consumes": stage.get("consumes", []),
        "acceptance_criteria": stage.get("acceptance_criteria", []),
        "allowed_operations": stage.get("allowed_operations", []),
        "prohibited_operations": stage.get("prohibited_operations", []),
        "fail_closed": True,
        "materialization": {
            "path": relative_path,
            "source_manifest": "scaffolds/manifest/rewrite-stages.json",
            "semantic_authority": "stage manifest",
            "manual_execution_authority": False
        }
    }
    target.write_text(json.dumps(payload, indent=2) + "\n")
    generated.append(relative_path)

print(f"GENERATOR=PASS stage={stage_id} generated={len(generated)}")
for path in generated:
    print(f"GENERATED_FILE={path}")
