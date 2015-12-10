import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
//import Geometry from '../src/geometries/geometry';
import {
  accessToken, createMap
} from './utils';

mapboxgl.accessToken = accessToken;

test('Geometry class tests', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  t.end();
});
