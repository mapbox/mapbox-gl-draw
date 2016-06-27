/* eslint no-shadow:[0] */
import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import createMap from './utils/create_map';
import getGeoJSON from './utils/get_geojson';
import AfterNextRender from './utils/after_next_render';

var feature = getGeoJSON('point');

test('API test', t => {

  var map = createMap();
  var afterNextRender = AfterNextRender(map);
  var Draw = GLDraw();
  map.addControl(Draw);

  test('init map', t => {
    if(map.loaded()) {
      t.end();
    }
    else {
      map.once('load', () => t.end());
    }
  });

  t.test('getFeatureIdsAt', t => {
    var id = Draw.add(feature)[0];
    afterNextRender(() => {
      // These tests require the the pixel space
      // and lat/lng space are equal (1px = 1deg)
      var featureIds = Draw.getFeatureIdsAt({
        x: feature.geometry.coordinates[0],
        y: feature.geometry.coordinates[1],
      });

      t.equals(featureIds.length, 1, 'should have selected the feature');
      t.equals(featureIds[0], id, 'selected feature should match desired feature');
      Draw.deleteAll();
      t.end();
    });
  })

  t.test('deleteAll', t => {
    Draw.add(getGeoJSON('point'));
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
    var id = Draw.add(getGeoJSON('point'))[0];
    t.equals(typeof id, 'string', 'valid string id returned on add');

    // add featureCollection
    var listOfIds = Draw.add(getGeoJSON('featureCollection'));
    t.equals(listOfIds.length, getGeoJSON('featureCollection').features.length,
      'valid string id returned when adding a featureCollection');
    Draw.deleteAll();

    var multiId = Draw.add(getGeoJSON('multiPolygon'))[0];
    t.equals('string', typeof multiId, 'accepts multi features');

    t.end();
  });

  t.test('add will error when handed non-geojson', t => {
    t.throws(function() {
      Draw.add({});
    }, 'when an empty object is passed');

    t.end();
  });

  t.test('add existing feature with changed properties', t => {
    var id = Draw.add(getGeoJSON('point'));
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
    var id = Draw.add(getGeoJSON('point'));
    var f = Draw.get(id);
    t.deepEquals(
      getGeoJSON('point').geometry.coordinates,
      f.geometry.coordinates,
      'the geometry added is the same returned by Draw.get'
    );

    Draw.deleteAll();
    t.end();
  });

  t.test('getAll', t => {
    Draw.add(getGeoJSON('point'));
    t.deepEquals(
      getGeoJSON('point').geometry,
      Draw.getAll().features[0].geometry,
      'the geometry added is the same returned by Draw.getAll'
    );
    Draw.deleteAll();
    t.end();
  });

  t.test('delete', t => {
    var id = Draw.add(getGeoJSON('point'))[0];
    Draw.delete(id);
    t.equals(Draw.getAll().features.length, 0, 'can remove a feature by its id');
    t.end();
  });


  t.test('done', t => {
    Draw.remove();
    t.end();
  });

});
