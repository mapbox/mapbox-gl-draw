import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
import { accessToken, createMap } from './utils';

mapboxgl.accessToken = accessToken;

var map = createMap();

map.on('load', () => {

  test('Point geometry class', t => {
    var Draw = GLDraw();
    map.addControl(Draw);

    Draw.startDrawing(Draw.types.POINT);
    map.fire('click', {
      lngLat: {
        lng: 10,
        lat: 10
      }
    });

    var feats = Draw._store._features;
    var ids = Object.keys(feats);
    t.deepEquals(feats[ids[0]].coordinates, [10, 10]);

    t.end();
  });

});
