import test from 'node:test';
import assert from 'node:assert/strict';
import {spy} from 'sinon';
import Feature from '../src/feature_types/feature.js';
import Polygon from '../src/feature_types/polygon.js';
import MapboxDraw from '../index.js';
import createFeature from './utils/create_feature.js';
import getPublicMemberKeys from './utils/get_public_member_keys.js';
import createMockCtx from './utils/create_mock_feature_context.js';
import {drawGeometry} from './utils/draw_geometry.js';
import createMap from './utils/create_map.js';

test('Polygon constructor and API', () => {
  const rawPolygon = createFeature('polygon');
  rawPolygon.geometry.coordinates = [[[1, 2], [3, 4], [5, 6], [7, 8], [1, 2]]];
  const ctx = createMockCtx();
  const polygon = new Polygon(ctx, rawPolygon);

  // Instance members
  assert.equal(polygon.ctx, ctx, 'polygon.ctx');
  assert.deepEqual(polygon.coordinates, [[[1, 2], [3, 4], [5, 6], [7, 8]]],
    'polygon.coordinates remove the last coordinate of the ring (which matches the first)');
  assert.equal(polygon.properties, rawPolygon.properties, 'polygon.properties');
  assert.equal(polygon.id, rawPolygon.id, 'polygon.id');
  assert.equal(polygon.type, rawPolygon.geometry.type, 'polygon.type');
  assert.equal(getPublicMemberKeys(polygon).length, 5, 'no unexpected instance members');

  // Prototype members
  assert.equal(typeof Polygon.prototype.isValid, 'function', 'polygon.isValid');
  assert.equal(typeof Polygon.prototype.incomingCoords, 'function', 'polygon.incomingCoords');
  assert.equal(typeof Polygon.prototype.setCoordinates, 'function', 'polygon.setCoordinates');
  assert.equal(typeof Polygon.prototype.addCoordinate, 'function', 'polygon.addCoordinate');
  assert.equal(typeof Polygon.prototype.getCoordinate, 'function', 'polygon.getCoordinate');
  assert.equal(typeof Polygon.prototype.getCoordinates, 'function', 'polygon.getCoordinates');
  assert.equal(typeof Polygon.prototype.removeCoordinate, 'function', 'polygon.removeCoordinate');
  assert.equal(typeof Polygon.prototype.updateCoordinate, 'function', 'polygon.updateCoordinate');
  assert.equal(getPublicMemberKeys(Polygon.prototype).length, 8, 'no unexpected prototype members');

  assert.ok(Polygon.prototype instanceof Feature, 'inherits from Feature');
});

test('Polygon#isValid', () => {
  const validRawPolygon = createFeature('polygon');
  const validPolygon = new Polygon(createMockCtx(), validRawPolygon);
  assert.equal(validPolygon.isValid(), true, 'returns true for valid polygons');

  const invalidRawPolygonA = createFeature('polygon');
  invalidRawPolygonA.geometry.coordinates = [[[1, 2], [3, 4], [5, 6]], [[7, 8], [9, 10]]];
  const invalidPolygonA = new Polygon(createMockCtx(), invalidRawPolygonA);
  assert.equal(invalidPolygonA.isValid(), false, 'returns false when a ring has fewer than 3 coordinates');
});

test('Polygon#incomingCoords, Polygon#getCoordinates', () => {
  const rawPolygon = createFeature('polygon');
  const polygon = new Polygon(createMockCtx(), rawPolygon);
  const changedSpy = spy(polygon, 'changed');

  polygon.incomingCoords([[[1, 2], [3, 4], [5, 6], [1, 2]]]);
  assert.equal(changedSpy.callCount, 1, 'calls polygon.changed');
  assert.deepEqual(polygon.coordinates, [[[1, 2], [3, 4], [5, 6]]],
    'sets new coordinates, eliminating last (closing) one');
  assert.deepEqual(polygon.getCoordinates(), [[[1, 2], [3, 4], [5, 6], [1, 2]]],
    'getCoordinates return closed rings');
});

test('Polygon#setCoordinates', () => {
  const rawPolygon = createFeature('polygon');
  const polygon = new Polygon(createMockCtx(), rawPolygon);
  const changedSpy = spy(polygon, 'changed');

  polygon.setCoordinates([[[1, 2], [3, 4], [5, 6]]]);
  assert.equal(changedSpy.callCount, 1, 'polygon.changed called');
  assert.deepEqual(polygon.coordinates, [[[1, 2], [3, 4], [5, 6]]],
    'new coordinates set');
});

test('Polygon#addCoordinate, Polygon#removeCoordinate', () => {
  const rawPolygon = createFeature('polygon');
  rawPolygon.geometry.coordinates = [
    [[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]],
    [[2, 1], [3, 2], [4, 3], [5, 4], [2, 1]]
  ];
  const polygon = new Polygon(createMockCtx(), rawPolygon);
  const changedSpy = spy(polygon, 'changed');

  changedSpy.resetHistory();
  polygon.addCoordinate('1.1', 99, 100);
  assert.equal(changedSpy.callCount, 1, 'polygon.changed was called');
  assert.deepEqual(polygon.getCoordinates(), [
    [[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]],
    [[2, 1], [99, 100], [3, 2], [4, 3], [5, 4], [2, 1]]
  ], 'new coordinate added at right place in right ring');

  changedSpy.resetHistory();
  polygon.removeCoordinate('0.3');
  assert.equal(changedSpy.callCount, 1, 'polygon.changed was called');
  assert.deepEqual(polygon.getCoordinates(), [
    [[1, 1], [2, 2], [3, 3], [1, 1]],
    [[2, 1], [99, 100], [3, 2], [4, 3], [5, 4], [2, 1]]
  ], 'coordinate removed at right place in right ring');
});

test('Polygon#updateCoordinate, Polygon#getCoordinate', () => {
  const rawPolygon = createFeature('polygon');
  rawPolygon.geometry.coordinates = [
    [[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]],
    [[2, 1], [3, 2], [4, 3], [5, 4], [2, 1]]
  ];
  const polygon = new Polygon(createMockCtx(), rawPolygon);
  const changedSpy = spy(polygon, 'changed');

  changedSpy.resetHistory();
  assert.deepEqual(polygon.getCoordinate('1.2'), [4, 3], 'getCoordinate returns right one');
  polygon.updateCoordinate('1.2', 99, 100);
  assert.equal(changedSpy.callCount, 1, 'polygon.changed was called');
  assert.deepEqual(polygon.getCoordinates(), [
    [[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]],
    [[2, 1], [3, 2], [99, 100], [5, 4], [2, 1]]
  ], 'correct coordinate was changed');
  assert.deepEqual(polygon.getCoordinate('1.2'), [99, 100], 'getCoordinate still works');
});

test('Polygon integration', async () => {
  const polygonCoordinates = [[[0, 0], [30, 15], [32, 35], [15, 30], [0, 0]]];
  const map = createMap();
  const Draw = new MapboxDraw();
  map.addControl(Draw);

  await map.on('load');

  await drawGeometry(map, Draw, 'Polygon', polygonCoordinates);

  const feats = Draw.getAll().features;
  assert.equal(1, feats.length, 'only one');
  assert.equal('Polygon', feats[0].geometry.type, 'of the right type');
  assert.equal(feats[0].geometry.coordinates[0].length, polygonCoordinates[0].length, 'right number of points');
  assert.deepEqual(feats[0].geometry.coordinates, polygonCoordinates, 'in the right spot');
  Draw.onRemove();
});
