var mouseEvents = require('./mouse_events');
var mousePath = require('./mouse_path');

module.exports = function(start, map) {

  var path = mousePath(start);

  var events = mouseEvents(map);

  events.push('mousedown', {
    x: start.x,
    y: start.y
  });

  events.push('mousemove', {
    x: start.x,
    y: start.y
  });

  for (var i=0; i<path.length; i++) {
    events.push('mouseup', path[i]);
    events.push('mousemove', path[i]);
    events.push('mousedown', path[i]);
  }

  events.push('mouseup', path[path.length-1]);

  return function(cb) {
    events.run(cb);
  }
}
