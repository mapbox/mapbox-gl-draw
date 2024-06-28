import test from 'node:test';
import assert from 'node:assert/strict';
import {spy} from 'sinon';
import Feature from '../src/feature_types/feature.js';
import LineString from '../src/feature_types/line_string.js';
import MapboxDraw from '../index.js';
import createFeature from './utils/create_feature.js';
import getPublicMemberKeys from './utils/get_public_member_keys.js';
import createMockCtx from './utils/create_mock_feature_context.js';
import {drawGeometry} from './utils/draw_geometry.js';
import createMap from './utils/create_map.js';

test('LineString constructor and API', () => {
  const rawLine = createFeature('line');
  const ctx = createMockCtx();
  const lineString = new LineString(ctx, rawLine);

  // Instance members
  assert.equal(lineString.ctx, ctx, 'lineString.ctx');
  assert.equal(lineString.coordinates, rawLine.geometry.coordinates, 'lineString.coordinates');
  assert.equal(lineString.properties, rawLine.properties, 'lineString.properties');
  assert.equal(lineString.id, rawLine.id, 'lineString.id');
  assert.equal(lineString.type, rawLine.geometry.type, 'lineString.type');
  assert.equal(getPublicMemberKeys(lineString).length, 5, 'no unexpected instance members');

  // Prototype members
  assert.equal(typeof LineString.prototype.isValid, 'function', 'lineString.isValid');
  assert.equal(typeof LineString.prototype.addCoordinate, 'function', 'lineString.addCoordinate');
  assert.equal(typeof LineString.prototype.getCoordinate, 'function', 'lineString.getCoordinate');
  assert.equal(typeof LineString.prototype.removeCoordinate, 'function', 'lineString.removeCoordinate');
  assert.equal(typeof LineString.prototype.updateCoordinate, 'function', 'lineString.updateCoordinate');
  assert.equal(getPublicMemberKeys(LineString.prototype).length, 5, 'no unexpected prototype members');

  assert.ok(LineString.prototype instanceof Feature, 'inherits from Feature');
});

test('LineString#isValid', () => {
  const validRawLine = createFeature('line');
  const validLineString = new LineString(createMockCtx(), validRawLine);
  assert.equal(validLineString.isValid(), true, 'returns true when valid');

  const invalidRawLineA = createFeature('line');
  invalidRawLineA.geometry.coordinates = [3];
  const invalidLineStringA = new LineString(createMockCtx(), invalidRawLineA);
  assert.equal(invalidLineStringA.isValid(), false, 'returns false when there is one coordinate');

  const invalidRawLineB = createFeature('line');
  invalidRawLineB.geometry.coordinates = [];
  const invalidLineStringB = new LineString(createMockCtx(), invalidRawLineB);
  assert.equal(invalidLineStringB.isValid(), false, 'returns false when there are no coordinates');
});

test('LineString#addCoordinate', () => {
  const rawLine = createFeature('line');
  rawLine.geometry.coordinates = [[1, 2], [3, 4]];
  const lineString = new LineString(createMockCtx(), rawLine);
  const changedSpy = spy(lineString, 'changed');

  lineString.addCoordinate(1, 5, 6);
  assert.equal(changedSpy.callCount, 1, 'called lineString.changed()');
  assert.deepEqual(lineString.getCoordinates(), [[1, 2], [5, 6], [3, 4]], 'new coordinate inserted in correct place');

  lineString.addCoordinate('0', 7, 8);
  assert.deepEqual(lineString.getCoordinates(), [[7, 8], [1, 2], [5, 6], [3, 4]],
    'string path works');
});

test('LineString#getCoordinate', () => {
  const rawLine = createFeature('line');
  rawLine.geometry.coordinates = [[1, 2], [3, 4]];
  const lineString = new LineString(createMockCtx(), rawLine);

  assert.deepEqual(lineString.getCoordinate(0), [1, 2], 'number path works');
  assert.deepEqual(lineString.getCoordinate('1'), [3, 4], 'string path works');
});

test('LineString#removeCoordinate', () => {
  const rawLine = createFeature('line');
  rawLine.geometry.coordinates = [[1, 2], [3, 4]];
  const lineString = new LineString(createMockCtx(), rawLine);
  const changedSpy = spy(lineString, 'changed');

  lineString.removeCoordinate(1);
  assert.equal(changedSpy.callCount, 1, 'called lineString.changed()');
  assert.deepEqual(lineString.getCoordinates(), [[1, 2]], 'coordinate removed from correct place');
});

test('LineString#updateCoordinate', () => {
  const rawLine = createFeature('line');
  rawLine.geometry.coordinates = [[1, 2], [3, 4], [5, 6]];
  const lineString = new LineString(createMockCtx(), rawLine);
  const changedSpy = spy(lineString, 'changed');

  lineString.updateCoordinate(1, 7, 8);
  assert.equal(changedSpy.callCount, 1, 'called lineString.changed()');
  assert.deepEqual(lineString.getCoordinates(), [[1, 2], [7, 8], [5, 6]], 'coordinate updated at correct place');
});

test('LineString integration', async () => {
  const lineStringCoordinates = [[0, 0], [40, 20], [20, 40]];
  const map = createMap();
  const Draw = new MapboxDraw();
  map.addControl(Draw);

  await map.on('load');

  drawGeometry(map, Draw, 'LineString', lineStringCoordinates, () => {
    const feats = Draw.getAll().features;
    assert.equal(1, feats.length, 'only one');
    assert.equal('LineString', feats[0].geometry.type, 'of the right type');
    assert.equal(lineStringCoordinates[0].length, feats[0].geometry.coordinates[0].length, 'right number of points');
    assert.deepEqual([...lineStringCoordinates, [20, 40]], feats[0].geometry.coordinates, 'in the right spot');
    Draw.onRemove();
  });
});
