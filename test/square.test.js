import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

var feature = features.square;

mapboxgl.accessToken = accessToken;

var map = createMap();

map.on('load', () => {

  test('Square geometry class', t => {
    var Draw = GLDraw();
    map.addControl(Draw);

    Draw.startDrawing(Draw.types.SQUARE);

    let coords = feature.geometry.coordinates;

    let ne = map.project(mapboxgl.LngLat.convert(coords[0][0]));
    let sw = map.project(mapboxgl.LngLat.convert(coords[0][2]));

    map.fire('click', {
      lngLat: {
        lng: coords[0][0][0],
        lat: coords[0][0][1]
      }
    });

    map.fire('click', {
      lngLat: {
        lng: coords[0][2][0],
        lat: coords[0][2][1]
      }
    });

    var feats = Draw._store._features;
    var ids = Object.keys(feats);
    var square = feats[ids[0]];

    t.end();
  });

});
