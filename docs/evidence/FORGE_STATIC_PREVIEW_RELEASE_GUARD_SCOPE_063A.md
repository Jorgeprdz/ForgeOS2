# Forge Static Preview Release Guard Scope 063A

Status:
PASS / SCOPE LOCKED.

Phase:
`063A_STATIC_PREVIEW_RELEASE_GUARD_SCOPE`

## Scope Summary

063A defines the contract for a future static preview release guard.

The future guard script is scoped as:
`tools/termux/forge_static_preview_release_guard.sh`

It must prevent a public PASS unless implementation, local QA, and public Pages QA are all aligned.

## Guard Contract

Required inputs:

- `PHASE`;
- `CACHE_VERSION`;
- `PUBLIC_URL`;
- `LOCAL_URL`;
- `REQUIRED_MARKERS`;
- `REQUIRED_VIEWPORTS`;
- `REQUIRED_COMMAND_TESTS`;
- `AUTHORIZED_FILES`;
- `NEXT_PHASE`.

Required outputs:

- audit JSON;
- evidence markdown;
- certificate markdown;
- closure markdown;
- report autocopy;
- clear PASS/FAIL token.

## Required Validation Areas

- tracked git state;
- unique phase cache bust;
- consistent `index.html` CSS/JS cache version;
- phase markers in JS/CSS;
- JS syntax;
- whitespace diff safety;
- prohibited-token safety scan;
- local server QA;
- public Pages QA;
- public HTML verification;
- public JS/CSS verification;
- desktop/tablet/mobile screenshots;
- command contract tests when applicable;
- no real effects.

## Decision

This is a scope lock only. The operational script is deferred to 063B.

DECISION=PASS_063A_STATIC_PREVIEW_RELEASE_GUARD_SCOPE

NEXT=063B_STATIC_PREVIEW_RELEASE_GUARD_IMPLEMENTATION
