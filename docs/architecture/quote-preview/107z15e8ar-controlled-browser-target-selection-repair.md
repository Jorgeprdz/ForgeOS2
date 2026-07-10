# 107Z15E8AR Controlled Browser Target Selection Repair

Status: PASS

## Why this repair exists

The prior target was `utils.js`. A generic utility filename can collect broad lexical signals without being the actual controlled-browser Quote Preview integration boundary. This gate applies stricter source evidence before any runtime source change.

## Decision

- Target decision: `PREVIOUS_TARGET_REJECTED_REPLACEMENT_SELECTED`
- Previous target: `utils.js`
- Final target: `manager-os/provider-runtime/provider-runtime-boundary-contract.js`
- Source change authorized: **true**

## Allowed source files

- `manager-os/provider-runtime/provider-runtime-boundary-contract.js`

## Scoring controls

- Direct canonical builder and official store signals carry the highest weight.
- Browser and confirmation evidence is evaluated separately from generic vocabulary.
- Quote Preview semantics in the file path are rewarded.
- Generic utility filenames receive a penalty.
- Root-level files receive an additional penalty.
- A credible target requires multiple independent evidence classes.

## Implementation boundary

`PDF extraction → canonical builder → confirmation modal → explicit accept → official store write → identity readback`

## Top candidates

1. `manager-os/provider-runtime/provider-runtime-boundary-contract.js` — score=104, credible=true, directIntegration=0, boundaryEvidence=11, semanticEvidence=2
2. `manager-os/static-preview-public-surface-decision/static-preview-public-surface-decision-boundary-contract.js` — score=69, credible=true, directIntegration=0, boundaryEvidence=3, semanticEvidence=2
3. `platform/app/runtime-listeners.js` — score=66, credible=true, directIntegration=0, boundaryEvidence=8, semanticEvidence=1
4. `manager-os/static-preview-deployment/static-preview-deployment-boundary-contract.js` — score=59, credible=true, directIntegration=0, boundaryEvidence=1, semanticEvidence=2
5. `manager-os/github-pages-static-preview/github-pages-static-preview-boundary-contract.js` — score=57, credible=true, directIntegration=0, boundaryEvidence=1, semanticEvidence=2
6. `platform/navigation-runtime.js` — score=57, credible=true, directIntegration=0, boundaryEvidence=5, semanticEvidence=1
7. `platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b.js` — score=147, credible=false, directIntegration=0, boundaryEvidence=0, semanticEvidence=18
8. `platform/adapters/quote-preview/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js` — score=147, credible=false, directIntegration=0, boundaryEvidence=0, semanticEvidence=23
9. `platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js` — score=129, credible=false, directIntegration=0, boundaryEvidence=0, semanticEvidence=14
10. `platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js` — score=123, credible=false, directIntegration=0, boundaryEvidence=0, semanticEvidence=13

## Next gate

`107Z15E8B_MINIMAL_CONTROLLED_BROWSER_INTEGRATION_IMPLEMENTATION_GATE`
