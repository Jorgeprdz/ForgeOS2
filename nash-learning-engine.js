const fs = require("fs");
const path = require("path");

const MEMORY_DIR = path.join(__dirname, "nash-memory");

function loadAllMemories() {
  if (!fs.existsSync(MEMORY_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(MEMORY_DIR)
    .filter(file => file.endsWith(".json"));

  return files.map(file => {
    const fullPath = path.join(MEMORY_DIR, file);
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  });
}

function countOccurrences(items = []) {
  const counts = {};

  items.forEach(item => {
    if (!item) return;
    counts[item] = (counts[item] || 0) + 1;
  });

  return counts;
}

function getDominant(counts = {}) {
  const entries = Object.entries(counts);

  if (!entries.length) {
    return {
      value: null,
      count: 0
    };
  }

  const [value, count] =
    entries.sort((a, b) => b[1] - a[1])[0];

  return {
    value,
    count
  };
}

function analyzeObjections(memories = []) {
  const objections = [];

  memories.forEach(memory => {
    (memory.objectionHistory || []).forEach(item => {
      objections.push(item.type);
    });
  });

  const counts = countOccurrences(objections);

  return {
    counts,
    dominant: getDominant(counts),
    total: objections.length
  };
}

function analyzeIntents(memories = []) {
  const intents = [];

  memories.forEach(memory => {
    (memory.objectionHistory || []).forEach(item => {
      intents.push(item.intent);
    });
  });

  const counts = countOccurrences(intents);

  return {
    counts,
    dominant: getDominant(counts),
    total: intents.length
  };
}

function analyzeOutcomes(memories = []) {
  const outcomes = memories
    .map(memory => memory.lastOutcome)
    .filter(Boolean);

  const counts = countOccurrences(outcomes);

  return {
    counts,
    dominant: getDominant(counts),
    total: outcomes.length
  };
}

function generateLearningInsights({
  dominantObjection,
  dominantIntent,
  dominantOutcome
}) {

  if (dominantIntent === "VALUE_NOT_CLEAR") {
    return {
      insight:
        "La mayoría de prospectos no percibe suficiente valor antes de evaluar precio.",
      recommendation:
        "Mover mensajes de producto hacia consecuencias, impacto y problemas reales."
    };
  }

  if (dominantIntent === "TRUST_ISSUE") {
    return {
      insight:
        "La confianza parece ser una barrera más fuerte que el producto.",
      recommendation:
        "Incluir pruebas, ejemplos y lenguaje más transparente."
    };
  }

  if (dominantIntent === "AVOIDING_DECISION") {
    return {
      insight:
        "Los prospectos evitan decidir aun después de mostrar interés.",
      recommendation:
        "Usar preguntas de claridad en lugar de más información."
    };
  }

  if (dominantOutcome === "NO_RESPONSE") {
    return {
      insight:
        "La principal fuga parece ocurrir después del contacto inicial.",
      recommendation:
        "Optimizar followups y reducir longitud de mensajes."
    };
  }

  return {
    insight:
      "Aún no hay suficiente información para detectar un patrón dominante.",
    recommendation:
      "Seguir acumulando conversaciones."
  };
}

function buildLearningReport({
  advisorId = "UNKNOWN"
} = {}) {

  const memories = loadAllMemories();

  const objectionAnalysis =
    analyzeObjections(memories);

  const intentAnalysis =
    analyzeIntents(memories);

  const outcomeAnalysis =
    analyzeOutcomes(memories);

  const learning =
    generateLearningInsights({
      dominantObjection:
        objectionAnalysis.dominant.value,

      dominantIntent:
        intentAnalysis.dominant.value,

      dominantOutcome:
        outcomeAnalysis.dominant.value
    });

  const totalConversations =
    memories.reduce((sum, memory) => {
      return (
        sum +
        (memory.conversationHistory || []).length
      );
    }, 0);

  const totalObjections =
    memories.reduce((sum, memory) => {
      return (
        sum +
        (memory.objectionHistory || []).length
      );
    }, 0);

  return {
    engine: "NASH_LEARNING_ENGINE",
    version: "0.1",

    advisorId,

    stats: {
      prospects: memories.length,
      conversations: totalConversations,
      objections: totalObjections
    },

    dominantObjection:
      objectionAnalysis.dominant.value,

    dominantIntent:
      intentAnalysis.dominant.value,

    dominantOutcome:
      outcomeAnalysis.dominant.value,

    learningInsight:
      learning.insight,

    recommendation:
      learning.recommendation
  };
}

module.exports = {
  loadAllMemories,
  analyzeObjections,
  analyzeIntents,
  analyzeOutcomes,
  generateLearningInsights,
  buildLearningReport
};
