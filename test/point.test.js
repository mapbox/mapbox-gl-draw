import test from 'node:test';
import assert from 'node:assert/strict';
import {spy} from 'sinon';
import Feature from '../src/feature_types/feature.js';
import Point from '../src/feature_types/point.js';
import MapboxDraw from '../index.js';
import createFeature from './utils/create_feature.js';
import getPublicMemberKeys from './utils/get_public_member_keys.js';
import createMockCtx from './utils/create_mock_feature_context.js';
import {drawGeometry} from './utils/draw_geometry.js';
import createMap from './utils/create_map.js';

test('Point constructor and API', () => {
  const rawPoint = createFeature('point');
  const ctx = createMockCtx();
  const point = new Point(ctx, rawPoint);

  // Instance members
  assert.equal(point.ctx, ctx, 'point.ctx');
  assert.equal(point.coordinates, rawPoint.geometry.coordinates, 'point.coordinates');
  assert.equal(point.properties, rawPoint.properties, 'point.properties');
  assert.equal(point.id, rawPoint.id, 'point.id');
  assert.equal(point.type, rawPoint.geometry.type, 'point.type');
  assert.equal(getPublicMemberKeys(point).length, 5, 'no unexpected instance members');

  // Prototype members
  assert.equal(typeof Point.prototype.isValid, 'function', 'point.isValid');
  assert.equal(typeof Point.prototype.getCoordinate, 'function', 'point.getCoordinate');
  assert.equal(typeof Point.prototype.updateCoordinate, 'function', 'point.updateCoordinate');
  assert.equal(getPublicMemberKeys(Point.prototype).length, 3, 'no unexpected prototype members');

  assert.ok(Point.prototype instanceof Feature, 'inherits from Feature');
});

test('Point#isValid', () => {
  const validRawPoint = createFeature('point');
  const validPoint = new Point(createMockCtx(), validRawPoint);
  assert.equal(validPoint.isValid(), true, 'returns true for valid point');

  const invalidRawPointA = createFeature('point');
  invalidRawPointA.geometry.coordinates = [0, '1'];
  const invalidPointA = new Point(createMockCtx(), invalidRawPointA);
  assert.equal(invalidPointA.isValid(), false, 'returns false with non-number coordinate');

  const invalidRawPointB = createFeature('point');
  invalidRawPointB.geometry.coordinates = ['1', 0];
  const invalidPointB = new Point(createMockCtx(), invalidRawPointA);
  assert.equal(invalidPointB.isValid(), false, 'returns false with non-number coordinate, again');
});

test('Point#updateCoordinate, Point#getCoordinate', () => {
  const rawPoint = createFeature('point');
  rawPoint.geometry.coordinates = [1, 2];
  const point = new Point(createMockCtx(), rawPoint);
  const changedSpy = spy(point, 'changed');

  assert.deepEqual(point.getCoordinate(), [1, 2]);

  point.updateCoordinate(3, 4, 5);
  assert.equal(changedSpy.callCount, 1);
  assert.deepEqual(point.getCoordinate(), [4, 5], 'handles 3 arguments, ignoring the first (as path)');

  point.updateCoordinate(6, 7);
  assert.deepEqual(point.getCoordinate(), [6, 7], 'handles 2 arguments');
});

test('Point integration test', async () => {
  const pointCoordinates = [10, 10];
  const map = createMap();
  const Draw = new MapboxDraw();
  map.addControl(Draw);

  await map.on('load');

  await drawGeometry(map, Draw, 'Point', pointCoordinates);

  const feats = Draw.getAll().features;
  assert.equal(1, feats.length, 'only one');
  assert.equal('Point', feats[0].geometry.type, 'of the right type');
  assert.deepEqual([10, 10], feats[0].geometry.coordinates, 'in the right spot');

  Draw.onRemove();
});
