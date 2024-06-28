import test from 'node:test';
import assert from 'node:assert/strict';
import {spy} from 'sinon';
import Feature from '../src/feature_types/feature.js';
import Point from '../src/feature_types/point.js';
import Polygon from '../src/feature_types/polygon.js';
import LineString from '../src/feature_types/line_string.js';
import MultiFeature from '../src/feature_types/multi_feature.js';
import createMockCtx from './utils/create_mock_feature_context.js';
import getPublicMemberKeys from './utils/get_public_member_keys.js';

test('MultiPoint via MultiFeature', () => {
  assert.ok(MultiFeature.prototype instanceof Feature, 'inherits from Feature');

  // Prototype members
  assert.equal(typeof MultiFeature.prototype.isValid, 'function', 'polygon.isValid');
  assert.equal(typeof MultiFeature.prototype.setCoordinates, 'function', 'polygon.setCoordinates');
  assert.equal(typeof MultiFeature.prototype.getCoordinate, 'function', 'polygon.getCoordinate');
  assert.equal(typeof MultiFeature.prototype.getCoordinates, 'function', 'polygon.getCoordinates');
  assert.equal(typeof MultiFeature.prototype.updateCoordinate, 'function', 'polygon.updateCoordinate');
  assert.equal(typeof MultiFeature.prototype.addCoordinate, 'function', 'polygon.addCoordinate');
  assert.equal(typeof MultiFeature.prototype.removeCoordinate, 'function', 'polygon.removeCoordinate');
  assert.equal(typeof MultiFeature.prototype.getFeatures, 'function', 'polygon.getFeatures');

  assert.equal(getPublicMemberKeys(MultiFeature.prototype).length, 8, 'no unexpected prototype members');


});

test('MultiPoint', () => {
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
  assert.doesNotThrow(() => {
    multiPoint = new MultiFeature(ctx, rawMultiPoint);
  }, 'MultiPoint type does not throw');
  const changedSpy = spy(multiPoint, 'changed');

  // Instance members
  assert.equal(multiPoint.ctx, ctx, 'multiPoint.ctx');
  assert.equal(multiPoint.coordinates, undefined, 'no coordinates');
  assert.deepEqual(multiPoint.properties, { foo: 'bar' }, 'multiPoint.properties');
  assert.equal(multiPoint.id, 'wahoo', 'multiPoint.id');
  assert.equal(multiPoint.type, 'MultiPoint', 'multiPoint.type');
  assert.equal(multiPoint.features.length, 3, 'multiPoint.features');
  // multiPoint.changed gets counted because it's used below
  assert.equal(getPublicMemberKeys(multiPoint).length, 7, 'no unexpected instance members');

  const pointA = multiPoint.features[0];
  const pointB = multiPoint.features[1];
  const pointC = multiPoint.features[2];

  assert.deepEqual(pointA, new Point(ctx, {
    id: pointA.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [1, 1],
      type: 'Point'
    }
  }));
  assert.deepEqual(pointB, new Point(ctx, {
    id: pointB.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [2, 2],
      type: 'Point'
    }
  }));
  assert.deepEqual(pointC, new Point(ctx, {
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
  assert.equal(pointAGetCoordinateSpy.callCount, 0, 'point A getCoordinate not called');
  assert.equal(pointBGetCoordinateSpy.callCount, 0, 'point B getCoordinate not called');
  assert.equal(pointCGetCoordinateSpy.callCount, 1, 'point C getCoordinate');
  assert.deepEqual(coordinate, [3, 3], 'correct coordinate');

  const pointAUpdateCoordinateSpy = spy(pointA, 'updateCoordinate');
  const pointBUpdateCoordinateSpy = spy(pointB, 'updateCoordinate');
  const pointCUpdateCoordinateSpy = spy(pointC, 'updateCoordinate');
  multiPoint.updateCoordinate('0', 99, 100);
  assert.equal(pointAUpdateCoordinateSpy.callCount, 1, 'point A updateCoordinate');
  assert.equal(pointBUpdateCoordinateSpy.callCount, 0, 'point B updateCoordinate not called');
  assert.equal(pointCUpdateCoordinateSpy.callCount, 0, 'point C updateCoordinate not called');
  assert.deepEqual(multiPoint.getCoordinate('0'), [99, 100], 'correct coordinate');

  assert.deepEqual(multiPoint.getCoordinates(), [[99, 100], [2, 2], [3, 3]],
    'getCoordinates returns the complete multi-coordinates');

  multiPoint.setCoordinates([[6, 6], [7, 7]]);
  assert.equal(changedSpy.callCount, 2, 'changed called by setCoordinates');
  assert.deepEqual(multiPoint.getCoordinates(), [[6, 6], [7, 7]]);

  assert.equal(multiPoint.isValid(), true, 'positive validation works');
  multiPoint.setCoordinates([[1], []]);
  assert.equal(multiPoint.isValid(), false, 'negative validation works');


});

// Tests below less in depth becuase we know the
// inner-workings are the same
test('MultiPolygon via MultiFeature', () => {
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
  assert.doesNotThrow(() => {
    multiPolygon = new MultiFeature(ctx, rawMultiPolygon);
  }, 'MultiPolygon type does not throw');

  const polygonA = multiPolygon.features[0];
  const polygonB = multiPolygon.features[1];

  assert.deepEqual(polygonA, new Polygon(ctx, {
    id: polygonA.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]],
      type: 'Polygon'
    }
  }));
  assert.deepEqual(polygonB, new Polygon(ctx, {
    id: polygonB.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [[[2, 1], [6, 2], [8, 3], [2, 4], [2, 1]], [[1, 1], [2, 2], [3, 3], [1, 1]]],
      type: 'Polygon'
    }
  }));


});

test('MultiLineString via MultiFeature', () => {
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
  assert.doesNotThrow(() => {
    multiLineString = new MultiFeature(ctx, rawMultiLineString);
  }, 'MultiLineString type does not throw');

  const lineStringA = multiLineString.features[0];
  const lineStringB = multiLineString.features[1];

  assert.deepEqual(lineStringA, new LineString(ctx, {
    id: lineStringA.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [[1, 1], [2, 2], [3, 3]],
      type: 'LineString'
    }
  }));
  assert.deepEqual(lineStringB, new LineString(ctx, {
    id: lineStringB.id,
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [[4, 4], [5, 5], [6, 6]],
      type: 'LineString'
    }
  }));


});

test('Invalid MultiFeature type', () => {
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
  assert.throws(() => {
    thing = new MultiFeature(createMockCtx(), rawThing);
  }, 'invalid type throws');
  assert.equal(thing, undefined);
});
