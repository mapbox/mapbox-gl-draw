import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
import { accessToken, createMap } from './utils';

mapboxgl.accessToken = accessToken;


var map = createMap();

map.on('load', () => {

  test('Polygon geometry class', t => {
    var Draw = GLDraw();
    map.addControl(Draw);

    t.end();
  });

});
