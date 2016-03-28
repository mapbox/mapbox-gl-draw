var mouseEvents = require('./mouse_events');

module.exports = function(ring, map) {

  var events = mouseEvents(map);

  for (var c=0; c<ring.length; c++) {
    var coord = ring[c];
    var point = map.project({
      lng: coord[0],
      lat: coord[1]
    });
    if (!isNaN(point.x)) {
      events.push('mousemove', point);
      events.push('click', point);
    }
  }

  return function(cb) {
    events.run(cb);
  }

}
