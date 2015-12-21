/* eslint no-shadow:[0] */
import test from 'tape';
import Store from '../src/store';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

mapboxgl.accessToken = accessToken;

var feature = features.point;

test('Store has correct properties', t => {
  t.ok(Store, 'store exists');
  t.ok(typeof Store === 'function', 'store is a function');
  t.end();
});

test('Store constructor', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  var store = Draw._store;

  var f;

  t.test('set', t => {
    var id = Draw.add(feature);
    f = Draw.get(id, true);
    t.deepEquals(f.geometry, feature.geometry, 'you can set a feature');
    t.equals(typeof f.id, 'string', 'the set feature gets a drawId');
    t.end();
  });

  t.test('get', t => {
    var storeFeat = store.get(f.id);
    t.deepEqual(
      storeFeat.toGeoJSON().geometry, feature.geometry,
      'get returns the same geometry you set');
    t.end();
  });

  t.test('getAllIds', t => {
    t.deepEqual(
      store.getAllIds(), [ f.id ],
      'getAllIds returns an array of drawIds');
    t.end();
  });

  t.test('select', t => {
    t.deepEqual(
      store.getSelectedIds(), [],
      'getSelectedIds is empty');
    store.select(f.id);
    t.deepEqual(
      store.getSelectedIds(), [ f.id ],
      'getSelectedIds includes selected drawId');
    t.end();
  });

  t.test('delete', t => {
    store.delete(f.id);
    t.equals(store.getAllIds().length, 0, 'calling delete removes the feature');
    t.end();
  });

  t.test('clear', t => {
    Draw.add(feature);
    store.deleteAll();
    t.equals(store.getAllIds().length, 0, '0 features remaining after clearing the store the store');
    t.end();
  });

  t.end();
});
