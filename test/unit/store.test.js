var Store = require('../../src/store');
var test = require('tape');
var mapboxgl = require('mapbox-gl');
var GLDraw = require('../../');
var Immutable = require('immutable');

mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q';

function createMap() {
  var div = document.createElement('div');
  div.setAttribute('id', 'map');
  document.body.appendChild(div);

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'https://www.mapbox.com/mapbox-gl-styles/styles/mapbox-streets-v7.json'
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

  var store = Draw.options.geoJSON;

  t.equals(store.historyIndex, 0, 'historyIndex starts at zero');
  t.ok(store.history, 'history exists');
  t.equals(store.history.length, 1, 'history has one element');
  t.ok(store.history[0] instanceof Immutable.List, 'history has a list');
  t.equals(store.history[0].count(), 0, 'history\'s list is empty');

  t.ok(store.annotations, 'annotations exists');
  t.ok(store.annotations instanceof Immutable.List, 'annotations has a list');
  t.equals(store.annotations.size, 0, 'annotations list is empty');

  // are the methods even there?
  t.equals(typeof store.operation, 'function', 'operation exists');
  t.equals(typeof store.getAll, 'function', 'getAll exists');
  t.equals(typeof store.get, 'function', 'get exists');
  t.equals(typeof store.clear, 'function', 'clear exists');
  t.equals(typeof store.clearAll, 'function', 'clearAll exists');
  t.equals(typeof store.unset, 'function', 'unset exists');
  t.equals(typeof store.set, 'function', 'set exists');
  t.equals(typeof store.edit, 'function', 'edit exists');
  t.equals(typeof store.render, 'function', 'render exists');
  t.equals(typeof store.redo, 'function', 'redo exists');
  t.equals(typeof store.undo, 'function', 'undo exists');

  t.deepEquals(store.getAll(), {
    type: 'FeatureCollection',
    features: []
  }, 'history initiates with an empty feature collection');

  // set
  store.set(feature);
  var f = store.getAll().features[0];
  t.deepEquals(f.geometry, feature.geometry, 'you can set a feature');
  t.equals(typeof f.properties._drawid, 'string', 'the set feature gets a drawid');

  // get
  var storeFeat = store.get(f.properties._drawid);
  t.deepEqual(storeFeat.geometry, feature.geometry, 'get returns the same geometry you set');

  // unset
  store.unset(f.properties._drawid);
  t.equals(store.getAll().features.length, 0, 'calling unset removes the feature');

  // clear
  store.set(feature);
  store.clear();
  t.equals(store.getAll().features.length, 0, '0 features remaining after clearing the store the store');

  t.end();
});

test('Store constructor with data', t => {
  var map = createMap();
  var Draw = GLDraw({ geoJSON: [feature] });
  map.addControl(Draw);

  var store = Draw.options.geoJSON;

  var f = store.getAll().features[0];
  t.ok(typeof f.properties._drawid === 'string', 'initiating store with data assigns ids to entries');
  t.deepEquals(f.geometry, feature.geometry, 'the feature in the store is the same as the one set');

  t.end();
});
