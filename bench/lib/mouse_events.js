module.exports = function(map) {
  var events = [];

  events.push = function(event, point, dp) {
    var payload = {
      dropPoint: dp === undefined ? false : dp,
      originalEvent: {
        isShiftKey: false,
        stopPropagation: function() {}
      },
      point: point,
      lngLat: map.unproject([point.x, point.y])
    };
    events[events.length] =[event, payload];
  }

  events.run = function(cb) {
    var one = 100/events.length;
    var runner = function(i) {
      var event = events[i];
      if (event === undefined) {
        cb();
      }
      else {
        map.fire(event[0], event[1]);
        map.fire('progress', {done:Math.ceil(one*i)});
        setTimeout(function() {
          runner(i+1);
        }, 0);
      }
    }
    runner(0);
  }

  return events;
}
