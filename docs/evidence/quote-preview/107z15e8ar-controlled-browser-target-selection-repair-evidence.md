# 107Z15E8AR Controlled Browser Target Selection Repair Evidence

Status: PASS

## Result

- Previous proof: `/storage/emulated/0/ForgeGemini/Reports/107Z15E8A_20260710_154504/107Z15E8A_PROOF_20260710_154504.json`
- Previous target: `utils.js`
- Previous target credible: false
- Previous target score: 20
- Decision: `PREVIOUS_TARGET_REJECTED_REPLACEMENT_SELECTED`
- Final target: `manager-os/provider-runtime/provider-runtime-boundary-contract.js`
- Source change authorized: true
- Candidate count: 151
- Credible candidate count: 6

## Previous target evidence

- Direct integration: 0
- Boundary evidence: 28
- Semantic evidence: 0
- Generic-name penalty: 45
- Root-file penalty: 30
- Strong evidence classes: 1

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

## Safety

- Source code written: false
- PDF read executed: false
- Controlled browser executed: false
- localStorage write executed: false
- Backend connection: false
- Quote truth allowed: false

## Next

`107Z15E8B_MINIMAL_CONTROLLED_BROWSER_INTEGRATION_IMPLEMENTATION_GATE`
