module.exports = [
  {
    'id': 'gl-drawing-line',
    'type': 'line',
    'source': 'drawing',
    'filter': ['all', ['==', '$type', 'LineString']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#000000',
      'line-dasharray': [0, 2],
      'line-width': 3
    },
    'interactive': true
  }, {
    'id': 'gl-drawing-polygon',
    'type': 'fill',
    'source': 'drawing',
    'filter': ['all', ['==', '$type', 'Polygon']],
    'paint': {
      'fill-color': '#000000',
      'fill-opacity': 0.25
    },
    'interactive': true
  }, {
    'id': 'gl-drawing-polygon-stroke',
    'type': 'line',
    'source': 'drawing',
    'filter': ['all', ['==', '$type', 'Polygon']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#000000',
      'line-dasharray': [2, 2],
      'line-width': 3
    },
    'interactive': true
  }, {
    'id': 'gl-drawing-points',
    'type': 'circle',
    'source': 'drawing',
    'filter': ['all', ['==', '$type', 'Point']],
    'layout': {
      'text-anchor': 'top',
      'icon-allow-overlap': true
    },
    'paint': {
      'icon-color': '#ffffff',
      'icon-halo-color': '#000000',
      'icon-halo-width': 2,
      'icon-size': 1.1
    },
    'interactive': true
  }
];
