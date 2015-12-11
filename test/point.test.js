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

  // functions
  t.ok(Point.constructor instanceof Function, 'Point.constructor exists');
  t.ok(Point.startDraw instanceof Function, 'Point.startDraw exists');
  t.ok(Point._completeDraw instanceof Function, 'Point._completeDraw exists');

  t.ok(Point._map instanceof mapboxgl.Map, 'Point._map is an instance of mapboxgl.Map');

  t.end();
});
