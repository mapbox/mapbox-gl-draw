import test from 'tape';
import isTap from '../src/lib/is_tap';

// By adding these values as options and stating them in the test,
// we can know the calculation works from the tests, but tweak
// the actual constants in `is_tap.js` without having to
// rewrite tests.
const testOptions = {
  tolerance: 25,
  interval: 250,
};

const start = { point: { x: 1, y: 1 }, time: 1 };
const pointInsideTolerence = { x: 18.6, y: 18.6 }; // ~24.89016 from `start`
const pointOutsideTolerence = { x: 18.7, y: 18.7 }; // ~25.03158 from `start`
const timeInsideInterval = 250; // 249 ms after `start`
const timeOutsideInterval = 252; // 251 ms after `start`

test('isTap basics', (t) => {
  const end = start;
  t.equal(isTap({}, end, testOptions), true, 'true when start is missing point and time');
  t.equal(isTap({ time: 2000 }, end, testOptions), true, 'true when start has only time');
  t.equal(isTap(start, end, testOptions), true, 'true when start and end match exactly');
  t.end();
});

test('isTap when moving within the tolerated distance and duration', (t) => {
  const end = { point: pointInsideTolerence, time: timeInsideInterval };
  t.equal(isTap(start, end, testOptions), true);
  t.end();
});

test('!isTap when moving beyond the tolerated distance, and inside the tolerated duration', (t) => {
  const end = { point: pointOutsideTolerence, time: timeInsideInterval };
  t.equal(isTap(start, end, testOptions), false);
  t.end();
});

test('!isTap when moving inside the tolerated distance, but beyond the tolerated duration', (t) => {
  const end = { point: pointInsideTolerence, time: timeOutsideInterval };
  t.equal(isTap(start, end, testOptions), false);
  t.end();
});
