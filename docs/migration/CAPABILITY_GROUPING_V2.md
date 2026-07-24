# Capability Grouping V2

## Purpose

Capability Map Normalization V1 relied mainly on technical filenames and produced almost no material consolidation.

Grouping V2 uses additional evidence:

- direct import relationships;
- shared functional vocabulary;
- directory lineage;
- test and rule-pack affinity;
- declared or safely inferred domains;
- orchestrator and entrypoint evidence.

## Fail-closed boundary

Grouping V2 creates reviewable proposals. It does not:

- modify Forge OS original;
- rewrite business or economic rules;
- merge across domain boundaries automatically;
- merge unresolved capabilities automatically;
- prove parity;
- retire legacy behavior.

## Merge policy

An automatic grouping edge requires:

1. the same resolved domain;
2. a minimum evidence score;
3. functional overlap;
4. at least one explainable reason.

Every multi-member group remains reviewable and records the evidence used.

## Next gate

Reviewed groups may become locked capability identities. A locked capability still receives no parity credit until legacy scenarios and V2 target behavior are explicitly tested.

## Legacy discovery compatibility

If a discovery report does not contain a top-level dependency edge array, Grouping V2 reconstructs exact relative-import edges from immutable files in the pinned legacy Git `HEAD`.

The fallback does not read uncommitted legacy working-tree bytes and does not modify the legacy repository.
