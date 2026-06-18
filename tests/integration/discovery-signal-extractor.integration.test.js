const { extractDiscoverySignals } = require('../../src/intelligence/hdl/discovery-signal-extractor');
const SemanticFrame = require('../../src/intelligence/hdl/semantic-frame');

/**
 * Discovery Signal Extractor Integration Test
 */

function runTest() {
  console.log('--- DISCOVERY SIGNAL EXTRACTOR INTEGRATION TEST ---');
  let passed = 0;
  let failed = 0;

  const cases = [
    {
      name: 'Case 1: Product Comparison & Uncertainty',
      input: 'Me dijo que va a pensar si el ORVI o un Vida Mujer',
      expected: ['PRODUCT_COMPARISON', 'UNCERTAINTY_SIGNAL']
    },
    {
      name: 'Case 2: Network Signal',
      input: 'Su mamá conoce muchísima gente',
      expected: ['NETWORK_SIGNAL']
    },
    {
      name: 'Case 3: Product Interest',
      input: 'Le interesa un PPR',
      expected: ['PRODUCT_INTEREST']
    },
    {
      name: 'Case 4: Objection Signal',
      input: 'Ahorita no tengo dinero',
      expected: ['OBJECTION_SIGNAL']
    },
    {
      name: 'Case 5: Timing Signal',
      input: 'Cuando regrese de vacaciones',
      expected: ['TIMING_SIGNAL']
    }
  ];

  cases.forEach(c => {
    const frame = new SemanticFrame(c.input);
    const signals = extractDiscoverySignals(frame);
    const signalTypes = signals.map(s => s.signal_type);

    const missing = c.expected.filter(e => !signalTypes.includes(e));
    const extra = signalTypes.filter(s => !c.expected.includes(s));

    // Validation of rules
    const allConfidenceValid = signals.every(s => s.confidence >= 0 && s.confidence <= 1);
    const noDuplicates = new Set(signalTypes).size === signalTypes.length;

    if (missing.length === 0 && extra.length === 0 && allConfidenceValid && noDuplicates) {
      console.log(`✅ ${c.name}`);
      passed++;
    } else {
      console.log(`❌ ${c.name}`);
      if (missing.length > 0) console.log(`   Missing: ${missing.join(', ')}`);
      if (extra.length > 0) console.log(`   Extra: ${extra.join(', ')}`);
      if (!allConfidenceValid) console.log(`   Invalid confidence values detected`);
      if (!noDuplicates) console.log(`   Duplicate signals detected`);
      failed++;
    }
  });

  console.log('-------------------------------------------');
  console.log(`Summary: ${passed + failed} tests, ${passed} passed, ${failed} failed.`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTest();
