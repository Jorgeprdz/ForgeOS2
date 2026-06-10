/**
 * MASTER TEST: phase-zero-blueprint-engine.test.js
 */

import { generatePhaseZeroBlueprint } from '../phase-zero-blueprint-engine.js';

function runTests() {
    console.log("--- RUNNING PHASE ZERO BLUEPRINT ENGINE TESTS ---");

    // Test Case 1: Jorge re-entry case
    const jorgeInput = {
        goal: { monthly_policies: 4 },
        pipeline: [],
        config: { working_days: 20 },
        assumptions: {
            app_to_policy: 0.8,
            presentation_to_app: 0.2,
            meeting_to_presentation: 0.8,
            conversation_to_meeting: 0.5,
            outreach_to_conversation: 0.2
        }
    };

    const jorgeResult = generatePhaseZeroBlueprint(jorgeInput);
    
    assert(jorgeResult.phase_zero_status === "blueprint_generated", "Should generate blueprint for Jorge");
    assert(jorgeResult.daily_blueprint.outreach === 15.6, "Daily outreach should be 15.6");
    assert(jorgeResult.dominant_constraint === "no_active_pipeline", "Constraint should be no active pipeline");
    console.log("✅ Test 1: Jorge re-entry case passed.");

    // Test Case 2: Missing assumptions
    const incompleteInput = {
        goal: { monthly_policies: 4 },
        assumptions: {
            app_to_policy: 0.8
        }
    };

    const incompleteResult = generatePhaseZeroBlueprint(incompleteInput);
    assert(incompleteResult.phase_zero_status === "insufficient_assumptions", "Should fail if assumptions missing");
    assert(incompleteResult.missing_assumptions.includes("presentation_to_app"), "Should identify missing presentation assumption");
    console.log("✅ Test 2: Missing assumptions case passed.");

    // Test Case 3: Zero pipeline (Implicitly tested in Case 1, but let's be explicit)
    assert(jorgeResult.dominant_constraint === "no_active_pipeline", "Should identify empty pipeline constraint");
    console.log("✅ Test 3: Zero pipeline case passed.");

    // Test Case 4: Non-zero pipeline
    const activeInput = {
        pipeline: [{ id: 1, name: "Prospect A", status: "NEW" }]
    };

    const activeResult = generatePhaseZeroBlueprint(activeInput);
    assert(activeResult.status === "not_phase_zero", "Should detect non-phase zero state");
    console.log("✅ Test 4: Non-zero pipeline case passed.");

    // Test Case 5: No invented data (Verify assumptions are referenced)
    assert(jorgeResult.assumptions_used.app_to_policy === 0.8, "Should reference used assumptions");
    assert(jorgeResult.assumptions_used.working_days === 20, "Should reference working days");
    console.log("✅ Test 5: No invented data case passed.");

    console.log("--- ALL TESTS PASSED ---");
}

function assert(condition, message) {
    if (!condition) {
        console.error("❌ ASSERTION FAILED: " + message);
        process.exit(1);
    }
}

runTests();
