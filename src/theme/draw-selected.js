export default [
  {
    'id': 'gl-draw-selected-line',
    'type': 'line',
    'source': 'draw-selected',
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
    'id': 'gl-draw-selected-polygon',
    'type': 'fill',
    'source': 'draw-selected',
    'filter': ['all', ['==', '$type', 'Polygon']],
    'paint': {
      'fill-color': '#000000',
      'fill-opacity': 0.25
    },
    'interactive': true
  }, {
    'id': 'gl-draw-selected-polygon-stroke',
    'type': 'line',
    'source': 'draw-selected',
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
    'id': 'gl-draw-selected-point',
    'type': 'circle',
    'source': 'draw-selected',
    'filter': ['all',
      ['==', '$type', 'Point'],
      ['!=', 'meta', 'midpoint']],
    'layout': {},
    'interactive': true
  }, {
    'id': 'gl-draw-selected-point-mid',
    'type': 'circle',
    'source': 'draw-selected',
    'filter': ['all',
      ['==', '$type', 'Point'],
      ['==', 'meta', 'midpoint']],
    'paint': {
      'circle-radius': 4,
      'circle-color': '#000000'
    },
    'interactive': true
  }
];
