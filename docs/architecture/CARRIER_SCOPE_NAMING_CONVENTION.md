# Carrier Scope Naming Convention

Status: Ratified for Forge OS 2.1 runtime implementation.

A carrier scope is a deterministic tuple composed of:

1. `carrier`
2. `market`
3. optional `productLine`

Every token uses lowercase kebab-case and must match:

```text
^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$
```

Canonical serialization uses colon separators:

```text
carrier:market
carrier:market:product-line
```

Examples:

```text
smnyl:mexico
smnyl:mexico:vida-individual
```

The runtime may normalize letter case and surrounding whitespace, but it must reject
spaces, underscores, empty tokens, leading digits, and ambiguous serialization.
