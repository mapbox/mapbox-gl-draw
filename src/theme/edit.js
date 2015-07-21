module.exports = [
  {
    'id': 'gl-edit-line',
    'type': 'line',
    'source': 'edit',
    'filter': ['all', ['==', '$type', 'LineString']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#000000',
      'line-dasharray': [0, 2],
      'line-width': 3
    }
  }, {
    'id': 'gl-edit-points',
    'type': 'symbol',
    'source': 'edit',
    'filter': ['all', ['==', '$type', 'Point']],
    'layout': {
      'icon-image': 'circle-stroked-12',
      'text-anchor': 'top',
      'icon-allow-overlap': true
    },
    'paint': {
      'icon-color': '#f1f075',
      'icon-size': 2
    },
    'interactive': true
  }, {
    'id': 'gl-edit-polygon',
    'type': 'fill',
    'source': 'edit',
    'filter': ['all', ['==', '$type', 'Polygon']],
    'paint': {
      'fill-color': '#000000',
      'fill-outline-color': '#000000',
      'fill-opacity': 0.25
    },
    'interactive': true
  }, {
    'id': 'gl-edit-polygon-stroke',
    'type': 'line',
    'source': 'edit',
    'filter': ['all', ['==', '$type', 'Polygon']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#000000',
      'line-dasharray': [2, 2],
      'line-width': 3
    }
  }
];
