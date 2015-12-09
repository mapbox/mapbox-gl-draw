import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';

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

test('Point draw class', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  var id = Draw.set(feature);
  var Point = Draw._store.get(id);

  // functions
  t.ok(Point.constructor instanceof Function, 'Point.constructor exists');
  t.ok(Point.startDraw instanceof Function, 'Point.startDraw exists');
  t.ok(Point._completeDraw instanceof Function, 'Point._completeDraw exists');

  t.ok(Point._map instanceof mapboxgl.Map, 'Point._map is an instance of mapboxgl.Map');

  t.end();
});
