/* eslint no-shadow:[0] */
import test from 'tape';
import Store from '../src/store';
import Point from '../src/feature_types/point';
import mapboxgl from 'mapbox-gl-js-mock';
import { accessToken, createMap, features } from './utils';
import hat from 'hat';

var feature = JSON.parse(JSON.stringify(features.point));
feature.id = hat();

test('Store has correct properties', t => {
  t.ok(Store, 'store exists');
  t.ok(typeof Store === 'function', 'store is a function');
  t.end();
});

var map = createMap();

test('Store constructor', t => {

  var store = new Store({map: map});

  var f;

  t.test('set', t => {
    var id = store.add(new Point({store: store}, feature));
    f = store.get(id);
    t.deepEquals(f.coordinates, feature.geometry.coordinates, 'you can set a feature');
    t.end();
  });

  t.test('get', t => {
    var storeFeat = store.get(f.id);
    t.deepEqual(
      storeFeat.toGeoJSON().geometry, feature.geometry,
      'get returns the same geometry you set');
    t.end();
  });

  t.test('getAll', t => {
    var storeFeat = store.getAll();
    t.deepEqual(
      storeFeat[0].toGeoJSON().geometry, feature.geometry,
      'get returns the same geometry you set');
    t.end();
  });

  t.test('delete', t => {
    store.delete([f.id]);
    t.equals(store.getAll().length, 0, 'calling delete removes the feature');
    t.end();
  });

  t.end();
});
