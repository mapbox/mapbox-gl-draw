
module.exports = function(coord, properties) {
  return {
      type: 'Feature',
      properties: Object.assign(properties, {
        meta: 'vertex',
      }),
      geometry: {
        type: 'Point',
        coordinates: coord
      }
    }
}
