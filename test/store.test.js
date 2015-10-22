var Store = require('../src/store');
var test = require('tape');
var mapboxgl = require('mapbox-gl');
var GLDraw = require('../');

mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q';

function createMap() {
  var div = document.createElement('div');
  div.setAttribute('id', 'map');
  document.body.appendChild(div);

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v8'
  });

  return map;
}

var feature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Point',
    coordinates: [0, 0]
  }
};

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

  // are the methods even there?
  t.equals(typeof store.get, 'function', 'get exists');
  t.equals(typeof store.getAllGeoJSON, 'function', 'getAllGeoJSON exists');
  t.equals(typeof store.clear, 'function', 'clear exists');
  t.equals(typeof store.unset, 'function', 'unset exists');
  t.equals(typeof store.set, 'function', 'set exists');
  t.equals(typeof store.edit, 'function', 'edit exists');
  t.equals(typeof store._render, 'function', '_render exists');

  // set
  var id = Draw.set(feature);
  var f = Draw.get(id, true);
  t.deepEquals(f.geometry, feature.geometry, 'you can set a feature');
  t.equals(typeof f.properties.drawId, 'string', 'the set feature gets a drawId');

  // get
  var storeFeat = store.get(f.properties.drawId);
  t.deepEqual(storeFeat.toGeoJSON().geometry, feature.geometry, 'get returns the same geometry you set');

  // unset
  store.unset(f.properties.drawId);
  t.equals(store.getAllGeoJSON().features.length, 0, 'calling unset removes the feature');

  // clear
  Draw.set(feature);
  store.clear();
  t.equals(store.getAllGeoJSON().features.length, 0, '0 features remaining after clearing the store the store');

  t.end();
});
