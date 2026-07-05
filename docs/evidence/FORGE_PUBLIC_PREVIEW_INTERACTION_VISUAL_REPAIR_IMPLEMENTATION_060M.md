# Forge Public Preview Interaction Visual Repair Implementation 060M

DECISION=PASS_060M_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION

NEXT=060N_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_QA_LOCK

060M addresses three public preview defects reported from browser screenshots:

- visible command bar text frame on click;
- overlap between `Cotizar`, `Cotización`, and `/cotizar`;
- misplaced white local preview block.

Repair behavior:

- command-like text fields are made static/read-only for the preview surface;
- focus is blurred to avoid exposing the browser text UI;
- quote cards are marked for non-overlapping layout;
- the 060L local preview card is relocated to the wide command surface when available;
- the 060L card is restyled to match the dark Forge desktop surface.

Validation:

- runner shell syntax checked;
- new repair JavaScript syntax checked;
- existing 060L and 060I JavaScript syntax checked;
- index load order checked;
- repair markers checked;
- whitespace check passed;
- safety scan passed.

DECISION=PASS_060M_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_IMPLEMENTATION

NEXT=060N_PUBLIC_PREVIEW_INTERACTION_VISUAL_REPAIR_QA_LOCK
