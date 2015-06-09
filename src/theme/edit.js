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
    }
  }
];
