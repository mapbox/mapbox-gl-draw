/* eslint no-shadow:[0] */
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
  geometry: {
    type: 'Point',
    coordinates: [5, 5]
  }
};

test('API test', t => {

  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  var id;

  t.test('set', t => {
    id = Draw.set(feature);
    t.ok(id, 'valid string id returned on set');

    // set permanent feature
    id = Draw.set(feature, { permanent: true });
    var point = map.project(new mapboxgl.LngLat(...feature.geometry.coordinates));
    map.fire('click', { point });
    t.equals(
      Draw._editStore.getDrawIds().indexOf(id),
      -1,
      'permanent feature is not inserted into edit store when clicked'
    );

    t.end();
  });

  t.test('get', t => {
    var f = Draw.get(id);
    t.deepEquals(
      feature.geometry.coordinates,
      f.geometry.coordinates,
      'the geometry added is the same returned by Draw.get'
    );
    t.end();
  });

  t.test('getAll', t => {
    t.deepEquals(
      feature.geometry,
      Draw.getAll().features[0].geometry,
      'the geometry added is the same returned by Draw.getAll'
    );
    t.end();
  });

  t.test('update', t => {
    feature.geometry.coordinates = [1, 1];
    Draw.update(id, feature);
    var f2 = Draw.get(id);
    t.deepEquals(
      feature.geometry,
      f2.geometry,
      'update updates the geometry and preservers the id'
    );
    t.end();
  });

  t.test('clear', t => {
    Draw.clear();
    t.equals(Draw.getAll().features.length, 0, 'Draw.clear removes all geometries');
    t.end();
  });

  t.test('remove', t => {
    id = Draw.set(feature);
    Draw.remove(id);
    t.equals(Draw.getAll().features.length, 0, 'can remove a feature by its id');
    t.end();
  });

  t.end();

});
