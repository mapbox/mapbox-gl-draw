import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
//import Square from '../src/geometry/square';
import { accessToken, createMap } from './utils';

mapboxgl.accessToken = accessToken;


test('Square geometry class', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  t.end();
});
