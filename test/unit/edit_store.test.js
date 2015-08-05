var EditStore = require('../../src/edit_store');
var test = require('tape');
var mapboxgl = require('mapbox-gl');
var GLDraw = require('../../');

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

test('Edit store has correct properties', t => {
  t.ok(EditStore, 'edit store exists');
  t.equals(typeof EditStore, 'function', 'edit store is a function');
  t.end();
});

test('Edit store constructor', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  var editStore = new EditStore(map, [ feature ]);

  // are they even there?
  t.equals(typeof editStore.getAll, 'function', 'get exists');
  t.equals(typeof editStore.getById, 'function', 'getById exists');
  t.equals(typeof editStore.clear, 'function', 'clear exists');
  t.equals(typeof editStore.update, 'function', 'update exists');
  t.equals(typeof editStore._addVertices, 'function', '_addVertices exists');
  t.equals(typeof editStore._addMidpoints, 'function', '_addMidpoints exists');
  t.equals(typeof editStore.render, 'function', 'render exists');

  t.deepEquals(
    editStore.getAll().features[0].geometry,
    feature.geometry,
    'the geometry in the store is the same as the one with which we initiated the store'
  );

  // getAll
  t.equals(editStore.getAll().type, 'FeatureCollection', 'getAll() returns a feature collection');

  // getById
  var f = editStore.getAll().features[0];
  t.equals(
    editStore.getById(f.properties._drawid).geometry,
    feature.geometry,
    'getById returns the same geometry entered'
  );

  //update
  var newFeature = JSON.parse(JSON.stringify(f));
  newFeature.geometry.coordinates = [1, 1];
  editStore.update(newFeature);
  var id = newFeature.properties.id;
  t.deepEquals(editStore.getById(id).geometry.coordinates, [1, 1], 'updating geometry works');

  t.end();
});
