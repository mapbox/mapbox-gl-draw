export default function(lng = 0, lat = 0, eventProperties = {}) {
  const e = {
    originalEvent: Object.assign({
      stopPropagation() {},
      preventDefault() {},
      button: 0,
      clientX: lng,
      clientY: lat
    }, eventProperties),
    point: {x: lng, y:lat},
    lngLat: {lng, lat}
  };

  return e;
}
