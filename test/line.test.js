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
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: [[0, 0], [1, 1]]
  }
};

test('Line draw class', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  var id = Draw.set(feature);
  var Line = Draw._store.get(id);

  // methods
  t.equals(typeof Line.constructor, 'function', 'Line.constructor exists');

  t.end();
});
