export default function(map) {
  const events = [];

  events.push = function(event, point, dp) {
    const payload = {
      dropPoint: dp === undefined ? false : dp,
      originalEvent: {
        isShiftKey: false,
        stopPropagation() {}
      },
      point,
      lngLat: map.unproject([point.x, point.y])
    };
    events[events.length] = [event, payload];
  };

  events.run = function(cb) {
    const one = 100 / events.length;
    const runner = function(i) {
      const event = events[i];
      if (event === undefined) {
        cb();
      } else {
        map.fire(event[0], event[1]);
        map.fire('progress', {done:Math.ceil(one * i)});
        setTimeout(() => {
          runner(i + 1);
        }, 0);
      }
    };
    runner(0);
  };

  return events;
}
