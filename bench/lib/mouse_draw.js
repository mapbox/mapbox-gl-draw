var mouseEvents = require('./mouse_events');
var mousePath = require('./mouse_path');

module.exports = function(start, map) {

  var path = mousePath(start);

  var events = mouseEvents(map);

  events.push('mousemove', {
    x: start.x,
    y: start.y
  });

  events.push('click', {
    x: start.x,
    y: start.y
  }, true);

  for (var i=0; i<path.length; i++) {
    events.push('mousemove', path[i]);
    events.push('click', path[i]);
  }

  return function(cb) {
    events.run(cb);
  }
}
