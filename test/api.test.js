/* eslint no-shadow:[0] */
import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

mapboxgl.accessToken = accessToken;

var feature = features.point;

var map = createMap();

map.on('load', () => {

  test('API test', t => {

    var Draw = GLDraw();
    map.addControl(Draw);

    var id;

    t.test('add', t => {
      id = Draw.add(feature);
      t.ok(id, 'valid string id returned on set');

      // set permanent feature
      id = Draw.add(feature, { permanent: true });
      var point = map.project(new mapboxgl.LngLat(...feature.geometry.coordinates));
      map.fire('click', { point });
      t.equals(
        Draw._store.getSelectedIds().indexOf(id),
        -1,
        'permanent feature is not inserted into selected store when clicked'
      );

      t.end();
    });

    t.test('get', t => {
      var f = Draw.get(id);
      t.deepEquals(
        feature.geometry.coordinates,
        f.geometry.coordinates,
        'the geometry added is the same returned by Draw.get'
      );
      t.end();
    });

    t.test('getAll', t => {
      t.deepEquals(
        feature.geometry,
        Draw.getAll().features[0].geometry,
        'the geometry added is the same returned by Draw.getAll'
      );
      t.end();
    });

    t.test('update', t => {
      feature.geometry.coordinates = [1, 1];
      Draw.update(id, feature);
      var f2 = Draw.get(id);
      t.deepEquals(
        feature.geometry,
        f2.geometry,
        'update updates the geometry and preservers the id'
      );
      t.end();
    });

    t.test('select', t => {
      t.deepEquals(
        Draw.getSelected(),
        { features: [], type: 'FeatureCollection' },
        'no features selected');
      Draw.select(id);
      t.deepEquals(
        Draw.getSelected(),
        { features: [
          { geometry: { coordinates: [ 1, 1 ], type: 'Point' }, id, properties: {}, type: 'Feature' }
        ], type: 'FeatureCollection' },
        '1 feature selected');
      Draw.deselect(id);
      t.deepEquals(
        Draw.getSelected(),
        { features: [], type: 'FeatureCollection' },
        'no features selected');
      t.end();
    });

    t.test('clear', t => {
      Draw.clear();
      t.equals(Draw.getAll().features.length, 0, 'Draw.clear removes all geometries');
      t.end();
    });

    t.test('destroy', t => {
      id = Draw.add(feature);
      Draw.destroy(id);
      t.equals(Draw.getAll().features.length, 0, 'can remove a feature by its id');
      t.end();
    });

    t.end();

  });

});
