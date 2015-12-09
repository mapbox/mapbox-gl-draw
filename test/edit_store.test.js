/* eslint no-shadow:[0] */
import test from 'tape';
import EditStore from '../src/edit_store';
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

test('Edit store constructor', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  var editStore = new EditStore(map);

  // are they even there?
  t.ok(editStore.get instanceof Function, 'get is a function');
  t.ok(editStore.clear instanceof Function, 'clear is a function');
  t.ok(editStore._addVertices instanceof Function, '_addVertices is a function');
  t.ok(editStore._addMidpoints instanceof Function, '_addMidpoints is a function');
  t.ok(editStore._render instanceof Function, 'render is a function');

  var id = Draw.set(feature);
  Draw._edit(id);

  t.test('getAllGeoJSON', t => {
    t.deepEquals(
      Draw._editStore.getAllGeoJSON().features[0].geometry,
      feature.geometry,
      'the geometry in the store is the same as the one with which we initiated the store'
    );
    t.end();
  });

  t.test('getAll', t => {
    t.equals(
      Draw._editStore.getAllGeoJSON().type,
      'FeatureCollection',
      'getAllGeoJSON() returns a feature collection'
    );
    t.end();
  });

  t.test('get', t => {
    t.deepEquals(
      Draw._editStore.getGeoJSON(id).geometry,
      feature.geometry,
      'getGeoJSON returns the same geometry entered'
    );
    t.end();
  });

  t.end();
});
