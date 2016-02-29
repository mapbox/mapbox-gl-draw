/* eslint no-shadow:[0] */
import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

mapboxgl.accessToken = accessToken;

var feature = features.point;

var map = createMap();

test('API test', t => {

  var Draw = GLDraw();
  map.addControl(Draw);

  t.test('clear', t => {
    Draw.add(feature);
    Draw.clear();
    t.equals(Draw.getAll().features.length, 0, 'Draw.clear removes all geometries');
    t.end();
  });

  t.test('startDrawing', t => {
    Draw.startDrawing(Draw.types.SQUARE);
    var featureCollection = Draw.getAll();
    t.equals(featureCollection.features[0].geometry.type, 'Polygon', 'Square');

    Draw.startDrawing(Draw.types.POLYGON);
    var featureCollection = Draw.getAll();
    t.equals(featureCollection.features[0].geometry.type, 'Polygon', 'Polygon');

    Draw.startDrawing(Draw.types.POINT);
    var featureCollection = Draw.getAll();
    t.equals(featureCollection.features[0].geometry.type, 'Point', 'Point');

    Draw.startDrawing(Draw.types.LINE);
    var featureCollection = Draw.getAll();
    t.equals(featureCollection.features[0].geometry.type, 'LineString', 'Line');

    Draw.clear();
    t.end();
  });

  t.test('add', t => {
    var id = Draw.add(feature);
    t.ok(id, 'valid string id returned on add');

    // set permanent feature
    id = Draw.add(feature, { permanent: true });
    Draw.select(id);
    t.equals(
      Draw._store.getSelectedIds().indexOf(id),
      -1,
      'permanent feature is not inserted into selected store when clicked'
    );

    // add featureCollection
    var anotherId = Draw.add(features.featureCollection);
    t.ok(anotherId, 'valid string id returned when adding a featureCollection');

    Draw.clear();
    t.end();
  });

  t.test('get', t => {
    var id = Draw.add(feature);
    var f = Draw.get(id);
    t.deepEquals(
      feature.geometry.coordinates,
      f.geometry.coordinates,
      'the geometry added is the same returned by Draw.get'
    );

    Draw.clear();
    t.end();
  });

  t.test('getAll', t => {
    Draw.add(feature);
    t.deepEquals(
      feature.geometry,
      Draw.getAll().features[0].geometry,
      'the geometry added is the same returned by Draw.getAll'
    );
    Draw.clear();
    t.end();
  });

  t.test('update', t => {
    var fff = JSON.parse(JSON.stringify(feature));
    var id = Draw.add(fff);
    fff.geometry.coordinates = [1, 1];
    Draw.update(id, fff);
    var f2 = Draw.get(id);
    t.deepEquals(
      fff.geometry,
      f2.geometry,
      'update updates the geometry and preservers the id'
    );
    Draw.clear();
    t.end();
  });

  t.test('select', t => {
    var id = Draw.add(feature);
    t.deepEquals(
      Draw.getSelected(),
      { features: [], type: 'FeatureCollection' },
      'no features selected');
    Draw.select(id);
    var selected = Draw.getSelected().features;
    t.equals(selected.length, 1, '1 feature selected');
    t.deepEquals(selected[0].geometry, feature.geometry);
    Draw.deselect(id);
    t.deepEquals(
      Draw.getSelected(),
      { features: [], type: 'FeatureCollection' },
      'no features selected');
    Draw.clear();
    t.end();
  });

  t.test('destroy', t => {
    var id = Draw.add(feature);
    Draw.destroy(id);
    t.equals(Draw.getAll().features.length, 0, 'can remove a feature by its id');
    t.end();
  });

});
