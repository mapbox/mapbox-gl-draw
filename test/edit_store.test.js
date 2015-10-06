var EditStore = require('../src/edit_store');
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

test('Edit store has correct properties', t => {
  t.ok(EditStore, 'edit store exists');
  t.equals(typeof EditStore, 'function', 'edit store is a function');
  t.end();
});

test('Edit store constructor', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  var editStore = new EditStore(map);

  // are they even there?
  t.equals(typeof editStore.get, 'function', 'get exists');
  t.equals(typeof editStore.clear, 'function', 'clear exists');
  t.equals(typeof editStore._addVertices, 'function', '_addVertices exists');
  t.equals(typeof editStore._addMidpoints, 'function', '_addMidpoints exists');
  t.equals(typeof editStore._render, 'function', 'render exists');

  Draw.set(feature);
  var id = Draw.getAll().features[0].properties.drawId;
  Draw._edit(id);

  t.deepEquals(
    Draw._editStore.getAllGeoJSON().features[0].geometry,
    feature.geometry,
    'the geometry in the store is the same as the one with which we initiated the store'
  );

  // getAll
  t.equals(
    Draw._editStore.getAllGeoJSON().type,
    'FeatureCollection',
    'getAllGeoJSON() returns a feature collection'
  );

  // get
  t.deepEquals(
    Draw._editStore.getGeoJSON(id).geometry,
    feature.geometry,
    'getGeoJSON returns the same geometry entered'
  );

  t.end();
});
