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
  geometry: {
    type: 'Point',
    coordinates: [0, 0]
  }
};

test('API test', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  // API tests
  var id = Draw.set(feature);
  var f = Draw.get(id);
  t.deepEquals(
    feature.geometry.coordinates,
    f.geometry.coordinates,
    'the geometry added is the same returned by Draw.getAll'
  );
  t.deepEquals(
    feature.geometry,
    Draw.get(f.properties.drawId).geometry,
    'the geometry added is the same returned by Draw.get(itsDrawId)'
  );

  Draw.clear();
  t.equals(Draw.getAll().features.length, 0, 'Draw.clear removes all geometries');

  id = Draw.set(feature);
  f = Draw.get(id);
  Draw.remove(f.properties.drawId);
  t.equals(Draw.getAll().features.length, 0, 'can remove a feature by its id');

  t.end();
});
