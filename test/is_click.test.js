import test from 'tape';
import isClick from '../src/lib/is_tap';

// By adding these values as options and stating them in the test,
// we can know the calculation works from the tests, but tweak
// the actual constants in `is_tap.js` without having to
// rewrite tests.
const testOptions = {
  tolerance: 12,
  interval: 500,
};

const start = { point: { x: 1, y: 1 }, time: 1 };
const pointInsideTolerence = { x: 9.2, y: 9.2}; // ~11.596551 from `start`
const pointOutsideTolerence = { x: 9.5, y: 9.5}; // ~12.020815 from `start`
const timeInsideInterval = 500; // 499 ms after `start`
const timeOutsideInterval = 502; // 501 ms after `start`

test('isClick basics', (t) => {
  const end = start;
  t.equal(isClick({}, end, testOptions), true, 'true when start is missing point and time');
  t.equal(isClick({ time: 2000 }, end, testOptions), true, 'true when start has only time');
  t.equal(isClick(start, end, testOptions), true, 'true when start and end match exactly');
  t.end();
});

test('isClick when moving within the tolerated distance and duration', (t) => {
  const end = { point: pointInsideTolerence, time: timeInsideInterval };
  t.equal(isClick(start, end, testOptions), true);
  t.end();
});

test('!isClick when moving beyond the tolerated distance, and inside the tolerated duration', (t) => {
  const end = { point: pointOutsideTolerence, time: timeInsideInterval };
  t.equal(isClick(start, end, testOptions), false);
  t.end();
});

test('!isClick when moving inside the tolerated distance, but beyond the tolerated duration', (t) => {
  const end = { point: pointInsideTolerence, time: timeOutsideInterval };
  t.equal(isClick(start, end, testOptions), false);
  t.end();
});
