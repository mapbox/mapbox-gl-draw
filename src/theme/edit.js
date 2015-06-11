module.exports = [
  {
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
    'id': 'gl-edit-line',
    'type': 'line',
    'source': 'edit',
    'filter': ['all', ['==', '$type', 'LineString']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#ff00ff',
      'line-dasharray': [0, 2],
      'line-width': 3
    }
  }
];
