import test from 'node:test';
import assert from 'node:assert/strict';
import Point from '@mapbox/point-geometry';
import mouseEventPoint from '../src/lib/mouse_event_point.js';

test('mouseEventPoint', () => {
  const mockContainer = {
    clientLeft: 2,
    clientTop: 1,
    getBoundingClientRect() {
      return {
        left: 10,
        top: 20
      };
    }
  };

  const mockEvent = {
    clientX: 15,
    clientY: 33
  };

  const result = mouseEventPoint(mockEvent, mockContainer);
  assert.equal(result instanceof Point, true);
  assert.equal(result.x, 3);
  assert.equal(result.y, 12);
});
