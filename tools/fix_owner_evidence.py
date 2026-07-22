#!/usr/bin/env python3

from pathlib import Path
import re

ROOT = Path("docs/architecture/scaffolds")

modified = []

patterns = [
    (
        re.compile(r"Owner evidence is (.+?)(\.)?$", re.IGNORECASE),
        lambda m: f"Owner evidence: {m.group(1).rstrip('.')}.",
    ),
    (
        re.compile(r"(ADR-[A-Za-z0-9./ -]+?) is owner evidence\.", re.IGNORECASE),
        lambda m: f"Owner evidence: {m.group(1).strip()}.",
    ),
]

for f in ROOT.rglob("*.md"):
    text = f.read_text(encoding="utf-8")
    original = text

    for rx, repl in patterns:
        text = rx.sub(repl, text)

    if text != original:
        f.write_text(text, encoding="utf-8")
        modified.append(str(f))

print(f"FILES_MODIFIED={len(modified)}")
for f in modified:
    print(f)
