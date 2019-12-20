import mouseEvents from './mouse_events'

export default function(ring, map) {

  var events = mouseEvents(map);

  var lastPoint = null;

  for (var c=0; c<ring.length; c++) {
    var coord = ring[c];
    var point = map.project({
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
  }

}
