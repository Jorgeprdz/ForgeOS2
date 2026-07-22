#!/usr/bin/env python3

from __future__ import annotations

import difflib
import re
import sys
from pathlib import Path

ROOT = Path("docs/architecture/scaffolds/instances")

GROUPS = {
    "domains": sorted((ROOT / "domains").glob("*DOMAIN_RESPONSIBILITY.md")),
    "source-truth": sorted((ROOT / "source-truth").glob("*OWNERSHIP.md")),
    "boundaries": sorted((ROOT / "boundaries").glob("*BOUNDARY.md")),
}

LABEL_RE = re.compile(r"\bOwner evidence\s*:", re.IGNORECASE)
INVERTED_RE = re.compile(
    r"\bOwner evidence\s+is\s+([^.\n]+(?:'s [^.\n]+)?)\.",
    re.IGNORECASE,
)
ADR_IS_EVIDENCE_RE = re.compile(
    r"\b(ADR-\d{3}(?:'s [^.\n]+)?)\s+is\s+owner evidence\.",
    re.IGNORECASE,
)
ADR_RE = re.compile(r"\bADR-\d{3}\b")


def authority_span(text: str) -> tuple[int, int, str] | None:
    match = re.search(
        r"(?ms)^## Authority\s*\n(.*?)(?=^## |\Z)",
        text,
    )
    if not match:
        return None
    return match.start(1), match.end(1), match.group(1)


def derive_owner_evidence(authority: str) -> str | None:
    adrs = []
    for adr in ADR_RE.findall(authority):
        if adr != "ADR-020" and adr not in adrs:
            adrs.append(adr)

    if len(adrs) == 1:
        return adrs[0]

    return None


def repair_file(path: Path) -> tuple[str, str, str]:
    original = path.read_text(encoding="utf-8")
    updated = original

    span = authority_span(updated)
    if span is None:
        return original, updated, "UNRESOLVED:NO_AUTHORITY_SECTION"

    start, end, authority = span

    if LABEL_RE.search(authority):
        return original, updated, "ALREADY_VALID"

    repaired_authority, count = INVERTED_RE.subn(
        lambda m: f"Owner evidence: {m.group(1).strip()}.",
        authority,
        count=1,
    )

    if count == 0:
        repaired_authority, count = ADR_IS_EVIDENCE_RE.subn(
            lambda m: f"Owner evidence: {m.group(1).strip()}.",
            authority,
            count=1,
        )

    if count == 0:
        evidence = derive_owner_evidence(authority)
        if evidence is None:
            return original, updated, "UNRESOLVED:AMBIGUOUS_OR_MISSING_EVIDENCE"

        stripped = authority.rstrip()
        suffix = authority[len(stripped):]
        separator = "" if stripped.endswith((" ", "\n")) else " "
        repaired_authority = (
            f"{stripped}{separator}Owner evidence: {evidence}.{suffix}"
        )

    updated = updated[:start] + repaired_authority + updated[end:]

    updated_span = authority_span(updated)
    if updated_span is None or not LABEL_RE.search(updated_span[2]):
        return original, original, "UNRESOLVED:POST_REPAIR_VALIDATION_FAILED"

    return original, updated, "REPAIRED"


def main() -> int:
    files = [path for paths in GROUPS.values() for path in paths]

    if not files:
        print(f"ERROR=No se encontraron instancias SG-002 en {ROOT}")
        return 2

    repaired: list[Path] = []
    already_valid: list[Path] = []
    unresolved: list[tuple[Path, str]] = []
    diffs: list[str] = []

    print("SG002_OWNER_EVIDENCE_AUTOREPAIR")
    print(f"ROOT={ROOT}")
    print(f"SCANNED_FILES={len(files)}")

    for group, paths in GROUPS.items():
        print(f"DISCOVERED_{group.upper().replace('-', '_')}={len(paths)}")

    for path in files:
        original, updated, status = repair_file(path)

        if status == "REPAIRED":
            path.write_text(updated, encoding="utf-8")
            repaired.append(path)

            diffs.extend(
                difflib.unified_diff(
                    original.splitlines(),
                    updated.splitlines(),
                    fromfile=f"a/{path}",
                    tofile=f"b/{path}",
                    lineterm="",
                )
            )
        elif status == "ALREADY_VALID":
            already_valid.append(path)
        else:
            unresolved.append((path, status))

    print(f"ALREADY_VALID={len(already_valid)}")
    print(f"REPAIRED_FILES={len(repaired)}")

    for path in repaired:
        print(f"REPAIRED={path}")

    print(f"UNRESOLVED_FILES={len(unresolved)}")
    for path, reason in unresolved:
        print(f"UNRESOLVED={path} | {reason}")

    remaining = []
    for path in files:
        text = path.read_text(encoding="utf-8")
        span = authority_span(text)
        if span is None or not LABEL_RE.search(span[2]):
            remaining.append(path)

    print(f"POST_VALIDATION_MISSING={len(remaining)}")
    for path in remaining:
        print(f"MISSING={path}")

    print("===== GENERATED_DIFF =====")
    if diffs:
        print("\n".join(diffs))
    else:
        print("NO_CONTENT_CHANGES")

    if unresolved or remaining:
        print("RESULT=FAIL_CLOSED")
        return 1

    print("RESULT=PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
