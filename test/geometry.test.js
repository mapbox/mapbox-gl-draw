import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
//import Geometry from '../src/geometries/geometry';
import { accessToken, createMap } from './utils';

mapboxgl.accessToken = accessToken;

var map = createMap();

test('Geometry class tests', t => {
  var Draw = GLDraw();
  map.addControl(Draw);

  Draw.remove();
  t.end();
});
