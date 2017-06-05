import test from 'tape';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import Feature from '../src/feature_types/feature';
import Polygon from '../src/feature_types/polygon';
import MapboxDraw from '../';
import createFeature from './utils/create_feature';
import getPublicMemberKeys from './utils/get_public_member_keys';
import createMockCtx from './utils/create_mock_feature_context';
import drawGeometry from './utils/draw_geometry';
import createMap from './utils/create_map';

test('Polygon constructor and API', t => {
  const rawPolygon = createFeature('polygon');
  rawPolygon.geometry.coordinates = [[[1, 2], [3, 4], [5, 6], [7, 8], [1, 2]]];
  const ctx = createMockCtx();
  const polygon = new Polygon(ctx, rawPolygon);

  // Instance members
  t.equal(polygon.ctx, ctx, 'polygon.ctx');
  t.deepEqual(polygon.coordinates, [[[1, 2], [3, 4], [5, 6], [7, 8]]],
    'polygon.coordinates remove the last coordinate of the ring (which matches the first)');
  t.equal(polygon.properties, rawPolygon.properties, 'polygon.properties');
  t.equal(polygon.id, rawPolygon.id, 'polygon.id');
  t.equal(polygon.type, rawPolygon.geometry.type, 'polygon.type');
  t.equal(getPublicMemberKeys(polygon).length, 5, 'no unexpected instance members');

  // Prototype members
  t.equal(typeof Polygon.prototype.isValid, 'function', 'polygon.isValid');
  t.equal(typeof Polygon.prototype.incomingCoords, 'function', 'polygon.incomingCoords');
  t.equal(typeof Polygon.prototype.setCoordinates, 'function', 'polygon.setCoordinates');
  t.equal(typeof Polygon.prototype.addCoordinate, 'function', 'polygon.addCoordinate');
  t.equal(typeof Polygon.prototype.getCoordinate, 'function', 'polygon.getCoordinate');
  t.equal(typeof Polygon.prototype.getCoordinates, 'function', 'polygon.getCoordinates');
  t.equal(typeof Polygon.prototype.removeCoordinate, 'function', 'polygon.removeCoordinate');
  t.equal(typeof Polygon.prototype.updateCoordinate, 'function', 'polygon.updateCoordinate');
  t.equal(getPublicMemberKeys(Polygon.prototype).length, 8, 'no unexpected prototype members');

  t.ok(Polygon.prototype instanceof Feature, 'inherits from Feature');

  t.end();
});

test('Polygon#isValid', t => {
  const validRawPolygon = createFeature('polygon');
  const validPolygon = new Polygon(createMockCtx(), validRawPolygon);
  t.equal(validPolygon.isValid(), true, 'returns true for valid polygons');

  const invalidRawPolygonA = createFeature('polygon');
  invalidRawPolygonA.geometry.coordinates = [[[1, 2], [3, 4], [5, 6]], [[7, 8], [9, 10]]];
  const invalidPolygonA = new Polygon(createMockCtx(), invalidRawPolygonA);
  t.equal(invalidPolygonA.isValid(), false, 'returns false when a ring has fewer than 3 coordinates');

  t.end();
});

test('Polygon#incomingCoords, Polygon#getCoordinates', t => {
  const rawPolygon = createFeature('polygon');
  const polygon = new Polygon(createMockCtx(), rawPolygon);
  const changedSpy = spy(polygon, 'changed');

  polygon.incomingCoords([[[1, 2], [3, 4], [5, 6], [1, 2]]]);
  t.equal(changedSpy.callCount, 1, 'calls polygon.changed');
  t.deepEqual(polygon.coordinates, [[[1, 2], [3, 4], [5, 6]]],
    'sets new coordinates, eliminating last (closing) one');
  t.deepEqual(polygon.getCoordinates(), [[[1, 2], [3, 4], [5, 6], [1, 2]]],
    'getCoordinates return closed rings');

  t.end();
});

test('Polygon#setCoordinates', t => {
  const rawPolygon = createFeature('polygon');
  const polygon = new Polygon(createMockCtx(), rawPolygon);
  const changedSpy = spy(polygon, 'changed');

  polygon.setCoordinates([[[1, 2], [3, 4], [5, 6]]]);
  t.equal(changedSpy.callCount, 1, 'polygon.changed called');
  t.deepEqual(polygon.coordinates, [[[1, 2], [3, 4], [5, 6]]],
    'new coordinates set');

  t.end();
});

test('Polygon#addCoordinate, Polygon#removeCoordinate', t => {
  const rawPolygon = createFeature('polygon');
  rawPolygon.geometry.coordinates = [
    [[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]],
    [[2, 1], [3, 2], [4, 3], [5, 4], [2, 1]]
  ];
  const polygon = new Polygon(createMockCtx(), rawPolygon);
  const changedSpy = spy(polygon, 'changed');

  changedSpy.reset();
  polygon.addCoordinate('1.1', 99, 100);
  t.equal(changedSpy.callCount, 1, 'polygon.changed was called');
  t.deepEqual(polygon.getCoordinates(), [
    [[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]],
    [[2, 1], [99, 100], [3, 2], [4, 3], [5, 4], [2, 1]]
  ], 'new coordinate added at right place in right ring');

  changedSpy.reset();
  polygon.removeCoordinate('0.3');
  t.equal(changedSpy.callCount, 1, 'polygon.changed was called');
  t.deepEqual(polygon.getCoordinates(), [
    [[1, 1], [2, 2], [3, 3], [1, 1]],
    [[2, 1], [99, 100], [3, 2], [4, 3], [5, 4], [2, 1]]
  ], 'coordinate removed at right place in right ring');

  t.end();
});

test('Polygon#updateCoordinate, Polygon#getCoordinate', t => {
  const rawPolygon = createFeature('polygon');
  rawPolygon.geometry.coordinates = [
    [[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]],
    [[2, 1], [3, 2], [4, 3], [5, 4], [2, 1]]
  ];
  const polygon = new Polygon(createMockCtx(), rawPolygon);
  const changedSpy = spy(polygon, 'changed');

  changedSpy.reset();
  t.deepEqual(polygon.getCoordinate('1.2'), [4, 3], 'getCoordinate returns right one');
  polygon.updateCoordinate('1.2', 99, 100);
  t.equal(changedSpy.callCount, 1, 'polygon.changed was called');
  t.deepEqual(polygon.getCoordinates(), [
    [[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]],
    [[2, 1], [3, 2], [99, 100], [5, 4], [2, 1]]
  ], 'correct coordinate was changed');
  t.deepEqual(polygon.getCoordinate('1.2'), [99, 100], 'getCoordinate still works');

  t.end();
});

test('Polygon integration', t => {
  const polygonCoordinates = [[[0, 0], [30, 15], [32, 35], [15, 30], [0, 0]]];
  const map = createMap();
  const Draw = new MapboxDraw();
  map.addControl(Draw);

  map.on('load', () => {
    drawGeometry(map, Draw, 'Polygon', polygonCoordinates, () => {
      const feats = Draw.getAll().features;
      t.equals(1, feats.length, 'only one');
      t.equals('Polygon', feats[0].geometry.type, 'of the right type');
      t.equals(feats[0].geometry.coordinates[0].length, polygonCoordinates[0].length, 'right number of points');
      t.deepEquals(feats[0].geometry.coordinates, polygonCoordinates, 'in the right spot');
      Draw.onRemove();
      t.end();
    });

  });
});
