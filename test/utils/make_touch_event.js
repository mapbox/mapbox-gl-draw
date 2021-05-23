import xtend from 'xtend';

export default function(lng = 0, lat = 0, eventProperties = {}, additionalPoints = []) {
  const point = {x: lng, y:lat};
  const e = {
    originalEvent: xtend({
      stopPropagation() {},
      preventDefault() {},
      button: 0,
      clientX: lng,
      clientY: lat
    }, eventProperties),
    point,
    points: [point].concat(additionalPoints),
    lngLat: {lng, lat}
  };

  return e;
}
