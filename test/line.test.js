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

var map = createMap();

map.on('load', () => {

  test('Line draw class', t => {
    var Draw = GLDraw();
    map.addControl(Draw);

    //var l = new Line(map);

    t.end();
  });

});
