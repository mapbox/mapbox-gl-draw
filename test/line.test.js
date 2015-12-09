import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
import Line from '../src/geometries/line';

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
    type: 'lString',
    coordinates: [[0, 0], [1, 1]]
  }
};
*/

test('l draw class', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  var l = new Line(map);

  t.ok(l.constructor instanceof Function, 'l.constructor exists');
  t.ok(l.startDraw instanceof Function, 'l.startDraw exists');
  t.ok(l._addPoint instanceof Function, 'Line._addPoint exists');
  t.ok(l._onMouseMove instanceof Function, 'Line._onMouseMove exists');
  t.ok(l._completeDraw instanceof Function, 'Line._completeDraw exists');
  t.ok(l.moveVertex instanceof Function, 'Line.moveVertex exists');
  t.ok(l.editAddVertex instanceof Function, 'Line.editAddVertex exists');

  t.end();
});
