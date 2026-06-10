/**
 * MODULE: phase-zero-blueprint-engine.js
 * 
 * PROPÓSITO:
 * Traducir un objetivo de negocio en un plano de actividad diaria (Daily Blueprint)
 * utilizando supuestos de conversión explícitos, validando la Fase Cero.
 */

export function generatePhaseZeroBlueprint(input = {}) {
    const {
        goal = {},
        pipeline = [],
        config = {},
        assumptions = {}
    } = input;

    // 1. Detectar si estamos en Fase Cero
    const hasActivePipeline = pipeline && pipeline.length > 0;
    if (hasActivePipeline) {
        return {
            status: "not_phase_zero",
            reason: "Active prospects detected in pipeline.",
            recommendation: "Use standard pipeline engines for active context."
        };
    }

    // 2. Validar supuestos necesarios
    const requiredAssumptions = [
        "app_to_policy",
        "presentation_to_app",
        "meeting_to_presentation",
        "conversation_to_meeting",
        "outreach_to_conversation"
    ];

    const missingAssumptions = requiredAssumptions.filter(a => !assumptions[a]);
    
    if (missingAssumptions.length > 0) {
        return {
            phase_zero_status: "insufficient_assumptions",
            missing_assumptions: missingAssumptions,
            recommended_next_step: "Define baseline conversion assumptions before calculating daily activity."
        };
    }

    // 3. Validar configuración de tiempo
    const workingDays = config.working_days || 20;
    const targetMonthlyPolicies = goal.monthly_policies || 0;

    if (targetMonthlyPolicies <= 0) {
        return {
            phase_zero_status: "no_goal_defined",
            recommended_next_step: "Set a monthly policy goal to generate a blueprint."
        };
    }

    // 4. Calcular cadena de actividad (Reverse Engineering)
    // No inventamos números. Cada paso se deriva del objetivo y los supuestos.
    const monthlySignedApps = targetMonthlyPolicies / assumptions.app_to_policy;
    const monthlyPresentations = monthlySignedApps / assumptions.presentation_to_app;
    const monthlyInitialMeetings = monthlyPresentations / assumptions.meeting_to_presentation;
    const monthlyConversations = monthlyInitialMeetings / assumptions.conversation_to_meeting;
    const monthlyOutreach = monthlyConversations / assumptions.outreach_to_conversation;

    // 5. Normalizar a diario
    const dailyOutreach = monthlyOutreach / workingDays;
    const dailyConversations = monthlyConversations / workingDays;
    const dailyMeetings = monthlyInitialMeetings / workingDays;

    return {
        phase_zero_status: "blueprint_generated",
        dominant_constraint: "no_active_pipeline",
        uncertainty_reduction: `Define la cuota de actividad diaria necesaria para alcanzar ${targetMonthlyPolicies} pólizas/mes.`,
        daily_blueprint: {
            outreach: parseFloat(dailyOutreach.toFixed(1)),
            conversations: parseFloat(dailyConversations.toFixed(1)),
            initial_meetings: parseFloat(dailyMeetings.toFixed(1))
        },
        assumptions_used: {
            ...assumptions,
            working_days: workingDays,
            monthly_goal: targetMonthlyPolicies
        },
        strategic_advice: "En Fase Cero, tu único 'Ownership' es la generación de flujo. No intentes cerrar lo que no has prospectado.",
        next_step: `Identificar ${Math.ceil(dailyOutreach)} sospechosos para iniciar contacto hoy.`
    };
}
