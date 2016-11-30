import test from 'tape';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import Feature from '../src/feature_types/feature';
import LineString from '../src/feature_types/line_string';
import MapboxDraw from '../';
import createFeature from './utils/create_feature';
import getPublicMemberKeys from './utils/get_public_member_keys';
import createMockCtx from './utils/create_mock_feature_context';
import drawGeometry from './utils/draw_geometry';
import createMap from './utils/create_map';

test('LineString constructor and API', t => {
  const rawLine = createFeature('line');
  const ctx = createMockCtx();
  const lineString = new LineString(ctx, rawLine);

  // Instance members
  t.equal(lineString.ctx, ctx, 'lineString.ctx');
  t.equal(lineString.coordinates, rawLine.geometry.coordinates, 'lineString.coordinates');
  t.equal(lineString.properties, rawLine.properties, 'lineString.properties');
  t.equal(lineString.id, rawLine.id, 'lineString.id');
  t.equal(lineString.type, rawLine.geometry.type, 'lineString.type');
  t.equal(getPublicMemberKeys(lineString).length, 5, 'no unexpected instance members');

  // Prototype members
  t.equal(typeof LineString.prototype.isValid, 'function', 'lineString.isValid');
  t.equal(typeof LineString.prototype.addCoordinate, 'function', 'lineString.addCoordinate');
  t.equal(typeof LineString.prototype.getCoordinate, 'function', 'lineString.getCoordinate');
  t.equal(typeof LineString.prototype.removeCoordinate, 'function', 'lineString.removeCoordinate');
  t.equal(typeof LineString.prototype.updateCoordinate, 'function', 'lineString.updateCoordinate');
  t.equal(getPublicMemberKeys(LineString.prototype).length, 5, 'no unexpected prototype members');

  t.ok(LineString.prototype instanceof Feature, 'inherits from Feature');

  t.end();
});

test('LineString#isValid', t => {
  const validRawLine = createFeature('line');
  const validLineString = new LineString(createMockCtx(), validRawLine);
  t.equal(validLineString.isValid(), true, 'returns true when valid');

  const invalidRawLineA = createFeature('line');
  invalidRawLineA.geometry.coordinates = [3];
  const invalidLineStringA = new LineString(createMockCtx(), invalidRawLineA);
  t.equal(invalidLineStringA.isValid(), false, 'returns false when there is one coordinate');

  const invalidRawLineB = createFeature('line');
  invalidRawLineB.geometry.coordinates = [];
  const invalidLineStringB = new LineString(createMockCtx(), invalidRawLineB);
  t.equal(invalidLineStringB.isValid(), false, 'returns false when there are no coordinates');

  t.end();
});

test('LineString#addCoordinate', t => {
  const rawLine = createFeature('line');
  rawLine.geometry.coordinates = [[1, 2], [3, 4]];
  const lineString = new LineString(createMockCtx(), rawLine);
  const changedSpy = spy(lineString, 'changed');

  lineString.addCoordinate(1, 5, 6);
  t.equal(changedSpy.callCount, 1, 'called lineString.changed()');
  t.deepEqual(lineString.getCoordinates(), [[1, 2], [5, 6], [3, 4]], 'new coordinate inserted in correct place');

  lineString.addCoordinate('0', 7, 8);
  t.deepEqual(lineString.getCoordinates(), [[7, 8], [1, 2], [5, 6], [3, 4]],
    'string path works');

  t.end();
});

test('LineString#getCoordinate', t => {
  const rawLine = createFeature('line');
  rawLine.geometry.coordinates = [[1, 2], [3, 4]];
  const lineString = new LineString(createMockCtx(), rawLine);

  t.deepEqual(lineString.getCoordinate(0), [1, 2], 'number path works');
  t.deepEqual(lineString.getCoordinate('1'), [3, 4], 'string path works');

  t.end();
});

test('LineString#removeCoordinate', t => {
  const rawLine = createFeature('line');
  rawLine.geometry.coordinates = [[1, 2], [3, 4]];
  const lineString = new LineString(createMockCtx(), rawLine);
  const changedSpy = spy(lineString, 'changed');

  lineString.removeCoordinate(1);
  t.equal(changedSpy.callCount, 1, 'called lineString.changed()');
  t.deepEqual(lineString.getCoordinates(), [[1, 2]], 'coordinate removed from correct place');

  t.end();
});

test('LineString#updateCoordinate', t => {
  const rawLine = createFeature('line');
  rawLine.geometry.coordinates = [[1, 2], [3, 4], [5, 6]];
  const lineString = new LineString(createMockCtx(), rawLine);
  const changedSpy = spy(lineString, 'changed');

  lineString.updateCoordinate(1, 7, 8);
  t.equal(changedSpy.callCount, 1, 'called lineString.changed()');
  t.deepEqual(lineString.getCoordinates(), [[1, 2], [7, 8], [5, 6]], 'coordinate updated at correct place');

  t.end();
});

test('LineString integration', t => {
  const lineStringCoordinates = [[0, 0], [40, 20], [20, 40]];
  const map = createMap();
  const Draw = new MapboxDraw();
  map.addControl(Draw);

  map.on('load', () => {
    drawGeometry(map, Draw, 'LineString', lineStringCoordinates, () => {
      const feats = Draw.getAll().features;
      t.equals(1, feats.length, 'only one');
      t.equals('LineString', feats[0].geometry.type, 'of the right type');
      t.equals(lineStringCoordinates[0].length, feats[0].geometry.coordinates[0].length, 'right number of points');
      t.deepEquals(lineStringCoordinates, feats[0].geometry.coordinates, 'in the right spot');
      Draw.onRemove();
      t.end();
    });
  });
});
