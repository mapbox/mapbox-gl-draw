import test from 'tape';
import { createMap } from './test_utils';
import addCoords from '../src/lib/add_coords';

test('addCoords as in simple_select with line', t => {
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

  const features = [line];
  const map = createMap();

  addCoords(line, false, x => features.push(x), map, []);

  t.deepEqual(features, [{
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [4, 4], [8, 8]]
    }
  }, {
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

  t.end();
});

test('addCoords as in simple_select with polygon', t => {
  const line = {
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]]
    }
  };

  const features = [line];
  const map = createMap();

  addCoords(line, false, x => features.push(x), map, []);

  t.deepEqual(features, [{
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]]
    }
  }, {
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

  t.end();
});

test('addCoords as in direct_select with line', t => {
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

  const features = [line];
  const map = createMap();

  addCoords(line, true, x => features.push(x), map, '1');

  t.deepEqual(features, [{
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [4, 4], [8, 8]]
    }
  }, {
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
      active: 'true',
      coord_path: '1',
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
      coord_path: '1',
      lat: 2,
      lng: 2,
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
  }, {
    geometry: {
      coordinates: [6, 6],
      type: 'Point'
    },
    properties: {
      coord_path: '2',
      lat: 6,
      lng: 6,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }], 'adds vertices and midpoints');

  t.end();
});

test('addCoords as in direct_select with polygon', t => {
  const line = {
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]]
    }
  };

  const features = [line];
  const map = createMap();

  addCoords(line, true, x => features.push(x), map, '1.1');

  t.deepEqual(features, [{
    type: 'Feature',
    properties: {
      id: 'foo'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]]
    }
  }, {
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
      active: 'true',
      coord_path: '0.1',
      meta: 'vertex',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [1.5, 1.5],
      type: 'Point'
    },
    properties: {
      coord_path: '0.1',
      lat: 1.5,
      lng: 1.5,
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
      coordinates: [2.5, 2.5],
      type: 'Point'
    },
    properties: {
      coord_path: '0.2',
      lat: 2.5,
      lng: 2.5,
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
      coordinates: [3.5, 3.5],
      type: 'Point'
    },
    properties: {
      coord_path: '0.3',
      lat: 3.5,
      lng: 3.5,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }, {
    geometry: {
      coordinates: [2.5, 2.5],
      type: 'Point'
    },
    properties: {
      coord_path: '0.0',
      lat: 2.5,
      lng: 2.5,
      meta: 'midpoint',
      parent: 'foo'
    },
    type: 'Feature'
  }], 'adds vertices and midpoints');

  t.end();
});
