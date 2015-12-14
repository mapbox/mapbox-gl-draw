import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

mapboxgl.accessToken = accessToken;

var feature = features.point;

test('Point geometry class', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  var id = Draw.set(feature);
  var Point = Draw._store.get(id);

  t.end();
});
