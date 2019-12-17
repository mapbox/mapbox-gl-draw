import test from 'tape';
import isEventAtCoordinates from '../src/lib/is_event_at_coordinates';

test('isEventAtCoordinates', (t) => {
  t.ok(isEventAtCoordinates({
    lngLat: {
      lng: 3,
      lat: 29
    }
  }, [3, 29]));
  t.notOk(isEventAtCoordinates({
    lngLat: {
      lng: -3,
      lat: 29
    }
  }, [3, 29]));
  t.notOk(isEventAtCoordinates({
    nothing: true
  }, [3, 29]));
  t.end();
});
