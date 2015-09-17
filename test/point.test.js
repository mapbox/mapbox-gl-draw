var test = require('tape');
var mapboxgl = require('mapbox-gl');
var GLDraw = require('../');
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

  var id = Draw.set(feature);
  var Point = Draw._store.get(id);

  // functions
  t.equals(typeof Point.constructor, 'function', 'Point.constructor exists');
  t.equals(typeof Point.startDraw, 'function', 'Point.startDraw exists');
  t.equals(typeof Point._completeDraw, 'function', 'Point._completeDraw exists');

  // event listeners
  t.equals(typeof Point.completeDraw, 'function', 'Point.completeDraw event listener exists');

  t.ok(Point._map instanceof mapboxgl.Map, 'Point._map is an instance of mapboxgl.Map');

  // data
  t.ok(Point.coordinates instanceof Immutable.List, 'Point.coordinates is an Immutable.List');

  t.end();
});
