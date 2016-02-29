import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

var feature = features.line;

mapboxgl.accessToken = accessToken;

var map = createMap();

test('Line draw class', function lineDrawClass(t){
  var Draw = GLDraw();
  map.addControl(Draw);

  Draw.startDrawing(Draw.types.LINE);

  let coords = feature.geometry.coordinates;

  for (var i = 0; i < coords.length; i++) {
    let c = coords[i];

    map.fire('click', {
      lngLat: {
        lng: c[0],
        lat: c[1]
      }
    });
  }

  // complete drawing
  map.fire('keyup', {
    keyCode: 13
  });

  t.end();
});
