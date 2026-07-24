import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  actionReadiness,
  buildGlobalPlan,
  scaffoldRefreshEligible
} from '../autopilot/global-autopilot.mjs';


const testDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);
const globalCli = path.resolve(
  testDirectory,
  '..',
  'autopilot',
  'global-autopilot.mjs'
);

const functionalPolicy = {
  priorityOrder: [
    'runtime',
    'integrations',
    'productE2E',
    'scaffolds',
    'architecture'
  ]
};

const globalPolicy = {
  campaignPriority: [
    'runtime',
    'integrations',
    'productE2E',
    'scaffolds',
    'architecture'
  ],
  requiredCapabilityAreas: [
    'runtime',
    'integrations',
    'productE2E'
  ],
  actionEvidenceChecks: {
    integrations: [
      'realOrFaithfulExternalBoundary',
      'successPath'
    ],
    productE2E: [
      'realUserEntrypoint',
      'multiStepScenario'
    ]
  }
};

function moduleEvaluation(overrides = {}) {
  return {
    id: 'MOD-RUNTIME-A',
    title: 'Runtime A',
    area: 'runtime',
    priority: 100,
    dependencies: [],
    structuralPass: true,
    functionalPass: false,
    falseGreen: true,
    reasons: ['FUNCTIONAL_EVIDENCE_MISSING'],
    tests: {
      negativePath: true,
      assertionCount: 4,
      lines: 80,
      scaffoldOperation: false
    },
    ...overrides
  };
}

function area(
  areaName,
  denominator,
  functionalComplete = 0
) {
  return {
    area: areaName,
    denominator,
    functionalComplete,
    functionalPercent: denominator
      ? functionalComplete / denominator * 100
      : 0
  };
}

function auditWith(modules, areaOverrides = {}) {
  const grouped = new Map();

  for (const module of modules) {
    grouped.set(
      module.area,
      (grouped.get(module.area) ?? 0) + 1
    );
  }

  return {
    modules,
    areas: [
      area(
        'runtime',
        areaOverrides.runtime
          ?? grouped.get('runtime')
          ?? 0
      ),
      area(
        'integrations',
        areaOverrides.integrations
          ?? grouped.get('integrations')
          ?? 0
      ),
      area(
        'productE2E',
        areaOverrides.productE2E
          ?? grouped.get('productE2E')
          ?? 0
      ),
      area(
        'scaffolds',
        areaOverrides.scaffolds
          ?? grouped.get('scaffolds')
          ?? 0
      ),
      area('architecture', 6, 6)
    ],
    architecture: {
      checks: [
        {
          id: 'A1-01',
          pass: true,
          detail: 'PASS'
        }
      ]
    },
    globalFunctionalPercent: 25,
    globalStructuralPercent: 50,
    falseGreens: []
  };
}

function manifestFor(modules) {
  return {
    modules: modules.map(module => ({
      id: module.id,
      dependencies: module.dependencies ?? []
    }))
  };
}

function configuredRuntimeAction() {
  return {
    implementationCommand:
      'bash forge/autopilot/actions/runtime-a.sh',
    functionalTestCommand:
      'node --test modules/runtime-a/consumer.test.mjs',
    consumerTestPaths: [
      'modules/runtime-a/consumer.test.mjs'
    ],
    changedPaths: [
      'modules/runtime-a',
      '.forge21/receipts/MOD-RUNTIME-A',
      '.forge21/functional-evidence/MOD-RUNTIME-A'
    ]
  };
}

test(
  'selects a configured runtime module as a runnable global action',
  () => {
    const module = moduleEvaluation();
    const audit = auditWith(
      [module],
      {
        integrations: 1,
        productE2E: 1
      }
    );

    const plan = buildGlobalPlan({
      audit,
      manifest: manifestFor([module]),
      actions: {
        modules: {
          [module.id]: configuredRuntimeAction()
        }
      },
      functionalPolicy,
      globalPolicy
    });

    assert.equal(plan.status, 'READY');
    assert.equal(
      plan.actionType,
      'RUN_MODULE_AUTOPILOT'
    );
    assert.equal(plan.moduleId, module.id);
    assert.equal(plan.area, 'runtime');
  }
);

test(
  'resolves an unfinished dependency before its consumer',
  () => {
    const dependency = moduleEvaluation({
      id: 'MOD-RUNTIME-DEPENDENCY',
      priority: 10
    });
    const consumer = moduleEvaluation({
      id: 'MOD-RUNTIME-CONSUMER',
      priority: 200,
      dependencies: [dependency.id]
    });
    const audit = auditWith(
      [consumer, dependency],
      {
        integrations: 1,
        productE2E: 1
      }
    );

    const actions = {
      modules: {
        [dependency.id]: configuredRuntimeAction(),
        [consumer.id]: configuredRuntimeAction()
      }
    };

    const plan = buildGlobalPlan({
      audit,
      manifest: manifestFor([
        consumer,
        dependency
      ]),
      actions,
      functionalPolicy,
      globalPolicy
    });

    assert.equal(
      plan.moduleId,
      dependency.id
    );
  }
);

test(
  'blocks a runtime module whose implementation action is not configured',
  () => {
    const module = moduleEvaluation();
    const audit = auditWith(
      [module],
      {
        integrations: 1,
        productE2E: 1
      }
    );

    const plan = buildGlobalPlan({
      audit,
      manifest: manifestFor([module]),
      actions: {
        modules: {
          [module.id]: {
            implementationCommand: null,
            functionalTestCommand: null,
            consumerTestPaths: [],
            changedPaths: []
          }
        }
      },
      functionalPolicy,
      globalPolicy
    });

    assert.equal(plan.status, 'BLOCKED');
    assert.equal(
      plan.actionType,
      'CONFIGURE_MODULE_ACTION'
    );
    assert.ok(
      plan.blockers.includes(
        'IMPLEMENTATION_COMMAND_REQUIRED'
      )
    );
    assert.ok(
      plan.blockers.includes(
        'CONSUMER_TEST_PATH_REQUIRED'
      )
    );
  }
);

test(
  'requires declaration when a mandatory capability area has no modules',
  () => {
    const completedRuntime = moduleEvaluation({
      functionalPass: true,
      falseGreen: false,
      reasons: []
    });
    const audit = auditWith(
      [completedRuntime],
      {
        runtime: 1,
        integrations: 0,
        productE2E: 1
      }
    );

    const plan = buildGlobalPlan({
      audit,
      manifest: manifestFor([
        completedRuntime
      ]),
      actions: { modules: {} },
      functionalPolicy,
      globalPolicy
    });

    assert.equal(plan.status, 'BLOCKED');
    assert.equal(
      plan.actionType,
      'DECLARE_MODULE'
    );
    assert.equal(plan.area, 'integrations');
  }
);

test(
  'allows a scaffold receipt refresh only when receipt drift is the sole blocker',
  () => {
    const scaffold = moduleEvaluation({
      id: 'MOD-SCAFFOLD-PLANNER',
      area: 'scaffolds',
      priority: 0,
      reasons: [
        'RECEIPT_HASH_STALE:governance/FORGE_GOVERNANCE_REGISTRY.md'
      ],
      tests: {
        negativePath: true,
        assertionCount: 12,
        lines: 150,
        scaffoldOperation: true
      }
    });

    assert.equal(
      scaffoldRefreshEligible(scaffold),
      true
    );

    const audit = auditWith(
      [scaffold],
      {
        runtime: 1,
        integrations: 1,
        productE2E: 1,
        scaffolds: 1
      }
    );

    audit.modules.unshift(
      moduleEvaluation({
        functionalPass: true,
        falseGreen: false,
        reasons: []
      }),
      moduleEvaluation({
        id: 'MOD-INTEGRATION-COMPLETE',
        area: 'integrations',
        functionalPass: true,
        falseGreen: false,
        reasons: []
      }),
      moduleEvaluation({
        id: 'MOD-E2E-COMPLETE',
        area: 'productE2E',
        functionalPass: true,
        falseGreen: false,
        reasons: []
      })
    );

    audit.areas = [
      area('runtime', 1, 1),
      area('integrations', 1, 1),
      area('productE2E', 1, 1),
      area('scaffolds', 1, 0),
      area('architecture', 6, 6)
    ];

    const plan = buildGlobalPlan({
      audit,
      manifest: manifestFor(
        audit.modules
      ),
      actions: { modules: {} },
      functionalPolicy,
      globalPolicy
    });

    assert.equal(plan.status, 'READY');
    assert.equal(
      plan.actionType,
      'REFRESH_SCAFFOLD_RECEIPT'
    );
    assert.equal(plan.moduleId, scaffold.id);
  }
);

test(
  'blocks failed architecture checks after module areas are complete',
  () => {
    const completed = [
      moduleEvaluation({
        functionalPass: true,
        falseGreen: false,
        reasons: []
      }),
      moduleEvaluation({
        id: 'MOD-INTEGRATION-A',
        area: 'integrations',
        functionalPass: true,
        falseGreen: false,
        reasons: []
      }),
      moduleEvaluation({
        id: 'MOD-E2E-A',
        area: 'productE2E',
        functionalPass: true,
        falseGreen: false,
        reasons: []
      })
    ];
    const audit = auditWith(completed, {
      runtime: 1,
      integrations: 1,
      productE2E: 1
    });

    audit.areas = [
      area('runtime', 1, 1),
      area('integrations', 1, 1),
      area('productE2E', 1, 1),
      area('scaffolds', 0, 0),
      area('architecture', 6, 5)
    ];
    audit.architecture.checks = [
      {
        id: 'A1-05',
        pass: false,
        detail: 'missing authority'
      }
    ];

    const plan = buildGlobalPlan({
      audit,
      manifest: manifestFor(completed),
      actions: { modules: {} },
      functionalPolicy,
      globalPolicy
    });

    assert.equal(plan.status, 'BLOCKED');
    assert.equal(
      plan.actionType,
      'REPAIR_ARCHITECTURE'
    );
    assert.ok(
      plan.blockers[0].startsWith(
        'A1-05:'
      )
    );
  }
);

test(
  'integration readiness requires explicit evidence configuration',
  () => {
    const integration = moduleEvaluation({
      id: 'MOD-INTEGRATION-A',
      area: 'integrations'
    });

    const readiness = actionReadiness(
      integration,
      {
        implementationCommand: 'bash implement.sh',
        functionalTestCommand:
          'node --test integration.test.mjs',
        changedPaths: ['modules/integration-a']
      },
      globalPolicy
    );

    assert.equal(readiness.ready, false);
    assert.ok(
      readiness.missing.includes(
        'ACTION_EVIDENCE_REQUIRED'
      )
    );
  }
);


test(
  'unknown global commands fail closed with a stable error code',
  () => {
    const result = spawnSync(
      process.execPath,
      [globalCli, 'definitely-not-a-command'],
      { encoding: 'utf8' }
    );

    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}${result.stderr}`,
      /GLOBAL_AUTOPILOT_ERROR_CODE=UNKNOWN_COMMAND/
    );
  }
);
