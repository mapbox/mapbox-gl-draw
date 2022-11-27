import mouseEvents from './mouse_events';

export default function(ring, map) {

  const events = mouseEvents(map);

  let lastPoint = null;

  for (let c = 0; c < ring.length; c++) {
    const coord = ring[c];
    const point = map.project({
      lng: coord[0],
      lat: coord[1]
    });
    if (!isNaN(point.x)) {
      lastPoint = point;
      events.push('mouseup', point);
      events.push('mousemove', point);
      events.push('mousedown', point);
    }
  }

  if (lastPoint) {
    events.push('mouseup', lastPoint);
  }

  return function(cb) {
    events.run(cb);
  };
}
