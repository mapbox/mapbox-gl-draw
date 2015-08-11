var test = require('tape');
var mapboxgl = require('mapbox-gl');
var GLDraw = require('../');
var Store = require('../src/store');
var EditStore = require('../src/edit_store');
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

test('Point draw class', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  Draw.addGeometry(feature);
  var f = Draw.getAll().features[0];
  Draw._edit(f);
  var Point = Draw._control;

  // functions
  t.equals(typeof Point.constructor, 'function', 'Point.constructor exists');
  t.equals(typeof Point.startDraw, 'function', 'Point.startDraw exists');
  t.equals(typeof Point._completeDraw, 'function', 'Point._completeDraw exists');

  // event listeners
  t.equals(typeof Point.completeDraw, 'function', 'Point.completeDraw event listener exists');

  t.ok(Point._map instanceof mapboxgl.Map, 'Point._map is an instance of mapboxgl.Map');
  t.ok(Point.drawStore instanceof Store, 'Point.drawStore is an instance of the store class');
  t.ok(Point.store instanceof EditStore, 'Point.store is an isntance of the edit store class');

  // data
  t.ok(Point.coordinates instanceof Immutable.List, 'Point.coordinates is an Immutable.List');
  t.ok(Point.feature instanceof Immutable.Map, 'Point.feature is an Immutable.Map');
  t.ok(Point.feature.get('properties').get('drawId'), 'the feature has a drawId');

  t.end();
});
