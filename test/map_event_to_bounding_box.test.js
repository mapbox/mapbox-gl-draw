import test from 'node:test';
import assert from 'node:assert/strict';
import mapEventToBoundingBox from '../src/lib/map_event_to_bounding_box.js';

test('mapEventToBoundingBox', () => {
  assert.deepEqual(mapEventToBoundingBox({
    point: {
      x: 1,
      y: 2
    }
  }), [[1, 2], [1, 2]]);

  assert.deepEqual(mapEventToBoundingBox({
    point: {
      x: 1,
      y: 2
    }
  }, 1), [[0, 1], [2, 3]]);

  assert.deepEqual(mapEventToBoundingBox({
    point: {
      x: 10.3,
      y: 95674.234
    }
  }, 50.5), [[-40.2, 95623.734], [60.8, 95724.734]]);
});
