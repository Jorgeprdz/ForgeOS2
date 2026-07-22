# SG-018 - Legacy Reintroduction Guard

Canonical order: 3.

Layer: `LEGACY_CONTROL`.

Status: `READY`.

Depends on: `SG-001`, `SG-002`.

Produces: `legacy_reintroduction_denylist`, `legacy_absence_validation_policy`.

This stage is part of the dependency-ordered Forge OS 2 rewrite sequence. It must be executed through Bash-based Termux tooling and must not be selected by numeric SG order.
