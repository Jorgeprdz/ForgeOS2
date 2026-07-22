#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

: "${FORGE_ROOT:?FORGE_ROOT is required}"
: "${FORGE_STAGE:?FORGE_STAGE is required}"

[ "$FORGE_STAGE" = "SG-021" ] || {
  printf 'GENERATOR_STAGE_MISMATCH expected=SG-021 actual=%s\n' "$FORGE_STAGE" >&2
  exit 1
}

node <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.env.FORGE_ROOT;
const stageId = process.env.FORGE_STAGE;
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scaffolds/manifest/rewrite-stages.json'), 'utf8'));
const stage = manifest.stages.find(item => item.id === stageId);
if (!stage) {
  console.error(`GENERATOR_STAGE_NOT_FOUND:${stageId}`);
  process.exit(1);
}

function writeJsonIfMissing(relativePath, payload, validate) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) {
    const existing = JSON.parse(fs.readFileSync(target, 'utf8'));
    validate(existing, relativePath);
    return { path: relativePath, action: 'VERIFIED_EXISTING' };
  }
  fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
  validate(payload, relativePath);
  return { path: relativePath, action: 'CREATED' };
}

const common = {
  stage_id: stageId,
  stage_name: stage.name,
  version: '1',
  constitutional_authority: stage.constitutional_authority,
  boundaries: stage.boundaries,
  consumes: stage.consumes,
  fail_closed: true,
  functional_implementation_created: false
};

const productSemantics = {
  schema: 'FORGE_PRODUCT_SEMANTICS_DECISION_RECORD_V1',
  artifact_ids: ['ProductSemanticsDecisionRecord', 'DomainAuthorityDecisionRecord'],
  status: 'RATIFIED',
  ...common,
  decisions: [
    {
      decision_id: 'SG021-DER-001',
      status: 'DERIVED',
      artifact_id: 'ProductSemanticsDecisionRecord',
      derivation_source: [
        'governance/constitution/CONSTITUTION_UNIFIED.md',
        'AGENTS.md',
        'docs/product/FORGE_PRODUCT_SPEC.md'
      ],
      rule: 'Forge product semantics must preserve advisor-first decision intelligence, human authority and unknown-remains-unknown behavior.'
    },
    {
      decision_id: 'SG021-DEF-001',
      status: 'DEFAULTED',
      artifact_id: 'DomainAuthorityDecisionRecord',
      default_type: 'safe_reversible_no_authority_without_evidence',
      rule: 'Domains may consume evidence and produce bounded contracts; they do not gain write authority, lifecycle authority or source-of-truth authority unless a later contract grants it explicitly.'
    }
  ],
  completion_rule: 'SG-021 is complete when this record, AdvisorOwnerDecisionSet, minimum safe product contracts, architecture-derived decisions and stage evidence validate.'
};

const advisorOwnerDecisionSet = {
  schema: 'FORGE_OPERATIONAL_CLOSURE_DECISION_RECORD_V1',
  decision_id: 'SG021-OD-001',
  status: 'RATIFIED',
  artifact_id: 'AdvisorOwnerDecisionSet',
  version: '1',
  ratified_definitions: {
    advisor_identity: {
      model: 'PersonIdentity + AdvisorRole',
      person_identity: 'Durable human identity.',
      advisor_role: 'Role, effective period and history.',
      parallel_domain_identities: 'PROHIBITED',
      ambiguous_matches: 'REQUIRE_HUMAN_REVIEW'
    },
    advisor_lifecycle: {
      model: 'hybrid_internal_operational_and_official_states',
      official_state_change_authority: ['official_evidence', 'authorized_human_approval'],
      forbidden_state_mutators: ['NASH', 'Mick', 'Relationship', 'Productivity', 'UI']
    },
    advisor_context: {
      contract: 'Governed context envelope',
      required_fields: ['owner', 'source', 'freshness', 'uncertainty', 'evidence_references', 'purpose_limitation'],
      source_of_truth: false
    },
    nash_boundary: {
      allowed: ['suggest', 'summarize', 'explain', 'produce_candidate_actions'],
      prohibited: ['execute_side_effects', 'change_lifecycle', 'produce_official_states', 'infer_consent', 'convert_inference_to_fact', 'replace_human_authority']
    }
  },
  constitution_refs: ['CONSTITUTION_ARTICLE_0', 'CONSTITUTION_ARTICLE_III', 'CONSTITUTION_ARTICLE_IV'],
  decision_refs: ['SG021-OD-001']
};

const minimumSafeProductContracts = {
  schema: 'FORGE_MINIMUM_SAFE_PRODUCT_CONTRACTS_V1',
  status: 'DEFAULTED',
  stage_id: stageId,
  version: '1',
  contracts: {
    PolicyOperationsContract: 'Read-only policy operations contract. No production writes. Unknown policy truth remains unknown.',
    ProductSourcePackContract: 'Source packs are evidence inputs only. They do not invent products, rates, benefits or eligibility.',
    EligibilityContract: 'Eligibility output is evidence-labeled and may be UNKNOWN/BLOCKED. It is not approval or permission.',
    QuotePreviewContract: 'Quote preview is non-binding, evidence-bound and requires Product Catalog, Source Pack, Eligibility and Calculation contracts.'
  },
  global_constraints: ['read_only_until_explicit_stage_run', 'no_side_effects', 'unknown_remains_unknown', 'evidence_required', 'versioned_evolution']
};

const architectureDerivedDecisions = {
  schema: 'FORGE_ARCHITECTURE_DERIVED_DECISIONS_V1',
  status: 'DERIVED',
  stage_id: stageId,
  version: '1',
  decisions: {
    CarrierScopeContract: 'Carrier, channel, period and rule-pack scope precede product and rule consumers.',
    RulePackContract: 'Rule packs interpret facts and preserve RuleSnapshot context; Forge Core does not hardcode carrier logic.',
    CalculationContract: 'Calculations require provenance, source-of-truth registry, rule snapshot and event receipt evidence.',
    ObservableBehaviorSignalContract: 'Mick emits observable behavior signals only and never human worth or consequences.',
    ManagerCoachingContract: 'Manager coaching consumes evidence and produces recommendations for human leaders only.',
    ManagerWorkspaceSurfaceContract: 'Manager workspace consumes coaching and read models; it cannot automate consequences.'
  }
};

const results = [
  writeJsonIfMissing('scaffolds/manifest/product-semantics-decision-record.json', productSemantics, (data, file) => {
    if (!Array.isArray(data.artifact_ids) || !data.artifact_ids.includes('ProductSemanticsDecisionRecord') || !data.artifact_ids.includes('DomainAuthorityDecisionRecord')) {
      throw new Error(`SG021_INVALID_PRODUCT_SEMANTICS_RECORD:${file}`);
    }
    if (data.status !== 'RATIFIED') throw new Error(`SG021_PRODUCT_SEMANTICS_NOT_RATIFIED:${file}`);
  }),
  writeJsonIfMissing('scaffolds/manifest/operational-closure/advisor-owner-decision-set.json', advisorOwnerDecisionSet, (data, file) => {
    if (data.decision_id !== 'SG021-OD-001' || data.status !== 'RATIFIED' || data.artifact_id !== 'AdvisorOwnerDecisionSet') {
      throw new Error(`SG021_INVALID_ADVISOR_OWNER_DECISION_SET:${file}`);
    }
  }),
  writeJsonIfMissing('scaffolds/manifest/operational-closure/minimum-safe-product-contracts.json', minimumSafeProductContracts, (data, file) => {
    if (data.status !== 'DEFAULTED' || !data.contracts?.QuotePreviewContract) {
      throw new Error(`SG021_INVALID_MINIMUM_SAFE_PRODUCT_CONTRACTS:${file}`);
    }
  }),
  writeJsonIfMissing('scaffolds/manifest/operational-closure/architecture-derived-decisions.json', architectureDerivedDecisions, (data, file) => {
    if (data.status !== 'DERIVED' || !data.decisions?.CarrierScopeContract) {
      throw new Error(`SG021_INVALID_ARCHITECTURE_DERIVED_DECISIONS:${file}`);
    }
  })
];

console.log(`GENERATOR=PASS stage=${stageId} generated=${results.length}`);
for (const result of results) console.log(`${result.action}=${result.path}`);
NODE
