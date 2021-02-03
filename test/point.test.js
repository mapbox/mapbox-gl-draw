import test from 'tape';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import Feature from '../src/feature_types/feature';
import Point from '../src/feature_types/point';
import MapboxDraw from '../index';
import createFeature from './utils/create_feature';
import getPublicMemberKeys from './utils/get_public_member_keys';
import createMockCtx from './utils/create_mock_feature_context';
import drawGeometry from './utils/draw_geometry';
import createMap from './utils/create_map';

test('Point constructor and API', (t) => {
  const rawPoint = createFeature('point');
  const ctx = createMockCtx();
  const point = new Point(ctx, rawPoint);

  // Instance members
  t.equal(point.ctx, ctx, 'point.ctx');
  t.equal(point.coordinates, rawPoint.geometry.coordinates, 'point.coordinates');
  t.equal(point.properties, rawPoint.properties, 'point.properties');
  t.equal(point.id, rawPoint.id, 'point.id');
  t.equal(point.type, rawPoint.geometry.type, 'point.type');
  t.equal(getPublicMemberKeys(point).length, 5, 'no unexpected instance members');

  // Prototype members
  t.equal(typeof Point.prototype.isValid, 'function', 'point.isValid');
  t.equal(typeof Point.prototype.getCoordinate, 'function', 'point.getCoordinate');
  t.equal(typeof Point.prototype.updateCoordinate, 'function', 'point.updateCoordinate');
  t.equal(getPublicMemberKeys(Point.prototype).length, 3, 'no unexpected prototype members');

  t.ok(Point.prototype instanceof Feature, 'inherits from Feature');

  t.end();
});

test('Point#isValid', (t) => {
  const validRawPoint = createFeature('point');
  const validPoint = new Point(createMockCtx(), validRawPoint);
  t.equal(validPoint.isValid(), true, 'returns true for valid point');

  const invalidRawPointA = createFeature('point');
  invalidRawPointA.geometry.coordinates = [0, '1'];
  const invalidPointA = new Point(createMockCtx(), invalidRawPointA);
  t.equal(invalidPointA.isValid(), false, 'returns false with non-number coordinate');

  const invalidRawPointB = createFeature('point');
  invalidRawPointB.geometry.coordinates = ['1', 0];
  const invalidPointB = new Point(createMockCtx(), invalidRawPointA);
  t.equal(invalidPointB.isValid(), false, 'returns false with non-number coordinate, again');

  t.end();
});

test('Point#updateCoordinate, Point#getCoordinate', (t) => {
  const rawPoint = createFeature('point');
  rawPoint.geometry.coordinates = [1, 2];
  const point = new Point(createMockCtx(), rawPoint);
  const changedSpy = spy(point, 'changed');

  t.deepEqual(point.getCoordinate(), [1, 2]);

  point.updateCoordinate(3, 4, 5);
  t.equal(changedSpy.callCount, 1);
  t.deepEqual(point.getCoordinate(), [4, 5], 'handles 3 arguments, ignoring the first (as path)');

  point.updateCoordinate(6, 7);
  t.deepEqual(point.getCoordinate(), [6, 7], 'handles 2 arguments');

  t.end();
});

test('Point integration test', (t) => {
  const pointCoordinates = [10, 10];
  const map = createMap();
  const Draw = new MapboxDraw();
  map.addControl(Draw);

  map.on('load', () => {
    drawGeometry(map, Draw, 'Point', pointCoordinates, () => {
      const feats = Draw.getAll().features;
      t.equals(1, feats.length, 'only one');
      t.equals('Point', feats[0].geometry.type, 'of the right type');
      t.deepEquals([10, 10], feats[0].geometry.coordinates, 'in the right spot');

      Draw.onRemove();
      t.end();
    });
  });

});
