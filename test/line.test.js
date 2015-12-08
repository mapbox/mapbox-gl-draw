var test = require('tape');
var mapboxgl = require('mapbox-gl');
var GLDraw = require('../');
var Line = require('../src/geometries/line');

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

/*
var feature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: [[0, 0], [1, 1]]
  }
};
*/

test('Line draw class', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  var l = new Line(map);

  // methods
  t.equals(typeof l.constructor, 'function', 'Line.constructor exists');
  t.equals(typeof l.startDraw, 'function', 'Line.startDraw exists');
  t.equals(typeof l._addPoint, 'function', 'Line._addPoint exists');
  t.equals(typeof l._onMouseMove, 'function', 'Line._onMouseMove exists');
  t.equals(typeof l._completeDraw, 'function', 'Line._completeDraw exists');
  t.equals(typeof l.moveVertex, 'function', 'Line.moveVertex exists');
  t.equals(typeof l.editAddVertex, 'function', 'Line.editAddVertex exists');

  t.end();
});
