import test from 'node:test';
import assert from 'node:assert/strict';
import isTap from '../src/lib/is_tap.js';

// By adding these values as options and stating them in the test,
// we can know the calculation works from the tests, but tweak
// the actual constants in `is_tap.js` without having to
// rewrite tests.
const testOptions = {
  tolerance: 25,
  interval: 250
};

test('isTap easy', () => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 1, y: 1},
    time: 1
  };
  assert.equal(isTap({}, b, testOptions), true, 'true when start is missing point and time');
  assert.equal(isTap({ time: 2000 }, b, testOptions), true, 'true when start has only time');
  assert.equal(isTap(a, b, testOptions), true, 'true when start and end match exactly');
});

test('isTap when moving barely at all, same times', () => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 2, y: 1.5},
    time: 1
  };
  assert.equal(isTap(a, b, testOptions), true);
});

test('isTap when moving just under the distance limit, same times', () => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 18.6, y: 18.6 },
    time: 1
  };
  // Move distance ~24.89016
  assert.equal(isTap(a, b, testOptions), true);
});

test('isTap when moving just over the distance limit, same times', () => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 18.7, y: 18.7 },
    time: 1
  };
  // Move distance ~25.03158
  assert.equal(isTap(a, b, testOptions), false);
});

test('isTap when moving barely at all, just before the time limit', () => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 2, y: 1.5},
    time: 250
  };
  assert.equal(isTap(a, b, testOptions), true);
});

test('isTap when moving just under the limit, just after the time limit', () => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 18.6, y: 18.6 },
    time: 252
  };
  // Move distance ~24.89016
  assert.equal(isTap(a, b, testOptions), false);
});

test('isTap when moving just over the limit, same times', () => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 18.7, y: 18.7 },
    time: 1
  };
  // Move distance ~25.03158
  assert.equal(isTap(a, b, testOptions), false);
});
