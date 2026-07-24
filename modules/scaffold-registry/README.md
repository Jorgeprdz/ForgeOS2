# MOD-SCAFFOLD-REGISTRY

Status: `WAVE 2 REVIEW PACKAGE / NOT INSTALLED`

## Responsibility

Own deterministic loading, validation, indexing, hashing, listing, and exact-reference resolution for scaffold definitions.

## Boundaries

- No implicit `latest`.
- No range resolution.
- No registry writes.
- No template reads.
- No output planning.
- No rendering.
- No Git behavior.
- No authority inference.

Every definition is validated by `MOD-SCAFFOLD-CONTRACTS`.
