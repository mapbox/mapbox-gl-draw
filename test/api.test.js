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

  t.test('deleteAll', t => {
    Draw.add(feature);
    Draw.deleteAll();
    t.equals(Draw.getAll().features.length, 0, 'Draw.deleteAll removes all geometries');
    t.end();
  });

  t.test('changeMode', t => {

    Draw.changeMode('draw_'+Draw.types.POLYGON);
    var featureCollection = Draw.getAll();
    t.equals(featureCollection.features[0].geometry.type, 'Polygon', 'Polygon');

    Draw.changeMode('draw_'+Draw.types.POINT);
    var featureCollection = Draw.getAll();
    t.equals(featureCollection.features[0].geometry.type, 'Point', 'Point');

    Draw.changeMode('draw_'+Draw.types.LINE);
    var featureCollection = Draw.getAll();
    t.equals(featureCollection.features[0].geometry.type, 'LineString', 'Line');
    Draw.deleteAll();

    t.end();
  });

  t.test('add', t => {
    var id = Draw.add(feature);
    t.equals(typeof id, 'string', 'valid string id returned on add');

    // add featureCollection
    var listOfIds = Draw.add(features.featureCollection);
    t.equals(listOfIds.length, features.featureCollection.features.length,
      'valid string id returned when adding a featureCollection');

    Draw.deleteAll();
    t.end();
  });

  t.test('add exhisting feature with changed properties', t => {
    var id = Draw.add(feature);
    var point = Draw.get(id);

    setTimeout(function() {
      point.properties = {'testing': 123};
      Draw.add(point);
      point = Draw.get(id);
      t.equals('testing', Object.keys(point.properties)[0]);
      t.equals(123, point.properties.testing);
      Draw.deleteAll();
      t.end();
    }, 32);
  });

  t.test('get', t => {
    var id = Draw.add(feature);
    var f = Draw.get(id);
    t.deepEquals(
      feature.geometry.coordinates,
      f.geometry.coordinates,
      'the geometry added is the same returned by Draw.get'
    );

    Draw.deleteAll();
    t.end();
  });

  t.test('getAll', t => {
    Draw.add(feature);
    t.deepEquals(
      feature.geometry,
      Draw.getAll().features[0].geometry,
      'the geometry added is the same returned by Draw.getAll'
    );
    Draw.deleteAll();
    t.end();
  });

  t.test('delete', t => {
    var id = Draw.add(feature);
    Draw.delete(id);
    t.equals(Draw.getAll().features.length, 0, 'can remove a feature by its id');
    t.end();
  });


  t.test('done', t => {
    Draw.remove();
    t.end();
  });

});
