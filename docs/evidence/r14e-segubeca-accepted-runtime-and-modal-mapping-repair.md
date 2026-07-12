# R14E SeguBeca Accepted Runtime And Modal Mapping Repair

## Decision

`PASS_R14E_SEGUBECA_ACCEPTED_RUNTIME_AND_MODAL_MAPPING_REPAIR`

R14E repairs the accepted-quote integration path identified after real-PDF QA.

## Root cause

The SeguBeca parser produced the product-specific data, but the confirmation modal canonical mapping reads legacy aliases from `nativeResult`:

- `prospect`
- `sumInsured`
- `premiumTable.annual`
- `premiumTable.plannedAnnual`
- `policyTerm`

R14C/R14D exposed several values only through newer aliases. In addition, the accepted quote adapter had special handling for Vida Mujer but routed SeguBeca through the generic retirement calculation path.

## Repair

- Added the required legacy-compatible aliases to the SeguBeca native result.
- Added a product-specific SeguBeca accepted calculation branch.
- Preserved `nativeResult.benefitSummary`.
- Preserved product identity, annual premium, contribution, coverage period, and recovery.
- Added an integration test from parser packet through accepted adapter into the SeguBeca dashboard model.

## Boundaries

- No new PDF extraction semantics.
- No CSS or visual redesign.
- No PDF, Excel, client data, or screenshots committed.
- No mobile, schemas, routes, `app.js`, or rule packs.
- Vida Mujer and Imagina Ser regression tests remain mandatory.
