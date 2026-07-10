# 107Z15E8B3 Dedicated Browser Confirmation Persistence Adapter Authorization

Status: PASS

## Decision

`AUTHORIZE_NEW_DEDICATED_CONFIRMATION_PERSISTENCE_ADAPTER`

The repository has no existing browser-to-Quote Preview persistence bridge. Further target discovery is closed for this scope. A dedicated adapter is required.

## Scope ID

`QUOTE_PREVIEW_CONTROLLED_BROWSER_CONFIRMATION_PERSISTENCE_ADAPTER_V1`

## Authorized source files

- `platform/adapters/quote-preview/quote-preview-controlled-browser-confirmation-persistence-adapter.js`
- `platform/adapters/quote-preview/quote-preview-controlled-browser-confirmation-persistence-adapter.test.js`

No other runtime source file may be changed by the implementation gate.

## Authorized API

`function persistConfirmedQuotePreviewPdfResult(request = {})`

Export:

`persistConfirmedQuotePreviewPdfResult`

## Mandatory confirmation boundary

- `confirmed` must be literal `true`.
- No store write may occur before that assertion passes.
- The edit path must not persist.
- The adapter does not own the modal or browser UI.
- The adapter accepts an already-created official store interface through dependency injection.

## Authorized flow

1. assert request.confirmed === true before any store write
2. validate injected official store interface
3. build exactly eight fields with buildQuotePreviewPdfCanonicalPersistenceInput({ nativeResult, context })
4. build recordInput with previewResultId, SCHEMA_VERSION, createdAt, expiresAt, fields, ambiguity, source
5. validate expected record with contract.createRecord and contract.validateRecord
6. write recordInput through store.writePreviewResult(recordInput)
7. read persisted record through store.readPreviewResult(identity)
8. validate the read record with contract.validateRecord
9. verify deep equality between expected and read record
10. return frozen { identity, record }

## Canonical fields

- `name`
- `family`
- `product`
- `insured`
- `sumAssured`
- `annualPremium`
- `plannedOrAvePremium`
- `coveragePeriod`

## Prohibited scope

- any source file other than the two allowed files
- utils.js
- manager-os/provider-runtime/provider-runtime-boundary-contract.js
- the existing extraction engine
- the canonical bridge
- the persistence coordinator
- the persistence contract
- the persistence store
- browser UI wiring
- modal implementation
- direct localStorage access
- new storage engine
- generic cross-domain bridge
- hardcoded canonical field values
- persistence before explicit confirmation
- promotion of PDF extraction to official quote truth

## Next gate

`107Z15E8C_DEDICATED_BROWSER_CONFIRMATION_PERSISTENCE_ADAPTER_SCOPED_IMPLEMENTATION_GATE`
