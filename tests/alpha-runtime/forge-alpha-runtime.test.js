// tests/alpha-runtime/forge-alpha-runtime.test.js
const assert = require('assert');
const ForgeAlphaRuntime = require('../../src/intelligence/alpha-runtime/forge-alpha-runtime');

const runtime = new ForgeAlphaRuntime();

const cases = [
  { note: "Hablé con Lariza. Lo revisa con su novio. Quedamos de hablar el viernes.", expectedOwner: 'prospect' },
  { note: "Marlene: 'I'll look at it and call you by Friday'.", expectedOwner: 'prospect' },
  { note: "Marlene said she will review the proposal and call me back by Friday.", expectedOwner: 'prospect' },
  { note: "I'll send Marlene the revised proposal by Friday.", expectedOwner: 'advisor' },
  { note: "Marlene me confirma mañana después de revisar la propuesta.", expectedOwner: 'prospect' },
  { note: "Le enviaré a Marlene la propuesta mañana.", expectedOwner: 'advisor' },
  { note: "Ricardo Mejía exam scheduled.", expectedOwner: 'advisor' }, // simplified
];

cases.forEach(c => {
  const result = runtime.process(c.note);
  console.log(`Testing: ${c.note}`);
  assert.strictEqual(result.owner, c.expectedOwner, `Expected ${c.expectedOwner} for note: ${c.note}`);
  console.log('Passed');
});

console.log('All tests passed.');
