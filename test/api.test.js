/* eslint no-shadow:[0] */
import test from 'tape';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import Constants from '../src/constants';
import GLDraw from '../';
import createMap from './utils/create_map';
import getGeoJSON from './utils/get_geojson';
import AfterNextRender from './utils/after_next_render';
import getPublicMemberKeys from './utils/get_public_member_keys';

var map = createMap();
var afterNextRender = AfterNextRender(map);
var Draw = GLDraw();
map.addControl(Draw);
const addSpy = spy(Draw, 'add');
const deleteSpy = spy(Draw, 'delete');

test('Draw.getFeatureIdsAt', t => {
  var feature = getGeoJSON('point');
  var [id] = Draw.add(feature);
  afterNextRender(() => {
    // These tests require the the pixel space
    // and lat/lng space are equal (1px = 1deg)
    var featureIds = Draw.getFeatureIdsAt({
      x: feature.geometry.coordinates[0],
      y: feature.geometry.coordinates[1]
    });

    t.equals(featureIds.length, 1, 'should return the added feature');
    t.equals(featureIds[0], id, 'selected feature should match desired feature');
    Draw.deleteAll();
    t.end();
  });
});

test('Draw.getSelectedIds', t => {
  const [lineId] = Draw.add(getGeoJSON('line'));
  const [pointId] = Draw.add(getGeoJSON('point'));
  const [polygonId] = Draw.add(getGeoJSON('polygon'));
  Draw.changeMode('simple_select', { featureIds: [lineId, pointId] });
  const selected = Draw.getSelectedIds();
  t.equal(selected.length, 2,
    'returns correct number of ids');
  t.notEqual(selected.indexOf(lineId), -1,
    'result contains line');
  t.notEqual(selected.indexOf(pointId), -1,
    'result contains point');
  Draw.changeMode('simple_select', { featureIds: [polygonId] });
  const nextSelected = Draw.getSelectedIds();
  t.equal(nextSelected.length, 1,
    'updates length');
  t.equal(nextSelected[0], polygonId,
    'updates content');
  t.end();
});

test('Draw.set', t => {
  const point = getGeoJSON('point');
  const line = getGeoJSON('line');
  const polygon = getGeoJSON('polygon');

  // First set it to one collection
  const collection = {
    type: 'FeatureCollection',
    features: [point, line, polygon]
  };
  const drawInstance = Draw.set(collection);
  t.equal(drawInstance.length, 3,
    'return value is correct length');
  const pointId = drawInstance[0];
  const lineId = drawInstance[1];
  const polygonId = drawInstance[2];
  t.equal(Draw.get(pointId).geometry.type, 'Point',
    'point id returned');
  t.equal(Draw.get(lineId).geometry.type, 'LineString',
    'line id returned');
  t.equal(Draw.get(polygonId).geometry.type, 'Polygon',
    'polygon id returned');
  t.equal(Draw.getAll().features.length, 3,
    'all features loaded');

  // Then set to another
  addSpy.reset();
  deleteSpy.reset();
  const nextCollection = {
    type: 'FeatureCollection',
    features: [polygon]
  };
  const nextDrawInstance = Draw.set(nextCollection);
  t.equal(nextDrawInstance.length, 1,
    'return value is correct length');
  const nextPolygonId = nextDrawInstance[0];
  t.equal(Draw.get(nextPolygonId).geometry.type, 'Polygon',
    'polygon id returned');
  t.equal(Draw.getAll().features.length, 1,
    'all features replaced with new ones');
  t.ok(addSpy.calledWith(nextCollection),
    'Draw.add called with new collection');
  t.equal(deleteSpy.callCount, 1,
    'Draw.delete called');
  t.deepEqual(deleteSpy.getCall(0).args, [[
    pointId,
    lineId,
    polygonId
  ]], 'Draw.delete called with old features');

  // Then set to another that contains a feature
  // with an already-used id
  addSpy.reset();
  deleteSpy.reset();
  const newLine = getGeoJSON('line');
  const overlappingPolygon = getGeoJSON('polygon');
  overlappingPolygon.id = nextPolygonId;
  const overlappingCollection = {
    type: 'FeatureCollection',
    features: [newLine, overlappingPolygon]
  };
  const overlappingDrawInstance = Draw.set(overlappingCollection);
  t.equal(overlappingDrawInstance.length, 2,
    'return value is correct length');
  const newLineId = overlappingDrawInstance[0];
  const overlappingPolygonId = overlappingDrawInstance[1];
  t.equal(Draw.get(newLineId).geometry.type, 'LineString',
    'new line id returned');
  t.equal(Draw.get(overlappingPolygonId).geometry.type, 'Polygon',
    'overlapping polygon id returned');
  t.equal(overlappingPolygonId, nextPolygonId,
    'overlapping polygon id did not change');
  t.ok(addSpy.calledWith(overlappingCollection),
    'Draw.add called with overlapping collection');
  t.equal(deleteSpy.callCount, 0,
    'Draw.delete not called');

  t.end();
});

test('Draw.set errors', t => {
  t.throws(() => {
    Draw.set(getGeoJSON('point'));
  }, 'when you pass a feature');
  t.throws(() => {
    Draw.set({
      type: 'FeatureCollection'
    });
  }, 'when you pass a collection without features');
  t.end();
});

test('Draw.add -- point', t => {
  var id = Draw.add(getGeoJSON('point'))[0];
  t.equals(typeof id, 'string', 'valid string id returned on add');
  Draw.deleteAll();
  t.end();
});

test('Draw.add -- FeatureCollection', t => {
  var listOfIds = Draw.add(getGeoJSON('featureCollection'));
  t.equals(listOfIds.length, getGeoJSON('featureCollection').features.length,
    'valid string id returned when adding a featureCollection');
  Draw.deleteAll();
  t.end();
});

test('Draw.add -- MultiPolygon', t => {
  var multiId = Draw.add(getGeoJSON('multiPolygon'))[0];
  t.equals('string', typeof multiId, 'accepts multi features');
  Draw.deleteAll();
  t.end();
});

test('Draw.add -- null geometry', t => {
  t.throws(() => {
    Draw.add(getGeoJSON('nullGeometry'));
  }, 'null geometry is invalid');
  t.end();
});

test('Draw.add -- GeometryCollection', t => {
  t.throws(() => {
    Draw.add(getGeoJSON('geometryCollection'));
  }, 'geometry collections are not valid in Draw');
  t.end();
});

test('Draw.add -- Invalid geojson', t => {
  t.throws(() => {
    Draw.add({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: 7
      }
    });
  }, /coordinates/, 'Invalid GeoJSON throws an error');
  t.end();
});

test('Draw.add -- change geometry type', t => {
  var id = Draw.add(getGeoJSON('point'))[0];
  var polygon = getGeoJSON('polygon');
  polygon.id = id;
  Draw.add(polygon);
  t.deepEquals(polygon, Draw.get(id), 'changed geometry type');
  Draw.deleteAll();
  t.end();
});

test('Draw.add -- existing feature with changed properties', t => {
  var id = Draw.add(getGeoJSON('point'));
  var point = Draw.get(id);

  afterNextRender(() => {
    point.properties = {'testing': 123};
    Draw.add(point);
    point = Draw.get(id);
    t.equals('testing', Object.keys(point.properties)[0]);
    t.equals(123, point.properties.testing);
    Draw.deleteAll();
    t.end();
  });
});

test('Draw.get', t => {
  var id = Draw.add(getGeoJSON('point'));
  var f = Draw.get(id);
  t.deepEquals(
    getGeoJSON('point').geometry.coordinates,
    f.geometry.coordinates,
    'the geometry added is the same returned by Draw.get'
  );

  t.equal(Draw.get('foo'), undefined,
    'returned undefined when no feature found');

  Draw.deleteAll();
  t.end();
});

test('Draw.getAll', t => {
  Draw.add(getGeoJSON('point'));
  t.deepEquals(
    getGeoJSON('point').geometry,
    Draw.getAll().features[0].geometry,
    'the geometry added is the same returned by Draw.getAll'
  );
  Draw.deleteAll();
  t.end();
});

test('Draw.delete one feature', t => {
  var id = Draw.add(getGeoJSON('point'))[0];
  const drawInstance = Draw.delete(id);
  t.equals(drawInstance, Draw, 'returns Draw instance');
  t.equals(Draw.getAll().features.length, 0, 'can remove a feature by its id');
  t.end();
});

test('Draw.delete multiple features', t => {
  var [pointId] = Draw.add(getGeoJSON('point'));
  var [lineId] = Draw.add(getGeoJSON('line'));
  Draw.add(getGeoJSON('polygon'));
  const drawInstance = Draw.delete([pointId, lineId]);
  t.equals(drawInstance, Draw, 'returns Draw instance');
  t.equals(Draw.getAll().features.length, 1, 'can remove multiple features by id');
  t.equals(Draw.getAll().features[0].geometry.type, 'Polygon',
    'the right features were removed');
  Draw.deleteAll();
  t.end();
});

test('Draw.delete a feature that is direct_selected', t => {
  var [id] = Draw.add(getGeoJSON('polygon'));
  Draw.changeMode('direct_select', { featureId: id });
  Draw.delete([id]);
  t.equals(Draw.getAll().features.length, 0, 'removed the feature');
  t.equals(Draw.getMode(), 'simple_select', 'changed modes to simple_select');
  t.end();
});

test('Draw.deleteAll', t => {
  Draw.add(getGeoJSON('point'));
  const drawInstance = Draw.deleteAll();
  t.equals(drawInstance, Draw, 'returns Draw instance');
  t.equals(Draw.getAll().features.length, 0, 'Draw.deleteAll removes all geometries');
  t.end();
});

test('Draw.deleteAll when in direct_select mode', t => {
  Draw.add(getGeoJSON('point'));
  const id = Draw.add(getGeoJSON('line'));
  Draw.changeMode('direct_select', { featureId: id });
  Draw.deleteAll();
  afterNextRender(() => {
    t.equal(Draw.getMode(), 'simple_select',
      'switches to simple_select mode');
    t.equal(Draw.getAll().features.length, 0,
      'removes selected feature along with others');
    t.end();
  });
});

test('Draw.changeMode and Draw.getMode with no pre-existing feature', t => {
  const drawInstance = Draw.changeMode('draw_polygon');
  t.equals(drawInstance, Draw, 'changeMode returns Draw instance');
  t.equals(Draw.getMode(), 'draw_polygon', 'changed to draw_polygon');
  t.equals(Draw.getAll().features.length, 1, 'one feature added');
  t.equals(Draw.getAll().features[0].geometry.type, 'Polygon', 'and it is a polygon');
  t.deepEquals(Draw.getAll().features[0].geometry.coordinates, [[null]], 'and it is empty');

  Draw.changeMode('draw_line_string');
  t.equals(Draw.getMode(), 'draw_line_string', 'changed to draw_line_string');
  t.equals(Draw.getAll().features.length, 1, 'still only one feature added');
  t.equals(Draw.getAll().features[0].geometry.type, 'LineString', 'and it is a line');
  t.deepEquals(Draw.getAll().features[0].geometry.coordinates, [], 'and it is empty');

  Draw.changeMode('draw_point');
  t.equals(Draw.getMode(), 'draw_point', 'changed to draw_point');
  t.equals(Draw.getAll().features.length, 1, 'still only one feature added');
  t.equals(Draw.getAll().features[0].geometry.type, 'Point', 'and it is a point');
  t.deepEquals(Draw.getAll().features[0].geometry.coordinates, [], 'and it is empty');

  Draw.changeMode('simple_select');
  t.equals(Draw.getMode(), 'simple_select', 'changed to simple_select');
  t.equals(Draw.getAll().features.length, 0, 'no features added');

  t.throws(() => {
    Draw.changeMode('direct_select');
  }, 'cannot enter direct_select mode with a featureId');

  t.end();
});

test('Draw.changeMode to select and de-select pre-existing features', t => {
  const [polygonId] = Draw.add(getGeoJSON('polygon'));
  const [lineId] = Draw.add(getGeoJSON('line'));
  const [pointId] = Draw.add(getGeoJSON('point'));

  const returnA = Draw.changeMode('simple_select', { featureIds: [polygonId, lineId]});
  t.equals(returnA, Draw, 'returns Draw instance');
  t.equals(Draw.getMode(), 'simple_select', 'changed to simple_select');
  t.deepEquals(Draw.getSelectedIds(), [polygonId, lineId],
    'polygon and line are selected');

  const returnB = Draw.changeMode('simple_select', { featureIds: [polygonId, lineId]});
  t.equals(returnB, Draw, 'returns Draw instance');
  t.deepEquals(Draw.getSelectedIds(), [polygonId, lineId],
    'polygon and line are still selected');

  const returnC = Draw.changeMode('simple_select', { featureIds: [pointId] });
  t.equals(returnC, Draw, 'returns Draw instance');
  afterNextRender(() => {
    t.pass('a render occurred when selection changed');

    t.deepEquals(Draw.getSelectedIds(), [pointId],
      'change to simple_select with different featureIds to change selection');

    const returnD = Draw.changeMode('direct_select', { featureId: polygonId });
    t.equals(returnD, Draw, 'returns Draw instance');
    t.deepEquals(Draw.getSelectedIds(), [polygonId],
      'change to direct_select changes selection');

    const returnE = Draw.changeMode('direct_select', { featureId: polygonId });
    t.equals(returnE, Draw, 'returns Draw instance');
    t.deepEquals(Draw.getSelectedIds(), [polygonId],
      'changing to direct_select with same selection does nothing');

    Draw.deleteAll();
    t.end();
  });
});

test('Draw.modes', t => {
  t.equal(Draw.modes.SIMPLE_SELECT, Constants.modes.SIMPLE_SELECT, 'simple_select');
  t.equal(Draw.modes.DIRECT_SELECT, Constants.modes.DIRECT_SELECT, 'direct_select');
  t.equal(Draw.modes.DRAW_POINT, Constants.modes.DRAW_POINT, 'draw_point');
  t.equal(Draw.modes.DRAW_LINE_STRING, Constants.modes.DRAW_LINE_STRING, 'draw_line_string');
  t.equal(Draw.modes.DRAW_POLYGON, Constants.modes.DRAW_POLYGON, 'draw_polygon');
  t.equal(Draw.modes.STATIC, Constants.modes.STATIC, 'static');
  t.equal(getPublicMemberKeys(Draw.modes).length, 6, 'no unexpected modes');
  t.end();
});

test('Cleanup', t => {
  Draw.deleteAll();
  Draw.remove();
  t.end();
});
