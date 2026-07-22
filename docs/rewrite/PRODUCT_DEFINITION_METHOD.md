# Product Definition Method

Forge OS 2 product capabilities were derived from current repository evidence:

- `AGENTS.md`;
- active constitution and governance files;
- ADRs;
- README;
- architecture and scaffold documentation;
- platform contracts and validators;
- migration reports.

Original Forge OS code was not available as an authorized implementation source and was not copied. Where original behavior may matter but evidence is missing, capabilities are marked `REQUIRES_OWNER_DECISION` or blocked as `BLOCKED_REQUIRES_LEGACY_EVIDENCE`.

Capability classifications:

- `PRESERVE`: product behavior remains required, but implementation may be new.
- `REDESIGN`: value is recognized, but contracts or architecture must change.
- `DEFER`: valid future area, not authorized for this scaffold sequence.
- `REJECT`: prohibited by product identity, constitution or cleanup history.
- `REQUIRES_OWNER_DECISION`: insufficient evidence or unresolved scope.
