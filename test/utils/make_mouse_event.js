module.exports = function(lng, lat, shiftKey = false) {
  var e = {
    originalEvent: {
      shiftKey: shiftKey,
      stopPropagation: function() {},
      button: 0,
      clientX: lng,
      clientY: lat
    },
    point: {x: lng, y:lat},
    lngLat: {lng: lng, lat: lat}
  };

  return e;
}
