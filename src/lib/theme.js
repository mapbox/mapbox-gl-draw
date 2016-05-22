module.exports = [
  {
    'id': 'gl-draw-active-line',
    'type': 'line',
    'filter': ['all',
      ['==', '$type', 'LineString'],
      ['!=', 'meta', 'border'],
      ['==', 'active', 'true']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#FF9800',
      'line-dasharray': [0.2, 2],
      'line-width': 4
    },
    'interactive': true
  },
  {
    'id': 'gl-draw-border',
    'type': 'line',
    'filter': ['all',
      ['==', '$type', 'LineString'],
      ['==', 'meta', 'border']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#888888',
      'line-dasharray': [0.2, 2],
      'line-width': 4
    },
    'interactive': true
  },
  {
    'id': 'gl-draw-active-polygon',
    'type': 'fill',
    'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    'paint': {
      'fill-color': '#FF9800',
      'fill-opacity': 0.25
    },
    'interactive': true
  },
  {
    'id': 'gl-draw-active-polygon-stroke',
    'type': 'line',
    'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon'], ['==', 'has-border', 'false']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#FF9800',
      'line-dasharray': [0.2, 2],
      'line-width': 4
    },
    'interactive': true
  },


  {
    'id': 'gl-draw-polygon',
    'type': 'fill',
    'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
    'paint': {
      'fill-color': '#03A9F4',
      'fill-outline-color': '#03A9F4',
      'fill-opacity': 0.25
    },
    'interactive': true
  },
  {
    'id': 'gl-draw-polygon-stroke',
    'type': 'line',
    'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#03A9F4',
      'line-width': 3
    },
    'interactive': true
  },
  {
    'id': 'gl-draw-line',
    'type': 'line',
    'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString'], ['!=', 'meta', 'border']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#03A9F4',
      'line-width': 3
    },
    'interactive': true
  },
  {
    'id': 'gl-draw-active-point',
    'type': 'circle',
    'filter': ['all',
      ['==', '$type', 'Point'],
      ['==', 'active', 'true']
    ],
    'paint': {
      'circle-radius': 9,
      'circle-color': '#fff'
    },
    'interactive': true
  },
  {
    'id': 'gl-draw-active-point-highlight',
    'type': 'circle',
    'filter': ['all',
      ['==', '$type', 'Point'],
      ['==', 'active', 'true']
    ],
    'paint': {
      'circle-radius': 7,
      'circle-color': '#EF6C00'
    },
    'interactive': true
  },
  {
    'id': 'gl-draw-polygon-point-outline',
    'type': 'circle',
    'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
    'paint': {
      'circle-radius': 9,
      'circle-color': '#fff'
    },
    'interactive': true
  },
  {
    'id': 'gl-draw-polygon-point',
    'type': 'circle',
    'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
    'paint': {
      'circle-radius': 7,
      'circle-color': '#FF9800'
    },
    'interactive': true
  },
  {
    'id': 'gl-draw-point-point-outline',
    'type': 'circle',
    'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
    'paint': {
      'circle-radius': 9,
      'circle-color': '#fff'
    },
    'interactive': true
  },
  {
    'id': 'gl-draw-point',
    'type': 'circle',
    'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
    'paint': {
      'circle-radius': 7,
      'circle-color': '#03A9F4'
    },
    'interactive': true
  },
  {
    'id': 'gl-draw-too-small',
    'type': 'circle',
    'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'too-small']],
    'paint': {
      'circle-radius': 5,
      'circle-color': '#037994'
    },
    'interactive': true
  }
];
