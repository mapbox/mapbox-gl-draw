import test from 'tape';
import Point from 'point-geometry';
import mouseEventPoint from '../src/lib/mouse_event_point';

test('mouseEventPoint', t => {
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
  t.equal(result instanceof Point, true);
  t.equal(result.x, 3);
  t.equal(result.y, 12);

  t.end();
});
