// AUTO-GENERATED. DO NOT EDIT.

import * as contract0 from './blocked-state-policy.contract.mjs';
import * as contract1 from './constitutional-runtime-constraints.contract.mjs';
import * as contract2 from './robocop-gate-contract.contract.mjs';
import * as contract3 from './claim-contract.contract.mjs';
import * as contract4 from './evidence-envelope.contract.mjs';
import * as contract5 from './provenance-model.contract.mjs';
import * as contract6 from './unknown-state-policy.contract.mjs';
import * as contract7 from './relationship-contract.contract.mjs';
import * as contract8 from './relationship-next-action-contract.contract.mjs';
import * as contract9 from './relationship-signal-contract.contract.mjs';
import * as contract10 from './conversation-guidance-contract.contract.mjs';
import * as contract11 from './nashboundary-contract.contract.mjs';
import * as contract12 from './nashcontext-contract.contract.mjs';
import * as contract13 from './policy-operations-contract.contract.mjs';
import * as contract14 from './policy-truth-read-model.contract.mjs';
import * as contract15 from './product-catalog-contract.contract.mjs';
import * as contract16 from './product-source-pack-contract.contract.mjs';
import * as contract17 from './carrier-scope-contract.contract.mjs';
import * as contract18 from './rule-pack-contract.contract.mjs';
import * as contract19 from './rule-snapshot-contract.contract.mjs';
import * as contract20 from './eligibility-contract.contract.mjs';
import * as contract21 from './calculation-contract.contract.mjs';
import * as contract22 from './calculation-provenance-contract.contract.mjs';
import * as contract23 from './quote-preview-contract.contract.mjs';
import * as contract24 from './manager-coaching-contract.contract.mjs';
import * as contract25 from './observable-behavior-signal-contract.contract.mjs';
import * as contract26 from './advisor-experience-contract.contract.mjs';
import * as contract27 from './feature-learning-state-contract.contract.mjs';
import * as contract28 from './actor-authority-contract.contract.mjs';
import * as contract29 from './advisor-role-model.contract.mjs';
import * as contract30 from './canonical-identity-contract.contract.mjs';
import * as contract31 from './identity-alias-policy.contract.mjs';
import * as contract32 from './metric-ownership-registry.contract.mjs';
import * as contract33 from './ownership-registry.contract.mjs';
import * as contract34 from './parallel-truth-deny-policy.contract.mjs';
import * as contract35 from './productivity-metric-contract.contract.mjs';
import * as contract36 from './source-of-truth-registry.contract.mjs';
import * as contract37 from './correction-policy.contract.mjs';
import * as contract38 from './lifecycle-framework.contract.mjs';
import * as contract39 from './lifecycle-state-model.contract.mjs';
import * as contract40 from './transition-authority-policy.contract.mjs';
import * as contract41 from './domain-event-taxonomy.contract.mjs';
import * as contract42 from './event-receipt-contract.contract.mjs';
import * as contract43 from './rollback-checkpoint-contract.contract.mjs';
import * as contract44 from './context-envelope.contract.mjs';
import * as contract45 from './forbidden-inference-contract.contract.mjs';
import * as contract46 from './purpose-limitation-policy.contract.mjs';
import * as contract47 from './read-model-contract.contract.mjs';
import * as contract48 from './workspace-read-model.contract.mjs';
import * as contract49 from './advisor-workspace-surface-contract.contract.mjs';
import * as contract50 from './manager-workspace-surface-contract.contract.mjs';

export const contractRegistry = new Map([
  [contract0.artifactId, contract0],
  [contract1.artifactId, contract1],
  [contract2.artifactId, contract2],
  [contract3.artifactId, contract3],
  [contract4.artifactId, contract4],
  [contract5.artifactId, contract5],
  [contract6.artifactId, contract6],
  [contract7.artifactId, contract7],
  [contract8.artifactId, contract8],
  [contract9.artifactId, contract9],
  [contract10.artifactId, contract10],
  [contract11.artifactId, contract11],
  [contract12.artifactId, contract12],
  [contract13.artifactId, contract13],
  [contract14.artifactId, contract14],
  [contract15.artifactId, contract15],
  [contract16.artifactId, contract16],
  [contract17.artifactId, contract17],
  [contract18.artifactId, contract18],
  [contract19.artifactId, contract19],
  [contract20.artifactId, contract20],
  [contract21.artifactId, contract21],
  [contract22.artifactId, contract22],
  [contract23.artifactId, contract23],
  [contract24.artifactId, contract24],
  [contract25.artifactId, contract25],
  [contract26.artifactId, contract26],
  [contract27.artifactId, contract27],
  [contract28.artifactId, contract28],
  [contract29.artifactId, contract29],
  [contract30.artifactId, contract30],
  [contract31.artifactId, contract31],
  [contract32.artifactId, contract32],
  [contract33.artifactId, contract33],
  [contract34.artifactId, contract34],
  [contract35.artifactId, contract35],
  [contract36.artifactId, contract36],
  [contract37.artifactId, contract37],
  [contract38.artifactId, contract38],
  [contract39.artifactId, contract39],
  [contract40.artifactId, contract40],
  [contract41.artifactId, contract41],
  [contract42.artifactId, contract42],
  [contract43.artifactId, contract43],
  [contract44.artifactId, contract44],
  [contract45.artifactId, contract45],
  [contract46.artifactId, contract46],
  [contract47.artifactId, contract47],
  [contract48.artifactId, contract48],
  [contract49.artifactId, contract49],
  [contract50.artifactId, contract50],
]);

export function getContractModule(artifactId) {
  const module = contractRegistry.get(artifactId);

  if (!module) {
    throw new Error(
      `FORGE_UNKNOWN_CONTRACT:${artifactId}`
    );
  }

  return module;
}

export function listContracts() {
  return [...contractRegistry.keys()].sort();
}

export function validateRegistry() {
  const results = [];

  for (const [artifactId, module] of contractRegistry) {
    const result = module.validateContractShape(
      module.getContract()
    );

    results.push({
      artifact_id: artifactId,
      valid: result.valid,
      errors: result.errors
    });
  }

  return {
    valid: results.every((item) => item.valid),
    results
  };
}
