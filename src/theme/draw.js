module.exports = [
  {
    'id': 'gl-draw-polygon',
    'type': 'fill',
    'source': 'draw',
    'filter': ['all', ['==', '$type', 'Polygon']],
    'paint': {
      'fill-color': '#ff00ff',
      'fill-outline-color': '#ff00ff',
      'fill-opacity': 0.25
    },
    'interactive': true
  }, {
    'id': 'gl-draw-polygon-stroke',
    'type': 'line',
    'source': 'draw',
    'filter': ['all', ['==', '$type', 'Polygon']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#ff00ff',
      'line-width': 2
    },
    'interactive': true
  }, {
    'id': 'gl-draw-line',
    'type': 'line',
    'source': 'draw',
    'filter': ['all', ['==', '$type', 'LineString']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#ff00ff',
      'line-width': 2
    },
    'interactive': true
  }, {
    'id': 'gl-draw-point',
    'type': 'circle',
    'source': 'draw',
    'filter': ['all', ['==', '$type', 'Point']],
    'paint': {
      'circle-radius': 5,
      'circle-color': '#ff00ff'
    },
    'interactive': true
  }
];
