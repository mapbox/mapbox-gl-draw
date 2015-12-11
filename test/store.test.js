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

  t.ok(store.get instanceof Function, 'get exists');
  t.ok(store.getAllGeoJSON instanceof Function, 'getAllGeoJSON exists');
  t.ok(store.clear instanceof Function, 'clear exists');
  t.ok(store.unset instanceof Function, 'unset exists');
  t.ok(store.set instanceof Function, 'set exists');
  t.ok(store.edit instanceof Function, 'edit exists');
  t.ok(store._render instanceof Function, '_render exists');

  var f;

  t.test('set', t => {
    var id = Draw.set(feature);
    f = Draw.get(id, true);
    console.log(feature);
    t.deepEquals(f.geometry, feature.geometry, 'you can set a feature');
    t.equals(typeof f.properties.drawId, 'string', 'the set feature gets a drawId');
    t.end();
  });

  t.test('get', t => {
    var storeFeat = store.get(f.properties.drawId);
    t.deepEqual(
        storeFeat.toGeoJSON().geometry, feature.geometry,
        'get returns the same geometry you set');
    t.end();
  });

  t.test('unset', t => {
    store.unset(f.properties.drawId);
    t.equals(store.getAllGeoJSON().features.length, 0, 'calling unset removes the feature');
    t.end();
  });

  t.test('clear', t => {
    Draw.set(feature);
    store.clear();
    t.equals(store.getAllGeoJSON().features.length, 0, '0 features remaining after clearing the store the store');
    t.end();
  });

  t.end();
});
