import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

mapboxgl.accessToken = accessToken;

var feature = features.point;

var map = createMap();

map.on('load', () => {

  test('Point geometry class', t => {
    var Draw = GLDraw();
    map.addControl(Draw);

    var id = Draw.add(feature);
    var point = Draw._store.get(id);

    console.log(point);

    t.end();
  });

});
