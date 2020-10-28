import test from 'tape';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import Feature from '../src/feature_types/feature';
import Point from '../src/feature_types/point';
import Polygon from '../src/feature_types/polygon';
import LineString from '../src/feature_types/line_string';
import MultiFeature from '../src/feature_types/multi_feature';
import createMockCtx from './utils/create_mock_feature_context';
import getPublicMemberKeys from './utils/get_public_member_keys';

test('MultiPoint via MultiFeature', (t) => {
  t.ok(MultiFeature.prototype instanceof Feature, 'inherits from Feature');

  // Prototype members
  t.equal(typeof MultiFeature.prototype.isValid, 'function', 'polygon.isValid');
  t.equal(typeof MultiFeature.prototype.setCoordinates, 'function', 'polygon.setCoordinates');
  t.equal(typeof MultiFeature.prototype.getCoordinate, 'function', 'polygon.getCoordinate');
  t.equal(typeof MultiFeature.prototype.getCoordinates, 'function', 'polygon.getCoordinates');
  t.equal(typeof MultiFeature.prototype.updateCoordinate, 'function', 'polygon.updateCoordinate');
  t.equal(typeof MultiFeature.prototype.addCoordinate, 'function', 'polygon.addCoordinate');
  t.equal(typeof MultiFeature.prototype.removeCoordinate, 'function', 'polygon.removeCoordinate');
  t.equal(typeof MultiFeature.prototype.getFeatures, 'function', 'polygon.getFeatures');

  t.equal(getPublicMemberKeys(MultiFeature.prototype).length, 8, 'no unexpected prototype members');

  t.end();
});

test('MultiPoint', (t) => {
  const rawMultiPoint = {
    type: 'Feature',
    id: 'wahoo',
    properties: { foo: 'bar' },
    geometry: {
      type: 'MultiPoint',
      coordinates: [[1, 1], [2, 2], [3, 3]]
    }
  };
  const ctx = createMockCtx();
  let multiPoint;
  t.doesNotThrow(() => {
    multiPoint = new MultiFeature(ctx, rawMultiPoint);
  }, 'MultiPoint type does not throw');
  const changedSpy = spy(multiPoint, 'changed');

  // Instance members
  t.equal(multiPoint.ctx, ctx, 'multiPoint.ctx');
  t.equal(multiPoint.coordinates, undefined, 'no coordinates');
  t.deepEqual(multiPoint.properties, { foo: 'bar' }, 'multiPoint.properties');
  t.equal(multiPoint.id, 'wahoo', 'multiPoint.id');
  t.equal(multiPoint.type, 'MultiPoint', 'multiPoint.type');
  t.equal(multiPoint.features.length, 3, 'multiPoint.features');
  // multiPoint.changed gets counted because it's used below
  t.equal(getPublicMemberKeys(multiPoint).length, 7, 'no unexpected instance members');

  const pointA = multiPoint.features[0];
  const pointB = multiPoint.features[1];
  const pointC = multiPoint.features[2];

  t.deepEqual(pointA, new Point(ctx, {
    id: pointA.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [1, 1],
      type: 'Point'
    }
  }));
  t.deepEqual(pointB, new Point(ctx, {
    id: pointB.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [2, 2],
      type: 'Point'
    }
  }));
  t.deepEqual(pointC, new Point(ctx, {
    id: pointC.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [3, 3],
      type: 'Point'
    }
  }));

  const pointAGetCoordinateSpy = spy(pointA, 'getCoordinate');
  const pointBGetCoordinateSpy = spy(pointB, 'getCoordinate');
  const pointCGetCoordinateSpy = spy(pointC, 'getCoordinate');
  const coordinate = multiPoint.getCoordinate('2');
  t.equal(pointAGetCoordinateSpy.callCount, 0, 'point A getCoordinate not called');
  t.equal(pointBGetCoordinateSpy.callCount, 0, 'point B getCoordinate not called');
  t.equal(pointCGetCoordinateSpy.callCount, 1, 'point C getCoordinate');
  t.deepEqual(coordinate, [3, 3], 'correct coordinate');

  const pointAUpdateCoordinateSpy = spy(pointA, 'updateCoordinate');
  const pointBUpdateCoordinateSpy = spy(pointB, 'updateCoordinate');
  const pointCUpdateCoordinateSpy = spy(pointC, 'updateCoordinate');
  multiPoint.updateCoordinate('0', 99, 100);
  t.equal(pointAUpdateCoordinateSpy.callCount, 1, 'point A updateCoordinate');
  t.equal(pointBUpdateCoordinateSpy.callCount, 0, 'point B updateCoordinate not called');
  t.equal(pointCUpdateCoordinateSpy.callCount, 0, 'point C updateCoordinate not called');
  t.deepEqual(multiPoint.getCoordinate('0'), [99, 100], 'correct coordinate');

  t.deepEqual(multiPoint.getCoordinates(), [[99, 100], [2, 2], [3, 3]],
    'getCoordinates returns the complete multi-coordinates');

  multiPoint.setCoordinates([[6, 6], [7, 7]]);
  t.equal(changedSpy.callCount, 2, 'changed called by setCoordinates');
  t.deepEqual(multiPoint.getCoordinates(), [[6, 6], [7, 7]]);

  t.equal(multiPoint.isValid(), true, 'positive validation works');
  multiPoint.setCoordinates([[1], []]);
  t.equal(multiPoint.isValid(), false, 'negative validation works');

  t.end();
});

// Tests below less in depth becuase we know the
// inner-workings are the same
test('MultiPolygon via MultiFeature', (t) => {
  const rawMultiPolygon = {
    type: 'Feature',
    id: 'zing',
    properties: { f: 'a' },
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]],
        [[[2, 1], [6, 2], [8, 3], [2, 4], [2, 1]], [[1, 1], [2, 2], [3, 3], [1, 1]]]
      ]
    }
  };
  const ctx = createMockCtx();
  let multiPolygon;
  t.doesNotThrow(() => {
    multiPolygon = new MultiFeature(ctx, rawMultiPolygon);
  }, 'MultiPolygon type does not throw');

  const polygonA = multiPolygon.features[0];
  const polygonB = multiPolygon.features[1];

  t.deepEqual(polygonA, new Polygon(ctx, {
    id: polygonA.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]],
      type: 'Polygon'
    }
  }));
  t.deepEqual(polygonB, new Polygon(ctx, {
    id: polygonB.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [[[2, 1], [6, 2], [8, 3], [2, 4], [2, 1]], [[1, 1], [2, 2], [3, 3], [1, 1]]],
      type: 'Polygon'
    }
  }));

  t.end();
});

test('MultiLineString via MultiFeature', (t) => {
  const rawMultiLineString = {
    type: 'Feature',
    id: 'lineline',
    properties: { g: 'h' },
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [[1, 1], [2, 2], [3, 3]],
        [[4, 4], [5, 5], [6, 6]]
      ]
    }
  };
  const ctx = createMockCtx();
  let multiLineString;
  t.doesNotThrow(() => {
    multiLineString = new MultiFeature(ctx, rawMultiLineString);
  }, 'MultiLineString type does not throw');

  const lineStringA = multiLineString.features[0];
  const lineStringB = multiLineString.features[1];

  t.deepEqual(lineStringA, new LineString(ctx, {
    id: lineStringA.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [[1, 1], [2, 2], [3, 3]],
      type: 'LineString'
    }
  }));
  t.deepEqual(lineStringB, new LineString(ctx, {
    id: lineStringB.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [[4, 4], [5, 5], [6, 6]],
      type: 'LineString'
    }
  }));

  t.end();
});

test('Invalid MultiFeature type', (t) => {
  const rawThing = {
    type: 'Feature',
    id: 'blergh',
    properties: { g: 'h' },
    geometry: {
      type: 'thing',
      coordinates: [
        [[1, 1], [2, 2], [3, 3]],
        [[4, 4], [5, 5], [6, 6]]
      ]
    }
  };
  let thing;
  t.throws(() => {
    thing = new MultiFeature(createMockCtx(), rawThing);
  }, 'invalid type throws');
  t.notOk(thing);
  t.end();
});
