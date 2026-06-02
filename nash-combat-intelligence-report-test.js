const { buildCombatIntelligenceReport } = require("./nash-combat-intelligence-report-engine");

console.log("\nFORGE NASH COMBAT INTELLIGENCE REPORT TEST v0.5\n");

const report = buildCombatIntelligenceReport({
  objection: "Está caro, ahorita no tengo dinero",
  context: {
    name: "María"
  },
  personality: {
    personality: "PROTECTOR"
  }
});

console.log("Reporte NASH Combat\n");

console.log(`Prospecto: ${report.prospect.name}`);
console.log(`Personalidad: ${report.prospect.personality}`);

console.log("\nObjeción\n");
console.log(report.objection);

console.log("\nClasificación\n");
console.log(`Tipo: ${report.classification.type}`);
console.log(`Intención: ${report.classification.intent}`);
console.log(`Confianza: ${report.classification.confidence}`);

console.log("\nPsicología detrás\n");
console.log(report.psychology.psychology);

console.log("\nEstrategia recomendada\n");
console.log(report.psychology.recommendedStrategy);

console.log("\nMensaje Objection Killer\n");
console.log(report.objectionKillerMessage);

console.log("\nRiesgo\n");
console.log(report.psychology.risk);

console.log("\nNext Best Action\n");
console.log(`Acción: ${report.nextBestAction.action}`);
console.log(`Prioridad: ${report.nextBestAction.priority}`);
console.log(`Timing: ${report.nextBestAction.timing}`);
console.log(`Razón: ${report.nextBestAction.reason}`);

console.log("\nGuía para asesor\n");
console.log(`Haz: ${report.advisorGuidance.do}`);
console.log(`No hagas: ${report.advisorGuidance.dont}`);

const tests = [
  {
    name: "Construye reporte",
    pass: report.engine === "NASH_COMBAT_INTELLIGENCE_REPORT"
  },
  {
    name: "Incluye objeción visible",
    pass: report.objection.includes("caro")
  },
  {
    name: "Detecta intención probable",
    pass: !!report.classification.intent
  },
  {
    name: "Incluye psicología detrás",
    pass: report.psychology.psychology.length > 40
  },
  {
    name: "Incluye estrategia recomendada",
    pass: report.psychology.recommendedStrategy.length > 10
  },
  {
    name: "Incluye mensaje objection killer",
    pass: report.objectionKillerMessage.length > 50
  },
  {
    name: "Incluye riesgo",
    pass: report.psychology.risk.length > 30
  },
  {
    name: "Incluye next best action",
    pass: report.nextBestAction.action === "HANDLE_OBJECTION"
  },
  {
    name: "Separa mensaje de psicología",
    pass:
      report.objectionKillerMessage !== report.psychology.psychology
  }
];

console.log("\nResultados\n");

tests.forEach(test => {
  console.log(`${test.pass ? "✅" : "❌"} ${test.name}`);
});

const pass = tests.filter(t => t.pass).length;
const fail = tests.length - pass;

console.log("\nResumen:");
console.log(`Total: ${tests.length}`);
console.log(`Pass: ${pass}`);
console.log(`Fail: ${fail}`);

if (fail === 0) {
  console.log("\n✅ NASH COMBAT INTELLIGENCE REPORT v0.5 PASS");
} else {
  console.log("\n❌ NASH COMBAT INTELLIGENCE REPORT NEEDS REVIEW");
}
