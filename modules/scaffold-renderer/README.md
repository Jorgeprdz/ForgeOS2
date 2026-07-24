# MOD-SCAFFOLD-RENDERER

Status: `WAVE 3 REVIEW PACKAGE / NOT INSTALLED`

## Responsibility

Render one exact, authorized, conflict-free Wave 2 plan into deterministic UTF-8 bytes and place those bytes in an isolated temporary staging directory outside the repository.

## Public exports

- `ScaffoldRenderError`
- `DEFAULT_LIMITS`
- `extractTemplateTokens`
- `normalizeText`
- `removeStagingDirectory`
- `renderScaffoldInMemory`
- `renderTextTemplate`
- `sha256NormalizedText`
- `stageRenderedScaffold`
- `verifyStagedScaffold`

## Security boundary

The renderer has no shell, network, AI, provider, Git, deployment, or repository-apply operation. Template values are scalar substitutions only. Templates cannot execute JavaScript or commands.

## Determinism boundary

The renderer:

1. normalizes template and values;
2. renders twice;
3. compares bytes and hashes;
4. finalizes the dry-run plan with output hashes;
5. stages exact bytes;
6. re-reads and verifies every staged file.
