import assert from 'node:assert/strict';
import test from 'node:test';

const states = [
  'declared',
  'ready',
  'implementation_started',
  'implementation_complete',
  'tests_pass',
  'validated',
  'delivered'
];

const transitions = {
  declared: ['ready'],
  ready: ['implementation_started'],
  implementation_started: ['implementation_complete'],
  implementation_complete: ['tests_pass'],
  tests_pass: ['validated'],
  validated: ['delivered'],
  delivered: []
};

test('state graph is sequential', () => {
  states.forEach((state, index) => {
    const expected = index === states.length - 1 ? [] : [states[index + 1]];
    assert.deepEqual(transitions[state], expected);
  });
});

test('states are unique', () => {
  assert.equal(new Set(states).size, states.length);
});
