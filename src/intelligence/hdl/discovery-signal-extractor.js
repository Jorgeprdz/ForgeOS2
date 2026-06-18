const { SIGNAL_TYPES, isValidSignalType } = require('./signal-types');

/**
 * HDL Discovery Signal Extractor
 * 
 * This service derives consultative context (Discovery Signals) from 
 * Semantic Frames using deterministic pattern matching on the source text.
 */

/**
 * Creates a structured Discovery Signal.
 * 
 * @param {string} type - One of SIGNAL_TYPES
 * @param {string} value - The specific observation (e.g., "PPR_INTEREST")
 * @param {number} [confidence=0.5] - Signal intensity (0.0 - 1.0)
 * @returns {Object}
 */
function createDiscoverySignal(type, value, confidence = 0.5) {
  if (!isValidSignalType(type)) {
    throw new Error(`Invalid Discovery Signal Type: ${type}`);
  }

  return {
    signal_type: type,
    value: value,
    confidence: Math.max(0, Math.min(1, confidence)),
    extracted_at: new Date().toISOString()
  };
}

/**
 * Extracts signals from a semantic frame based on its provenance and interpretations.
 * 
 * @param {Object} frame - The Semantic Frame
 */
function extractDiscoverySignals(frame) {
  const signals = [];
  const text = (frame.provenance?.note_text_snippet || '').toLowerCase();
  
  if (!text) return signals;

  // 1. PRODUCT_COMPARISON
  if (text.includes(' o ') || text.includes(' vs ') || text.includes(' contra ')) {
    if (text.includes('orvi') || text.includes('vida mujer') || text.includes('ppr') || text.includes('imagina ser')) {
       signals.push(createDiscoverySignal(SIGNAL_TYPES.PRODUCT_COMPARISON, text, 0.8));
    }
  }

  // 2. UNCERTAINTY_SIGNAL
  if (text.includes('va a pensar') || text.includes('pensar') || text.includes('duda') || text.includes('tal vez')) {
    signals.push(createDiscoverySignal(SIGNAL_TYPES.UNCERTAINTY_SIGNAL, text, 0.7));
  }

  // 3. NETWORK_SIGNAL
  if (text.includes('conoce') && (text.includes('gente') || text.includes('muchos') || text.includes('contactos'))) {
    signals.push(createDiscoverySignal(SIGNAL_TYPES.NETWORK_SIGNAL, text, 0.9));
  }

  // 4. PRODUCT_INTEREST
  if (text.includes('interesa') || text.includes('quiero') || text.includes('gusta')) {
     if (text.includes('orvi') || text.includes('vida mujer') || text.includes('ppr') || text.includes('imagina ser')) {
       signals.push(createDiscoverySignal(SIGNAL_TYPES.PRODUCT_INTEREST, text, 0.85));
     }
  }

  // 5. OBJECTION_SIGNAL
  if (text.includes('no tengo dinero') || text.includes('caro') || text.includes('presupuesto')) {
    signals.push(createDiscoverySignal(SIGNAL_TYPES.OBJECTION_SIGNAL, text, 0.9));
  }

  // 6. TIMING_SIGNAL
  if (text.includes('regrese') || text.includes('vacaciones') || text.includes('después') || text.includes('luego')) {
    signals.push(createDiscoverySignal(SIGNAL_TYPES.TIMING_SIGNAL, text, 0.8));
  }
  
  // Deduplicate by signal_type
  const uniqueSignals = [];
  const seenTypes = new Set();
  
  for (const signal of signals) {
    if (!seenTypes.has(signal.signal_type)) {
      uniqueSignals.push(signal);
      seenTypes.add(signal.signal_type);
    }
  }

  return uniqueSignals;
}

module.exports = {
  createDiscoverySignal,
  extractDiscoverySignals
};
