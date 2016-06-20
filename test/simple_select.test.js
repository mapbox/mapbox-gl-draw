import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import { click, drag, accessToken, createMap, features } from './test_utils';
import GLDraw from '../';
mapboxgl.accessToken = accessToken;

var map = createMap();

var Draw = GLDraw();
map.addControl(Draw);

test('Dragging feature creates valid feature without duplicate nodes', t => {
  Draw.deleteAll();
  Draw.add(features.square, true);
  Draw.changeMode('simple_select');
  console.log(JSON.stringify(Draw.getAll().features[0].geometry));
  click(map, {
    originalEvent: {
      isShiftKey: false,
      stopPropagation: function() {}
    },
    point: {x: 0, y:0},
    lngLat: {lng: 0, lat: 0}
  });

  drag(map, {
    originalEvent: {
        isShiftKey: false,
        stopPropagation: function() {}
      },
      point: {x: 0, y:0},
      lngLat: {lng: 0, lat: 0}
  }, {
    originalEvent: {
        isShiftKey: false,
        stopPropagation: function() {}
      },
      point: {x: 0, y:0},
      lngLat: {lng: 10, lat: 10}
  });
  console.log(JSON.stringify(Draw.getAll().features[0].geometry));
  t.end();

});