# 107Z15S1 — Canonical schema correction authorization

Status: **PASS**

## Decision

The exact eight-field canonical confirmation schema is preserved.

The mismatch found in 107Z15S is an ownership mismatch, not a reason to delete,
add or rename fields.

## Field ownership

### Engine-owned fields (6)

- `product`
- `insured`
- `sumAssured`
- `annualPremium`
- `plannedOrAvePremium`
- `coveragePeriod`

### Adapter-derived fields (2)

- `name`
- `family`

## Authorized correction

Only the existing adapter may change:

`platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js`

The next gate may expose or reuse the adapter's existing successful canonical
projection. It must reuse existing `getField` aliases and derivation behavior
rather than create parallel mapping logic.

## Explicitly forbidden

- Adding, removing or renaming canonical fields
- A new runtime module, engine, cache or bridge
- Manual mapping or guessed aliases
- Source changes outside the existing adapter
- Real PDF, OCR, provider, backend, official quote or quote truth effects

## Required proof

The implementation gate must prove:

1. Six engine-owned fields are projected.
2. Two adapter-owned fields are derived.
3. The exact eight-field packet passes the existing validator.
4. Two synthetic variants produce differential output.
5. Chromium persistence and modal round trip pass.
6. No unauthorized source path changes.

## Next gate

`107Z15S2_EXISTING_ADAPTER_CANONICAL_PROJECTION_EXPOSURE_GATE`
