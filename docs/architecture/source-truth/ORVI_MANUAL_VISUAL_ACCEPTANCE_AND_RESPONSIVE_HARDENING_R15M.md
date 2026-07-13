# ORVI Manual Visual Acceptance And Responsive Hardening R15M

## Decision

`PASS_R15M_ORVI_RESPONSIVE_HARDENING_AND_VISUAL_REVIEW_READINESS`

- Existing template: reused.
- View navigation: implemented.
- Responsive hardening: implemented.
- Manual visual acceptance: pending.
- Recommendation: `null`.
- Next: `R15M1_ORVI_MANUAL_VISUAL_ACCEPTANCE_SIGNOFF_AND_RELEASE_CLOSE`.

## View navigation

The R15I navigation contract is now visible as two accessible buttons:

1. `Protección`.
2. `Recuperación garantizada`.

Protection is the default. Switching views changes only presentation. It does not recalculate, recommend, or mutate Product Intelligence.

The disclosure section remains visible in both views.

## Responsive contract

All selectors are scoped to:

`[data-forge-product-type="orvi"]`

Desktop uses a twelve-column grid. Protection occupies five columns, future protection seven columns, and the three recovery checkpoint cards occupy four columns each.

Tablet uses eight columns. Recovery cards use four columns each. Protection and scenario sections use the full row.

Mobile uses single-column cards, a two-button sticky switcher, a minimum 44px touch target, and wrapping for long monetary and disclosure strings.

## Cache invalidation

The shared renderer loads the R15M layout and ORVI adapter URLs. The accepted bridge and live page importer also receive the R15M version tag.

## Manual acceptance boundary

Automated tests validate DOM state, ARIA state, responsive selectors, shared-template identity, and private real-source structure.

They cannot approve visual hierarchy, spacing, readability, or subjective appearance. Those remain pending human review in desktop, tablet, and mobile viewports.

## Private review files

The script copies the PII-sanitized R15L packet and a checklist to local Download storage. Neither file is staged or committed.

## Semantic boundaries

- Product classification remains life-insurance protection.
- Future UDI values remain non-guaranteed scenarios.
- Future USD remains blocked.
- Recovery percentage is not investment return.
- Recommendation remains `null`.
- Human decision remains required.

## Next

`R15M1_ORVI_MANUAL_VISUAL_ACCEPTANCE_SIGNOFF_AND_RELEASE_CLOSE`
