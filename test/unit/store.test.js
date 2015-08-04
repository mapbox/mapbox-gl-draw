var Store = require('../../src/store');
var test = require('tape');
var mapboxgl = require('mapbox-gl');
var GLDraw = require('../../');

mapboxgl.accessToken = 'pk.eyJ1Ijoia2VsdmluYWJyb2t3YSIsImEiOiJkcUF1TWlVIn0.YzBtz0O019DJGk3IpFi72g';

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

test('Store has correct properties', t => {
  t.ok(Store, 'store exists');
  t.ok(typeof Store === 'function', 'store is a function');
  t.end();
});

test('Store constructor', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);
  /*
  var store = new Store([]);
  t.equals(store.historyIndex, 0, 'historyIndex starts at zero');

  t.ok(store.history, 'history exists');
  t.equals(store.history.length, 1, 'history has one element');
  t.ok(store.history[0] instanceof Immutable.List, 'history has a list');
  t.equals(store.history[0].count(), 0, 'history\'s list is empty');

  t.ok(store.annotations, 'annotations exists');
  t.ok(store.annotations instanceof Immutable.List, 'annotations has a list');
  t.equals(store.annotations.size, 0, 'annotations list is empty');

  t.ok(typeof store.operation === 'function', 'operation exists');
  t.ok(typeof store.getAll === 'function', 'getAll exists');
  t.ok(typeof store.clear === 'function', 'clear exists');
  t.ok(typeof store.get === 'function', 'get exists');
  t.ok(typeof store.set === 'function', 'set exists');
  t.ok(typeof store.redo === 'function', 'redo exists');
  t.ok(typeof store.undo === 'function', 'undo exists');

  t.end();
});

test('Store constructor with data', t => {
  var polygonGeoJSON = [{
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [1,1],
          [1,2],
          [2,1],
          [1,1]
        ]
      ]
    }
  }];
  var store = new Store(polygonGeoJSON);

  t.equals(store.history.length, 1, 'history has one element');
  t.ok(store.history[0].get(0) instanceof Immutable.Map, 'history has a map');
  t.ok(store.history[0].get(0).get('properties')._drawid, 'the item has been given an id');
  */
  t.end();
});
