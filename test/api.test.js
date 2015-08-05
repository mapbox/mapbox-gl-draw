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
    style: 'https://www.mapbox.com/mapbox-gl-styles/styles/mapbox-streets-v7.json'
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
  Draw.addGeometry(feature);
  var f = Draw.getAll().features[0];
  t.deepEquals(f.geometry, feature.geometry, 'the geometry added is the same returned by Draw.getAll');
  t.deepEquals(
    feature.geometry,
    Draw.get(f.properties._drawid).geometry,
    'the geomtry added is the same returned by Draw.get(itsDrawId)'
  );

  Draw.clear();
  t.equals(Draw.getAll().features.length, 0, 'Draw.clear removes all geometries');

  Draw.clearAll();
  t.equals(Draw.options.geoJSON.historyIndex, 0, 'Draw.clearAll resets the history index to 0');

  Draw.addGeometry(feature);
  f = Draw.getAll().features[0];
  Draw.removeGeometry(f.properties._drawid);
  t.equals(Draw.getAll().features.length, 0, 'can remove a feature by its id');

  t.end();
});
