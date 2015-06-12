module.exports = [
  {
    'id': 'gl-draw-points',
    'type': 'symbol',
    'source': 'draw',
    'filter': ['all', ['==', '$type', 'Point']],
    'layout': {
      'icon-image': 'marker-12',
      'text-anchor': 'top',
      'icon-allow-overlap': true
    },
    'paint': {
      'icon-color': '#ff00ff',
      'icon-size': 2
    },
    'interactive': true
  }, {
    'id': 'gl-draw-polygons',
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
  }
];
