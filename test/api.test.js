/* eslint no-shadow:[0] */
import test from 'tape';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import * as Constants from '../src/constants';
import MapboxDraw from '../index';
import createMap from './utils/create_map';
import getGeoJSON from './utils/get_geojson';
import setupAfterNextRender from './utils/after_next_render';
import getPublicMemberKeys from './utils/get_public_member_keys';

const map = createMap();
const afterNextRender = setupAfterNextRender(map);
const Draw = new MapboxDraw();
map.addControl(Draw);
const addSpy = spy(Draw, 'add');
const deleteSpy = spy(Draw, 'delete');

test('Draw.getFeatureIdsAt', (t) => {
  const feature = getGeoJSON('point');
  const [id] = Draw.add(feature);
  afterNextRender(() => {
    // These tests require the the pixel space
    // and lat/lng space are equal (1px = 1deg)
    const featureIds = Draw.getFeatureIdsAt({
      x: feature.geometry.coordinates[0],
      y: feature.geometry.coordinates[1]
    });

    t.equals(featureIds.length, 1, 'should return the added feature');
    t.equals(featureIds[0], id, 'selected feature should match desired feature');
    Draw.deleteAll();
    t.end();
  });
});

test('Draw.getSelectedIds', (t) => {
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

test('Draw.getSelected', (t) => {
  const [lineId] = Draw.add(getGeoJSON('line'));
  const [pointId] = Draw.add(getGeoJSON('point'));
  const [polygonId] = Draw.add(getGeoJSON('polygon'));
  Draw.changeMode('simple_select', { featureIds: [lineId, pointId] });
  const fc = Draw.getSelected();

  t.equal(typeof fc.features, 'object', 'we have a feature collection');

  const selected = fc.features.map(f => f.id);
  t.equal(selected.length, 2,
    'returns correct number of ids');
  t.notEqual(selected.indexOf(lineId), -1,
    'result contains line');
  t.notEqual(selected.indexOf(pointId), -1,
    'result contains point');
  Draw.changeMode('simple_select', { featureIds: [polygonId] });
  const nextSelected = Draw.getSelected().features.map(f => f.id);
  t.equal(nextSelected.length, 1,
    'updates length');
  t.equal(nextSelected[0], polygonId,
    'updates content');
  t.end();
});

test('Draw.set', (t) => {
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
  addSpy.resetHistory();
  deleteSpy.resetHistory();
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
  addSpy.resetHistory();
  deleteSpy.resetHistory();
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

test('Draw.set errors', (t) => {
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

test('Draw.add -- point', (t) => {
  const id = Draw.add(getGeoJSON('point'))[0];
  t.equals(typeof id, 'string', 'valid string id returned on add');
  Draw.deleteAll();
  t.end();
});

test('Draw.add -- FeatureCollection', (t) => {
  const listOfIds = Draw.add(getGeoJSON('featureCollection'));
  t.equals(listOfIds.length, getGeoJSON('featureCollection').features.length,
    'valid string id returned when adding a featureCollection');
  Draw.deleteAll();
  t.end();
});

test('Draw.add -- MultiPolygon', (t) => {
  const multiId = Draw.add(getGeoJSON('multiPolygon'))[0];
  t.equals('string', typeof multiId, 'accepts multi features');
  Draw.deleteAll();
  t.end();
});

test('Draw.add -- null geometry', (t) => {
  t.throws(() => {
    Draw.add(getGeoJSON('nullGeometry'));
  }, 'null geometry is invalid');
  t.end();
});

test('Draw.add -- GeometryCollection', (t) => {
  t.throws(() => {
    Draw.add(getGeoJSON('geometryCollection'));
  }, 'geometry collections are not valid in Draw');
  t.end();
});

test('Draw.add - accept lots of decimal percision', (t) => {
  for (let i = 0; i < 30; i++) {
    const div = Math.pow(10, i);
    const pos = [1 / div, 1 / div];
    const id = Draw.add({
      type: 'Point',
      coordinates: pos
    });
    const point = Draw.get(id);
    t.equals(point.geometry.coordinates[0], pos[0], `lng right at 10e${i}`);
    t.equals(point.geometry.coordinates[1], pos[1], `lat right at 10e${i}`);
  }
  Draw.deleteAll();
  t.end();
});

test('Draw.add -- change geometry type', (t) => {
  const id = Draw.add(getGeoJSON('point'))[0];
  const polygon = getGeoJSON('polygon');
  polygon.id = id;
  Draw.add(polygon);
  t.deepEquals(polygon, Draw.get(id), 'changed geometry type');
  Draw.deleteAll();
  t.end();
});

test('Draw.add -- existing feature with changed properties', (t) => {
  const id = Draw.add(getGeoJSON('point'));
  let point = Draw.get(id);

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

test('Draw.get', (t) => {
  const id = Draw.add(getGeoJSON('point'));
  const f = Draw.get(id);
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

test('Draw.getAll', (t) => {
  Draw.add(getGeoJSON('point'));
  t.deepEquals(
    getGeoJSON('point').geometry,
    Draw.getAll().features[0].geometry,
    'the geometry added is the same returned by Draw.getAll'
  );
  Draw.deleteAll();
  t.end();
});

test('Draw.delete one feature', (t) => {
  const id = Draw.add(getGeoJSON('point'))[0];
  const drawInstance = Draw.delete(id);
  t.equals(drawInstance, Draw, 'returns Draw instance');
  t.equals(Draw.getAll().features.length, 0, 'can remove a feature by its id');
  t.end();
});

test('Draw.delete multiple features', (t) => {
  const [pointId] = Draw.add(getGeoJSON('point'));
  const [lineId] = Draw.add(getGeoJSON('line'));
  Draw.add(getGeoJSON('polygon'));
  const drawInstance = Draw.delete([pointId, lineId]);
  t.equals(drawInstance, Draw, 'returns Draw instance');
  t.equals(Draw.getAll().features.length, 1, 'can remove multiple features by id');
  t.equals(Draw.getAll().features[0].geometry.type, 'Polygon',
    'the right features were removed');
  Draw.deleteAll();
  t.end();
});

test('Draw.delete a feature that is direct_selected', (t) => {
  const [id] = Draw.add(getGeoJSON('polygon'));
  Draw.changeMode('direct_select', { featureId: id });
  Draw.delete([id]);
  t.equals(Draw.getAll().features.length, 0, 'removed the feature');
  t.equals(Draw.getMode(), 'simple_select', 'changed modes to simple_select');
  t.end();
});

test('Draw.deleteAll', (t) => {
  Draw.add(getGeoJSON('point'));
  const drawInstance = Draw.deleteAll();
  t.equals(drawInstance, Draw, 'returns Draw instance');
  t.equals(Draw.getAll().features.length, 0, 'Draw.deleteAll removes all geometries');
  t.end();
});

test('Draw.deleteAll when in direct_select mode', (t) => {
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

test('Draw.changeMode and Draw.getMode with no pre-existing feature', (t) => {
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

test('Draw.changeMode to select and de-select pre-existing features', (t) => {
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

test('Draw.modes', (t) => {
  t.equal(Draw.modes.SIMPLE_SELECT, Constants.modes.SIMPLE_SELECT, 'simple_select');
  t.equal(Draw.modes.DIRECT_SELECT, Constants.modes.DIRECT_SELECT, 'direct_select');
  t.equal(Draw.modes.DRAW_POINT, Constants.modes.DRAW_POINT, 'draw_point');
  t.equal(Draw.modes.DRAW_LINE_STRING, Constants.modes.DRAW_LINE_STRING, 'draw_line_string');
  t.equal(Draw.modes.DRAW_POLYGON, Constants.modes.DRAW_POLYGON, 'draw_polygon');
  t.equal(Draw.modes.STATIC, Constants.modes.STATIC, 'static');
  t.equal(getPublicMemberKeys(Draw.modes).length, 6, 'no unexpected modes');
  t.end();
});

test('Draw.combineFeatures -- polygon + polygon = multiploygon', (t) => {
  const [polygonId] = Draw.add(getGeoJSON('polygon'));
  const [polygon2Id] = Draw.add(getGeoJSON('polygon2'));
  Draw.changeMode('simple_select', { featureIds: [polygonId, polygon2Id]});

  Draw.combineFeatures();
  t.equals(Draw.getAll().features.length, 1, 'can combine two features');
  t.equals(Draw.getAll().features[0].geometry.type, 'MultiPolygon', 'can combine two polygons into MultiPolygon');
  t.deepEquals(Draw.getAll().features[0].geometry.coordinates[0], getGeoJSON('polygon').geometry.coordinates, 'first set of coordinates in multipolygon matches with second polygon in selection');
  t.deepEquals(Draw.getAll().features[0].geometry.coordinates[1], getGeoJSON('polygon2').geometry.coordinates, 'second set of coordinates in multipolygon matches with first polygon in selection');
  Draw.deleteAll();
  t.end();
});

test('Draw.combineFeatures -- point + point = multipoint', (t) => {
  const [pointId] = Draw.add(getGeoJSON('point'));
  const [point2Id] = Draw.add(getGeoJSON('point2'));
  Draw.changeMode('simple_select', { featureIds: [pointId, point2Id]});

  Draw.combineFeatures();
  t.equals(Draw.getAll().features.length, 1, 'can combine two features');
  t.equals(Draw.getAll().features[0].geometry.type, 'MultiPoint', 'can combine two points into MultiPoint');
  t.deepEquals(Draw.getAll().features[0].geometry.coordinates[0], getGeoJSON('point').geometry.coordinates, 'first set of coordinates in multipoint matches with first point in selection');
  t.deepEquals(Draw.getAll().features[0].geometry.coordinates[1], getGeoJSON('point2').geometry.coordinates, 'second set of coordinates in multipoint matches with second point in selection');
  Draw.deleteAll();
  t.end();
});

test('Draw.combineFeatures -- linestring + linestring = multilinestring', (t) => {
  const [lineId] = Draw.add(getGeoJSON('line'));
  const [line2Id] = Draw.add(getGeoJSON('line2'));
  Draw.changeMode('simple_select', { featureIds: [lineId, line2Id]});

  Draw.combineFeatures();
  t.equals(Draw.getAll().features.length, 1, 'can combine two features');
  t.equals(Draw.getAll().features[0].geometry.type, 'MultiLineString', 'can combine two linestrings into MultiLineString');
  t.deepEquals(Draw.getAll().features[0].geometry.coordinates[0], getGeoJSON('line').geometry.coordinates, 'first set of coordinates in multilinestring matches with first line in selection');
  t.deepEquals(Draw.getAll().features[0].geometry.coordinates[1], getGeoJSON('line2').geometry.coordinates, 'second set of coordinates in multilinestring matches with second line selection');
  Draw.deleteAll();
  t.end();
});


test('Draw.combineFeatures -- point + multipoint = multipoint', (t) => {
  const [pointId] = Draw.add(getGeoJSON('point'));
  const [multipointId] = Draw.add(getGeoJSON('multiPoint'));
  Draw.changeMode('simple_select', { featureIds: [pointId, multipointId]});

  Draw.combineFeatures();
  t.equals(Draw.getAll().features.length, 1, 'can combine two features');
  t.equals(Draw.getAll().features[0].geometry.type, 'MultiPoint', 'can combine two points into MultiPoint');
  t.deepEquals(Draw.getAll().features[0].geometry.coordinates[0], getGeoJSON('point').geometry.coordinates, 'first set of coordinates in multipoint matches with first point in selection');
  t.deepEquals(Draw.getAll().features[0].geometry.coordinates[1], getGeoJSON('multiPoint').geometry.coordinates[0], 'second set of coordinates in multipoint matches with first set of coordinates in multipoint in selection');
  t.deepEquals(Draw.getAll().features[0].geometry.coordinates[2], getGeoJSON('multiPoint').geometry.coordinates[1], 'third set of coordinates in multipoint matches with second set of coordinates in multipoint in selection');
  Draw.deleteAll();
  t.end();
});

test('Draw.combineFeatures -- return on non-similar features', (t) => {
  const [lineId] = Draw.add(getGeoJSON('line'));
  const [polygonId] = Draw.add(getGeoJSON('polygon'));
  Draw.changeMode('simple_select', { featureIds: [lineId, polygonId]});

  Draw.combineFeatures();
  t.equals(Draw.getAll().features.length, 2, 'should not combine non similar features');
  Draw.deleteAll();
  t.end();
});

test('Draw.combineFeatures -- do nothing on non-similar features', (t) => {
  const [lineId] = Draw.add(getGeoJSON('line'));
  const [polygonId] = Draw.add(getGeoJSON('polygon'));
  Draw.changeMode('simple_select', { featureIds: [lineId, polygonId]});

  Draw.combineFeatures();
  t.equals(Draw.getAll().features.length, 2, 'should not combine non similar features');
  Draw.deleteAll();
  t.end();
});

test('Draw.combineFeatures -- work for multifeature + feature', (t) => {
  const [multipolygonId] = Draw.add(getGeoJSON('multiPolygon'));
  const [polygonId] = Draw.add(getGeoJSON('polygon'));
  Draw.changeMode('simple_select', { featureIds: [polygonId, multipolygonId]});

  Draw.combineFeatures();
  t.equals(Draw.getAll().features.length, 1, 'should work for multifeature + feature');
  Draw.deleteAll();
  t.end();
});

test('Draw.combineFeatures -- should do nothing if nothing is selected', (t) => {
  Draw.add(getGeoJSON('multiPolygon'));
  Draw.add(getGeoJSON('polygon'));
  Draw.changeMode('simple_select', {});

  Draw.combineFeatures();
  t.equals(Draw.getAll().features.length, 2, 'should do nothing if nothing is selected');
  Draw.deleteAll();
  t.end();
});

test('Draw.uncombineFeatures -- multilinestring', (t) => {
  const [multiLineStringId] = Draw.add(getGeoJSON('multiLineString'));
  Draw.changeMode('simple_select', { featureIds: [multiLineStringId]});

  Draw.uncombineFeatures();
  const featuresInDraw = Draw.getAll().features;

  t.equals(featuresInDraw.length, 2, 'can uncombine multiLineString');

  t.deepEquals(featuresInDraw[0].geometry.coordinates,
    getGeoJSON('multiLineString').geometry.coordinates[0],
    'first set of coordinates in multilinestring matches with first lineString in selection');

  t.deepEquals(featuresInDraw[1].geometry.coordinates,
    getGeoJSON('multiLineString').geometry.coordinates[1],
    'second set of coordinates in multilinestring matches with second lineString in selection');

  Draw.deleteAll();
  t.end();
});

test('Draw.uncombineFeatures -- multipolygon', (t) => {
  const [multipolygon2Id] = Draw.add(getGeoJSON('multiPolygon2'));
  Draw.changeMode('simple_select', { featureIds: [multipolygon2Id]});

  Draw.uncombineFeatures();

  const featuresInDraw = Draw.getAll().features;

  t.equals(featuresInDraw.length, 2, 'can uncombine multipolygon');

  t.deepEquals(featuresInDraw[0].geometry.coordinates,
    getGeoJSON('multiPolygon2').geometry.coordinates[0],
    'first set of coordinates in multipolygon matches with first polygon in selection');

  t.deepEquals(featuresInDraw[1].geometry.coordinates,
    getGeoJSON('multiPolygon2').geometry.coordinates[1],
    'second set of coordinates in multipolygon matches with second polygon in selection');

  Draw.deleteAll();
  t.end();
});

test('Draw.uncombineFeatures -- multipoint', (t) => {
  const [multipointId] = Draw.add(getGeoJSON('multiPoint'));
  Draw.changeMode('simple_select', { featureIds: [multipointId]});

  Draw.uncombineFeatures();

  const featuresInDraw = Draw.getAll().features;

  t.equals(featuresInDraw.length, 2, 'can uncombine multipoint');

  t.deepEquals(featuresInDraw[0].geometry.coordinates,
    getGeoJSON('multiPoint').geometry.coordinates[0],
    'first set of coordinates in multipoint matches with first point in selection');

  t.deepEquals(featuresInDraw[1].geometry.coordinates,
    getGeoJSON('multiPoint').geometry.coordinates[1],
    'second set of coordinates in multipoint matches with second point in selection');

  Draw.deleteAll();
  t.end();
});

test('Draw.uncombineFeatures -- should do nothing if nothing is selected', (t) => {
  Draw.add(getGeoJSON('multiPolygon'));
  Draw.add(getGeoJSON('polygon'));
  Draw.changeMode('simple_select', {});

  Draw.uncombineFeatures();
  t.equals(Draw.getAll().features.length, 2, 'should do nothing if nothing is selected');
  Draw.deleteAll();
  t.end();
});

test('Draw.uncombineFeatures -- should do nothing if nothing if only non multifeature is selected', (t) => {
  const [polygonId] = Draw.add(getGeoJSON('polygon'));
  const [pointId] = Draw.add(getGeoJSON('point'));
  Draw.changeMode('simple_select', { featureIds: [polygonId, pointId]});

  Draw.uncombineFeatures();
  t.equals(Draw.getAll().features.length, 2, 'should do nothing if nothing is selected');
  Draw.deleteAll();
  t.end();
});

test('Draw.setFeatureProperty', (t) => {
  Draw.add(getGeoJSON('point'));
  const featureId = Draw.getAll().features[0].id;
  const drawInstance = Draw.setFeatureProperty(featureId, 'price', 200);
  t.equals(drawInstance, Draw, 'returns Draw instance');
  t.equals(Draw.get(featureId).properties.price, 200, 'Draw.setFeatureProperty adds a property');
  t.end();
});

test('Cleanup', (t) => {
  Draw.deleteAll();
  Draw.onRemove();
  t.end();
});
