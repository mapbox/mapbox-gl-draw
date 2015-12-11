import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
//import Polygon from '../src/geometry/polygon';
import { accessToken, createMap } from './utils';

mapboxgl.accessToken = accessToken;


test('Polygon geometry class', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  t.end();
});
