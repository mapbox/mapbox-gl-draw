import test from 'tape';
import stub from 'sinon/lib/sinon/stub'; // avoid babel-register-related error by importing only stub
import featuresAt from '../src/lib/features_at';

function createMockContext() {
  return {
    options: {},
    map: {
      queryRenderedFeatures: stub().returns([{
        type: 'Feature',
        properties: {
          meta: 'feature',
          id: 'foo'
        },
        geometry: {
          type: 'LineString',
          coordinates: [[0, 0], [1, 1], [2, 2]]
        }
      }, {
        type: 'Feature',
        properties: {
          meta: 'nothing',
          id: 'bar'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]]
        }
      }, {
        type: 'Feature',
        properties: {
          meta: 'vertex',
          id: 'baz'
        },
        geometry: {
          type: 'Point',
          coordinates: [10, 10]
        }
      }, {
        type: 'Feature',
        properties: {
          meta: 'vertex',
          id: 'baz'
        },
        geometry: {
          type: 'Point',
          coordinates: [10, 10]
        }
      }])
    }
  };
}

test('featuresAt with click bounding box', t => {
  const mockContext = createMockContext();
  const result = featuresAt.click(null, [[10, 10], [20, 20]], mockContext);

  t.equal(mockContext.map.queryRenderedFeatures.callCount, 1);
  t.deepEqual(mockContext.map.queryRenderedFeatures.getCall(0).args, [
    [[10, 10], [20, 20]],
    {}
  ]);
  t.deepEqual(result, [{
    type: 'Feature',
    properties: {
      meta: 'vertex',
      id: 'baz'
    },
    geometry: {
      type: 'Point',
      coordinates: [10, 10]
    }
  }, {
    type: 'Feature',
    properties: {
      meta: 'feature',
      id: 'foo'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [1, 1], [2, 2]]
    }
  }], 'sorts, filters based on properties.meta, removes duplicates');

  t.end();
});

test('featuresAt with touch bounding box', t => {
  const mockContext = createMockContext();
  const result = featuresAt.touch(null, [[10, 10], [20, 20]], mockContext);

  t.equal(mockContext.map.queryRenderedFeatures.callCount, 1);
  t.deepEqual(mockContext.map.queryRenderedFeatures.getCall(0).args, [
    [[10, 10], [20, 20]],
    {}
  ]);
  t.deepEqual(result, [{
    type: 'Feature',
    properties: {
      meta: 'vertex',
      id: 'baz'
    },
    geometry: {
      type: 'Point',
      coordinates: [10, 10]
    }
  }, {
    type: 'Feature',
    properties: {
      meta: 'feature',
      id: 'foo'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [1, 1], [2, 2]]
    }
  }], 'sorts, filters based on properties.meta, removes duplicates');

  t.end();
});

