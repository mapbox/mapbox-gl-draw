import test from 'node:test';
import assert from 'node:assert/strict';
import isEventAtCoordinates from '../src/lib/is_event_at_coordinates.js';

test('isEventAtCoordinates', () => {
  assert.ok(isEventAtCoordinates({
    lngLat: {
      lng: 3,
      lat: 29
    }
  }, [3, 29]));
  assert.equal(isEventAtCoordinates({
    lngLat: {
      lng: -3,
      lat: 29
    }
  }, [3, 29]), false);

  assert.equal(isEventAtCoordinates({
    nothing: true
  }, [3, 29]), false);
});
