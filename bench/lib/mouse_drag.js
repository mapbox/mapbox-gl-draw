import mouseEvents from './mouse_events'
import mousePath from './mouse_path'

export default function(start, map) {

  var path = mousePath(start);

  var events = mouseEvents(map);

  events.push('mousedown', {
    x: start.x,
    y: start.y
  }, true);

  for (var i=0; i<path.length; i++) {
    events.push('mousemove', path[i]);
  }
  for (var i=path.length-1; i>=0; i--) {
    events.push('mousemove', path[i]);
  }

  events.push('mouseup', {
    x: start.x,
    y: start.y
  });

  return function(cb) {
    events.run(cb);
  }
}
