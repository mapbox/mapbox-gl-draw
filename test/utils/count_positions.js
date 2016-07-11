export default function (feature) {
  return feature.geometry.coordinates.join(',').split(',').length;
}
