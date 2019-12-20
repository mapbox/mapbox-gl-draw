import mouseEvents from './mouse_events';
import mousePath from './mouse_path';

export default function(start, map) {
  const path = mousePath(start);

  const events = mouseEvents(map);

  events.push('mousedown', {
    x: start.x,
    y: start.y
  });

  events.push('mousemove', {
    x: start.x,
    y: start.y
  });

  for (let i = 0; i < path.length; i++) {
    events.push('mouseup', path[i]);
    events.push('mousemove', path[i]);
    events.push('mousedown', path[i]);
  }

  events.push('mouseup', path[path.length - 1]);

  return function(cb) {
    events.run(cb);
  };
}
