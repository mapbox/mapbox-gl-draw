import test from 'node:test';
import assert from 'node:assert/strict';
import createMap from './utils/create_map.js';
import createSupplementaryPoints from '../src/lib/create_supplementary_points.js';

test('createSupplementaryPoints with a point', () => {
  const point = {
    type: 'Point',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'Point',
      coordinates: [10, 15]
    }
  };

  const result = createSupplementaryPoints(point);

  assert.deepEqual(result, [{
    geometry: {
      coordinates: [10, 15],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: null,
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }]);


});

test('createSupplementaryPoints with a line, no midpoints', () => {
  const line = {
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [4, 4], [8, 8]]
    }
  };

  const result = createSupplementaryPoints(line);

  assert.deepEqual(result, [{
    geometry: {
      coordinates: [0, 0],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [4, 4],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '1',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [8, 8],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '2',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }], 'adds vertices');


});

test('createSupplementaryPoints with a polygon, no midpoints', () => {
  const polygon = {
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]]
    }
  };
  const result = createSupplementaryPoints(polygon);

  assert.deepEqual(result, [{
    geometry: {
      coordinates: [1, 1],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0.0',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [2, 2],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0.1',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [3, 3],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0.2',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [4, 4],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0.3',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }], 'adds vertices');


});

test('createSupplementaryPoints with line, midpoints, selected coordinate', () => {
  const line = {
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [4, 4], [8, 8]]
    }
  };
  const map = createMap();

  const results = createSupplementaryPoints(line, {
    map,
    midpoints: true,
    selectedPaths: '1'
  });

  assert.deepEqual(results, [{
    geometry: {
      coordinates: [0, 0],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [2, 2.00121958],
      type: 'Point'
    },
    properties: {
      coord_path: '1',
      lat: 2.00121958,
      lng: 2,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [4, 4],
      type: 'Point'
    },
    properties: {
      active: 'true',
      coord_path: '1',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [6, 6.00367071],
      type: 'Point'
    },
    properties: {
      coord_path: '2',
      lat: 6.00367071,
      lng: 6,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [8, 8],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '2',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }], 'adds vertices and midpoints');


});

test('createSupplementaryPoints with polygon, midpoints, selection', () => {
  const polygon = {
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]]
    }
  };

  const map = createMap();

  const results = createSupplementaryPoints(polygon, {
    map,
    midpoints: true,
    selectedPaths: '0.1'
  });

  assert.deepEqual(results, [{
    geometry: {
      coordinates: [1, 1],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0.0',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [1.5, 1.50005713],
      type: 'Point'
    },
    properties: {
      coord_path: '0.1',
      lat: 1.50005713,
      lng: 1.5,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [2, 2],
      type: 'Point'
    },
    properties: {
      active: 'true',
      coord_path: '0.1',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [2.5, 2.50009526],
      type: 'Point'
    },
    properties: {
      coord_path: '0.2',
      lat: 2.50009526,
      lng: 2.5,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [3, 3],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0.2',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [3.5, 3.50013344],
      type: 'Point'
    },
    properties: {
      coord_path: '0.3',
      lat: 3.50013344,
      lng: 3.5,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [4, 4],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0.3',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [2.5, 2.50085753],
      type: 'Point'
    },
    properties: {
      coord_path: '0.4',
      lat: 2.50085753,
      lng: 2.5,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }], 'adds vertices and midpoints');


});

test('createSupplementaryPoints with MultiLineString, midpoints, selected coordinate', () => {
  const line = {
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [[0, 0], [4, 4], [8, 8]],
        [[20, 20], [24, 24], [28, 28]]
      ]
    }
  };
  const map = createMap();

  const results = createSupplementaryPoints(line, {
    map,
    midpoints: true,
    selectedPaths: '1.2'
  });

  assert.deepEqual(results, [{
    geometry: {
      coordinates: [0, 0],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0.0',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [2, 2.00121958],
      type: 'Point'
    },
    properties: {
      coord_path: '0.1',
      lat: 2.00121958,
      lng: 2,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [4, 4],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0.1',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [6, 6.00367071],
      type: 'Point'
    },
    properties: {
      coord_path: '0.2',
      lat: 6.00367071,
      lng: 6,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [8, 8],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0.2',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [20, 20],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '1.0',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [22, 22.01411104],
      type: 'Point'
    },
    properties: {
      coord_path: '1.1',
      lat: 22.01411104,
      lng: 22,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [24, 24],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '1.1',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [26, 26.01703496],
      type: 'Point'
    },
    properties: {
      coord_path: '1.2',
      lat: 26.01703496,
      lng: 26,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [28, 28],
      type: 'Point'
    },
    properties: {
      active: 'true',
      coord_path: '1.2',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }]);


});

test('createSupplementaryPoints with a line, not all midpoints rendered because of vertex exceeding projection latitude north limit', () => {
  const line = {
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [4, 4], [7, 87]]
    }
  };

  const result = createSupplementaryPoints(line, {
    map: createMap(),
    midpoints: true
  });

  assert.deepEqual(result, [{
    geometry: {
      coordinates: [0, 0],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [2, 2.00121958],
      type: 'Point'
    },
    properties: {
      coord_path: '1',
      lat: 2.00121958,
      lng: 2,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [4, 4],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '1',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [7, 87],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '2',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }], 'adds vertices');


});


test('createSupplementaryPoints with a line, not all midpoints rendered because of vertex exceeding projection latitude south limit', () => {
  const line = {
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [4, 4], [7, -87]]
    }
  };

  const result = createSupplementaryPoints(line, {
    map: createMap(),
    midpoints: true
  });

  assert.deepEqual(result, [{
    geometry: {
      coordinates: [0, 0],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '0',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [2, 2.00121958],
      type: 'Point'
    },
    properties: {
      coord_path: '1',
      lat: 2.00121958,
      lng: 2,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [4, 4],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '1',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [7, -87],
      type: 'Point'
    },
    properties: {
      active: 'false',
      coord_path: '2',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }], 'adds vertices');


});
