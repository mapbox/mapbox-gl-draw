import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
//import Geometry from '../src/geometries/geometry';
import { accessToken, createMap } from './utils';

mapboxgl.accessToken = accessToken;

var map = createMap();

map.on('load', () => {

  test('Geometry class tests', t => {
    var Draw = GLDraw();
    map.addControl(Draw);

    t.end();
  });

});
