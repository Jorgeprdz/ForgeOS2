const {
  buildLearningReport
} = require("./nash-learning-engine");

console.log(
"\nFORGE NASH LEARNING ENGINE TEST v0.1\n"
);

const report =
  buildLearningReport({
    advisorId: "JORGE"
  });

console.log("Learning Report\n");

console.log(
  `Advisor: ${report.advisorId}`
);

console.log(
  `Prospectos: ${report.stats.prospects}`
);

console.log(
  `Conversaciones: ${report.stats.conversations}`
);

console.log(
  `Objeciones: ${report.stats.objections}`
);

console.log(
  `Objeción dominante: ${report.dominantObjection}`
);

console.log(
  `Intent dominante: ${report.dominantIntent}`
);

console.log(
  `Outcome dominante: ${report.dominantOutcome}`
);

console.log(
  `Insight: ${report.learningInsight}`
);

console.log(
  `Recomendación: ${report.recommendation}`
);

const tests = [

  {
    name:
      "Genera reporte",
    pass:
      report.engine ===
      "NASH_LEARNING_ENGINE"
  },

  {
    name:
      "Incluye estadísticas",
    pass:
      report.stats !== undefined
  },

  {
    name:
      "Incluye insight",
    pass:
      report.learningInsight.length > 10
  },

  {
    name:
      "Incluye recomendación",
    pass:
      report.recommendation.length > 10
  },

  {
    name:
      "Incluye advisor",
    pass:
      report.advisorId === "JORGE"
  },

  {
    name:
      "Versión presente",
    pass:
      report.version === "0.1"
  }
];

console.log("\nResultados\n");

tests.forEach(test => {

  console.log(
    `${test.pass ? "✅" : "❌"} ${test.name}`
  );

});

const pass =
  tests.filter(t => t.pass).length;

const fail =
  tests.length - pass;

console.log("\nResumen:");

console.log(`Total: ${tests.length}`);
console.log(`Pass: ${pass}`);
console.log(`Fail: ${fail}`);

if (fail === 0) {

  console.log(
    "\n✅ NASH LEARNING ENGINE v0.1 PASS"
  );

} else {

  console.log(
    "\n❌ NASH LEARNING ENGINE NEEDS REVIEW"
  );

}
