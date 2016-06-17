import test from 'tape';
import isClick from '../src/lib/is_click';

// By adding these values as options and stating them in the test,
// we can know the calculation works from the tests, but tweak
// the actual constants in `is_click.js` without having to
// rewrite tests.
const testOptions = {
  fineTolerance: 4,
  grossTolerance: 12,
  interval: 500
};

test('isClick easy', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 1, y: 1},
    time: 1
  };
  t.equal(isClick({}, b, testOptions), true, 'true when start is missing point and time');
  t.equal(isClick({ time: 2000 }, b, testOptions), true, 'true when start has only time');
  t.equal(isClick(a, b, testOptions), true, 'true when start and end match exactly');
  t.end();
});

test('isClick when start/end have same time, very close coordinates', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 2, y: 1.5},
    time: 1
  };
  t.equal(isClick(a, b, testOptions), true);
  t.end();
});

test('isClick when start/end have same coordinates, distant times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 1, y: 1},
    time: 6000
  };
  t.equal(isClick(a, b, testOptions), true);
  t.end();
});

test('isClick when start/end have very close coordinates, distant times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 2, y: 1.15},
    time: 6000
  };
  t.equal(isClick(a, b, testOptions), true);
  t.end();
});


test('isClick when moving just under 4, same times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 3.8, y: 3.8 },
    time: 1
  };
  // Move distance ~3.959798
  t.equal(isClick(a, b, testOptions), true);
  t.end();
});

test('isClick when moving just under 4, distant times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 3.8, y: 3.8 },
    time: 6000
  };
  // Move distance ~3.959798
  t.equal(isClick(a, b, testOptions), true);
  t.end();
});

test('isClick when moving just above 4, same times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 3.9, y: 3.9},
    time: 1
  };
  // Move distance ~4.101219
  t.equal(isClick(a, b, testOptions), true);
  t.end();
});

test('isClick when moving just above 4, very close times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 3.9, y: 3.9},
    time: 499
  };
  // Move distance ~4.101219
  t.equal(isClick(a, b, testOptions), true);
  t.end();
});

test('isClick when moving just above 4, distant times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 3.9, y: 3.9},
    time: 6000
  };
  // Move distance ~4.101219
  t.equal(isClick(a, b, testOptions), false);
  t.end();
});

test('isClick when moving just above 4, barely too distant times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 3.9, y: 3.9},
    time: 501
  };
  // Move distance ~4.101219
  t.equal(isClick(a, b, testOptions), false);
  t.end();
});

test('isClick when moving just below 12, same times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 9.2, y: 9.2},
    time: 1
  };
  // Move distance ~11.596551
  t.equal(isClick(a, b, testOptions), true);
  t.end();
});

test('isClick when moving just below 12, very close times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 9.2, y: 9.2},
    time: 499
  };
  // Move distance ~11.596551
  t.equal(isClick(a, b, testOptions), true);
  t.end();
});

test('isClick when moving just below 12, distant times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 9.2, y: 9.2},
    time: 6000
  };
  // Move distance ~11.596551
  t.equal(isClick(a, b, testOptions), false);
  t.end();
});

test('isClick when moving just below 12, barely too distant times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 9.2, y: 9.2},
    time: 501
  };
  // Move distance ~11.596551
  t.equal(isClick(a, b, testOptions), false);
  t.end();
});

test('isClick when moving just above 12, same times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 9.5, y: 9.5},
    time: 1
  };
  // Move distance ~12.020815
  t.equal(isClick(a, b, testOptions), false);
  t.end();
});

test('isClick when moving just above 12, distant times', t => {
  const a = {
    point: { x: 1, y: 1 },
    time: 1
  };
  const b = {
    point: { x: 9.5, y: 9.5},
    time: 6000
  };
  // Move distance ~12.020815
  t.equal(isClick(a, b, testOptions), false);
  t.end();
});
